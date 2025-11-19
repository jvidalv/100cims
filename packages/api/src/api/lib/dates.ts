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
