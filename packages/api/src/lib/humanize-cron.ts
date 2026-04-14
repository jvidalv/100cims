const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const pad = (n: number) => String(n).padStart(2, "0");

const formatTime = (hour: string, minute: string) =>
  hour === "*" || minute === "*"
    ? null
    : `${pad(Number(hour))}:${pad(Number(minute))}`;

export const humanizeCron = (pattern: string): string => {
  const parts = pattern.trim().split(/\s+/);
  // Support 5- or 6-field patterns; normalize to [min, hour, dayOfMonth, month, weekday]
  const [minute, hour, dayOfMonth, month, weekday] =
    parts.length === 6 ? parts.slice(1) : parts;

  // Every-N-minutes: "*/N" minute with other time fields wild
  const everyMin = minute?.match(/^\*\/(\d+)$/);
  if (everyMin && hour === "*" && dayOfMonth === "*" && month === "*" && weekday === "*") {
    const n = Number(everyMin[1]);
    return n === 1 ? "Every minute" : `Every ${n} minutes`;
  }

  // Every minute
  if (
    minute === "*" &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    weekday === "*"
  ) {
    return "Every minute";
  }

  const time = formatTime(hour ?? "*", minute ?? "*");

  // Weekly on a specific weekday
  if (weekday && weekday !== "*" && dayOfMonth === "*" && month === "*") {
    const days = weekday
      .split(",")
      .map((d) => DAYS[Number(d) % 7])
      .filter(Boolean)
      .join(", ");
    return time ? `${days} at ${time}` : `${days}`;
  }

  // Monthly on specific day(s)
  if (dayOfMonth && dayOfMonth !== "*" && weekday === "*") {
    const days = dayOfMonth
      .split(",")
      .map((d) => {
        const n = Number(d);
        const suffix =
          n % 10 === 1 && n !== 11
            ? "st"
            : n % 10 === 2 && n !== 12
              ? "nd"
              : n % 10 === 3 && n !== 13
                ? "rd"
                : "th";
        return `${n}${suffix}`;
      })
      .join(" and ");
    const label = `${days} of each month`;
    return time ? `${label} at ${time}` : label;
  }

  // Daily at a specific time
  if (time && dayOfMonth === "*" && month === "*" && weekday === "*") {
    return `Daily at ${time}`;
  }

  return pattern;
};

const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// Rough "seconds between fires" for sorting. Smaller = more frequent.
// Precision doesn't matter — this only drives display order.
export const cronIntervalSeconds = (pattern: string): number => {
  const parts = pattern.trim().split(/\s+/);
  const [minute, hour, dayOfMonth, month, weekday] =
    parts.length === 6 ? parts.slice(1) : parts;

  const everyMin = minute?.match(/^\*\/(\d+)$/);
  if (everyMin && hour === "*" && dayOfMonth === "*" && month === "*" && weekday === "*") {
    return Number(everyMin[1]) * MIN;
  }

  if (
    minute === "*" &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    weekday === "*"
  ) {
    return MIN;
  }

  // Weekly (specific weekday)
  if (weekday && weekday !== "*" && dayOfMonth === "*" && month === "*") {
    const count = weekday.split(",").length;
    return (7 * DAY) / count;
  }

  // Monthly (specific day-of-month)
  if (dayOfMonth && dayOfMonth !== "*" && weekday === "*") {
    const count = dayOfMonth.split(",").length;
    return (30 * DAY) / count;
  }

  // Daily at fixed time
  if (dayOfMonth === "*" && month === "*" && weekday === "*") {
    return DAY;
  }

  return DAY;
};
