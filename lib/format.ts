/**
 * Open-Meteo returns *local* wall-clock timestamps without a timezone offset
 * (e.g. "2026-10-26T17:30"). We format those strings directly instead of
 * passing them through Date, which would shift them into the viewer's zone.
 */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parts(timestamp: string): { date: string; hour: number; minute: number } {
  const [date, time = ""] = timestamp.split("T");
  const hour = Number(time.slice(0, 2));
  const minute = Number(time.slice(3, 5));
  return {
    date: date ?? "",
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function to12Hour(hour: number, minute: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return minute ? `${display}:${String(minute).padStart(2, "0")} ${suffix}` : `${display} ${suffix}`;
}

/** "5 PM" — compact label for hourly axis. */
export function formatHour(timestamp: string): string {
  const { hour } = parts(timestamp);
  return to12Hour(hour, 0);
}

/** "5:30 PM" — clock label for the current observation. */
export function formatClock(timestamp: string): string {
  const { hour, minute } = parts(timestamp);
  return to12Hour(hour, minute);
}

/** Sunrise / sunset label, e.g. "6:24 AM". */
export function formatSunTime(timestamp: string): string {
  if (!timestamp) return "--";
  return formatClock(timestamp);
}

function utcDate(dateIso: string): Date | null {
  const [year, month, day] = dateIso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

/** "Today", "Tomorrow", then full weekday names for the 7-day list. */
export function formatDayLabel(dateIso: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const date = utcDate(dateIso);
  return date ? WEEKDAYS[date.getUTCDay()] : dateIso;
}

/** "Sun" — short weekday for compact layouts. */
export function formatWeekdayShort(dateIso: string): string {
  const date = utcDate(dateIso);
  return date ? WEEKDAYS_SHORT[date.getUTCDay()] : "--";
}

/** "27 Oct" */
export function formatShortDate(dateIso: string): string {
  const date = utcDate(dateIso);
  if (!date) return "";
  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

/** Rounded temperature with a real degree symbol. */
export function formatTemperature(value: number | null | undefined): string {
  if (value == null) return "--";
  return `${Math.round(value)}°`;
}

export function formatNumber(value: number | null | undefined, unit = ""): string {
  if (value == null) return "--";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit}`;
}

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

export function compassDirection(degrees: number): string {
  const index = Math.round(((degrees % 360) / 22.5 + 360) % 16) % 16;
  return COMPASS[index];
}

export function uvDescription(uv: number | null): string {
  if (uv == null) return "Unavailable";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

export function humidityDescription(humidity: number): string {
  if (humidity < 30) return "Dry air";
  if (humidity < 60) return "Comfortable";
  if (humidity < 80) return "Humid";
  return "Very humid";
}

export function pressureDescription(pressure: number): string {
  if (pressure < 1000) return "Low — unsettled";
  if (pressure < 1013) return "Slightly low";
  if (pressure < 1025) return "Steady";
  return "High — settled";
}

export function visibilityDescription(km: number | null): string {
  if (km == null) return "Unavailable";
  if (km < 1) return "Very poor";
  if (km < 5) return "Moderate";
  if (km < 10) return "Good";
  return "Excellent";
}

export function windDescription(speedKmh: number): string {
  if (speedKmh < 6) return "Calm";
  if (speedKmh < 20) return "Light breeze";
  if (speedKmh < 39) return "Breezy";
  if (speedKmh < 62) return "Strong wind";
  return "Very strong";
}

/** Region line such as "Karnataka, India". */
export function placeSubtitle(
  admin1?: string | null,
  country?: string | null,
): string {
  return [admin1, country].filter(Boolean).join(", ");
}
