---
title: "라이브 코드 블록 미리보기"
date: "2026-10-21T09:00:00.000Z"
description: "본문 코드 블록이 블로그 안에서 바로 실행되는지 확인하는 draft 글입니다."
category: "생각들"
draft: true
---

<!--
  [draft 확인용] 배포 빌드(OMIT_DRAFTS=true)에서는 빠지고 로컬 dev/build 에서만 보인다.
  라이브 코드 블록 문법: meta 에 live 가 붙은 연속 펜스 = 데모 하나. file= 필수, hidden 은 탭에서 숨김.
-->

## JS가 도는 데모

버튼을 누르면 숫자가 올라갑니다. 오른쪽(좁은 화면에선 아래) 미리보기에서 눌러보고, `script.js` 탭에서 코드를 고치면 바로 반영됩니다.

```html live file=index.html hidden
<!doctype html>
<html lang="ko">
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <button id="counter" type="button">클릭</button>
    <p id="count">0번 클릭</p>
    <script type="module" src="script.js"></script>
  </body>
</html>
```

```css live file=styles.css
body {
  font-family: system-ui, sans-serif;
  padding: 16px;
}

button {
  padding: 8px 16px;
  border: 0;
  border-radius: 8px;
  background: #007aff;
  color: #fff;
  font-size: 15px;
}
```

```js live file=script.js
let count = 0;
const output = document.querySelector("#count");
document.querySelector("#counter").addEventListener("click", () => {
  count += 1;
  output.textContent = `${count}번 클릭`;
});
```

## CSS만 있는 데모

JS 없이 `scroll-snap`만으로 카드가 한 장씩 멈춥니다. 미리보기 안에서 가로로 스크롤해 보세요.

```html live file=index.html hidden
<!doctype html>
<html lang="ko">
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <ul class="cards">
      <li>1</li>
      <li>2</li>
      <li>3</li>
      <li>4</li>
    </ul>
  </body>
</html>
```

```css live file=styles.css
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

.cards {
  display: flex;
  gap: 12px;
  margin: 0;
  padding: 16px;
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.cards li {
  flex: 0 0 80%;
  height: 160px;
  border-radius: 16px;
  background: #f2f2f7;
  display: grid;
  place-items: center;
  font-size: 32px;
  scroll-snap-align: center;
}
```
