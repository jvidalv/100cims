import { Colors } from "./constants/colors";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.tsx", "./components/**/*.tsx"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        accent: "var(--accent)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        link: "rgb(var(--link) / <alpha-value>)",
        border: "hsl(var(--border))",
      },
    },
  },
  plugins: [
    ({ addBase }) =>
      addBase({
        ":root": {
          "--primary": Colors.light.primary,
          "--accent": Colors.light.accent,
          "--background": "255 255 255",
          "--foreground": "5 5 5",
          "--muted-foreground": "80 80 80",
          "--link": "37 99 235",
          "--border": "214.3 31.8% 91.4%",
        },
        "@media (prefers-color-scheme: dark)": {
          ":root": {
            "--primary": Colors.dark.primary,
            "--accent": Colors.dark.accent,
            "--background": "21 23 24",
            "--foreground": "236 237 338",
            "--muted-foreground": "190 190 190",
            "--link": "59 130 246",
            "--border": "217.2 0% 20%",
          },
        },
      }),
  ],
};
