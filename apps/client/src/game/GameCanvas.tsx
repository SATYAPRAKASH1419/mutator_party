/**
 * GameCanvas.tsx
 *
 * True Server-Authoritative Canvas2D Client.
 *
 * - Dynamically renders the exact procedural arena (island and platforms) generated
 *   by @mutator-party/shared so that platform collisions and player positions match 1:1.
 * - Squircles with eyes looking in movement direction, cute smile, damage percentages,
 *   bomb tag progress arc, crown rush carrier, and power-up crates.
 * - Dynamic twists visuals: Lights Out spotlight cutouts, Crumbling Floor warning shakes,
 *   Ice Rink floor, Trampoline Land.
 * - DOM HUD (Preact) is overlaid on top of this canvas per Spec Rule 2.
 */

import { useEffect, useRef } from "preact/hooks";
import { getThemeColors } from "./theme";
import { sound } from "./audio";
import { clientLog } from "../util/logger";
import {
  generateArena,
  islandSizeToTiles,
  type ArenaResult,
  type RoomSettings,
} from "@mutator-party/shared";
import type { RoomConnection } from "../net/connection";

const W = 960, H = 540;
const FLOOR_Y = 400;
const INK = "#1B1B3A", PAPER = "#FFF8E7";
const DISPLAY = '"Bagel Fat One", "Arial Rounded MT Bold", system-ui, sans-serif';
const BODY = "Nunito, system-ui, sans-serif";

const COLORS = [
  "#FF6B6B", "#3DDC97", "#8B5CF6", "#FFC93C",
  "#4CC9F0", "#FF9F1C", "#F15BB5", "#2EC4B6",
];

const MODES: Record<string, { name: string; icon: string; desc: string; time: number }> = {
  brawl: { name: "Last One Standing", icon: "🥊", desc: "Shove everyone off the island. Last one on it wins.", time: 60 },
  bomb:  { name: "Bomb Tag",          icon: "💣", desc: "Touch someone to pass the bomb. Do not be holding it when it blows!", time: 75 },
  crown: { name: "Crown Rush",        icon: "👑", desc: "Hold the crown to score. Shove the carrier to steal it. Falling just respawns you.", time: 45 },
};

export interface GameCanvasProps {
  connection: RoomConnection;
  localPlayerId: string;
  settings?: Partial<RoomSettings> | null;
}

export function GameCanvas({ connection, localPlayerId, settings }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !connection) return;
    const ctx = cv.getContext("2d")!;

    let K = 1;
    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv!.getBoundingClientRect();
      cv!.width  = Math.max(2, Math.round(r.width  * dpr));
      cv!.height = Math.max(2, Math.round(r.height * dpr));
      K = cv!.width / W;
    }
    window.addEventListener("resize", fit);
    fit();

    // ── Server Authoritative State ──────────────────────────────────────────
    let state = "play"; // lobby, intro, play, pick, results, final
    let round = 1;
    let mode = "brawl";
    let timeLeft = 60;
    let twists: string[] = [];
    let activeTheme: any = "sunny";
    let crumbleTilesBitmask = 0;
    let crumbleWarnBitmask = 0;
    let bombHolderId = "";
    let crown = { holderId: "", x: 480, y: 181 };
    let crates: any[] = [];
    let shake = 0;
    const toasts: any[] = [];
    let players: any[] = [];
    let arenaSeed = 12345;

    // Procedural arena matching physics exactly
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
      const newRound = s.round || 1;
      const newSeed = s.seed || arenaSeed;

      // Update arena if round/seed changed or if explicit arena sent
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
      timeLeft = s.timeLeft !== undefined ? s.timeLeft : 60;
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

    // ── Input Streaming (30Hz) ──────────────────────────────────────────────
    const keys: Record<string, boolean> = {};
    const touch = { left: false, right: false };
    let jumpQ = false, shoveQ = false;
    let inputSeq = 0;
    let lastBits = -1;
    let lastSentTime = 0;

    function sendInputs() {
      if (!connection) return;
      let bits = 0;
      if (keys["a"] || keys["arrowleft"] || touch.left) bits |= 1;
      if (keys["d"] || keys["arrowright"] || touch.right) bits |= 2;
      if (jumpQ || keys["w"] || keys["arrowup"] || keys[" "]) { bits |= 4; jumpQ = false; }
      if (shoveQ || keys["e"] || keys["shift"] || keys["j"]) { bits |= 8; shoveQ = false; }

      const now = performance.now();
      const changed = bits !== lastBits;
      const heartbeat = now - lastSentTime >= 100;

      if (changed || heartbeat) {
        inputSeq = (inputSeq + 1) & 0xffff;
        lastBits = bits;
        lastSentTime = now;
        connection.send.input(inputSeq, bits);
      }
    }

    const inputTimer = setInterval(sendInputs, 1000 / 30);

    function onKeyDown(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
      keys[k] = true;
      if (k === " " || k === "w" || k === "arrowup") {
        if (!jumpQ) sound.playJump();
        jumpQ = true;
      }
      if (k === "e" || k === "shift" || k === "j") {
        if (!shoveQ) sound.playShove();
        shoveQ = true;
      }
      if (state === "pick" && (k === "1" || k === "2" || k === "3")) {
        connection.send.pick((+k - 1) as 0 | 1 | 2);
      }
    }
    function onKeyUp(e: KeyboardEvent) { keys[e.key.toLowerCase()] = false; }
    function onBlur() { for (const k in keys) keys[k] = false; touch.left = touch.right = false; }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    // Touch controls
    const touchButtons = document.querySelectorAll<HTMLButtonElement>("#touch button");
    const cleanupTouchListeners: Array<() => void> = [];

    touchButtons.forEach((b) => {
      const k = b.dataset.k!;
      const downHandler = (e: Event) => {
        e.preventDefault();
        b.classList.add("on");
        if (k === "jump") {
          sound.playJump();
          jumpQ = true;
        } else if (k === "shove") {
          sound.playShove();
          shoveQ = true;
        } else (touch as any)[k] = true;
      };
      const upHandler = () => {
        b.classList.remove("on");
        if (k === "left" || k === "right") (touch as any)[k] = false;
      };

      b.addEventListener("pointerdown", downHandler);
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, upHandler));

      cleanupTouchListeners.push(() => {
        b.removeEventListener("pointerdown", downHandler);
        ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.removeEventListener(ev, upHandler));
      });
    });

    // ── Visual Drawing Helpers ──────────────────────────────────────────────
    const clouds = [
      { x: 120, y: 80, s: 1, v: 8 },
      { x: 420, y: 140, s: 0.7, v: 5 },
      { x: 700, y: 60, s: 1.2, v: 10 },
      { x: 880, y: 170, s: 0.8, v: 6 },
    ];

    function rr(x: number, y: number, w: number, h: number, r: number) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function panel(x: number, y: number, w: number, h: number, fill = PAPER) {
      ctx.fillStyle = INK; rr(x + 5, y + 6, w, h, 14); ctx.fill();
      ctx.fillStyle = fill; rr(x, y, w, h, 14); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }

    function txt(s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "center", font = BODY, weight = "900", stroke: string | null = null, lw = 5) {
      ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = "middle";
      if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = "round"; ctx.strokeText(s, x, y); }
      ctx.fillStyle = color; ctx.fillText(s, x, y);
    }

    const hexToCss = (hex: number) => `#${hex.toString(16).padStart(6, "0")}`;

    function drawBG(dt: number) {
      const themeColors = getThemeColors(activeTheme);
      const skyTop = hexToCss(themeColors.skyTop);
      const skyBottom = hexToCss(themeColors.skyBottom);

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, skyTop); g.addColorStop(1, skyBottom);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = themeColors.isNight ? "#E2E8F0" : "#FFD25A"; ctx.beginPath(); ctx.arc(820, 90, 46, 0, 6.283); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (const c of clouds) {
        c.x += c.v * dt; if (c.x > W + 120) c.x = -120;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 26 * c.s, 0, 6.283); ctx.arc(c.x + 28 * c.s, c.y - 10 * c.s, 32 * c.s, 0, 6.283);
        ctx.arc(c.x + 60 * c.s, c.y, 24 * c.s, 0, 6.283); ctx.fill();
      }
      const dg = ctx.createLinearGradient(0, H - 70, 0, H);
      dg.addColorStop(0, "rgba(255,107,107,0)"); dg.addColorStop(1, "rgba(255,107,107,.45)");
      ctx.fillStyle = dg; ctx.fillRect(0, H - 70, W, 70);
    }

    function drawPlatform(x: number, y: number, w: number, h: number, fill: string, edge: string) {
      ctx.fillStyle = edge; rr(x, y + 5, w, h, 8); ctx.fill();
      ctx.fillStyle = fill; rr(x, y, w, h, 8); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }

    function drawWorld() {
      const themeColors = getThemeColors(activeTheme);
      const isIce = twists.includes("ice");
      const isBounce = twists.includes("bounce");
      const floorFill = isIce ? "#C8F0FF" : isBounce ? "#FF9DBB" : hexToCss(themeColors.islandFill);
      const floorEdge = isIce ? "#8FD0EA" : isBounce ? "#E0668C" : hexToCss(themeColors.islandEdge);
      const platFill = isIce ? "#D7F5FF" : hexToCss(themeColors.platformFill);
      const platEdge = isIce ? "#8FD0EA" : hexToCss(themeColors.platformEdge);

      // 1. Procedural floating platforms from actual arena geometry
      if (currentArena?.platforms) {
        for (const pl of currentArena.platforms) {
          drawPlatform(pl.x, pl.y, pl.w, 16, platFill, platEdge);
        }
      }

      // 2. Procedural island floor tiles from actual arena geometry
      if (currentArena?.island) {
        const isl = currentArena.island;
        const tileCount = isl.tiles || 6;
        const tileW = Math.round(isl.w / tileCount);
        for (let i = 0; i < tileCount; i++) {
          const isFallen = (crumbleTilesBitmask & (1 << i)) !== 0;
          const isWarn = (crumbleWarnBitmask & (1 << i)) !== 0;
          if (isFallen) continue;

          let ox = 0, f = floorFill;
          if (isWarn) {
            ox = Math.sin(performance.now() / 25) * 2.5;
            if (Math.floor(performance.now() / 100) % 2 === 0) f = "#FF6B6B";
          }
          drawPlatform(isl.x + i * tileW + ox + 1, isl.y, tileW - 2, 28, f, floorEdge);
        }
      }

      // 3. Power spots / Crates
      for (const c of crates) {
        if (c.state === "beacon") {
          ctx.strokeStyle = "rgba(255, 201, 60, 0.6)";
          ctx.lineWidth = 2.5;
          const pulse = (performance.now() / 400) % 1;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 16 + pulse * 14, 0, Math.PI * 2);
          ctx.stroke();

          panel(c.x - 16, c.y - 16, 32, 32, "#FFF8E7");
          txt("?", c.x, c.y + 1, 18, INK);
          if (c.t !== undefined && c.t > 0) {
            txt(String(Math.ceil(c.t)), c.x, c.y - 24, 15, "#fff", "center", DISPLAY, "400", INK, 5);
          }
        } else {
          panel(c.x - 18, c.y - 18, 36, 36, "#FFC93C");
          const icon = c.type === "mega" ? "💥" : c.type === "freeze" ? "🧊" : c.type === "swap" ? "🔀" : "🛡️";
          txt(icon, c.x, c.y + 1, 20, INK);
        }
      }

      // 4. Crown Rush: floating crown if dropped
      if (mode === "crown" && (!crown.holderId || crown.holderId === "")) {
        const cy = crown.y ?? 181;
        const bob = Math.sin(performance.now() / 200) * 4;
        txt("👑", crown.x ?? 480, cy + bob, 28, "#FFC93C");
      }
    }

    function drawPlayer(p: any) {
      const s = p.hs * 2, now = performance.now() / 1000;
      ctx.save();
      ctx.translate(p.x, p.y + p.hs);
      const stretch = Math.min(0.25, Math.abs(p.vy) / 4000);
      ctx.scale(1 - stretch, 1 + stretch);

      // Body squircle
      ctx.fillStyle = p.color;
      rr(-p.hs, -s, s, s, s * 0.32);
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = INK;
      ctx.stroke();

      // Cartoon eyes looking in movement direction
      const ey = -s * 0.62, ex = s * 0.22, er = s * 0.17;
      const look = Math.max(-1, Math.min(1, p.vx / 350)) * s * 0.06;

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-ex, ey, er, 0, Math.PI * 2);
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-ex + look + p.face * s * 0.03, ey, er * 0.5, 0, Math.PI * 2);
      ctx.arc(ex + look + p.face * s * 0.03, ey, er * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Cute smiling mouth
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-s * 0.12, -s * 0.28);
      ctx.quadraticCurveTo(0, -s * 0.18, s * 0.12, -s * 0.28);
      ctx.stroke();

      ctx.restore();

      // Shield bubble
      if ((p.flags & 4) !== 0 || p.shielded) {
        ctx.save();
        ctx.strokeStyle = "#7DD3FC";
        ctx.lineWidth = 3.5;
        ctx.fillStyle = "rgba(125, 211, 252, 0.22)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.hs * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Name & damage percentage
      const pct = Math.round(p.hits * 12);
      const top = p.y - p.hs * 1.1;
      const col = pct > 60 ? "#FF4D4D" : pct > 30 ? "#FF9F1C" : "#fff";
      txt(p.human ? `You  ${pct}%` : `${p.name}  ${pct}%`, p.x, top - 6, 12, col, "center", BODY, "900", INK, 4);

      // Human player downward orange triangle (▼)
      if (p.human) {
        const bob = Math.sin(now * 6.5) * 3, ty = top - 32 + bob;
        ctx.fillStyle = "#FFC93C";
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p.x, ty + 12);
        ctx.lineTo(p.x - 8, ty);
        ctx.lineTo(p.x + 8, ty);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Bomb Tag: bomb above player + fuse arc
      if (bombHolderId === p.id) {
        txt("💣", p.x, top - 24, 22, "#FF4D4D");
        ctx.strokeStyle = "#FF6B6B";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x + p.hs + 4, p.y, 14, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }

      // Crown Rush: crown icon
      if (mode === "crown" && crown.holderId === p.id) {
        txt("👑", p.x, top - 24, 24, "#FFC93C");
      }
    }

    // ── Main Render Loop ────────────────────────────────────────────────────
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

      drawBG(dt);
      drawWorld();

      for (const p of players) {
        if (p.alive) drawPlayer(p);
      }

      // Lights Out twist: dark overlay with radial spotlight cutouts around players
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

      // Render toast messages inside canvas
      toasts.forEach((q, i) => {
        txt(q.s, 24, 110 + i * 26, 16, q.color, "left", BODY, "900", INK, 5);
      });

      // Spectator message if local player is eliminated
      const localPlayer = players.find((p) => p.human);
      if (localPlayer && !localPlayer.alive) {
        txt("You're out. Watching at 2.5x speed.", W / 2, H - 24, 15, "#fff", "center", BODY, "900", INK, 5);
      }

      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(inputTimer);
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      cleanupTouchListeners.forEach((cleanup) => cleanup());
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
