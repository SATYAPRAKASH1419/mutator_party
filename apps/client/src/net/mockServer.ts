import type {
  RoomConnection,
  ConnectOptions,
  JoinResult,
  ConnectionStatus,
} from "./connection";
import type { RoomClientState, PlayerClientState } from "@/app/store";
import {
  DEFAULTS,
  sanitize,
  type RoomSettings,
  type SimState,
  type PlayerState,
  type Twist,
  step,
  generateArena,
  TICK_HZ,
  initBrawl,
  initBomb,
  initCrown,
  computeBotInput,
  mulberry32,
} from "@mutator-party/shared";

const MOCK_BOT_NAMES = [
  "Pappu",
  "Goli",
  "Chintu",
  "Bunty",
  "Sweety",
  "Pinky",
  "Bittu",
];

export class MockRoomConnection implements RoomConnection {
  private status: ConnectionStatus = "connected";
  private listeners: Record<string, Set<Function>> = {
    state: new Set(),
    settings: new Set(),
    roundStart: new Set(),
    event: new Set(),
    error: new Set(),
    status: new Set(),
  };

  private localPlayerId = "";
  private localName = "";
  private localColor = 0;
  private isHost = true;
  private roomCode = "MOCK1";
  private currentSettings: RoomSettings = sanitize(DEFAULTS);
  private phase = "lobby";
  private roundNumber = 0;
  private simInterval: any = null;
  private inputSeq = 0;
  private localInputBits = 0;

  // Pure simulation state
  private simState: SimState | null = null;
  private playerMeta = new Map<string, { name: string; color: number }>();
  private activeTwists: Twist[] = [];
  private arenaSeed = 12345;
  private rng = mulberry32(12345);

  async connect(opts: ConnectOptions): Promise<JoinResult> {
    this.localPlayerId = opts.playerId;
    this.localName = opts.name || "Player";
    this.localColor = opts.color ?? 0;
    this.isHost = Boolean(opts.create);
    this.roomCode = opts.code || (opts.create ? "HOST1" : "MOCK1");

    if (opts.settings) {
      this.currentSettings = sanitize(opts.settings);
    }

    this.playerMeta.clear();
    this.playerMeta.set(this.localPlayerId, {
      name: this.localName,
      color: this.localColor,
    });

    this.emitStatus("connected");

    setTimeout(() => {
      this.emit("settings", this.currentSettings);
      this.emitMockState();
    }, 50);

    return {
      roomCode: this.roomCode,
      isHost: this.isHost,
      settings: this.currentSettings,
    };
  }

  send = {
    input: (seq: number, bits: number) => {
      this.inputSeq = seq;
      this.localInputBits = bits;
    },
    settingsUpdate: (patch: Partial<RoomSettings>) => {
      this.currentSettings = sanitize({ ...this.currentSettings, ...patch });
      this.emit("settings", this.currentSettings);
    },
    ready: (_value: boolean) => {
      this.emitMockState();
    },
    start: () => {
      if (this.phase === "lobby" || this.phase === "final" || this.phase === "results") {
        this.startNextRound();
      }
    },
    pick: (_index: 0 | 1 | 2) => {
      if (this.phase === "pick") {
        this.phase = "play";
        this.emitMockState();
      }
    },
    emote: (id: string) => {
      this.emit("event", {
        type: "emote",
        payload: { id, playerId: this.localPlayerId },
      });
    },
    kick: (_playerId: string) => {},
    rematch: () => {
      this.roundNumber = 0;
      this.startNextRound();
    },
  };

  private startNextRound() {
    this.roundNumber++;
    this.phase = "play";

    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }

    this.arenaSeed = 10000 + this.roundNumber * 37;
    this.rng = mulberry32(this.arenaSeed);

    const pool = this.currentSettings.modes?.pool ?? ["brawl", "bomb", "crown"];
    const mode = pool[(this.roundNumber - 1) % pool.length] ?? "brawl";

    const botCount = 7;
    const arena = generateArena({
      seed: this.arenaSeed,
      round: this.roundNumber,
      platformCount: this.currentSettings.arena?.platformCount ?? 3,
      islandTiles: 6,
      symmetric: true,
      players: 1 + botCount,
      powerSpots: 2,
    });

    const spawns = arena.spawns.length > 0 ? arena.spawns : [{ x: 480, y: 350, onIsland: true }];

    const simPlayers: PlayerState[] = [];

    // Human player
    const p0Spawn = spawns[0] ?? { x: 480, y: 350 };
    simPlayers.push({
      id: this.localPlayerId,
      x: p0Spawn.x,
      y: p0Spawn.y,
      vx: 0,
      vy: 0,
      facingRight: true,
      grounded: true,
      airJumpsLeft: 1,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      shoveTimer: 0,
      stunTimer: 0,
      hitsTaken: 0,
      scale: 1.0,
      lives: 3,
      score: 0,
      isOut: false,
      isBot: false,
    });
    this.playerMeta.set(this.localPlayerId, {
      name: this.localName,
      color: this.localColor,
    });

    // 7 Bots
    for (let i = 0; i < botCount; i++) {
      const sp = spawns[(i + 1) % spawns.length] ?? { x: 220 + i * 80, y: 350 };
      const botId = `bot_${i + 1}`;
      const botName = MOCK_BOT_NAMES[i % MOCK_BOT_NAMES.length] ?? `Bot ${i + 1}`;
      const botColor = (this.localColor + i + 1) % 8;

      simPlayers.push({
        id: botId,
        x: sp.x,
        y: sp.y,
        vx: 0,
        vy: 0,
        facingRight: i % 2 === 0,
        grounded: true,
        airJumpsLeft: 1,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
        shoveTimer: 0,
        stunTimer: 0,
        hitsTaken: 0,
        scale: 1.0,
        lives: 3,
        score: 0,
        isOut: false,
        isBot: true,
        botSkill: this.currentSettings.match?.botSkill ?? "normal",
      });

      this.playerMeta.set(botId, { name: botName, color: botColor });
    }

    this.simState = {
      tick: 0,
      rng: { events: this.arenaSeed },
      players: simPlayers,
      island: arena.island,
      platforms: arena.platforms,
      tileStates: [],
      crates: [],
      mode,
      timeLeft: 60,
      nextCrateId: 1,
      powerSpots: arena.powerSpots,
      events: [],
    };

    if (mode === "bomb") {
      initBomb(this.simState);
    } else if (mode === "crown") {
      initCrown(this.simState);
    } else {
      initBrawl(this.simState, 60);
    }

    this.activeTwists = [];

    this.emit("roundStart", {
      n: this.roundNumber,
      mode,
      twists: this.activeTwists,
    });

    this.simInterval = setInterval(() => {
      this.tickSim();
    }, 1000 / TICK_HZ);

    this.emitMockState();
  }

  private tickSim() {
    if (!this.simState || this.phase !== "play") return;

    // Collect inputs: human + bot AI
    const inputs = new Map<string, number>();
    inputs.set(this.localPlayerId, this.localInputBits);

    for (const p of this.simState.players) {
      if (p.isBot && !p.isOut) {
        const botBits = computeBotInput(p, this.simState, this.rng);
        inputs.set(p.id, botBits);
      }
    }

    // Advance 1 tick
    const events = step(this.simState, inputs, this.activeTwists, 1 / TICK_HZ);
    for (const ev of events) {
      this.emit("event", ev);
    }

    this.simState.timeLeft = Math.max(0, (this.simState.timeLeft ?? 60) - 1 / TICK_HZ);

    // End round check
    if (this.simState.timeLeft <= 0 || (this.simState.endTimer !== undefined && this.simState.endTimer <= 0)) {
      if (this.roundNumber >= (this.currentSettings.match?.rounds ?? 5)) {
        this.phase = "final";
      } else {
        this.phase = "results";
      }
      if (this.simInterval) {
        clearInterval(this.simInterval);
        this.simInterval = null;
      }
    }

    this.emitMockState();
  }

  private emitMockState() {
    if (this.phase === "lobby") {
      const lobbyPlayers: PlayerClientState[] = [
        {
          id: this.localPlayerId,
          name: this.localName,
          color: this.localColor,
          x: 480,
          y: 300,
          vx: 0,
          vy: 0,
          flags: 0,
          score: 0,
          lives: 3,
          item: null,
          hits: 0,
          ackSeq: this.inputSeq,
        },
      ];

      // Show bot placeholders in lobby if fillBots
      if (this.currentSettings.match?.fillBots) {
        for (let i = 0; i < 7; i++) {
          lobbyPlayers.push({
            id: `bot_${i + 1}`,
            name: MOCK_BOT_NAMES[i % MOCK_BOT_NAMES.length] ?? `Bot ${i + 1}`,
            color: (this.localColor + i + 1) % 8,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            flags: 0,
            score: 0,
            lives: 3,
            item: null,
            hits: 0,
            ackSeq: 0,
          });
        }
      }

      this.emit("state", {
        code: this.roomCode,
        phase: "lobby",
        round: this.roundNumber,
        mode: "brawl",
        twists: [],
        themeId: "sunny",
        timeLeft: 60,
        players: lobbyPlayers,
        serverTime: Date.now(),
        seed: this.arenaSeed,
      });
      return;
    }

    // Play/Results/Final phase
    const clientPlayers: PlayerClientState[] = (this.simState?.players ?? []).map((p) => {
      const meta = this.playerMeta.get(p.id);
      return {
        id: p.id,
        name: meta?.name || (p.id === this.localPlayerId ? this.localName : "Player"),
        color: meta?.color ?? 0,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        flags: (p.grounded ? 1 : 0) | ((p.stunTimer ?? 0) > 0 ? 2 : 0) | ((p.shieldTimer ?? 0) > 0 ? 4 : 0),
        score: p.score ?? 0,
        lives: p.lives ?? (p.isOut ? 0 : 3),
        item: p.item || null,
        hits: p.hitsTaken ?? 0,
        ackSeq: p.id === this.localPlayerId ? this.inputSeq : 0,
      };
    });

    let fallenMask = 0;
    let warnMask = 0;
    if (this.simState?.tileStates) {
      for (const t of this.simState.tileStates) {
        if (t.fallen) fallenMask |= 1 << t.id;
        else if (t.state === "warn") warnMask |= 1 << t.id;
      }
    }

    const state: RoomClientState & { crumbleTilesBitmask?: number; crumbleWarnBitmask?: number; bomb?: any; crown?: any } = {
      code: this.roomCode,
      phase: this.phase,
      round: this.roundNumber,
      mode: this.simState?.mode ?? "brawl",
      twists: this.activeTwists,
      themeId: "sunny",
      timeLeft: Math.ceil(this.simState?.timeLeft ?? 60),
      players: clientPlayers,
      serverTime: Date.now(),
      seed: this.arenaSeed,
      crumbleTilesBitmask: fallenMask,
      crumbleWarnBitmask: warnMask,
      bomb: this.simState?.bomb,
      crown: this.simState?.crown,
    };

    this.emit("state", state);
  }

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
    return 12;
  }

  leave(): void {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.phase = "lobby";
    this.emitStatus("lost");
  }
}
