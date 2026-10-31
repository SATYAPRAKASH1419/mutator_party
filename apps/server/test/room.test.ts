import { describe, expect, it, vi } from "vitest";
import { GameRoom, PLAYER_COLORS } from "../src/rooms/GameRoom.js";

describe("GameRoom", () => {
  it("initializes with a valid 5-character code and default settings", () => {
    const room = new GameRoom();
    room.onCreate({});

    expect(room.roomCode).toHaveLength(5);
    expect(room.state.phase).toBe("lobby");
    expect(room.maxClients).toBe(8);
  });

  it("validates join options in onAuth", () => {
    const room = new GameRoom();
    room.onCreate({});
    const dummyClient = { sessionId: "s1" } as any;

    expect(() => room.onAuth(dummyClient, { name: "A" })).toThrow();
    expect(() => room.onAuth(dummyClient, { name: "admin" })).toThrow();

    const auth = room.onAuth(dummyClient, { name: "PlayerOne", color: 2 });
    expect(auth.name).toBe("PlayerOne");
    expect(auth.colorIndex).toBe(2);
  });

  it("assigns host to first player and migrates host when host leaves", () => {
    const room = new GameRoom();
    room.onCreate({});

    const client1 = { sessionId: "s1" } as any;
    const client2 = { sessionId: "s2" } as any;

    room.onJoin(client1, {}, { name: "Alice", playerId: "p1" });
    expect(room.state.players.get("s1")?.host).toBe(true);

    room.onJoin(client2, {}, { name: "Bob", playerId: "p2" });
    expect(room.state.players.get("s2")?.host).toBe(false);

    // Alice leaves -> Bob becomes host
    room.onLeave(client1, 1000);
    expect(room.state.players.get("s1")).toBeUndefined();
    expect(room.state.players.get("s2")?.host).toBe(true);
  });

  it("deduplicates colliding player names", () => {
    const room = new GameRoom();
    room.onCreate({});

    room.onJoin(
      { sessionId: "s1" } as any,
      {},
      { name: "Speedy", playerId: "p1" },
    );
    room.onJoin(
      { sessionId: "s2" } as any,
      {},
      { name: "Speedy", playerId: "p2" },
    );

    expect(room.state.players.get("s1")?.name).toBe("Speedy");
    expect(room.state.players.get("s2")?.name).toBe("Speedy #2");
  });

  it("assigns unique colors when available", () => {
    const room = new GameRoom();
    room.onCreate({});

    room.onJoin(
      { sessionId: "s1" } as any,
      {},
      { name: "P1", playerId: "p1", colorIndex: 0 },
    );
    room.onJoin(
      { sessionId: "s2" } as any,
      {},
      { name: "P2", playerId: "p2", colorIndex: 0 },
    );

    const c1 = room.state.players.get("s1")?.color;
    const c2 = room.state.players.get("s2")?.color;

    expect(c1).toBe(PLAYER_COLORS[0]);
    expect(c2).toBe(PLAYER_COLORS[1]); // Color collision resolved to next free
  });

  it("starts match, generates arena, spawns players, and runs sim tick with ackSeq sync", () => {
    const room = new GameRoom();
    room.onCreate({});

    const client1 = { sessionId: "s1", send: () => {} } as any;
    const client2 = { sessionId: "s2", send: () => {} } as any;

    room.onJoin(client1, {}, { name: "Alice", playerId: "p1" });
    room.onJoin(client2, {}, { name: "Bob", playerId: "p2" });

    // Host starts match
    room.phaseController.startMatch((room as any).getPlayerSummaries());

    expect(room.state.phase).toBe("intro");
    expect(room.state.round).toBe(1);
    expect(room.state.arenaSeed).toBeGreaterThan(0);
    expect(room.state.twists.length).toBeGreaterThanOrEqual(1);

    // Players have spawn coordinates
    const p1 = room.state.players.get("s1");
    expect(p1?.x).toBeGreaterThan(0);
    expect(p1?.y).toBeGreaterThan(0);

    // SimState initialized
    expect(room.simState).toBeDefined();
    expect(room.simState?.players.length).toBe(2);

    // Enter play phase
    (room.phaseController as any).enterPlay();
    expect(room.state.phase).toBe("play");

    // Ingest input from player 1
    room.inputQueue.push("s1", { seq: 10, bits: 1 });

    // Execute one simTick
    (room as any).simTick();

    // Verify ackSeq synced to schema
    expect(p1?.ackSeq).toBe(10);
  });

  it("enforces minPlayersToStart when fillBots is false", () => {
    const room = new GameRoom();
    room.onCreate({ settings: { match: { minPlayersToStart: 2, fillBots: false } } });

    let errorSent: any = null;
    const client1 = {
      sessionId: "s1",
      send: (type: string, data: any) => {
        if (type === "error") errorSent = data;
      },
    } as any;

    room.onJoin(client1, {}, { name: "Solo", playerId: "p1" });

    // Try to start with 1 player
    (room as any).onMessageEvents.emit("start", client1, {});

    expect(errorSent).toBeDefined();
    expect(errorSent.code).toBe("NOT_ENOUGH_PLAYERS");
    expect(room.state.phase).toBe("lobby");
  });

  it("blocks an unready guest and broadcasts a ready-up alert", () => {
    const room = new GameRoom();
    room.onCreate({ settings: { match: { fillBots: true } } });

    let errorSent: any = null;
    let broadcastedType = "";
    let broadcastedData: any = null;
    room.broadcast = (type: any, data: any) => {
      broadcastedType = type;
      broadcastedData = data;
    };

    const host = {
      sessionId: "s1",
      send: (type: string, data: any) => {
        if (type === "error") errorSent = data;
      },
    } as any;
    const guest = { sessionId: "s2", send: () => {} } as any;

    room.onJoin(host, {}, { name: "Host", playerId: "p1" });
    room.onJoin(guest, {}, { name: "Guest", playerId: "p2" });

    (room as any).onMessageEvents.emit("start", host, {});

    expect(errorSent?.code).toBe("PLAYERS_NOT_READY");
    expect(broadcastedType).toBe("toast");
    expect(broadcastedData.message).toContain("Guest");
    expect(room.state.phase).toBe("lobby");

    (room as any).onMessageEvents.emit("ready", guest, { value: true });
    (room as any).onMessageEvents.emit("start", host, {});

    expect(room.state.phase).toBe("intro");
  });

  it("auto-fills bots up to capacity when fillBots is true", () => {
    const room = new GameRoom();
    room.onCreate({
      settings: {
        match: { maxPlayers: 4, minPlayersToStart: 2, fillBots: true },
      },
    });

    const client1 = { sessionId: "s1", send: () => {} } as any;
    room.onJoin(client1, {}, { name: "HostPlayer", playerId: "p1" });

    expect(room.state.players.size).toBe(1);

    // Host starts with fillBots: true
    (room as any).onMessageEvents.emit("start", client1, {});

    // Should fill to 4 players (1 human + 3 bots)
    expect(room.state.players.size).toBe(4);
    expect(room.state.phase).toBe("intro");

    const bots = Array.from(room.state.players.values()).filter((p) => p.isBot);
    expect(bots.length).toBe(3);
    for (const bot of bots) {
      expect(bot.name).toMatch(/^Bot \d+$/);
      expect(bot.color).toBeDefined();
    }
  });

  it("allows host to kick player, blacklists token, and rejects re-join", () => {
    const room = new GameRoom();
    room.onCreate({});

    let kickedCode: any = null;
    const client1 = { sessionId: "s1", send: () => {} } as any;
    const client2 = {
      sessionId: "s2",
      leave: (code: number) => {
        kickedCode = code;
      },
    } as any;

    room.onJoin(client1, {}, { name: "HostPlayer", playerId: "p1" });
    room.onJoin(client2, {}, { name: "TroubleMaker", playerId: "p2" });
    room.clients.push(client1, client2);

    expect(room.state.players.size).toBe(2);

    // Host kicks s2
    (room as any).onMessageEvents.emit("kick", client1, { playerId: "s2" });

    expect(kickedCode).toBe(4001);
    expect(room.presenceManager.isBanned("s2")).toBe(true);

    // Kicked player tries to join again -> throws BANNED
    expect(() =>
      room.onAuth(client2, { name: "TroubleMaker", playerId: "s2" }),
    ).toThrow("BANNED");
  });

  it("allows host to kick a player using their persistent player id", () => {
    const room = new GameRoom();
    room.onCreate({});

    let kickedCode: number | undefined;
    const host = { sessionId: "host-session", send: () => {} } as any;
    const guest = {
      sessionId: "guest-session",
      leave: (code: number) => {
        kickedCode = code;
      },
    } as any;

    room.onJoin(host, {}, { name: "Host", playerId: "host-player" });
    room.onJoin(guest, {}, { name: "Guest", playerId: "guest-player" });
    room.clients.push(host, guest);

    (room as any).onMessageEvents.emit("kick", host, {
      playerId: "guest-player",
    });

    expect(kickedCode).toBe(4001);
    expect(room.presenceManager.isBanned("guest-session")).toBe(true);
  });

  it("broadcasts emotes to all clients", () => {
    const room = new GameRoom();
    room.onCreate({});

    let broadcastedType = "";
    let broadcastedData: any = null;
    room.broadcast = (type: any, data: any) => {
      broadcastedType = type;
      broadcastedData = data;
    };

    const client1 = { sessionId: "s1", send: () => {} } as any;
    room.onJoin(client1, {}, { name: "Alice", playerId: "p1" });

    (room as any).onMessageEvents.emit("emote", client1, { id: "gg" });

    expect(broadcastedType).toBe("emote");
    expect(broadcastedData).toEqual({ playerId: "s1", id: "gg" });
  });

  it("handles mid-match disconnect by activating bot takeover", async () => {
    const room = new GameRoom();
    room.onCreate({});

    const client1 = { sessionId: "s1", send: () => {} } as any;
    const client2 = { sessionId: "s2", send: () => {} } as any;

    room.onJoin(client1, {}, { name: "Alice", playerId: "p1" });
    room.onJoin(client2, {}, { name: "Bob", playerId: "p2" });

    // Set phase to play
    room.state.phase = "play";

    // Mock allowReconnection that immediately rejects (simulating timeout)
    room.allowReconnection = vi.fn().mockRejectedValue(new Error("Timeout"));

    // Bob disconnects without consenting (accidental drop, code 1006)
    await room.onLeave(client2, 1006);

    expect(room.allowReconnection).toHaveBeenCalledWith(client2, 30);
    // After timeout, Bob is removed and Alice remains host
    expect(room.state.players.has("s2")).toBe(false);
  });

  it("initializes mode and twist state correctly on round start (GAP-01, GAP-02, GAP-09)", () => {
    const room = new GameRoom();
    room.onCreate({});

    const client1 = { sessionId: "s1", send: vi.fn() } as any;
    const client2 = { sessionId: "s2", send: vi.fn() } as any;
    (room as any).clients = [client1, client2];

    room.onJoin(client1, {}, { name: "Alice", playerId: "p1" });
    room.onJoin(client2, {}, { name: "Bob", playerId: "p2" });

    // Test Bomb mode setup
    (room as any).handleRoundStart({
      roundNumber: 1,
      mode: "bomb",
      theme: "neon",
      twists: ["tiny", "crumble"],
      seed: 99999,
    });

    expect(room.simState).toBeDefined();
    expect(room.simState?.bomb).toBeDefined();
    expect(room.simState?.tileStates.length).toBeGreaterThan(0);
    expect(room.simState?.nextCrumbleTime).toBeDefined();
    // Verify tiny scale was synced to sim and schema
    expect(room.simState?.players[0]?.scale).toBe(0.55);
    expect(room.state.players.get("s1")?.scale).toBe(0.55);

    // Test Crown mode setup
    (room as any).handleRoundStart({
      roundNumber: 2,
      mode: "crown",
      theme: "sunny",
      twists: ["giant"],
      seed: 88888,
    });

    expect(room.simState?.crown).toBeDefined();
    expect(room.simState?.players[0]?.scale).toBe(1.7);
    expect(room.state.players.get("s1")?.scale).toBe(1.7);
  });

  it("unicasts twist pick card options only to picker (GAP-06)", () => {
    const room = new GameRoom();
    room.onCreate({});

    const sent1: any[] = [];
    const sent2: any[] = [];
    const client1 = { sessionId: "s1", send: (type: string, data: any) => sent1.push({ type, data }) } as any;
    const client2 = { sessionId: "s2", send: (type: string, data: any) => sent2.push({ type, data }) } as any;
    (room as any).clients = [client1, client2];

    room.onJoin(client1, {}, { name: "Alice", playerId: "p1" });
    room.onJoin(client2, {}, { name: "Bob", playerId: "p2" });

    // Trigger onPickOffer with picker s1
    (room.phaseController as any).callbacks.onPickOffer({
      pickerId: "s1",
      cards: ["low", "ice", "speed"],
      isBot: false,
      timeoutSec: 10,
    });

    // Picker s1 receives full cards
    const offerForS1 = sent1.find((m) => m.type === "pick:offer");
    expect(offerForS1?.data.cards).toEqual(["low", "ice", "speed"]);

    // Non-picker s2 receives masked offer without cards
    const offerForS2 = sent2.find((m) => m.type === "pick:offer");
    expect(offerForS2?.data.cards).toEqual([]);
    expect(offerForS2?.data.pickerId).toBe("s1");
  });

  it("allows host to change theme and twistPicker between rounds but locks gameplay settings (GAP-07)", () => {
    const room = new GameRoom();
    room.onCreate({});
    room.broadcast = vi.fn();

    const sent: any[] = [];
    const client1 = { sessionId: "s1", send: (type: string, data: any) => sent.push({ type, data }) } as any;
    (room as any).clients = [client1];
    room.onJoin(client1, {}, { name: "Alice", playerId: "p1" });

    // In results phase: allowed to update theme
    room.state.phase = "results";
    (room as any).onMessageEvents.emit("settings:update", client1, {
      theme: { mode: "fixed", fixed: "neon" },
    });
    expect(room.settings.theme.fixed).toBe("neon");

    // In results phase: rejected when updating match physics/rounds
    (room as any).onMessageEvents.emit("settings:update", client1, {
      match: { maxPlayers: 12 },
    });
    const lastErr = sent.find((m) => m.type === "error" && m.data.code === "SETTINGS_LOCKED");
    expect(lastErr).toBeDefined();

    // In play phase: all settings updates rejected
    room.state.phase = "play";
    (room as any).onMessageEvents.emit("settings:update", client1, {
      theme: { fixed: "desert" },
    });
    expect(room.settings.theme.fixed).toBe("neon"); // not changed
  });
});
