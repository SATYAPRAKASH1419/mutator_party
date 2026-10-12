import { describe, it, expect } from 'vitest';
import { step } from '../src/sim/step.js';
import { encodeBits } from '../src/input.js';
import {
  JUMP_SPEED, AIR_JUMP_MULT, GRAVITY, DT,
  SHOVE_COOLDOWN, SHOVE_BASE, SHOVE_PER_HIT,
  KILL_ZONE_Y, KILL_ZONE_X_MIN,
} from '../src/constants.js';
import type { SimState, PlayerState } from '../src/types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p1', x: 480, y: 382, vx: 0, vy: 0,
    facingRight: true, grounded: true,
    airJumpsLeft: 1, coyoteTimer: 0, jumpBufferTimer: 0,
    shoveTimer: 0, stunTimer: 0, hitsTaken: 0,
    scale: 1.0, isOut: false, isBot: false,
    score: 0, lives: 3,
    ...overrides,
  };
}

function makeState(players: PlayerState[], platforms = []): SimState {
  return {
    tick: 0, rng: { events: 1 },
    players, platforms, tileStates: [],
    crates: [], events: [],
  };
}

// ─── Determinism (exit gate) ──────────────────────────────────────────────────

describe('Determinism', () => {
  it('two runs with same seed and inputs produce identical state hashes', () => {
    // 8 scripted players: alternating left/right/jump inputs
    const scripts = [
      encodeBits({ right: true }),
      encodeBits({ left: true }),
      encodeBits({ jump: true }),
      encodeBits({ right: true, jump: true }),
      encodeBits({ left: true, jump: true }),
      encodeBits({}),
      encodeBits({ right: true }),
      encodeBits({ left: true }),
    ];

    function runSim(): string[] {
      const players = scripts.map((_, i) =>
        makePlayer({ id: `p${i}`, x: 210 + i * 77, y: 382, grounded: true })
      );
      const state = makeState(players);
      const hashes: string[] = [];

      const TICKS = 60 * 30; // 60 seconds at 30 Hz
      for (let t = 0; t < TICKS; t++) {
        const inputs = new Map(scripts.map((bits, i) => [`p${i}`, bits]));
        step(state, inputs, [], DT);
        // Serialize key state fields as hash
        const snap = state.players.map(p =>
          `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.vx.toFixed(4)},${p.vy.toFixed(4)},${p.isOut}`
        ).join('|');
        hashes.push(snap);
      }
      return hashes;
    }

    const run1 = runSim();
    const run2 = runSim();
    expect(run1).toEqual(run2);
  });
});

// ─── Jump physics ─────────────────────────────────────────────────────────────

describe('Jump physics', () => {
  it('jump apex is approximately 144 px', () => {
    const player = makePlayer({ x: 480, y: 382, grounded: true });
    const state  = makeState([player]);

    // Press jump for one tick
    step(state, new Map([['p1', encodeBits({ jump: true })]]), [], DT);

    // Track the lowest y value reached (= highest point in screen coords)
    let minY = player.y;
    for (let i = 0; i < 200; i++) {
      step(state, new Map([['p1', encodeBits({})]]), [], DT);
      if (player.y < minY) minY = player.y;
      if (player.grounded) break; // landed — apex already passed
    }

    const apex = 382 - minY; // px above the floor
    // Theoretical apex = 720²/(2×1800) ≈ 144 px; allow ±35 px for discrete steps
    expect(apex).toBeGreaterThan(110);
    expect(apex).toBeLessThan(180);
  });

  it('air jump adds extra height (~111 px)', () => {
    const player = makePlayer({ x: 480, y: 382, grounded: true });
    const state  = makeState([player]);

    // Ground jump
    step(state, new Map([['p1', encodeBits({ jump: true })]]), [], DT);
    // Wait until rising but not at apex yet (~10 ticks up)
    for (let i = 0; i < 10; i++) {
      step(state, new Map([['p1', encodeBits({})]]), [], DT);
    }
    const yBeforeAir = player.y;

    // Air jump
    step(state, new Map([['p1', encodeBits({ jump: true })]]), [], DT);
    let maxRise = 0;
    for (let i = 0; i < 200; i++) {
      step(state, new Map([['p1', encodeBits({})]]), [], DT);
      const rise = yBeforeAir - player.y;
      if (rise > maxRise) maxRise = rise;
      if (player.vy > 0) break;
    }
    // Air jump at x0.88 power: apex ~111 px (allow ±20 px tolerance)
    expect(maxRise).toBeGreaterThan(80);
    expect(maxRise).toBeLessThan(135);
  });
});

// ─── Shove ────────────────────────────────────────────────────────────────────

describe('Shove', () => {
  it('shove hits a nearby target and applies cooldown', () => {
    const attacker = makePlayer({ id: 'p1', x: 480, y: 382 });
    const target   = makePlayer({ id: 'p2', x: 510, y: 382 }); // 30px away
    const state    = makeState([attacker, target]);

    step(state, new Map([
      ['p1', encodeBits({ shove: true })],
      ['p2', encodeBits({})],
    ]), [], DT);

    expect(attacker.shoveTimer).toBeCloseTo(SHOVE_COOLDOWN, 1);
    expect(target.stunTimer).toBeGreaterThan(0);
    expect(target.hitsTaken).toBe(1);
  });

  it('knockback force scales with hits taken', () => {
    const attacker = makePlayer({ id: 'p1', x: 480, y: 382 });
    const target0  = makePlayer({ id: 'p2', x: 510, y: 382, hitsTaken: 0 });
    const target5  = makePlayer({ id: 'p3', x: 510, y: 382, hitsTaken: 5 });

    // Shove target with 0 hits
    const state0 = makeState([attacker, target0]);
    step(state0, new Map([['p1', encodeBits({ shove: true })], ['p2', encodeBits({})]]), [], DT);
    const force0 = Math.abs(target0.vx);

    // Reset attacker and shove target with 5 hits
    attacker.shoveTimer = 0;
    const state5 = makeState([attacker, target5]);
    step(state5, new Map([['p1', encodeBits({ shove: true })], ['p3', encodeBits({})]]), [], DT);
    const force5 = Math.abs(target5.vx);

    // 5 hits adds 5×70=350 extra force, so force5 > force0
    expect(force5).toBeGreaterThan(force0);
    const expectedDiff = SHOVE_PER_HIT * 5;
    expect(force5 - force0).toBeCloseTo(expectedDiff, 0);
  });

  it('shove does not fire while on cooldown', () => {
    const attacker = makePlayer({ id: 'p1', x: 480, y: 382, shoveTimer: 0.5 });
    const target   = makePlayer({ id: 'p2', x: 510, y: 382 });
    const state    = makeState([attacker, target]);

    step(state, new Map([
      ['p1', encodeBits({ shove: true })],
      ['p2', encodeBits({})],
    ]), [], DT);

    expect(target.stunTimer).toBe(0);   // not hit
    expect(target.hitsTaken).toBe(0);
  });
});

// ─── Kill zone ────────────────────────────────────────────────────────────────

describe('Kill zone', () => {
  it('player falling below KILL_ZONE_Y is eliminated', () => {
    const player = makePlayer({ x: 480, y: KILL_ZONE_Y + 1, grounded: false });
    const state  = makeState([player]);

    step(state, new Map([['p1', encodeBits({})]]), [], DT);

    expect(player.isOut).toBe(true);
    expect(state.events.some(e => e.type === 'ko' && e.playerId === 'p1')).toBe(true);
  });

  it('player exiting left kill zone is eliminated', () => {
    const player = makePlayer({ x: KILL_ZONE_X_MIN - 1, y: 300, grounded: false });
    const state  = makeState([player]);

    step(state, new Map([['p1', encodeBits({})]]), [], DT);

    expect(player.isOut).toBe(true);
  });
});

// ─── Perf ─────────────────────────────────────────────────────────────────────

describe('Performance', () => {
  it('step for 12 players runs under 2ms', () => {
    const players = Array.from({ length: 12 }, (_, i) =>
      makePlayer({ id: `p${i}`, x: 100 + i * 60, y: 382 })
    );
    const state   = makeState(players);
    const inputs  = new Map(players.map(p => [p.id, encodeBits({ right: true })]));

    // Warmup
    for (let i = 0; i < 10; i++) step(state, inputs, [], DT);

    const start = performance.now();
    for (let i = 0; i < 100; i++) step(state, inputs, [], DT);
    const avg = (performance.now() - start) / 100;

    expect(avg).toBeLessThan(2); // under 2ms per tick (spec N3 = 4ms with headroom)
  });
});
