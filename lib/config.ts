import type { Place } from "@/lib/types";

/** Weather data source: free, no API key required. */
export const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
export const GEOCODE_API = "https://geocoding-api.open-meteo.com/v1/search";

/** Cache freshness for upstream weather data (ms). */
export const WEATHER_CACHE_TTL = 5 * 60 * 1000;

/** Cache freshness for geocoding lookups (ms). */
export const GEOCODE_CACHE_TTL = 60 * 60 * 1000;

/** How many cities a user may pin. */
export const MAX_SAVED_LOCATIONS = 12;

/**
 * City shown when the user has no pinned cities yet.
 * Change this to make the app open on your own city.
 */
export const DEFAULT_PLACE: Place = {
  name: "Bengaluru",
  admin1: "Karnataka",
  country: "India",
  countryCode: "IN",
  latitude: 12.9719,
  longitude: 77.5937,
};
