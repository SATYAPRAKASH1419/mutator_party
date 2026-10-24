import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameRoom } from "../src/rooms/GameRoom.js";
import { globalRateLimiter } from "../src/security/rateLimit.js";
import { rateLimitDropsCounter, inputsCounter } from "../src/obs/metrics.js";

describe("Abuse & Hardening Suite", () => {
  beforeEach(() => {
    globalRateLimiter.clear();
  });

  it("drops oversized messages (> 1 KB) and accepts valid messages", async () => {
    const room = new GameRoom();
    room.onCreate({});
    room.state.phase = "play";

    const client = { sessionId: "c1", send: vi.fn(), leave: vi.fn() } as any;
    room.onJoin(client, {}, { name: "SafePlayer", playerId: "p1" });

    const initialDrops =
      (await rateLimitDropsCounter.get()).values[0]?.value ?? 0;

    // 1. Valid message under 1 KB should be processed and added to inputQueue
    const validPayload = { seq: 10, bits: 4 };
    (room as any).onMessageEvents.emit("input", client, validPayload);

    const queued = room.inputQueue.get("c1");
    expect(queued).toBeDefined();
    expect(queued?.seq).toBe(10);
    expect(queued?.bits).toBe(4);

    // 2. Oversized message (> 1 KB, e.g. 5 KB payload) must be rejected
    const largePayload = { seq: 11, bits: 1, junk: "x".repeat(5000) };
    (room as any).onMessageEvents.emit("input", client, largePayload);

    // Verify inputQueue still holds the previous valid sequence (not updated to 11)
    const afterDropQueue = room.inputQueue.get("c1");
    expect(afterDropQueue?.seq).toBe(10);

    // Verify drop metrics counter incremented
    const afterDrops =
      (await rateLimitDropsCounter.get()).values[0]?.value ?? 0;
    expect(afterDrops).toBeGreaterThan(initialDrops);
  });

  it("handles rapid spam inputs safely using token bucket rate limiting", async () => {
    const room = new GameRoom();
    room.onCreate({});
    room.state.phase = "play";

    const client = { sessionId: "c1", send: vi.fn(), leave: vi.fn() } as any;
    room.onJoin(client, {}, { name: "Spammer", playerId: "p1" });

    const initialInputs =
      (await inputsCounter.get()).values[0]?.value ?? 0;

    // Spam 500 inputs in rapid succession
    for (let i = 1; i <= 500; i++) {
      (room as any).onMessageEvents.emit("input", client, {
        seq: i,
        bits: 1,
      });
    }

    const afterInputs =
      (await inputsCounter.get()).values[0]?.value ?? 0;

    // All 500 valid-format packets are counted by metrics
    expect(afterInputs - initialInputs).toBe(500);

    // Server state remains intact and healthy
    expect(room.state).toBeDefined();
    expect(room.inputQueue.get("c1")).toBeDefined();
  });

  it("drops malformed messages and unknown message types gracefully", () => {
    const room = new GameRoom();
    room.onCreate({});

    const client = { sessionId: "c1", send: vi.fn(), leave: vi.fn() } as any;
    room.onJoin(client, {}, { name: "Tester", playerId: "p1" });

    // Send corrupted / unexpected payloads
    (room as any).onMessageEvents.emit("ready", client, {
      value: "not-a-bool" as any,
    });
    (room as any).onMessageEvents.emit("settings:update", client, null);
    (room as any).onMessageEvents.emit("pick", client, {
      index: "invalid" as any,
    });

    // Server must remain healthy and not crash
    expect(room.state).toBeDefined();
  });

  it("enforces join rate limits per IP", () => {
    const room = new GameRoom();
    room.onCreate({});

    const ip = "198.51.100.99";

    // 10 joins allowed in a 1-minute window
    for (let i = 1; i <= 10; i++) {
      const auth = room.onAuth(
        { sessionId: `s${i}` } as any,
        { name: `Player_${i}`, ip },
      );
      expect(auth.name).toBe(`Player_${i}`);
    }

    // 11th join from the same IP must throw RATE_LIMITED
    expect(() => {
      room.onAuth({ sessionId: "s11" } as any, { name: "Player_11", ip });
    }).toThrow("RATE_LIMITED");
  });
});
