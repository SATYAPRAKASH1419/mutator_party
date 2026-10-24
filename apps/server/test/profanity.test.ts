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

