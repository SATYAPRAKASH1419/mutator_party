// ─── sim/movement.ts ─────────────────────────────────────────────────────────
// Horizontal movement, gravity, jump, coyote time, jump buffer, kill zone.
// Pure: no Date.now(), no Math.random(). Called once per player per step.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlayerState, SimEvent } from '../types.js';
import type { DecodedInput } from '../input.js';
import type { Twist } from '../constants.js';
import {
  GRAVITY, RUN_SPEED, JUMP_SPEED, AIR_JUMP_MULT,
  COYOTE_TIME, JUMP_BUFFER, MAX_FALL_SPEED,
  KILL_ZONE_Y, KILL_ZONE_X_MIN, KILL_ZONE_X_MAX,
  ACCEL, BRAKE, ICE_BRAKE, BODY_HALF,
  TWIST_LOW_GRAV_MULT, TWIST_LOW_JUMP_MULT,
  TWIST_HEAVY_GRAV_MULT, TWIST_HEAVY_JUMP_MULT,
  TWIST_SPEED_MULT, TWIST_WIND_SPEED,
} from '../constants.js';

export interface MovementOptions {
  windDir?: number;   // 1 or -1
  speedMult?: number; // mode speed multiplier (e.g. 1.12 for bomb, 0.9 for crown)
}

export function applyMovement(
  player: PlayerState,
  input: DecodedInput,
  dt: number,
  twists: readonly Twist[],
  options?: MovementOptions,
): SimEvent[] {
  if (player.isOut) return [];

  const events: SimEvent[] = [];
  const ice   = twists.includes('ice');
  const flap  = twists.includes('flap');   // unlimited air jumps at x0.88
  const speed = twists.includes('speed');  // top speed x1.55
  const low   = twists.includes('low');    // moon gravity
  const heavy = twists.includes('heavy');  // heavy boots
  const wind  = twists.includes('wind');

  // Flap twist: reset air jumps every tick (unlimited)
  if (flap) player.airJumpsLeft = 1;

  // ── 0. Smooth scale transition ───────────────────────────────────────────
  if (player.targetScale !== undefined && Math.abs(player.scale - player.targetScale) > 0.001) {
    const oldHs = BODY_HALF * player.scale;
    player.scale += (player.targetScale - player.scale) * Math.min(1, dt * 6);
    const newHs = BODY_HALF * player.scale;
    player.y -= (newHs - oldHs);
  }

  // ── 1. Tick timers ────────────────────────────────────────────────────────
  if (player.coyoteTimer     > 0) player.coyoteTimer     = Math.max(0, player.coyoteTimer     - dt);
  if (player.jumpBufferTimer > 0) player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  if (player.shoveTimer      > 0) player.shoveTimer      = Math.max(0, player.shoveTimer      - dt);
  if (player.stunTimer       > 0) player.stunTimer       = Math.max(0, player.stunTimer       - dt);
  if (player.shieldTimer     && player.shieldTimer > 0) player.shieldTimer = Math.max(0, player.shieldTimer - dt);
  if (player.freezeTimer     && player.freezeTimer > 0) player.freezeTimer = Math.max(0, player.freezeTimer - dt);

  const isFrozen = (player.freezeTimer ?? 0) > 0;
  const isStunned = player.stunTimer > 0 || isFrozen;

  // ── 2. Jump buffer: register press ───────────────────────────────────────
  if (input.jump && !isStunned) player.jumpBufferTimer = JUMP_BUFFER;

  // ── 3. Jump resolution (grounded or coyote) ───────────────────────────────
  const jumpSpeedMult = low ? TWIST_LOW_JUMP_MULT : heavy ? TWIST_HEAVY_JUMP_MULT : 1.0;
  const effectiveJump = JUMP_SPEED * jumpSpeedMult;

  const canJump = player.grounded || player.coyoteTimer > 0;
  if (player.jumpBufferTimer > 0 && canJump && !isStunned) {
    player.vy              = -effectiveJump;
    player.grounded        = false;
    player.coyoteTimer     = 0;
    player.jumpBufferTimer = 0;
    player.airJumpsLeft    = 1; // reset air jump on landing a ground jump
  }
  // ── 4. Air jump (fresh press only: buffer == JUMP_BUFFER means set this tick)
  else if (
    input.jump &&
    player.jumpBufferTimer === JUMP_BUFFER &&
    !player.grounded &&
    (player.airJumpsLeft > 0 || flap) &&
    !isStunned
  ) {
    player.vy              = -(effectiveJump * AIR_JUMP_MULT);
    if (!flap) player.airJumpsLeft -= 1;
    player.jumpBufferTimer = 0;
  }

  // ── 5. Horizontal movement ────────────────────────────────────────────────
  const windV = (wind && options?.windDir) ? options.windDir * TWIST_WIND_SPEED : 0;

  if (isFrozen) {
    // Frozen: sharp drag
    player.vx *= Math.pow(0.3, dt * 30);
  } else if (player.stunTimer <= 0) {
    const twistSpeedMult = speed ? TWIST_SPEED_MULT : 1.0;
    const modeSpeedMult  = options?.speedMult ?? 1.0;
    const maxSpeed       = RUN_SPEED * player.scale * twistSpeedMult * modeSpeedMult;
    const brake          = ice ? ICE_BRAKE : (player.grounded ? BRAKE : 260);
    const accel          = ice ? 420 : (player.grounded ? ACCEL : 1700);

    const wantsRight = input.right && !input.left;
    const wantsLeft  = input.left  && !input.right;
    const dir = wantsRight ? 1 : wantsLeft ? -1 : 0;

    if (dir !== 0) {
      player.facingRight = dir > 0;
      const targetV = dir * maxSpeed + windV;
      if (player.vx < targetV) {
        player.vx = Math.min(player.vx + accel * dt, targetV);
      } else if (player.vx > targetV) {
        player.vx = Math.max(player.vx - accel * dt, targetV);
      }
    } else {
      // Brake toward windV (or 0)
      if (player.vx > windV) {
        player.vx = Math.max(windV, player.vx - brake * dt);
      } else if (player.vx < windV) {
        player.vx = Math.min(windV, player.vx + brake * dt);
      }
    }
  }

  // ── 6. Gravity ────────────────────────────────────────────────────────────
  if (!player.grounded) {
    const gravMult = low ? TWIST_LOW_GRAV_MULT : heavy ? TWIST_HEAVY_GRAV_MULT : 1.0;
    player.vy = Math.min(player.vy + GRAVITY * gravMult * dt, MAX_FALL_SPEED);
  }

  // ── 7. Integrate position ─────────────────────────────────────────────────
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Ceiling clamp
  if (player.y - BODY_HALF * player.scale < -260) {
    player.y = -260 + BODY_HALF * player.scale;
    player.vy = Math.max(player.vy, 0);
  }

  // ── 8. Kill zone ──────────────────────────────────────────────────────────
  if (
    player.y  >  KILL_ZONE_Y     ||
    player.x  <  KILL_ZONE_X_MIN ||
    player.x  >  KILL_ZONE_X_MAX
  ) {
    player.isOut = true;
    events.push({ type: 'ko', playerId: player.id });
  }

  return events;
}
