module.exports = function (api) {
  api.cache(true);
  return {
    plugins: [
      "@babel/plugin-transform-class-static-block",
      [
        "formatjs",
        {
          idInterpolationPattern: "[sha512:contenthash:base64:6]",
          ast: true,
        },
      ],
    ],
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
