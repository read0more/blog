import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";

/**
 * Next.js 16 의 eslint-config-next 는 flat config 배열을 직접 export 한다
 * (FlatCompat 변환 불필요). core-web-vitals + typescript 규칙을 펼쳐 사용한다.
 *
 * eslint-config-prettier 는 위 규칙들 중 Prettier 와 충돌하는 포맷 관련 규칙을
 * 끄기 위해 반드시 **맨 마지막**에 둔다(포맷은 Prettier 가 전담).
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  eslintConfigPrettier,
  {
    ignores: ["out/**", ".next/**", ".design/**", "node_modules/**"],
  },
];

export default eslintConfig;
