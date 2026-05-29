export function cleanText(text: string): string {
  if (!text) return text;

  // Remove accents and diacritical marks
  let normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Remove single quotes and similar characters
  normalized = normalized.replace(/['‘’`]/g, "");

  return normalized;
}

export function getInitials(name: string): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  // Prefer words that start with a letter so org names like "100 Cims
  // Hiking Club" render as "CH" instead of the not-very-useful "1C".
  // If every word starts with a non-letter (e.g. "777 Heroes" → still
  // has "Heroes"; "1234" → no fallback) we degrade to the raw first
  // chars so we never return empty when name is non-empty.
  const letterWords = words.filter((w) => /^\p{L}/u.test(w));
  const source = letterWords.length > 0 ? letterWords : words;
  return source
    .map((word) => word[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
}
