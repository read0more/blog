/**
 * 날짜 포맷 — 디자인(read0more.dc.html)의 fmt() 와 동일하게
 * "YYYY년 M월 D일" 형태로 표기한다(월/일은 0 패딩 없음).
 *
 * SSG/hydration 안정성을 위해 로케일/타임존에 의존하는 toLocale* 대신
 * UTC 기준으로 직접 포맷한다(서버/클라이언트 동일 결과 보장).
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}
