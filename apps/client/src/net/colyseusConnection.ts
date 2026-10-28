import { Client, Room, registerSerializer } from "colyseus.js";
import { Reflection, Decoder, decode } from "@colyseus/schema";

/**
 * Custom Colyseus schema serializer for Schema v5 reflection & binary patches.
 * This bridges the Colyseus 0.18 authoritative server with the browser client.
 */
class SchemaSerializerV5 {
  decoder?: Decoder;
  state?: any;

  handshake(bytes: any, it: { offset: number }) {
    const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    // In Colyseus 0.18, JOIN_ROOM includes a varint length prefix for the handshake
    const handshakeLen = decode.number(uint8, it);
    if (handshakeLen > 0) {
      const handshakeBytes = uint8.subarray(it.offset, it.offset + handshakeLen);
      this.decoder = (Reflection as any).decode(handshakeBytes, { offset: 0 });
      this.state = (this.decoder as any).state;
      it.offset += handshakeLen;
    }
  }

  setState(encodedState: any) {
    if (this.decoder) {
      const uint8 = encodedState instanceof Uint8Array ? encodedState : new Uint8Array(encodedState);
      this.decoder.decode(uint8, { offset: 0 });
    }
  }

  patch(binaryPatch: any) {
    if (this.decoder) {
      const uint8 = binaryPatch instanceof Uint8Array ? binaryPatch : new Uint8Array(binaryPatch);
      this.decoder.decode(uint8, { offset: 0 });
    }
  }

  getState() {
    return this.state;
  }
}

// Register SchemaSerializerV5 to decode Colyseus 0.18 / @colyseus/schema v5 state handshakes and patches
registerSerializer("schema", SchemaSerializerV5 as any);
import type { RoomConnection, ConnectOptions, JoinResult, ConnectionStatus } from "./connection";
import type { RoomClientState, PlayerClientState } from "../app/store";
import type { RoomSettings } from "@mutator-party/shared";
import { PLAYER_COLORS, generateRoomCode } from "@mutator-party/shared";
import { clientLog } from "../util/logger";

export class ColyseusRoomConnection implements RoomConnection {
  private client: Client;
  private room: Room<any> | null = null;
  private status: ConnectionStatus = "lost";
  private listeners: Record<string, Set<Function>> = {
    state: new Set(),
    settings: new Set(),
    roundStart: new Set(),
    event: new Set(),
    error: new Set(),
    status: new Set(),
    pickOffer: new Set(),
    emote: new Set(),
    roomInfo: new Set(),
  };

  private currentSettings: Partial<RoomSettings> = {};
  private localPlayerId = "";
  private roomCode = "";
  private isHost = false;

  constructor(serverUrl = "ws://localhost:2567") {
    this.client = new Client(serverUrl);

    // Compatibility bridge: support both Colyseus 0.18 flat seat reservation and legacy response.room
    const origConsume = (this.client as any).consumeSeatReservation?.bind(this.client);
    if (origConsume) {
      (this.client as any).consumeSeatReservation = async (
        response: any,
        rootSchema?: any,
        reuseRoomInstance?: any,
      ) => {
        if (response && !response.room && response.name) {
          response.room = {
            name: response.name,
            roomId: response.roomId,
            processId: response.processId,
            publicAddress: response.publicAddress,
          };
        }
        return origConsume(response, rootSchema, reuseRoomInstance);
      };
    }
  }

  async connect(opts: ConnectOptions): Promise<JoinResult> {
    this.localPlayerId = opts.playerId;
    this.emitStatus("reconnecting");

    try {
      const roomCode = opts.code || (opts.create ? generateRoomCode() : undefined);

      const joinOptions = {
        name: opts.name,
        color: opts.color,
        playerId: opts.playerId,
        token: opts.token,
        settings: opts.settings,
        code: roomCode,
      };

      if (opts.create) {
        this.isHost = true;
        this.room = await this.client.create("game", joinOptions);
      } else if (opts.code) {
        // Colyseus filterBy: ["code"]
        this.room = await this.client.join("game", joinOptions);
      } else {
        this.room = await this.client.joinOrCreate("game", joinOptions);
      }

      this.roomCode =
        this.room.state?.roomCode ||
        this.room.state?.metadata?.code ||
        (this.room as any).metadata?.code ||
        roomCode ||
        "MATCH";

      if (opts.settings) {
        this.currentSettings = opts.settings;
      }

      this.setupRoomListeners();
      this.emitStatus("connected");

      return {
        roomCode: this.roomCode,
        isHost: this.isHost,
        settings: this.currentSettings,
      };
    } catch (err: any) {
      this.emitStatus("lost");
      this.emit("error", {
        code: err?.code || "JOIN_FAILED",
        message: err?.message || "Failed to connect to game room.",
      });
      throw err;
    }
  }

  private setupRoomListeners() {
    if (!this.room) return;

    this.room.onStateChange((state: any) => {
      this.handleStateUpdate(state);
    });

    this.room.onMessage("room:info", (info: any) => {
      clientLog.net("recv room:info", info);
      if (info.code) this.roomCode = info.code;
      if (typeof info.isHost === "boolean") this.isHost = info.isHost;
      if (info.settings) this.currentSettings = info.settings;
      this.emit("roomInfo", info);
      if (info.settings) this.emit("settings", info.settings);
    });

    this.room.onMessage("settings", (settings: any) => {
      clientLog.net("recv settings", settings);
      this.currentSettings = settings;
      this.emit("settings", settings);
    });

    this.room.onMessage("round:start", (data: any) => {
      clientLog.net("recv round:start", data);
      this.emit("roundStart", data);
    });

    this.room.onMessage("pick:offer", (offer: any) => {
      clientLog.net("recv pick:offer", offer);
      this.emit("pickOffer", offer);
    });

    this.room.onMessage("emote", (emoteData: any) => {
      clientLog.net("recv emote", emoteData);
      this.emit("emote", emoteData);
    });

    this.room.onMessage("event", (ev: any) => {
      clientLog.net("recv event", ev);
      this.emit("event", ev);
    });

    this.room.onMessage("toast", (t: any) => {
      this.emit("event", { type: "toast", payload: t, message: t?.message || t });
    });

    this.room.onMessage("error", (e: any) => {
      clientLog.error("recv error", e);
      this.emit("error", e);
    });

    this.room.onLeave((code: number) => {
      if (code === 4001) {
        this.emitStatus("kicked");
      } else {
        this.emitStatus("lost");
      }
    });

    this.room.onError((code: number, message?: string) => {
      this.emit("error", { code: String(code), message: message || "Network error" });
    });
  }

  private handleStateUpdate(state: any) {
    if (!state) return;

    if (state.roomCode) {
      this.roomCode = state.roomCode;
    }

    const playersList: PlayerClientState[] = [];
    let hostFound = false;

    if (state.players) {
      state.players.forEach((p: any, sessionId: string) => {
        const isLocal = sessionId === this.room?.sessionId || p.id === this.localPlayerId;
        if (isLocal && p.host) {
          hostFound = true;
        }

        const colorIdx =
          typeof p.color === "string"
            ? Math.max(0, PLAYER_COLORS.indexOf(p.color as any))
            : (p.color ?? 0);

        playersList.push({
          id: p.id || sessionId,
          name: p.name || "Player",
          color: colorIdx,
          x: p.x ?? 0,
          y: p.y ?? 0,
          vx: p.vx ?? 0,
          vy: p.vy ?? 0,
          scale: p.scale ?? 1.0,
          facingRight: p.facingRight ?? true,
          grounded: Boolean(p.grounded),
          stunned: Boolean(p.stunned),
          frozen: Boolean(p.frozen),
          shielded: Boolean(p.shielded),
          isOut: Boolean(p.isOut),
          connected: p.connected !== false,
          isBot: Boolean(p.isBot),
          ready: Boolean(p.ready),
          host: Boolean(p.host),
          flags: (p.grounded ? 1 : 0) | (p.stunned ? 2 : 0) | (p.shielded ? 4 : 0) | (p.frozen ? 8 : 0),
          score: p.score ?? 0,
          lives: p.lives ?? 3,
          item: p.item || null,
          hits: p.hits ?? 0,
          ackSeq: p.ackSeq ?? 0,
        });
      });
    }

    if (hostFound !== this.isHost) {
      this.isHost = hostFound;
      this.emit("roomInfo", { code: this.roomCode, isHost: this.isHost, settings: this.currentSettings });
    }

    const cratesList = state.crates
      ? Array.from(state.crates).map((c: any) => ({
          id: c.id,
          x: c.x,
          y: c.y,
          itemType: c.itemType || c.type || "",
          state: c.state || "live",
        }))
      : [];

    const bombState = state.bomb
      ? {
          holderId: state.bomb.holderId || "",
          fuse: state.bomb.fuse ?? 0,
          timer: state.bomb.timer ?? 0,
        }
      : undefined;

    const crownState = state.crown
      ? {
          holderId: state.crown.holderId || "",
          x: state.crown.x ?? 480,
          y: state.crown.y ?? 181,
        }
      : undefined;

    const mappedState: RoomClientState = {
      code: this.roomCode || state.metadata?.code || "",
      phase: state.phase || "lobby",
      round: state.round ?? 0,
      mode: state.mode || "brawl",
      twists: state.twists ? Array.from(state.twists) : [],
      themeId: state.themeId || "sunny",
      timeLeft: state.timeLeft ?? 0,
      players: playersList,
      crates: cratesList,
      bomb: bombState,
      crown: crownState,
      crumbleTilesBitmask: state.crumbleTilesBitmask ?? 0,
      crumbleWarnBitmask: state.crumbleWarnBitmask ?? 0,
      maxRounds: this.currentSettings?.match?.rounds ?? 5,
      serverTime: Date.now(),
      seed: state.arenaSeed ?? 0,
    };

    this.emit("state", mappedState);
  }

  send = {
    input: (seq: number, bits: number) => {
      this.room?.send("input", { seq, bits });
    },
    settingsUpdate: (patch: Partial<RoomSettings>) => {
      clientLog.net("send settings:update", patch);
      this.room?.send("settings:update", patch);
    },
    ready: (value: boolean) => {
      clientLog.net("send ready", { value });
      this.room?.send("ready", { value });
    },
    start: () => {
      clientLog.net("send start");
      this.room?.send("start");
    },
    pick: (index: 0 | 1 | 2) => {
      clientLog.net("send pick", { index });
      this.room?.send("pick", { index });
    },
    emote: (id: string) => {
      clientLog.net("send emote", { id });
      this.room?.send("emote", { id });
    },
    kick: (playerId: string) => {
      clientLog.net("send kick", { playerId });
      this.room?.send("kick", { playerId });
    },
    rematch: () => {
      clientLog.net("send rematch");
      this.room?.send("rematch");
    },
    nextRound: () => {
      clientLog.net("send next_round");
      this.room?.send("next_round");
    },
  };

  on(evt: string, cb: Function): () => void {
    if (!this.listeners[evt]) this.listeners[evt] = new Set();
    this.listeners[evt].add(cb);
    return () => this.listeners[evt]?.delete(cb);
  }

  private emit(evt: string, data: any) {
    this.listeners[evt]?.forEach((cb) => cb(data));
  }

  private emitStatus(s: ConnectionStatus) {
    this.status = s;
    this.emit("status", s);
  }

  ping(): number {
    return 15;
  }

  leave(): void {
    this.room?.leave();
    this.emitStatus("lost");
  }
}
