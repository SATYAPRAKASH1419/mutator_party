import { describe, expect, it } from "vitest";
import {
  validatePlayerName,
  deduplicatePlayerName,
} from "../src/security/names.js";

describe("validatePlayerName", () => {
  it("accepts clean valid names", () => {
    expect(validatePlayerName("Alex").valid).toBe(true);
    expect(validatePlayerName("O'Connor").valid).toBe(true);
    expect(validatePlayerName("Super-Star_99").valid).toBe(true);
    expect(validatePlayerName("  John Doe  ").name).toBe("John Doe");
  });

  it("rejects names outside 2-16 length", () => {
    expect(validatePlayerName("A").valid).toBe(false);
    expect(validatePlayerName("A".repeat(17)).valid).toBe(false);
  });

  it("collapses multiple whitespace characters into single space", () => {
    const res = validatePlayerName("Sam   Wise");
    expect(res.valid).toBe(true);
    expect(res.name).toBe("Sam Wise");
  });

  it("rejects special characters not allowed", () => {
    expect(validatePlayerName("Alex!").valid).toBe(false);
    expect(validatePlayerName("Alex$").valid).toBe(false);
    expect(validatePlayerName("<b>bold</b>").valid).toBe(false);
  });

  it("blocks URLs, emails, and phone numbers", () => {
    expect(validatePlayerName("visit.com").valid).toBe(false);
    expect(validatePlayerName("user@test").valid).toBe(false);
    expect(validatePlayerName("call9876543210").valid).toBe(false);
  });

  it("rejects reserved and bot names", () => {
    expect(validatePlayerName("host").valid).toBe(false);
    expect(validatePlayerName("Admin").valid).toBe(false);
    expect(validatePlayerName("Pappu").valid).toBe(false);
    expect(validatePlayerName("GOLI").valid).toBe(false);
  });
});

describe("deduplicatePlayerName", () => {
  it("returns original name when no collision exists", () => {
    expect(deduplicatePlayerName("Speedy", ["Slowpoke", "Ninja"])).toBe(
      "Speedy",
    );
  });

  it("appends #2 on first collision, case-insensitively", () => {
    expect(deduplicatePlayerName("Alex", ["alex"])).toBe("Alex #2");
  });

  it("increments suffix if #2 already exists", () => {
    expect(deduplicatePlayerName("Alex", ["Alex", "Alex #2"])).toBe("Alex #3");
  });
});
