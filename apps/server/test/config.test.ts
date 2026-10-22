import { describe, expect, it } from "vitest";
import { ConfigSchema } from "../src/config.js";

describe("ConfigSchema", () => {
  it("loads sensible defaults when env is empty", () => {
    const cfg = ConfigSchema.parse({});
    expect(cfg.PORT).toBe(2567);
    expect(cfg.TICK_HZ).toBe(30);
    expect(cfg.PATCH_HZ).toBe(20);
    expect(cfg.MAX_ROOMS_PER_IP).toBe(3);
    expect(cfg.LOG_LEVEL).toBe("info");
    expect(cfg.ALLOWED_ORIGINS).toEqual([
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ]);
  });

  it("coerces string number and splits comma-separated origins", () => {
    const cfg = ConfigSchema.parse({
      PORT: "8080",
      ALLOWED_ORIGINS: "https://party.example.com, https://play.example.com",
      TICK_HZ: "60",
    });
    expect(cfg.PORT).toBe(8080);
    expect(cfg.TICK_HZ).toBe(60);
    expect(cfg.ALLOWED_ORIGINS).toEqual([
      "https://party.example.com",
      "https://play.example.com",
    ]);
  });
});
