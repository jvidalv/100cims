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

      // eslint-config-expo 56 turns on the React Compiler lint rules, which
      // surface ~30 pre-existing issues across the app. Kept as warnings so
      // the SDK 56 upgrade lands without a sweeping cross-file refactor;
      // these should be fixed and promoted back to "error" in a follow-up.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",

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
