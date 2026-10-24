import { describe, it, expect } from "vitest";
import { containsProfanity, normalizeText } from "../src/security/profanity.js";
import { validatePlayerName } from "../src/security/names.js";

describe("Profanity Filter and Leetspeak Normalization", () => {
  it("normalizes leetspeak and symbols correctly", () => {
    expect(normalizeText("f.u.c.k")).toBe("fuck");
    expect(normalizeText("b!tch")).toBe("bitch");
    expect(normalizeText("a$$hole")).toBe("ashole");
    expect(normalizeText("sh1t")).toBe("shit");
  });

  it("detects exact and obfuscated English profanity", () => {
    expect(containsProfanity("fuck")).toBe(true);
    expect(containsProfanity("F_U_C_K")).toBe(true);
    expect(containsProfanity("sh!t")).toBe(true);
    expect(containsProfanity("b1tch")).toBe(true);
    expect(containsProfanity("cleanPlayer")).toBe(false);
  });

  it("detects Hinglish profanity tokens", () => {
    expect(containsProfanity("chutiya")).toBe(true);
    expect(containsProfanity("chut!ya")).toBe(true);
    expect(containsProfanity("bhenchod")).toBe(true);
    expect(containsProfanity("harami")).toBe(true);
    expect(containsProfanity("playerOne")).toBe(false);
  });

  it("handles short slang tokens (mc, bc) without false positives on benign names", () => {
    // Standalone tokens or word boundaries should be detected
    expect(containsProfanity("mc")).toBe(true);
    expect(containsProfanity("bc")).toBe(true);
    expect(containsProfanity("bad mc")).toBe(true);
    expect(containsProfanity("player_bc")).toBe(true);

    // Benign substrings should NOT be flagged as profanity
    expect(containsProfanity("McQueen")).toBe(false);
    expect(containsProfanity("Tomcat")).toBe(false);
    expect(containsProfanity("abc")).toBe(false);
    expect(containsProfanity("Broadcast")).toBe(false);

    expect(validatePlayerName("McQueen").valid).toBe(true);
    expect(validatePlayerName("Tomcat").valid).toBe(true);
  });

  it("blocks profanity inside validatePlayerName", () => {
    const res = validatePlayerName("badfuck");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("prohibited");

    const leetRes = validatePlayerName("b1tch");
    expect(leetRes.valid).toBe(false);
    expect(leetRes.error).toContain("prohibited");

    const validRes = validatePlayerName("Hero_99");
    expect(validRes.valid).toBe(true);
    expect(validRes.name).toBe("Hero_99");
  });
});

