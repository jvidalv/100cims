export const countryToEmoji = (country: string) => {
  if (country === "ESP") {
    return "🇪🇸";
  }

  if (country === "FRA") {
    return "🇫🇷";
  }

  return "🌍";
};
