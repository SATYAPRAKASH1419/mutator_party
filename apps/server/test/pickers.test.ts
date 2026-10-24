import { describe, it, expect } from "vitest";
import {
  ModeSelector,
  selectTheme,
  getThemeLinkedTwist,
  getTwistBudget,
  generateTwistCards,
  selectTwistPicker,
  resolveVote,
  fillRoundTwists,
  type PlayerSummary,
} from "../src/rooms/pickers.js";
import {
  THEMES,
  TWISTS,
  validateTwistExclusion,
  mulberry32,
  hashSeed,
  TWIST_MAP,
  type Theme,
  type Mode,
} from "@mutator-party/shared";

describe("ModeSelector", () => {
  it("shuffle_bag: covers all modes in the pool before repeating", () => {
    const rng = mulberry32(12345);
    const pool: Mode[] = ["brawl", "bomb", "crown"];
    const selector = new ModeSelector({
      pool,
      order: "shuffle_bag",
      fixedList: [],
      twistPicker: "last_place",
    });

    // Run 50 cycles of 3 picks each
    for (let cycle = 0; cycle < 50; cycle++) {
      const drawn = [selector.next(rng), selector.next(rng), selector.next(rng)];
      expect(new Set(drawn).size).toBe(3);
      for (const m of pool) {
        expect(drawn).toContain(m);
      }
    }
  });

  it("fixed: cycles through fixedList sequentially", () => {
    const rng = mulberry32(42);
    const fixedList: Mode[] = ["bomb", "crown", "brawl", "crown"];
    const selector = new ModeSelector({
      pool: ["brawl", "bomb"],
      order: "fixed",
      fixedList,
      twistPicker: "last_place",
    });

    expect(selector.next(rng)).toBe("bomb");
    expect(selector.next(rng)).toBe("crown");
    expect(selector.next(rng)).toBe("brawl");
    expect(selector.next(rng)).toBe("crown");
    expect(selector.next(rng)).toBe("bomb"); // wraps around
  });

  it("random: draws valid modes from the pool", () => {
    const rng = mulberry32(999);
    const pool: Mode[] = ["brawl", "crown"];
    const selector = new ModeSelector({
      pool,
      order: "random",
      fixedList: [],
      twistPicker: "last_place",
    });

    for (let i = 0; i < 20; i++) {
      expect(pool).toContain(selector.next(rng));
    }
  });
});

describe("Theme Selection", () => {
  it("fixed: always returns the fixed theme", () => {
    const rng = mulberry32(1);
    const theme = selectTheme(
      1,
      { mode: "fixed", fixed: "neon", perRound: [] },
      rng,
    );
    expect(theme).toBe("neon");
  });

  it("rotate: cycles sequentially through THEMES", () => {
    const rng = mulberry32(1);
    for (let r = 1; r <= THEMES.length * 2; r++) {
      const theme = selectTheme(
        r,
        { mode: "rotate", fixed: "sunny", perRound: [] },
        rng,
      );
      expect(theme).toBe(THEMES[(r - 1) % THEMES.length]);
    }
  });

  it("random: avoids immediate repeat when possible", () => {
    const rng = mulberry32(42);
    let prev: Theme | undefined = undefined;

    for (let i = 0; i < 100; i++) {
      const theme = selectTheme(
        i + 1,
        { mode: "random", fixed: "sunny", perRound: [] },
        rng,
        prev,
      );
      if (prev) {
        expect(theme).not.toBe(prev);
      }
      prev = theme;
    }
  });

  it("custom: uses perRound theme or falls back to rotate", () => {
    const rng = mulberry32(1);
    const customList: Theme[] = ["space", "frozen"];
    const theme1 = selectTheme(
      1,
      { mode: "custom", fixed: "sunny", perRound: customList },
      rng,
    );
    expect(theme1).toBe("space");

    const theme2 = selectTheme(
      2,
      { mode: "custom", fixed: "sunny", perRound: customList },
      rng,
    );
    expect(theme2).toBe("frozen");

    // round 3 is beyond customList, should fall back to rotate (THEMES[2])
    const theme3 = selectTheme(
      3,
      { mode: "custom", fixed: "sunny", perRound: customList },
      rng,
    );
    expect(theme3).toBe(THEMES[2]);
  });

  it("getThemeLinkedTwist returns linked twist only when allowed and enabled", () => {
    // Neon linked twist is 'dark'
    expect(getThemeLinkedTwist("neon", true)).toBe("dark");
    expect(getThemeLinkedTwist("neon", false)).toBeNull();
    // Sunny has no linked twist
    expect(getThemeLinkedTwist("sunny", true)).toBeNull();
    // If 'dark' is not in allowed twists
    expect(getThemeLinkedTwist("neon", true, ["low", "speed"])).toBeNull();
  });
});

describe("getTwistBudget", () => {
  it("returns fixed budget for 1, 2, 3", () => {
    expect(getTwistBudget("1", 1)).toBe(1);
    expect(getTwistBudget("2", 3)).toBe(2);
    expect(getTwistBudget("3", 5)).toBe(3);
  });

  it("returns ramp progression (1, 1, 2, 2, 3, 3...)", () => {
    expect(getTwistBudget("ramp", 1)).toBe(1);
    expect(getTwistBudget("ramp", 2)).toBe(1);
    expect(getTwistBudget("ramp", 3)).toBe(2);
    expect(getTwistBudget("ramp", 4)).toBe(2);
    expect(getTwistBudget("ramp", 5)).toBe(3);
    expect(getTwistBudget("ramp", 6)).toBe(3);
    expect(getTwistBudget("ramp", 10)).toBe(3);
  });
});

describe("generateTwistCards", () => {
  it("generates 3 distinct cards with distinct categories", () => {
    const rng = mulberry32(888);
    for (let i = 0; i < 50; i++) {
      const cards = generateTwistCards(rng, TWISTS);
      expect(cards.length).toBe(3);
      expect(new Set(cards).size).toBe(3);
      expect(validateTwistExclusion(cards)).toBe(true);
    }
  });

  it("respects excluded categories (e.g. from theme-linked twist)", () => {
    const rng = mulberry32(777);
    // 'dark' is category 'w' (world). Exclude 'w'.
    for (let i = 0; i < 50; i++) {
      const cards = generateTwistCards(rng, TWISTS, ["w"]);
      expect(cards.length).toBe(3);
      for (const twist of cards) {
        expect(TWIST_MAP.get(twist)!.cat).not.toBe("w");
      }
    }
  });
});

describe("selectTwistPicker", () => {
  const players: PlayerSummary[] = [
    { id: "p1", name: "Alice", score: 10, isBot: false, connected: true, host: true },
    { id: "p2", name: "Bob", score: 4, isBot: false, connected: true, host: false },
    { id: "p3", name: "Bot1", score: 2, isBot: true, connected: true, host: false },
  ];

  it("last_place: selects player with lowest score", () => {
    const rng = mulberry32(1);
    const offer = selectTwistPicker("last_place", 2, players, ["low", "ice", "tiny"], rng);
    expect(offer.pickerId).toBe("p3");
    expect(offer.isBot).toBe(true);
    expect(offer.timeoutSec).toBe(10);
  });

  it("host: selects the host player", () => {
    const rng = mulberry32(1);
    const offer = selectTwistPicker("host", 2, players, ["low", "ice", "tiny"], rng);
    expect(offer.pickerId).toBe("p1");
    expect(offer.isBot).toBe(false);
  });

  it("round_robin: selects player by join order modulo round", () => {
    const rng = mulberry32(1);
    const offerR1 = selectTwistPicker("round_robin", 1, players, ["low"], rng);
    expect(offerR1.pickerId).toBe("p1");

    const offerR2 = selectTwistPicker("round_robin", 2, players, ["low"], rng);
    expect(offerR2.pickerId).toBe("p2");

    const offerR3 = selectTwistPicker("round_robin", 3, players, ["low"], rng);
    expect(offerR3.pickerId).toBe("p3");
  });

  it("vote: sets pickerId to 'vote' and timeout to 8s", () => {
    const rng = mulberry32(1);
    const offer = selectTwistPicker("vote", 2, players, ["low", "ice", "tiny"], rng);
    expect(offer.pickerId).toBe("vote");
    expect(offer.timeoutSec).toBe(8);
  });

  it("random: sets pickerId to 'server'", () => {
    const rng = mulberry32(1);
    const offer = selectTwistPicker("random", 2, players, ["low"], rng);
    expect(offer.pickerId).toBe("server");
  });
});

describe("resolveVote", () => {
  it("returns twist with highest votes", () => {
    const rng = mulberry32(1);
    const cards = ["tiny", "giant", "ice"] as const;
    const votes = new Map<string, number>([
      ["p1", 1],
      ["p2", 1],
      ["p3", 0],
    ]);
    const winner = resolveVote(votes, cards, rng);
    expect(winner).toBe("giant");
  });

  it("breaks vote ties deterministically using RNG", () => {
    const cards = ["tiny", "giant", "ice"] as const;
    const votes = [0, 1]; // tie between 0 and 1
    const rngA = () => 0; // picks index 0 of ties
    const rngB = () => 0.99; // picks index 1 of ties

    expect(resolveVote(votes, cards, rngA)).toBe("tiny");
    expect(resolveVote(votes, cards, rngB)).toBe("giant");
  });
});

describe("fillRoundTwists (Gate: 10,000 draws category rule)", () => {
  it("never violates category exclusion across 10,000 draws", () => {
    const rng = mulberry32(hashSeed("category-test", 42));

    for (let i = 0; i < 10_000; i++) {
      const budget = (i % 3) + 1; // 1, 2, or 3
      const themeTwist = i % 4 === 0 ? "dark" : null;
      const pickedTwist = i % 2 === 0 ? "low" : null;

      const twists = fillRoundTwists(budget, pickedTwist, themeTwist, TWISTS, rng);

      expect(twists.length).toBeLessThanOrEqual(budget);
      expect(validateTwistExclusion(twists)).toBe(true);

      // Verify no duplicates
      expect(new Set(twists).size).toBe(twists.length);
    }
  });
});

