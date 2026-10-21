// ─── sim/shove.ts ─────────────────────────────────────────────────────────────
// Attack range check, knockback formula, stun application.
// Pure: no Date.now(), no Math.random(). Called once per player per step.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlayerState, SimEvent } from '../types.js';
import {
  SHOVE_COOLDOWN, SHOVE_RANGE, SHOVE_BASE, SHOVE_PER_HIT,
  SHOVE_POPUP, SHOVE_STUN, BODY_HALF,
  ITEM_MEGA_FORCE_MULT, ITEM_MEGA_RANGE_MULT,
} from '../constants.js';

export interface ShoveOptions {
  onHit?: (attacker: PlayerState, target: PlayerState) => void;
}

/**
 * Checks if `attacker` is shoving and within range of any `targets`.
 * Applies knockback + stun to the first valid target hit.
 * Mutates both attacker and target in place.
 */
export function applyShove(
  attacker: PlayerState,
  targets: PlayerState[],
  events: SimEvent[],
  options?: ShoveOptions,
): void {
  // Must not be: eliminated, on cooldown, or stunned/frozen
  if (attacker.isOut)          return;
  if (attacker.shoveTimer > 0) return;
  if (attacker.stunTimer  > 0) return;
  if (attacker.freezeTimer && attacker.freezeTimer > 0) return;

  const isMega = attacker.item === 'mega';
  if (isMega) {
    attacker.item = null;
    events.push({ type: 'item_use', playerId: attacker.id, item: 'mega' });
  }

  // Shove range is scale-aware: base range + target half-size
  const rangeMult = isMega ? ITEM_MEGA_RANGE_MULT : 1.0;
  const atkRange = SHOVE_RANGE * rangeMult * attacker.scale;

  // Lunge forward on shove attempt
  attacker.vx += (attacker.facingRight ? 1 : -1) * 140;
  attacker.shoveTimer = SHOVE_COOLDOWN;

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

    // Shield blocks knockback and damage
    const isShielded = (target.shieldTimer ?? 0) > 0;
    if (!isShielded) {
      // Knockback force: scales with hits taken and scale ratio
      const scaleRatio  = attacker.scale / target.scale;
      const forceMult   = isMega ? ITEM_MEGA_FORCE_MULT : 1.0;
      const force       = (SHOVE_BASE + SHOVE_PER_HIT * target.hitsTaken) * Math.sqrt(scaleRatio) * forceMult;

      // Direction: away from attacker (normalised)
      const len = dist > 0 ? dist : 1;
      const nx  = dx / len;
      const ny  = dy / len;

      target.vx      += nx * force;
      target.vy       = ny * force - SHOVE_POPUP; // always add upward kick
      target.grounded = false;
      target.stunTimer = SHOVE_STUN;
      target.hitsTaken += 1;
    }

    if (options?.onHit) {
      options.onHit(attacker, target);
    }

    events.push({ type: 'shove_hit', attackerId: attacker.id, targetId: target.id });

    // Only one target per shove (first in range wins)
    return;
  }
}
