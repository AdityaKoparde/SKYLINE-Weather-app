import { NextResponse } from "next/server";

import {
  addSavedLocation,
  DatabaseUnavailableError,
  listSavedLocations,
  removeSavedLocation,
  SavedLocationLimitError,
} from "@/lib/db";
import type { Place } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(value: unknown, maxLength = 80): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

/** GET /api/locations — every pinned city, newest first. */
export async function GET() {
  try {
    return NextResponse.json(
      { locations: await listSavedLocations() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[api/locations:GET]", error);
    return NextResponse.json(
      { error: "Could not load your saved locations." },
      { status: 500 },
    );
  }
}

/** POST /api/locations — pin a city. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const name = asString(payload.name);
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!name) {
    return NextResponse.json({ error: "A place name is required." }, { status: 400 });
  }
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return NextResponse.json(
      { error: "Valid latitude and longitude are required." },
      { status: 400 },
    );
  }

  const place: Place = {
    name,
    admin1: asString(payload.admin1),
    country: asString(payload.country),
    countryCode: asString(payload.countryCode, 8),
    latitude,
    longitude,
  };

  try {
    const location = await addSavedLocation(place);
    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    if (error instanceof SavedLocationLimitError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[api/locations:POST]", error);
    return NextResponse.json(
      { error: "Could not save that location." },
      { status: 500 },
    );
  }
}

/** DELETE /api/locations?id=3 — unpin a city. */
export async function DELETE(request: Request) {
  const rawId = new URL(request.url).searchParams.get("id");
  const id = Number(rawId);

  if (!rawId || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "A valid location id is required." }, { status: 400 });
  }

  try {
    const removed = await removeSavedLocation(id);
    if (!removed) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("[api/locations:DELETE]", error);
    return NextResponse.json(
      { error: "Could not remove that location." },
      { status: 500 },
    );
  }
}
