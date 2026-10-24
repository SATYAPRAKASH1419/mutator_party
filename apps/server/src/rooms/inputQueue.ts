import {
  InputSchema,
  seqNewer,
  type InputPayload,
} from "@mutator-party/shared";

export interface PlayerInputRecord {
  seq: number;
  bits: number;
  lastTimestamp: number;
}

export interface PlayerRateLimitState {
  tokens: number;
  lastRefillMs: number;
  droppedRateLimit: number;
  droppedStaleSeq: number;
}

export const MAX_INPUT_RATE = 60; // max inputs accepted per second
export const RATE_WINDOW_MS = 1000;
export const RATE_WINDOWS_MS = RATE_WINDOW_MS; // alias for backwards compatibility

export class InputQueue {
  private latestInputs = new Map<string, PlayerInputRecord>();
  private rateLimits = new Map<string, PlayerRateLimitState>();
  private maxRate: number;
  constructor(maxRate: number = MAX_INPUT_RATE) {
    this.maxRate = maxRate;
  }

  /**
   * Checks token bucket rate limiter for a player.
   * Returns true if input is allowed, false if rate limit exceeded.
   */
  private checkRateLimit(playerId: string, now: number): boolean {
    let rate = this.rateLimits.get(playerId);
    if (!rate) {
      rate = {
        tokens: this.maxRate,
        lastRefillMs: now,
        droppedRateLimit: 0,
        droppedStaleSeq: 0,
      };
      this.rateLimits.set(playerId, rate);
    }

    // Refill tokens based on elapsed time
    const elapsed = Math.max(0, now - rate.lastRefillMs);
    if (elapsed > 0) {
      const refill = (elapsed / RATE_WINDOW_MS) * this.maxRate;
      rate.tokens = Math.min(this.maxRate, rate.tokens + refill);
      rate.lastRefillMs = now;
    }
    if (rate.tokens >= 1) {
      rate.tokens -= 1;
      return true; // ALLOW input
    }
    rate.droppedRateLimit++;
    return false; // DROP input (rate limit exceeded)
  }

  /**
   * Ingests a raw input packet from a client.
   * Validates structure, applies rate limiting, and drops stale sequence numbers.
   * Returns true if accepted, false if dropped.
   */
  public push(
    playerId: string,
    rawInput: unknown,
    now: number = Date.now(),
  ): boolean {
    // 1. Zod validation
    const parsed = InputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return false;
    }

    // 2. Token-bucket rate limiting
    if (!this.checkRateLimit(playerId, now)) {
      return false;
    }

    // 3. Wrap-aware sequence number comparison
    const existing = this.latestInputs.get(playerId);
    if (existing) {
      if (!seqNewer(parsed.data.seq, existing.seq)) {
        const rate = this.rateLimits.get(playerId);
        if (rate) {
          rate.droppedStaleSeq++;
        }
        return false; // Drop stale or duplicate packet
      }
    }

    // 4. Accept newest input
    this.latestInputs.set(playerId, {
      seq: parsed.data.seq,
      bits: parsed.data.bits,
      lastTimestamp: now,
    });
    return true;
  }

  /**
   * Retrieves the latest accepted input record for a player.
   */
  public get(playerId: string): PlayerInputRecord | undefined {
    return this.latestInputs.get(playerId);
  }

  /**
   * Convenience getter: returns the current input bitfield (0..15), or 0 if none.
   */
  public getBits(playerId: string): number {
    return this.latestInputs.get(playerId)?.bits ?? 0;
  }

  /**
   * Returns telemetry/stats on dropped packets for a player.
   */
  public getStats(playerId: string): PlayerRateLimitState | undefined {
    return this.rateLimits.get(playerId);
  }

  /**
   * Cleans up state when a player leaves the room.
   */
  public removePlayer(playerId: string) {
    this.latestInputs.delete(playerId);
    this.rateLimits.delete(playerId);
  }

  /**
   * Resets all inputs and rate limits (e.g. at round start/end).
   */
  public clear() {
    this.latestInputs.clear();
    this.rateLimits.clear();
  }
}
