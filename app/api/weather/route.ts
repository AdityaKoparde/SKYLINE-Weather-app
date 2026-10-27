import { NextResponse } from "next/server";

import type { Place, UnitSystem } from "@/lib/types";
import { getWeatherReport, WeatherUpstreamError } from "@/lib/weather";

export const runtime = "nodejs";

function parseCoordinate(value: string | null, limit: number): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > limit) return null;
  return parsed;
}

function cleanText(value: string | null, maxLength = 80): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

/**
 * GET /api/weather?lat=..&lon=..&unit=metric&name=..&country=..
 *
 * The browser never talks to Open-Meteo directly: this handler validates the
 * request, caches upstream data and normalises it for the UI.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const latitude = parseCoordinate(searchParams.get("lat"), 90);
  const longitude = parseCoordinate(searchParams.get("lon"), 180);

  if (latitude === null || longitude === null) {
    return NextResponse.json(
      { error: "Valid latitude and longitude are required." },
      { status: 400 },
    );
  }

  const unit: UnitSystem =
    searchParams.get("unit") === "imperial" ? "imperial" : "metric";

  const place: Place = {
    name: cleanText(searchParams.get("name")) ?? "Selected location",
    admin1: cleanText(searchParams.get("admin1")),
    country: cleanText(searchParams.get("country")),
    countryCode: cleanText(searchParams.get("countryCode"), 8),
    latitude,
    longitude,
  };

  try {
    const report = await getWeatherReport(place, unit);
    return NextResponse.json(report, {
      headers: {
        // Upstream data is refreshed every 5 minutes.
        "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    if (error instanceof WeatherUpstreamError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("[api/weather]", error);
    return NextResponse.json(
      { error: "Something went wrong while loading the forecast." },
      { status: 500 },
    );
  }
}
