import { getThemeColors } from "../theme";
import type { ArenaResult } from "@mutator-party/shared";
import { W, H, INK, rr, panel, txt, hexToCss, DISPLAY } from "./drawUtils";

export interface Cloud {
  x: number;
  y: number;
  s: number;
  v: number;
}

export function drawBG(ctx: CanvasRenderingContext2D, dt: number, clouds: Cloud[], activeTheme: any) {
  const themeColors = getThemeColors(activeTheme);
  const skyTop = hexToCss(themeColors.skyTop);
  const skyBottom = hexToCss(themeColors.skyBottom);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, skyTop);
  g.addColorStop(1, skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = themeColors.isNight ? "#E2E8F0" : "#FFD25A";
  ctx.beginPath();
  ctx.arc(820, 90, 46, 0, 6.283);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,.9)";
  for (const c of clouds) {
    c.x += c.v * dt;
    if (c.x > W + 120) c.x = -120;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 26 * c.s, 0, 6.283);
    ctx.arc(c.x + 28 * c.s, c.y - 10 * c.s, 32 * c.s, 0, 6.283);
    ctx.arc(c.x + 60 * c.s, c.y, 24 * c.s, 0, 6.283);
    ctx.fill();
  }

  const dg = ctx.createLinearGradient(0, H - 70, 0, H);
  dg.addColorStop(0, "rgba(255,107,107,0)");
  dg.addColorStop(1, "rgba(255,107,107,.45)");
  ctx.fillStyle = dg;
  ctx.fillRect(0, H - 70, W, 70);
}

export function drawPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  edge: string,
) {
  ctx.fillStyle = edge;
  rr(ctx, x, y + 5, w, h, 8);
  ctx.fill();

  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, 8);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

interface DrawWorldOptions {
  activeTheme: any;
  twists: string[];
  currentArena: ArenaResult | null;
  crumbleTilesBitmask: number;
  crumbleWarnBitmask: number;
  crates: any[];
  mode: string;
  crown: { holderId?: string; x?: number; y?: number };
}

export function drawWorld(ctx: CanvasRenderingContext2D, opts: DrawWorldOptions) {
  const {
    activeTheme,
    twists,
    currentArena,
    crumbleTilesBitmask,
    crumbleWarnBitmask,
    crates,
    mode,
    crown,
  } = opts;

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
      drawPlatform(ctx, pl.x, pl.y, pl.w, 16, platFill, platEdge);
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
      drawPlatform(ctx, isl.x + i * tileW + ox + 1, isl.y, tileW - 2, 28, f, floorEdge);
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

      panel(ctx, c.x - 16, c.y - 16, 32, 32, "#FFF8E7");
      txt(ctx, "?", c.x, c.y + 1, 18, INK);
      if (c.t !== undefined && c.t > 0) {
        txt(ctx, String(Math.ceil(c.t)), c.x, c.y - 24, 15, "#fff", "center", DISPLAY, "400", INK, 5);
      }
    } else {
      panel(ctx, c.x - 18, c.y - 18, 36, 36, "#FFC93C");
      const icon = c.type === "mega" ? "💥" : c.type === "freeze" ? "🧊" : c.type === "swap" ? "🔀" : "🛡️";
      txt(ctx, icon, c.x, c.y + 1, 20, INK);
    }
  }

  // 4. Crown Rush: floating crown if dropped
  if (mode === "crown" && (!crown.holderId || crown.holderId === "")) {
    const cy = crown.y ?? 181;
    const bob = Math.sin(performance.now() / 200) * 4;
    txt(ctx, "👑", crown.x ?? 480, cy + bob, 28, "#FFC93C");
  }
}
