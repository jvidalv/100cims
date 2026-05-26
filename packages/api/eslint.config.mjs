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
    rules: {
      // Ban non-null assertions (`x!`) project-wide. They paper over
      // narrowing problems instead of fixing them — use an early return, an
      // explicit type guard, `??`, or restructure so TS sees the value as
      // defined.
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
];

export default eslintConfig;
