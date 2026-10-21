// ─── sim/modes/bomb.ts ─────────────────────────────────────────────────────────
// Bomb Tag mode logic.
// ─────────────────────────────────────────────────────────────────────────────

import type { BombState, PlayerState, SimEvent, SimState } from '../../types.js';
import {
  BOMB_FUSE_BASE,
  BOMB_FUSE_SCALE,
  BOMB_PASS_COOLDOWN,
  BOMB_BLAST_RADIUS,
  BLAST_SPEED_MAX,
  BOMB_INITIAL_DELAY,
  BOMB_NEXT_DELAY,
} from '../../constants.js';

export function initBomb(state: SimState): void {
  state.mode = 'bomb';
  state.timeLeft = 75.0;
  state.eliminated = [];
  state.endTimer = undefined;
  state.bomb = {
    holderId: null,
    fuse: 0,
    maxFuse: 0,
    passCooldown: 0,
    delay: BOMB_INITIAL_DELAY,
  };
}

export function passBomb(
  state: SimState,
  fromPlayer: PlayerState,
  toPlayer: PlayerState,
  events: SimEvent[],
): boolean {
  if (!state.bomb || state.bomb.holderId !== fromPlayer.id) return false;
  if ((state.bomb.passCooldown ?? 0) > 0) return false;
  if ((toPlayer.shieldTimer ?? 0) > 0) return false;
  if (toPlayer.isOut) return false;

  state.bomb.holderId = toPlayer.id;
  state.bomb.passCooldown = BOMB_PASS_COOLDOWN;

  events.push({
    type: 'bomb_pass',
    fromId: fromPlayer.id,
    toId: toPlayer.id,
  });
  events.push({
    type: 'toast',
    message: `${toPlayer.id} has the bomb!`,
  });

  return true;
}

export function stepBomb(
  state: SimState,
  dt: number,
  rng: () => number,
): SimEvent[] {
  const events: SimEvent[] = [];
  if (!state.bomb) return events;

  if (state.timeLeft !== undefined && state.timeLeft > 0) {
    state.timeLeft = Math.max(0, state.timeLeft - dt);
  }

  const alivePlayers = state.players.filter((p) => !p.isOut);

  // Round over check
  if (
    alivePlayers.length <= 1 ||
    (state.timeLeft !== undefined && state.timeLeft <= 0)
  ) {
    if (state.endTimer === undefined) {
      state.endTimer = 1.5;
      const winner = alivePlayers[0];
      if (winner) {
        events.push({
          type: 'toast',
          message: `${winner.id} survived Bomb Tag!`,
        });
      }
    }
    if (state.endTimer !== undefined) {
      state.endTimer -= dt;
    }
    return events;
  }

  // Pass cooldown decrement
  if (state.bomb.passCooldown && state.bomb.passCooldown > 0) {
    state.bomb.passCooldown = Math.max(0, state.bomb.passCooldown - dt);
  }

  // ── No Holder: Delay countdown to assign new holder ────────────────────────
  if (!state.bomb.holderId) {
    state.bomb.delay = (state.bomb.delay ?? BOMB_NEXT_DELAY) - dt;
    if (state.bomb.delay <= 0 && alivePlayers.length > 1) {
      const idx = Math.floor(rng() * alivePlayers.length);
      const chosen = alivePlayers[idx];
      if (chosen) {
        const fuse = BOMB_FUSE_BASE + alivePlayers.length * BOMB_FUSE_SCALE;

        state.bomb.holderId = chosen.id;
        state.bomb.fuse = fuse;
        state.bomb.maxFuse = fuse;
        state.bomb.passCooldown = 0.6;

        events.push({
          type: 'toast',
          message: `${chosen.id} has the bomb!`,
        });
      }
    }
  } else {
    // ── Holder Active: Countdown fuse ───────────────────────────────────────
    state.bomb.fuse -= dt;

    const holder = state.players.find((p) => p.id === state.bomb!.holderId);
    if (!holder || holder.isOut) {
      // Holder fell or was eliminated
      state.bomb.holderId = null;
      state.bomb.delay = 1.0;
    } else if (state.bomb.fuse <= 0) {
      // ── BOMB EXPLOSION ────────────────────────────────────────────────────
      holder.isOut = true;
      if (!state.eliminated) state.eliminated = [];
      state.eliminated.push(holder.id);

      events.push({ type: 'bomb_explode', holderId: holder.id });
      events.push({ type: 'ko', playerId: holder.id });
      events.push({
        type: 'toast',
        message: `${holder.id} blew up!`,
      });

      // Blast knockback to bystanders
      for (const bystander of state.players) {
        if (bystander === holder || bystander.isOut) continue;
        if ((bystander.shieldTimer ?? 0) > 0) continue;

        const dx = bystander.x - holder.x;
        const dy = bystander.y - holder.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < BOMB_BLAST_RADIUS) {
          const k = 1 - dist / 330;
          bystander.vx += (dx / dist) * BLAST_SPEED_MAX * k;
          bystander.vy = Math.min(bystander.vy, 0) - 300 * k;
          bystander.stunTimer = 0.3;
          bystander.grounded = false;
        }
      }

      state.bomb.holderId = null;
      state.bomb.delay = BOMB_NEXT_DELAY;
    }
  }

  return events;
}
