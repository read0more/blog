// 정적 빌드(out/)를 GitHub Pages 와 동일한 /blog 하위 경로로 서빙한다.
// next.config.ts 가 BASE_PATH=/blog 로 빌드하면 자산 URL 이 /blog/... 가 되는데,
// 요청 경로 앞의 /blog 접두어만 떼고 out/ 을 그대로 넘긴다(serve 와 동일한 serve-handler).
import { createServer } from "node:http";
import handler from "serve-handler";

const BASE = process.env.BASE_PATH ?? "/blog";
const PORT = Number(process.env.PORT ?? 3000);

createServer((req, res) => {
  if (req.url === BASE) req.url = "/";
  else if (req.url.startsWith(BASE + "/")) req.url = req.url.slice(BASE.length);
  return handler(req, res, { public: "out" });
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}${BASE}/`);
});
