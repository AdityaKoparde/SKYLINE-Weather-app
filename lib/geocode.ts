import { GEOCODE_API, GEOCODE_CACHE_TTL } from "@/lib/config";
import type { GeocodeResult } from "@/lib/types";

type RawGeocodeResponse = {
  results?: Array<{
    id?: number;
    name?: string;
    latitude?: number;
    longitude?: number;
    country?: string;
    country_code?: string;
    admin1?: string;
    timezone?: string;
    population?: number;
  }>;
};

export class GeocodeError extends Error {
  constructor(message = "Could not search for that place right now.") {
    super(message);
    this.name = "GeocodeError";
  }
}

const cache = new Map<string, { expires: number; results: GeocodeResult[] }>();

export async function searchPlaces(query: string, count = 8): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const key = trimmed.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.results;
  if (cached) cache.delete(key);

  const params = new URLSearchParams({
    name: trimmed,
    count: String(count),
    language: "en",
    format: "json",
  });

  let response: Response;
  try {
    response = await fetch(`${GEOCODE_API}?${params.toString()}`, {
      signal: AbortSignal.timeout(6000),
      headers: { accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new GeocodeError("The location service did not respond in time.");
  }

  if (!response.ok) {
    throw new GeocodeError(`The location service returned an error (${response.status}).`);
  }

  const payload = (await response.json()) as RawGeocodeResponse;
  const results: GeocodeResult[] = [];

  for (const item of payload.results ?? []) {
    if (
      item.id == null ||
      !item.name ||
      item.latitude == null ||
      item.longitude == null
    ) {
      continue;
    }

    results.push({
      id: item.id,
      name: item.name,
      admin1: item.admin1 ?? null,
      country: item.country ?? null,
      countryCode: item.country_code ?? null,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone ?? null,
      population: item.population ?? null,
    });
  }

  if (cache.size > 300) cache.clear();
  cache.set(key, { expires: Date.now() + GEOCODE_CACHE_TTL, results });
  return results;
}
