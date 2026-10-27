import { WEATHER_API, WEATHER_CACHE_TTL } from "@/lib/config";
import type {
  CurrentConditions,
  DailyPoint,
  HourlyPoint,
  Place,
  UnitSystem,
  WeatherReport,
  WeatherUnits,
} from "@/lib/types";
import { conditionGroup, conditionLabel } from "@/lib/weather-codes";

/* -------------------------------------------------------------------------- */
/*  Upstream response shape (only the fields we request)                       */
/* -------------------------------------------------------------------------- */

type RawForecast = {
  timezone?: string;
  timezone_abbreviation?: string;
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    is_day?: number;
    precipitation?: number;
    weather_code?: number;
    cloud_cover?: number;
    pressure_msl?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
    is_day?: number[];
    wind_speed_10m?: number[];
    uv_index?: number[];
    visibility?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
};

export class WeatherUpstreamError extends Error {
  constructor(message = "Weather service is unavailable right now.") {
    super(message);
    this.name = "WeatherUpstreamError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Tiny in-memory cache                                                      */
/* -------------------------------------------------------------------------- */

type CacheEntry = { expires: number; raw: RawForecast };
const cache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 200;

function cacheKey(latitude: number, longitude: number) {
  return `${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
}

function readCache(key: string): RawForecast | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.raw;
}

function writeCache(key: string, raw: RawForecast) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { expires: Date.now() + WEATHER_CACHE_TTL, raw });
}

/* -------------------------------------------------------------------------- */
/*  Fetching                                                                  */
/* -------------------------------------------------------------------------- */

async function fetchForecast(latitude: number, longitude: number): Promise<RawForecast> {
  const key = cacheKey(latitude, longitude);
  const cached = readCache(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),
    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "weather_code",
      "is_day",
      "wind_speed_10m",
      "uv_index",
      "visibility",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_probability_max",
      "wind_speed_10m_max",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
    wind_speed_unit: "kmh",
  });

  let response: Response;
  try {
    response = await fetch(`${WEATHER_API}?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new WeatherUpstreamError("The weather service did not respond in time.");
  }

  if (!response.ok) {
    throw new WeatherUpstreamError(
      `The weather service returned an error (${response.status}).`,
    );
  }

  const raw = (await response.json()) as RawForecast;
  if (!raw.current || !raw.hourly?.time?.length || !raw.daily?.time?.length) {
    throw new WeatherUpstreamError("The weather service sent an incomplete response.");
  }

  writeCache(key, raw);
  return raw;
}

/* -------------------------------------------------------------------------- */
/*  Normalising + unit conversion                                             */
/* -------------------------------------------------------------------------- */

const round = (value: number) => Math.round(value * 10) / 10;

const METRIC_UNITS: WeatherUnits = {
  temperature: "°C",
  wind: "km/h",
  precipitation: "mm",
  distance: "km",
  pressure: "hPa",
};

const IMPERIAL_UNITS: WeatherUnits = {
  temperature: "°F",
  wind: "mph",
  precipitation: "in",
  distance: "mi",
  pressure: "hPa",
};

const cToF = (celsius: number) => (celsius * 9) / 5 + 32;
const kmhToMph = (kmh: number) => kmh * 0.621371;
const mmToIn = (mm: number) => mm / 25.4;
const kmToMi = (km: number) => km * 0.621371;

/** Index of the first hourly entry at (or after) the current hour. */
function currentHourIndex(times: string[], currentTime: string): number {
  const hour = `${currentTime.slice(0, 13)}:00`;
  const index = times.findIndex((time) => time.slice(0, 13) >= hour.slice(0, 13));
  return index === -1 ? 0 : index;
}

function normalize(
  raw: RawForecast,
  place: Place,
  unit: UnitSystem,
): WeatherReport {
  const current = raw.current ?? {};
  const hourly = raw.hourly ?? {};
  const daily = raw.daily ?? {};

  const hourlyTimes = hourly.time ?? [];
  const startIndex = currentHourIndex(hourlyTimes, current.time ?? hourlyTimes[0] ?? "");

  const todayHigh = daily.temperature_2m_max?.[0];
  const todayLow = daily.temperature_2m_min?.[0];
  const sunrise = daily.sunrise?.[0] ?? "";
  const sunset = daily.sunset?.[0] ?? "";

  const currentCode = current.weather_code ?? hourly.weather_code?.[startIndex] ?? 0;
  const visibilityKm =
    hourly.visibility?.[startIndex] !== undefined
      ? round(hourly.visibility[startIndex] / 1000)
      : null;

  const conditions: CurrentConditions = {
    time: current.time ?? hourlyTimes[startIndex] ?? "",
    temperature: round(current.temperature_2m ?? 0),
    feelsLike: round(current.apparent_temperature ?? current.temperature_2m ?? 0),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    windSpeed: round(current.wind_speed_10m ?? 0),
    windDirection: Math.round(current.wind_direction_10m ?? 0),
    windGust: current.wind_gusts_10m != null ? round(current.wind_gusts_10m) : null,
    pressure: Math.round(current.pressure_msl ?? 0),
    cloudCover: Math.round(current.cloud_cover ?? 0),
    visibility: visibilityKm,
    uvIndex:
      hourly.uv_index?.[startIndex] != null ? round(hourly.uv_index[startIndex]) : null,
    precipitation: round(current.precipitation ?? 0),
    isDay: (current.is_day ?? 1) === 1,
    code: currentCode,
    label: conditionLabel(currentCode),
    group: conditionGroup(currentCode),
    high: round(todayHigh ?? current.temperature_2m ?? 0),
    low: round(todayLow ?? current.temperature_2m ?? 0),
    sunrise,
    sunset,
  };

  const hourlyPoints: HourlyPoint[] = hourlyTimes
    .slice(startIndex, startIndex + 24)
    .map((time, offset) => {
      const index = startIndex + offset;
      const code = hourly.weather_code?.[index] ?? currentCode;
      return {
        time,
        temperature: round(hourly.temperature_2m?.[index] ?? conditions.temperature),
        precipitationProbability: Math.round(
          hourly.precipitation_probability?.[index] ?? 0,
        ),
        windSpeed: round(hourly.wind_speed_10m?.[index] ?? conditions.windSpeed),
        code,
        label: conditionLabel(code),
        group: conditionGroup(code),
        isDay: (hourly.is_day?.[index] ?? 1) === 1,
      };
    });

  const dailyPoints: DailyPoint[] = (daily.time ?? []).map((date, index) => {
    const code = daily.weather_code?.[index] ?? 0;
    return {
      date,
      code,
      label: conditionLabel(code),
      group: conditionGroup(code),
      high: round(daily.temperature_2m_max?.[index] ?? 0),
      low: round(daily.temperature_2m_min?.[index] ?? 0),
      precipitationProbability: Math.round(
        daily.precipitation_probability_max?.[index] ?? 0,
      ),
      uvIndexMax:
        daily.uv_index_max?.[index] != null ? round(daily.uv_index_max[index]) : null,
      windMax: round(daily.wind_speed_10m_max?.[index] ?? 0),
      sunrise: daily.sunrise?.[index] ?? "",
      sunset: daily.sunset?.[index] ?? "",
    };
  });

  const report: WeatherReport = {
    location: {
      name: place.name,
      admin1: place.admin1 ?? null,
      country: place.country ?? null,
      countryCode: place.countryCode ?? null,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: raw.timezone ?? "UTC",
      timezoneAbbr: raw.timezone_abbreviation ?? "",
    },
    units: METRIC_UNITS,
    current: conditions,
    hourly: hourlyPoints,
    daily: dailyPoints,
    fetchedAt: new Date().toISOString(),
    source: "open-meteo",
  };

  return unit === "imperial" ? toImperial(report) : report;
}

function toImperial(report: WeatherReport): WeatherReport {
  const temperature = (value: number) => round(cToF(value));
  const wind = (value: number) => round(kmhToMph(value));

  return {
    ...report,
    units: IMPERIAL_UNITS,
    current: {
      ...report.current,
      temperature: temperature(report.current.temperature),
      feelsLike: temperature(report.current.feelsLike),
      high: temperature(report.current.high),
      low: temperature(report.current.low),
      windSpeed: wind(report.current.windSpeed),
      windGust: report.current.windGust != null ? wind(report.current.windGust) : null,
      precipitation: round(mmToIn(report.current.precipitation)),
      visibility:
        report.current.visibility != null ? round(kmToMi(report.current.visibility)) : null,
    },
    hourly: report.hourly.map((point) => ({
      ...point,
      temperature: temperature(point.temperature),
      windSpeed: wind(point.windSpeed),
    })),
    daily: report.daily.map((point) => ({
      ...point,
      high: temperature(point.high),
      low: temperature(point.low),
      windMax: wind(point.windMax),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

export async function getWeatherReport(
  place: Place,
  unit: UnitSystem,
): Promise<WeatherReport> {
  const raw = await fetchForecast(place.latitude, place.longitude);
  return normalize(raw, place, unit);
}
