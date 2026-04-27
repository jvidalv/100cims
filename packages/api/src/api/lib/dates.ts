export function formatDateForPostgresFromISOString(isoString: string): string {
  try {
    const [datePart] = isoString.split("T");

    if (datePart && datePart.includes("-")) {
      const [year, month, day] = datePart.split("-");
      if (year && month && day) {
        return `${year}-${month}-${day}`;
      }
    }

    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    throw new Error("Invalid ISO date string");
  }
}

export function todayUtcDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Clamp a YYYY-MM-DD date string so it never lies in the future (UTC).
// Some app builds let users pick "tomorrow" because of timezone math; we
// normalize those to today before persisting.
export function clampDateStringToTodayUtc(date: string): string {
  const today = todayUtcDateString();
  return date > today ? today : date;
}
