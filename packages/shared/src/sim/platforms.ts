// ─── sim/platforms.ts ─────────────────────────────────────────────────────────
// Floor and one-way floating platform collision resolution.
// Called AFTER movement integrates position, BEFORE kill-zone check.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlayerState } from '../types.js';
import type { Platform } from '../arena.js';
import {
  FLOOR_Y, BODY_HALF, COYOTE_TIME,
} from '../constants.js';

/**
 * Resolves collisions between a player and all platforms (including floor island).
 * One-way: player can jump up through platforms; only lands on top.
 * Mutates player in place.
 */
export function applyPlatforms(
  player: PlayerState,
  platforms: Platform[],
  dt: number,
): void {
  if (player.isOut) return;

  const halfW = BODY_HALF * player.scale;  // player half-width at current scale
  const halfH = BODY_HALF * player.scale;  // player half-height (square body)

  // Player's feet and sides this tick
  const feetY  = player.y + halfH;
  const prevFeetY = feetY - player.vy * dt; // feet position last tick

  // Track whether we land this tick
  let landed = false;

  // ── Floating platforms (one-way) ─────────────────────────────────────────
  for (const plat of platforms) {
    // Horizontal overlap check
    const overlapX =
      player.x + halfW > plat.x &&
      player.x - halfW < plat.x + plat.w;

    if (!overlapX) continue;

    // One-way: only land when falling (vy > 0) and crossing the top surface
    const platTop = plat.y;
    const crossingTop = prevFeetY <= platTop && feetY >= platTop;

    if (player.vy >= 0 && crossingTop) {
      player.y  = platTop - halfH;  // snap feet to platform top
      player.vy = 0;
      landed    = true;
    }
  }

  // ── Floor (island tiles at FLOOR_Y) ──────────────────────────────────────
  if (!landed) {
    const floorTop   = FLOOR_Y;
    const crossFloor = (feetY - player.vy * dt) <= floorTop && feetY >= floorTop;

    if (player.vy >= 0 && crossFloor) {
      player.y  = floorTop - halfH;
      player.vy = 0;
      landed    = true;
    }
  }

  // ── Grounded / coyote state update ───────────────────────────────────────
  if (landed) {
    if (!player.grounded) {
      // Just landed — reset air jumps
      player.airJumpsLeft = 1;
    }
    player.grounded    = true;
    player.coyoteTimer = 0;
  } else {
    if (player.grounded) {
      // Just left ground — open coyote window
      player.coyoteTimer = COYOTE_TIME;
    }
    player.grounded = false;
  }
}

