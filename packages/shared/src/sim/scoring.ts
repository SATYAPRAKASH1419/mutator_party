// ─── sim/scoring.ts ───────────────────────────────────────────────────────────
// Mode-specific round scoring, placement points, and match ranking.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlayerState, SimState } from '../types.js';

export interface PlayerRoundScore {
  playerId: string;
  roundPoints: number;
  totalScore: number;
}

/**
 * Computes round points and updates each player's cumulative score.
 */
export function calculateRoundScores(state: SimState): PlayerRoundScore[] {
  const mode = state.mode ?? 'brawl';
  const pointsMap = new Map<string, number>();

  if (mode === 'crown') {
    // Sorted by crown seconds ascending
    const sorted = state.players
      .slice()
      .sort((a, b) => (a.crownSeconds ?? 0) - (b.crownSeconds ?? 0));

    sorted.forEach((player, idx) => {
      pointsMap.set(player.id, idx);
    });

    // Top player clear lead bonus (+2 points if > 1s ahead of 2nd place)
    if (sorted.length >= 2) {
      const top = sorted[sorted.length - 1];
      const second = sorted[sorted.length - 2];
      if (top && second) {
        const topSec = top.crownSeconds ?? 0;
        const secondSec = second.crownSeconds ?? 0;

        if (topSec > secondSec + 1.0) {
          pointsMap.set(top.id, (pointsMap.get(top.id) ?? 0) + 2);
        }
      }
    }
  } else {
    // Brawl or Bomb
    const eliminatedOrder = state.eliminated ?? [];
    const eliminatedSet = new Set(eliminatedOrder);

    // Points by elimination order (first eliminated gets 0, next gets 1, etc.)
    eliminatedOrder.forEach((id, idx) => {
      pointsMap.set(id, idx);
    });

    const alive = state.players.filter((p) => !p.isOut && !eliminatedSet.has(p.id));
    const elimCount = eliminatedOrder.length;

    alive.forEach((p) => {
      const bonus = alive.length === 1 ? 2 : 1;
      pointsMap.set(p.id, elimCount + bonus);
    });
  }

  // Update cumulative scores and return results
  const results: PlayerRoundScore[] = state.players.map((player) => {
    const roundPts = pointsMap.get(player.id) ?? 0;
    player.score += roundPts;
    return {
      playerId: player.id,
      roundPoints: roundPts,
      totalScore: player.score,
    };
  });

  return results.sort((a, b) => b.totalScore - a.totalScore);
}
