// ─── types.ts ────────────────────────────────────────────────────────────────
// Shared simulation state types. No external dependencies.
// ─────────────────────────────────────────────────────────────────────────────

import type { Platform } from './arena.js';
import type { Item, Mode, Twist } from './constants.js';

export type { Platform, Item, Mode, Twist };

// ── Vectors ──────────────────────────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

export interface Island {
  x: number;
  y: number;
  w: number;
  tiles: number;
}

export interface BotMemory {
  thinkingTimer: number;
  targetId: string | null;
  mood: number;
}

// ── Player ───────────────────────────────────────────────────────────────────

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  vx: number; // velocity in x 
  vy: number; // velocity in y
  facingRight: boolean;
  grounded: boolean;
  airJumpsLeft: number;       // 1 normally; depleted on air-jump
  coyoteTimer: number;        // seconds remaining (0.09 s window)
  jumpBufferTimer: number;    // seconds remaining (0.12 s window)
  shoveTimer: number;         // cooldown remaining in seconds (0.85 s)
  stunTimer: number;          // stun remaining in seconds (0.22 s)
  hitsTaken: number;          // damage counter; used in knockback formula
  scale: number;              // 1.0 default; tiny=0.55, giant=1.7
  targetScale?: number;       // target scale interpolation
  isOut: boolean;             // eliminated this round
  isBot: boolean;
  score: number;
  lives: number;

  // Bot AI memory
  botMemory?: BotMemory;

  // Items & Status
  item?: Item | null;
  shieldTimer?: number;       // invulnerability seconds remaining
  freezeTimer?: number;       // freeze seconds remaining
  respawnTimer?: number;      // countdown to respawn
  crownSeconds?: number;      // seconds crown held this round
}

// ── Tiles (crumble twist) ─────────────────────────────────────────────────────

export interface TileState {
  id: number;
  state?: 'ok' | 'warn' | 'fall';
  tm?: number;                // warn countdown or timer
  dy?: number;                // vertical offset when falling
  vy?: number;                // falling velocity
  fallen: boolean;            // true if fallen off / inactive
  fallTimer: number;          // seconds until this tile falls (legacy/sim)
}

// ── RNG ──────────────────────────────────────────────────────────────────────

export interface RngStreams {
  events: number;             // uint32 mulberry32 state for in-sim randomness
}

// ── Events (emitted per step, drained by the room) ───────────────────────────

export type SimEvent =
  | { type: 'ko';            playerId: string }
  | { type: 'shove_hit';     attackerId: string; targetId: string }
  | { type: 'bomb_pass';     fromId: string; toId: string }
  | { type: 'bomb_explode';  holderId: string }
  | { type: 'crown_steal';   fromId: string; toId: string }
  | { type: 'crown_drop';    playerId: string }
  | { type: 'crown_pickup';  playerId: string }
  | { type: 'pickup';        playerId: string; item: Item }
  | { type: 'item_use';      playerId: string; item: Item }
  | { type: 'toast';         message: string; color?: string }
  | { type: 'crate_spawn';   crateId: number; item: Item; x: number; y: number }
  | { type: 'respawn';       playerId: string; x: number; y: number };

// ── Items & Objects ───────────────────────────────────────────────────────────

export interface CrateState {
  id: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  type?: Item;               // preferred field
  state: 'beacon' | 'live';  // beacon = about to spawn, live = claimable
  t: number;                 // timer: beacon countdown or life remaining (s)
  item: string | null;       // legacy field compatibility
}

export interface BombState {
  holderId: string | null;
  fuse: number;              // seconds remaining before explosion
  maxFuse?: number;          // starting fuse for current possession
  passCooldown?: number;     // seconds before bomb can be passed again
  delay?: number;            // delay before assigning next bomb holder
}

export interface CrownState {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  holderId: string | null;
  stealProtection: number;   // seconds remaining (1.0 s after steal)
  blockedPlayerId?: string | null;
  respawnTimer?: number;
}

// ── Top-level simulation state ────────────────────────────────────────────────

export interface SimState {
  tick: number;               // increments each step
  rng: RngStreams;
  players: PlayerState[];
  island: Island;             // floor island bounds
  platforms: Platform[];      // floating platforms from arena
  tileStates: TileState[];    // crumble tile states
  crates: CrateState[];       // power-up crates on the field
  mode?: Mode;                // active mode ('brawl' | 'bomb' | 'crown')
  timeLeft?: number;          // remaining round seconds
  endTimer?: number;          // post-round delay countdown
  eliminated?: string[];      // order of KO elimination
  wind?: { dir: 1 | -1; timer: number };
  nextCrumbleTime?: number;
  crateTimer?: number;
  powerSpots?: Vec2[];
  bomb?: BombState;           // present only in bomb mode
  crown?: CrownState;         // present only in crown mode
  events: SimEvent[];         // cleared each step after being drained
}
