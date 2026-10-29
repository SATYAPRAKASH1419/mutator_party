import { loadProfile, SavedProfile, saveProfile } from "@/util/storage";
import { RoomSettings } from "@mutator-party/shared";

export type ScreenName = 'landing' | 'settings' | 'lobby' | 'game' | 'results' | 'final';

export interface CrateClientState {
  id: number;
  x?: number;
  y?: number;
  itemType: string;
  state: string;
}

export interface BombClientState {
  holderId: string | null;
  fuse: number;
  timer?: number;
}

export interface CrownClientState {
  holderId: string | null;
  x?: number;
  y?: number;
}

export interface PlayerClientState {
  id: string;
  name: string;
  color: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale?: number;
  facingRight?: boolean;
  grounded?: boolean;
  stunned?: boolean;
  frozen?: boolean;
  shielded?: boolean;
  isOut?: boolean;
  connected?: boolean;
  isBot?: boolean;
  ready?: boolean;
  host?: boolean;
  flags: number;
  score: number;
  lives: number;
  item: string | null;
  hits: number;
  ackSeq: number;
}

export interface RoomClientState {
  code: string;
  phase: string;
  round: number;
  mode: string;
  twists: string[];
  themeId: string;
  timeLeft: number;
  players: PlayerClientState[];
  crates?: CrateClientState[];
  bomb?: BombClientState;
  crown?: CrownClientState;
  crumbleTilesBitmask?: number;
  crumbleWarnBitmask?: number;
  maxRounds?: number;
  serverTime: number;
  seed: number;
}

export interface AppStoreState {
  profile: SavedProfile;
  currentScreen: ScreenName;
  roomCode: string | null;
  isHost: boolean;
  settings: Partial<RoomSettings> | null;
  gameState: RoomClientState | null;
  pingMs: number;
  error: string | null;
}

class Store {
  private state: AppStoreState;
  private listeners = new Set<(state: AppStoreState) => void>();

  constructor() {
    this.state = {
      profile: loadProfile(),
      currentScreen: 'landing',
      roomCode: null,
      isHost: false,
      settings: null,
      gameState: null,
      pingMs: 0,
      error: null,
    };
  }

  getState(): AppStoreState {
    return this.state;
  }

  subscribe(listener: (state: AppStoreState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  setState(partial: Partial<AppStoreState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  setProfile(partial: Partial<SavedProfile>): void {
    saveProfile(partial);
    this.setState({ profile: { ...this.state.profile, ...partial } });
  }

  setScreen(screen: ScreenName): void {
    this.setState({ currentScreen: screen });
  }

  setError(error: string | null): void {
    this.setState({ error });
  }
}

export const appStore = new Store();