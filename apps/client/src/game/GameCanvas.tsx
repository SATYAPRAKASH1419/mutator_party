import { useEffect, useRef } from "preact/hooks";
import { sound } from "./audio";
import { clientLog } from "../util/logger";
import {
  generateArena,
  islandSizeToTiles,
  type ArenaResult,
  type RoomSettings,
} from "@mutator-party/shared";
import type { RoomConnection } from "../net/connection";
import { W, H, INK, BODY, COLORS, MODES, txt } from "./render/drawUtils";
import { drawBG, drawWorld, type Cloud } from "./render/drawWorld";
import { drawPlayer, type RenderPlayer } from "./render/drawPlayer";
import { useGameInput } from "./hooks/useGameInput";

export interface GameCanvasProps {
  connection: RoomConnection;
  localPlayerId: string;
  settings?: Partial<RoomSettings> | null;
}

export function GameCanvas({ connection, localPlayerId, settings }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStatePhaseRef = useRef<string>("play");

  // Input streaming hook
  useGameInput(connection, gameStatePhaseRef);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !connection) return;
    const ctx = cv.getContext("2d")!;

    let K = 1;
    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv!.getBoundingClientRect();
      cv!.width = Math.max(2, Math.round(r.width * dpr));
      cv!.height = Math.max(2, Math.round(r.height * dpr));
      K = cv!.width / W;
    }
    window.addEventListener("resize", fit);
    fit();

    let state = "play";
    let round = 1;
    let mode = "brawl";
    let twists: string[] = [];
    let activeTheme: any = "sunny";
    let crumbleTilesBitmask = 0;
    let crumbleWarnBitmask = 0;
    let bombHolderId = "";
    let crown = { holderId: "", x: 480, y: 181 };
    let crates: any[] = [];
    let shake = 0;
    const toasts: any[] = [];
    let players: RenderPlayer[] = [];
    let arenaSeed = 12345;

    let currentArena: ArenaResult = generateArena({
      seed: arenaSeed,
      round: 1,
      platformCount: settings?.arena?.platformCount ?? 4,
      islandTiles: islandSizeToTiles(settings?.arena?.islandSize ?? "M"),
      symmetric: settings?.arena?.mirror ?? true,
      players: settings?.match?.maxPlayers ?? 8,
      powerSpots: settings?.items?.enabled ? (settings?.items?.spots ?? 3) : 0,
    });

    function toast(s: string, color = "#fff") {
      toasts.push({ s, color, life: 2.6 });
      if (toasts.length > 4) toasts.shift();
    }

    const unsubState = connection.on("state", (s: any) => {
      if (!s) return;
      state = s.phase || "play";
      gameStatePhaseRef.current = state;
      const newRound = s.round || 1;
      const newSeed = s.seed || arenaSeed;

      if (s.arena) {
        currentArena = s.arena;
      } else if (newRound !== round || newSeed !== arenaSeed) {
        currentArena = generateArena({
          seed: newSeed,
          round: newRound,
          platformCount: settings?.arena?.platformCount ?? 4,
          islandTiles: islandSizeToTiles(settings?.arena?.islandSize ?? "M"),
          symmetric: settings?.arena?.mirror ?? true,
          players: settings?.match?.maxPlayers ?? 8,
          powerSpots: settings?.items?.enabled ? (settings?.items?.spots ?? 3) : 0,
        });
      }

      round = newRound;
      arenaSeed = newSeed;
      mode = s.mode || "brawl";
      twists = s.twists || [];
      if (s.themeId) activeTheme = s.themeId;

      if (s.bomb) bombHolderId = s.bomb.holderId || "";
      if (s.crown) crown = s.crown;
      if (s.crates) crates = s.crates;
      if (s.crumbleTilesBitmask !== undefined) crumbleTilesBitmask = s.crumbleTilesBitmask;
      if (s.crumbleWarnBitmask !== undefined) crumbleWarnBitmask = s.crumbleWarnBitmask;

      const incoming = s.players || [];
      if (incoming.length > 0) {
        players = incoming.map((p: any, idx: number) => {
          const existing = players.find((x) => x.id === p.id);
          const isLocal = p.id === localPlayerId;
          const targetX = p.x ?? 480;
          const targetY = p.y ?? 382;

          const alpha = isLocal ? 0.75 : 0.45;
          const dist = existing ? Math.hypot(targetX - existing.x, targetY - existing.y) : 0;
          const currentX = existing && dist < 120 ? existing.x + (targetX - existing.x) * alpha : targetX;
          const currentY = existing && dist < 120 ? existing.y + (targetY - existing.y) * alpha : targetY;

          const playerColor =
            typeof p.color === "number"
              ? COLORS[p.color % COLORS.length]
              : typeof p.color === "string" && p.color.startsWith("#")
              ? p.color
              : COLORS[idx % COLORS.length];

          return {
            id: p.id,
            name: p.name || `Player ${idx + 1}`,
            color: playerColor,
            human: isLocal,
            x: currentX,
            y: currentY,
            vx: p.vx ?? 0,
            vy: p.vy ?? 0,
            scale: p.scale ?? 1,
            hs: 18 * (p.scale ?? 1),
            score: p.score ?? 0,
            hits: p.hits ?? 0,
            alive: !p.isOut,
            face: p.facingRight !== undefined ? (p.facingRight ? 1 : -1) : ((p.vx ?? 0) >= 0 ? 1 : -1),
            item: p.item || null,
            flags: p.flags ?? 0,
          };
        });
      }
    });

    const unsubRound = connection.on("roundStart", (data: any) => {
      round = data.n || 1;
      mode = data.mode || "brawl";
      twists = data.twists || [];
      if (data.themeId) activeTheme = data.themeId;
      if (data.seed) arenaSeed = data.seed;

      currentArena = generateArena({
        seed: arenaSeed,
        round,
        platformCount: settings?.arena?.platformCount ?? 4,
        islandTiles: islandSizeToTiles(settings?.arena?.islandSize ?? "M"),
        symmetric: settings?.arena?.mirror ?? true,
        players: settings?.match?.maxPlayers ?? 8,
        powerSpots: settings?.items?.enabled ? (settings?.items?.spots ?? 3) : 0,
      });

      toast(`Round ${round}: ${MODES[mode]?.name || mode}!`, "#FFC93C");
      clientLog.game("Round started in GameCanvas", { round, mode, twists, theme: activeTheme, seed: arenaSeed });
    });

    const unsubEvent = connection.on("event", (ev: any) => {
      const msg = ev.message || ev.payload?.message || (typeof ev.payload === "string" ? ev.payload : null);
      if (ev.type === "toast" && msg) toast(msg, ev.color || "#fff");
      clientLog.game("In-game event received", ev);
      if (ev.type === "shove" || ev.type === "shove_hit") {
        shake = 10;
        sound.playShove();
      }
      if (ev.type === "ko") {
        shake = 15;
        sound.playKO();
      }
      if (ev.type === "pickup") {
        sound.playPickup();
      }
      if (ev.type === "bomb_explode") {
        shake = 20;
        sound.playBombExplode();
      }
    });

    const clouds: Cloud[] = [
      { x: 120, y: 80, s: 1, v: 8 },
      { x: 420, y: 140, s: 0.7, v: 5 },
      { x: 700, y: 60, s: 1.2, v: 10 },
      { x: 880, y: 170, s: 0.8, v: 6 },
    ];

    let last = performance.now();
    let rafId = 0;

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      for (let i = toasts.length - 1; i >= 0; i--) {
        toasts[i].life -= dt;
        if (toasts[i].life <= 0) toasts.splice(i, 1);
      }
      shake = Math.max(0, shake - dt * 30);

      ctx.setTransform(K, 0, 0, K, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

      drawBG(ctx, dt, clouds, activeTheme);
      drawWorld(ctx, {
        activeTheme,
        twists,
        currentArena,
        crumbleTilesBitmask,
        crumbleWarnBitmask,
        crates,
        mode,
        crown,
      });

      for (const p of players) {
        if (p.alive) drawPlayer(ctx, p, bombHolderId, mode, crown);
      }

      // Lights Out twist
      if (twists.includes("dark")) {
        ctx.save();
        ctx.fillStyle = "rgba(12, 12, 28, 0.92)";
        ctx.fillRect(0, 0, W, H);

        ctx.globalCompositeOperation = "destination-out";
        for (const p of players) {
          if (!p.alive) continue;
          const rad = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 125);
          rad.addColorStop(0, "rgba(0,0,0,1)");
          rad.addColorStop(0.7, "rgba(0,0,0,0.85)");
          rad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 125, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();

      toasts.forEach((q, i) => {
        txt(ctx, q.s, 24, 110 + i * 26, 16, q.color, "left", BODY, "900", INK, 5);
      });

      const localPlayer = players.find((p) => p.human);
      if (localPlayer && !localPlayer.alive) {
        txt(ctx, "You're out. Watching at 2.5x speed.", W / 2, H - 24, 15, "#fff", "center", BODY, "900", INK, 5);
      }

      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", fit);
      unsubState();
      unsubRound();
      unsubEvent();
    };
  }, [connection, localPlayerId, settings]);

  return (
    <canvas
      ref={canvasRef}
      id="c"
      width={960}
      height={540}
      aria-label="Mutator Party 2 game"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        borderRadius: "14px",
        border: "3px solid #1B1B3A",
        background: "#8EDBFF",
        touchAction: "none",
        cursor: "pointer",
      }}
    />
  );
}
