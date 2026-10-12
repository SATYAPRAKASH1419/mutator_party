// ─── sim/shove.ts ─────────────────────────────────────────────────────────────
// Attack range check, knockback formula, stun application.
// Pure: no Date.now(), no Math.random(). Called once per player per step.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlayerState, SimEvent } from '../types.js';
import {
  SHOVE_COOLDOWN, SHOVE_RANGE, SHOVE_BASE, SHOVE_PER_HIT,
  SHOVE_POPUP, SHOVE_STUN, BODY_HALF,
} from '../constants.js';

/**
 * Checks if `attacker` is shoving and within range of any `targets`.
 * Applies knockback + stun to the first valid target hit.
 * Mutates both attacker and target in place.
 */
export function applyShove(
  attacker: PlayerState,
  targets: PlayerState[],
  events: SimEvent[],
): void {
  // Must not be: eliminated, on cooldown, or stunned
  if (attacker.isOut)          return;
  if (attacker.shoveTimer > 0) return;
  if (attacker.stunTimer  > 0) return;

  // Shove range is scale-aware: base range + target half-size
  const atkRange = SHOVE_RANGE * attacker.scale;

  for (const target of targets) {
    if (target === attacker) continue;
    if (target.isOut)        continue;

    const targetHalf = BODY_HALF * target.scale;

    // Distance between centers
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Effective range: attacker range + target's own half-size
    const effectiveRange = atkRange + targetHalf;
    if (dist > effectiveRange) continue;

    // ── Hit confirmed ─────────────────────────────────────────────────────

    // Knockback force: scales with hits taken and scale ratio
    const scaleRatio  = attacker.scale / target.scale;
    const force       = (SHOVE_BASE + SHOVE_PER_HIT * target.hitsTaken) * Math.sqrt(scaleRatio);

    // Direction: away from attacker (normalised)
    const len = dist > 0 ? dist : 1;
    const nx  = dx / len;
    const ny  = dy / len;

    target.vx       = nx * force;
    target.vy       = ny * force - SHOVE_POPUP; // always add upward kick (spec s13.4: "extra")
    target.stunTimer = SHOVE_STUN;
    target.hitsTaken += 1;

    // Put attacker on cooldown
    attacker.shoveTimer = SHOVE_COOLDOWN;

    events.push({ type: 'shove_hit', attackerId: attacker.id, targetId: target.id });

    // Only one target per shove (first in range wins)
    return;
  }
}
