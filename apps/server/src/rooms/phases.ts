// ─── src/rooms/phases.ts ─────────────────────────────────────────────────────
// Match state machine & phase progression controller.
// Lifecycle: lobby -> [pick] -> intro -> play -> results -> [repeat] -> final
// ─────────
import type { Delayed } from "colyseus";
import {
  type Mode,
  type Theme,
  type Twist,
  type RoomSettings,
  PHASE_INTRO_SEC,
  PHASE_RESULTS_SEC,
  hashSeed,
  mulberry32,
} from "@mutator-party/shared";

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
  type TwistPickOffer,
} from "./pickers.js";

export type Phase = "lobby" | "intro" | "pick" | "play" | "results" | "final";

export interface RoundConfig {
  roundNumber: number;
  mode: Mode;
  theme: Theme;
  twists: Twist[];
  seed: number;
  pickedBy?: string;
}

export interface PhaseCallbacks {
  /** Broadcasts phase change & updates schema */
  onPhaseChange: (phase: Phase, timeLeftSec: number) => void;
  /** Invoked when a round setup is completed and ready for intro/play */
  onRoundStart: (config: RoundConfig) => void;
  /** Invoked when the twist pick phase starts */
  onPickOffer?: (offer: TwistPickOffer) => void;
  /** Invoked when round completes to calculate scores & display results */
  onRoundEnd: (roundNumber: number) => void;
  /** Invoked when all match rounds have completed */
  onMatchEnd: () => void;
}

export interface PhaseClock {
  setTimeout: (cb: () => void, ms: number) => Delayed;
}

export class PhaseController {
  private _phase: Phase = "lobby";
  private _round: number = 0;
  private maxRounds: number;
  private settings: RoomSettings;
  private roomSeed: number;
  private clock: PhaseClock;
  private callbacks: PhaseCallbacks;

  private modeSelector: ModeSelector;
  private previousTheme?: Theme;
  private activeTimer?: Delayed;

  // Twist picking state carried over between rounds
  private pendingTwist: Twist | null = null;
  private pendingPickedBy?: string;
  private currentOffer?: TwistPickOffer;
  private votes = new Map<string, number>(); // playerId -> cardIndex

  constructor(
    settings: RoomSettings,
    roomSeed: number,
    clock: PhaseClock,
    callbacks: PhaseCallbacks,
  ) {
    this.settings = settings;
    this.roomSeed = roomSeed;
    this.clock = clock;
    this.callbacks = callbacks;
    this.maxRounds = settings.match.rounds;
    this.modeSelector = new ModeSelector(settings.modes);
  }

  public get phase(): Phase {
    return this._phase;
  }

  public get round(): number {
    return this._round;
  }

  public get offer(): TwistPickOffer | undefined {
    return this.currentOffer;
  }

  /**
   * Updates settings if changed by host (e.g. between matches or in lobby).
   */
  public updateSettings(settings: RoomSettings) {
    this.settings = settings;
    this.maxRounds = settings.match.rounds;
    this.modeSelector = new ModeSelector(settings.modes);
  }

  /**
   * Cancels any active phase timer safely.
   */
  public clearTimer() {
    if (this.activeTimer) {
      this.activeTimer.clear();
      this.activeTimer = undefined;
    }
  }

  /**
   * Cleans up all pending timers and resets state.
   */
  public dispose() {
    this.clearTimer();
    this.votes.clear();
    this._phase = "lobby";
  }

  /**
   * Starts a brand new match from round 1.
   */
  public startMatch(players: readonly PlayerSummary[]) {
    this.clearTimer();
    this._round = 0;
    this.pendingTwist = null;
    this.pendingPickedBy = undefined;
    this.votes.clear();
    this.startRound(players);
  }

  /**
   * Prepares and starts the specified round.
   */
  public startRound(players: readonly PlayerSummary[]) {
    this.clearTimer();
    this._round++;

    // Deterministic seed for this round
    const roundSeed = hashSeed(this.roomSeed, this._round);
    const rng = mulberry32(roundSeed);

    // 1. Select mode & theme
    const mode = this.modeSelector.next(rng);
    const theme = selectTheme(
      this._round,
      this.settings.theme,
      rng,
      this.previousTheme,
    );
    this.previousTheme = theme;

    // 2. Resolve twists (budget + theme-linked + player pick + random fill)
    const themeTwist = getThemeLinkedTwist(
      theme,
      this.settings.twists.themeLinked,
      this.settings.twists.allowed,
    );
    const budget = getTwistBudget(this.settings.twists.perRound, this._round);
    const twists = fillRoundTwists(
      budget,
      this.pendingTwist,
      themeTwist,
      this.settings.twists.allowed,
      rng,
    );

    const pickedBy = this.pendingPickedBy;
    this.pendingTwist = null;
    this.pendingPickedBy = undefined;

    // 3. Notify room of round configuration
    this.callbacks.onRoundStart({
      roundNumber: this._round,
      mode,
      theme,
      twists,
      seed: roundSeed,
      pickedBy,
    });

    // 4. Begin intro countdown
    this.enterIntro();
  }

  private enterIntro() {
    this.clearTimer();
    this._phase = "intro";
    this.callbacks.onPhaseChange("intro", PHASE_INTRO_SEC);

    this.activeTimer = this.clock.setTimeout(() => {
      this.enterPlay();
    }, PHASE_INTRO_SEC * 1000);
  }

  private enterPlay() {
    this.clearTimer();
    this._phase = "play";
    this.callbacks.onPhaseChange("play", 0);
  }

  /**
   * Called when simulation ends or round timer runs out.
   */
  public endRound(players: readonly PlayerSummary[]) {
    this.clearTimer();
    this._phase = "results";
    this.callbacks.onRoundEnd(this._round);
    this.callbacks.onPhaseChange("results", PHASE_RESULTS_SEC);

    this.activeTimer = this.clock.setTimeout(() => {
      if (this._round >= this.maxRounds) {
        this.enterFinal();
      } else {
        this.prepareNextRound(players);
      }
    }, PHASE_RESULTS_SEC * 1000);
  }

  /**
   * Checks whether to launch the pick phase or proceed directly to next round.
   */
  private prepareNextRound(players: readonly PlayerSummary[]) {
    const nextRoundSeed = hashSeed(this.roomSeed, this._round + 1);
    const rng = mulberry32(nextRoundSeed);

    const cards = generateTwistCards(rng, this.settings.twists.allowed);
    const offer = selectTwistPicker(
      this.settings.modes.twistPicker,
      this._round + 1,
      players,
      cards,
      rng,
    );

    // Skip pick phase if picker is server/random or a bot
    if (offer.pickerId === "server" || offer.isBot) {
      if (cards.length > 0) {
        const autoIdx = Math.floor(rng() * cards.length);
        this.pendingTwist = cards[autoIdx]!;
        this.pendingPickedBy = offer.pickerId;
      }
      this.startRound(players);
      return;
    }

    // Human picker or community vote
    this.enterPick(offer, players);
  }

  private enterPick(offer: TwistPickOffer, players: readonly PlayerSummary[]) {
    this.clearTimer();
    this._phase = "pick";
    this.currentOffer = offer;
    this.votes.clear();

    this.callbacks.onPickOffer?.(offer);
    this.callbacks.onPhaseChange("pick", offer.timeoutSec);

    // Timer fallback if picker does not respond in time
    this.activeTimer = this.clock.setTimeout(() => {
      this.resolvePickTimeout(players);
    }, offer.timeoutSec * 1000);
  }

  /**
   * Processes player twist picks or votes from clients.
   */
  public handlePick(
    playerId: string,
    cardIndex: number,
    players: readonly PlayerSummary[],
  ): boolean {
    if (this._phase !== "pick" || !this.currentOffer) {
      return false;
    }

    const { cards, pickerId } = this.currentOffer;
    if (cardIndex < 0 || cardIndex >= cards.length) {
      return false;
    }

    // Community Vote mode
    if (pickerId === "vote") {
      this.votes.set(playerId, cardIndex);

      // If all connected human players have voted, resolve early
      const humanPlayers = players.filter((p) => p.connected && !p.isBot);
      if (humanPlayers.length > 0 && this.votes.size >= humanPlayers.length) {
        this.clearTimer();
        this.resolveVoteAndProceed(players);
      }
      return true;
    }

    // Single Picker mode (last_place, host, round_robin)
    if (pickerId === playerId) {
      this.clearTimer();
      this.pendingTwist = cards[cardIndex]!;
      this.pendingPickedBy = playerId;
      this.currentOffer = undefined;
      this.startRound(players);
      return true;
    }

    return false;
  }

  private resolvePickTimeout(players: readonly PlayerSummary[]) {
    if (!this.currentOffer) return;

    if (this.currentOffer.pickerId === "vote") {
      this.resolveVoteAndProceed(players);
    } else {
      // Auto-pick random card on timeout
      const rng = mulberry32(hashSeed(this.roomSeed, this._round + 100));
      const cards = this.currentOffer.cards;
      if (cards.length > 0) {
        const autoIdx = Math.floor(rng() * cards.length);
        this.pendingTwist = cards[autoIdx]!;
        this.pendingPickedBy = this.currentOffer.pickerId;
      }
      this.currentOffer = undefined;
      this.startRound(players);
    }
  }

  private resolveVoteAndProceed(players: readonly PlayerSummary[]) {
    if (!this.currentOffer) return;
    const rng = mulberry32(hashSeed(this.roomSeed, this._round + 200));
    const winner = resolveVote(this.votes, this.currentOffer.cards, rng);
    this.pendingTwist = winner;
    this.pendingPickedBy = "vote";
    this.currentOffer = undefined;
    this.votes.clear();
    this.startRound(players);
  }

  private enterFinal() {
    this.clearTimer();
    this._phase = "final";
    this.callbacks.onPhaseChange("final", 0);
    this.callbacks.onMatchEnd();
  }
}
