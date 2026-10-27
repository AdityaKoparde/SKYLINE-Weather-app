import Dashboard from "@/components/Dashboard";
import { DEFAULT_PLACE } from "@/lib/config";
import { listSavedLocations } from "@/lib/db";
import type { SavedLocation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let savedLocations: SavedLocation[] = [];

  // The page still renders if the database is unavailable; the client can
  // recover through /api/locations once it retries.
  try {
    savedLocations = await listSavedLocations();
  } catch (error) {
    console.error("[page] Failed to read saved locations", error);
  }

  return (
    <Dashboard initialSaved={savedLocations} defaultPlace={DEFAULT_PLACE} />
  );
}
