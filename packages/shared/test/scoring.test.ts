import { describe, expect, it } from 'vitest';
import { calculateRoundScores } from '../src/sim/scoring.js';
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

describe('Scoring Engine', () => {
  it('computes Brawl round placement points by elimination order', () => {
    const state: SimState = {
      tick: 0,
      rng: { events: 1 },
      mode: 'brawl',
      players: [makeTestPlayer('p1'), makeTestPlayer('p2'), makeTestPlayer('p3')],
      eliminated: ['p1', 'p2'], // p1 eliminated first (0 pts), p2 second (1 pt)
      island: { x: 180, y: 400, w: 600, tiles: 6 },
      platforms: [],
      tileStates: [],
      crates: [],
      events: [],
    };
    state.players[0]!.isOut = true;
    state.players[1]!.isOut = true;

    const scores = calculateRoundScores(state);
    const p1Score = scores.find((s) => s.playerId === 'p1');
    const p2Score = scores.find((s) => s.playerId === 'p2');
    const p3Score = scores.find((s) => s.playerId === 'p3');

    expect(p1Score?.roundPoints).toBe(0);
    expect(p2Score?.roundPoints).toBe(1);
    expect(p3Score?.roundPoints).toBe(4); // 2 eliminated + 2 for solo winner = 4 pts
  });

  it('computes Crown Rush points and grants clear-lead bonus (+2)', () => {
    const state: SimState = {
      tick: 0,
      rng: { events: 1 },
      mode: 'crown',
      players: [makeTestPlayer('p1'), makeTestPlayer('p2'), makeTestPlayer('p3')],
      island: { x: 180, y: 400, w: 600, tiles: 6 },
      platforms: [],
      tileStates: [],
      crates: [],
      events: [],
    };
    state.players[0]!.crownSeconds = 5;
    state.players[1]!.crownSeconds = 12;
    state.players[2]!.crownSeconds = 25; // > 1s ahead of 2nd place (12s)

    const scores = calculateRoundScores(state);
    const p1Score = scores.find((s) => s.playerId === 'p1');
    const p2Score = scores.find((s) => s.playerId === 'p2');
    const p3Score = scores.find((s) => s.playerId === 'p3');

    expect(p1Score?.roundPoints).toBe(0);
    expect(p2Score?.roundPoints).toBe(1);
    expect(p3Score?.roundPoints).toBe(2 + 2); // Rank 2 + 2 clear-lead bonus = 4 pts
  });

  it('grants additional winner_plus bonus when configured', () => {
    const state: SimState = {
      tick: 0,
      rng: { events: 1 },
      mode: 'brawl',
      players: [makeTestPlayer('p1'), makeTestPlayer('p2')],
      eliminated: ['p1'],
      island: { x: 180, y: 400, w: 600, tiles: 6 },
      platforms: [],
      tileStates: [],
      crates: [],
      events: [],
    };
    state.players[0]!.isOut = true;

    const scores = calculateRoundScores(state, 'winner_plus');
    const p2Score = scores.find((s) => s.playerId === 'p2');
    // 1 elim + (2 + 2) winner_plus bonus = 5 pts
    expect(p2Score?.roundPoints).toBe(5);
  });
});

