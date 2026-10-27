export type UnitSystem = "metric" | "imperial";

export type ConditionGroup =
  | "clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

/** Minimal description of a place, used for display and for saving. */
export type Place = {
  name: string;
  admin1?: string | null;
  country?: string | null;
  countryCode?: string | null;
  latitude: number;
  longitude: number;
  timezone?: string | null;
};

/** A place returned by the geocoding search. */
export type GeocodeResult = Place & {
  id: number;
  population?: number | null;
};

/** A city pinned by the user, persisted in SQLite. */
export type SavedLocation = {
  id: number;
  name: string;
  admin1: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
};

export type CurrentConditions = {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGust: number | null;
  pressure: number;
  cloudCover: number;
  visibility: number | null;
  uvIndex: number | null;
  precipitation: number;
  isDay: boolean;
  code: number;
  label: string;
  group: ConditionGroup;
  high: number;
  low: number;
  sunrise: string;
  sunset: string;
};

export type HourlyPoint = {
  time: string;
  temperature: number;
  precipitationProbability: number;
  windSpeed: number;
  code: number;
  label: string;
  group: ConditionGroup;
  isDay: boolean;
};

export type DailyPoint = {
  date: string;
  code: number;
  label: string;
  group: ConditionGroup;
  high: number;
  low: number;
  precipitationProbability: number;
  uvIndexMax: number | null;
  windMax: number;
  sunrise: string;
  sunset: string;
};

export type WeatherUnits = {
  temperature: string;
  wind: string;
  precipitation: string;
  distance: string;
  pressure: string;
};

export type WeatherReport = {
  location: Place & {
    timezone: string;
    timezoneAbbr: string;
  };
  units: WeatherUnits;
  current: CurrentConditions;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  fetchedAt: string;
  source: "open-meteo";
};
