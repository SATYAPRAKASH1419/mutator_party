import { describe, expect, it } from 'vitest';
import { initBrawl, stepBrawl } from '../src/sim/modes/brawl.js';
import { initBomb, passBomb, stepBomb } from '../src/sim/modes/bomb.js';
import { initCrown, dropCrown, stealCrown, stepCrown } from '../src/sim/modes/crown.js';
import { mulberry32 } from '../src/rng.js';
import { step } from '../src/sim/step.js';
import { encodeBits } from '../src/input.js';
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

describe('Game Modes', () => {
  describe('Brawl Mode', () => {
    it('ends round and declares toast when only one player remains', () => {
      const state = makeTestState();
      initBrawl(state);

      state.players[1]!.isOut = true;
      const events = stepBrawl(state, 1 / 30);

      expect(events.some((e) => e.type === 'toast' && e.message.includes('p1 wins'))).toBe(true);
      expect(state.endTimer).toBeDefined();
    });
  });

  describe('Bomb Tag Mode', () => {
    it('assigns initial bomb holder after delay', () => {
      const state = makeTestState();
      initBomb(state);
      const rng = mulberry32(111);

      // Advance past initial delay (1.5s = 46 ticks)
      for (let i = 0; i < 48; i++) {
        stepBomb(state, 1 / 30, rng);
      }

      expect(state.bomb?.holderId).toBeTruthy();
      expect(state.bomb?.fuse).toBeGreaterThan(0);
    });

    it('passes bomb on contact and resets pass cooldown', () => {
      const state = makeTestState();
      initBomb(state);
      state.bomb!.holderId = 'p1';
      state.bomb!.passCooldown = 0;

      const passed = passBomb(state, state.players[0]!, state.players[1]!, state.events);
      expect(passed).toBe(true);
      expect(state.bomb?.holderId).toBe('p2');
      expect(state.bomb?.passCooldown).toBe(0.7);
    });

    it('shield blocks bomb passing', () => {
      const state = makeTestState();
      initBomb(state);
      state.bomb!.holderId = 'p1';
      state.bomb!.passCooldown = 0;
      state.players[1]!.shieldTimer = 3.0; // P2 is shielded

      const passed = passBomb(state, state.players[0]!, state.players[1]!, state.events);
      expect(passed).toBe(false);
      expect(state.bomb?.holderId).toBe('p1');
    });

    it('explodes when fuse reaches zero, knocking out holder and blasting bystanders', () => {
      const state = makeTestState();
      initBomb(state);
      state.bomb!.holderId = 'p1';
      state.bomb!.fuse = 0.01;
      const rng = mulberry32(222);

      const events = stepBomb(state, 1 / 30, rng);
      expect(state.players[0]!.isOut).toBe(true);
      expect(events.some((e) => e.type === 'bomb_explode')).toBe(true);

      // Bystander p2 within 260px receives blast velocity
      expect(state.players[1]!.vx).not.toBe(0);
    });
  });

  describe('Crown Rush Mode', () => {
    it('accumulates score for the crown holder over time', () => {
      const state = makeTestState();
      initCrown(state);
      state.crown!.holderId = 'p1';
      const rng = mulberry32(333);

      for (let i = 0; i < 30; i++) {
        stepCrown(state, 1 / 30, rng);
      }

      expect(state.players[0]!.crownSeconds).toBeCloseTo(1.0, 1);
    });

    it('steals crown and grants 1.0s victim protection', () => {
      const state = makeTestState();
      initCrown(state);
      state.crown!.holderId = 'p1';
      state.crown!.stealProtection = 0;

      const events = stealCrown(state, state.players[1]!, state.players[0]!);
      expect(state.crown?.holderId).toBe('p2');
      expect(state.crown?.blockedPlayerId).toBe('p1');
      expect(state.crown?.stealProtection).toBe(1.0);
      expect(events.some((e) => e.type === 'crown_steal')).toBe(true);
    });

    it('drops crown with rebound velocity when holder dies', () => {
      const state = makeTestState();
      initCrown(state);
      state.crown!.holderId = 'p1';
      const rng = mulberry32(444);

      const events = dropCrown(state, state.players[0]!, rng);
      expect(state.crown?.holderId).toBeNull();
      expect(state.crown?.vy).toBeLessThan(-300);
      expect(events.some((e) => e.type === 'crown_drop')).toBe(true);
    });

    it('respawns offscreen crown back to center', () => {
      const state = makeTestState();
      initCrown(state);
      state.crown!.holderId = null;
      state.crown!.y = 650; // Off bottom of arena
      const rng = mulberry32(555);

      // Advance past 1.0s respawn delay
      for (let i = 0; i < 35; i++) {
        stepCrown(state, 1 / 30, rng);
      }

      expect(state.crown?.x).toBe(480);
      expect(state.crown?.y).toBeLessThan(250);
      expect(state.crown?.y).toBeGreaterThan(180);
    });
  });
});
