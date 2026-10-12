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
  ACCEL, BRAKE, ICE_BRAKE,
} from '../constants.js';

export function applyMovement(
  player: PlayerState,
  input: DecodedInput,
  dt: number,
  twists: readonly Twist[],
): SimEvent[] {
  if (player.isOut) return [];

  const events: SimEvent[] = [];
  const ice   = twists.includes('ice');
  const flap  = twists.includes('flap');   // unlimited air jumps at x0.88
  const speed = twists.includes('speed');  // top speed x1.55

  // Flap twist: reset air jumps every tick (unlimited)
  if (flap) player.airJumpsLeft = 1;

  // ── 1. Tick timers ────────────────────────────────────────────────────────
  if (player.coyoteTimer     > 0) player.coyoteTimer     = Math.max(0, player.coyoteTimer     - dt);
  if (player.jumpBufferTimer > 0) player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  if (player.shoveTimer      > 0) player.shoveTimer      = Math.max(0, player.shoveTimer      - dt);
  if (player.stunTimer       > 0) player.stunTimer       = Math.max(0, player.stunTimer       - dt);

  // ── 2. Jump buffer: register press ───────────────────────────────────────
  if (input.jump) player.jumpBufferTimer = JUMP_BUFFER;

  // ── 3. Jump resolution (grounded or coyote) ───────────────────────────────
  const canJump = player.grounded || player.coyoteTimer > 0;
  if (player.jumpBufferTimer > 0 && canJump && player.stunTimer <= 0) {
    player.vy             = -JUMP_SPEED;
    player.grounded       = false;
    player.coyoteTimer    = 0;
    player.jumpBufferTimer = 0;
    player.airJumpsLeft   = 1; // reset air jump on landing a ground jump
  }
  // ── 4. Air jump (fresh press only: buffer == JUMP_BUFFER means set this tick)
  else if (
    input.jump &&
    player.jumpBufferTimer === JUMP_BUFFER &&
    !player.grounded &&
    player.airJumpsLeft > 0 &&
    player.stunTimer <= 0
  ) {
    player.vy             = -(JUMP_SPEED * AIR_JUMP_MULT);
    player.airJumpsLeft  -= 1;
    player.jumpBufferTimer = 0;
  }

  // ── 5. Horizontal movement ────────────────────────────────────────────────
  if (player.stunTimer <= 0) {
    const speedMult = speed ? 1.55 : 1.0;
    const maxSpeed  = RUN_SPEED * player.scale * speedMult;
    const brake     = ice ? ICE_BRAKE : BRAKE;
    const wantsRight = input.right && !input.left;
    const wantsLeft  = input.left  && !input.right;

    if (wantsRight) {
      player.vx          = Math.min(player.vx + ACCEL * dt,  maxSpeed);
      player.facingRight = true;
    } else if (wantsLeft) {
      player.vx          = Math.max(player.vx - ACCEL * dt, -maxSpeed);
      player.facingRight = false;
    } else {
      // Brake toward zero
      if (player.vx > 0) player.vx = Math.max(0, player.vx - brake * dt);
      if (player.vx < 0) player.vx = Math.min(0, player.vx + brake * dt);
    }
  }

  // ── 6. Gravity ────────────────────────────────────────────────────────────
  if (!player.grounded) {
    player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL_SPEED);
  }

  // ── 7. Integrate position ─────────────────────────────────────────────────
  player.x += player.vx * dt;
  player.y += player.vy * dt;

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
