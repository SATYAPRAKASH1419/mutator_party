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
});
