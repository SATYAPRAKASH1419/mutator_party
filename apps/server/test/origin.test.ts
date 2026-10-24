import { describe, it, expect } from "vitest";
import { validateOrigin, isOriginAllowed } from "../src/security/origin.js";

describe("Origin validation", () => {
  it("allows non-browser clients without Origin header", () => {
    expect(validateOrigin(undefined, ["http://localhost:3000"])).toBe(true);
    expect(isOriginAllowed({ headers: {} } as any, ["http://localhost:3000"])).toBe(true);
  });

  it("validates exact allowed origins", () => {
    const allowed = ["https://mutator.party", "http://localhost:5173"];
    expect(validateOrigin("https://mutator.party", allowed)).toBe(true);
    expect(validateOrigin("http://localhost:5173/", allowed)).toBe(true);
    expect(validateOrigin("https://evil.attacker.com", allowed)).toBe(false);
  });

  it("supports wildcard allowed origins", () => {
    expect(validateOrigin("https://anywhere.org", ["*"])).toBe(true);
  });
});

