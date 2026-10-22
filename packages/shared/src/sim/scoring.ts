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
 * Supports 'standard', 'winner_plus' (+2 bonus for solo winner), and 'kills' scoring modes.
 */
export function calculateRoundScores(
  state: SimState,
  scoringMode: 'standard' | 'winner_plus' | 'kills' = 'standard',
): PlayerRoundScore[] {
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

    // Top player clear lead bonus (+2 points if > 1s ahead of 2nd place, +4 for winner_plus)
    if (sorted.length >= 2) {
      const top = sorted[sorted.length - 1];
      const second = sorted[sorted.length - 2];
      if (top && second) {
        const topSec = top.crownSeconds ?? 0;
        const secondSec = second.crownSeconds ?? 0;

        if (topSec > secondSec + 1.0) {
          const bonus = scoringMode === 'winner_plus' ? 4 : 2;
          pointsMap.set(top.id, (pointsMap.get(top.id) ?? 0) + bonus);
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
      const isSoloWinner = alive.length === 1;
      let bonus = isSoloWinner ? 2 : 1;
      if (isSoloWinner && scoringMode === 'winner_plus') {
        bonus += 2; // +4 total bonus for solo winner in winner_plus
      }
      pointsMap.set(p.id, elimCount + bonus);
    });
  }

  // Update cumulative scores and return results with deterministic tie-breaks
  const results: PlayerRoundScore[] = state.players.map((player) => {
    const roundPts = pointsMap.get(player.id) ?? 0;
    player.score += roundPts;
    return {
      playerId: player.id,
      roundPoints: roundPts,
      totalScore: player.score,
    };
  });

  return results.sort(
    (a, b) =>
      b.totalScore - a.totalScore ||
      ((state.players.find((p) => p.id === b.playerId)?.crownSeconds ?? 0) -
        (state.players.find((p) => p.id === a.playerId)?.crownSeconds ?? 0)) ||
      a.playerId.localeCompare(b.playerId),
  );
}
