import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
// Authentication endpoints intentionally require full navigation; never prefetch OAuth transactions.
const config = [
  ...next,
  ...ts,
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
  { ignores: [".next/**", ".local/**", "test-results/**", "next-env.d.ts"] },
];

export default config;
