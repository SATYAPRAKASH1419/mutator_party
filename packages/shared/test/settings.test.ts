import { describe, it, expect } from 'vitest';
import { sanitize, DEFAULTS, RoomSettingsSchema } from '../src/settings.js';
import { MODES, TWISTS, ITEMS } from '../src/constants.js';

describe('Room Settings & Sanitization', () => {
  it('sanitize({}) returns the default settings', () => {
    const result = sanitize({});
    expect(result).toEqual(DEFAULTS);
  });

  it('clamps hostile and invalid input (from spec section 13.3)', () => {
    const hostileInput = {
      room: {
        name: '<script>alert("pwn")</script>',
        visibility: 'super-secret', // invalid enum
      },
      match: {
        maxPlayers: 9999,      // should clamp to 12
        rounds: -5,            // should clamp to 1
        roundTime: '<script>', // should fallback to 'auto'
      },
      arena: {
        platformCount: '100',  // string number, should clamp to 8
        islandSize: 'XXL',     // invalid enum, fallback to 'M'
      },
      modes: {
        pool: ['nuke', 'brawl'], // 'nuke' is invalid, only 'brawl' kept
      },
      respawn: {
        lives: 0,              // should clamp to 1
      },
      theme: {
        fixed: 'cyberpunk',    // invalid theme, fallback to 'sunny'
      },
    };

    const sanitized = sanitize(hostileInput);

    // Assert exact clamping rules
    expect(sanitized.room.name).toBe('scriptalertpwnscript');
    expect(sanitized.room.visibility).toBe('private');
    expect(sanitized.match.maxPlayers).toBe(12);
    expect(sanitized.match.rounds).toBe(1);
    expect(sanitized.match.roundTime).toBe('auto');
    expect(sanitized.arena.platformCount).toBe(8);
    expect(sanitized.arena.islandSize).toBe('M');
    expect(sanitized.modes.pool).toEqual(['brawl']);
    expect(sanitized.respawn.lives).toBe(1);
    expect(sanitized.theme.fixed).toBe('sunny');
  });

  it('merges partial updates on top of base settings', () => {
    const base = sanitize({});
    const patch = { match: { rounds: 7, maxPlayers: 4 } };

    const updated = sanitize(patch, base);

    expect(updated.match.rounds).toBe(7);
    expect(updated.match.maxPlayers).toBe(4);
    // Preserves other existing settings
    expect(updated.match.scoring).toBe(base.match.scoring);
    expect(updated.arena.platformCount).toBe(base.arena.platformCount);
    expect(updated.room.chat).toBe(base.room.chat);
  });

  it('handles empty twists and items arrays when explicitly provided', () => {
    const noTwists = sanitize({ twists: { allowed: [] } });
    expect(noTwists.twists.allowed).toEqual([]);

    const noItems = sanitize({ items: { allowed: [] } });
    expect(noItems.items.allowed).toEqual([]);
  });

  it('fuzz test: never throws when fed unexpected types or objects', () => {
    const weirdInputs = [
      null,
      undefined,
      12345,
      'hello',
      [],
      { room: null, match: 'invalid', arena: [1, 2, 3] },
      { match: { maxPlayers: NaN, rounds: Infinity } },
    ];

    for (const input of weirdInputs) {
      expect(() => sanitize(input)).not.toThrow();
      const res = sanitize(input);
      expect(RoomSettingsSchema.safeParse(res).success).toBe(true);
    }
  });
});
