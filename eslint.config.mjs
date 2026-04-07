import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React 19 strict rules that flag common valid patterns
      "react-hooks/set-state-in-effect":   "off",
      "react-hooks/purity":                "off",
      "react-hooks/immutability":          "off",
      "react-hooks/refs":                  "off",
      "react-hooks/incompatible-library":  "off",

      // Cosmetic / style rules — don't block production builds
      "react/no-unescaped-entities":       "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
]);

export default eslintConfig;
