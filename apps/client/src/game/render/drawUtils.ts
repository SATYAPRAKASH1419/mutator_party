export const W = 960;
export const H = 540;
export const FLOOR_Y = 400;
export const INK = "#1B1B3A";
export const PAPER = "#FFF8E7";
export const DISPLAY = '"Bagel Fat One", "Arial Rounded MT Bold", system-ui, sans-serif';
export const BODY = "Nunito, system-ui, sans-serif";

export const COLORS = [
  "#FF6B6B", "#3DDC97", "#8B5CF6", "#FFC93C",
  "#4CC9F0", "#FF9F1C", "#F15BB5", "#2EC4B6",
];

export const MODES: Record<string, { name: string; icon: string; desc: string; time: number }> = {
  brawl: { name: "Last One Standing", icon: "🥊", desc: "Shove everyone off the island. Last one on it wins.", time: 60 },
  bomb:  { name: "Bomb Tag",          icon: "💣", desc: "Touch someone to pass the bomb. Do not be holding it when it blows!", time: 75 },
  crown: { name: "Crown Rush",        icon: "👑", desc: "Hold the crown to score. Shove the carrier to steal it. Falling just respawns you.", time: 45 },
};

export const hexToCss = (hex: number) => `#${hex.toString(16).padStart(6, "0")}`;

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = PAPER) {
  ctx.fillStyle = INK;
  rr(ctx, x + 5, y + 6, w, h, 14);
  ctx.fill();

  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, 14);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

export function txt(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
  font = BODY,
  weight = "900",
  stroke: string | null = null,
  lw = 5,
) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = "round";
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

