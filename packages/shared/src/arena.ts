// ─── arena.ts ─────────────────────────────────────────────────────────────────
// Deterministic procedural arena generator.
// ─────────────────────────────────────────────────────────────────────────────

import { mulberry32, hashSeed, shuffleArray } from './rng.js';
import { ARENA_W, FLOOR_Y, MAX_GAP, MAX_STEP_UP, MAX_W, MIN_SEP, MIN_W, TIERS, TILE_W } from './constants.js';

export interface ArenaOptions {
    seed: number;
    round?: number;
    platformCount?: number;
    islandTiles?: number;
    symmetric?: boolean;
    players?: number;
    powerSpots?: number;
}

export interface Platform {
    x: number;
    y: number;
    w: number;
}

export interface Spawn {
    x: number;
    y: number;
    onIsland: boolean;
}

export interface PowerSpot {
    x: number;
    y: number;
}

export interface ArenaResult {
    seed: number;
    round: number;
    island: { x: number; y: number; w: number; tiles: number };
    platforms: Platform[];
    spawns: Spawn[];
    powerSpots: PowerSpot[];
    attempts: number;
    fallback?: true;
}

/** Procedurally generates a verified reachable arena layout. */
export function generateArena({
    seed,
    round = 0,
    platformCount = 4,
    islandTiles = 6,
    symmetric = true,
    players = 8,
    powerSpots: powerSpotsCount = 3,
}: ArenaOptions): ArenaResult {
    for (let attempt = 0; attempt < 40; attempt++) {
        const rnd = mulberry32(hashSeed(seed, round, 'layout', attempt));
        const R = (a: number, b: number) => a + rnd() * (b - a);

        const isl = {
            x: Math.round(ARENA_W / 2 - (islandTiles * TILE_W) / 2 + R(-50, 50)),
            y: FLOOR_Y,
            w: islandTiles * TILE_W,
        };

        const plats: Platform[] = [];
        const all = () => [isl, ...plats];

        const overlapX = (a: Platform, b: Platform, pad = 0) =>
            a.x < b.x + b.w + pad && b.x < a.x + a.w + pad;

        const gapX = (a: Platform, b: Platform) =>
            Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));

        const ok = (c: Platform): boolean => {
            for (const p of all()) if (p.y === c.y && overlapX(c, p, MIN_SEP)) return false;
            for (const p of all()) if (overlapX(c, p) && Math.abs(p.y - c.y) < 70) return false; // TODO : put the 70 in constants.ts as Min_H separation vertical
            return all().some((p) => gapX(c, p) <= MAX_GAP && p.y - c.y <= MAX_STEP_UP);
        };

        const want = symmetric ? Math.floor(platformCount / 2) : platformCount;
        for (let i = 0; i < want; i++) {
            for (let tries = 0; tries < 60; tries++) {
                const r = rnd();
                const tier = r < 0.45 ? 0 : r < 0.85 ? 1 : 2;
                const w = Math.round(R(MIN_W, MAX_W));
                const maxX = symmetric ? ARENA_W / 2 - 20 - w : ARENA_W - 30 - w;
                const c: Platform = { x: Math.round(R(30, Math.max(31, maxX))), y: TIERS[tier], w };
                if (ok(c)) {
                    plats.push(c);
                    if (symmetric) plats.push({ x: ARENA_W - c.x - c.w, y: c.y, w: c.w });
                    break;
                }
            }
        }

        if (symmetric && platformCount % 2) {
            const w = 160;
            plats.push({ x: ARENA_W / 2 - w / 2, y: TIERS[1], w });
        }

        // BFS reachability check from island
        const seen = new Set<Platform | typeof isl>([isl]);
        const q: Array<Platform | typeof isl> = [isl];
        while (q.length) {
            const a = q.shift()!;
            for (const b of all()) {
                if (seen.has(b)) continue;
                const up = a.y - b.y;
                const can =
                    (gapX(a, b) <= MAX_GAP && up <= MAX_STEP_UP) ||
                    (gapX(a, b) <= MAX_GAP && up < 0 && Math.abs(up) <= 400);
                    //So the second condition is effectively redundant for the current implementation. It may have been intended to explicitly document or separately handle downward movement, but it does not currently add a new restriction.
                if (can) {
                    seen.add(b);
                    q.push(b);
                }
            }
        }

        if (plats.length !== platformCount || seen.size !== all().length) continue;

        // Spawns
        const srnd = mulberry32(hashSeed(seed, round, 'spawn'));
        const spots: Spawn[] = [];
        for (const p of all()) {
            for (let x = p.x + 30; x <= p.x + p.w - 30; x += 60) {
                spots.push({ x, y: p.y - 18, onIsland: p === isl });
            }
        }
        const isle = shuffleArray(spots.filter((s) => s.onIsland), srnd);
        const top = shuffleArray(spots.filter((s) => !s.onIsland), srnd);
        const nIsle = Math.min(isle.length, Math.ceil(players * 0.6));
        const spawns = shuffleArray([...isle.slice(0, nIsle), ...top].slice(0, players), srnd);

        // Power spots
        const prnd = mulberry32(hashSeed(seed, round, 'power'));
        const spotsOut: PowerSpot[] = [];
        const cand = plats.length ? plats : [isl];
        for (let k = 0; k < powerSpotsCount * 12 && spotsOut.length < powerSpotsCount; k++) {
            const p = cand[Math.floor(prnd() * cand.length)]!;
            const wgt = 1 + (FLOOR_Y - p.y) / 100;
            if (prnd() * 3.5 > wgt) continue;
            const s: PowerSpot = { x: Math.round(p.x + 30 + prnd() * (p.w - 60)), y: p.y - 20 };
            if (spotsOut.every((o) => Math.hypot(o.x - s.x, o.y - s.y) > 200)) spotsOut.push(s);
        }

        return {
            seed,
            round,
            island: { x: isl.x, y: isl.y, w: isl.w, tiles: islandTiles },
            platforms: plats,
            spawns,
            powerSpots: spotsOut,
            attempts: attempt + 1,
        };
    }

    // Classic fallback layout if all attempts fail
    return {
        seed,
        round,
        island: { x: 180, y: 400, w: 600, tiles: 6 },
        platforms: [
            { x: 50, y: 290, w: 190 },
            { x: 720, y: 290, w: 190 },
            { x: 385, y: 195, w: 190 },
        ].slice(0, platformCount),
        spawns: Array.from({ length: players }, (_, i) => ({ x: 210 + i * 77, y: 382, onIsland: true })),
        powerSpots: [{ x: 480, y: 175 }],
        attempts: 41,
        fallback: true,
    };
}