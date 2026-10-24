import type { Theme } from "@mutator-party/shared";

export interface ThemeColors {
  skyTop: number;
  skyBottom: number;
  islandFill: number;
  islandEdge: number;
  platformFill: number;
  platformEdge: number;
  ink: number;
  dangerGlow: number;
  isNight: boolean;
}

export const THEME_PALETTES: Record<Theme, ThemeColors> = {
  sunny: {
    skyTop: 0x8edbff,
    skyBottom: 0xfff0c9,
    islandFill: 0xf2a65a, // Warm terracotta from screenshot
    islandEdge: 0xc97a2c, // Darker orange bottom edge
    platformFill: 0x9ff0ce, // Vibrant mint green
    platformEdge: 0x5dc9a0, // Darker teal edge
    ink: 0x1b1b3a,
    dangerGlow: 0xff6b6b,
    isNight: false,
  },
  neon: {
    skyTop: 0x0f0c29,
    skyBottom: 0x302b63,
    islandFill: 0x24243e,
    islandEdge: 0x00f5d4,
    platformFill: 0x24243e,
    platformEdge: 0xf72585,
    ink: 0x1b1b3a,
    dangerGlow: 0xff0055,
    isNight: true,
  },
  candy: {
    skyTop: 0xffcbf2,
    skyBottom: 0xf15bb5,
    islandFill: 0xfff0f5,
    islandEdge: 0x1b1b3a,
    platformFill: 0xffe5ec,
    platformEdge: 0x1b1b3a,
    ink: 0x1b1b3a,
    dangerGlow: 0xff3366,
    isNight: false,
  },
  frozen: {
    skyTop: 0xa0c4ff,
    skyBottom: 0xcbf3f0,
    islandFill: 0xc8f0ff,
    islandEdge: 0x8fd0ea,
    platformFill: 0xd7f5ff,
    platformEdge: 0x8fd0ea,
    ink: 0x1b1b3a,
    dangerGlow: 0x3a86ff,
    isNight: false,
  },
  desert: {
    skyTop: 0xffb703,
    skyBottom: 0xfb8500,
    islandFill: 0xffe8d6,
    islandEdge: 0x6f1d1b,
    platformFill: 0xddbea9,
    platformEdge: 0x6f1d1b,
    ink: 0x1b1b3a,
    dangerGlow: 0xd90429,
    isNight: false,
  },
  space: {
    skyTop: 0x0b091a,
    skyBottom: 0x1a142f,
    islandFill: 0x2e2547,
    islandEdge: 0x7b2cbf,
    platformFill: 0x241d3b,
    platformEdge: 0x9d4edd,
    ink: 0x1b1b3a,
    dangerGlow: 0x9d4edd,
    isNight: true,
  },
  diwali: {
    skyTop: 0x3a0ca3,
    skyBottom: 0x7209b7,
    islandFill: 0xffd166,
    islandEdge: 0x480ca8,
    platformFill: 0xf72585,
    platformEdge: 0x480ca8,
    ink: 0x1b1b3a,
    dangerGlow: 0xffaa00,
    isNight: true,
  },
};

export function getThemeColors(theme: Theme = "sunny"): ThemeColors {
  return THEME_PALETTES[theme] || THEME_PALETTES.sunny;
}
