import { getCloudflareContext } from "@opennextjs/cloudflare";

import { MAX_SAVED_LOCATIONS } from "@/lib/config";
import type { Place, SavedLocation } from "@/lib/types";

/**
 * Pinned cities are stored in Cloudflare D1 (SQLite).
 *
 * The binding is named `DB` in the deployment manifest; locally it is provided
 * by `initOpenNextCloudflareForDev` in next.config.ts, so `next dev` talks to a
 * real (local) D1 instance and the deployed Worker talks to the hosted one.
 */

type D1RunResult = { success?: boolean; meta?: { changes?: number } };
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
  run(): Promise<D1RunResult>;
};
export type D1Binding = {
  prepare(query: string): D1Statement;
};

export class SavedLocationLimitError extends Error {
  constructor() {
    super(`You can save up to ${MAX_SAVED_LOCATIONS} locations.`);
    this.name = "SavedLocationLimitError";
  }
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("The saved-cities database is not configured for this deployment.");
    this.name = "DatabaseUnavailableError";
  }
}

const SELECT_COLUMNS =
  "id, name, admin1, country, country_code AS countryCode, latitude, longitude, created_at AS createdAt";

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS saved_locations (
     id           INTEGER PRIMARY KEY AUTOINCREMENT,
     name         TEXT    NOT NULL,
     admin1       TEXT,
     country      TEXT,
     country_code TEXT,
     latitude     REAL    NOT NULL,
     longitude    REAL    NOT NULL,
     created_at   TEXT    NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_locations_coords
     ON saved_locations (latitude, longitude)`,
];

/** Schema creation runs at most once per isolate. */
let schemaReady: Promise<void> | null = null;

async function ensureSchema(db: D1Binding): Promise<void> {
  schemaReady ??= (async () => {
    for (const statement of SCHEMA_STATEMENTS) {
      await db.prepare(statement).run();
    }
  })().catch((error: unknown) => {
    // Allow the next request to retry if provisioning was mid-flight.
    schemaReady = null;
    throw error;
  });

  await schemaReady;
}

async function getDatabase(): Promise<D1Binding> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as { DB?: D1Binding }).DB;

  if (!db || typeof db.prepare !== "function") {
    throw new DatabaseUnavailableError();
  }

  await ensureSchema(db);
  return db;
}

const roundCoords = (value: number) => Math.round(value * 1e4) / 1e4;

export async function listSavedLocations(): Promise<SavedLocation[]> {
  const db = await getDatabase();
  const { results } = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM saved_locations
       ORDER BY created_at DESC, id DESC`,
    )
    .all<SavedLocation>();

  return results ?? [];
}

export async function addSavedLocation(place: Place): Promise<SavedLocation> {
  const db = await getDatabase();
  const latitude = roundCoords(place.latitude);
  const longitude = roundCoords(place.longitude);

  const existing = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM saved_locations
       WHERE latitude = ? AND longitude = ?`,
    )
    .bind(latitude, longitude)
    .first<SavedLocation>();

  if (existing) return existing;

  const countRow = await db
    .prepare("SELECT COUNT(*) AS count FROM saved_locations")
    .first<{ count: number }>();

  if ((countRow?.count ?? 0) >= MAX_SAVED_LOCATIONS) {
    throw new SavedLocationLimitError();
  }

  await db
    .prepare(
      `INSERT INTO saved_locations
         (name, admin1, country, country_code, latitude, longitude, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      place.name,
      place.admin1 ?? null,
      place.country ?? null,
      place.countryCode ?? null,
      latitude,
      longitude,
      new Date().toISOString(),
    )
    .run();

  const created = await db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM saved_locations
       WHERE latitude = ? AND longitude = ?`,
    )
    .bind(latitude, longitude)
    .first<SavedLocation>();

  if (!created) {
    throw new Error("The location was saved but could not be read back.");
  }

  return created;
}

export async function removeSavedLocation(id: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db
    .prepare("DELETE FROM saved_locations WHERE id = ?")
    .bind(id)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}
