// ─── sim/modes/crown.ts ────────────────────────────────────────────────────────
// Crown Rush mode logic.
// ─────────────────────────────────────────────────────────────────────────────

import type { CrownState, PlayerState, SimEvent, SimState } from '../../types.js';
import type { Platform } from '../../arena.js';
import {
  BODY_HALF,
  CROWN_HOLDER_SPEED_MULT,
  CROWN_POPUP_VY,
  CROWN_RADIUS,
  CROWN_RESPAWN_DELAY,
  CROWN_SPAWN_X,
  CROWN_SPAWN_Y,
  CROWN_STEAL_PROTECTION_SEC,
} from '../../constants.js';

export function initCrown(state: SimState): void {
  state.mode = 'crown';
  state.timeLeft = 45.0;
  state.eliminated = [];
  state.endTimer = undefined;
  state.crown = {
    x: CROWN_SPAWN_X,
    y: CROWN_SPAWN_Y,
    vx: 0,
    vy: 0,
    holderId: null,
    stealProtection: 0,
    blockedPlayerId: null,
    respawnTimer: 0,
  };
}

export function dropCrown(
  state: SimState,
  player: PlayerState,
  rng: () => number,
): SimEvent[] {
  const events: SimEvent[] = [];
  if (!state.crown || state.crown.holderId !== player.id) return events;

  state.crown.holderId = null;
  state.crown.x = player.x;
  state.crown.y = player.y - 10;
  state.crown.vy = CROWN_POPUP_VY;
  state.crown.vx = -220 + rng() * 440;
  state.crown.blockedPlayerId = player.id;
  state.crown.stealProtection = CROWN_STEAL_PROTECTION_SEC;

  events.push({ type: 'crown_drop', playerId: player.id });
  events.push({
    type: 'toast',
    message: `${player.id} dropped the crown!`,
  });

  return events;
}

export function stealCrown(
  state: SimState,
  thief: PlayerState,
  victim: PlayerState,
): SimEvent[] {
  const events: SimEvent[] = [];
  if (!state.crown || state.crown.holderId !== victim.id) return events;
  if ((state.crown.stealProtection ?? 0) > 0) return events;
  if (thief.isOut) return events;

  state.crown.holderId = thief.id;
  state.crown.blockedPlayerId = victim.id;
  state.crown.stealProtection = CROWN_STEAL_PROTECTION_SEC;

  events.push({
    type: 'crown_steal',
    fromId: victim.id,
    toId: thief.id,
  });
  events.push({
    type: 'toast',
    message: `${thief.id} stole the crown!`,
  });

  return events;
}

export function stepCrown(
  state: SimState,
  dt: number,
  rng: () => number,
): SimEvent[] {
  const events: SimEvent[] = [];
  if (!state.crown) return events;

  const crown = state.crown;

  if (state.timeLeft !== undefined && state.timeLeft > 0) {
    state.timeLeft = Math.max(0, state.timeLeft - dt);
  }

  // End of round check
  if (state.timeLeft !== undefined && state.timeLeft <= 0) {
    if (state.endTimer === undefined) {
      state.endTimer = 1.5;
      const topPlayer = state.players
        .slice()
        .sort((a, b) => (b.crownSeconds ?? 0) - (a.crownSeconds ?? 0))[0];
      if (topPlayer && (topPlayer.crownSeconds ?? 0) > 0) {
        events.push({
          type: 'toast',
          message: `${topPlayer.id} takes the crown!`,
        });
      }
    }
    if (state.endTimer !== undefined) {
      state.endTimer -= dt;
    }
    return events;
  }

  // Decrement steal protection timer
  if (crown.stealProtection > 0) {
    crown.stealProtection = Math.max(0, crown.stealProtection - dt);
    if (crown.stealProtection <= 0) {
      crown.blockedPlayerId = null;
    }
  }

  // ── 1. Crown Held by Player ──────────────────────────────────────────────
  if (crown.holderId) {
    const holder = state.players.find((p) => p.id === crown.holderId);
    if (!holder || holder.isOut) {
      // Holder knocked out: drop crown
      if (holder) {
        events.push(...dropCrown(state, holder, rng));
      } else {
        crown.holderId = null;
      }
    } else {
      // Accumulate holding score (crown seconds)
      holder.crownSeconds = (holder.crownSeconds ?? 0) + dt;
      crown.x = holder.x;
      crown.y = holder.y - BODY_HALF * holder.scale - 10;
    }
  }
  // ── 2. Crown on the ground / falling ─────────────────────────────────────
  else {
    const prevBottom = (crown.y ?? CROWN_SPAWN_Y) + CROWN_RADIUS;
    crown.vy = Math.min((crown.vy ?? 0) + 1500 * dt, 1100);
    crown.vx = (crown.vx ?? 0) * Math.pow(0.05, dt);
    crown.x = (crown.x ?? CROWN_SPAWN_X) + (crown.vx ?? 0) * dt;
    crown.y = (crown.y ?? CROWN_SPAWN_Y) + (crown.vy ?? 0) * dt;

    // Platform collisions
    if ((crown.vy ?? 0) >= 0) {
      const bottom = (crown.y ?? 0) + CROWN_RADIUS;
      const allPlats: Platform[] = [
        ...state.platforms,
        {
          x: state.island.x,
          y: state.island.y || 400,
          w: state.island.w,
        },
      ];

      for (const pl of allPlats) {
        if (
          prevBottom <= pl.y + 6 &&
          bottom >= pl.y &&
          (crown.x ?? 0) > pl.x &&
          (crown.x ?? 0) < pl.x + pl.w
        ) {
          crown.y = pl.y - CROWN_RADIUS;
          crown.vy = 0;
          crown.vx = (crown.vx ?? 0) * 0.5;
          break;
        }
      }
    }

    // Off-screen recovery
    if ((crown.y ?? 0) > 600) {
      crown.respawnTimer = (crown.respawnTimer ?? 0) + dt;
      if (crown.respawnTimer > CROWN_RESPAWN_DELAY) {
        crown.x = CROWN_SPAWN_X;
        crown.y = CROWN_SPAWN_Y;
        crown.vx = 0;
        crown.vy = 0;
        crown.holderId = null;
        crown.blockedPlayerId = null;
        crown.respawnTimer = 0;
      }
    }

    // Pickup check by any alive player
    const alivePlayers = state.players.filter((p) => !p.isOut);
    for (const player of alivePlayers) {
      if (crown.blockedPlayerId === player.id && crown.stealProtection > 0) {
        continue;
      }
      const halfSize = BODY_HALF * player.scale;
      const dist = Math.hypot(
        player.x - (crown.x ?? CROWN_SPAWN_X),
        player.y - (crown.y ?? CROWN_SPAWN_Y),
      );

      if (dist < halfSize + CROWN_RADIUS + 4) {
        crown.holderId = player.id;
        events.push({ type: 'crown_pickup', playerId: player.id });
        events.push({
          type: 'toast',
          message: `${player.id} has the crown!`,
        });
        break;
      }
    }
  }

  return events;
}
