import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import "./styles/base.css";
import { initAutoFullscreenOnMobile } from "./util/fullscreen";
import { PortraitRotateSplash } from "./ui/PortraitRotateSplash";
import { TapToContinueOverlay } from "./ui/TapToContinueOverlay";
import { appStore, type AppStoreState, type RoomClientState } from "./app/store";
import { GameCanvas } from "./game/GameCanvas";
import { Landing } from "./ui/Landing";
import { Settings } from "./ui/Settings";
import { Lobby } from "./ui/Lobby";
import { Hud } from "./ui/Hud";
import { ResultsOverlay } from "./ui/ResultsOverlay";
import { PickOverlay } from "./ui/PickOverlay";
import type { RoomConnection, ConnectOptions, JoinResult } from "./net/connection";
import { ColyseusRoomConnection } from "./net/colyseusConnection";
import { MockRoomConnection } from "./net/mockServer";
import type { RoomSettings } from "@mutator-party/shared";
import { Toast } from "./ui/components/Toast";
import { showToast } from "./util/toast";
import { IconSpinner } from "./ui/components/Icons";

function App() {
  const [storeState, setStoreState] = useState<AppStoreState>(appStore.getState());
  const [connection, setConnection] = useState<RoomConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    return appStore.subscribe(setStoreState);
  }, []);

  // Auto-enable fullscreen on first mobile tap/interaction
  useEffect(() => {
    return initAutoFullscreenOnMobile();
  }, []);

  // Check URL for join link: /r/:code
  useEffect(() => {
    const match = window.location.pathname.match(/\/r\/([A-Za-z0-9]{5})/i);
    if (match && match[1]) {
      const code = match[1].toUpperCase();
      appStore.setState({ roomCode: code });
    }
  }, []);

  const handleConnect = async (opts: ConnectOptions) => {
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

      conn.on("state", (s: RoomClientState) => {
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
        appStore.setState({ settings: s });
      });

      conn.on("error", (e: { code: string; message: string }) => {
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
    const profile = appStore.getState().profile;
    handleConnect({
      code,
      name: profile.name || "Player",
      color: profile.color ?? 0,
      playerId: profile.playerId,
    });
  };

  const handleCreateRoom = () => {
    const profile = appStore.getState().profile;
    handleConnect({
      create: true,
      settings: settings || undefined,
      name: profile.name || "Player",
      color: profile.color ?? 0,
      playerId: profile.playerId,
    });
  };

  const handleSaveSettings = (newSettings: Partial<RoomSettings>) => {
    appStore.setState({ settings: newSettings });
    if (connection) {
      connection.send.settingsUpdate(newSettings);
    }
    appStore.setScreen("lobby");
  };

  const handleStartGame = () => {
    if (connection) {
      connection.send.start();
    }
  };

  const handleToggleReady = (ready: boolean) => {
    if (connection) {
      connection.send.ready(ready);
    }
  };

  const handleEmote = (emoji: string) => {
    if (connection) {
      connection.send.emote(emoji);
    }
  };

  const handleLeave = () => {
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
    if (connection) {
      connection.send.rematch();
    }
  };

  const { currentScreen, roomCode, isHost, settings, gameState, profile } = storeState;
  const isPick = gameState?.phase === "pick";
  const isResults = gameState?.phase === "results";
  const isFinal = gameState?.phase === "final";

  // Check if local player is in last place (or picker)
  const sortedPlayers = [...(gameState?.players || [])].sort((a, b) => b.score - a.score);
  const lastPlayer = sortedPlayers[sortedPlayers.length - 1];
  const isLocalPicker = lastPlayer?.id === profile.playerId || isHost;

  return (
    <>
      {/* ── Portrait Orientation Splash for Mobile / Small Screens ───────── */}
      <PortraitRotateSplash />

      {/* ── Tap to Continue for Mobile Landscape Fullscreen ──────────────── */}
      <TapToContinueOverlay />

      {isConnecting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(27,27,58,0.7)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFF8E7",
            fontFamily: "var(--font-display)",
            fontSize: "24px",
            gap: "12px",
          }}
        >
          <IconSpinner size={42} />
          <span>Connecting to Room...</span>
        </div>
      )}

      {/* Global Toast Notifications (Auto-dismiss in 3s) */}
      <Toast />

      {/* ── Screen: Landing ────────────────────────────────────────────────── */}
      {currentScreen === "landing" && (
        <div className="screen-container">
          <Landing onJoin={handleJoin} onCreate={handleCreateRoom} />
        </div>
      )}

      {/* ── Screen: Settings (Host only) ────────────────────────────────────── */}
      {(currentScreen === "settings" || currentScreen === "create_room") && isHost && (
        <Settings
          initialSettings={settings || undefined}
          onSave={handleSaveSettings}
          onCancel={() => appStore.setScreen("lobby")}
        />
      )}

      {/* ── Screen: Lobby ──────────────────────────────────────────────────── */}
      {currentScreen === "lobby" && (
        <Lobby
          roomCode={roomCode || "MATCH"}
          isHost={isHost}
          players={gameState?.players || []}
          settings={settings}
          onStart={handleStartGame}
          onToggleReady={handleToggleReady}
          onEmote={handleEmote}
          onLeave={handleLeave}
          onEditRules={() => {
            if (isHost) {
              appStore.setScreen("settings");
            }
          }}
        />
      )}

      {/* ── Screen: In-Game Canvas & Overlays ────────────────────────────────── */}
      {currentScreen === "game" && connection && (
        <>
          <div id="stage">
            <GameCanvas
              connection={connection}
              localPlayerId={profile.playerId}
              settings={settings}
            />

            {gameState && (
              <Hud
                gameState={gameState}
                localPlayerId={profile.playerId}
                isMuted={isMuted}
                onMuteToggle={() => setIsMuted(!isMuted)}
              />
            )}

            {/* Pick Twist Overlay */}
            {isPick && (
              <PickOverlay
                isPicker={isLocalPicker}
                pickerName={lastPlayer?.name || "Last place"}
                onPick={(idx) => connection.send.pick(idx)}
              />
            )}

            {/* Results / Final Overlay */}
            {(isResults || isFinal) && (
              <ResultsOverlay
                isFinal={isFinal}
                round={gameState?.round || 1}
                mode={gameState?.mode}
                players={gameState?.players || []}
                localPlayerId={profile.playerId}
                isHost={isHost}
                onNextRound={handleStartGame}
                onRematch={handleRematch}
                onLeave={handleLeave}
              />
            )}

            {/* Touch controls overlay */}
            <div id="touch">
              <div class="pad">
                <button data-k="left" aria-label="Move left">
                  &#9664;
                </button>
                <button data-k="right" aria-label="Move right">
                  &#9654;
                </button>
              </div>
              <div class="pad">
                <button data-k="shove">SHOVE</button>
                <button data-k="jump">JUMP</button>
              </div>
            </div>
          </div>

          <div id="hint">
            Every round = a game mode + rule twists. Last place picks the next twist.
          </div>
        </>
      )}
    </>
  );
}

const root = document.getElementById("app");
if (root) {
  render(<App />, root);
}
