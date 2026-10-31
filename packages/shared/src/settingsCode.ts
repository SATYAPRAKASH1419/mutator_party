import { PRESETS } from './presets.js';
import { sanitize, DEFAULTS, type GameConfig } from './settings.js';
import { MODES, THEMES } from './constants.js';

// Base32 Crockford alphabet (avoids I, L, O, U to prevent visual confusion)
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Encodes key tournament / custom settings into an 8-character uppercase code.
 * Packed format (40 bits total = 8 characters in 5-bit base32):
 * - bits 0..3 (4 bits): rounds (1..15)
 * - bits 4..6 (3 bits): roundTime enum (0:auto, 1:30, 2:45, 3:60, 4:75, 5:90, 6:120)
 * - bits 7..8 (2 bits): respawnMode (0:off, 1:lives, 2:unlimited)
 * - bits 9..12 (4 bits): lives (1..9)
 * - bits 13..13 (1 bit): botsEnabled
 * - bits 14..15 (2 bits): botSkill (0:easy, 1:normal, 2:hard)
 * - bits 16..16 (1 bit): itemsEnabled
 * - bits 17..19 (3 bits): itemSpots (0..5)
 * - bits 20..22 (3 bits): themeMode (0:rotate, 1:fixed, 2:random)
 * - bits 23..25 (3 bits): fixedTheme (0..6)
 * - bits 26..27 (2 bits): layout (0:every_round, 1:per_match, 2:classic)
 * - bits 28..30 (3 bits): twistPicker (0:last_place, 1:vote, 2:host, 3:random)
 * - bits 31..33 (3 bits): twistsPerRound (0:ramp, 1:1, 2:2, 3:3)
 * - bits 34..39 (6 bits): checksum (sum of previous bits % 64)
 */

const ROUND_TIME_MAP = ['auto', 30, 45, 60, 75, 90, 120] as const;

export function encodeSettingsCode(cfg: Partial<GameConfig>): string {
  const c = sanitize(cfg);

  const rounds = Math.min(15, Math.max(1, c.match.rounds));
  const roundTimeIdx = Math.max(0, ROUND_TIME_MAP.indexOf(c.match.roundTime as any));
  const respawnModeIdx = c.respawn.mode === 'off' ? 0 : c.respawn.mode === 'unlimited' ? 2 : 1;
  const lives = Math.min(9, Math.max(1, c.respawn.lives));
  const botsOn = c.match.fillBots ? 1 : 0;
  const botSkillIdx = c.match.botSkill === 'hard' ? 2 : c.match.botSkill === 'easy' ? 0 : 1;
  const itemsOn = c.items.enabled ? 1 : 0;
  const itemSpots = Math.min(5, Math.max(0, c.items.spots));
  const themeModeIdx = c.theme.mode === 'fixed' ? 1 : c.theme.mode === 'random' ? 2 : 0;
  const fixedThemeIdx = Math.max(0, THEMES.indexOf(c.theme.fixed));
  const layoutIdx = c.arena.layout === 'per_match' ? 1 : c.arena.layout === 'classic' ? 2 : 0;
  const pickerIdx = c.modes.twistPicker === 'vote' ? 1 : c.modes.twistPicker === 'host' ? 2 : c.modes.twistPicker === 'random' ? 3 : 0;
  const perRoundIdx = c.twists.perRound === '1' ? 1 : c.twists.perRound === '2' ? 2 : c.twists.perRound === '3' ? 3 : 0;

  // Pack into a BigInt of 34 payload bits
  let packed = 0n;
  packed |= BigInt(rounds & 0xf);
  packed |= BigInt(roundTimeIdx & 0x7) << 4n;
  packed |= BigInt(respawnModeIdx & 0x3) << 7n;
  packed |= BigInt(lives & 0xf) << 9n;
  packed |= BigInt(botsOn & 0x1) << 13n;
  packed |= BigInt(botSkillIdx & 0x3) << 14n;
  packed |= BigInt(itemsOn & 0x1) << 16n;
  packed |= BigInt(itemSpots & 0x7) << 17n;
  packed |= BigInt(themeModeIdx & 0x7) << 20n;
  packed |= BigInt(fixedThemeIdx & 0x7) << 23n;
  packed |= BigInt(layoutIdx & 0x3) << 26n;
  packed |= BigInt(pickerIdx & 0x7) << 28n;
  packed |= BigInt(perRoundIdx & 0x7) << 31n;

  // 6-bit checksum
  let sum = 0n;
  for (let i = 0n; i < 34n; i++) {
    if ((packed >> i) & 1n) sum += i + 1n;
  }
  const checksum = sum % 64n;
  packed |= (checksum & 0x3fn) << 34n;

  // Convert to 8 base32 characters
  let code = '';
  for (let i = 0; i < 8; i++) {
    const chunk = Number((packed >> BigInt(i * 5)) & 0x1fn);
    code += ALPHABET[chunk];
  }

  return code;
}

export function decodeSettingsCode(rawCode: string): GameConfig | null {
  if (!rawCode || typeof rawCode !== 'string') return null;
  const cleaned = rawCode.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (cleaned.length !== 8) return null;

  let packed = 0n;
  for (let i = 0; i < 8; i++) {
    const char = cleaned[i];
    if (!char) return null;
    const val = ALPHABET.indexOf(char);
    if (val === -1) return null;
    packed |= BigInt(val) << BigInt(i * 5);
  }

  // Validate checksum
  const expectedChecksum = Number((packed >> 34n) & 0x3fn);
  let sum = 0n;
  for (let i = 0n; i < 34n; i++) {
    if ((packed >> i) & 1n) sum += i + 1n;
  }
  const calculatedChecksum = Number(sum % 64n);
  if (expectedChecksum !== calculatedChecksum) {
    return null;
  }

  const rounds = Number(packed & 0xfn);
  const roundTimeIdx = Number((packed >> 4n) & 0x7n);
  const respawnModeIdx = Number((packed >> 7n) & 0x3n);
  const lives = Number((packed >> 9n) & 0xfn);
  const botsOn = Number((packed >> 13n) & 0x1n) === 1;
  const botSkillIdx = Number((packed >> 14n) & 0x3n);
  const itemsOn = Number((packed >> 16n) & 0x1n) === 1;
  const itemSpots = Number((packed >> 17n) & 0x7n);
  const themeModeIdx = Number((packed >> 20n) & 0x7n);
  const fixedThemeIdx = Number((packed >> 23n) & 0x7n);
  const layoutIdx = Number((packed >> 26n) & 0x3n);
  const pickerIdx = Number((packed >> 28n) & 0x7n);
  const perRoundIdx = Number((packed >> 31n) & 0x7n);

  const roundTime = ROUND_TIME_MAP[roundTimeIdx] ?? 'auto';
  const respawnMode = respawnModeIdx === 0 ? 'off' : respawnModeIdx === 2 ? 'unlimited' : 'lives';
  const botSkill = botSkillIdx === 2 ? 'hard' : botSkillIdx === 0 ? 'easy' : 'normal';
  const themeMode = themeModeIdx === 1 ? 'fixed' : themeModeIdx === 2 ? 'random' : 'rotate';
  const fixedTheme = THEMES[fixedThemeIdx] ?? 'sunny';
  const layout = layoutIdx === 1 ? 'per_match' : layoutIdx === 2 ? 'classic' : 'every_round';
  const twistPicker = pickerIdx === 1 ? 'vote' : pickerIdx === 2 ? 'host' : pickerIdx === 3 ? 'random' : 'last_place';
  const perRound = perRoundIdx === 1 ? '1' : perRoundIdx === 2 ? '2' : perRoundIdx === 3 ? '3' : 'ramp';

  return sanitize({
    match: {
      rounds,
      roundTime: roundTime as any,
      fillBots: botsOn,
      botSkill,
    },
    respawn: {
      mode: respawnMode,
      lives,
    },
    items: {
      enabled: itemsOn,
      spots: itemSpots,
    },
    theme: {
      mode: themeMode,
      fixed: fixedTheme,
    },
    arena: {
      layout,
    },
    modes: {
      twistPicker,
    },
    twists: {
      perRound,
    },
  });
}
