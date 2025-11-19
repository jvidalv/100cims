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
  const words = name.trim().split(/\s+/); // Split by whitespace
  return words
    .map((word) => word[0]?.toUpperCase() || "")
    .slice(0, 2) // Take the first 2 initials
    .join("");
}
