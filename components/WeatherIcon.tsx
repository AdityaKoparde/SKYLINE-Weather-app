import type { ConditionGroup } from "@/lib/types";

type WeatherIconProps = {
  group: ConditionGroup;
  isDay?: boolean;
  className?: string;
  animated?: boolean;
};

const CLOUD = "#e2e8f0";
const CLOUD_SOFT = "rgba(226, 232, 240, 0.55)";
const RAIN = "#7dd3fc";
const SNOW = "#dbeafe";
const BOLT = "#facc15";
const SUN = "#fbbf24";
const SUN_LIGHT = "#fcd34d";
const MOON = "#e0e7ff";

function Sun({ cx = 32, cy = 32, r = 12, spin = false }: {
  cx?: number;
  cy?: number;
  r?: number;
  spin?: boolean;
}) {
  const rays = Array.from({ length: 8 }, (_, index) => {
    const inner = r + 6;
    const outer = r + 11;
    return (
      <line
        key={index}
        x1={cx}
        y1={cy - inner}
        x2={cx}
        y2={cy - outer}
        stroke={SUN_LIGHT}
        strokeWidth="2.6"
        strokeLinecap="round"
        transform={`rotate(${index * 45} ${cx} ${cy})`}
      />
    );
  });

  return (
    <g>
      <g className={spin ? "animate-spin-slow" : undefined} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {rays}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={SUN} />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.55} fill={SUN_LIGHT} opacity="0.65" />
    </g>
  );
}

function Cloud({ x = 0, y = 0, opacity = 1, scale = 1 }: {
  x?: number;
  y?: number;
  opacity?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <rect x="16" y="31" width="30" height="15" rx="7.5" fill={CLOUD} />
      <circle cx="26" cy="33" r="9" fill={CLOUD} />
      <circle cx="35" cy="28" r="11.5" fill={CLOUD} />
      <circle cx="44" cy="34" r="8.5" fill={CLOUD} />
    </g>
  );
}

function RainDrops({ count = 3, offsetY = 0 }: { count?: number; offsetY?: number }) {
  const xs = count === 3 ? [24, 33, 42] : [27, 38];
  return (
    <g transform={`translate(0 ${offsetY})`}>
      {xs.map((x, index) => (
        <line
          key={x}
          x1={x}
          y1={49}
          x2={x - 1.5}
          y2={54}
          stroke={RAIN}
          strokeWidth="2.8"
          strokeLinecap="round"
          className="drop"
          style={{ animationDelay: `${index * 0.32}s` }}
        />
      ))}
    </g>
  );
}

function SnowFlakes() {
  const flakes = [
    { x: 24, y: 52 },
    { x: 33, y: 58 },
    { x: 42, y: 52 },
  ];
  return (
    <g stroke={SNOW} strokeWidth="1.8" strokeLinecap="round" className="drop">
      {flakes.map(({ x, y }) => (
        <g key={`${x}-${y}`}>
          <line x1={x - 2.5} y1={y} x2={x + 2.5} y2={y} />
          <line x1={x} y1={y - 2.5} x2={x} y2={y + 2.5} />
          <line x1={x - 1.8} y1={y - 1.8} x2={x + 1.8} y2={y + 1.8} />
          <line x1={x - 1.8} y1={y + 1.8} x2={x + 1.8} y2={y - 1.8} />
        </g>
      ))}
    </g>
  );
}

export default function WeatherIcon({
  group,
  isDay = true,
  className = "h-16 w-16",
  animated = true,
}: WeatherIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={group}
      fill="none"
    >
      {group === "clear" &&
        (isDay ? (
          <Sun cx={32} cy={32} r={13} spin={animated} />
        ) : (
          <g>
            <circle cx="32" cy="32" r="15" fill={MOON} />
            <circle cx="27" cy="28" r="3.2" fill="rgba(148, 163, 184, 0.35)" />
            <circle cx="36" cy="36" r="2.2" fill="rgba(148, 163, 184, 0.3)" />
            <circle cx="35" cy="25" r="1.6" fill="rgba(148, 163, 184, 0.3)" />
          </g>
        ))}

      {group === "partly" && (
        <g>
          {isDay ? (
            <Sun cx={25} cy={24} r={9} spin={animated} />
          ) : (
            <circle cx="25" cy="24" r="10" fill={MOON} />
          )}
          <Cloud x={4} y={10} scale={0.92} />
        </g>
      )}

      {group === "cloudy" && (
        <g>
          <Cloud x={-7} y={-4} scale={0.8} opacity={0.55} />
          <Cloud x={5} y={7} scale={0.95} />
        </g>
      )}

      {group === "fog" && (
        <g>
          <Cloud y={-4} opacity={0.9} />
          {[52, 57, 62].map((y, index) => (
            <line
              key={y}
              x1={18 + index * 3}
              y1={y}
              x2={46 - index * 3}
              y2={y}
              stroke={CLOUD_SOFT}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {group === "drizzle" && (
        <g>
          <Cloud y={-2} />
          <RainDrops count={2} />
        </g>
      )}

      {group === "rain" && (
        <g>
          <Cloud y={-2} />
          <RainDrops count={3} />
        </g>
      )}

      {group === "snow" && (
        <g>
          <Cloud y={-4} />
          <SnowFlakes />
        </g>
      )}

      {group === "thunder" && (
        <g>
          <Cloud y={-4} />
          <path d="M34 44 L26 56 h6 l-2.5 8 L41 51 h-6 l3.5 -7 Z" fill={BOLT} />
        </g>
      )}
    </svg>
  );
}
