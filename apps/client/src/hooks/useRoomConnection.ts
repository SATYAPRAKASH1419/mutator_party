import { useState, useEffect } from "preact/hooks";
import { appStore, type RoomClientState } from "../app/store";
import { clientLog } from "../util/logger";
import { showToast } from "../util/toast";
import { sound } from "../game/audio";
import type { RoomConnection, ConnectOptions, JoinResult } from "../net/connection";
import { ColyseusRoomConnection } from "../net/colyseusConnection";
import { MockRoomConnection } from "../net/mockServer";
import type { RoomSettings } from "@mutator-party/shared";

export interface PickOfferData {
  pickerId: string;
  cards: string[];
  isBot: boolean;
  timeoutSec: number;
}

export function useRoomConnection() {
  const [connection, setConnection] = useState<RoomConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pickOffer, setPickOffer] = useState<PickOfferData | null>(null);

  useEffect(() => {
    sound.setMuted(isMuted);
  }, [isMuted]);

  // Check URL for join link: /r/:code
  useEffect(() => {
    const match = window.location.pathname.match(/\/r\/([A-Za-z0-9]{5})/i);
    if (match && match[1]) {
      const code = match[1].toUpperCase();
      appStore.setState({ roomCode: code });
    }
  }, []);

  const handleConnect = async (opts: ConnectOptions) => {
    clientLog.action("Initiate room connection", opts);
    setIsConnecting(true);

    const urlParams = new URLSearchParams(window.location.search);
    const forceMock = urlParams.get("mock") === "1";

    let conn: RoomConnection;
    let result: JoinResult;

    try {
      if (forceMock) {
        conn = new MockRoomConnection();
        result = await conn.connect(opts);
      } else {
        try {
          const colyseus = new ColyseusRoomConnection("ws://localhost:2567");
          result = await colyseus.connect(opts);
          conn = colyseus;
        } catch (colyseusErr) {
          console.warn(
            "Backend server unreachable at ws://localhost:2567. Falling back to local Mock Server with bots:",
            colyseusErr,
          );
          conn = new MockRoomConnection();
          result = await conn.connect(opts);
        }
      }

      clientLog.net("Connected successfully to room", {
        roomCode: result.roomCode,
        isHost: result.isHost,
      });
      setConnection(conn);

      appStore.setState({
        roomCode: result.roomCode,
        isHost: result.isHost,
        settings: result.settings,
        currentScreen: "lobby",
      });

      // Update URL without reloading
      if (result.roomCode) {
        window.history.pushState(null, "", `/r/${result.roomCode}`);
      }

      conn.on("roomInfo", (info: any) => {
        clientLog.net("Received room:info", info);
        appStore.setState({
          roomCode: info.code,
          isHost: info.isHost,
          settings: info.settings || appStore.getState().settings,
        });
        if (info.code) {
          window.history.pushState(null, "", `/r/${info.code}`);
        }
      });

      conn.on("pickOffer", (offer: any) => {
        clientLog.net("Received pick:offer", offer);
        setPickOffer(offer);
      });

      conn.on("emote", (emoteData: any) => {
        clientLog.net("Received emote", emoteData);
        window.dispatchEvent(new CustomEvent("mp:emote", { detail: emoteData }));
      });

      conn.on("state", (s: RoomClientState) => {
        const prevPhase = appStore.getState().gameState?.phase;
        if (prevPhase !== s.phase) {
          clientLog.state("Phase transition", {
            from: prevPhase,
            to: s.phase,
            round: s.round,
            mode: s.mode,
          });
        }
        if (s.phase !== "pick") {
          setPickOffer(null);
        }
        appStore.setState({ gameState: s });

        if (s.phase === "lobby") {
          appStore.setScreen("lobby");
        } else if (
          s.phase === "play" ||
          s.phase === "intro" ||
          s.phase === "pick" ||
          s.phase === "results" ||
          s.phase === "final"
        ) {
          appStore.setScreen("game");
        }
      });

      conn.on("settings", (s: any) => {
        clientLog.net("Received settings broadcast", s);
        appStore.setState({ settings: s });
      });

      conn.on("error", (e: { code: string; message: string }) => {
        clientLog.error("Room error received", e);
        showToast(e.message || "Room error occurred.", "error");
      });

      conn.on("status", (status: string) => {
        if (status === "kicked") {
          showToast("You have been kicked by the host.", "warning");
          handleLeave();
        } else if (status === "lost") {
          showToast("Connection lost to server.", "error");
        }
      });
    } catch (err: any) {
      console.error("Connection failed:", err);
      showToast(err?.message || "Failed to join room.", "error");
      appStore.setScreen("landing");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoin = (code: string) => {
    clientLog.action("Join room submit", { code });
    const profile = appStore.getState().profile;
    handleConnect({
      code,
      name: profile.name || "Player",
      color: profile.color ?? 0,
      playerId: profile.playerId,
    });
  };

  const handleCreateRoom = () => {
    clientLog.action("Create room submit");
    const state = appStore.getState();
    const profile = state.profile;
    handleConnect({
      create: true,
      settings: state.settings || undefined,
      name: profile.name || "Player",
      color: profile.color ?? 0,
      playerId: profile.playerId,
    });
  };

  const handleSaveSettings = (newSettings: Partial<RoomSettings>) => {
    clientLog.action("Save room settings", newSettings);
    appStore.setState({ settings: newSettings });
    if (connection) {
      connection.send.settingsUpdate(newSettings);
    }
    appStore.setScreen("lobby");
  };

  const handleStartGame = () => {
    clientLog.action("Host clicked Start Game");
    if (connection) {
      connection.send.start();
    }
  };

  const handleToggleReady = (ready: boolean) => {
    clientLog.action("Toggle ready status", { ready });
    if (connection) {
      connection.send.ready(ready);
    }
  };

  const handleEmote = (emoji: string) => {
    clientLog.action("Send emote action", { emoji });
    if (connection) {
      connection.send.emote(emoji);
    }
  };

  const handleLeave = () => {
    clientLog.action("Leave room action");
    if (connection) {
      connection.leave();
      setConnection(null);
    }
    appStore.setState({
      roomCode: null,
      isHost: false,
      gameState: null,
      currentScreen: "landing",
    });
    window.history.pushState(null, "", "/");
  };

  const handleRematch = () => {
    clientLog.action("Host clicked Rematch");
    if (connection) {
      connection.send.rematch();
    }
  };

  const handleNextRound = () => {
    clientLog.action("Host clicked Next Round");
    if (connection) {
      connection.send.nextRound();
    }
  };

  const handleKick = (playerId: string) => {
    clientLog.action("Host kicking player", { playerId });
    if (connection) {
      connection.send.kick(playerId);
    }
  };

  return {
    connection,
    isConnecting,
    isMuted,
    setIsMuted,
    pickOffer,
    handleJoin,
    handleCreateRoom,
    handleSaveSettings,
    handleStartGame,
    handleToggleReady,
    handleEmote,
    handleLeave,
    handleRematch,
    handleNextRound,
    handleKick,
  };
}

