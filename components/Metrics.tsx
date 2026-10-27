import {
  compassDirection,
  formatNumber,
  formatTemperature,
  humidityDescription,
  pressureDescription,
  uvDescription,
  visibilityDescription,
  windDescription,
} from "@/lib/format";
import type { WeatherReport } from "@/lib/types";

type MetricsProps = {
  report: WeatherReport;
};

function Tile({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-muted flex items-start gap-3 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-medium leading-tight text-white">
          {value}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/45">{detail}</p>
      </div>
    </div>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export default function Metrics({ report }: MetricsProps) {
  const { current, units } = report;
  const windUnit = units.wind;
  const speedKmh = windUnit === "mph" ? current.windSpeed * 1.60934 : current.windSpeed;
  const feelsDelta = Math.round(current.feelsLike - current.temperature);

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Tile
        label="Feels like"
        value={formatTemperature(current.feelsLike)}
        detail={
          Math.abs(feelsDelta) < 2
            ? "Close to the actual temperature"
            : `${Math.abs(feelsDelta)}° ${feelsDelta > 0 ? "warmer" : "cooler"} than actual`
        }
        icon={
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" {...stroke}>
            <path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4.5 4.5 0 1 1-4 0Z" />
          </svg>
        }
      />
      <Tile
        label="Humidity"
        value={`${current.humidity}%`}
        detail={humidityDescription(current.humidity)}
        icon={
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" {...stroke}>
            <path d="M12 3.5s6 6.1 6 10a6 6 0 0 1-12 0c0-3.9 6-10 6-10Z" />
          </svg>
        }
      />
      <Tile
        label="Wind"
        value={`${formatNumber(current.windSpeed)} ${windUnit}`}
        detail={`${compassDirection(current.windDirection)} · ${windDescription(speedKmh)}`}
        icon={
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" {...stroke}>
            <path d="M3 8h11a3 3 0 1 0-3-3" />
            <path d="M3 12h14a3 3 0 1 1-3 3" />
            <path d="M3 16h7" />
          </svg>
        }
      />
      <Tile
        label="UV index"
        value={current.uvIndex != null ? formatNumber(current.uvIndex) : "—"}
        detail={uvDescription(current.uvIndex)}
        icon={
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" {...stroke}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
          </svg>
        }
      />
      <Tile
        label="Visibility"
        value={
          current.visibility != null
            ? `${formatNumber(current.visibility)} ${units.distance}`
            : "—"
        }
        detail={visibilityDescription(
          current.visibility == null
            ? null
            : units.distance === "mi"
              ? current.visibility * 1.60934
              : current.visibility,
        )}
        icon={
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" {...stroke}>
            <path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
        }
      />
      <Tile
        label="Pressure"
        value={`${Math.round(current.pressure)} ${units.pressure}`}
        detail={pressureDescription(current.pressure)}
        icon={
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" {...stroke}>
            <circle cx="12" cy="13" r="8" />
            <path d="M12 13l3.5-2.5" />
            <path d="M9 4h6" />
          </svg>
        }
      />
    </section>
  );
}
