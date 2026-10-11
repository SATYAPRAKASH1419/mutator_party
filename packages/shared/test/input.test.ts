import { describe, it, expect } from 'vitest';
import {
  encodeBits,
  decodeBits,
  hasInput,
  seqNewer,
  InputSchema,
} from '../src/input.js';
import {
  INPUT_LEFT,
  INPUT_RIGHT,
  INPUT_JUMP,
  INPUT_SHOVE,
} from '../src/constants.js';

describe('Player Input Bitfield & Sequence Handling', () => {
  it('encodeBits packs flags into a single bitfield', () => {
    expect(encodeBits({})).toBe(0);
    expect(encodeBits({ left: true })).toBe(INPUT_LEFT);
    expect(encodeBits({ right: true, jump: true })).toBe(INPUT_RIGHT | INPUT_JUMP);
    expect(encodeBits({ left: true, right: true, jump: true, shove: true })).toBe(15);
  });

  it('decodeBits unpacks bitfield accurately', () => {
    expect(decodeBits(0)).toEqual({
      left: false,
      right: false,
      jump: false,
      shove: false,
    });

    expect(decodeBits(INPUT_LEFT | INPUT_SHOVE)).toEqual({
      left: true,
      right: false,
      jump: false,
      shove: true,
    });
  });

  it('hasInput checks individual button flags', () => {
    const bits = INPUT_JUMP | INPUT_SHOVE;
    expect(hasInput(bits, INPUT_JUMP)).toBe(true);
    expect(hasInput(bits, INPUT_SHOVE)).toBe(true);
    expect(hasInput(bits, INPUT_LEFT)).toBe(false);
    expect(hasInput(bits, INPUT_RIGHT)).toBe(false);
  });

  describe('seqNewer (wrap-aware 16-bit comparison)', () => {
    it('handles normal ascending sequences', () => {
      expect(seqNewer(5, 4)).toBe(true);
      expect(seqNewer(100, 50)).toBe(true);
      expect(seqNewer(50, 100)).toBe(false);
      expect(seqNewer(42, 42)).toBe(false);
    });

    it('handles wrapping across the 65535 -> 0 boundary', () => {
      // 5 is newer than 65530 (sequence just rolled over)
      expect(seqNewer(5, 65530)).toBe(true);
      expect(seqNewer(65530, 5)).toBe(false);

      // 0 is newer than 65535
      expect(seqNewer(0, 65535)).toBe(true);
      expect(seqNewer(65535, 0)).toBe(false);
    });
  });

  describe('InputSchema validation', () => {
    it('accepts valid input payloads', () => {
      const valid = InputSchema.safeParse({ seq: 100, bits: 5 });
      expect(valid.success).toBe(true);
    });

    it('rejects out-of-range seq or bits', () => {
      expect(InputSchema.safeParse({ seq: -1, bits: 0 }).success).toBe(false);
      expect(InputSchema.safeParse({ seq: 70000, bits: 0 }).success).toBe(false);
      expect(InputSchema.safeParse({ seq: 0, bits: 16 }).success).toBe(false);
      expect(InputSchema.safeParse({ seq: 0, bits: -1 }).success).toBe(false);
    });
  });
});
