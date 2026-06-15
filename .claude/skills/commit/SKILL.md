---
name: commit
description: 변경사항을 이 저장소의 커밋 컨벤션(한국어 Conventional Commits + Co-Authored-By 트레일러)에 맞춰 커밋한다. 사용자가 커밋을 요청할 때만 사용한다("커밋해줘", "커밋해", "commit").
argument-hint: [메시지 힌트(선택)]
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git status *) Bash(git log *) Bash(git diff *)
---

## 저장소 현재 상태

최근 커밋 제목(이 톤/형식에 맞춘다):
!`git log -10 --format='%s'`

작업 트리:
!`git status --short`

변경 요약:
!`git diff --stat HEAD`

## 커밋 지침

사용자가 커밋을 요청했을 때 다음을 따른다.

1. **커밋 메시지는 한국어 Conventional Commits**: `<type>: <한국어 설명>` 형식.
   type은 `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style` 중에서 고른다.
   위 최근 커밋 제목들과 톤·형식을 맞춘다.
2. 제목 줄 다음에 **빈 줄**을 두고, 본문 마지막에 트레일러를 붙인다:
   ```
   Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
   ```
3. 이번 작업과 관련된 변경만 스테이징해 커밋한다. 이미 의도한 파일이 정해져 있으면 그 파일만
   `git add` 한다. **push는 하지 않는다** — 사용자가 명시적으로 요청할 때만 push한다.
4. 사용자가 인자로 메시지 힌트를 주면 제목에 반영한다: $ARGUMENTS
5. 커밋할 변경이 없으면 커밋하지 말고 그 사실을 알린다.
