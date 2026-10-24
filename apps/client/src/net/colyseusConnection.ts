import { Client, Room } from "colyseus.js";
import type { RoomConnection, ConnectOptions, JoinResult, ConnectionStatus } from "./connection";
import type { RoomClientState, PlayerClientState } from "../app/store";
import type { RoomSettings } from "@mutator-party/shared";
import { PLAYER_COLORS } from "@mutator-party/shared";

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
  };

  private currentSettings: Partial<RoomSettings> = {};
  private localPlayerId = "";
  private roomCode = "";
  private isHost = false;

  constructor(serverUrl = "ws://localhost:2567") {
    this.client = new Client(serverUrl);
  }

  async connect(opts: ConnectOptions): Promise<JoinResult> {
    this.localPlayerId = opts.playerId;
    this.emitStatus("reconnecting");

    try {
      const joinOptions = {
        name: opts.name,
        color: opts.color,
        playerId: opts.playerId,
        token: opts.token,
        settings: opts.settings,
        code: opts.code,
      };

      if (opts.create) {
        this.room = await this.client.create("game", joinOptions);
      } else if (opts.code) {
        // Colyseus filterBy: ["code"]
        this.room = await this.client.join("game", joinOptions);
      } else {
        this.room = await this.client.joinOrCreate("game", joinOptions);
      }

      this.roomCode = this.room.state?.metadata?.code || (this.room as any).metadata?.code || opts.code || "MATCH";
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

    this.room.onMessage("settings", (settings: any) => {
      this.currentSettings = settings;
      this.emit("settings", settings);
    });

    this.room.onMessage("round:start", (data: any) => {
      this.emit("roundStart", data);
    });

    this.room.onMessage("event", (ev: any) => {
      this.emit("event", ev);
    });

    this.room.onMessage("toast", (t: any) => {
      this.emit("event", { type: "toast", payload: t });
    });

    this.room.onMessage("error", (e: any) => {
      this.emit("error", e);
    });

    this.room.onLeave((code) => {
      if (code === 4001) {
        this.emitStatus("kicked");
      } else {
        this.emitStatus("lost");
      }
    });

    this.room.onError((code, message) => {
      this.emit("error", { code: String(code), message });
    });
  }

  private handleStateUpdate(state: any) {
    if (!state) return;

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
          flags: (p.grounded ? 1 : 0) | (p.stunned ? 2 : 0) | (p.shielded ? 4 : 0) | (p.frozen ? 8 : 0),
          score: p.score ?? 0,
          lives: p.lives ?? 3,
          item: p.item || null,
          hits: p.hits ?? 0,
          ackSeq: p.ackSeq ?? 0,
        });
      });
    }

    this.isHost = hostFound;

    const mappedState: RoomClientState = {
      code: this.roomCode || state.metadata?.code || "",
      phase: state.phase || "lobby",
      round: state.round ?? 0,
      mode: state.mode || "brawl",
      twists: state.twists ? Array.from(state.twists) : [],
      themeId: state.themeId || "sunny",
      timeLeft: state.timeLeft ?? 0,
      players: playersList,
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
      this.room?.send("settings:update", patch);
    },
    ready: (value: boolean) => {
      this.room?.send("ready", { value });
    },
    start: () => {
      this.room?.send("start");
    },
    pick: (index: 0 | 1 | 2) => {
      this.room?.send("pick", { index });
    },
    emote: (id: string) => {
      this.room?.send("emote", { id });
    },
    kick: (playerId: string) => {
      this.room?.send("kick", { playerId });
    },
    rematch: () => {
      this.room?.send("start");
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

