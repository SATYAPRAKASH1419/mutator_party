import { describe, it, expect } from 'vitest';
import { mulberry32, hashSeed, makeRoundSeeds, shuffleArray, pickRandom } from '../src/rng.js';

describe('RNG & Seeding', () => {
  it('mulberry32 produces identical sequence for identical seed', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).toEqual(seq2);
    expect(seq1.every((n) => n >= 0 && n < 1)).toBe(true);
  });

  it('hashSeed produces deterministic 32-bit unsigned integers', () => {
    const h1 = hashSeed(123, 1, 'layout');
    const h2 = hashSeed(123, 1, 'layout');
    const h3 = hashSeed(123, 1, 'spawn');

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(h1)).toBe(true);
  });

  it('makeRoundSeeds produces independent streams', () => {
    const seeds = makeRoundSeeds(42, 1);
    expect(typeof seeds.layout()).toBe('number');
    expect(typeof seeds.spawn()).toBe('number');
    expect(typeof seeds.power()).toBe('number');
    expect(typeof seeds.events()).toBe('number');
  });

  it('shuffleArray shuffles deterministically with seeded rng', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled1 = shuffleArray([...original], mulberry32(999));
    const shuffled2 = shuffleArray([...original], mulberry32(999));

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1).not.toEqual(original);
  });

  it('pickRandom selects an item deterministically', () => {
    const list = ['a', 'b', 'c', 'd', 'e'] as const;
    const item = pickRandom(list, mulberry32(777));
    expect(list).toContain(item);
  });
});
