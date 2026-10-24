import { describe, it, expect, beforeEach } from "vitest";
import { IpRateLimiter } from "../src/security/rateLimit.js";

describe("IpRateLimiter", () => {
  let limiter: IpRateLimiter;

  beforeEach(() => {
    limiter = new IpRateLimiter({
      windowMs: 60_000,
      maxJoinsPerMin: 10,
      maxCreationsPerMin: 5,
      maxOpenRoomsPerIp: 3,
    });
  });

  it("enforces 10 joins per minute limit per IP", () => {
    const ip = "1.2.3.4";
    const now = 1000_000;

    for (let i = 0; i < 10; i++) {
      expect(limiter.allowJoin(ip, now + i * 100)).toBe(true);
    }
    // 11th join in the same window must fail
    expect(limiter.allowJoin(ip, now + 1500)).toBe(false);

    // Other IP is unaffected
    expect(limiter.allowJoin("5.6.7.8", now + 1500)).toBe(true);

    // After window slides (60s later), allows again
    expect(limiter.allowJoin(ip, now + 61_000)).toBe(true);
  });

  it("enforces 5 room creations per minute limit per IP", () => {
    const ip = "10.0.0.1";
    const now = 2000_000;

    for (let i = 0; i < 5; i++) {
      expect(limiter.allowCreation(ip, now + i * 100)).toBe(true);
    }
    // 6th creation in window must fail
    expect(limiter.allowCreation(ip, now + 1000)).toBe(false);
  });

  it("enforces max 3 open rooms per IP", () => {
    const ip = "192.168.1.50";
    const now = 3000_000;

    expect(limiter.allowCreation(ip, now)).toBe(true);
    limiter.trackRoomCreated(ip, "room_1");

    expect(limiter.allowCreation(ip, now)).toBe(true);
    limiter.trackRoomCreated(ip, "room_2");

    expect(limiter.allowCreation(ip, now)).toBe(true);
    limiter.trackRoomCreated(ip, "room_3");

    // 4th room attempt exceeds max open rooms
    expect(limiter.allowCreation(ip, now)).toBe(false);

    // Disposing one room allows creation again
    limiter.trackRoomDisposed(ip, "room_1");
    expect(limiter.allowCreation(ip, now)).toBe(true);
  });

  it("extracts IP correctly from request headers", () => {
    const reqWithForwarded = {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    };
    expect(IpRateLimiter.extractIp(reqWithForwarded)).toBe("203.0.113.195");

    const reqDirect = {
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    };
    expect(IpRateLimiter.extractIp(reqDirect)).toBe("127.0.0.1");
  });
});

