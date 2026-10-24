import { RoomClientState } from "@/app/store";
import type { RoomSettings } from "@mutator-party/shared";


export type ConnectionStatus = "connected" | "reconnecting" | "lost" | "kicked";

export interface ConnectOptions {
  code?: string;
  create?: boolean;
  settings?: Partial<RoomSettings>;
  name: string;
  color: number;
  playerId: string;
  token?: string;
}

export interface JoinResult {
  roomCode: string;
  isHost: boolean;
  settings: Partial<RoomSettings>;
}

export interface RoomConnection {
  connect(opts: ConnectOptions): Promise<JoinResult>;
  send: {
    input(seq: number, bits: number): void;
    settingsUpdate(patch: Partial<RoomSettings>): void;
    ready(value: boolean): void;
    start(): void;
    pick(index: 0 | 1 | 2): void;
    emote(id: string): void;
    kick(playerId: string): void;
    rematch(): void;
  };
  on(evt: "state", cb: (s: RoomClientState) => void): () => void;
  on(evt: "settings", cb: (s: Partial<RoomSettings>) => void): () => void;
  on(evt: "roundStart", cb: (r: any) => void): () => void;
  on(
    evt: "event",
    cb: (e: { type: string; payload?: any }) => void,
  ): () => void;
  on(
    evt: "error",
    cb: (e: { code: string; message: string }) => void,
  ): () => void;
  on(evt: "status", cb: (s: ConnectionStatus) => void): () => void;
  ping(): number;
  leave(): void;
}
