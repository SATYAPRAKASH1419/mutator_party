// ─── rng.ts ───────────────────────────────────────────────────────────────────
// Deterministic seeded random number generator and array helpers.
// ─────────────────────────────────────────────────────────────────────────────

/** 32-bit Mulberry32 PRNG. Returns a float in [0, 1). */
export function mulberry32(seed: number): () => number {
    let a = seed | 0;
    return function () {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** 32-bit FNV-1a hash of string/number parts into a seed integer. */
export function hashSeed(...parts: Array<string | number>): number {
    let h = 2166136261 >>> 0;
    for (const c of parts.join('|')) {
        h ^= c.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** Derives independent PRNG streams for layout, spawn, power spots, and events. */
export function makeRoundSeeds(roomSeed: number, round: number) {
    return {
        layout: mulberry32(hashSeed(roomSeed, round, 'layout')),
        spawn: mulberry32(hashSeed(roomSeed, round, 'spawn')),
        power: mulberry32(hashSeed(roomSeed, round, 'power')),
        events: mulberry32(hashSeed(roomSeed, round, 'events')),
    };
}

/** In-place Fisher-Yates array shuffle using provided PRNG. */
export function shuffleArray<T>(arr: T[], rng: () => number): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i]!, arr[j]!] = [arr[j]!, arr[i]!];
    }
    return arr;
}

/** Picks a random item from array using provided PRNG. */
export function pickRandom<T>(arr: readonly T[], rng: () => number): T {
    return arr[Math.floor(rng() * arr.length)]!;
}
