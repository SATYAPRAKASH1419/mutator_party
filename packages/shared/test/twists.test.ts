import { describe, expect, it } from 'vitest';
import {
  TWIST_CATALOG,
  TWIST_MAP,
  validateTwistExclusion,
  pickMutators,
  setupTwists,
  stepTwists,
} from '../src/sim/twists/index.js';
import { mulberry32 } from '../src/rng.js';
import type { SimState, PlayerState } from '../src/types.js';

function makeTestPlayer(id: string): PlayerState {
  return {
    id,
    x: 480,
    y: 382,
    vx: 0,
    vy: 0,
    facingRight: true,
    grounded: true,
    airJumpsLeft: 1,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    shoveTimer: 0,
    stunTimer: 0,
    hitsTaken: 0,
    scale: 1.0,
    isOut: false,
    isBot: false,
    score: 0,
    lives: 3,
  };
}

function makeTestState(): SimState {
  return {
    tick: 0,
    rng: { events: 42 },
    players: [makeTestPlayer('p1'), makeTestPlayer('p2')],
    island: { x: 180, y: 400, w: 600, tiles: 6 },
    platforms: [],
    tileStates: [],
    crates: [],
    events: [],
  };
}

describe('Twists Catalog and Category Rules', () => {
  it('contains all 13 twists across 5 categories', () => {
    expect(TWIST_CATALOG.length).toBe(13);
    const categories = new Set(TWIST_CATALOG.map((t) => t.cat));
    expect(categories).toEqual(new Set(['g', 's', 'c', 'j', 'w']));
  });

  it('validates category exclusion rule', () => {
    // Valid: different categories
    expect(validateTwistExclusion(['low', 'speed', 'crumble'])).toBe(true);
    // Invalid: two gravity twists ('low' and 'heavy')
    expect(validateTwistExclusion(['low', 'heavy'])).toBe(false);
    // Invalid: two scale twists ('tiny' and 'giant')
    expect(validateTwistExclusion(['tiny', 'giant'])).toBe(false);
  });

  it('deterministically picks mutators obeying category exclusion', () => {
    const rng = mulberry32(12345);
    const picked = pickMutators(3, null, rng);

    expect(picked.length).toBe(3);
    expect(validateTwistExclusion(picked)).toBe(true);
  });

  it('honors forced twist from previous round picker', () => {
    const rng = mulberry32(9999);
    const picked = pickMutators(3, 'heavy', rng);

    expect(picked[0]).toBe('heavy');
    expect(validateTwistExclusion(picked)).toBe(true);
    // Should not pick another gravity twist like 'low'
    expect(picked).not.toContain('low');
  });

  it('filters by allowedTwists when provided', () => {
    const rng = mulberry32(54321);
    const allowed = ['speed', 'flap', 'ice'] as const;
    const picked = pickMutators(2, null, rng, allowed);

    expect(picked.length).toBeGreaterThan(0);
    for (const t of picked) {
      expect(allowed).toContain(t);
    }
  });

  it('setupTwists sets player scales for tiny and giant', () => {
    const state = makeTestState();
    const rng = mulberry32(101);

    setupTwists(state, ['tiny'], rng);
    expect(state.players[0]!.scale).toBe(0.55);

    setupTwists(state, ['giant'], rng);
    expect(state.players[0]!.scale).toBe(1.7);
  });

  it('stepTwists updates wind and crumble tile states', () => {
    const state = makeTestState();
    const rng = mulberry32(202);

    setupTwists(state, ['crumble', 'wind'], rng);
    expect(state.nextCrumbleTime).toBe(4.0);
    expect(state.wind).toBeDefined();

    // Advance 4.1s to trigger first crumble tile warning
    for (let i = 0; i < 4.1 * 30; i++) {
      stepTwists(state, ['crumble', 'wind'], 1 / 30, rng);
    }

    const warnedTile = state.tileStates.find((t) => t.state === 'warn' || t.state === 'fall');
    expect(warnedTile).toBeDefined();
  });
});

