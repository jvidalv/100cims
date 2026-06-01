/**
 * Colors that must be accessed directly without going through Tailwind are here.
 * This file is the source of truth, and it is imported in the tailwind config file.
 */
export const Colors = {
  light: {
    primary: "#f43f5e",
    accent: "#963ff4",
    success: "#22c55e",
    // Tailwind amber-500. Used for the "featured" affordance — gold star
    // on plan-list rows + calendar grid, gold label in the plan-detail
    // header. Same value as `text-amber-500` so Tailwind classes and
    // direct hex usage agree.
    featured: "#f59e0b",
    foreground: "black",
    muted: "#a3a3a3",
  },
  dark: {
    primary: "#f43f5e",
    accent: "#963ff4",
    success: "#22c55e",
    featured: "#f59e0b",
    foreground: "white",
    muted: "#737373",
  },
};

export const pastelColors: { bg: string; text: "black" | "white" }[] = [
  { bg: "#BAE1FF", text: "black" },
  { bg: "#FFFFBA", text: "black" },
  { bg: "#BAFFC9", text: "black" },
  { bg: "#FFDFBA", text: "black" },
  { bg: "#E2C2FF", text: "black" },
  { bg: "#98CDF8", text: "black" },
  { bg: "#D5ABFF", text: "black" },
  { bg: "#BAC8FF", text: "black" },
  { bg: "#E3FFBA", text: "black" },
  { bg: "#BABBFF", text: "black" },
  { bg: "#FFBABA", text: "black" },
  { bg: "#C2FFE8", text: "black" },
  { bg: "#D1FFBA", text: "black" },
  { bg: "#FFD9BA", text: "black" },
  { bg: "#EEBAFF", text: "black" },
  { bg: "#F9C0C0", text: "black" },
  { bg: "#BFFCC6", text: "black" },
  { bg: "#C0D6E4", text: "black" },
  { bg: "#FFD1DC", text: "black" },
  { bg: "#FFF5BA", text: "black" },
  { bg: "#C6E2FF", text: "black" },
  { bg: "#D5E8D4", text: "black" },
  { bg: "#FDE2E4", text: "black" },
  { bg: "#F0E5DE", text: "black" },
  { bg: "#E3F2FD", text: "black" },
];
