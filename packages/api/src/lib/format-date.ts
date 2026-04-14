const pad = (n: number): string => n.toString().padStart(2, "0");

export const formatDate = (value: string | Date): string => {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const formatDateTime = (value: string | Date): string => {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
