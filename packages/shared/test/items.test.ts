import { describe, expect, it } from 'vitest';
import { stepCrates, handleCratePickups, executeItem } from '../src/sim/items.js';
import { applyShove } from '../src/sim/shove.js';
import { mulberry32 } from '../src/rng.js';
import type { SimState, PlayerState, CrateState } from '../src/types.js';

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
    isBot: false,
    score: 0,
    lives: 3,
  };
}

function makeTestState(): SimState {
  return {
    tick: 0,
    rng: { events: 42 },
    players: [makeTestPlayer('p1', 400), makeTestPlayer('p2', 500)],
    island: { x: 180, y: 400, w: 600, tiles: 6 },
    platforms: [],
    tileStates: [],
    crates: [],
    events: [],
  };
}

describe('Items & Power-up Crates', () => {
  it('spawns crates in beacon state then transitions to live', () => {
    const state = makeTestState();
    state.crateTimer = 0.01;
    const rng = mulberry32(101);

    stepCrates(state, 1 / 30, rng);
    expect(state.crates.length).toBe(1);
    expect(state.crates[0]!.state).toBe('beacon');

    // Advance 3 seconds past beacon countdown
    for (let i = 0; i < 3.1 * 30; i++) {
      stepCrates(state, 1 / 30, rng);
    }

    expect(state.crates[0]!.state).toBe('live');
  });

  it('first-touch claiming prioritizes player with lower total score', () => {
    const state = makeTestState();
    const rng = mulberry32(202);

    // Both players overlapping crate at x=450
    state.players[0]!.x = 445;
    state.players[0]!.score = 10; // Higher score

    state.players[1]!.x = 455;
    state.players[1]!.score = 2;  // Lower score (trailing player)

    const crate: CrateState = {
      id: 99,
      x: 450,
      y: 382,
      type: 'freeze',
      item: 'freeze',
      state: 'live',
      t: 10,
    };
    state.crates.push(crate);

    const events = handleCratePickups(state, rng);
    // Trailing player p2 gets the item
    expect(state.players[1]!.item).toBe('freeze');
    expect(state.players[0]!.item).toBeFalsy();
    expect(state.crates.length).toBe(0);
    expect(events.some((e) => e.type === 'pickup' && e.playerId === 'p2')).toBe(true);
  });

  it('shield item grants invulnerability on pickup', () => {
    const state = makeTestState();
    const rng = mulberry32(303);

    state.players[0]!.x = 450;
    const crate: CrateState = {
      id: 100,
      x: 450,
      y: 382,
      type: 'shield',
      item: 'shield',
      state: 'live',
      t: 10,
    };
    state.crates.push(crate);

    handleCratePickups(state, rng);
    expect(state.players[0]!.shieldTimer).toBe(5.0);
  });

  it('mega shove increases knockback force by 2.6x', () => {
    const p1 = makeTestPlayer('p1', 400);
    const p2 = makeTestPlayer('p2', 430);
    const events: any[] = [];

    // Normal shove baseline
    applyShove(p1, [p2], events);
    const normalVx = p2.vx;

    // Reset and apply Mega shove
    const p3 = makeTestPlayer('p3', 400);
    const p4 = makeTestPlayer('p4', 430);
    p3.item = 'mega';
    applyShove(p3, [p4], events);

    expect(p4.vx).toBeGreaterThan(normalVx * 2.0);
  });

  it('freeze burst freezes rivals within 170px radius', () => {
    const state = makeTestState();
    state.players[0]!.x = 400;
    state.players[0]!.item = 'freeze';
    state.players[1]!.x = 460; // 60px away (within 170px)

    const events: any[] = [];
    const used = executeItem(state.players[0]!, state, events);

    expect(used).toBe(true);
    expect(state.players[1]!.freezeTimer).toBe(1.4);
    expect(state.players[1]!.stunTimer).toBe(1.4);
  });

  it('swap item exchanges positions with nearest rival', () => {
    const state = makeTestState();
    state.players[0]!.x = 300;
    state.players[0]!.y = 382;
    state.players[0]!.item = 'swap';

    state.players[1]!.x = 600;
    state.players[1]!.y = 382;

    const events: any[] = [];
    const used = executeItem(state.players[0]!, state, events);

    expect(used).toBe(true);
    expect(state.players[0]!.x).toBe(600);
    expect(state.players[1]!.x).toBe(300);
  });

  it('shield protects target from shove knockback and stun', () => {
    const p1 = makeTestPlayer('p1', 400);
    const p2 = makeTestPlayer('p2', 430);
    p2.shieldTimer = 3.0; // P2 is shielded

    const events: any[] = [];
    applyShove(p1, [p2], events);

    expect(p2.vx).toBe(0);
    expect(p2.stunTimer).toBe(0);
    expect(p2.hitsTaken).toBe(0);
  });
});

