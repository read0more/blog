import { THEME_SCRIPT } from "@/lib/theme-script";

/**
 * 루트 레이아웃(한국어·영어·global-not-found)의 <head>. 첫 페인트 전에 <html data-theme> 을 붙여
 * 새로고침·언어 루트 이동(전체 페이지 이동) 때 밝은 화면이 번쩍이지 않게 한다.
 * 메타데이터 태그는 Next 가 이 <head> 에 함께 넣는다.
 */
export function ThemeHead() {
  return (
    <head>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
    </head>
  );
}
