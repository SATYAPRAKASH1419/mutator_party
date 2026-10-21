import { describe, expect, it } from 'vitest';
import { computeBotInput, hasGroundBelow } from '../src/bots/bot.js';
import { decodeBits } from '../src/input.js';
import { mulberry32 } from '../src/rng.js';
import type { SimState, PlayerState } from '../src/types.js';

function makeTestPlayer(id: string, x = 480, y = 382): PlayerState {
  return {
    id,
    x,
    y,
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
    isBot: true,
    score: 0,
    lives: 3,
  };
}

function makeTestState(): SimState {
  return {
    tick: 0,
    rng: { events: 42 },
    players: [makeTestPlayer('b1', 400), makeTestPlayer('p2', 500)],
    island: { x: 180, y: 400, w: 600, tiles: 6 },
    platforms: [],
    tileStates: [],
    crates: [],
    events: [],
  };
}

describe('Deterministic Bot AI', () => {
  it('hasGroundBelow accurately detects island floor and floating platforms', () => {
    const island = { x: 180, y: 400, w: 600, tiles: 6 };
    const platforms = [{ x: 50, y: 290, w: 100 }];

    // Directly above island
    expect(hasGroundBelow(400, 382, platforms, island)).toBe(true);
    // Over empty space outside island
    expect(hasGroundBelow(800, 382, platforms, island)).toBe(false);
    // Above floating platform
    expect(hasGroundBelow(80, 270, platforms, island)).toBe(true);
  });

  it('generates deterministic bitmask inputs', () => {
    const state = makeTestState();
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);

    const bits1 = computeBotInput(state.players[0]!, state, rng1);
    const bits2 = computeBotInput(state.players[0]!, state, rng2);

    expect(bits1).toBe(bits2);
  });

  it('edge safety stops bot from walking off island edge into empty space', () => {
    const state = makeTestState();
    // Position bot on rightmost edge of island (island ends at x = 180 + 600 = 780)
    state.players[0]!.x = 775;
    // Target is way off to the right in the air (x = 900)
    state.players[1]!.x = 900;

    const rng = mulberry32(777);
    const bits = computeBotInput(state.players[0]!, state, rng, 'hard');
    const input = decodeBits(bits);

    // Hard bot should not walk right off the edge
    expect(input.right).toBe(false);
  });

  it('bomb tag: non-holder bot flees from bomb holder', () => {
    const state = makeTestState();
    state.mode = 'bomb';
    state.bomb = {
      holderId: 'p2', // rival has bomb
      fuse: 5.0,
    };
    state.players[0]!.x = 450;
    state.players[1]!.x = 480; // Bomb holder is to the right

    const rng = mulberry32(888);
    const bits = computeBotInput(state.players[0]!, state, rng, 'hard');
    const input = decodeBits(bits);

    // Bot should flee left away from the bomb holder
    expect(input.left).toBe(true);
    expect(input.right).toBe(false);
  });

  it('crown rush: bot navigates toward dropped crown', () => {
    const state = makeTestState();
    state.mode = 'crown';
    state.crown = {
      holderId: null, // Crown is dropped
      x: 300,
      y: 382,
      stealProtection: 0,
    };
    state.players[0]!.x = 450;

    const rng = mulberry32(999);
    const bits = computeBotInput(state.players[0]!, state, rng, 'hard');
    const input = decodeBits(bits);

    // Crown is to the left (x=300), bot at x=450 should move left
    expect(input.left).toBe(true);
  });
});

