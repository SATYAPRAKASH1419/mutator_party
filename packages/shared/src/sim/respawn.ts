// ─── sim/respawn.ts ───────────────────────────────────────────────────────────
// Respawn rules, countdown timers, shield grants, and spawn point selection.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlayerState, RespawnConfig, SimEvent, SimState } from '../types.js';
import { BODY_HALF, RESPAWN_DEFAULT_DELAY_SEC, RESPAWN_SHIELD_DURATION_SEC } from '../constants.js';

export type { RespawnConfig };

/**
 * Triggers a respawn countdown for an eliminated player if rules permit.
 */
export function queueRespawn(
  player: PlayerState,
  config?: RespawnConfig,
): void {
  const mode = config?.mode ?? 'off';
  const delay = config?.delaySec ?? RESPAWN_DEFAULT_DELAY_SEC;

  if (mode === 'unlimited') {
    player.respawnTimer = delay;
  } else if (mode === 'lives') {
    if (player.lives > 1) {
      player.lives -= 1;
      player.respawnTimer = delay;
    }
  }
}

/**
 * Advances respawn timers and spawns players when countdown finishes.
 */
export function stepRespawns(
  state: SimState,
  dt: number,
  rng: () => number,
  config?: RespawnConfig,
): SimEvent[] {
  const events: SimEvent[] = [];
  const shieldSec = config?.shieldSec ?? RESPAWN_SHIELD_DURATION_SEC;
  const where = config?.where ?? 'random_platform';

  for (const player of state.players) {
    if (player.isOut && player.respawnTimer !== undefined && player.respawnTimer > 0) {
      player.respawnTimer -= dt;
      if (player.respawnTimer <= 0) {
        // Find spawn location
        let spawnX = 480;
        let spawnY = 200;

        if (where === 'random_platform' && state.platforms.length > 0) {
          const idx = Math.floor(rng() * state.platforms.length);
          const pl = state.platforms[idx];
          if (pl) {
            spawnX = pl.x + pl.w / 2 + (-20 + rng() * 40);
            spawnY = pl.y - BODY_HALF * player.scale - 80;
          }
        } else if (where === 'top') {
          spawnX = 480 + (-100 + rng() * 200);
          spawnY = 100;
        }

        player.isOut = false;
        player.x = spawnX;
        player.y = spawnY;
        player.vx = 0;
        player.vy = 0;
        player.stunTimer = 0;
        player.freezeTimer = 0;
        player.hitsTaken = 0;
        player.grounded = false;
        player.shieldTimer = shieldSec;

        events.push({
          type: 'respawn',
          playerId: player.id,
          x: spawnX,
          y: spawnY,
        });
      }
    }
  }

  return events;
}
