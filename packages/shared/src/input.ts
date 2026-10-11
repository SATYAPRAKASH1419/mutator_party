// ─── input.ts ─────────────────────────────────────────────────────────────────
// Bitfield utilities and wrap-aware sequence number comparison for player inputs.
// Keeps input payloads tiny (≤ 8 bytes) and handles packet reordering.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';
import { INPUT_LEFT, INPUT_RIGHT, INPUT_JUMP, INPUT_SHOVE } from './constants.js';

// ─── Types & Schemas ─────────────────────────────────────────────────────────

export interface InputPayload {
    seq: number;   // 16-bit sequence number (0..65535)
    bits: number;  // 4-bit field: left(1), right(2), jump(4), shove(8)
}

export interface DecodedInput {
    left: boolean;
    right: boolean;
    jump: boolean;
    shove: boolean;
}

// Zod schema for client input validation (spec section 3.3)
export const InputSchema = z.object({
    seq: z.number().int().min(0).max(65535),
    bits: z.number().int().min(0).max(15),
});

// ─── Bitfield Helpers ────────────────────────────────────────────────────────

/** Packs boolean control states into a 4-bit integer (0..15). */
export function encodeBits(input: Partial<DecodedInput>): number {
    let bits = 0;
    if (input.left) bits |= INPUT_LEFT;
    if (input.right) bits |= INPUT_RIGHT;
    if (input.jump) bits |= INPUT_JUMP;
    if (input.shove) bits |= INPUT_SHOVE;
    return bits;
}

/** Unpacks a 4-bit integer into individual boolean controls. */
export function decodeBits(bits: number): DecodedInput {
    return {
        left: (bits & INPUT_LEFT) !== 0,
        right: (bits & INPUT_RIGHT) !== 0,
        jump: (bits & INPUT_JUMP) !== 0,
        shove: (bits & INPUT_SHOVE) !== 0,
    };
}

/** Checks whether a specific input flag is active in a bitfield. */
export function hasInput(bits: number, flag: number): boolean {
    return (bits & flag) !== 0;
}

// ─── Sequence Comparison ─────────────────────────────────────────────────────

/**
 * Wrap-aware comparison for 16-bit sequence numbers (0..65535).
 * Returns true if sequence `a` is strictly newer than sequence `b`.
 * Uses RFC 1982 serial number arithmetic (half the range = 32768).
 */
export function seqNewer(a: number, b: number): boolean {
    if (a === b) return false;
    const diff = (a - b) & 0xffff;
    return diff < 0x8000;
}
