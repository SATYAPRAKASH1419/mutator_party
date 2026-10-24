import { describe, it, expect } from "vitest";
import { InputQueue } from "../src/rooms/inputQueue.js";
import { INPUT_LEFT, INPUT_JUMP } from "@mutator-party/shared";

describe("InputQueue", () => {
  it("accepts valid input packets and rejects malformed payloads", () => {
    const queue = new InputQueue();

    // Valid inputs
    expect(queue.push("p1", { seq: 0, bits: 0 })).toBe(true);
    expect(queue.push("p1", { seq: 1, bits: INPUT_LEFT | INPUT_JUMP })).toBe(true);
    expect(queue.getBits("p1")).toBe(INPUT_LEFT | INPUT_JUMP);

    // Malformed inputs (rejected by Zod)
    expect(queue.push("p1", null)).toBe(false);
    expect(queue.push("p1", { seq: -1, bits: 0 })).toBe(false);
    expect(queue.push("p1", { seq: 2, bits: 16 })).toBe(false); // bits must be 0..15
    expect(queue.push("p1", { seq: "invalid", bits: 1 })).toBe(false);
  });

  it("drops stale and duplicate sequence numbers", () => {
    const queue = new InputQueue();

    expect(queue.push("p1", { seq: 10, bits: 1 })).toBe(true);
    expect(queue.push("p1", { seq: 11, bits: 2 })).toBe(true);

    // Duplicate packet 11
    expect(queue.push("p1", { seq: 11, bits: 4 })).toBe(false);

    // Stale/out-of-order packet 10
    expect(queue.push("p1", { seq: 10, bits: 4 })).toBe(false);

    // Verify latest record remains packet 11
    const latest = queue.get("p1");
    expect(latest?.seq).toBe(11);
    expect(latest?.bits).toBe(2);

    // Verify telemetry counter incremented
    const stats = queue.getStats("p1");
    expect(stats?.droppedStaleSeq).toBe(2);
  });

  it("handles 16-bit sequence number wrap-around (65535 -> 0)", () => {
    const queue = new InputQueue();

    expect(queue.push("p1", { seq: 65534, bits: 1 })).toBe(true);
    expect(queue.push("p1", { seq: 65535, bits: 2 })).toBe(true);

    // Sequence wraps from 65535 to 0 (RFC 1982 wrap-around)
    expect(queue.push("p1", { seq: 0, bits: 4 })).toBe(true);
    expect(queue.get("p1")?.seq).toBe(0);

    expect(queue.push("p1", { seq: 1, bits: 8 })).toBe(true);
    expect(queue.get("p1")?.seq).toBe(1);

    // Now packet 65535 is in the past, should be rejected
    expect(queue.push("p1", { seq: 65535, bits: 1 })).toBe(false);
  });

  it("enforces 60 inputs/s token bucket rate limiting", () => {
    const queue = new InputQueue(60);
    const startMs = 1000;

    // Send 60 inputs in the exact same millisecond (burst capacity)
    for (let i = 0; i < 60; i++) {
      const accepted = queue.push("p1", { seq: i, bits: 1 }, startMs);
      expect(accepted).toBe(true);
    }

    // 61st input at the same millisecond exceeds rate limit -> dropped!
    const overflow = queue.push("p1", { seq: 60, bits: 1 }, startMs);
    expect(overflow).toBe(false);

    const stats = queue.getStats("p1");
    expect(stats?.droppedRateLimit).toBe(1);

    // Advance time by 500ms (refills 30 tokens: (500/1000) * 60 = 30)
    const midMs = startMs + 500;
    for (let i = 61; i <= 90; i++) {
      const accepted = queue.push("p1", { seq: i, bits: 1 }, midMs);
      expect(accepted).toBe(true);
    }

    // 31st input at midMs drops
    expect(queue.push("p1", { seq: 91, bits: 1 }, midMs)).toBe(false);
  });

  it("isolates players and supports cleanup", () => {
    const queue = new InputQueue();

    queue.push("p1", { seq: 1, bits: INPUT_LEFT });
    queue.push("p2", { seq: 10, bits: INPUT_JUMP });

    expect(queue.getBits("p1")).toBe(INPUT_LEFT);
    expect(queue.getBits("p2")).toBe(INPUT_JUMP);
    expect(queue.getBits("unknown")).toBe(0);

    // Remove single player
    queue.removePlayer("p1");
    expect(queue.get("p1")).toBeUndefined();
    expect(queue.get("p2")).toBeDefined();

    // Clear all
    queue.clear();
    expect(queue.get("p2")).toBeUndefined();
  });
});

