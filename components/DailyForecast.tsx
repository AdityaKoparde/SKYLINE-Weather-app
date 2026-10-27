import WeatherIcon from "@/components/WeatherIcon";
import { formatDayLabel, formatShortDate } from "@/lib/format";
import type { WeatherReport } from "@/lib/types";

type DailyForecastProps = {
  report: WeatherReport;
};

export default function DailyForecast({ report }: DailyForecastProps) {
  const days = report.daily;

  if (days.length === 0) {
    return (
      <p className="px-2 py-6 text-sm text-white/50">
        The daily forecast is not available for this location.
      </p>
    );
  }

  const weekMin = Math.min(...days.map((day) => day.low));
  const weekMax = Math.max(...days.map((day) => day.high));
  const range = Math.max(weekMax - weekMin, 1);

  return (
    <ul>
      {days.map((day, index) => {
        const offset = ((day.low - weekMin) / range) * 100;
        const width = Math.max(((day.high - day.low) / range) * 100, 7);

        return (
          <li
            key={day.date}
            className="grid grid-cols-[88px_36px_46px_minmax(0,1fr)] items-center gap-3 rounded-xl px-1 py-2.5 transition hover:bg-white/[0.04] sm:grid-cols-[112px_40px_54px_minmax(0,1fr)]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white/90">
                {formatDayLabel(day.date, index)}
              </p>
              <p className="text-[11px] text-white/40">{formatShortDate(day.date)}</p>
            </div>

            <div className="flex justify-center" title={day.label}>
              <WeatherIcon
                group={day.group}
                className="h-8 w-8"
                animated={false}
              />
            </div>

            <span
              className={`text-xs ${
                day.precipitationProbability > 0 ? "text-sky-200/80" : "text-white/25"
              }`}
            >
              {day.precipitationProbability > 0
                ? `${day.precipitationProbability}%`
                : "—"}
            </span>

            <div className="flex items-center gap-2.5">
              <span className="w-8 text-right text-xs text-white/45">
                {Math.round(day.low)}°
              </span>

              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    left: `${offset}%`,
                    width: `${width}%`,
                    background:
                      "linear-gradient(90deg, rgba(125,211,252,0.9), rgba(251,191,36,0.95))",
                  }}
                />
              </div>

              <span className="w-8 text-xs font-medium text-white/90">
                {Math.round(day.high)}°
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
