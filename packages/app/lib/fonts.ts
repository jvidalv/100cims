export const getFontFamily = (className?: string) => {
  if (className?.includes("font-black")) {
    return "black";
  }

  if (className?.includes("font-bold")) {
    return "bold";
  }

  if (className?.includes("font-semibold")) {
    return "semibold";
  }

  if (className?.includes("font-medium")) {
    return "medium";
  }

  return "regular";
};

export const getFontSize = (className?: string) => {
  if (className?.includes("text-5xl")) {
    return 40;
  }

  if (className?.includes("text-4xl")) {
    return 32;
  }

  if (className?.includes("text-3xl")) {
    return 28;
  }

  if (className?.includes("text-2xl")) {
    return 24;
  }

  if (className?.includes("text-xl")) {
    return 20;
  }

  if (className?.includes("text-lg")) {
    return 18;
  }

  if (className?.includes("text-sm")) {
    return 14;
  }

  if (className?.includes("text-xs")) {
    return 12;
  }

  return 16;
};
