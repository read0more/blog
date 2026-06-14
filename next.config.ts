import type { NextConfig } from "next";

/**
 * GitHub Pages 프로젝트 페이지 배포를 위한 설정.
 *
 * - `output: 'export'` 로 정적 사이트(out/)를 생성한다.
 * - 프로젝트 페이지(username.github.io/<repo>)는 basePath/assetPrefix 가
 *   repo 이름으로 맞춰져야 한다. 저장소 이름이 아직 미정이므로 환경변수
 *   `BASE_PATH` 로 주입한다(예: CI 에서 `BASE_PATH=/my-blog`). dev/로컬은
 *   빈 문자열이라 basePath 없이 동작한다.
 * - 정적 export 는 next/image 최적화 서버를 쓸 수 없으므로 unoptimized 필수.
 */
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // assetPrefix 는 basePath 가 있을 때만 명시(빈 값이면 설정하지 않음).
  ...(basePath ? { assetPrefix: `${basePath}/` } : {}),
  // 클라이언트(검색 인덱스 fetch 등)가 basePath 를 알 수 있도록 노출한다.
  // 자산/인덱스 fetch 경로 앞에 이 값을 prefix 해야 프로젝트 페이지에서 404 가 안 난다.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  // GitHub Pages 정적 호스팅은 폴더 단위 라우팅(/about/ → /about/index.html)에
  // 가깝게 동작하므로 trailingSlash 를 켜 링크/자산 경로 일관성을 높인다.
  trailingSlash: true,
};

export default nextConfig;
