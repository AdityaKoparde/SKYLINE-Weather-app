import { NextResponse } from "next/server";

import { GeocodeError, searchPlaces } from "@/lib/geocode";

export const runtime = "nodejs";

/** GET /api/geocode?q=paris — city search for the autocomplete box. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (query.length > 80) {
    return NextResponse.json(
      { error: "Search query is too long." },
      { status: 400 },
    );
  }

  try {
    const results = await searchPlaces(query);
    return NextResponse.json(
      { results },
      { headers: { "cache-control": "public, max-age=300, s-maxage=3600" } },
    );
  } catch (error) {
    if (error instanceof GeocodeError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("[api/geocode]", error);
    return NextResponse.json(
      { error: "Something went wrong while searching for that place." },
      { status: 500 },
    );
  }
}
