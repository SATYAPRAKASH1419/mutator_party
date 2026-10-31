import { type RoomSettings, type GameConfig, DEFAULTS } from './settings.js';
import { type Twist } from './constants.js';

export type PresetId = 'chaosParty' | 'classic' | 'tournament' | 'chill';

export interface PresetDefinition {
  id: PresetId;
  name: string;
  promise: string;
  icon: 'chaos' | 'classic' | 'trophy' | 'cloud';
  config: GameConfig;
}

export interface CustomPreset {
  id: string;
  name: string;
  icon: 'chaos' | 'classic' | 'trophy' | 'cloud' | 'star' | 'heart' | 'flame';
  config: GameConfig;
  createdAt: number;
}

export const HARSH_TWISTS: readonly Twist[] = ['dark', 'wind', 'flap', 'reverse'] as const;

export const SOFT_THEMES = ['sunny', 'candy', 'neon', 'frozen'] as const;

export const PRESETS: Record<PresetId, PresetDefinition> = {
  chaosParty: {
    id: 'chaosParty',
    name: 'Chaos Party',
    promise: 'Everything goes wrong, on purpose',
    icon: 'chaos',
    config: {
      version: 1,
      room: {
        ...DEFAULTS.room,
      },
      match: {
        ...DEFAULTS.match,
        maxPlayers: 8,
        minPlayersToStart: 2,
        rounds: 5,
        roundTime: 'auto',
        fillBots: true,
        botSkill: 'normal',
        scoring: 'standard',
      },
      arena: {
        ...DEFAULTS.arena,
        platformCount: 4,
        islandSize: 'M',
        layout: 'every_round',
        mirror: true,
        shuffleSpawns: true,
      },
      modes: {
        pool: ['brawl', 'bomb', 'crown'],
        order: 'shuffle_bag',
        fixedList: [],
        twistPicker: 'last_place',
      },
      twists: {
        allowed: [...DEFAULTS.twists.allowed],
        perRound: 'ramp',
        themeLinked: false,
      },
      respawn: {
        mode: 'lives',
        lives: 3,
        delaySec: 2,
        shieldSec: 1.5,
        where: 'random_platform',
      },
      items: {
        enabled: true,
        allowed: [...DEFAULTS.items.allowed],
        spots: 3,
        firstTouch: true,
        keepOnKO: false,
      },
      theme: {
        mode: 'rotate',
        fixed: 'sunny',
        perRound: [],
      },
    },
  },

  classic: {
    id: 'classic',
    name: 'Classic',
    promise: 'Fair, simple, quick',
    icon: 'classic',
    config: {
      version: 1,
      room: {
        ...DEFAULTS.room,
      },
      match: {
        ...DEFAULTS.match,
        maxPlayers: 8,
        minPlayersToStart: 2,
        rounds: 5,
        roundTime: 60,
        fillBots: true,
        botSkill: 'normal',
        scoring: 'standard',
      },
      arena: {
        ...DEFAULTS.arena,
        platformCount: 4,
        islandSize: 'M',
        layout: 'classic',
        mirror: true,
        shuffleSpawns: true,
      },
      modes: {
        pool: ['brawl', 'bomb', 'crown'],
        order: 'shuffle_bag',
        fixedList: [],
        twistPicker: 'random',
      },
      twists: {
        allowed: DEFAULTS.twists.allowed.filter((t) => !HARSH_TWISTS.includes(t)),
        perRound: '1',
        themeLinked: false,
      },
      respawn: {
        mode: 'lives',
        lives: 3,
        delaySec: 2,
        shieldSec: 1.5,
        where: 'random_platform',
      },
      items: {
        enabled: true,
        allowed: [...DEFAULTS.items.allowed],
        spots: 2,
        firstTouch: true,
        keepOnKO: false,
      },
      theme: {
        mode: 'fixed',
        fixed: 'sunny',
        perRound: [],
      },
    },
  },

  tournament: {
    id: 'tournament',
    name: 'Tournament',
    promise: 'Competitive, no luck',
    icon: 'trophy',
    config: {
      version: 1,
      room: {
        ...DEFAULTS.room,
        spectators: true,
      },
      match: {
        ...DEFAULTS.match,
        maxPlayers: 8,
        minPlayersToStart: 4,
        rounds: 7,
        roundTime: 60,
        fillBots: false,
        botSkill: 'normal',
        scoring: 'standard',
      },
      arena: {
        ...DEFAULTS.arena,
        platformCount: 4,
        islandSize: 'M',
        layout: 'per_match',
        mirror: true,
        shuffleSpawns: false,
      },
      modes: {
        pool: ['brawl', 'bomb', 'crown'],
        order: 'fixed',
        fixedList: ['brawl', 'crown', 'bomb', 'brawl', 'crown', 'bomb', 'brawl'],
        twistPicker: 'vote',
      },
      twists: {
        allowed: DEFAULTS.twists.allowed.filter((t) => !HARSH_TWISTS.includes(t)),
        perRound: '1',
        themeLinked: false,
      },
      respawn: {
        mode: 'lives',
        lives: 3,
        delaySec: 2,
        shieldSec: 1.5,
        where: 'random_platform',
      },
      items: {
        enabled: false,
        allowed: [...DEFAULTS.items.allowed],
        spots: 0,
        firstTouch: true,
        keepOnKO: false,
      },
      theme: {
        mode: 'fixed',
        fixed: 'sunny',
        perRound: [],
      },
    },
  },

  chill: {
    id: 'chill',
    name: 'Chill',
    promise: 'Relaxed, for friends and family',
    icon: 'cloud',
    config: {
      version: 1,
      room: {
        ...DEFAULTS.room,
      },
      match: {
        ...DEFAULTS.match,
        maxPlayers: 8,
        minPlayersToStart: 2,
        rounds: 3,
        roundTime: 90,
        fillBots: true,
        botSkill: 'easy',
        scoring: 'standard',
      },
      arena: {
        ...DEFAULTS.arena,
        platformCount: 4,
        islandSize: 'M',
        layout: 'every_round',
        mirror: true,
        shuffleSpawns: true,
      },
      modes: {
        pool: ['brawl', 'bomb', 'crown'],
        order: 'shuffle_bag',
        fixedList: [],
        twistPicker: 'random',
      },
      twists: {
        allowed: DEFAULTS.twists.allowed.filter((t) => !HARSH_TWISTS.includes(t)),
        perRound: '1',
        themeLinked: false,
      },
      respawn: {
        mode: 'unlimited',
        lives: 3,
        delaySec: 2,
        shieldSec: 2,
        where: 'random_platform',
      },
      items: {
        enabled: true,
        allowed: [...DEFAULTS.items.allowed],
        spots: 3,
        firstTouch: true,
        keepOnKO: false,
      },
      theme: {
        mode: 'rotate',
        fixed: 'sunny',
        perRound: [],
      },
    },
  },
};

/**
 * Computes a human-readable match preview string from the current configuration.
 * Example: "5 rounds · about 6 min · 8 twists in rotation"
 */
export function computeMatchPreview(config: Partial<GameConfig> | null | undefined): string {
  const rounds = Math.max(1, config?.match?.rounds ?? 5);

  let secondsPerRound = 60;
  if (config?.match?.roundTime === 'auto' || !config?.match?.roundTime) {
    secondsPerRound = 60;
  } else {
    secondsPerRound = Number(config.match.roundTime);
  }

  // Factor in round transitions + pick phases (~15s)
  const totalSeconds = rounds * (secondsPerRound + 15);
  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));

  const twistsAllowedCount = config?.twists?.allowed?.length ?? 13;

  return `${rounds} ${rounds === 1 ? 'round' : 'rounds'} · about ${totalMinutes} min · ${twistsAllowedCount} twists in rotation`;
}

/**
 * Checks whether two configs are deeply equal across game rule settings.
 */
export function isConfigEqual(a: Partial<GameConfig>, b: Partial<GameConfig>): boolean {
  try {
    const normalize = (c: Partial<GameConfig>) => ({
      match: {
        maxPlayers: c.match?.maxPlayers,
        minPlayersToStart: c.match?.minPlayersToStart,
        rounds: c.match?.rounds,
        roundTime: c.match?.roundTime,
        fillBots: c.match?.fillBots,
        botSkill: c.match?.botSkill,
        scoring: c.match?.scoring,
      },
      arena: {
        platformCount: c.arena?.platformCount,
        islandSize: c.arena?.islandSize,
        layout: c.arena?.layout,
        mirror: c.arena?.mirror,
        shuffleSpawns: c.arena?.shuffleSpawns,
      },
      modes: {
        pool: [...(c.modes?.pool ?? [])].sort(),
        order: c.modes?.order,
        twistPicker: c.modes?.twistPicker,
      },
      twists: {
        allowed: [...(c.twists?.allowed ?? [])].sort(),
        perRound: c.twists?.perRound,
        themeLinked: c.twists?.themeLinked,
      },
      respawn: {
        mode: c.respawn?.mode,
        lives: c.respawn?.lives,
        delaySec: c.respawn?.delaySec,
        shieldSec: c.respawn?.shieldSec,
      },
      items: {
        enabled: c.items?.enabled,
        allowed: [...(c.items?.allowed ?? [])].sort(),
        spots: c.items?.spots,
        firstTouch: c.items?.firstTouch,
        keepOnKO: c.items?.keepOnKO,
      },
      theme: {
        mode: c.theme?.mode,
        fixed: c.theme?.fixed,
      },
    });

    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  } catch {
    return false;
  }
}
