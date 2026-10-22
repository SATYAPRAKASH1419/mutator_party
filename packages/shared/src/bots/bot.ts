// ─── bots/bot.ts ─────────────────────────────────────────────────────────────
// Deterministic Bot AI with edge safety, goal tracking, and difficulty scaling.
// Pure: outputs 4-bit encoded input bitmask for the simulation.
// ─────────────────────────────────────────────────────────────────────────────

import type { Platform } from '../arena.js';
import type { BotMemory, Island, PlayerState, SimState, TileState } from '../types.js';
import { encodeBits } from '../input.js';
import { BODY_HALF, SHOVE_RANGE } from '../constants.js';

export type BotSkill = 'easy' | 'normal' | 'hard';
export type { BotMemory };

/**
 * Helper to check whether solid ground exists directly below a given coordinate.
 */
export function hasGroundBelow(
  x: number,
  feetY: number,
  platforms: Platform[],
  island: Island,
  tileStates?: TileState[],
): boolean {
  // Check floating platforms
  for (const pl of platforms) {
    if (x >= pl.x && x <= pl.x + pl.w && pl.y >= feetY - 6 && pl.y <= feetY + 120) {
      return true;
    }
  }

  // Check island floor tiles
  const floorTop = island.y || 400;
  if (floorTop >= feetY - 6 && floorTop <= feetY + 120) {
    const tileWidth = island.w / Math.max(1, island.tiles || 1);
    const tileIdx = Math.floor((x - island.x) / tileWidth);
    if (tileIdx >= 0 && tileIdx < (island.tiles || 1)) {
      const isFallen = tileStates?.find((t) => t.id === tileIdx)?.fallen;
      if (!isFallen) return true;
    }
  }

  return false;
}

/**
 * Computes deterministic bot input for a given tick.
 */
export function computeBotInput(
  bot: PlayerState,
  state: SimState,
  rng: () => number,
  skill?: BotSkill,
): number {
  if (bot.isOut) return 0;

  const effectiveSkill: BotSkill = skill ?? bot.botSkill ?? state.botSkill ?? 'normal';

  let mem = bot.botMemory;
  if (!mem) {
    mem = { thinkingTimer: 0, targetId: null, mood: rng() };
    bot.botMemory = mem;
  }

  const dt = 1 / 30;
  mem.thinkingTimer -= dt;

  const reactionDelay = effectiveSkill === 'hard' ? 0.08 : effectiveSkill === 'normal' ? 0.2 : 0.35;
  const mistakeProb = effectiveSkill === 'hard' ? 0.0 : effectiveSkill === 'normal' ? 0.02 : 0.08;

  // ── 1. Target Evaluation & Decision Refresh ──────────────────────────────
  if (mem.thinkingTimer <= 0) {
    mem.thinkingTimer = reactionDelay + rng() * 0.1;
    mem.mood = rng();

    let bestTarget: PlayerState | null = null;
    let bestDist = 1e9;

    for (const other of state.players) {
      if (other === bot || other.isOut) continue;
      const dist = Math.hypot(other.x - bot.x, (other.y - bot.y) * 1.3);
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = other;
      }
    }
    mem.targetId = bestTarget ? bestTarget.id : null;
  }

  const target = mem.targetId
    ? state.players.find((p) => p.id === mem.targetId && !p.isOut) ?? null
    : null;

  let goX = target ? target.x : 480;
  let shoveAllowed = true;
  let wantJump = false;

  const mode = state.mode ?? 'brawl';
  const halfSize = BODY_HALF * bot.scale;

  // ── 2. Mode Objectives ───────────────────────────────────────────────────
  if (mode === 'brawl') {
    if (bot.hitsTaken > 2 && mem.mood < 0.6) {
      goX = 480; // Retreat toward island center
    }
  } else if (mode === 'bomb') {
    const bomb = state.bomb;
    const isHolder = bomb?.holderId === bot.id;

    if (isHolder) {
      // Chase nearest rival to pass the bomb!
      if (target) goX = target.x;
      shoveAllowed = true;
    } else if (bomb?.holderId) {
      const bombHolder = state.players.find((p) => p.id === bomb.holderId);
      if (bombHolder && !bombHolder.isOut) {
        shoveAllowed = false;
        const awayDir = Math.sign(bot.x - bombHolder.x) || 1;
        const distToHolder = Math.abs(bombHolder.x - bot.x);
        // Flee if bomb holder is close
        goX = distToHolder < 260 ? bot.x + awayDir * 200 : 480;
      }
    }
  } else if (mode === 'crown') {
    const crown = state.crown;
    const isCrownHolder = crown?.holderId === bot.id;

    if (isCrownHolder) {
      // Evade rivals
      if (target) {
        const awayDir = Math.sign(bot.x - target.x) || 1;
        goX = bot.x + awayDir * 200;
        shoveAllowed = Math.abs(target.x - bot.x) < 80;
      }
    } else if (crown?.holderId) {
      const holder = state.players.find((p) => p.id === crown.holderId);
      if (holder && !holder.isOut) {
        goX = holder.x;
      }
    } else if (crown) {
      // Crown is dropped or floating: navigate toward it
      goX = crown.x ?? 480;
      if ((crown.y ?? 0) < bot.y - 60 && Math.abs((crown.x ?? 480) - bot.x) < 140 && bot.grounded) {
        wantJump = true;
      }
    }
  }

  // ── 3. Power-up Crates ───────────────────────────────────────────────────
  if (mode !== 'bomb' && state.crates.length > 0 && !bot.item) {
    const liveCrate = state.crates.find(
      (c) => c.state === 'live' && Math.abs(c.x - bot.x) < 260 && Math.abs(c.y - bot.y) < 140,
    );
    if (liveCrate && mem.mood > 0.35 && state.crown?.holderId !== bot.id) {
      goX = liveCrate.x;
    }
  }

  // Arena clamp
  goX = Math.max(60, Math.min(900, goX));

  // Recovery jump if falling off edge
  if (!bot.grounded && !hasGroundBelow(bot.x, bot.y + halfSize, state.platforms, state.island, state.tileStates) && bot.y > 360) {
    goX = 480;
    if (bot.vy > 100 && bot.airJumpsLeft > 0) {
      wantJump = true;
    }
  }

  // ── 4. Edge Safety & Movement Direction ──────────────────────────────────
  const dx = goX - bot.x;
  let dir = Math.abs(dx) > 22 ? Math.sign(dx) : 0;

  // Check if stepping forward would walk off a ledge into empty space
  if (bot.grounded && dir !== 0) {
    const probeX = bot.x + dir * (halfSize + 26);
    const hasGround = hasGroundBelow(
      probeX,
      bot.y + halfSize,
      state.platforms,
      state.island,
      state.tileStates,
    );
    // Don't step off unless making a rare mistake on easy/normal
    if (!hasGround && rng() > mistakeProb) {
      dir = 0;
    }
  }

  const left = dir < 0;
  const right = dir > 0;

  // Jump conditions
  if (bot.grounded) {
    if (target && target.y < bot.y - 70 && Math.abs(target.x - bot.x) < 160 && mem.mood > 0.4) {
      wantJump = true;
    }
    // Occasional hop
    if (rng() < dt * 0.25) {
      wantJump = true;
    }
  }

  // ── 5. Shove Combat ──────────────────────────────────────────────────────
  let wantShove = false;
  if (shoveAllowed && target && bot.shoveTimer <= 0 && mem.mood > 0.25) {
    const targetHalf = BODY_HALF * target.scale;
    const dist = Math.hypot(target.x - bot.x, target.y - bot.y);
    const effectiveRange = SHOVE_RANGE * bot.scale + targetHalf + 10;
    if (dist < effectiveRange) {
      wantShove = true;
    }
  }

  return encodeBits({
    left,
    right,
    jump: wantJump,
    shove: wantShove,
  });
}
