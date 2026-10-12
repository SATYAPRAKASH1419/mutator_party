/* arena.js - deterministic per-round arena generator (reference implementation, no dependencies).
   Same (seed, round, settings) => same arena on every client and on the server. */
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashSeed(...parts){ let h = 2166136261 >>> 0; for (const c of parts.join('|')){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const ARENA = { W:960, H:540, FLOOR_Y:400, TILE_W:100, TIERS:[300, 210, 130],
  MAX_STEP_UP:130,   // single jump apex is ~144px; keep a safety margin
  MAX_GAP:220,       // air time ~0.8s * 420px/s = ~336px; keep a safety margin
  MIN_W:120, MAX_W:200, MIN_SEP:40 };

function generateArena({ seed, round = 0, platformCount = 4, islandTiles = 6, symmetric = true, players = 8, powerSpots = 3 }){
  for (let attempt = 0; attempt < 40; attempt++){
    const rnd = mulberry32(hashSeed(seed, round, 'layout', attempt));
    const R = (a, b) => a + rnd() * (b - a);
    const A = ARENA, isl = { w:islandTiles * A.TILE_W, y:A.FLOOR_Y };
    isl.x = Math.round(A.W / 2 - isl.w / 2 + R(-50, 50));
    const plats = [], all = () => [isl, ...plats];
    const overlapX = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad;
    const gapX = (a, b) => Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));
    const ok = c => {
      for (const p of all()) if (p.y === c.y && overlapX(c, p, A.MIN_SEP)) return false;
      for (const p of all()) if (overlapX(c, p) && Math.abs(p.y - c.y) < 70) return false;
      return all().some(p => gapX(c, p) <= A.MAX_GAP && (p.y - c.y) <= A.MAX_STEP_UP);
    };
    const want = symmetric ? Math.floor(platformCount / 2) : platformCount;
    for (let i = 0; i < want; i++){
      for (let tries = 0; tries < 60; tries++){
        const r = rnd(), tier = r < .45 ? 0 : r < .85 ? 1 : 2, w = Math.round(R(A.MIN_W, A.MAX_W));
        const maxX = symmetric ? A.W / 2 - 20 - w : A.W - 30 - w;
        const c = { x:Math.round(R(30, Math.max(31, maxX))), y:A.TIERS[tier], w };
        if (ok(c)){ plats.push(c); if (symmetric) plats.push({ x:A.W - c.x - c.w, y:c.y, w:c.w }); break; }
      }
    }
    if (symmetric && platformCount % 2){ const w = 160; plats.push({ x:A.W / 2 - w / 2, y:A.TIERS[1], w }); }
    // validate: every platform reachable from the island (BFS over the jump graph)
    const seen = new Set([isl]), q = [isl];
    while (q.length){ const a = q.shift(); for (const b of all()){ if (seen.has(b)) continue;
      const up = a.y - b.y, can = (gapX(a, b) <= A.MAX_GAP && up <= A.MAX_STEP_UP) || (gapX(a, b) <= A.MAX_GAP && up < 0 && Math.abs(up) <= 400);
      if (can){ seen.add(b); q.push(b); } } }
    if (plats.length !== platformCount || seen.size !== all().length) continue;
    // spawns: ~60% on the island, rest on platforms, then shuffled so slot -> player changes every round
    const srnd = mulberry32(hashSeed(seed, round, 'spawn'));
    const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--){ const j = Math.floor(srnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const spots = [];
    for (const p of all()) for (let x = p.x + 30; x <= p.x + p.w - 30; x += 60) spots.push({ x, y:p.y - 18, onIsland:p === isl });
    const isle = shuffle(spots.filter(s => s.onIsland)), top = shuffle(spots.filter(s => !s.onIsland));
    const nIsle = Math.min(isle.length, Math.ceil(players * .6)), spawns = shuffle([...isle.slice(0, nIsle), ...top].slice(0, players));
    // power spots: favour higher (harder to reach) platforms, keep them apart
    const prnd = mulberry32(hashSeed(seed, round, 'power')), spotsOut = [];
    const cand = plats.length ? plats : [isl];
    for (let k = 0; k < powerSpots * 12 && spotsOut.length < powerSpots; k++){
      const p = cand[Math.floor(prnd() * cand.length)], wgt = 1 + (A.FLOOR_Y - p.y) / 100;
      if (prnd() * 3.5 > wgt) continue;
      const s = { x:Math.round(p.x + 30 + prnd() * (p.w - 60)), y:p.y - 20 };
      if (spotsOut.every(o => Math.hypot(o.x - s.x, o.y - s.y) > 200)) spotsOut.push(s);
    }
    return { seed, round, island:{ x:isl.x, y:isl.y, w:isl.w, tiles:islandTiles }, platforms:plats, spawns, powerSpots:spotsOut, attempts:attempt + 1 };
  }
  // fallback: classic layout (never fails)
  return { seed, round, island:{ x:180, y:400, w:600, tiles:6 }, platforms:[{ x:50, y:290, w:190 }, { x:720, y:290, w:190 }, { x:385, y:195, w:190 }].slice(0, platformCount),
    spawns:Array.from({ length:players }, (_, i) => ({ x:210 + i * 77, y:382 })), powerSpots:[{ x:480, y:175 }], attempts:41, fallback:true };
}
if (typeof module !== 'undefined') module.exports = { generateArena, mulberry32, hashSeed, ARENA };
