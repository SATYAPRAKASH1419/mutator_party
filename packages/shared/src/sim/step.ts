// ─── sim/step.ts ──────────────────────────────────────────────────────────────
// Pure deterministic fixed-timestep simulation tick.
// step(state, inputs, dt) → mutated state + drained events.
// R2: no Date.now(), no Math.random(), dt = 1/30 always.
// ─────────────────────────────────────────────────────────────────────────────

import type { SimState, SimEvent } from '../types.js';
import type { DecodedInput } from '../input.js';
import type { Twist } from '../constants.js';
import { decodeBits } from '../input.js';
import { applyMovement } from './movement.js';
import { applyPlatforms } from './platforms.js';
import { applyShove } from './shove.js';

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
  twists: readonly Twist[],
  dt: number,
): SimEvent[] {
  // Clear events from the previous tick
  state.events.length = 0;

  const events: SimEvent[] = [];

  // ── 1. Decode inputs for each player ─────────────────────────────────────
  const decoded = new Map<string, DecodedInput>();
  for (const player of state.players) {
    const bits = inputs.get(player.id) ?? 0;
    decoded.set(player.id, decodeBits(bits));
  }

  // ── 2. Shove (before movement so knockback is applied this frame) ─────────
  for (const attacker of state.players) {
    const input = decoded.get(attacker.id)!;
    if (!input.shove) continue;
    applyShove(attacker, state.players, events);
  }

  // ── 3. Movement (gravity, jump, horizontal) ───────────────────────────────
  const reverse = twists.includes('reverse');
  for (const player of state.players) {
    let input = decoded.get(player.id)!;
    // 'reverse' twist: swap left and right (bots too, spec s13.2)
    if (reverse) input = { ...input, left: input.right, right: input.left };
    const ko = applyMovement(player, input, dt, twists);
    events.push(...ko);
  }

  // ── 4. Platform collision ─────────────────────────────────────────────────
  for (const player of state.players) {
    applyPlatforms(player, state.platforms, dt);
  }

  // ── 5. Advance tick counter ───────────────────────────────────────────────
  state.tick += 1;

  // ── 6. Store events in state (for Colyseus room to drain) ─────────────────
  state.events.push(...events);

  return events;
}
