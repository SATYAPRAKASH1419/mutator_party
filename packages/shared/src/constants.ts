// ─── Physics ─────────────────────────────────────────────────────────────────
export const GRAVITY = 1800;  // px/s²
export const RUN_SPEED = 420;   // px/s
export const JUMP_SPEED = 720;   // px/s
export const AIR_JUMP_MULT = 0.88;

// ─── Combat & Shove ──────────────────────────────────────────────────────────
export const SHOVE_COOLDOWN = 0.85; // s
export const SHOVE_RANGE = 62;   // px
export const SHOVE_BASE = 620;  // px/s
export const SHOVE_PER_HIT = 70;   // px/s extra per hit taken

// ─── Modes & Timing ──────────────────────────────────────────────────────────
export const BOMB_FUSE_BASE = 4;   // s
export const BOMB_FUSE_SCALE = 0.6; // s per living player

export const ROUND_TIME: Record<string, number> = {
  brawl: 60,
  bomb: 75,
  crown: 45,
};

export const PHASE_INTRO_SEC = 4;
export const PHASE_PICK_SEC = 10;
export const PHASE_RESULTS_SEC = 6;
export const RAMP_TWIST_COUNT = [1, 1, 2, 2, 3] as const;

// ─── Simulation & Ticks ──────────────────────────────────────────────────────
export const TICK_HZ = 30;
export const DT = 1 / TICK_HZ;

// ─── Enums & Value Sets ──────────────────────────────────────────────────────
export const MODES = ['brawl', 'bomb', 'crown'] as const;
export const TWISTS = ['low', 'heavy', 'tiny', 'giant', 'lotto', 'reverse', 'ice', 'speed', 'flap', 'crumble', 'wind', 'dark', 'bounce'] as const;
export const ITEMS = ['mega', 'freeze', 'swap', 'shield'] as const;
export const THEMES = ['sunny', 'neon', 'candy', 'frozen', 'desert', 'space', 'diwali'] as const;

// ─── Input Flags ─────────────────────────────────────────────────────────────
export const INPUT_LEFT = 1;
export const INPUT_RIGHT = 2;
export const INPUT_JUMP = 4;
export const INPUT_SHOVE = 8;

// ─── Arena & World ───────────────────────────────────────────────────────────
export const ARENA_W = 960;
export const ARENA_H = 540;

// ─── Networking & Room ───────────────────────────────────────────────────────
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;

export const RECONNECT_WINDOW_SEC = 30;
export const AFK_WARN_SEC = 15;
export const AFK_BOT_SEC = 30;

export const POWER_SPOT_RADIUS = 30;

// ─── Player Palette ──────────────────────────────────────────────────────────
export const PLAYER_COLORS = [
  '#FF6B6B',
  '#3DDC97',
  '#8B5CF6',
  '#FFC93C',
  '#4CC9F0',
  '#FF9F1C',
  '#F15BB5',
  '#2EC4B6',
] as const;

// ─── Type Aliases ────────────────────────────────────────────────────────────
export type Mode = typeof MODES[number];
export type Twist = typeof TWISTS[number];
export type Item = typeof ITEMS[number];
export type Theme = typeof THEMES[number];
