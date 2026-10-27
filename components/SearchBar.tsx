"use client";

import { useEffect, useRef, useState } from "react";

import { placeSubtitle } from "@/lib/format";
import type { GeocodeResult, Place } from "@/lib/types";

type SearchBarProps = {
  onSelect: (place: Place) => void;
};

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const showPanel = open && trimmed.length >= 2;

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    // Don't keep stale matches on screen while a new query is in flight.
    setResults([]);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          results?: GeocodeResult[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Search failed.");
        }

        setResults(data.results ?? []);
        setHighlight(0);
        setError(null);
        setOpen(true);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not search for places right now.",
        );
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  function choose(place: GeocodeResult) {
    onSelect({
      name: place.name,
      admin1: place.admin1 ?? null,
      country: place.country ?? null,
      countryCode: place.countryCode ?? null,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone ?? null,
    });
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showPanel || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const place = results[highlight];
      if (place) choose(place);
    }
  }

  return (
    <div
      className="relative z-30"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16.5 16.5 4 4" strokeLinecap="round" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search a city, e.g. Mumbai, Berlin, Tokyo…"
          aria-label="Search for a city"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="city-search-results"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-2xl border border-white/15 bg-white/[0.1] py-3.5 pl-12 pr-11 text-[15px] text-white placeholder:text-white/45 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl outline-none transition focus:border-white/30 focus:bg-white/[0.14] focus:ring-2 focus:ring-sky-300/25 [&::-webkit-search-cancel-button]:hidden"
        />

        {searching && (
          <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-white/25 border-t-white/80" />
        )}
        {!searching && query.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {showPanel && (
        <div
          id="city-search-results"
          className="panel-solid absolute left-0 right-0 top-[calc(100%+0.5rem)] max-h-80 overflow-y-auto p-2 thin-scrollbar"
        >
          {error && (
            <p className="px-3 py-4 text-sm text-rose-200/90">{error}</p>
          )}

          {!error && searching && (
            <p className="flex items-center gap-2 px-3 py-4 text-sm text-white/70">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white/80" />
              Searching for “{trimmed}”…
            </p>
          )}

          {!error && !searching && results.length === 0 && (
            <p className="px-3 py-4 text-sm text-white/60">
              No places match “{trimmed}”. Try a different spelling.
            </p>
          )}

          {!searching && results.length > 0 && (
            <ul role="listbox" aria-label="Search results" className="space-y-0.5">
              {results.map((place, index) => {
                const subtitle = placeSubtitle(place.admin1, place.country);
                return (
                  <li key={`${place.id}-${place.latitude}-${place.longitude}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === highlight}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => choose(place)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        index === highlight
                          ? "bg-white/15 ring-1 ring-inset ring-white/10"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <span className="mt-0.5 text-white/45">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                          <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
                          <circle cx="12" cy="10" r="2.6" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">
                          {place.name}
                        </span>
                        {subtitle && (
                          <span className="block truncate text-xs text-white/50">
                            {subtitle}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
