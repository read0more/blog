---
title: "Live Code Block Preview"
description: "A draft post for checking that code blocks run directly inside the blog."
---

## A JavaScript Demo

Click the button to increment the counter. Try it in the preview, then edit the code in the `script.js` tab to see your changes immediately. Use the buttons above the block to switch between code and preview, preview only, and code only.

```html live file=index.html hidden
<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <button id="counter" type="button">Click</button>
    <p id="count">0 clicks</p>
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
  output.textContent = `${count} clicks`;
});
```

## A CSS-Only Demo

The cards snap into place using only `scroll-snap`, with no JavaScript. This demo starts in preview-only mode. Scroll horizontally inside the preview, or use the buttons above it to open the code.

```html live file=index.html hidden view=preview
<!doctype html>
<html lang="en">
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
