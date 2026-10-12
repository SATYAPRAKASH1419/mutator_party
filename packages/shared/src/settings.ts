import { z } from 'zod';
import { MODES, TWISTS, ITEMS, THEMES, type Mode, type Twist, type Item, type Theme } from './constants.js';

// Keeps a number between min and max; non-numbers or undefined fall back to def
function clamp<T = number>(v: unknown, min: number, max: number, def: T, round = false): number | T {
    if (v === undefined) return def;
    const n = Number(v);
    if (!Number.isFinite(n)) return def;
    const clamped = Math.min(max, Math.max(min, n));
    return round ? Math.round(clamped) : clamped;
}


// Ensures a value is in the allowed list; otherwise uses fallback
function oneOf<T extends string>(v: unknown, list: readonly T[], def: T): T {
    return typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : def;
}

// Filters an array to valid items and removes duplicates. If empty, uses default
function subset<T extends string>(arr: unknown, list: readonly T[], def: readonly T[]): T[] {
    const a = Array.isArray(arr) ? ([...new Set(arr.filter((x): x is T => (list as readonly string[]).includes(x)))] as T[]) : [];
    return a.length > 0 ? a : [...def];
}

// Like subset, but allows an empty array [] if the user explicitly provided one
function allowedArray<T extends string>(arr: unknown, list: readonly T[], def: readonly T[]): T[] {
    return Array.isArray(arr)
        ? ([...new Set(arr.filter((x): x is T => (list as readonly string[]).includes(x)))] as T[])
        : [...def];
}


// Sanitizes room names: removes dangerous characters, trims, limits to 24 chars
function sanitizeName(v: unknown, def = ''): string {
    return String(v ?? def)
        .replace(/[^\p{L}\p{N} _'-]/gu, '')
        .trim()
        .slice(0, 24);
}

export const DEFAULTS = {
    version: 1 as const,
    room: {
        name: '',
        visibility: 'private' as const,
        password: '',
        chat: 'emotes' as const,
        spectators: true,
        allowKick: true,
    },
    match: {
        maxPlayers: 8,
        minPlayersToStart: 2,
        fillBots: true,
        botSkill: 'normal' as const,
        rounds: 5,
        roundTime: 'auto' as const as 'auto' | number,
        scoring: 'standard' as const,
    },
    arena: {
        platformCount: 4,
        islandSize: 'M' as const,
        layout: 'every_round' as const,
        mirror: true,
        shuffleSpawns: true,
    },
    modes: {
        pool: [...MODES] as Mode[],
        order: 'shuffle_bag' as const,
        fixedList: [] as Mode[],
        twistPicker: 'last_place' as const,
    },
    twists: {
        allowed: [...TWISTS] as Twist[],
        perRound: 'ramp' as const,
        themeLinked: false,
    },
    respawn: {
        mode: 'lives' as const,
        lives: 3,
        delaySec: 2,
        shieldSec: 1.5,
        where: 'random_platform' as const,
    },
    items: {
        enabled: true,
        allowed: [...ITEMS] as Item[],
        spots: 3,
        firstTouch: true,
        keepOnKO: false,
    },
    theme: {
        mode: 'rotate' as const,
        fixed: 'sunny' as const,
        perRound: [] as Theme[],
    },
} as const;

export const DEFAULT_SETTINGS = DEFAULTS;

// ─── RoomSettingsSchema ───────────────────────────────────────────────────────
// Uses z.preprocess so that any client/host input is safely clamped and validated
// instead of throwing validation errors.

export const RoomSettingsSchema = z.object({
    version: z.literal(1).default(1),

    // Section A: Room & safety
    room: z.object({
        name: z.preprocess((v) => sanitizeName(v, DEFAULTS.room.name), z.string().max(24)).default(DEFAULTS.room.name),
        visibility: z.preprocess((v) => oneOf(v, ['private', 'public'] as const, DEFAULTS.room.visibility), z.enum(['private', 'public'])).default(DEFAULTS.room.visibility),
        password: z.preprocess((v) => String(v ?? '').slice(0, 12), z.string().max(12)).default(DEFAULTS.room.password),
        chat: z.preprocess((v) => oneOf(v, ['off', 'emotes', 'filtered'] as const, DEFAULTS.room.chat), z.enum(['off', 'emotes', 'filtered'])).default(DEFAULTS.room.chat),
        spectators: z.preprocess((v) => (v === undefined ? DEFAULTS.room.spectators : v !== false), z.boolean()).default(DEFAULTS.room.spectators),
        allowKick: z.preprocess((v) => (v === undefined ? DEFAULTS.room.allowKick : v !== false), z.boolean()).default(DEFAULTS.room.allowKick),
    }).default({}),

    // Section B: Match rules & players
    match: z.object({
        maxPlayers: z.preprocess((v) => clamp(v, 2, 12, DEFAULTS.match.maxPlayers, true), z.number().int().min(2).max(12)).default(DEFAULTS.match.maxPlayers),
        minPlayersToStart: z.preprocess((v) => clamp(v, 2, 12, DEFAULTS.match.minPlayersToStart, true), z.number().int().min(2).max(12)).default(DEFAULTS.match.minPlayersToStart),
        fillBots: z.preprocess((v) => (v === undefined ? DEFAULTS.match.fillBots : v !== false), z.boolean()).default(DEFAULTS.match.fillBots),
        botSkill: z.preprocess((v) => oneOf(v, ['easy', 'normal', 'hard'] as const, DEFAULTS.match.botSkill), z.enum(['easy', 'normal', 'hard'])).default(DEFAULTS.match.botSkill),
        rounds: z.preprocess((v) => clamp(v, 1, 15, DEFAULTS.match.rounds, true), z.number().int().min(1).max(15)).default(DEFAULTS.match.rounds),
        roundTime: z.preprocess(
            (v) => (v === 'auto' || v == null ? 'auto' : clamp(v, 30, 120, 'auto', true)),
            z.union([z.literal('auto'), z.number().min(30).max(120)])
        ).default(DEFAULTS.match.roundTime),
        scoring: z.preprocess((v) => oneOf(v, ['standard', 'winner_plus', 'kills'] as const, DEFAULTS.match.scoring), z.enum(['standard', 'winner_plus', 'kills'])).default(DEFAULTS.match.scoring),
    }).default({}),

    // Section C: Arena generator options
    arena: z.object({
        platformCount: z.preprocess((v) => clamp(v, 2, 8, DEFAULTS.arena.platformCount, true), z.number().int().min(2).max(8)).default(DEFAULTS.arena.platformCount),
        islandSize: z.preprocess((v) => oneOf(v, ['S', 'M', 'L'] as const, DEFAULTS.arena.islandSize), z.enum(['S', 'M', 'L'])).default(DEFAULTS.arena.islandSize),
        layout: z.preprocess((v) => oneOf(v, ['every_round', 'per_match', 'classic'] as const, DEFAULTS.arena.layout), z.enum(['every_round', 'per_match', 'classic'])).default(DEFAULTS.arena.layout),
        mirror: z.preprocess((v) => (v === undefined ? DEFAULTS.arena.mirror : v !== false), z.boolean()).default(DEFAULTS.arena.mirror),
        shuffleSpawns: z.preprocess((v) => (v === undefined ? DEFAULTS.arena.shuffleSpawns : v !== false), z.boolean()).default(DEFAULTS.arena.shuffleSpawns),
    }).default({}),

    // Section D: Modes
    modes: z.object({
        pool: z.preprocess((v) => subset(v, MODES, DEFAULTS.modes.pool), z.array(z.enum([...MODES])).min(1)).default([...DEFAULTS.modes.pool]),
        order: z.preprocess((v) => oneOf(v, ['shuffle_bag', 'random', 'fixed'] as const, DEFAULTS.modes.order), z.enum(['shuffle_bag', 'random', 'fixed'])).default(DEFAULTS.modes.order),
        fixedList: z.preprocess(
            (v) => (Array.isArray(v) ? (v.filter((x): x is Mode => (MODES as readonly string[]).includes(x)).slice(0, 15) as Mode[]) : []),
            z.array(z.enum([...MODES])).max(15)
        ).default([]),
        twistPicker: z.preprocess(
            (v) => oneOf(v, ['last_place', 'vote', 'host', 'random', 'round_robin'] as const, DEFAULTS.modes.twistPicker),
            z.enum(['last_place', 'vote', 'host', 'random', 'round_robin'])
        ).default(DEFAULTS.modes.twistPicker),
    }).default({}),

    // Section E: Twists / hurdles
    twists: z.object({
        allowed: z.preprocess((v) => allowedArray(v, TWISTS, DEFAULTS.twists.allowed), z.array(z.enum([...TWISTS]))).default([...DEFAULTS.twists.allowed]),
        perRound: z.preprocess((v) => oneOf(v, ['1', '2', '3', 'ramp'] as const, DEFAULTS.twists.perRound), z.enum(['1', '2', '3', 'ramp'])).default(DEFAULTS.twists.perRound),
        themeLinked: z.preprocess((v) => (v === undefined ? DEFAULTS.twists.themeLinked : v === true), z.boolean()).default(DEFAULTS.twists.themeLinked),
    }).default({}),

    // Section F: Respawn & lives
    respawn: z.object({
        mode: z.preprocess((v) => oneOf(v, ['off', 'lives', 'unlimited'] as const, DEFAULTS.respawn.mode), z.enum(['off', 'lives', 'unlimited'])).default(DEFAULTS.respawn.mode),
        lives: z.preprocess((v) => clamp(v, 1, 9, DEFAULTS.respawn.lives, true), z.number().int().min(1).max(9)).default(DEFAULTS.respawn.lives),
        delaySec: z.preprocess((v) => clamp(v, 1, 5, DEFAULTS.respawn.delaySec), z.number().min(1).max(5)).default(DEFAULTS.respawn.delaySec),
        shieldSec: z.preprocess((v) => clamp(v, 0, 3, DEFAULTS.respawn.shieldSec), z.number().min(0).max(3)).default(DEFAULTS.respawn.shieldSec),
        where: z.preprocess((v) => oneOf(v, ['random_platform', 'center', 'top'] as const, DEFAULTS.respawn.where), z.enum(['random_platform', 'center', 'top'])).default(DEFAULTS.respawn.where),
    }).default({}),

    // Section G: Power-ups / items
    items: z.object({
        enabled: z.preprocess((v) => (v === undefined ? DEFAULTS.items.enabled : v !== false), z.boolean()).default(DEFAULTS.items.enabled),
        allowed: z.preprocess((v) => allowedArray(v, ITEMS, DEFAULTS.items.allowed), z.array(z.enum([...ITEMS]))).default([...DEFAULTS.items.allowed]),
        spots: z.preprocess((v) => clamp(v, 0, 5, DEFAULTS.items.spots, true), z.number().int().min(0).max(5)).default(DEFAULTS.items.spots),
        firstTouch: z.preprocess((v) => (v === undefined ? DEFAULTS.items.firstTouch : v !== false), z.boolean()).default(DEFAULTS.items.firstTouch),
        keepOnKO: z.preprocess((v) => (v === undefined ? DEFAULTS.items.keepOnKO : v === true), z.boolean()).default(DEFAULTS.items.keepOnKO),
    }).default({}),

    // Section H: Themes
    theme: z.object({
        mode: z.preprocess((v) => oneOf(v, ['fixed', 'rotate', 'random', 'custom'] as const, DEFAULTS.theme.mode), z.enum(['fixed', 'rotate', 'random', 'custom'])).default(DEFAULTS.theme.mode),
        fixed: z.preprocess((v) => oneOf(v, THEMES, DEFAULTS.theme.fixed), z.enum([...THEMES])).default(DEFAULTS.theme.fixed),
        perRound: z.preprocess(
            (v) => (Array.isArray(v) ? (v.filter((x): x is Theme => (THEMES as readonly string[]).includes(x)).slice(0, 15) as Theme[]) : []),
            z.array(z.enum([...THEMES])).max(15)
        ).default([]),
    }).default({}),
}).default({});

export type RoomSettings = z.infer<typeof RoomSettingsSchema>;


// ─── sanitize() ──────────────────────────────────────────────────────────────
// Validates and clamps partial host settings, merging on top of base settings.
export function sanitize(input: unknown = {}, base: RoomSettings = DEFAULTS as RoomSettings): RoomSettings {
    const i = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
    const b = base && typeof base === 'object' ? base : DEFAULTS;

    const g = (k: string): Record<string, unknown> => {
        const val = i[k];
        return val && typeof val === 'object' ? (val as Record<string, unknown>) : {};
    };

    const r = g('room');
    const m = g('match');
    const a = g('arena');
    const md = g('modes');
    const t = g('twists');
    const rs = g('respawn');
    const it = g('items');
    const th = g('theme');

    const merged = {
        version: 1 as const,
        room: {
            name: sanitizeName(r.name ?? b.room.name, b.room.name),
            visibility: oneOf(r.visibility, ['private', 'public'] as const, b.room.visibility),
            password: String(r.password ?? b.room.password ?? '').slice(0, 12),
            chat: oneOf(r.chat, ['off', 'emotes', 'filtered'] as const, b.room.chat),
            spectators: r.spectators !== undefined ? r.spectators !== false : b.room.spectators,
            allowKick: r.allowKick !== undefined ? r.allowKick !== false : b.room.allowKick,
        },
        match: {
            maxPlayers: clamp(m.maxPlayers, 2, 12, b.match.maxPlayers, true),
            minPlayersToStart: clamp(m.minPlayersToStart, 2, 12, b.match.minPlayersToStart, true),
            fillBots: m.fillBots !== undefined ? m.fillBots !== false : b.match.fillBots,
            botSkill: oneOf(m.botSkill, ['easy', 'normal', 'hard'] as const, b.match.botSkill),
            rounds: clamp(m.rounds, 1, 15, b.match.rounds, true),
            roundTime: m.roundTime === undefined
                ? b.match.roundTime
                : (m.roundTime === 'auto' || m.roundTime === null ? 'auto' : clamp(m.roundTime, 30, 120, 'auto', true)),
            scoring: oneOf(m.scoring, ['standard', 'winner_plus', 'kills'] as const, b.match.scoring),
        },
        arena: {
            platformCount: clamp(a.platformCount, 2, 8, b.arena.platformCount, true),
            islandSize: oneOf(a.islandSize, ['S', 'M', 'L'] as const, b.arena.islandSize),
            layout: oneOf(a.layout, ['every_round', 'per_match', 'classic'] as const, b.arena.layout),
            mirror: a.mirror !== undefined ? a.mirror !== false : b.arena.mirror,
            shuffleSpawns: a.shuffleSpawns !== undefined ? a.shuffleSpawns !== false : b.arena.shuffleSpawns,
        },
        modes: {
            pool: subset(md.pool, MODES, b.modes.pool),
            order: oneOf(md.order, ['shuffle_bag', 'random', 'fixed'] as const, b.modes.order),
            fixedList: Array.isArray(md.fixedList)
                ? (md.fixedList.filter((x): x is Mode => (MODES as readonly string[]).includes(x)).slice(0, 15) as Mode[])
                : [...b.modes.fixedList],
            twistPicker: oneOf(md.twistPicker, ['last_place', 'vote', 'host', 'random', 'round_robin'] as const, b.modes.twistPicker),
        },
        twists: {
            allowed: Array.isArray(t.allowed)
                ? ([...new Set(t.allowed.filter((x): x is Twist => (TWISTS as readonly string[]).includes(x)))] as Twist[])
                : [...b.twists.allowed],
            perRound: oneOf(t.perRound, ['1', '2', '3', 'ramp'] as const, b.twists.perRound),
            themeLinked: t.themeLinked !== undefined ? t.themeLinked === true : b.twists.themeLinked,
        },
        respawn: {
            mode: oneOf(rs.mode, ['off', 'lives', 'unlimited'] as const, b.respawn.mode),
            lives: clamp(rs.lives, 1, 9, b.respawn.lives, true),
            delaySec: clamp(rs.delaySec, 1, 5, b.respawn.delaySec),
            shieldSec: clamp(rs.shieldSec, 0, 3, b.respawn.shieldSec),
            where: oneOf(rs.where, ['random_platform', 'center', 'top'] as const, b.respawn.where),
        },
        items: {
            enabled: it.enabled !== undefined ? it.enabled !== false : b.items.enabled,
            allowed: Array.isArray(it.allowed)
                ? ([...new Set(it.allowed.filter((x): x is Item => (ITEMS as readonly string[]).includes(x)))] as Item[])
                : [...b.items.allowed],
            spots: clamp(it.spots, 0, 5, b.items.spots, true),
            firstTouch: it.firstTouch !== undefined ? it.firstTouch !== false : b.items.firstTouch,
            keepOnKO: it.keepOnKO !== undefined ? it.keepOnKO === true : b.items.keepOnKO,
        },
        theme: {
            mode: oneOf(th.mode, ['fixed', 'rotate', 'random', 'custom'] as const, b.theme.mode),
            fixed: oneOf(th.fixed, THEMES, b.theme.fixed),
            perRound: Array.isArray(th.perRound)
                ? (th.perRound.filter((x): x is Theme => (THEMES as readonly string[]).includes(x)).slice(0, 15) as Theme[])
                : [...b.theme.perRound],
        },
    };

    return RoomSettingsSchema.parse(merged);
}
