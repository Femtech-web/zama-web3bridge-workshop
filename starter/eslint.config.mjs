import js from "@eslint/js";
import ts from "typescript-eslint";

export default ts.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/artifacts/**",
      "**/cache/**",
      "**/types/**",
      "**/fhevmTemp/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        AbortSignal: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: [
      "test/**",
      "frontend/lib/zama/**",
      "frontend/lib/contracts/write-salary.ts",
      "frontend/hooks/use-assets.ts",
    ],
    // Numbered starter gaps reserve imports and parameters for the lesson.
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
);
