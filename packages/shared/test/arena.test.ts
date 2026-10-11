import { describe, it, expect } from 'vitest';
import { generateArena } from '../src/arena.js';
import { ARENA_W } from '../src/constants.js';

describe('Deterministic Arena Generator', () => {
    it('is completely deterministic for identical seed and round', () => {
        const arena1 = generateArena({ seed: 42, round: 1, platformCount: 4 });
        const arena2 = generateArena({ seed: 42, round: 1, platformCount: 4 });

        expect(arena1).toEqual(arena2);
        expect(arena1.fallback).toBeUndefined();
    });

    it('generates different layouts for different rounds', () => {
        const round0 = generateArena({ seed: 12345, round: 0 });
        const round1 = generateArena({ seed: 12345, round: 1 });

        expect(round0.platforms).not.toEqual(round1.platforms);
    });

    it('generates mirrored platforms when symmetric: true', () => {
        const arena = generateArena({ seed: 777, round: 0, symmetric: true, platformCount: 4 });
        const cx = ARENA_W / 2; // 480

        // For symmetric arenas, platforms are either centered or paired symmetrically
        for (const p of arena.platforms) {
            const pCenter = p.x + p.w / 2;
            const isCentered = Math.abs(pCenter - cx) < 1;

            if (!isCentered) {
                // Find matching mirrored platform on the other side at the same tier (y)
                const mirrored = arena.platforms.find(
                    (other) =>
                        other !== p &&
                        other.y === p.y &&
                        Math.abs((other.x + other.w / 2) - (cx - (pCenter - cx))) < 2
                );
                expect(mirrored).toBeDefined();
            }
        }
    });

    it('places correct number of spawns and power spots', () => {
        const arena = generateArena({
            seed: 888,
            round: 0,
            players: 6,
            powerSpots: 3,
        });

        expect(arena.spawns).toHaveLength(6);
        expect(arena.powerSpots).toHaveLength(3);

        // Spawns have valid coordinates
        for (const s of arena.spawns) {
            expect(s.x).toBeGreaterThan(0);
            expect(s.x).toBeLessThan(ARENA_W);
            expect(typeof s.onIsland).toBe('boolean');
        }
    });

    it('runs across multiple seed combinations without fallbacks', () => {
        const platformCounts = [2, 4, 6, 8];
        const seeds = [100, 200, 300, 400];

        for (const count of platformCounts) {
            for (const seed of seeds) {
                const res = generateArena({ seed, round: 0, platformCount: count });
                expect(res.fallback).toBeUndefined();
                expect(res.platforms.length).toBeGreaterThanOrEqual(1);
                expect(res.attempts).toBeGreaterThanOrEqual(1);
            }
        }
    });
});
