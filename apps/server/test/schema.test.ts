import { describe, expect, it } from "vitest";
import { RoomState, PlayerSchema, CrateSchema } from "../src/rooms/schema.js";

describe("RoomState Schema", () => {
  it("initializes with default lobby state", () => {
    const state = new RoomState();
    expect(state.phase).toBe("lobby");
    expect(state.round).toBe(0);
    expect(state.mode).toBe("brawl");
    expect(state.themeId).toBe("sunny");
    expect(state.players.size).toBe(0);
    expect(state.crates.length).toBe(0);
    expect(state.twists.length).toBe(0);
  });

  it("can add and update players in MapSchema", () => {
    const state = new RoomState();
    const player = new PlayerSchema();
    player.id = "p1";
    player.name = "Alex";
    player.host = true;
    player.ready = true;
    player.x = 480;
    player.y = 300;

    state.players.set("session-1", player);

    expect(state.players.size).toBe(1);
    expect(state.players.get("session-1")?.name).toBe("Alex");
    expect(state.players.get("session-1")?.host).toBe(true);
    expect(state.players.get("session-1")?.x).toBe(480);
  });

  it("can manage crates and twists array schemas", () => {
    const state = new RoomState();
    state.twists.push("moon");
    state.twists.push("ice");

    const crate = new CrateSchema();
    crate.id = 1;
    crate.x = 200;
    crate.y = 350;
    crate.itemType = "mega";
    crate.state = "live";
    state.crates.push(crate);

    expect(state.twists.toArray()).toEqual(["moon", "ice"]);
    expect(state.crates.length).toBe(1);
    expect(state.crates[0]?.itemType).toBe("mega");
  });
});
