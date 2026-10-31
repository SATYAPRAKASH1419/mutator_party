import { describe, it, expect } from 'vitest';
import { PRESETS, computeMatchPreview, isConfigEqual, HARSH_TWISTS } from '../src/presets.js';
import { encodeSettingsCode, decodeSettingsCode } from '../src/settingsCode.js';
import { sanitize, DEFAULTS } from '../src/settings.js';

describe('Presets', () => {
  it('defines the 4 required presets with valid configs', () => {
    expect(PRESETS.chaosParty).toBeDefined();
    expect(PRESETS.classic).toBeDefined();
    expect(PRESETS.tournament).toBeDefined();
    expect(PRESETS.chill).toBeDefined();

    expect(PRESETS.chaosParty.config.match.rounds).toBe(5);
    expect(PRESETS.classic.config.match.rounds).toBe(5);
    expect(PRESETS.tournament.config.match.rounds).toBe(7);
    expect(PRESETS.chill.config.match.rounds).toBe(3);
  });

  it('excludes harsh twists from Classic and Chill', () => {
    for (const harsh of HARSH_TWISTS) {
      expect(PRESETS.classic.config.twists.allowed).not.toContain(harsh);
      expect(PRESETS.chill.config.twists.allowed).not.toContain(harsh);
    }
  });

  it('enforces tournament specific rules in preset', () => {
    const t = PRESETS.tournament.config;
    expect(t.match.minPlayersToStart).toBe(4);
    expect(t.match.fillBots).toBe(false);
    expect(t.items.enabled).toBe(false);
    expect(t.arena.layout).toBe('per_match');
    expect(t.room.spectators).toBe(true);
  });

  it('computes live match preview string correctly', () => {
    const preview = computeMatchPreview(PRESETS.chaosParty.config);
    expect(preview).toContain('5 rounds');
    expect(preview).toContain('min');
    expect(preview).toContain('twists in rotation');
  });

  it('detects config equality', () => {
    expect(isConfigEqual(PRESETS.classic.config, PRESETS.classic.config)).toBe(true);
    expect(isConfigEqual(PRESETS.classic.config, PRESETS.chaosParty.config)).toBe(false);
  });
});

describe('Settings Code Round-Trip', () => {
  it('encodes and decodes tournament settings code', () => {
    const original = PRESETS.tournament.config;
    const code = encodeSettingsCode(original);
    expect(code).toHaveLength(8);

    const decoded = decodeSettingsCode(code);
    expect(decoded).not.toBeNull();
    expect(decoded?.match.rounds).toBe(7);
    expect(decoded?.match.roundTime).toBe(60);
    expect(decoded?.match.fillBots).toBe(false);
    expect(decoded?.items.enabled).toBe(false);
    expect(decoded?.arena.layout).toBe('per_match');
  });

  it('returns null on invalid code or bad checksum', () => {
    expect(decodeSettingsCode('')).toBeNull();
    expect(decodeSettingsCode('ABC')).toBeNull();
    expect(decodeSettingsCode('ZZZZZZZZ')).toBeNull(); // invalid checksum
  });
});

describe('Sanitize Invariants', () => {
  it('clamps minPlayersToStart to maxPlayers if higher', () => {
    const res = sanitize({
      match: {
        maxPlayers: 4,
        minPlayersToStart: 8,
      },
    });
    expect(res.match.minPlayersToStart).toBe(4);
  });

  it('guarantees at least 1 mode fallback', () => {
    const res = sanitize({
      modes: { pool: [] },
    });
    expect(res.modes.pool.length).toBeGreaterThanOrEqual(1);
  });
});
