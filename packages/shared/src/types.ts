// ─── types.ts ────────────────────────────────────────────────────────────────
// Shared simulation state types. No external dependencies.
// ─────────────────────────────────────────────────────────────────────────────

import type { Platform } from './arena.js';

export type { Platform };

// ── Vectors ──────────────────────────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
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
  isOut: boolean;             // eliminated this round
  isBot: boolean;
  score: number;
  lives: number;
}

// ── Tiles (crumble twist) ─────────────────────────────────────────────────────

export interface TileState {
  id: number;
  fallen: boolean;
  fallTimer: number;          // seconds until this tile falls
}

// ── RNG ──────────────────────────────────────────────────────────────────────

export interface RngStreams {
  events: number;             // uint32 mulberry32 state for in-sim randomness
}

// ── Events (emitted per step, drained by the room) ───────────────────────────

export type SimEvent =
  | { type: 'ko';        playerId: string }
  | { type: 'shove_hit'; attackerId: string; targetId: string };

// ── Items & Objects ───────────────────────────────────────────────────────────

export interface CrateState {
  id: number;
  x: number;
  y: number;
  state: 'beacon' | 'live';  // beacon = about to spawn, live = claimable
  t: number;                 // timer: beacon countdown or life remaining (s)
  item: string | null;       // assigned item type
}

export interface BombState {
  holderId: string;
  fuse: number;              // seconds remaining before explosion
}

export interface CrownState {
  holderId: string;
  stealProtection: number;   // seconds remaining (1.0 s after steal)
}

// ── Top-level simulation state ────────────────────────────────────────────────

export interface SimState {
  tick: number;               // increments each step
  rng: RngStreams;
  players: PlayerState[];
  platforms: Platform[];      // floating platforms from arena
  tileStates: TileState[];    // crumble tile states
  crates: CrateState[];       // power-up crates on the field
  bomb?: BombState;           // present only in bomb mode
  crown?: CrownState;         // present only in crown mode
  events: SimEvent[];         // cleared each step after being drained
}
