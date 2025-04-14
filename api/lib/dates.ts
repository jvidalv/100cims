export function formatDateForPostgresFromISOString(isoString: string): string {
  const [datePart] = isoString.split("T"); // Get "YYYY-MM-DD"
  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    throw new Error("Invalid ISO date string");
  }

  return `${year}-${month}-${day}`;
}
