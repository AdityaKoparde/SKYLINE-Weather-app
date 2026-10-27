import WeatherIcon from "@/components/WeatherIcon";
import {
  formatClock,
  formatSunTime,
  formatTemperature,
  placeSubtitle,
} from "@/lib/format";
import type { WeatherReport } from "@/lib/types";

type CurrentWeatherProps = {
  report: WeatherReport;
  accent: string;
  isSaved: boolean;
  saving: boolean;
  onToggleSave: () => void;
};

export default function CurrentWeather({
  report,
  accent,
  isSaved,
  saving,
  onToggleSave,
}: CurrentWeatherProps) {
  const { current, location, units } = report;
  const subtitle = placeSubtitle(location.admin1, location.country);
  const unitLetter = units.temperature.replace("°", "");
  const updated = new Date(report.fetchedAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section className="card relative overflow-hidden p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full blur-3xl"
        style={{ background: accent, opacity: 0.16 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
        }}
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-white/60">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.6" />
            </svg>
            <span className="truncate">{subtitle || "Current location"}</span>
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h1 className="truncate text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {location.name}
            </h1>

            <button
              type="button"
              onClick={onToggleSave}
              disabled={saving}
              aria-pressed={isSaved}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                isSaved
                  ? "border-amber-300/40 bg-amber-300/15 text-amber-100 hover:bg-amber-300/20"
                  : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
              }`}
            >
              {saving ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill={isSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {isSaved ? "Saved" : "Save city"}
            </button>
          </div>

          <div className="mt-6 flex items-start">
            <span className="text-[82px] font-extralight leading-[0.82] tracking-[-0.05em] text-white sm:text-[104px]">
              {Math.round(current.temperature)}
            </span>
            <span className="mt-2 ml-1 flex items-start gap-1">
              <span className="text-3xl font-light text-white/80 sm:text-4xl">°</span>
              <span className="mt-2 text-sm font-medium text-white/45">
                {unitLetter}
              </span>
            </span>
          </div>

          <p className="mt-3 text-lg font-medium text-white/90">{current.label}</p>
          <p className="mt-1 text-sm text-white/55">
            Feels like {formatTemperature(current.feelsLike)} · High{" "}
            {formatTemperature(current.high)} · Low{" "}
            {formatTemperature(current.low)}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" strokeLinecap="round" />
              </svg>
              {formatClock(current.time)} local · {location.timezoneAbbr}
            </span>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M17 18a5 5 0 0 0 0-10 6 6 0 0 0-11.6 2A4 4 0 0 0 6 18Z" />
              </svg>
              Updated {updated}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-4 sm:flex-col sm:items-end sm:gap-5">
          <div
            className="relative grid place-items-center"
            style={{ filter: `drop-shadow(0 18px 40px ${accent}44)` }}
          >
            <WeatherIcon
              group={current.group}
              isDay={current.isDay}
              className="h-36 w-36 sm:h-40 sm:w-40 animate-float"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
              Sunrise
            </p>
            <p className="text-sm font-medium text-white/85">
              {formatSunTime(current.sunrise)}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/40">
              Sunset
            </p>
            <p className="text-sm font-medium text-white/85">
              {formatSunTime(current.sunset)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
