// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "prettier", "plugin:tailwindcss/recommended"],
  ignorePatterns: ["/dist/*", "/expo-env.d.ts"],
  plugins: ["prettier", "react-hooks", "import", "tailwindcss", "formatjs"],
  rules: {
    "formatjs/no-offset": "error",
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": ["error", {}],
    "no-empty-pattern": "error",
    "import/order": [
      "error",
      {
        groups: [
          ["builtin"], // Node.js built-ins
          ["external"], // External packages
          ["internal"], // Internal modules
          ["parent", "sibling", "index"], // Parent, sibling, and index modules
          ["object"], // Object imports (e.g., `import * as X`)
          ["type"], // Type imports
          ["unknown"], // Unknown imports (e.g., side effects)
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        alphabetize: {
          order: "asc", // Sort imports alphabetically
          caseInsensitive: true, // Ignore case while sorting
        },
        "newlines-between": "always", // Add a newline between groups
      },
    ],
  },
};
