export function formatDateForPostgres(date: Date): string {
  if (isNaN(date.getTime())) {
    throw new Error("Invalid Date object");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
