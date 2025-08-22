import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // 1) Apply TS recommended first
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx,cts,mts,js,mjs,cjs}"],
    rules: {
      // Turn off the TS rules you don’t want
      // If you also want to ensure base rule is off:

      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
    },
    ignores: ["dist/**", "node_modules/**"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
  },
]);
