// ─── src/rooms/presence.ts ────────────────────────────────────────────────────
// Player presence, AFK detection, temporary bot takeover, and kick management.
// References: backend-spec s3.3, s7; backend-implementation-plan Step 6.
// ─────────────────────────────────────────────────────────────────────────────

import {
  RECONNECT_WINDOW_SEC,
  AFK_WARN_SEC,
  AFK_BOT_SEC,
} from "@mutator-party/shared";

export interface PlayerPresenceRecord {
  lastInputTime: number;
  afkWarned: boolean;
  isAfkBot: boolean;
  disconnected: boolean;
  disconnectTime?: number;
}

export class PresenceManager {
  private players = new Map<string, PlayerPresenceRecord>();
  private bannedTokens = new Set<string>();

  /**
   * Registers a new player or updates an existing presence record.
   */
  public registerPlayer(playerId: string, now: number = Date.now()) {
    if (!this.players.has(playerId)) {
      this.players.set(playerId, {
        lastInputTime: now,
        afkWarned: false,
        isAfkBot: false,
        disconnected: false,
      });
    }
  }

  /**
   * Called whenever a valid input packet is ingested.
   * Resets AFK timer and restores control if an AFK bot had taken over.
   */
  public recordInput(playerId: string, now: number = Date.now()): boolean {
    const record = this.players.get(playerId);
    if (!record) {
      this.registerPlayer(playerId, now);
      return false;
    }

    record.lastInputTime = now;
    record.afkWarned = false;

    // If bot had taken over due to AFK, return true to signal restoration
    if (record.isAfkBot) {
      record.isAfkBot = false;
      return true; // Restored from AFK
    }

    return false;
  }

  /**
   * Checks for players who have gone idle during the 'play' phase.
   * - 15s without input -> onWarn callback
   * - 30s without input -> onTakeover callback (bot replaces player)
   */
  public checkAFK(
    now: number,
    isPlayPhase: boolean,
    onWarn: (playerId: string) => void,
    onTakeover: (playerId: string) => void,
  ) {
    if (!isPlayPhase) return;

    for (const [playerId, record] of this.players.entries()) {
      if (record.disconnected || record.isAfkBot) continue;

      const idleSec = (now - record.lastInputTime) / 1000;

      // 30s AFK -> Bot takeover
      if (idleSec >= AFK_BOT_SEC) {
        record.isAfkBot = true;
        onTakeover(playerId);
      }
      // 15s AFK -> Warn
      else if (idleSec >= AFK_WARN_SEC && !record.afkWarned) {
        record.afkWarned = true;
        onWarn(playerId);
      }
    }
  }
  /**
   * Marks player as disconnected and timestamps the drop.
   */
  public handleDisconnect(playerId: string, now: number = Date.now()) {
    const record = this.players.get(playerId);
    if (record) {
      record.disconnected = true;
      record.disconnectTime = now;
    }
  }

  /**
   * Restores player connection state and clears disconnect flags.
   */
  public handleReconnect(playerId: string, now: number = Date.now()) {
    const record = this.players.get(playerId);
    if (record) {
      record.disconnected = false;
      record.disconnectTime = undefined;
      record.isAfkBot = false;
      record.lastInputTime = now;
    }
  }

  /**
   * Checks if a disconnected player is still within the 30s reconnect window.
   */
  public isWithinReconnectWindow(
    playerId: string,
    now: number = Date.now(),
  ): boolean {
    const record = this.players.get(playerId);
    if (
      !record ||
      !record.disconnected ||
      record.disconnectTime === undefined
    ) {
      return false;
    }
    const elapsedSec = (now - record.disconnectTime) / 1000;
    return elapsedSec <= RECONNECT_WINDOW_SEC;
  }

  /**
   * Blacklists a player and their token for the lifetime of this room.
   */
  public kick(targetId: string, token?: string) {
    this.bannedTokens.add(targetId);
    if (token) {
      this.bannedTokens.add(token);
    }
    this.players.delete(targetId);
  }

  /**
   * Checks if a player ID or session token is banned.
   */
  public isBanned(tokenOrId: string): boolean {
    return this.bannedTokens.has(tokenOrId);
  }

  /**
   * Returns presence record for a player.
   */
  public get(playerId: string): PlayerPresenceRecord | undefined {
    return this.players.get(playerId);
  }

  /**
   * Cleans up tracking when a player leaves permanently.
   */
  public removePlayer(playerId: string) {
    this.players.delete(playerId);
  }

  /**
   * Clears active player records while preserving the banned tokens list.
   */
  public clear() {
    this.players.clear();
  }
}
