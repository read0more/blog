---
name: pr-creator
description: 이 저장소(read0more 블로그)의 GitHub PR을 정해진 제목·본문 양식으로 작성해 브랜치를 푸시하고 gh로 생성한다. "PR 만들어줘", "PR 올려줘", "pull request 생성" 요청이나 이미 있는 PR 본문을 양식에 맞게 고칠 때 사용한다.
---

# GitHub PR 작성

## 1. 먼저 확인한다

- `git status --short`, `git branch --show-current`, `git log --oneline main..HEAD`, `git diff --stat main...HEAD`로 실제 변경을 파악한다. 본문은 대화 기억이 아니라 이 diff를 기준으로 쓴다.
- main에 있으면 `<type>/<kebab-case 영어>` 브랜치를 만든다(예: `feat/live-code-block`, `chore/block-eslint-10-major`).
- 커밋 안 된 변경이 있으면 이 PR에 들어갈 변경인지 확인한 뒤 커밋 컨벤션(`<type>: <한국어 설명>`)으로 커밋한다.
- `gh pr view`로 이 브랜치에 이미 PR이 있는지 본다. 있으면 새로 만들지 않고 `gh pr edit --body-file`로 고친다.
- 연결할 이슈를 찾는다: 사용자가 준 번호, 커밋 메시지, `gh issue list --state open`. `feat`·`fix`인데 이슈가 없으면 issue-creator 스킬로 먼저 만든다. 설정·의존성 `chore`는 이슈 없이 올려도 된다(#9, #12).
- `feat`이면 새 기능을 실제 글 맥락에서 확인할 `draft: true` 데모 글이 브랜치에 있는지 본다. 없으면 먼저 추가한다(배포 빌드에서는 제외된다).

## 2. 제목

`<type>: <한국어 설명>`

- 연결한 이슈 제목을 기본으로 삼고, 실제 변경에 맞게 동사형으로 끝낼 수 있다(`추가` `지원` `전환` `차단`).
- 예: 이슈 `feat: 본문에서 실행되는 라이브 코드 블록` → PR `feat: 본문에서 실행되는 라이브 코드 블록 추가`

## 3. 본문 양식

`Closes`는 첫 줄에 둔다. 연결할 이슈가 없으면 그 줄을 뺀다. `주의`는 없으면 뺀다. 나머지 섹션 이름은 바꾸지 않는다.

```markdown
Closes #<번호>

## 배경

<1~3문장. 이슈를 복사하지 않고, 리뷰어가 이 PR만 읽어도 왜 바꿨는지 알 수 있을 만큼>

## 변경

- <무엇을 왜 바꿨는지. 파일·모듈 경로는 백틱>
- <diff만 봐서는 알 수 없는 결정과 이유: 다른 방법을 쓰지 않은 까닭>

## 주의

- <배포 후 깨지는 URL, 알려진 제약, 이번 범위에서 뺀 것, 외부 네트워크 의존>

## 검증

- <실제로 돌린 명령과 결과>
- <브라우저로 무엇을 해서 무엇을 확인했는지>
```

## 4. 중요하게 다룰 내용

- **변경**은 파일 목록이 아니다. 리뷰어가 diff에서 바로 읽을 수 없는 이유와 함정을 먼저 쓴다(예: "`rehype-raw`가 펜스 meta를 버려서 remark 단계에 둔다").
- **주의**에는 머지 후에 누군가 놀랄 일을 쓴다: 404가 되는 기존 주소, 정적 export라 redirect가 없다는 점, CI에서 뺀 테스트와 그 이유.
- **검증**에는 실제로 돌린 것만 쓴다. 실패하거나 건너뛴 것도 그대로 쓴다. 해당하면 아래를 포함한다.
  - `npm run lint`, `npm run type-check`, `npm run format:check`, `npm run build`
  - E2E 통과 개수, 추가·수정한 spec 파일
  - 배포 조건 빌드 `OMIT_DRAFTS=true BASE_PATH=/blog npm run build`의 결과(공개 글 수, draft 제외 확인)
  - 브라우저 확인(데스크톱 1280px·모바일 390px)
- 수치는 판단에 필요한 것만 쓴다. 테스트 통과 개수는 쓰고, 소요 시간·커밋 시각·diff 줄 수는 쓰지 않는다.

## 5. 문체

- 하다체(`~한다`, `~했다`)로 쓴다. 합니다체와 섞지 않는다.
- em/en dash를 쓰지 않는다. 콜론·가운뎃점으로 대신하거나 문장을 바꾼다.
- 불릿 하나에 사실 하나. 코드·경로·명령은 백틱으로 감싼다.

## 6. 생성

1. git hook을 우회하지 않는다. `--no-verify`, `HUSKY=0` 같은 방법을 쓰지 않는다. pre-push가 `npm run build`를 돌리므로, 실패하면 원인을 고친다.
2. `git push -u origin HEAD`
3. 본문을 `mktemp` 임시 파일에 쓰고 `grep -n '[—–―]' <파일>`이 0건인지 확인한다.
4. `gh pr create --base main --title "<제목>" --body-file <파일>`. draft PR·라벨은 쓰지 않는다(기존 관례).
5. 실행 환경이 요구하는 attribution 줄(예: Claude Code의 `🤖 Generated with …`)이 있으면 본문 맨 끝에 붙인다. 없으면 붙이지 않는다.
6. PR URL을 알린다. 머지는 하지 않는다. CI 상태는 `gh pr checks`로 확인할 수 있다.
