const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const formatjs = require("eslint-plugin-formatjs");
const tailwindcss = require("eslint-plugin-tailwindcss");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "expo-env.d.ts"],

    plugins: {
      tailwindcss,
      formatjs,
    },

    rules: {
      "formatjs/no-offset": "error",

      "import/order": [
        "error",
        {
          groups: [
            ["builtin"],
            ["external"],
            ["internal"],
            ["parent", "sibling", "index"],
            ["object"],
            ["type"],
            ["unknown"],
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          "newlines-between": "always",
        },
      ],

      "no-empty-pattern": "error",
    },
  },
]);
