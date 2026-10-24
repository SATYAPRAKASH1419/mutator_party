import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PhaseController,
  type Phase,
  type RoundConfig,
} from "../src/rooms/phases.js";
import { DEFAULTS, type RoomSettings } from "@mutator-party/shared";
import type { PlayerSummary, TwistPickOffer } from "../src/rooms/pickers.js";

function createMockClock() {
  return {
    setTimeout: (cb: () => void, ms: number) => {
      const timerId = setTimeout(cb, ms);
      return {
        clear: () => clearTimeout(timerId),
      } as any;
    },
  };
}

describe("PhaseController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const testPlayers: PlayerSummary[] = [
    { id: "p1", name: "Alice", score: 10, isBot: false, connected: true, host: true },
    { id: "p2", name: "Bob", score: 4, isBot: false, connected: true, host: false },
    { id: "p3", name: "Charlie", score: 0, isBot: false, connected: true, host: false },
  ];

  it("transitions smoothly through a full 3-round match to final", () => {
    const clock = createMockClock();
    const phaseHistory: Phase[] = [];
    const startedRounds: RoundConfig[] = [];
    let matchEnded = false;

    const settings: RoomSettings = {
      ...DEFAULTS,
      match: { ...DEFAULTS.match, rounds: 3 },
      modes: { ...DEFAULTS.modes, twistPicker: "random" }, // random skips interactive pick
    };

    const controller = new PhaseController(settings, 12345, clock, {
      onPhaseChange: (p) => phaseHistory.push(p),
      onRoundStart: (cfg) => startedRounds.push(cfg),
      onRoundEnd: () => {},
      onMatchEnd: () => {
        matchEnded = true;
      },
    });

    expect(controller.phase).toBe("lobby");

    // 1. Start Match (Round 1)
    controller.startMatch(testPlayers);
    expect(controller.phase).toBe("intro");
    expect(controller.round).toBe(1);

    // 4s Intro timer expires -> enters play
    vi.advanceTimersByTime(4000);
    expect(controller.phase).toBe("play");

    // Round 1 ends -> enters results (6s)
    controller.endRound(testPlayers);
    expect(controller.phase).toBe("results");

    // 6s Results timer expires -> starts Round 2 (intro)
    vi.advanceTimersByTime(6000);
    expect(controller.phase).toBe("intro");
    expect(controller.round).toBe(2);

    // Round 2 intro -> play -> results
    vi.advanceTimersByTime(4000);
    expect(controller.phase).toBe("play");
    controller.endRound(testPlayers);
    expect(controller.phase).toBe("results");

    // 6s Results timer expires -> starts Round 3 (intro)
    vi.advanceTimersByTime(6000);
    expect(controller.phase).toBe("intro");
    expect(controller.round).toBe(3);

    // Round 3 intro -> play -> results
    vi.advanceTimersByTime(4000);
    expect(controller.phase).toBe("play");
    controller.endRound(testPlayers);
    expect(controller.phase).toBe("results");

    // 6s Results timer expires -> max rounds reached -> enters final!
    vi.advanceTimersByTime(6000);
    expect(controller.phase).toBe("final");
    expect(matchEnded).toBe(true);
    expect(startedRounds.length).toBe(3);
  });

  it("handles last_place twist picking where lowest scorer chooses next twist", () => {
    const clock = createMockClock();
    let currentOffer: TwistPickOffer | undefined;
    const startedRounds: RoundConfig[] = [];

    const settings: RoomSettings = {
      ...DEFAULTS,
      match: { ...DEFAULTS.match, rounds: 2 },
      modes: { ...DEFAULTS.modes, twistPicker: "last_place" },
    };

    const controller = new PhaseController(settings, 9999, clock, {
      onPhaseChange: () => {},
      onRoundStart: (cfg) => startedRounds.push(cfg),
      onRoundEnd: () => {},
      onMatchEnd: () => {},
      onPickOffer: (offer) => {
        currentOffer = offer;
      },
    });

    controller.startMatch(testPlayers);
    vi.advanceTimersByTime(4000); // intro -> play
    expect(controller.phase).toBe("play");

    // End round 1 -> results (6s)
    controller.endRound(testPlayers);
    expect(controller.phase).toBe("results");

    vi.advanceTimersByTime(6000); // results expires -> pick phase
    expect(controller.phase).toBe("pick");
    expect(currentOffer).toBeDefined();
    // Charlie (p3) has score 0 (lowest)
    expect(currentOffer!.pickerId).toBe("p3");
    expect(currentOffer!.cards.length).toBe(3);

    // Another player cannot pick
    const nonPickerResult = controller.handlePick("p1", 0, testPlayers);
    expect(nonPickerResult).toBe(false);
    expect(controller.phase).toBe("pick");

    // Chosen picker selects card 1
    const chosenCard = currentOffer!.cards[1]!;
    const pickerResult = controller.handlePick("p3", 1, testPlayers);
    expect(pickerResult).toBe(true);

    // Should immediately enter Round 2 intro
    expect(controller.phase).toBe("intro");
    expect(controller.round).toBe(2);

    // Verify chosen card is active in Round 2 twists
    const round2Config = startedRounds[1]!;
    expect(round2Config.twists).toContain(chosenCard);
    expect(round2Config.pickedBy).toBe("p3");
  });

  it("auto-picks when a single picker times out", () => {
    const clock = createMockClock();
    let currentOffer: TwistPickOffer | undefined;
    const startedRounds: RoundConfig[] = [];

    const settings: RoomSettings = {
      ...DEFAULTS,
      match: { ...DEFAULTS.match, rounds: 2 },
      modes: { ...DEFAULTS.modes, twistPicker: "last_place" },
    };

    const controller = new PhaseController(settings, 42, clock, {
      onPhaseChange: () => {},
      onRoundStart: (cfg) => startedRounds.push(cfg),
      onRoundEnd: () => {},
      onMatchEnd: () => {},
      onPickOffer: (offer) => {
        currentOffer = offer;
      },
    });

    controller.startMatch(testPlayers);
    vi.advanceTimersByTime(4000); // play
    controller.endRound(testPlayers);
    vi.advanceTimersByTime(6000); // results -> pick

    expect(controller.phase).toBe("pick");
    expect(currentOffer).toBeDefined();

    // Picker does not respond, 10s timeout fires
    vi.advanceTimersByTime(10000);

    // Automatically picks and advances to Round 2
    expect(controller.phase).toBe("intro");
    expect(controller.round).toBe(2);
    expect(startedRounds.length).toBe(2);
    expect(startedRounds[1]!.twists.length).toBeGreaterThanOrEqual(1);
  });

  it("handles community vote twist picking with early resolution", () => {
    const clock = createMockClock();
    let currentOffer: TwistPickOffer | undefined;
    const startedRounds: RoundConfig[] = [];

    const settings: RoomSettings = {
      ...DEFAULTS,
      match: { ...DEFAULTS.match, rounds: 2 },
      modes: { ...DEFAULTS.modes, twistPicker: "vote" },
    };

    const controller = new PhaseController(settings, 777, clock, {
      onPhaseChange: () => {},
      onRoundStart: (cfg) => startedRounds.push(cfg),
      onRoundEnd: () => {},
      onMatchEnd: () => {},
      onPickOffer: (offer) => {
        currentOffer = offer;
      },
    });

    controller.startMatch(testPlayers);
    vi.advanceTimersByTime(4000);
    controller.endRound(testPlayers);
    vi.advanceTimersByTime(6000);

    expect(controller.phase).toBe("pick");
    expect(currentOffer!.pickerId).toBe("vote");
    expect(currentOffer!.timeoutSec).toBe(8);

    // p1 votes for card 0
    controller.handlePick("p1", 0, testPlayers);
    expect(controller.phase).toBe("pick");

    // p2 votes for card 2
    controller.handlePick("p2", 2, testPlayers);
    expect(controller.phase).toBe("pick");

    // p3 votes for card 2 (card 2 now has 2 votes vs card 0 with 1 vote)
    // All 3 connected humans have voted -> early resolution!
    controller.handlePick("p3", 2, testPlayers);

    expect(controller.phase).toBe("intro");
    expect(controller.round).toBe(2);
    expect(startedRounds[1]!.twists).toContain(currentOffer!.cards[2]);
    expect(startedRounds[1]!.pickedBy).toBe("vote");
  });

  it("skips pick phase entirely if chosen picker is a bot", () => {
    const clock = createMockClock();
    let pickOfferCalled = false;

    const botPlayers: PlayerSummary[] = [
      { id: "p1", name: "Alice", score: 10, isBot: false, connected: true, host: true },
      { id: "bot1", name: "Bot", score: 0, isBot: true, connected: true, host: false },
    ];

    const settings: RoomSettings = {
      ...DEFAULTS,
      match: { ...DEFAULTS.match, rounds: 2 },
      modes: { ...DEFAULTS.modes, twistPicker: "last_place" },
    };

    const controller = new PhaseController(settings, 555, clock, {
      onPhaseChange: () => {},
      onRoundStart: () => {},
      onRoundEnd: () => {},
      onMatchEnd: () => {},
      onPickOffer: () => {
        pickOfferCalled = true;
      },
    });

    controller.startMatch(botPlayers);
    vi.advanceTimersByTime(4000);
    controller.endRound(botPlayers);
    vi.advanceTimersByTime(6000);

    // Bot was in last place, so pick phase is bypassed straight to round 2 intro!
    expect(pickOfferCalled).toBe(false);
    expect(controller.phase).toBe("intro");
    expect(controller.round).toBe(2);
  });

  it("dispose() cancels timers and resets to lobby", () => {
    const clock = createMockClock();
    const controller = new PhaseController(DEFAULTS, 1, clock, {
      onPhaseChange: () => {},
      onRoundStart: () => {},
      onRoundEnd: () => {},
      onMatchEnd: () => {},
    });

    controller.startMatch(testPlayers);
    expect(controller.phase).toBe("intro");

    controller.dispose();
    expect(controller.phase).toBe("lobby");

    // Timers should not trigger any callback
    vi.advanceTimersByTime(100000);
    expect(controller.phase).toBe("lobby");
  });
});

