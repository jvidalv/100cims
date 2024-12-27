export function cleanText(text: string): string {
  if (!text) return text;

  // Remove accents and diacritical marks
  let normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Remove single quotes and similar characters
  normalized = normalized.replace(/['‘’`]/g, "");

  return normalized;
}
