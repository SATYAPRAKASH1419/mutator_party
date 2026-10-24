// ─── src/rooms/pickers.ts ─────────────────────────────────────────────────────
// Mode, theme, and twist selection strategies for match flow.
// Implements shuffle bag, theme rotation/randomization, twist pickers (last_place,
// vote, host, random, round_robin), and category exclusion enforcement.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type Mode,
  type Theme,
  type Twist,
  THEMES,
  TWISTS,
  THEMES_DATA,
  TWIST_CATALOG,
  TWIST_MAP,
  type TwistCategory,
  type RoomSettings,
  RAMP_TWIST_COUNT,
  pickMutators,
} from "@mutator-party/shared";

// ─── 1. Mode Selector ─────────────────────────────────────────────────────────

export class ModeSelector {
  private pool: Mode[];
  private order: "shuffle_bag" | "random" | "fixed";
  private fixedList: Mode[];
  private bag: Mode[] = [];
  private fixedIndex: number = 0;

  constructor(settings: RoomSettings["modes"]) {
    this.pool = settings.pool.length > 0 ? [...settings.pool] : ["brawl"];
    this.order = settings.order;
    this.fixedList =
      settings.fixedList.length > 0 ? [...settings.fixedList] : [...this.pool];
  }

  public next(rng: () => number): Mode {
    if (this.order === "fixed") {
      const mode = this.fixedList[this.fixedIndex % this.fixedList.length]!;
      this.fixedIndex++;
      return mode;
    }

    if (this.order === "random") {
      const idx = Math.floor(rng() * this.pool.length);
      return this.pool[idx]!;
    }

    // shuffle_bag: refill when empty, guarantees all modes are played before repeat
    if (this.bag.length === 0) {
      this.refillBag(rng);
    }
    return this.bag.pop()!;
  }

  private refillBag(rng: () => number) {
    this.bag = [...this.pool];
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = this.bag[i]!;
      this.bag[i] = this.bag[j]!;
      this.bag[j] = temp;
    }
  }
}

// ─── 2. Theme Selector ────────────────────────────────────────────────────────

export function selectTheme(
  roundNumber: number, // 1-based
  themeSettings: RoomSettings["theme"],
  rng: () => number,
  previousTheme?: Theme,
): Theme {
  switch (themeSettings.mode) {
    case "fixed":
      return themeSettings.fixed;

    case "rotate":
      return THEMES[(roundNumber - 1) % THEMES.length]!;

    case "random": {
      // Avoid immediate repeat if more than 1 theme available
      const pool =
        THEMES.length > 1 && previousTheme
          ? THEMES.filter((t) => t !== previousTheme)
          : THEMES;
      const idx = Math.floor(rng() * pool.length);
      return pool[idx]!;
    }

    case "custom": {
      const customTheme = themeSettings.perRound[roundNumber - 1];
      if (customTheme && (THEMES as readonly string[]).includes(customTheme)) {
        return customTheme;
      }
      return THEMES[(roundNumber - 1) % THEMES.length]!;
    }
  }
}

export function getThemeLinkedTwist(
  theme: Theme,
  themeLinked: boolean,
  allowedTwists?: readonly Twist[],
): Twist | null {
  if (!themeLinked) return null;
  const linked = THEMES_DATA[theme]?.linkedTwist ?? null;
  if (!linked) return null;
  if (allowedTwists && allowedTwists.length > 0 && !allowedTwists.includes(linked)) {
    return null;
  }
  return linked;
}

// ─── 3. Twist Budget ──────────────────────────────────────────────────────────

export function getTwistBudget(
  perRoundSetting: "1" | "2" | "3" | "ramp",
  roundNumber: number, // 1-based
): number {
  if (perRoundSetting === "1") return 1;
  if (perRoundSetting === "2") return 2;
  if (perRoundSetting === "3") return 3;

  // ramp: 1, 1, 2, 2, 3 (rounds 1..5, then 3)
  const idx = Math.max(0, roundNumber - 1);
  return RAMP_TWIST_COUNT[idx] ?? 3;
}

// ─── 4. Twist Card Generation ────────────────────────────────────────────────

export function generateTwistCards(
  rng: () => number,
  allowedTwists: readonly Twist[],
  excludedCategories: readonly TwistCategory[] = [],
  cardCount: number = 3,
): Twist[] {
  const excludedCatSet = new Set<TwistCategory>(excludedCategories);
  const allowedSet = new Set<Twist>(allowedTwists.length > 0 ? allowedTwists : TWISTS);

  const candidates = TWIST_CATALOG.filter(
    (t) => allowedSet.has(t.id) && !excludedCatSet.has(t.cat),
  );

  const categories = new Map<TwistCategory, typeof candidates>();
  for (const item of candidates) {
    const list = categories.get(item.cat) ?? [];
    list.push(item);
    categories.set(item.cat, list);
  }

  const categoryKeys = Array.from(categories.keys());
  for (let i = categoryKeys.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = categoryKeys[i]!;
    categoryKeys[i] = categoryKeys[j]!;
    categoryKeys[j] = tmp;
  }

  const cards: Twist[] = [];
  for (const cat of categoryKeys) {
    if (cards.length >= cardCount) break;
    const catItems = categories.get(cat)!;
    const item = catItems[Math.floor(rng() * catItems.length)]!;
    cards.push(item.id);
  }

  // Fallback: if fewer than cardCount categories available, fill from remaining candidate twists
  if (cards.length < cardCount) {
    const cardSet = new Set(cards);
    const remaining = candidates.filter((c) => !cardSet.has(c.id));
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = remaining[i]!;
      remaining[i] = remaining[j]!;
      remaining[j] = tmp;
    }
    for (const rem of remaining) {
      if (cards.length >= cardCount) break;
      cards.push(rem.id);
    }
  }

  return cards;
}

// ─── 5. Twist Picker Selection ───────────────────────────────────────────────

export interface PlayerSummary {
  id: string;
  name: string;
  score: number;
  isBot: boolean;
  connected: boolean;
  host: boolean;
}

export interface TwistPickOffer {
  pickerId: string | "vote" | "server";
  cards: Twist[];
  isBot: boolean;
  timeoutSec: number;
}

export function selectTwistPicker(
  twistPickerSetting: "last_place" | "vote" | "host" | "random" | "round_robin",
  roundNumber: number, // 1-based
  players: readonly PlayerSummary[],
  cards: Twist[],
  rng: () => number,
): TwistPickOffer {
  const timeoutSec = twistPickerSetting === "vote" ? 8 : 10;

  if (twistPickerSetting === "random") {
    return {
      pickerId: "server",
      cards,
      isBot: false,
      timeoutSec,
    };
  }

  if (twistPickerSetting === "vote") {
    return {
      pickerId: "vote",
      cards,
      isBot: false,
      timeoutSec,
    };
  }

  if (twistPickerSetting === "host") {
    const host =
      players.find((p) => p.host && p.connected && !p.isBot) ??
      players.find((p) => p.host) ??
      players[0];
    return {
      pickerId: host ? host.id : "server",
      cards,
      isBot: host ? host.isBot || !host.connected : false,
      timeoutSec,
    };
  }

  if (twistPickerSetting === "round_robin") {
    if (players.length === 0) {
      return { pickerId: "server", cards, isBot: false, timeoutSec };
    }
    const idx = (roundNumber - 1) % players.length;
    const player = players[idx]!;
    return {
      pickerId: player.id,
      cards,
      isBot: player.isBot || !player.connected,
      timeoutSec,
    };
  }

  // Default: 'last_place' — lowest total score, tied players broken with seeded random
  if (players.length === 0) {
    return { pickerId: "server", cards, isBot: false, timeoutSec };
  }

  const candidatePool = players.filter((p) => p.connected);
  const pool = candidatePool.length > 0 ? candidatePool : players;

  const minScore = Math.min(...pool.map((p) => p.score));
  const lowestPlayers = pool.filter((p) => p.score === minScore);

  const chosenPlayer = lowestPlayers[Math.floor(rng() * lowestPlayers.length)]!;
  return {
    pickerId: chosenPlayer.id,
    cards,
    isBot: chosenPlayer.isBot || !chosenPlayer.connected,
    timeoutSec,
  };
}

// ─── 6. Vote Resolution ───────────────────────────────────────────────────────

export function resolveVote(
  votes: Map<string, number> | readonly number[],
  cards: readonly Twist[],
  rng: () => number,
): Twist {
  if (cards.length === 0) return "low";
  if (cards.length === 1) return cards[0]!;

  const counts = new Array(cards.length).fill(0);

  if (votes instanceof Map) {
    for (const cardIndex of votes.values()) {
      if (cardIndex >= 0 && cardIndex < cards.length) {
        counts[cardIndex]++;
      }
    }
  } else {
    for (const cardIndex of votes) {
      if (cardIndex >= 0 && cardIndex < cards.length) {
        counts[cardIndex]++;
      }
    }
  }

  const maxVotes = Math.max(...counts);
  const topIndices: number[] = [];
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] === maxVotes) {
      topIndices.push(i);
    }
  }

  const winnerIndex = topIndices[Math.floor(rng() * topIndices.length)]!;
  return cards[winnerIndex]!;
}

// ─── 7. Fill Round Twists ────────────────────────────────────────────────────

export function fillRoundTwists(
  budget: number,
  pickedTwist: Twist | null,
  themeTwist: Twist | null,
  allowedTwists: readonly Twist[],
  rng: () => number,
): Twist[] {
  const chosen: Twist[] = [];
  const chosenCats = new Set<TwistCategory>();

  // 1. Theme-linked twist (if any)
  if (themeTwist) {
    const def = TWIST_MAP.get(themeTwist);
    if (def) {
      chosen.push(themeTwist);
      chosenCats.add(def.cat);
    }
  }

  // 2. Player-picked twist (if any and compatible with category rule)
  if (pickedTwist && !chosen.includes(pickedTwist)) {
    const def = TWIST_MAP.get(pickedTwist);
    if (def && !chosenCats.has(def.cat)) {
      chosen.push(pickedTwist);
      chosenCats.add(def.cat);
    }
  }

  // 3. Fill remaining slots up to budget using pickMutators adhering to category rule
  if (chosen.length < budget) {
    const remainingCount = budget - chosen.length;
    const allowed = allowedTwists.length > 0 ? allowedTwists : TWISTS;
    const availablePool = allowed.filter((id) => {
      const def = TWIST_MAP.get(id);
      return def && !chosenCats.has(def.cat) && !chosen.includes(id);
    });

    const additional = pickMutators(remainingCount, null, rng, availablePool);
    for (const twist of additional) {
      const def = TWIST_MAP.get(twist);
      if (def && !chosenCats.has(def.cat)) {
        chosen.push(twist);
        chosenCats.add(def.cat);
      }
    }
  }

  return chosen.slice(0, budget);
}

