import { describe, it, expect } from "vitest";
import {
  generateArena,
  hashSeed,
  step,
  ROUND_TIME,
  TICK_HZ,
  initBrawl,
  initBomb,
  initCrown,
  type SimState,
  type PlayerState,
  type Twist,
} from "@mutator-party/shared";

function simulateRound(
  mode: "brawl" | "bomb" | "crown",
  seed: number,
  round: number,
  twists: Twist[] = [],
  lives: number = 1,
): { durationSec: number; winnerId?: string } {
  const arena = generateArena({
    seed,
    round,
    platformCount: 4,
    islandTiles: 6,
    symmetric: false,
    players: 8,
    powerSpots: 0,
  });

  const spawns =
    arena.spawns.length >= 8
      ? arena.spawns
      : [
          { x: 300, y: 350 },
          { x: 350, y: 350 },
          { x: 400, y: 350 },
          { x: 450, y: 350 },
          { x: 500, y: 350 },
          { x: 550, y: 350 },
          { x: 600, y: 350 },
          { x: 650, y: 350 },
        ];

  const players: PlayerState[] = spawns.slice(0, 8).map((sp, i) => ({
    id: `bot_${i + 1}`,
    x: sp.x,
    y: sp.y,
    vx: 0,
    vy: 0,
    facingRight: i % 2 === 0,
    grounded: true,
    airJumpsLeft: 1,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    shoveTimer: 0,
    stunTimer: 0,
    hitsTaken: 0,
    scale: 1.0,
    isOut: false,
    isBot: true,
    score: 0,
    lives,
    botSkill: "normal",
  }));

  const roundTime = ROUND_TIME[mode];
  const state: SimState = {
    tick: 0,
    rng: { events: hashSeed(seed, round, "events") },
    players,
    island: arena.island,
    platforms: arena.platforms,
    tileStates: [],
    crates: [],
    mode,
    timeLeft: roundTime,
    nextCrateId: 1,
    powerSpots: arena.powerSpots,
    respawnConfig: {
      mode: lives > 1 ? "lives" : "off",
      lives,
      delaySec: 2,
      shieldSec: 1.8,
    },
    itemConfig: {
      allowed: ["mega", "freeze", "swap", "shield"],
      firstTouch: true,
      keepOnKO: false,
    },
    botSkill: "normal",
    events: [],
  };

  if (mode === "bomb") {
    initBomb(state, roundTime);
  } else if (mode === "crown") {
    initCrown(state, roundTime);
  } else {
    initBrawl(state, roundTime);
  }

  const dt = 1 / TICK_HZ;
  const maxTicks = Math.ceil((roundTime + 5) * TICK_HZ);

  let tick = 0;
  while (tick < maxTicks) {
    step(state, new Map(), twists, dt);
    tick++;

    if (state.endTimer !== undefined && state.endTimer <= 0) {
      break;
    }
  }

  const durationSec = Math.min(tick / TICK_HZ, roundTime);
  const alive = state.players.filter((p) => !p.isOut);
  const winnerId = alive.length === 1 ? alive[0]?.id : undefined;

  return { durationSec, winnerId };
}

describe("Balance & Round Length Simulation (Step 8.2)", () => {
  it("simulates 30 rounds of Crown Rush and meets target duration (~45s)", () => {
    let totalSec = 0;
    const roundsCount = 30;

    for (let r = 1; r <= roundsCount; r++) {
      const res = simulateRound("crown", 12345 + r * 17, r);
      totalSec += res.durationSec;
      expect(res.durationSec).toBeGreaterThan(10);
    }

    const avgSec = totalSec / roundsCount;
    // Crown rush fixed countdown is 45s
    expect(avgSec).toBeCloseTo(45, 0);
  });

  it("simulates 30 rounds of Brawl (1 Life Sudden Death) with 8 bots", () => {
    let totalSec = 0;
    const roundsCount = 30;

    for (let r = 1; r <= roundsCount; r++) {
      const res = simulateRound("brawl", 54321 + r * 31, r, [], 1);
      totalSec += res.durationSec;
      expect(res.durationSec).toBeGreaterThan(6);
    }

    const avgSec = totalSec / roundsCount;
    // Improved from demo's 11.8s to > 20s
    expect(avgSec).toBeGreaterThanOrEqual(20);
    expect(avgSec).toBeLessThanOrEqual(60);
  });

  it("simulates 30 rounds of Brawl (Standard 3-Lives Tournament) with 8 bots reaching target duration (40-60s)", () => {
    let totalSec = 0;
    const roundsCount = 30;

    for (let r = 1; r <= roundsCount; r++) {
      const res = simulateRound("brawl", 11223 + r * 19, r, [], 3);
      totalSec += res.durationSec;
      expect(res.durationSec).toBeGreaterThan(10);
    }

    const avgSec = totalSec / roundsCount;
    // Standard tournament with 3 lives reaches 40-60s
    expect(avgSec).toBeGreaterThanOrEqual(40);
    expect(avgSec).toBeLessThanOrEqual(60);
  });

  it("simulates 30 rounds of Bomb Tag with 8 bots", () => {
    let totalSec = 0;
    const roundsCount = 30;

    for (let r = 1; r <= roundsCount; r++) {
      const res = simulateRound("bomb", 98765 + r * 13, r, [], 3);
      totalSec += res.durationSec;
      expect(res.durationSec).toBeGreaterThan(10);
    }

    const avgSec = totalSec / roundsCount;
    // Target duration: average duration >= 30s up to 75s with 3-lives
    expect(avgSec).toBeGreaterThanOrEqual(30);
    expect(avgSec).toBeLessThanOrEqual(75);
  });

  it("evaluates twist pair matrix to ensure no game-breaking combinations", () => {
    const twistPairs: [Twist, Twist][] = [
      ["low", "wind"],
      ["heavy", "speed"],
      ["tiny", "bounce"],
      ["giant", "ice"],
      ["flap", "crumble"],
    ];

    for (const [t1, t2] of twistPairs) {
      const res = simulateRound("brawl", 77777, 1, [t1, t2], 2);
      expect(res.durationSec).toBeGreaterThan(10);
    }
  });
});

