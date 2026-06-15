import type { MetadataRoute } from "next";

// 빌드 시 주입되는 basePath(예: /blog). manifest JSON 본문의 경로는 Next 가
// 자동으로 prefix 하지 않으므로(아이콘 src·start_url) 여기서 직접 붙여야
// GitHub Pages 프로젝트 페이지에서 404 가 안 난다. next.config.ts 의 basePath 와 동일.
const basePath = process.env.BASE_PATH ?? "";

// 정적 export(output: "export") 에서는 manifest 라우트도 빌드 타임에 고정 생성해야 한다.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "read0more's Blog",
    short_name: "read0more",
    start_url: `${basePath}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: `${basePath}/android-chrome-192x192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${basePath}/android-chrome-512x512.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
