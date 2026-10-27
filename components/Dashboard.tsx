"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import CurrentWeather from "@/components/CurrentWeather";
import DailyForecast from "@/components/DailyForecast";
import HourlyChart from "@/components/HourlyChart";
import Metrics from "@/components/Metrics";
import SavedLocations from "@/components/SavedLocations";
import SearchBar from "@/components/SearchBar";
import WeatherIcon from "@/components/WeatherIcon";
import { MAX_SAVED_LOCATIONS } from "@/lib/config";
import { skyTheme } from "@/lib/sky";
import type { Place, SavedLocation, UnitSystem, WeatherReport } from "@/lib/types";

const UNIT_KEY = "skyline:unit";
const PLACE_KEY = "skyline:place";

type DashboardProps = {
  initialSaved: SavedLocation[];
  defaultPlace: Place;
};

type Notice = { kind: "success" | "error"; message: string };

function savedToPlace(location: SavedLocation): Place {
  return {
    name: location.name,
    admin1: location.admin1,
    country: location.country,
    countryCode: location.countryCode,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

function sameCoords(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  return Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="skeleton h-3.5 w-36" />
            <div className="skeleton h-8 w-52" />
            <div className="skeleton mt-6 h-20 w-44" />
            <div className="skeleton h-4 w-64" />
            <div className="skeleton h-3.5 w-48" />
          </div>
          <div className="skeleton h-32 w-32 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card-muted p-4">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-2 h-6 w-24" />
            <div className="skeleton mt-2 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="card p-5 sm:p-6">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton mt-5 h-40 w-full" />
      </div>
    </div>
  );
}

export default function Dashboard({ initialSaved, defaultPlace }: DashboardProps) {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [place, setPlace] = useState<Place>(() =>
    initialSaved[0] ? savedToPlace(initialSaved[0]) : defaultPlace,
  );
  const [report, setReport] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [saved, setSaved] = useState<SavedLocation[]>(initialSaved);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  /* Restore preferences once on the client (keeps server HTML deterministic). */
  useEffect(() => {
    try {
      const storedUnit = window.localStorage.getItem(UNIT_KEY);
      if (storedUnit === "metric" || storedUnit === "imperial") setUnit(storedUnit);

      const storedPlace = window.localStorage.getItem(PLACE_KEY);
      if (storedPlace) {
        const parsed = JSON.parse(storedPlace) as Place;
        if (
          typeof parsed?.name === "string" &&
          Number.isFinite(parsed?.latitude) &&
          Number.isFinite(parsed?.longitude)
        ) {
          setPlace(parsed);
        }
      }
    } catch {
      /* private mode or blocked storage — defaults are fine */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(UNIT_KEY, unit);
    } catch {
      /* ignore */
    }
  }, [unit]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PLACE_KEY, JSON.stringify(place));
    } catch {
      /* ignore */
    }
  }, [place]);

  /* Load the forecast from our own API route. */
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      lat: place.latitude.toFixed(4),
      lon: place.longitude.toFixed(4),
      unit,
      name: place.name,
    });
    if (place.admin1) params.set("admin1", place.admin1);
    if (place.country) params.set("country", place.country);
    if (place.countryCode) params.set("countryCode", place.countryCode);

    fetch(`/api/weather?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as WeatherReport & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load this forecast.");
        }
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setReport(payload);
      })
      .catch((caught: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load this forecast right now.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [place, unit, refreshToken]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const theme = useMemo(
    () =>
      report
        ? skyTheme(report.current.group, report.current.isDay)
        : skyTheme("clear", true),
    [report],
  );

  const savedMatch = useMemo(
    () => saved.find((location) => sameCoords(location, place)) ?? null,
    [saved, place],
  );

  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);

  const handleToggleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    try {
      if (savedMatch) {
        const response = await fetch(`/api/locations?id=${savedMatch.id}`, {
          method: "DELETE",
        });
        if (!response.ok && response.status !== 404) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Could not unpin that city.");
        }
        setSaved((current) => current.filter((item) => item.id !== savedMatch.id));
        setNotice({ kind: "success", message: `${place.name} unpinned.` });
      } else {
        const response = await fetch("/api/locations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(place),
        });
        const payload = (await response.json().catch(() => null)) as
          | { location?: SavedLocation; error?: string }
          | null;

        if (!response.ok || !payload?.location) {
          throw new Error(payload?.error ?? "Could not pin that city.");
        }

        const created = payload.location;
        setSaved((current) => [
          created,
          ...current.filter((item) => item.id !== created.id),
        ]);
        setNotice({ kind: "success", message: `${place.name} pinned to your cities.` });
      }
    } catch (caught) {
      setNotice({
        kind: "error",
        message:
          caught instanceof Error ? caught.message : "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }, [place, savedMatch, saving]);

  const handleRemoveSaved = useCallback(async (location: SavedLocation) => {
    setRemovingId(location.id);
    try {
      const response = await fetch(`/api/locations?id=${location.id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 404) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Could not remove that city.");
      }
      setSaved((current) => current.filter((item) => item.id !== location.id));
      setNotice({ kind: "success", message: `${location.name} unpinned.` });
    } catch (caught) {
      setNotice({
        kind: "error",
        message:
          caught instanceof Error ? caught.message : "Something went wrong.",
      });
    } finally {
      setRemovingId(null);
    }
  }, []);

  return (
    <div
      className="relative min-h-dvh transition-[background] duration-700"
      style={{ background: theme.base }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(58% 42% at 10% 0%, ${theme.glowA}, transparent 68%), radial-gradient(45% 35% at 92% 6%, ${theme.glowB}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6 lg:pt-9">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/12 bg-white/[0.08] backdrop-blur-xl">
              <WeatherIcon
                group={report?.current.group ?? "partly"}
                isDay={report?.current.isDay ?? true}
                className="h-8 w-8"
                animated={false}
              />
            </div>
            <div>
              <p className="text-[17px] font-semibold leading-tight tracking-tight text-white">
                Skyline
              </p>
              <p className="text-[11px] text-white/45">Live weather, any city</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Temperature units"
              className="flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] p-1 backdrop-blur-xl"
            >
              {(["metric", "imperial"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={unit === option}
                  onClick={() => setUnit(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    unit === option
                      ? "bg-white text-slate-900 shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {option === "metric" ? "°C" : "°F"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={refresh}
              aria-label="Refresh forecast"
              title="Refresh forecast"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-white/70 backdrop-blur-xl transition hover:bg-white/12 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3.5 12a8.5 8.5 0 0 1 14.7-5.8M20.5 12a8.5 8.5 0 0 1-14.7 5.8" />
                <path d="M18.5 3.2v3.2h-3.2M5.5 20.8v-3.2h3.2" />
              </svg>
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-5">
          <main className="min-w-0 space-y-4">
            <SearchBar onSelect={setPlace} />

            {error && report && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                <span>{error} Showing the last forecast we loaded.</span>
                <button
                  type="button"
                  onClick={refresh}
                  className="rounded-full border border-amber-200/30 px-3 py-1 text-xs font-medium transition hover:bg-amber-200/10"
                >
                  Retry
                </button>
              </div>
            )}

            {!report && error && (
              <div className="card flex flex-col items-start gap-3 p-6">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-400/15 text-rose-200">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 8v5M12 16.5v.2" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-medium text-white">
                    We couldn’t load the forecast
                  </p>
                  <p className="mt-1 text-sm text-white/55">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={refresh}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
                >
                  Try again
                </button>
              </div>
            )}

            {!report && !error && <LoadingSkeleton />}

            {report && (
              <div
                className={`space-y-4 transition-opacity duration-300 ${
                  loading ? "opacity-60" : "opacity-100"
                }`}
              >
                <CurrentWeather
                  report={report}
                  accent={theme.accent}
                  isSaved={Boolean(savedMatch)}
                  saving={saving}
                  onToggleSave={handleToggleSave}
                />

                <Metrics report={report} />

                <section className="card p-5 sm:p-6">
                  <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-sm font-semibold text-white/90">
                      Next 24 hours
                    </h2>
                    <span className="text-xs text-white/40">
                      {report.location.name} · {report.units.temperature}
                    </span>
                  </header>
                  <HourlyChart report={report} accent={theme.accent} />
                </section>

                <section className="card p-5 sm:p-6">
                  <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-sm font-semibold text-white/90">
                      7-day forecast
                    </h2>
                    <span className="text-xs text-white/40">
                      Rain chance · daily range
                    </span>
                  </header>
                  <DailyForecast report={report} />
                </section>
              </div>
            )}
          </main>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <SavedLocations
              locations={saved}
              activePlace={place}
              removingId={removingId}
              onSelect={setPlace}
              onRemove={handleRemoveSaved}
              maxLocations={MAX_SAVED_LOCATIONS}
            />

            <section className="card p-5">
              <h2 className="text-[11px] uppercase tracking-[0.16em] text-white/35">
                How it’s built
              </h2>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-white/50">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-300/70" />
                  Next.js route handlers proxy and normalise the forecast
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-300/70" />
                  Live data from Open-Meteo — no API key needed
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-300/70" />
                  Pinned cities persisted in SQLite
                </li>
              </ul>
            </section>
          </aside>
        </div>

        <footer className="mt-10 text-center text-[11px] text-white/30">
          Skyline · Weather data by Open-Meteo · Built with Next.js &amp; SQLite
        </footer>
      </div>

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div
            role="status"
            className={`animate-fade-up rounded-full border px-4 py-2.5 text-sm shadow-2xl backdrop-blur-xl ${
              notice.kind === "error"
                ? "border-rose-300/30 bg-rose-950/85 text-rose-100"
                : "border-emerald-300/25 bg-emerald-950/85 text-emerald-100"
            }`}
          >
            {notice.message}
          </div>
        </div>
      )}
    </div>
  );
}
