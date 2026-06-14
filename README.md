# read0more 블로그

read0more의 개인 기술 블로그입니다. `content/posts/`에 마크다운(`.md`) 파일을 추가하면 글이 되는 구조로 만들었습니다.

Next.js SSG로 구성하였습니다.

## 개발

```bash
npm install
npm run dev    # 개발 서버
npm run build  # 정적 export (out/)
```

## 글 쓰기

`content/posts/` 폴더에 `.md` 파일을 추가하면 됩니다. 각 파일 맨 위에는 프론트매터(YAML)로 글의 메타데이터를 적습니다.

```markdown
---
title: "글 제목"
date: "2026-05-09T09:00:00.000Z"
description: "목록과 검색에 노출되는 한 줄 요약"
category: "CSS"
---

본문 시작...
```

- `title` — 글 제목
- `date` — 작성일(ISO 8601). 목록 정렬 기준
- `description` — 글 목록·검색 결과에 보이는 요약
- `category` — 카테고리. 새 값을 쓰면 카테고리가 자동으로 생성됩니다

### 카테고리 색상

카테고리 색은 따로 지정하지 않습니다. 카테고리 이름을 해시 함수에 넣어 미리 정해둔 몇 가지 색(iOS 시스템 컬러 팔레트) 중 하나를 결정적으로 골라 쓰는 방식입니다. 덕분에 새 카테고리도 항상 같은 색으로 안정적으로 표시됩니다.
