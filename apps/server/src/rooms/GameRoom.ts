import { Room, Client } from "colyseus";
import { randomInt } from "node:crypto";
import { performance } from "node:perf_hooks";
import { z } from "zod";
import {
  sanitize,
  DEFAULTS,
  PLAYER_COLORS,
  ROUND_TIME,
  type RoomSettings,
  type SimState,
  type PlayerState,
  type Twist,
  step,
  generateArena,
  hashSeed,
  mulberry32,
  shuffleArray,
  ISLAND_TILES_BY_SIZE,
  TICK_HZ,
  calculateRoundScores,
  RECONNECT_WINDOW_SEC,
} from "@mutator-party/shared";
import { RoomState, PlayerSchema, CrateSchema } from "./schema.js";
import { generateRoomCode } from "../security/roomCode.js";
import {
  validatePlayerName,
  deduplicatePlayerName,
} from "../security/names.js";
import { PhaseController, type RoundConfig } from "./phases.js";
import { InputQueue } from "./inputQueue.js";
import { PresenceManager } from "./presence.js";
import type { PlayerSummary } from "./pickers.js";
import { config as serverConfig } from "../config.js";
import { globalRateLimiter, IpRateLimiter } from "../security/rateLimit.js";
import { validateOrigin } from "../security/origin.js";
import { roomLogger } from "../obs/logger.js";
import {
  roomsCreatedCounter,
  activeRoomsGauge,
  activePlayersGauge,
  activeBotsGauge,
  inputsCounter,
  kicksCounter,
  simTickDurationHistogram,
  rateLimitDropsCounter,
} from "../obs/metrics.js";
import { getDrainingStatus } from "../index.js";

export { PLAYER_COLORS };

export const JoinOptionsSchema = z.object({
  code: z.string().optional(),
  name: z.string(),
  color: z.coerce.number().int().min(0).max(7).optional(),
  playerId: z.string().optional(),
  token: z.string().optional(),
  ip: z.string().optional(),
});

export type JoinOptions = z.infer<typeof JoinOptionsSchema>;

export class GameRoom extends Room<{
  state: RoomState;
  metadata: { code: string };
}> {
  roomCode!: string;
  settings!: RoomSettings;
  phaseController!: PhaseController;
  inputQueue = new InputQueue();
  presenceManager = new PresenceManager();
  simState?: SimState;
  createdAt = Date.now();
  creatorIp = "127.0.0.1";
  private simTimer?: { clear: () => void };
  private emptyTimeout?: { clear: () => void };

  override onCreate(options: any) {
    if (getDrainingStatus()) {
      throw new Error("SERVER_DRAINING");
    }

    this.state = new RoomState();
    this.autoDispose = false;

    // Generate room code and publish in metadata for lookup (safe in unit tests)
    this.roomCode = generateRoomCode();
    if ((this as any)._listing) {
      this.setMetadata({ code: this.roomCode }).catch(() => {});
    }

    // IP tracking & limits if provided in options
    if (options?.ip) {
      this.creatorIp = options.ip;
      if (!globalRateLimiter.allowCreation(this.creatorIp)) {
        rateLimitDropsCounter.inc({ type: "creation" });
        throw new Error("RATE_LIMITED");
      }
      globalRateLimiter.trackRoomCreated(this.creatorIp, this.roomId);
    }

    // Observability metrics
    roomsCreatedCounter.inc();
    activeRoomsGauge.inc();
    roomLogger.created(this.roomId, this.roomCode, this.creatorIp);

    // Validate and sanitize room settings
    this.settings = sanitize(options?.settings ?? DEFAULTS);
    this.maxClients = this.settings.match.maxPlayers;

    // Start 60s empty room disposal timer
    this.resetEmptyTimeout();

    // Initialize Phase Controller with room seed and Colyseus clock
    const roomSeed = randomInt(0, 0xffffffff);
    this.phaseController = new PhaseController(
      this.settings,
      roomSeed,
      this.clock,
      {
        onPhaseChange: (phase, timeLeftSec) => {
          this.state.phase = phase;
          this.state.timeLeft = timeLeftSec;
          if (phase === "play") {
            this.startSimLoop();
          } else {
            this.stopSimLoop();
          }
        },
        onRoundStart: (config) => this.handleRoundStart(config),
        onPickOffer: (offer) => {
          this.broadcast("pick:offer", offer);
        },
        onRoundEnd: (round) => this.handleRoundEnd(round),
        onMatchEnd: () => this.handleMatchEnd(),
      },
    );

    // Register lobby message handlers
    this.registerMessageHandlers();
  }

  override onAuth(client: Client, options: any, context?: any) {
    if (getDrainingStatus()) {
      throw new Error("SERVER_DRAINING");
    }

    // Validate Origin header
    if (context?.headers?.origin && serverConfig.ALLOWED_ORIGINS) {
      if (!validateOrigin(context.headers.origin, serverConfig.ALLOWED_ORIGINS)) {
        throw new Error("ORIGIN_NOT_ALLOWED");
      }
    }

    // IP rate limit check
    const ip = context ? IpRateLimiter.extractIp(context) : (options?.ip ?? "127.0.0.1");
    if (!globalRateLimiter.allowJoin(ip)) {
      rateLimitDropsCounter.inc({ type: "join" });
      roomLogger.rateLimitExceeded(ip, "join");
      throw new Error("RATE_LIMITED");
    }

    const parsed = JoinOptionsSchema.safeParse(options);
    if (!parsed.success) {
      throw new Error("INVALID_JOIN_OPTIONS");
    }

    const playerId = parsed.data.playerId ?? client.sessionId;
    if (
      this.presenceManager.isBanned(playerId) ||
      (parsed.data.token && this.presenceManager.isBanned(parsed.data.token))
    ) {
      throw new Error("BANNED");
    }

    const nameValidation = validatePlayerName(parsed.data.name);
    if (!nameValidation.valid || !nameValidation.name) {
      throw new Error(nameValidation.error ?? "INVALID_NAME");
    }

    return {
      name: nameValidation.name,
      colorIndex: parsed.data.color,
      playerId,
      token: parsed.data.token,
    };
  }

  override onJoin(client: Client, _options: any, auth: any) {
    // If room was empty, cancel disposal timer
    if (this.emptyTimeout) {
      this.emptyTimeout.clear();
      this.emptyTimeout = undefined;
    }

    const existingNames = Array.from(this.state.players.values()).map(
      (p) => p.name,
    );
    const finalName = deduplicatePlayerName(auth.name, existingNames);

    const player = new PlayerSchema();
    player.id = auth.playerId;
    player.name = finalName;

    // Assign color: prefer requested, otherwise pick first available or cycle
    const assignedColor = this.assignPlayerColor(auth.colorIndex);
    player.color = assignedColor;

    // First human to join becomes the host
    const hasHost = Array.from(this.state.players.values()).some(
      (p) => p.host && !p.isBot,
    );
    player.host = !hasHost;
    player.connected = true;

    this.state.players.set(client.sessionId, player);
    this.presenceManager.registerPlayer(client.sessionId);

    activePlayersGauge.inc();
    roomLogger.playerJoined(this.roomId, this.roomCode, this.state.players.size);
  }

  override async onLeave(client: Client, code?: number) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const wasHost = player.host;
    const isConsented = code === 1000;

    // 1. Reconnect window: If disconnected mid-play and not consented, bot takes over for 30s
    if (this.state.phase === "play" && !isConsented) {
      player.connected = false;
      player.isBot = true;
      this.presenceManager.handleDisconnect(client.sessionId);

      try {
        await this.allowReconnection(client, RECONNECT_WINDOW_SEC);
        // Player reconnected successfully!
        player.connected = true;
        player.isBot = false;
        this.presenceManager.handleReconnect(client.sessionId);
        return;
      } catch {
        // 30s expired without reconnecting -> proceed to permanent removal
      }
    }

    // 2. Remove player permanently
    this.state.players.delete(client.sessionId);
    this.presenceManager.removePlayer(client.sessionId);

    activePlayersGauge.dec();
    roomLogger.playerLeft(this.roomId, this.roomCode, this.state.players.size);

    // 3. Host migration: if the host left, pass host to the next connected human
    if (wasHost) {
      const nextHost = Array.from(this.state.players.values()).find(
        (p) => p.connected && !p.isBot,
      );
      if (nextHost) {
        nextHost.host = true;
      }
    }

    // 4. If no human players remain, dispose immediately (spec s7)
    const humanCount = Array.from(this.state.players.values()).filter(
      (p) => !p.isBot,
    ).length;
    if (humanCount === 0) {
      this.disconnect();
    }
  }

  override onDispose() {
    this.stopSimLoop();
    activeRoomsGauge.dec();
    globalRateLimiter.trackRoomDisposed(this.creatorIp, this.roomId);
    roomLogger.disposed(
      this.roomId,
      this.roomCode,
      this.state.round,
      Date.now() - this.createdAt,
    );
  }

  private assignPlayerColor(requestedIndex?: number): string {
    const usedColors = new Set(
      Array.from(this.state.players.values()).map((p) => p.color),
    );

    if (
      requestedIndex !== undefined &&
      requestedIndex >= 0 &&
      requestedIndex < PLAYER_COLORS.length
    ) {
      const requested = PLAYER_COLORS[requestedIndex]!;
      if (!usedColors.has(requested)) {
        return requested;
      }
    }

    // Find first unused color
    for (const color of PLAYER_COLORS) {
      if (!usedColors.has(color)) return color;
    }

    // All 8 taken (e.g. 12 player room), wrap around
    return PLAYER_COLORS[this.state.players.size % PLAYER_COLORS.length]!;
  }

  private resetEmptyTimeout() {
    if (this.emptyTimeout) {
      this.emptyTimeout.clear();
    }
    this.emptyTimeout = this.clock.setTimeout(() => {
      this.disconnect();
    }, 60_000);
  }

  private getPlayerSummaries(): PlayerSummary[] {
    const list: PlayerSummary[] = [];
    this.state.players.forEach((p, sessionId) => {
      list.push({
        id: sessionId,
        name: p.name,
        score: p.score,
        isBot: p.isBot,
        connected: p.connected,
        host: p.host,
      });
    });
    return list;
  }

  private startSimLoop() {
    this.stopSimLoop();
    const intervalMs = 1000 / TICK_HZ;
    this.simTimer = this.clock.setInterval(() => {
      this.simTick();
    }, intervalMs);
  }

  private stopSimLoop() {
    if (this.simTimer) {
      this.simTimer.clear();
      this.simTimer = undefined;
    }
  }

  private simTick() {
    if (!this.simState || this.state.phase !== "play") {
      return;
    }

    const tickStart = performance.now();

    // 1. Ingest human inputs from InputQueue & echo ackSeq
    const inputs = new Map<string, number>();
    for (const p of this.simState.players) {
      if (!p.isBot) {
        const record = this.inputQueue.get(p.id);
        if (record) {
          inputs.set(p.id, record.bits);
          const schemaP = this.state.players.get(p.id);
          if (schemaP) {
            schemaP.ackSeq = record.seq;
          }
        }
      }
    }

    // 2. Advance physics & rules by 1 fixed step (1/30 s)
    const activeTwists = Array.from(this.state.twists.values()) as Twist[];
    const events = step(this.simState, inputs, activeTwists, 1 / TICK_HZ);

    // 3. Drain and broadcast sim events
    for (const ev of events) {
      this.broadcast("event", ev);
    }

    // 4. Sync SimState to Colyseus schema
    this.state.timeLeft = Math.max(0, this.simState.timeLeft ?? 0);

    for (const simP of this.simState.players) {
      const schemaP = this.state.players.get(simP.id);
      if (!schemaP) continue;

      schemaP.x = simP.x;
      schemaP.y = simP.y;
      schemaP.vx = simP.vx;
      schemaP.vy = simP.vy;
      schemaP.scale = simP.scale;
      schemaP.facingRight = simP.facingRight;
      schemaP.hits = simP.hitsTaken;
      schemaP.lives = simP.lives;
      schemaP.score = simP.score;
      schemaP.item = simP.item ?? "";
      schemaP.grounded = simP.grounded;
      schemaP.stunned = (simP.stunTimer ?? 0) > 0;
      schemaP.frozen = (simP.freezeTimer ?? 0) > 0;
      schemaP.shielded = (simP.shieldTimer ?? 0) > 0;
      schemaP.isOut = simP.isOut;
    }

    // Sync mode objects
    if (this.simState.bomb) {
      this.state.bomb.holderId = this.simState.bomb.holderId ?? "";
      this.state.bomb.fuse = this.simState.bomb.fuse;
    }
    if (this.simState.crown) {
      this.state.crown.holderId = this.simState.crown.holderId ?? "";
      this.state.crown.x = this.simState.crown.x ?? 0;
      this.state.crown.y = this.simState.crown.y ?? 0;
    }

    // Sync crates
    this.state.crates.clear();
    for (const crate of this.simState.crates) {
      const crateSchema = new CrateSchema();
      crateSchema.id = crate.id;
      crateSchema.x = crate.x;
      crateSchema.y = crate.y;
      crateSchema.itemType = crate.type ?? crate.item ?? "";
      crateSchema.state = crate.state;
      this.state.crates.push(crateSchema);
    }

    // 5. AFK Detection during play phase
    this.presenceManager.checkAFK(
      Date.now(),
      this.state.phase === "play",
      (afkId) => {
        const p = this.state.players.get(afkId);
        if (p) {
          this.broadcast("toast", { message: `${p.name} is AFK!` });
        }
      },
      (takeoverId) => {
        const p = this.state.players.get(takeoverId);
        if (p) {
          p.isBot = true;
          this.broadcast("toast", { message: `Bot took over for ${p.name}` });
        }
      },
    );

    // Record tick duration histogram
    const tickDurationMs = performance.now() - tickStart;
    simTickDurationHistogram.observe(tickDurationMs);

    // 6. Check if mode signals round conclusion
    if (this.simState.endTimer !== undefined && this.simState.endTimer <= 0) {
      this.stopSimLoop();
      this.phaseController.endRound(this.getPlayerSummaries());
    }
  }

  private handleRoundEnd(round: number) {
    this.stopSimLoop();
    if (!this.simState) return;

    roomLogger.roundEnd(this.roomId, this.roomCode, round, 0);

    const scoringMode =
      (this.settings.match.scoring as "standard" | "winner_plus" | "kills") ??
      "standard";
    const ranking = calculateRoundScores(this.simState, scoringMode);

    // Sync updated total scores to schema
    for (const r of ranking) {
      const p = this.state.players.get(r.playerId);
      if (p) {
        p.score = r.totalScore;
      }
    }

    this.broadcast("round_end", {
      round,
      ranking,
    });
  }

  private handleMatchEnd() {
    this.stopSimLoop();
    const standings = Array.from(this.state.players.values())
      .map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        score: p.score,
        isBot: p.isBot,
      }))
      .sort((a, b) => b.score - a.score);

    this.broadcast("match_end", { standings });
  }

  private handleRoundStart(config: RoundConfig) {
    roomLogger.roundStart(
      this.roomId,
      this.roomCode,
      config.roundNumber,
      config.mode,
    );

    // 1. Generate procedural arena layout
    let arenaSeed = config.seed;
    if (this.settings.arena.layout === "per_match") {
      arenaSeed = hashSeed((this.phaseController as any).roomSeed, 0);
    }

    const islandTiles =
      ISLAND_TILES_BY_SIZE[this.settings.arena.islandSize] ?? 6;
    const arena = generateArena({
      seed: arenaSeed,
      round: config.roundNumber,
      platformCount: this.settings.arena.platformCount,
      islandTiles,
      symmetric: this.settings.arena.mirror,
      players: this.settings.match.maxPlayers,
      powerSpots: this.settings.items.enabled ? this.settings.items.spots : 0,
    });

    // 2. Sync room state schema
    this.state.round = config.roundNumber;
    this.state.mode = config.mode;
    this.state.themeId = config.theme;
    this.state.arenaSeed = arenaSeed;
    this.state.twists.clear();
    for (const t of config.twists) {
      this.state.twists.push(t);
    }
    this.state.crates.clear();
    this.state.bomb.holderId = "";
    this.state.bomb.fuse = 0;
    this.state.crown.holderId = "";
    this.state.crown.x = 0;
    this.state.crown.y = 0;

    // 3. Spawns and player state initialization
    const simPlayers: PlayerState[] = [];
    let spawns =
      arena.spawns.length > 0
        ? [...arena.spawns]
        : [{ x: 480, y: 350, onIsland: true }];

    if (this.settings.arena.shuffleSpawns) {
      const rng = mulberry32(config.seed);
      spawns = shuffleArray(spawns, rng);
    }
    let slot = 0;

    this.state.players.forEach((schemaPlayer, sessionId) => {
      const spawn = spawns[slot % spawns.length]!;

      // Update network schema for client rendering
      schemaPlayer.x = spawn.x;
      schemaPlayer.y = spawn.y;
      schemaPlayer.vx = 0;
      schemaPlayer.vy = 0;
      schemaPlayer.hits = 0;
      schemaPlayer.isOut = false;
      schemaPlayer.grounded = true;
      schemaPlayer.shielded = false;
      schemaPlayer.frozen = false;
      schemaPlayer.stunned = false;
      schemaPlayer.item = "";

      // Initialize pure simulation player
      simPlayers.push({
        id: sessionId,
        x: spawn.x,
        y: spawn.y,
        vx: 0,
        vy: 0,
        facingRight: slot % 2 === 0,
        grounded: true,
        airJumpsLeft: 1,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
        shoveTimer: 0,
        stunTimer: 0,
        hitsTaken: 0,
        scale: 1.0,
        isOut: false,
        isBot: schemaPlayer.isBot,
        score: schemaPlayer.score,
        lives:
          this.settings.respawn.mode === "lives"
            ? this.settings.respawn.lives
            : 1,
        botSkill: this.settings.match.botSkill,
      });

      // Send round:start packet per client (spec section 4)
      const client = this.clients.find((c) => c.sessionId === sessionId);
      if (client) {
        client.send("round:start", {
          n: config.roundNumber,
          mode: config.mode,
          twists: config.twists,
          themeId: config.theme,
          seed: config.seed,
          slot,
          pickedBy: config.pickedBy,
        });
      }
      slot++;
    });

    // 4. Determine round duration
    const roundTime =
      this.settings.match.roundTime === "auto"
        ? (ROUND_TIME[config.mode] ?? 60)
        : Number(this.settings.match.roundTime);

    // 5. Build pure SimState
    this.simState = {
      tick: 0,
      rng: { events: hashSeed(config.seed, 0, "events") },
      players: simPlayers,
      island: arena.island,
      platforms: arena.platforms,
      tileStates: [],
      crates: [],
      mode: config.mode,
      timeLeft: roundTime,
      nextCrateId: 1,
      powerSpots: arena.powerSpots,
      respawnConfig: {
        mode: this.settings.respawn.mode,
        lives: this.settings.respawn.lives,
        delaySec: this.settings.respawn.delaySec,
        shieldSec: this.settings.respawn.shieldSec,
      },
      itemConfig: {
        allowed: this.settings.items.allowed,
        firstTouch: this.settings.items.firstTouch,
        keepOnKO: this.settings.items.keepOnKO,
      },
      botSkill: this.settings.match.botSkill,
      events: [],
    };
  }

  private isMessageValid(message: unknown): boolean {
    if (message === undefined || message === null) return true;
    try {
      const len =
        typeof message === "string"
          ? message.length
          : JSON.stringify(message).length;
      if (len > 1024) {
        rateLimitDropsCounter.inc({ type: "input" });
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  private registerMessageHandlers() {
    // 1. Ready toggle
    this.onMessage("ready", (client, message: { value?: boolean }) => {
      if (!this.isMessageValid(message)) return;
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.ready =
          typeof message?.value === "boolean" ? message.value : !player.ready;
      }
    });

    // 2. Settings update (host only)
    this.onMessage("settings:update", (client, partialSettings: unknown) => {
      if (!this.isMessageValid(partialSettings)) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.host) {
        client.send("error", {
          code: "NOT_HOST",
          message: "Only the host can update settings.",
        });
        return;
      }

      if (this.state.phase !== "lobby") {
        client.send("error", {
          code: "SETTINGS_LOCKED",
          message: "Settings are locked during match.",
        });
        return;
      }

      this.settings = sanitize(partialSettings, this.settings);
      this.maxClients = this.settings.match.maxPlayers;
      this.phaseController.updateSettings(this.settings);
      this.broadcast("settings", this.settings);
    });

    // 3. Start game (host only)
    this.onMessage("start", (client, message: unknown) => {
      if (!this.isMessageValid(message)) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.host) {
        client.send("error", {
          code: "NOT_HOST",
          message: "Only the host can start the game.",
        });
        return;
      }
      if (this.state.phase !== "lobby") {
        client.send("error", {
          code: "ALREADY_STARTED",
          message: "Game is already in progress.",
        });
        return;
      }

      // Check min players requirement
      const minRequired = this.settings.match.minPlayersToStart ?? 2;
      const currentHumanCount = Array.from(this.state.players.values()).filter(
        (p) => !p.isBot && p.connected,
      ).length;

      if (!this.settings.match.fillBots && currentHumanCount < minRequired) {
        client.send("error", {
          code: "NOT_ENOUGH_PLAYERS",
          message: `At least ${minRequired} players are required to start.`,
        });
        return;
      }

      // Fill remaining slots with bots if fillBots is enabled
      if (this.settings.match.fillBots) {
        const capacity = this.settings.match.maxPlayers;
        let botIndex = 1;
        let addedBots = 0;
        while (this.state.players.size < capacity) {
          const botId = `bot_${botIndex}`;
          if (!this.state.players.has(botId)) {
            const bot = new PlayerSchema();
            bot.id = botId;
            bot.name = `Bot ${botIndex}`;
            bot.isBot = true;
            bot.ready = true;
            bot.connected = true;
            bot.color = this.assignPlayerColor();
            this.state.players.set(botId, bot);
            addedBots++;
          }
          botIndex++;
        }
        activeBotsGauge.set(addedBots);
      }

      this.phaseController.startMatch(this.getPlayerSummaries());
    });

    // 4. Player input (bits + seq)
    this.onMessage("input", (client, message: unknown) => {
      if (!this.isMessageValid(message)) return;
      inputsCounter.inc();

      if (this.state.phase === "play") {
        this.inputQueue.push(client.sessionId, message, Date.now());

        // Reset AFK and restore human control if bot had taken over
        const restored = this.presenceManager.recordInput(client.sessionId);
        if (restored) {
          const p = this.state.players.get(client.sessionId);
          if (p) {
            p.isBot = false;
            this.broadcast("toast", { message: `${p.name} is back!` });
          }
        }
      }
    });

    // 5. Twist pick or vote
    this.onMessage("pick", (client, message: { index: number }) => {
      if (!this.isMessageValid(message)) return;
      if (typeof message?.index === "number") {
        this.phaseController.handlePick(
          client.sessionId,
          message.index,
          this.getPlayerSummaries(),
        );
      }
    });

    // 6. Host kick command
    this.onMessage("kick", (client, message: { playerId: string }) => {
      if (!this.isMessageValid(message)) return;
      const host = this.state.players.get(client.sessionId);
      if (!host || !host.host) {
        client.send("error", {
          code: "NOT_HOST",
          message: "Only the host can kick players.",
        });
        return;
      }

      const targetId = message?.playerId;
      if (!targetId || targetId === client.sessionId) return;

      const targetClient = this.clients.find((c) => c.sessionId === targetId);
      this.presenceManager.kick(targetId);
      kicksCounter.inc();

      if (targetClient) {
        targetClient.leave(4001, "KICKED");
      }
    });

    // 7. Emote broadcast
    this.onMessage("emote", (client, message: { id: string }) => {
      if (!this.isMessageValid(message)) return;
      const player = this.state.players.get(client.sessionId);
      if (player && typeof message?.id === "string") {
        this.broadcast("emote", { playerId: client.sessionId, id: message.id });
      }
    });
  }
}
