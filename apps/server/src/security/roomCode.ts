import { randomInt } from "node:crypto";

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 5;

export const ROOM_UNAVAILABLE_ERROR = {
  code: "ROOM_UNAVAILABLE",
  message: "We could not find that room.",
} as const;

/**
 * Generates a crypto-random 5-character room code from the safe alphabet.
 */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const index = randomInt(0, ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[index];
  }
  return code;
}

/**
 * Validates and normalizes a candidate room code.
 * Returns normalized uppercase code if valid, null if invalid.
 */

export function normalizeRoomCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input.trim().toUpperCase();
  if (cleaned.length !== ROOM_CODE_LENGTH) return null;
  for (let i = 0; i < cleaned.length; i++) {
    if (!ROOM_CODE_ALPHABET.includes(cleaned[i]!)) {
      return null;
    }
  }
  return cleaned;
}
