import { describe, it, expect, vi } from "vitest";
import { PresenceManager } from "../src/rooms/presence.js";

describe("PresenceManager", () => {
  it("tracks player registration and updates lastInputTime on input", () => {
    const presence = new PresenceManager();
    presence.registerPlayer("p1", 1000);

    const record = presence.get("p1");
    expect(record).toBeDefined();
    expect(record?.lastInputTime).toBe(1000);
    expect(record?.afkWarned).toBe(false);
    expect(record?.isAfkBot).toBe(false);

    // Record input
    const restored = presence.recordInput("p1", 2000);
    expect(restored).toBe(false); // was not an AFK bot
    expect(presence.get("p1")?.lastInputTime).toBe(2000);
  });

  it("warns at 15s and triggers bot takeover at 30s during play phase", () => {
    const presence = new PresenceManager();
    const startMs = 10_000;
    presence.registerPlayer("p1", startMs);

    const onWarn = vi.fn();
    const onTakeover = vi.fn();

    // 14 seconds idle -> no warning
    presence.checkAFK(startMs + 14_000, true, onWarn, onTakeover);
    expect(onWarn).not.toHaveBeenCalled();
    expect(onTakeover).not.toHaveBeenCalled();

    // 15 seconds idle -> triggers warning
    presence.checkAFK(startMs + 15_000, true, onWarn, onTakeover);
    expect(onWarn).toHaveBeenCalledWith("p1");
    expect(onTakeover).not.toHaveBeenCalled();

    // 29 seconds idle -> warn called only once
    presence.checkAFK(startMs + 29_000, true, onWarn, onTakeover);
    expect(onWarn).toHaveBeenCalledTimes(1);
    expect(onTakeover).not.toHaveBeenCalled();

    // 30 seconds idle -> triggers bot takeover
    presence.checkAFK(startMs + 30_000, true, onWarn, onTakeover);
    expect(onTakeover).toHaveBeenCalledWith("p1");
    expect(presence.get("p1")?.isAfkBot).toBe(true);

    // Player presses a key -> restores control!
    const restored = presence.recordInput("p1", startMs + 35_000);
    expect(restored).toBe(true);
    expect(presence.get("p1")?.isAfkBot).toBe(false);
    expect(presence.get("p1")?.afkWarned).toBe(false);
  });

  it("does not trigger AFK warnings when not in play phase", () => {
    const presence = new PresenceManager();
    presence.registerPlayer("p1", 1000);

    const onWarn = vi.fn();
    const onTakeover = vi.fn();

    // 60 seconds idle, but isPlayPhase is false (e.g. in lobby or results)
    presence.checkAFK(61_000, false, onWarn, onTakeover);
    expect(onWarn).not.toHaveBeenCalled();
    expect(onTakeover).not.toHaveBeenCalled();
  });

  it("handles 30s reconnection window", () => {
    const presence = new PresenceManager();
    presence.registerPlayer("p1", 1000);

    const dropTime = 5000;
    presence.handleDisconnect("p1", dropTime);

    expect(presence.get("p1")?.disconnected).toBe(true);

    // Within 30s window (29s after drop)
    expect(presence.isWithinReconnectWindow("p1", dropTime + 29_000)).toBe(true);

    // Past 30s window (31s after drop)
    expect(presence.isWithinReconnectWindow("p1", dropTime + 31_000)).toBe(false);

    // Reconnect restores state
    presence.handleReconnect("p1", dropTime + 10_000);
    expect(presence.get("p1")?.disconnected).toBe(false);
    expect(presence.isWithinReconnectWindow("p1", dropTime + 10_000)).toBe(false);
  });

  it("kicks and blacklists player ID and token", () => {
    const presence = new PresenceManager();
    presence.registerPlayer("p1", 1000);

    presence.kick("p1", "token-abc-123");

    expect(presence.isBanned("p1")).toBe(true);
    expect(presence.isBanned("token-abc-123")).toBe(true);
    expect(presence.isBanned("other-player")).toBe(false);
    expect(presence.get("p1")).toBeUndefined();

    // clear() clears player records but keeps the blacklist
    presence.clear();
    expect(presence.isBanned("p1")).toBe(true);
    expect(presence.isBanned("token-abc-123")).toBe(true);
  });
});

