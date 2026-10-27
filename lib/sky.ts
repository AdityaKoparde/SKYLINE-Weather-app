import type { ConditionGroup } from "@/lib/types";

export type SkyTheme = {
  base: string;
  glowA: string;
  glowB: string;
  accent: string;
};

const DAY_THEMES: Record<ConditionGroup, SkyTheme> = {
  clear: {
    base: "linear-gradient(165deg, #0d3a76 0%, #0a1a35 48%, #05070f 100%)",
    glowA: "rgba(56, 189, 248, 0.32)",
    glowB: "rgba(251, 191, 36, 0.18)",
    accent: "#7dd3fc",
  },
  partly: {
    base: "linear-gradient(165deg, #12376b 0%, #0a1730 50%, #05070f 100%)",
    glowA: "rgba(125, 211, 252, 0.26)",
    glowB: "rgba(255, 255, 255, 0.1)",
    accent: "#93c5fd",
  },
  cloudy: {
    base: "linear-gradient(165deg, #22303f 0%, #101a29 52%, #05070f 100%)",
    glowA: "rgba(148, 163, 184, 0.22)",
    glowB: "rgba(56, 189, 248, 0.1)",
    accent: "#cbd5e1",
  },
  fog: {
    base: "linear-gradient(165deg, #33414f 0%, #16202c 55%, #05070f 100%)",
    glowA: "rgba(203, 213, 225, 0.2)",
    glowB: "rgba(148, 163, 184, 0.14)",
    accent: "#cbd5e1",
  },
  drizzle: {
    base: "linear-gradient(165deg, #10374f 0%, #0a1929 52%, #05070f 100%)",
    glowA: "rgba(56, 189, 248, 0.22)",
    glowB: "rgba(14, 165, 233, 0.14)",
    accent: "#7dd3fc",
  },
  rain: {
    base: "linear-gradient(165deg, #0b2c55 0%, #081627 52%, #04070e 100%)",
    glowA: "rgba(59, 130, 246, 0.26)",
    glowB: "rgba(56, 189, 248, 0.14)",
    accent: "#60a5fa",
  },
  snow: {
    base: "linear-gradient(165deg, #2a4d6e 0%, #131f2f 55%, #05070f 100%)",
    glowA: "rgba(226, 232, 240, 0.24)",
    glowB: "rgba(147, 197, 253, 0.16)",
    accent: "#bae6fd",
  },
  thunder: {
    base: "linear-gradient(165deg, #2c1a4f 0%, #14102a 52%, #05060f 100%)",
    glowA: "rgba(168, 85, 247, 0.26)",
    glowB: "rgba(250, 204, 21, 0.12)",
    accent: "#c4b5fd",
  },
};

const NIGHT_THEMES: Record<ConditionGroup, SkyTheme> = {
  clear: {
    base: "linear-gradient(165deg, #0a1238 0%, #080c22 50%, #03050c 100%)",
    glowA: "rgba(99, 102, 241, 0.28)",
    glowB: "rgba(14, 165, 233, 0.12)",
    accent: "#a5b4fc",
  },
  partly: {
    base: "linear-gradient(165deg, #0c1435 0%, #080d22 52%, #03050c 100%)",
    glowA: "rgba(129, 140, 248, 0.22)",
    glowB: "rgba(148, 163, 184, 0.1)",
    accent: "#c7d2fe",
  },
  cloudy: {
    base: "linear-gradient(165deg, #161f2e 0%, #0b1220 55%, #03050c 100%)",
    glowA: "rgba(100, 116, 139, 0.2)",
    glowB: "rgba(99, 102, 241, 0.08)",
    accent: "#cbd5e1",
  },
  fog: {
    base: "linear-gradient(165deg, #1d2735 0%, #0e1520 55%, #03050c 100%)",
    glowA: "rgba(148, 163, 184, 0.18)",
    glowB: "rgba(100, 116, 139, 0.12)",
    accent: "#cbd5e1",
  },
  drizzle: {
    base: "linear-gradient(165deg, #0b2033 0%, #07121f 55%, #03050c 100%)",
    glowA: "rgba(56, 189, 248, 0.16)",
    glowB: "rgba(59, 130, 246, 0.1)",
    accent: "#7dd3fc",
  },
  rain: {
    base: "linear-gradient(165deg, #0a1f3d 0%, #07111f 55%, #03050c 100%)",
    glowA: "rgba(59, 130, 246, 0.2)",
    glowB: "rgba(56, 189, 248, 0.1)",
    accent: "#60a5fa",
  },
  snow: {
    base: "linear-gradient(165deg, #16283b 0%, #0b1522 55%, #03050c 100%)",
    glowA: "rgba(203, 213, 225, 0.18)",
    glowB: "rgba(147, 197, 253, 0.12)",
    accent: "#bae6fd",
  },
  thunder: {
    base: "linear-gradient(165deg, #221340 0%, #100c24 55%, #04050e 100%)",
    glowA: "rgba(168, 85, 247, 0.22)",
    glowB: "rgba(250, 204, 21, 0.1)",
    accent: "#c4b5fd",
  },
};

export function skyTheme(group: ConditionGroup, isDay: boolean): SkyTheme {
  return isDay ? DAY_THEMES[group] : NIGHT_THEMES[group];
}
