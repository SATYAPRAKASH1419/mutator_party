// ─── sim/step.ts ──────────────────────────────────────────────────────────────
// Pure deterministic fixed-timestep simulation tick.
// step(state, inputs, dt) → mutated state + drained events.
// R2: no Date.now(), no Math.random(), dt = 1/30 always.
// ─────────────────────────────────────────────────────────────────────────────

import type { SimState, SimEvent, PlayerState } from '../types.js';
import type { DecodedInput } from '../input.js';
import type { Twist } from '../constants.js';
import { decodeBits } from '../input.js';
import { BODY_HALF, BOMB_HOLDER_SPEED_MULT, CROWN_HOLDER_SPEED_MULT, BOMB_PASS_KICK } from '../constants.js';
import { applyMovement } from './movement.js';
import { applyPlatforms } from './platforms.js';
import { applyShove } from './shove.js';
import { stepTwists } from './twists/index.js';
import { executeItem, handleCratePickups, stepCrates } from './items.js';
import { passBomb, stepBomb } from './modes/bomb.js';
import { dropCrown, stealCrown, stepCrown } from './modes/crown.js';
import { stepBrawl } from './modes/brawl.js';
import { queueRespawn, stepRespawns } from './respawn.js';
import { computeBotInput } from '../bots/bot.js';

/**
 * Advances the simulation by one fixed timestep.
 *
 * @param state   - Current sim state (mutated in place)
 * @param inputs  - Map of playerId → packed input bits for this tick
 * @param twists  - Active twist ids this round
 * @param dt      - Timestep in seconds (always 1/30)
 * @returns       - Array of SimEvents emitted this tick
 */
export function step(
  state: SimState,
  inputs: ReadonlyMap<string, number>,
  twists: readonly Twist[] = [],
  dt: number = 1 / 30,
): SimEvent[] {
  // Clear events from the previous tick
  state.events.length = 0;
  const events: SimEvent[] = [];

  // Deterministic PRNG from state.rng.events
  let rngState = state.rng?.events ?? 123456789;
  const rng = (): number => {
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const reverse = twists.includes('reverse');

  // ── 1. Gather & decode inputs (generate bot inputs if needed) ────────────
  const decoded = new Map<string, DecodedInput>();
  for (const player of state.players) {
    let bits: number;
    if (inputs.has(player.id)) {
      bits = inputs.get(player.id)!;
    } else if (player.isBot) {
      bits = computeBotInput(player, state, rng, player.botSkill ?? state.botSkill);
    } else {
      bits = 0;
    }

    let input = decodeBits(bits);
    // 'reverse' twist: swap left and right for everyone (spec s13.2)
    if (reverse) {
      input = { ...input, left: input.right, right: input.left };
    }
    decoded.set(player.id, input);
  }

  // Helper for crown drop on hit / freeze / KO
  const onDropCrown = (player: PlayerState): void => {
    if (state.mode === 'crown' && state.crown?.holderId === player.id) {
      events.push(...dropCrown(state, player, rng));
    }
  };

  // ── 2. Item execution & Shove combat ─────────────────────────────────────
  for (const attacker of state.players) {
    if (attacker.isOut) continue;
    const input = decoded.get(attacker.id)!;
    if (!input.shove) continue;

    // Check if player has special item to use (Freeze, Swap)
    const usedSpecial = executeItem(attacker, state, events, onDropCrown);
    if (usedSpecial) {
      attacker.shoveTimer = 0.85;
      continue;
    }

    // Standard shove (with Mega check & Bomb/Crown triggers)
    applyShove(attacker, state.players, events, {
      onHit: (atk, target) => {
        // Bomb pass on shove
        if (state.mode === 'bomb' && state.bomb) {
          if (state.bomb.holderId === atk.id) {
            passBomb(state, atk, target, events);
          } else if (state.bomb.holderId === target.id) {
            passBomb(state, target, atk, events);
          }
        }

        // Crown steal on shove
        if (state.mode === 'crown' && state.crown) {
          if (state.crown.holderId === target.id) {
            events.push(...stealCrown(state, atk, target));
          }
        }
      },
    });
  }

  // ── 3. Body collisions & touch bomb passing ──────────────────────────────
  const alivePlayers = state.players.filter((p) => !p.isOut);
  for (let i = 0; i < alivePlayers.length; i++) {
    for (let j = i + 1; j < alivePlayers.length; j++) {
      const a = alivePlayers[i];
      const b = alivePlayers[j];
      if (!a || !b) continue;
      const aHalf = BODY_HALF * a.scale;
      const bHalf = BODY_HALF * b.scale;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDistance = (aHalf + bHalf) * 0.95;

      if (dist < minDistance && dist > 0.001) {
        const overlap = minDistance - dist;
        const sx = Math.sign(dx) || (rng() < 0.5 ? 1 : -1);
        const massA = a.scale * a.scale;
        const massB = b.scale * b.scale;
        const totalMass = massA + massB;

        a.x -= (sx * overlap * massB) / totalMass;
        b.x += (sx * overlap * massA) / totalMass;
        a.vx -= sx * 40;
        b.vx += sx * 40;

        // Bomb pass on body contact (with demo rebound kick)
        if (state.mode === 'bomb' && state.bomb) {
          if (state.bomb.holderId === a.id) {
            passBomb(state, a, b, events, BOMB_PASS_KICK);
          } else if (state.bomb.holderId === b.id) {
            passBomb(state, b, a, events, BOMB_PASS_KICK);
          }
        }
      }
    }
  }

  // ── 4. Movement integration & Kill Zones ─────────────────────────────────
  for (const player of state.players) {
    if (player.isOut) continue;

    let speedMult = 1.0;
    if (state.mode === 'bomb' && state.bomb?.holderId === player.id) {
      speedMult *= BOMB_HOLDER_SPEED_MULT;
    }
    if (state.mode === 'crown' && state.crown?.holderId === player.id) {
      speedMult *= CROWN_HOLDER_SPEED_MULT;
    }

    const input = decoded.get(player.id)!;
    const koEvents = applyMovement(player, input, dt, twists, {
      windDir: state.wind?.dir,
      speedMult,
    });

    for (const evt of koEvents) {
      events.push(evt);
      if (evt.type === 'ko') {
        if (!state.eliminated) state.eliminated = [];
        state.eliminated.push(player.id);
        onDropCrown(player);

        // In crown mode, always queue respawn
        if (state.mode === 'crown') {
          player.respawnTimer = 1.5;
        } else {
          queueRespawn(player, state.respawnConfig);
        }
      }
    }
  }

  // ── 5. Platform collisions ───────────────────────────────────────────────
  for (const player of state.players) {
    if (player.isOut) continue;
    applyPlatforms(player, state.platforms, state.island, state.tileStates, dt, twists);
  }

  // ── 6. Mode-specific updates ─────────────────────────────────────────────
  if (state.mode === 'bomb') {
    events.push(...stepBomb(state, dt, rng));
  } else if (state.mode === 'crown') {
    events.push(...stepCrown(state, dt, rng));
  } else if (state.mode === 'brawl') {
    events.push(...stepBrawl(state, dt));
  }

  // ── 7. Twists updates (Wind, Crumble) ─────────────────────────────────────
  stepTwists(state, twists, dt, rng);

  // ── 8. Power-up Crates ───────────────────────────────────────────────────
  if (state.crates) {
    events.push(...stepCrates(state, dt, rng, state.itemConfig?.allowed));
    events.push(...handleCratePickups(state, rng));
  }

  // ── 9. Respawns ──────────────────────────────────────────────────────────
  events.push(...stepRespawns(state, dt, rng, state.respawnConfig));

  // ── 10. Advance tick counter & persist PRNG state ────────────────────────
  state.tick += 1;
  if (state.rng) {
    state.rng.events = rngState;
  }

  // Store events in state
  state.events.push(...events);

  return events;
}
