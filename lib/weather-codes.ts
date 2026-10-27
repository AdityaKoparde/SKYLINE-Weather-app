import type { ConditionGroup } from "@/lib/types";

type CodeInfo = { label: string; group: ConditionGroup };

/**
 * WMO weather interpretation codes used by Open-Meteo.
 * https://open-meteo.com/en/docs#weathervariables
 */
const CODES: Record<number, CodeInfo> = {
  0: { label: "Clear sky", group: "clear" },
  1: { label: "Mainly clear", group: "partly" },
  2: { label: "Partly cloudy", group: "partly" },
  3: { label: "Overcast", group: "cloudy" },
  45: { label: "Fog", group: "fog" },
  48: { label: "Freezing fog", group: "fog" },
  51: { label: "Light drizzle", group: "drizzle" },
  53: { label: "Drizzle", group: "drizzle" },
  55: { label: "Heavy drizzle", group: "drizzle" },
  56: { label: "Freezing drizzle", group: "drizzle" },
  57: { label: "Freezing drizzle", group: "drizzle" },
  61: { label: "Light rain", group: "rain" },
  63: { label: "Rain", group: "rain" },
  65: { label: "Heavy rain", group: "rain" },
  66: { label: "Freezing rain", group: "rain" },
  67: { label: "Freezing rain", group: "rain" },
  71: { label: "Light snow", group: "snow" },
  73: { label: "Snow", group: "snow" },
  75: { label: "Heavy snow", group: "snow" },
  77: { label: "Snow grains", group: "snow" },
  80: { label: "Light showers", group: "rain" },
  81: { label: "Showers", group: "rain" },
  82: { label: "Violent showers", group: "rain" },
  85: { label: "Snow showers", group: "snow" },
  86: { label: "Heavy snow showers", group: "snow" },
  95: { label: "Thunderstorm", group: "thunder" },
  96: { label: "Storm with hail", group: "thunder" },
  99: { label: "Storm with hail", group: "thunder" },
};

const FALLBACK: CodeInfo = { label: "Unknown", group: "cloudy" };

export function describeWeatherCode(code: number | null | undefined): CodeInfo {
  if (typeof code !== "number") return FALLBACK;
  return CODES[code] ?? FALLBACK;
}

export function conditionLabel(code: number | null | undefined): string {
  return describeWeatherCode(code).label;
}

export function conditionGroup(code: number | null | undefined): ConditionGroup {
  return describeWeatherCode(code).group;
}

/** Short label for narrow spaces such as the 7-day list. */
export const SHORT_GROUPS: Record<ConditionGroup, string> = {
  clear: "Clear",
  partly: "Partly cloudy",
  cloudy: "Cloudy",
  fog: "Fog",
  drizzle: "Drizzle",
  rain: "Rain",
  snow: "Snow",
  thunder: "Storms",
};
