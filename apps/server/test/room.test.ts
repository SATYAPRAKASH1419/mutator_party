import { describe, expect, it } from "vitest";
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
});
