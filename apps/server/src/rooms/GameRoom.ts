import { Room, Client } from "colyseus";
import { z } from "zod";
import { sanitize, DEFAULTS, type RoomSettings } from "@mutator-party/shared";
import { RoomState, PlayerSchema } from "./schema.js";
import { generateRoomCode } from "../security/roomCode.js";
import {
  validatePlayerName,
  deduplicatePlayerName,
} from "../security/names.js";

export const PLAYER_COLORS = [
  "#FF6B6B",
  "#3DDC97",
  "#8B5CF6",
  "#FFC93C",
  "#4CC9F0",
  "#FF9F1C",
  "#F15BB5",
  "#2EC4B6",
] as const;

export const JoinOptionsSchema = z.object({
  code: z.string().optional(),
  name: z.string(),
  color: z.coerce.number().int().min(0).max(7).optional(),
  playerId: z.string().optional(),
  token: z.string().optional(),
});

export type JoinOptions = z.infer<typeof JoinOptionsSchema>;

export class GameRoom extends Room<{
  state: RoomState;
  metadata: { code: string };
}> {
  roomCode!: string;
  settings!: RoomSettings;
  private emptyTimeout?: { clear: () => void };

  override onCreate(options: any) {
    this.state = new RoomState();
    this.autoDispose = false;

    // Generate room code and publish in metadata for lookup (safe in unit tests)
    this.roomCode = generateRoomCode();
    if ((this as any)._listing) {
      this.setMetadata({ code: this.roomCode }).catch(() => {});
    }

    // Validate and sanitize room settings
    this.settings = sanitize(options?.settings ?? DEFAULTS);
    this.maxClients = this.settings.match.maxPlayers;

    // Start 60s empty room disposal timer
    this.resetEmptyTimeout();

    // Register lobby message handlers
    this.registerMessageHandlers();
  }

  override onAuth(client: Client, options: any) {
    const parsed = JoinOptionsSchema.safeParse(options);
    if (!parsed.success) {
      throw new Error("INVALID_JOIN_OPTIONS");
    }

    const nameValidation = validatePlayerName(parsed.data.name);
    if (!nameValidation.valid || !nameValidation.name) {
      throw new Error(nameValidation.error ?? "INVALID_NAME");
    }

    return {
      name: nameValidation.name,
      colorIndex: parsed.data.color,
      playerId: parsed.data.playerId ?? client.sessionId,
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
  }

  override onLeave(client: Client, _code?: number) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const wasHost = player.host;
    this.state.players.delete(client.sessionId);

    // Host migration: if the host left, pass host to the next connected human
    if (wasHost) {
      const nextHost = Array.from(this.state.players.values()).find(
        (p) => p.connected && !p.isBot,
      );
      if (nextHost) {
        nextHost.host = true;
      }
    }

    // If no human players remain, dispose immediately (spec s7)
    const humanCount = Array.from(this.state.players.values()).filter(
      (p) => !p.isBot,
    ).length;
    if (humanCount === 0) {
      this.disconnect();
    }
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

  private registerMessageHandlers() {
    // 1. Ready toggle
    this.onMessage("ready", (client, message: { value?: boolean }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.ready =
          typeof message?.value === "boolean" ? message.value : !player.ready;
      }
    });

    // 2. Settings update (host only)
    this.onMessage("settings:update", (client, partialSettings: unknown) => {
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
      this.broadcast("settings", this.settings);
    });
  }
}
