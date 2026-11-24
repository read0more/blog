import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";

/*
 * 글꼴 정의 파일. 루트 레이아웃(<html>)에서만 가져다 쓴다.
 * next/font/google 은 빌드 때 글꼴을 내려받아 /_next/static/media 로 함께 내보내므로
 * 브라우저는 외부 글꼴 서버를 부르지 않고, basePath·assetPrefix 도 그대로 따른다.
 * 컴포넌트 CSS 는 tokens 의 --font-sans / --font-mono 만 참조한다.
 */

// 한글 글리프는 구글이 나눈 unicode-range 조각(약 90개)으로 내보내져 화면에 쓰인 조각만 받는다.
// preload 는 이름 있는 subset(latin)에만 걸 수 있어 한글 본문에는 효과가 없으므로 끈다.
export const plexSans = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-plex-sans",
});

// 워드마크·날짜·글 수가 첫 화면에 보이므로 라틴 조각만 미리 받는다.
export const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
});

/** <html> 에 붙여 --font-plex-sans / --font-plex-mono 를 선언한다. */
export const fontVariables = `${plexSans.variable} ${plexMono.variable}`;
