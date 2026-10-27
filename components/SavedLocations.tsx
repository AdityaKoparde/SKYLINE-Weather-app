"use client";

import { placeSubtitle } from "@/lib/format";
import type { Place, SavedLocation } from "@/lib/types";

type SavedLocationsProps = {
  locations: SavedLocation[];
  activePlace: Place | null;
  removingId: number | null;
  onSelect: (place: Place) => void;
  onRemove: (location: SavedLocation) => void;
  maxLocations: number;
};

function isSamePlace(location: SavedLocation, place: Place | null) {
  if (!place) return false;
  return (
    Math.abs(location.latitude - place.latitude) < 0.01 &&
    Math.abs(location.longitude - place.longitude) < 0.01
  );
}

export default function SavedLocations({
  locations,
  activePlace,
  removingId,
  onSelect,
  onRemove,
  maxLocations,
}: SavedLocationsProps) {
  return (
    <section className="card p-5">
      <header className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-white/90">
          Pinned cities
        </h2>
        <span className="text-xs text-white/40">
          {locations.length}/{maxLocations}
        </span>
      </header>

      {locations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 px-4 py-8 text-center">
          <p className="text-sm text-white/55">
            No pinned cities yet.
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/35">
            Search for a city, then tap <span className="text-white/60">Save city</span>{" "}
            to keep it here for one-tap access.
          </p>
        </div>
      ) : (
        <ul className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1 thin-scrollbar">
          {locations.map((location) => {
            const active = isSamePlace(location, activePlace);
            const subtitle = placeSubtitle(location.admin1, location.country);

            return (
              <li
                key={location.id}
                className={`group flex items-center gap-1 rounded-2xl border transition ${
                  active
                    ? "border-white/25 bg-white/12"
                    : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.07]"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelect({
                      name: location.name,
                      admin1: location.admin1,
                      country: location.country,
                      countryCode: location.countryCode,
                      latitude: location.latitude,
                      longitude: location.longitude,
                    })
                  }
                  aria-current={active ? "true" : undefined}
                  className="min-w-0 flex-1 px-3.5 py-3 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">
                      {location.name}
                    </span>
                    {active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                    )}
                  </span>
                  {subtitle && (
                    <span className="mt-0.5 block truncate text-xs text-white/45">
                      {subtitle}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  aria-label={`Remove ${location.name}`}
                  disabled={removingId === location.id}
                  onClick={() => onRemove(location)}
                  className="mr-1.5 rounded-full p-2 text-white/30 transition hover:bg-rose-400/15 hover:text-rose-200 disabled:opacity-40"
                >
                  {removingId === location.id ? (
                    <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white/80" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
