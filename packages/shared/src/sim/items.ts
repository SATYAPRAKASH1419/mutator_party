// ─── sim/items.ts ─────────────────────────────────────────────────────────────
// Power-up crate lifecycle, first-touch claiming, tie-breaks, and item execution.
// Pure: deterministic PRNG stream.
// ─────────────────────────────────────────────────────────────────────────────

import type { CrateState, PlayerState, SimEvent, SimState, Vec2 } from '../types.js';
import type { Item } from '../constants.js';
import type { Platform } from '../arena.js';
import {
  BODY_HALF,
  CRATE_RADIUS,
  CRATE_BEACON_SEC,
  CRATE_LIFESPAN_SEC,
  CRATE_MAX_ALIVE,
  CRATE_SPAWN_MIN_SEC,
  CRATE_SPAWN_MAX_SEC,
  ITEM_FREEZE_RADIUS,
  ITEM_FREEZE_DURATION_SEC,
  ITEM_SWAP_RADIUS,
  ITEM_SWAP_STUN_SELF,
  ITEM_SWAP_STUN_TARGET,
  ITEM_SHIELD_DURATION_SEC,
  ITEMS,
} from '../constants.js';

/**
 * Updates crate spawning and physics.
 */
export function stepCrates(
  state: SimState,
  dt: number,
  rng: () => number,
  allowedItems?: readonly Item[],
): SimEvent[] {
  const events: SimEvent[] = [];

  if (state.crateTimer === undefined) {
    state.crateTimer = 4.0;
  }
  state.crateTimer -= dt;

  // ── 1. Spawn new crates ──────────────────────────────────────────────────
  if (state.crateTimer <= 0 && state.crates.length < CRATE_MAX_ALIVE) {
    let spawnX = 220 + rng() * 520;
    let spawnY = -30;

    // Use predefined power spots if available
    if (state.powerSpots && state.powerSpots.length > 0) {
      const availableSpots = state.powerSpots.filter((spot) =>
        !state.crates.some((c) => Math.hypot(c.x - spot.x, c.y - spot.y) < 40),
      );
      if (availableSpots.length > 0) {
        const spot = availableSpots[Math.floor(rng() * availableSpots.length)];
        if (spot) {
          spawnX = spot.x;
          spawnY = spot.y;
        }
      }
    }

    const itemPool =
      state.itemConfig?.allowed && state.itemConfig.allowed.length > 0
        ? state.itemConfig.allowed
        : allowedItems && allowedItems.length > 0
        ? allowedItems
        : ITEMS;
    const itemType = itemPool[Math.floor(rng() * itemPool.length)] ?? 'mega';
    const crateId = state.nextCrateId ?? 1;
    state.nextCrateId = crateId + 1;

    const crate: CrateState = {
      id: crateId,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      type: itemType,
      item: itemType,
      state: 'beacon',
      t: CRATE_BEACON_SEC,
    };
    state.crates.push(crate);
    events.push({
      type: 'crate_spawn',
      crateId: crate.id,
      item: itemType,
      x: spawnX,
      y: spawnY,
    });

    state.crateTimer =
      CRATE_SPAWN_MIN_SEC + rng() * (CRATE_SPAWN_MAX_SEC - CRATE_SPAWN_MIN_SEC);
  }

  // ── 2. Crate state & physics ─────────────────────────────────────────────
  for (let i = state.crates.length - 1; i >= 0; i--) {
    const crate = state.crates[i];
    if (!crate) continue;

    if (crate.state === 'beacon') {
      crate.t -= dt;
      if (crate.t <= 0) {
        crate.state = 'live';
        crate.t = CRATE_LIFESPAN_SEC;
      }
    } else if (crate.state === 'live') {
      crate.t -= dt;

      // Fall physics
      const prevBottom = crate.y + CRATE_RADIUS;
      crate.vy = Math.min((crate.vy ?? 0) + 1500 * dt, 1100);
      crate.vx = (crate.vx ?? 0) * Math.pow(0.05, dt);
      crate.x += (crate.vx ?? 0) * dt;
      crate.y += (crate.vy ?? 0) * dt;

      // Platform collisions
      if ((crate.vy ?? 0) >= 0) {
        const bottom = crate.y + CRATE_RADIUS;
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
            crate.x > pl.x &&
            crate.x < pl.x + pl.w
          ) {
            crate.y = pl.y - CRATE_RADIUS;
            crate.vy = 0;
            crate.vx = (crate.vx ?? 0) * 0.5;
            break;
          }
        }
      }

      // Expired or fell off arena
      if (crate.t <= 0 || crate.y > 600) {
        state.crates.splice(i, 1);
      }
    }
  }

  return events;
}

/**
 * Handles first-touch claiming of live crates with tie-breaks.
 */
export function handleCratePickups(
  state: SimState,
  rng: () => number,
): SimEvent[] {
  const events: SimEvent[] = [];
  const alivePlayers = state.players.filter((p) => !p.isOut);

  const isFirstTouch = state.itemConfig?.firstTouch !== false;

  for (let i = state.crates.length - 1; i >= 0; i--) {
    const crate = state.crates[i];
    if (!crate || crate.state !== 'live') continue;

    const item = (crate.type || crate.item) as Item;

    // Check all overlapping players
    const claimants: PlayerState[] = [];
    for (const player of alivePlayers) {
      const halfSize = BODY_HALF * player.scale;
      const dist = Math.hypot(player.x - crate.x, player.y - crate.y);
      if (dist < halfSize + CRATE_RADIUS) {
        claimants.push(player);
      }
    }

    if (claimants.length === 0) continue;

    // First-touch tie break: lower total score wins; then seeded random
    // If firstTouch is disabled in room settings, random pick among overlappers
    claimants.sort((a, b) => {
      if (isFirstTouch && a.score !== b.score) return a.score - b.score;
      return rng() < 0.5 ? -1 : 1;
    });

    const winner = claimants[0];
    if (!winner) continue;

    if (item === 'shield') {
      winner.shieldTimer = ITEM_SHIELD_DURATION_SEC;
      state.crates.splice(i, 1);
      events.push({ type: 'pickup', playerId: winner.id, item: 'shield' });
      events.push({ type: 'toast', message: 'Shield on!' });
    } else if (!winner.item) {
      winner.item = item;
      state.crates.splice(i, 1);
      events.push({ type: 'pickup', playerId: winner.id, item });
      events.push({
        type: 'toast',
        message: `${item.toUpperCase()}! Press Shove to use it.`,
      });
    }
  }

  return events;
}

/**
 * Executes a special item when a player shoves.
 * Returns true if an item was consumed and handled.
 */
export function executeItem(
  attacker: PlayerState,
  state: SimState,
  events: SimEvent[],
  onDropCrown?: (player: PlayerState) => void,
): boolean {
  if (!attacker.item) return false;

  const item = attacker.item;
  attacker.item = null; // consume item
  events.push({ type: 'item_use', playerId: attacker.id, item });

  if (item === 'swap') {
    // Find nearest alive, unshielded rival within SWAP_RADIUS
    let bestTarget: PlayerState | null = null;
    let bestDist = ITEM_SWAP_RADIUS;

    for (const target of state.players) {
      if (target === attacker || target.isOut) continue;
      if (target.shieldTimer && target.shieldTimer > 0) continue;

      const dist = Math.hypot(target.x - attacker.x, target.y - attacker.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = target;
      }
    }

    if (bestTarget) {
      const tempX = attacker.x;
      const tempY = attacker.y;
      const tempVx = attacker.vx;
      const tempVy = attacker.vy;

      attacker.x = bestTarget.x;
      attacker.y = bestTarget.y;
      attacker.vx = bestTarget.vx;
      attacker.vy = bestTarget.vy;

      bestTarget.x = tempX;
      bestTarget.y = tempY;
      bestTarget.vx = tempVx;
      bestTarget.vy = tempVy;

      attacker.stunTimer = ITEM_SWAP_STUN_SELF;
      bestTarget.stunTimer = ITEM_SWAP_STUN_TARGET;

      events.push({
        type: 'toast',
        message: `${attacker.id} swapped with ${bestTarget.id}!`,
      });
    }
    return true;
  }

  if (item === 'freeze') {
    // AoE freeze burst around attacker
    const radius = ITEM_FREEZE_RADIUS * attacker.scale;
    for (const target of state.players) {
      if (target === attacker || target.isOut) continue;
      if (target.shieldTimer && target.shieldTimer > 0) continue;

      const dist = Math.hypot(target.x - attacker.x, target.y - attacker.y);
      const targetHalf = BODY_HALF * target.scale;
      if (dist < radius + targetHalf) {
        target.freezeTimer = ITEM_FREEZE_DURATION_SEC;
        target.stunTimer = Math.max(target.stunTimer, ITEM_FREEZE_DURATION_SEC);
        target.vx *= 0.3;

        if (onDropCrown) {
          onDropCrown(target);
        }
      }
    }
    return true;
  }

  // Mega shove handled by shove combat multiplier
  return false;
}
