const pad = (n: number): string => n.toString().padStart(2, "0");

export const formatDate = (value: string | Date): string => {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const formatDateTime = (value: string | Date): string => {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Coerces dates/ISO strings to the YYYY-MM-DD prefix that `<input type="date">`
// requires — a full ISO timestamp is silently rejected by the input.
export const toDateInputValue = (value: string | Date | null): string => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
};
