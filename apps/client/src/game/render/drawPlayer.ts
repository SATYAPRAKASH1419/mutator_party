import { INK, BODY, rr, txt } from "./drawUtils";

export interface RenderPlayer {
  id: string;
  name: string;
  color: string;
  human: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  hs: number;
  score: number;
  hits: number;
  alive: boolean;
  face: number;
  item: any;
  flags: number;
  shielded?: boolean;
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: RenderPlayer,
  bombHolderId: string,
  mode: string,
  crown: { holderId?: string },
) {
  const s = p.hs * 2;
  const now = performance.now() / 1000;
  ctx.save();
  ctx.translate(p.x, p.y + p.hs);
  const stretch = Math.min(0.25, Math.abs(p.vy) / 4000);
  ctx.scale(1 - stretch, 1 + stretch);

  // Body squircle
  ctx.fillStyle = p.color;
  rr(ctx, -p.hs, -s, s, s, s * 0.32);
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Cartoon eyes looking in movement direction
  const ey = -s * 0.62;
  const ex = s * 0.22;
  const er = s * 0.17;
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
  txt(ctx, p.human ? `You  ${pct}%` : `${p.name}  ${pct}%`, p.x, top - 6, 12, col, "center", BODY, "900", INK, 4);

  // Human player downward orange triangle (▼)
  if (p.human) {
    const bob = Math.sin(now * 6.5) * 3;
    const ty = top - 32 + bob;
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
    txt(ctx, "💣", p.x, top - 24, 22, "#FF4D4D");
    ctx.strokeStyle = "#FF6B6B";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x + p.hs + 4, p.y, 14, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  // Crown Rush: crown icon
  if (mode === "crown" && crown.holderId === p.id) {
    txt(ctx, "👑", p.x, top - 24, 24, "#FFC93C");
  }
}

