import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "dist-electron", "supabase/functions", "tailwind.config.ts", "vitest.config.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/restrict-template-expressions": ["warn", { allowNumber: true }],
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/no-confusing-void-expression": "warn",
      "@typescript-eslint/restrict-plus-operands": "warn",
      "@typescript-eslint/no-redundant-type-constituents": "warn",
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/no-deprecated": "warn",
      "@typescript-eslint/no-unnecessary-type-parameters": "warn",
      "@typescript-eslint/no-dynamic-delete": "warn",
      "@typescript-eslint/no-misused-spread": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/prefer-promise-reject-errors": "warn",
      "no-constant-binary-expression": "warn",
      "no-prototype-builtins": "warn",
      "no-empty": "warn",
      "no-console": "off",
      "no-debugger": "warn",
      "no-duplicate-imports": "warn",
      "prefer-const": "warn",
      "no-var": "warn",
      "eqeqeq": ["warn", "always"],
      "curly": ["warn", "all"],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.app.json"],
      },
    },
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "no-console": "off",
    },
  },
);
