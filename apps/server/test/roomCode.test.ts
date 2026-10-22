import { describe, expect, it } from "vitest";
import {
  ROOM_CODE_ALPHABET,
  generateRoomCode,
  normalizeRoomCode,
  ROOM_UNAVAILABLE_ERROR,
} from "../src/security/roomCode.js";

describe("roomCode", () => {
  it("generates a 5-char code from the safe alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(5);
      for (const char of code) {
        expect(ROOM_CODE_ALPHABET).toContain(char);
      }
    }
  });

  it("normalizes valid codes regardless of case and surrounding whitespace", () => {
    expect(normalizeRoomCode("  kpq7x ")).toBe("KPQ7X");
    expect(normalizeRoomCode("abcde")).toBe("ABCDE");
  });

  it("rejects codes with forbidden look-alike characters (0, O, 1, I, L)", () => {
    expect(normalizeRoomCode("O1234")).toBeNull();
    expect(normalizeRoomCode("01234")).toBeNull();
    expect(normalizeRoomCode("IL123")).toBeNull();
  });

  it("rejects codes with incorrect lengths", () => {
    expect(normalizeRoomCode("ABCD")).toBeNull();
    expect(normalizeRoomCode("ABCDEF")).toBeNull();
    expect(normalizeRoomCode("")).toBeNull();
    expect(normalizeRoomCode(null)).toBeNull();
  });

  it("exports the standard ROOM_UNAVAILABLE_ERROR", () => {
    expect(ROOM_UNAVAILABLE_ERROR.code).toBe("ROOM_UNAVAILABLE");
    expect(ROOM_UNAVAILABLE_ERROR.message).toBe("We could not find that room.");
  });
});
