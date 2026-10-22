// ─── sim/modes/brawl.ts ────────────────────────────────────────────────────────
// Last One Standing mode logic.
// ─────────────────────────────────────────────────────────────────────────────

import type { SimEvent, SimState } from '../../types.js';

export function initBrawl(state: SimState, roundTime = 60.0): void {
  state.mode = 'brawl';
  state.timeLeft = roundTime;
  state.eliminated = [];
  state.endTimer = undefined;
}

export function stepBrawl(state: SimState, dt: number): SimEvent[] {
  const events: SimEvent[] = [];

  if (state.timeLeft !== undefined && state.timeLeft > 0) {
    state.timeLeft = Math.max(0, state.timeLeft - dt);
  }

  const alivePlayers = state.players.filter((p) => !p.isOut);

  // Check if any eliminated players have pending respawns or remaining lives
  const hasPendingRespawns =
    state.respawnConfig &&
    state.respawnConfig.mode !== 'off' &&
    state.players.some(
      (p) =>
        p.isOut &&
        ((p.respawnTimer !== undefined && p.respawnTimer > 0) ||
          (state.respawnConfig?.mode === 'lives' && p.lives > 1) ||
          state.respawnConfig?.mode === 'unlimited'),
    );

  // Check end condition: 1 or 0 players left alive (with no pending respawns), or timer expired
  const roundEnded =
    (alivePlayers.length <= 1 && !hasPendingRespawns) ||
    (state.timeLeft !== undefined && state.timeLeft <= 0);

  if (roundEnded && state.endTimer === undefined) {
    state.endTimer = 1.5;
    const winner = alivePlayers[0];
    if (winner) {
      events.push({
        type: 'toast',
        message: `${winner.id} wins the brawl!`,
      });
    }
  }

  if (state.endTimer !== undefined) {
    state.endTimer -= dt;
  }

  return events;
}

