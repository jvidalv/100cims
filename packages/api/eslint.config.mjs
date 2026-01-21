import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends("plugin:prettier/recommended"),
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
