import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ["node_modules/**", ".next/**", "outputs/**", "public/**"],
  },
  {
    rules: {
      // 브라우저 저장소(localStorage, sessionStorage)를 마운트 뒤에 읽어 상태에 넣는 곳에서만 걸린다.
      // 서버 렌더와 첫 화면을 맞추려면 이 방식이 필요하므로 경고로 둔다.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
