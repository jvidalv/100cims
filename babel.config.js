module.exports = function (api) {
    api.cache(true);
    return {
        "plugins": ["@babel/plugin-transform-class-static-block"],
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
    };
};