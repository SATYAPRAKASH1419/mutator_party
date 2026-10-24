import {
  type Twist,
  type Item,
  type Theme,
} from "@mutator-party/shared";

// Twist metadata with icons & names
export const TWIST_INFO: Record<Twist, { name: string; icon: string }> = {
  low: { name: "Moon Gravity", icon: "🌙" },
  heavy: { name: "Heavy Boots", icon: "⚓" },
  tiny: { name: "Tiny Tots", icon: "🐭" },
  giant: { name: "Big Boys", icon: "🦣" },
  lotto: { name: "Size Lottery", icon: "🎲" },
  reverse: { name: "Reversed", icon: "🙃" },
  ice: { name: "Ice Rink", icon: "🧊" },
  speed: { name: "Turbo", icon: "⚡" },
  flap: { name: "Flappy", icon: "🐦" },
  crumble: { name: "Crumbling", icon: "🕳️" },
  wind: { name: "Gale Force", icon: "💨" },
  dark: { name: "Lights Out", icon: "🔦" },
  bounce: { name: "Trampoline", icon: "🦘" },
};

// Item metadata with icons
export const ITEM_INFO: Record<Item, { name: string; icon: string }> = {
  mega: { name: "Mega Shove", icon: "💥" },
  freeze: { name: "Freeze", icon: "🧊" },
  swap: { name: "Swap", icon: "🔀" },
  shield: { name: "Shield", icon: "🛡️" },
};

// Theme metadata
export const THEME_INFO: Record<Theme, { name: string; bg: string }> = {
  sunny: {
    name: "Sunny Island",
    bg: "linear-gradient(180deg, #8EDBFF 0%, #FFF0C9 100%)",
  },
  neon: {
    name: "Neon Night",
    bg: "linear-gradient(180deg, #1B0B3B 0%, #3B1B5B 100%)",
  },
  candy: {
    name: "Candy Land",
    bg: "linear-gradient(180deg, #FFD1DC 0%, #FFE6EA 100%)",
  },
  frozen: {
    name: "Frozen Peak",
    bg: "linear-gradient(180deg, #D4F1F9 0%, #E8F8FC 100%)",
  },
  desert: {
    name: "Desert Dunes",
    bg: "linear-gradient(180deg, #FFB347 0%, #FFCC80 100%)",
  },
  space: {
    name: "Space Station",
    bg: "linear-gradient(180deg, #0B0B1E 0%, #1A1A3A 100%)",
  },
  diwali: {
    name: "Diwali Lights",
    bg: "linear-gradient(180deg, #4A0E2E 0%, #801830 100%)",
  },
};

export const stepperBtnStyle = {
  border: "none",
  background: "transparent",
  padding: "4px 10px",
  fontSize: "16px",
  fontWeight: 900,
  cursor: "pointer",
  color: "var(--mp-ink)",
};

export const inputStyle = {
  padding: "6px 12px",
  borderRadius: "9999px",
  border: "2.5px solid var(--mp-ink)",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 900,
  outline: "none",
  width: "clamp(160px, 40vw, 220px)",
  background: "#fff",
  color: "var(--mp-ink)",
  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
};

