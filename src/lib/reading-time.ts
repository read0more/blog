/**
 * 읽는 시간 — 한글 글자수 기반.
 * 영어 단어 수 기준(reading-time 패키지)은 한글에 부정확하므로,
 * 공백을 제거한 글자 수를 분당 500자로 나눈다(최소 1분).
 *
 * 디자인(read0more.dc.html)의 readMin() 과 동일한 공식.
 */
const CHARS_PER_MINUTE = 500;

export function readingMinutes(plainText: string): number {
  const chars = plainText.replace(/\s/g, "").length;
  return Math.max(1, Math.round(chars / CHARS_PER_MINUTE));
}
