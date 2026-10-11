// ─── themes.ts ────────────────────────────────────────────────────────────────
// Visual theme definitions and color palettes for the 7 arena themes.
// Reference: mutator-party-spec section 7.2 & 7.3.
// ─────────────────────────────────────────────────────────────────────────────

import { type Theme, type Twist } from './constants.js';

export interface ThemeColors {
    fill: string;
    edge: string;
}

export interface ThemeDefinition {
    id: Theme;
    name: string;
    sky: [string, string]; // [top, bottom] gradient
    orb: string;           // Sun or moon color
    stars?: boolean;       // Display star particles (space / neon / night)
    floor: ThemeColors;    // Island floor [fill, edge]
    platform: ThemeColors; // Floating platform [fill, edge]
    ink: string;           // Consistent outline color (#1B1B3A)
    linkedTwist: Twist | null; // Twist activated if themeLinked is enabled
}

// ─── The Seven Theme Definitions ─────────────────────────────────────────────

export const THEMES_DATA: Record<Theme, ThemeDefinition> = {
    sunny: {
        id: 'sunny',
        name: 'Sunny Island',
        sky: ['#8EDBFF', '#FFF0C9'],
        orb: '#FFD25A',
        floor: { fill: '#F2A65A', edge: '#C97A2C' },
        platform: { fill: '#9FF0CE', edge: '#5DC9A0' },
        ink: '#1B1B3A',
        linkedTwist: null,
    },
    neon: {
        id: 'neon',
        name: 'Neon Night',
        sky: ['#1A1040', '#4B1F7A'],
        orb: '#F5F0FF',
        stars: true,
        floor: { fill: '#FF3D9A', edge: '#B0206B' },
        platform: { fill: '#22E3FF', edge: '#0B9BB5' },
        ink: '#1B1B3A',
        linkedTwist: 'dark', // Lights Out
    },
    candy: {
        id: 'candy',
        name: 'Candy Land',
        sky: ['#FFD6EC', '#FFF4D6'],
        orb: '#FFE066',
        floor: { fill: '#FF8FB8', edge: '#D9578A' },
        platform: { fill: '#B8F0FF', edge: '#7CCBE0' },
        ink: '#1B1B3A',
        linkedTwist: 'bounce', // Trampoline
    },
    frozen: {
        id: 'frozen',
        name: 'Frozen Peak',
        sky: ['#CFEFFF', '#F4FBFF'],
        orb: '#FFFFFF',
        floor: { fill: '#DFF6FF', edge: '#8FD0EA' },
        platform: { fill: '#FFFFFF', edge: '#B7DDEE' },
        ink: '#1B1B3A',
        linkedTwist: 'ice', // Ice Rink
    },
    desert: {
        id: 'desert',
        name: 'Desert Dunes',
        sky: ['#FFB86B', '#FFE7B8'],
        orb: '#FF6B3D',
        floor: { fill: '#E2A55A', edge: '#B97A2E' },
        platform: { fill: '#F4D08C', edge: '#C9A04F' },
        ink: '#1B1B3A',
        linkedTwist: 'wind', // Gale Force
    },
    space: {
        id: 'space',
        name: 'Space Station',
        sky: ['#0B1030', '#1F2A66'],
        orb: '#D7DEFF',
        stars: true,
        floor: { fill: '#8FA3FF', edge: '#4D5FD1' },
        platform: { fill: '#D7DEFF', edge: '#8A97E6' },
        ink: '#1B1B3A',
        linkedTwist: 'low', // Moon Gravity
    },
    diwali: {
        id: 'diwali',
        name: 'Diwali Lights',
        sky: ['#240B36', '#7A1F5C'],
        orb: '#FFB703',
        stars: true,
        floor: { fill: '#FFB703', edge: '#C47F00' },
        platform: { fill: '#FB5607', edge: '#B13A00' },
        ink: '#1B1B3A',
        linkedTwist: null,
    },
};

/** Get theme definition by ID, safely defaulting to 'sunny'. */
export function getTheme(id: string): ThemeDefinition {
    return THEMES_DATA[id as Theme] ?? THEMES_DATA.sunny;
}
