import { formatHour } from "@/lib/format";
import type { WeatherReport } from "@/lib/types";

type HourlyChartProps = {
  report: WeatherReport;
  accent: string;
};

type Point = { x: number; y: number };

/** Catmull-Rom style smoothing rendered as cubic beziers. */
function smoothPath(points: Point[]): string {
  if (points.length < 2) return "";
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

const WIDTH = 720;
const PAD_X = 26;
const TOP = 44;
const PLOT_HEIGHT = 100;
const BAR_BASELINE = 202;
const BAR_MAX_HEIGHT = 32;
const HEIGHT = 244;
const LABEL_STEP = 3;

export default function HourlyChart({ report, accent }: HourlyChartProps) {
  const hours = report.hourly;

  if (hours.length < 2) {
    return (
      <p className="px-2 py-6 text-sm text-white/50">
        Hourly data is not available for this location.
      </p>
    );
  }

  const temperatures = hours.map((hour) => hour.temperature);
  const warmest = Math.max(...temperatures);
  const coldest = Math.min(...temperatures);
  const spread = Math.max(warmest - coldest, 4);
  const midpoint = (warmest + coldest) / 2;
  const min = midpoint - spread / 2;
  const max = midpoint + spread / 2;

  const step = (WIDTH - PAD_X * 2) / (hours.length - 1);
  const xAt = (index: number) => PAD_X + index * step;
  const yAt = (temperature: number) =>
    TOP + (1 - (temperature - min) / (max - min)) * PLOT_HEIGHT;

  const points = hours.map((hour, index) => ({
    ...hour,
    x: xAt(index),
    y: yAt(hour.temperature),
  }));

  const linePath = smoothPath(points);
  const baseline = TOP + PLOT_HEIGHT;
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${baseline} L ${points[0].x.toFixed(2)} ${baseline} Z`;

  const highestChance = Math.max(...hours.map((hour) => hour.precipitationProbability));

  return (
    <div className="-mx-1 overflow-x-auto no-scrollbar">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full min-w-[560px]"
        role="img"
        aria-label={`Hourly temperature for the next 24 hours, from ${Math.round(hours[0].temperature)} to ${Math.round(warmest)} degrees`}
      >
        <defs>
          <linearGradient id="hourly-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* guide lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = TOP + PLOT_HEIGHT - ratio * PLOT_HEIGHT;
          return (
            <line
              key={ratio}
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.07)"
              strokeDasharray="2 7"
            />
          );
        })}

        {/* rain chance bars */}
        {points.map((point) => {
          const pct = point.precipitationProbability;
          const height = Math.max(3, (pct / 100) * BAR_MAX_HEIGHT);
          return (
            <rect
              key={`bar-${point.time}`}
              x={point.x - 3.5}
              y={BAR_BASELINE - height}
              width={7}
              height={height}
              rx={3.5}
              fill={accent}
              opacity={pct > 0 ? 0.55 : 0.12}
            />
          );
        })}

        <path d={areaPath} fill="url(#hourly-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke={accent}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={`point-${point.time}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={index === 0 ? 4.6 : 2.8}
              fill="#0b1220"
              stroke={accent}
              strokeWidth={index === 0 ? 2.4 : 1.8}
            />

            {index % LABEL_STEP === 0 && (
              <text
                x={point.x}
                y={point.y - 14}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="rgba(255,255,255,0.85)"
              >
                {Math.round(point.temperature)}°
              </text>
            )}

            {(index % LABEL_STEP === 0 || index === points.length - 1) && (
              <text
                x={point.x}
                y={HEIGHT - 12}
                textAnchor="middle"
                fontSize="10.5"
                fill={index === 0 ? accent : "rgba(255,255,255,0.5)"}
              >
                {index === 0 ? "Now" : formatHour(point.time)}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="mt-1 flex flex-wrap items-center gap-4 px-1 text-[11px] text-white/45">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-5 rounded-full"
            style={{ background: accent }}
          />
          Temperature
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[3px]"
            style={{ background: accent, opacity: 0.55 }}
          />
          Chance of rain (max {highestChance}%)
        </span>
      </div>
    </div>
  );
}
