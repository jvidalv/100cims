const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const formatjs = require("eslint-plugin-formatjs");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "expo-env.d.ts"],

    plugins: {
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
