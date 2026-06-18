# Dependabot & Actions 자동 동작 안내

> 내가 올리지 않은 PR이 쌓이고 Actions가 "멋대로" 도는 것처럼 보이는 현상에 대한 설명.

## TL;DR

- **이상 동작이 아니다.** 직접 설정해 둔 자동화가 정상 작동 중인 것이다.
- 올라온 PR(#2~#8)은 전부 **Dependabot**(GitHub의 의존성 자동 업데이트 봇)이 만든 것.
- Actions가 "저절로" 도는 것은 ① Dependabot PR마다 `CI & Deploy` 워크플로가 돌고,
  ② Dependabot 서비스 자체의 내부 잡이 Actions 탭에 표시되기 때문이다.

---

## 1. 올라온 PR의 정체 — Dependabot

[Dependabot](https://docs.github.com/en/code-security/dependabot)은 GitHub이 제공하는
봇으로, 의존성에 새 버전이 나오면 **자동으로 버전 업 PR을 만들어 준다.** 이 저장소는
`.github/dependabot.yml`에서 이 기능을 켜 두었다(`8608644 chore: CI/CD 파이프라인 도입`
커밋에서 추가됨):

```yaml
version: 2
updates:
  - package-ecosystem: npm # package.json 의존성
    directory: "/"
    schedule:
      interval: weekly # 매주 검사
  - package-ecosystem: github-actions # 워크플로의 actions/* 버전
    directory: "/"
    schedule:
      interval: weekly
```

그래서 **매주** npm 패키지와 GitHub Actions 버전을 확인하고, 업데이트가 있으면
`dependabot/...` 브랜치에 PR을 올린다. 작성자가 `app/dependabot` 봇이라 "내가 안 올린 PR"로
보이는 것이다.

현재 열린 Dependabot PR:

| #   | 내용                                                | 종류           |
| --- | --------------------------------------------------- | -------------- |
| 8   | `lint-staged` 16.4.0 → 17.0.7                       | npm (dev)      |
| 7   | `@types/node` 22.19.21 → 25.9.3                     | npm (dev)      |
| 6   | `actions/upload-artifact` 4 → 7                     | github-actions |
| 5   | `actions/cache` 4 → 5                               | github-actions |
| 4   | `react` 19.2.0 → 19.2.7                             | npm            |
| 3   | `react-dom` 19.2.0 → 19.2.7 **(CI 실패, 4번 참조)** | npm            |
| 2   | `typescript` 5.9.3 → 6.0.3                          | npm (dev)      |

---

## 2. Actions가 자동으로 도는 이유

Actions 탭에는 **성격이 다른 두 종류**가 섞여 나온다. 이걸 같은 것으로 오해하면 "워크플로가
멋대로 돈다"고 느끼게 된다.

### (a) `CI & Deploy` — 우리 워크플로 (`.github/workflows/deploy.yml`)

이 워크플로는 다음 두 경우에 돈다:

```yaml
on:
  push:
    branches: [main] # main에 푸시 → 빌드 후 GitHub Pages 배포
  pull_request:
    branches: [main] # main 대상 PR → 품질 게이트만 (배포 X)
```

**Dependabot이 만든 PR도 결국 `main` 대상 PR**이므로, PR이 열리거나 갱신될 때마다 이
워크플로가 자동 실행된다. 이건 의도된 동작이다 — 의존성 업데이트가 lint/type-check/format/
E2E/build를 깨뜨리지 않는지 머지 전에 검증해 준다.

- **PR일 때**: `quality` + `e2e` + `build`(검증만) 실행. **배포는 하지 않는다.**
- **main push일 때**: 위 검사 통과 시 `build` → `deploy`(GitHub Pages).

### (b) `... Update #...` (event: `dynamic`) — Dependabot 서비스 내부 잡

Actions 목록에 `npm_and_yarn in / for react - Update #1420703981` 같은 이름으로 보이는
항목이 있다. 이건 **우리 워크플로 파일이 아니다.** Dependabot 서비스가 의존성을 조사하고
PR을 만드는 자기 작업을, GitHub이 Actions 탭에 함께 표시하는 것뿐이다. 우리가 끄거나 고칠
대상이 아니며, `dependabot.yml`을 끄면 같이 사라진다.

---

## 3. react-dom PR(#3)이 계속 실패하는 이유

PR #3의 `CI & Deploy`가 `Install dependencies`(`npm ci`) 단계에서 `ERESOLVE`로 실패한다:

```
npm error While resolving: react-dom@19.2.7
npm error Found: react@19.2.0
npm error Could not resolve dependency:
npm error peer react@"^19.2.7" from react-dom@19.2.7
```

원인은 **Dependabot이 `react`와 `react-dom`을 각각 다른 PR로 쪼갰기 때문**이다.

- PR #3 브랜치: `react-dom`만 19.2.7로 올라감 → `react`는 아직 19.2.0.
- 그런데 `react-dom@19.2.7`은 peer로 `react@^19.2.7`을 요구한다 → 버전 불일치 → 설치 실패.

`react`와 `react-dom`은 **항상 같은 버전으로 함께 올려야** 하는 패키지다.

**처리 방법 (둘 중 하나):**

- (a) **함께 처리** — PR #4(react)와 #3(react-dom)을 같은 버전으로 묶어 한 번에 머지한다.
  한쪽 PR에서 `@dependabot recreate`로 다시 만들거나, 아래 4번처럼 그룹 설정 후
  `@dependabot recreate`를 돌리면 둘이 한 PR로 합쳐진다.
- (b) **재발 방지** — 아래 4번의 `groups` 설정을 적용하면, 앞으로 react 계열이 한 PR로
  묶여 이 문제가 다시 생기지 않는다.

---

## 4. 권장 개선 (유지하면서 다듬기)

> 아래는 **제안 스니펫일 뿐, 아직 적용되어 있지 않다.** 적용하려면 `.github/dependabot.yml`을
> 직접 고치면 된다.

`react`/`react-dom`을 한 PR로 묶고, PR 빈도·개수를 조절한 예시:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly # 잦으면 monthly 로 낮춰도 됨
    open-pull-requests-limit: 5 # 동시에 열리는 PR 수 제한 (기본 5)
    groups:
      react: # react + react-dom 을 한 PR로 묶어 peer 충돌 방지
        patterns:
          - "react"
          - "react-dom"
          - "@types/react"
          - "@types/react-dom"
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
```

- **`groups`**: 묶인 패키지를 하나의 PR에서 함께 업데이트 → react/react-dom 분리 실패
  (3번 문제) 재발 방지. 적용 후 기존 PR에 `@dependabot recreate`를 달면 합쳐진다.
- **`schedule.interval`**: `weekly` → `monthly`로 낮추면 PR이 덜 자주 생긴다.
- **`open-pull-requests-limit`**: 한 ecosystem에서 동시에 열리는 PR 상한.

---

## 5. 올라온 PR 다루는 법 (운영 가이드)

| 상황                         | 할 일                                                               |
| ---------------------------- | ------------------------------------------------------------------- |
| CI(`CI & Deploy`)가 초록색   | 안심하고 **Merge**. 의존성이 검증을 통과했다는 뜻.                  |
| CI가 빨간색                  | 로그에서 원인 확인. 깨지는 업데이트면 보류하거나 코드 수정 후 머지. |
| 지금은 올리기 싫은 업데이트  | PR을 **Close**. 다음 주기에 다시 올라올 수 있다.                    |
| 그 버전을 계속 무시하고 싶음 | PR 코멘트에 `@dependabot ignore this minor version` 등              |

자주 쓰는 `@dependabot` 코맨드 (PR 코멘트로 입력):

| 코맨드                               | 동작                                        |
| ------------------------------------ | ------------------------------------------- |
| `@dependabot rebase`                 | PR을 최신 main 기준으로 리베이스            |
| `@dependabot recreate`               | PR을 처음부터 다시 생성 (그룹 설정 반영 등) |
| `@dependabot merge`                  | CI 통과 후 자동 머지                        |
| `@dependabot ignore this dependency` | 해당 의존성 업데이트를 앞으로 무시          |

---

## 자동화를 완전히 끄고 싶다면

`.github/dependabot.yml` 파일을 삭제(또는 `updates:` 비우기)하면 Dependabot이 더 이상 PR을
만들지 않고, 2-(b)의 `dynamic` 잡도 사라진다. 다만 의존성 보안 업데이트 알림도 함께 줄어드니,
**유지하면서 4번처럼 다듬는 쪽을 권장**한다.
