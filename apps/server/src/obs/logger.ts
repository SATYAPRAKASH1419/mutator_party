// ─── src/obs/logger.ts ────────────────────────────────────────────────────────
// Structured logging using Pino.
// Strict zero-PII policy: logs room lifecycle, durations, error codes, but NO personal data.
// ─────────────────────────────────────────────────────────────────────────────

import { pino } from "pino";
import { config } from "../config.js";

export const logger = pino({
  level: config.LOG_LEVEL ?? "info",
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Structured room lifecycle logger helpers.
 */
export const roomLogger = {
  created: (roomId: string, roomCode: string, ip: string) => {
    logger.info({ event: "room_created", roomId, roomCode, ip });
  },
  playerJoined: (roomId: string, roomCode: string, playersCount: number) => {
    logger.info({ event: "player_joined", roomId, roomCode, playersCount });
  },
  playerLeft: (roomId: string, roomCode: string, playersCount: number) => {
    logger.info({ event: "player_left", roomId, roomCode, playersCount });
  },
  roundStart: (roomId: string, roomCode: string, roundNumber: number, mode: string) => {
    logger.info({ event: "round_start", roomId, roomCode, roundNumber, mode });
  },
  roundEnd: (roomId: string, roomCode: string, roundNumber: number, durationMs: number) => {
    logger.info({ event: "round_end", roomId, roomCode, roundNumber, durationMs });
  },
  disposed: (roomId: string, roomCode: string, totalRounds: number, durationMs: number) => {
    logger.info({ event: "room_disposed", roomId, roomCode, totalRounds, durationMs });
  },
  rateLimitExceeded: (ip: string, action: "join" | "creation" | "input") => {
    logger.warn({ event: "rate_limit_exceeded", ip, action });
  },
};

