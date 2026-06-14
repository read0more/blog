/**
 * 카테고리 색상 — 이름을 해시해 iOS 시스템 컬러 팔레트(9색)에서
 * 결정적으로 한 색을 뽑는다. 새 카테고리가 frontmatter 에서 자동
 * 생성돼도 항상 같은 색이 안정적으로 배정된다(수동 매핑 불필요).
 *
 * 디자인(read0more.dc.html)의 catColor() 와 동일한 팔레트/해시를 사용한다.
 */
const CATEGORY_PALETTE = [
  "#5856d6", // indigo
  "#ff2d55", // pink
  "#007aff", // blue
  "#ff9500", // orange
  "#34c759", // green
  "#af52de", // purple
  "#32ade6", // cyan
  "#a2845e", // brown
  "#00c7be", // mint
] as const;

export function categoryColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_PALETTE[h % CATEGORY_PALETTE.length];
}
