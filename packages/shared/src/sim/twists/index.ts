// ─── sim/twists/index.ts ───────────────────────────────────────────────────────
// Twists catalog, category exclusion rules, setup and runtime step logic.
// Pure: deterministic PRNG passed in as function or derived from state.
// ─────────────────────────────────────────────────────────────────────────────

import type { Twist } from '../../constants.js';
import type { SimState } from '../../types.js';
import {
  TWIST_TINY_SCALE,
  TWIST_GIANT_SCALE,
  TWIST_LOTTO_MIN,
  TWIST_LOTTO_MAX,
  TWIST_WIND_MIN_SEC,
  TWIST_WIND_MAX_SEC,
  TWIST_CRUMBLE_FIRST_SEC,
  TWIST_CRUMBLE_INTERVAL_SEC,
  TWIST_CRUMBLE_WARN_SEC,
} from '../../constants.js';

export type TwistCategory = 'g' | 's' | 'c' | 'j' | 'w';

export interface TwistDef {
  id: Twist;
  cat: TwistCategory;
  name: string;
  tag: string;
  icon: string;
}

export const TWIST_CATALOG: readonly TwistDef[] = [
  { id: 'low',     cat: 'g', name: 'Moon Gravity',      tag: 'Jump to the sky',          icon: '🌙' },
  { id: 'heavy',   cat: 'g', name: 'Heavy Boots',       tag: 'Short hops, hard landings', icon: '⚓' },
  { id: 'tiny',    cat: 's', name: 'Tiny Tots',         tag: 'Everyone shrinks',          icon: '🐭' },
  { id: 'giant',   cat: 's', name: 'Big Boys',          tag: 'Everyone is huge',          icon: '🦣' },
  { id: 'lotto',   cat: 's', name: 'Size Lottery',      tag: 'Random size for each',      icon: '🎲' },
  { id: 'reverse', cat: 'c', name: 'Reversed Controls', tag: 'Left is right',             icon: '🙃' },
  { id: 'ice',     cat: 'c', name: 'Ice Rink',          tag: 'Zero grip',                 icon: '🧊' },
  { id: 'speed',   cat: 'c', name: 'Turbo',             tag: 'Everything is fast',        icon: '⚡' },
  { id: 'flap',    cat: 'j', name: 'Flappy Mode',       tag: 'Jump any time, anywhere',   icon: '🐦' },
  { id: 'crumble', cat: 'w', name: 'Crumbling Floor',   tag: 'The ground falls apart',    icon: '🕳️' },
  { id: 'wind',    cat: 'w', name: 'Gale Force',        tag: 'Wind keeps changing',       icon: '💨' },
  { id: 'dark',    cat: 'w', name: 'Lights Out',        tag: 'You see only what is near', icon: '🔦' },
  { id: 'bounce',  cat: 'w', name: 'Trampoline Land',   tag: 'Land and you spring',       icon: '🦘' },
] as const;

export const TWIST_MAP = new Map<Twist, TwistDef>(
  TWIST_CATALOG.map((t) => [t.id, t]),
);

/**
 * Validates that no two active twists share the same category.
 */
export function validateTwistExclusion(twists: readonly Twist[]): boolean {
  const seen = new Set<TwistCategory>();
  for (const twistId of twists) {
    const def = TWIST_MAP.get(twistId);
    if (!def) return false;
    if (seen.has(def.cat)) return false;
    seen.add(def.cat);
  }
  return true;
}

/**
 * Deterministically picks `n` mutators with category exclusion.
 */
export function pickMutators(
  n: number,
  forced: Twist | null,
  rng: () => number,
): Twist[] {
  const selectedCats = new Set<TwistCategory>();
  const out: Twist[] = [];

  if (forced) {
    const forcedDef = TWIST_MAP.get(forced);
    if (forcedDef) {
      selectedCats.add(forcedDef.cat);
      out.push(forced);
    }
  }

  // Shuffle available twists
  const pool = TWIST_CATALOG.filter((t) => t.id !== forced);
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }

  for (const def of shuffled) {
    if (out.length >= n) break;
    if (!selectedCats.has(def.cat)) {
      selectedCats.add(def.cat);
      out.push(def.id);
    }
  }

  return out;
}

/**
 * Applies twist modifications to state at round start.
 */
export function setupTwists(
  state: SimState,
  twists: readonly Twist[],
  rng: () => number,
): void {
  const isTiny = twists.includes('tiny');
  const isGiant = twists.includes('giant');
  const isLotto = twists.includes('lotto');

  for (const player of state.players) {
    if (isTiny) {
      player.scale = TWIST_TINY_SCALE;
      player.targetScale = TWIST_TINY_SCALE;
    } else if (isGiant) {
      player.scale = TWIST_GIANT_SCALE;
      player.targetScale = TWIST_GIANT_SCALE;
    } else if (isLotto) {
      const scale = TWIST_LOTTO_MIN + rng() * (TWIST_LOTTO_MAX - TWIST_LOTTO_MIN);
      player.scale = Math.round(scale * 100) / 100;
      player.targetScale = player.scale;
    } else {
      player.scale = 1.0;
      player.targetScale = 1.0;
    }
  }

  // Crumble initialization
  state.nextCrumbleTime = twists.includes('crumble')
    ? TWIST_CRUMBLE_FIRST_SEC
    : 40.0;

  // Initialize tile states if needed
  if (!state.tileStates || state.tileStates.length === 0) {
    const tileCount = state.island.tiles || 6;
    state.tileStates = Array.from({ length: tileCount }, (_, id) => ({
      id,
      state: 'ok',
      tm: 0,
      dy: 0,
      vy: 0,
      fallen: false,
      fallTimer: 0,
    }));
  }

  // Wind initialization
  state.wind = {
    dir: rng() < 0.5 ? -1 : 1,
    timer: TWIST_WIND_MIN_SEC + rng() * (TWIST_WIND_MAX_SEC - TWIST_WIND_MIN_SEC),
  };
}

/**
 * Per-tick simulation update for world twists (wind, crumbling floor).
 */
export function stepTwists(
  state: SimState,
  twists: readonly Twist[],
  dt: number,
  rng: () => number,
): void {
  // ── 1. Wind Twist ────────────────────────────────────────────────────────
  if (twists.includes('wind')) {
    if (!state.wind) {
      state.wind = { dir: 1, timer: 3.0 };
    }
    state.wind.timer -= dt;
    if (state.wind.timer <= 0) {
      state.wind.dir = rng() < 0.5 ? -1 : 1;
      state.wind.timer =
        TWIST_WIND_MIN_SEC + rng() * (TWIST_WIND_MAX_SEC - TWIST_WIND_MIN_SEC);
    }
  }

  // ── 2. Crumble Twist ─────────────────────────────────────────────────────
  if (state.nextCrumbleTime !== undefined) {
    state.nextCrumbleTime -= dt;
    if (state.nextCrumbleTime <= 0) {
      // Pick a random un-fallen tile to warn
      const okTiles = state.tileStates.filter(
        (t) => !t.fallen && (t.state === 'ok' || !t.state),
      );
      if (okTiles.length > 0) {
        const idx = Math.floor(rng() * okTiles.length);
        const chosen = okTiles[idx];
        if (chosen) {
          chosen.state = 'warn';
          chosen.tm = TWIST_CRUMBLE_WARN_SEC;
        }
      }
      state.nextCrumbleTime = twists.includes('crumble')
        ? TWIST_CRUMBLE_INTERVAL_SEC
        : 3.5;
    }
  }

  // Update tile animations & fall states
  for (const tile of state.tileStates) {
    if (tile.state === 'warn') {
      tile.tm = (tile.tm ?? TWIST_CRUMBLE_WARN_SEC) - dt;
      if (tile.tm <= 0) {
        tile.state = 'fall';
        tile.fallen = true;
        tile.vy = 0;
      }
    } else if (tile.state === 'fall') {
      tile.vy = (tile.vy ?? 0) + 1500 * dt;
      tile.dy = (tile.dy ?? 0) + tile.vy * dt;
    }
  }
}
