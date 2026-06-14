import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * Next.js 16 의 eslint-config-next 는 flat config 배열을 직접 export 한다
 * (FlatCompat 변환 불필요). core-web-vitals + typescript 규칙을 펼쳐 사용한다.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ["out/**", ".next/**", ".design/**", "node_modules/**"],
  },
];

export default eslintConfig;
