import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next
  // Config files: avoid react plugin (incompatible with ESLint 10 flat context on these)
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "next.config.ts", "next.config.js", "next.config.mjs"]),
]);

export default eslintConfig;
