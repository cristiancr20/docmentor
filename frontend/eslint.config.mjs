import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Scripts vendorizados de la documentación de k6: no se lintan
  { ignores: ["src/k6/**"] },
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        process: "readonly",
      },
    },
  },
  {
    files: ["**/__tests__/**/*.{js,jsx}", "**/*.{test,spec}.{js,jsx}", "src/setupTests.js"],
    languageOptions: { globals: globals.jest },
  },
  pluginJs.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "detect", // Detecta automáticamente la versión de React
      },
    },
  },
  // El proyecto usa el runtime automático de JSX (babel.config.js),
  // por lo que React no necesita estar en scope
  pluginReact.configs.flat["jsx-runtime"],
  {
    rules: {
      // Con el runtime automático el import de React es opcional; no marcarlo
      "no-unused-vars": ["error", { varsIgnorePattern: "^React$" }],
    },
  },
];
