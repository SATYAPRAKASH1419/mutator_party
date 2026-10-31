import { useState, useEffect } from "preact/hooks";
import { initAutoFullscreenOnMobile, preventTouchSelectionOnHold } from "./util/fullscreen";
import { PortraitRotateSplash } from "./ui/PortraitRotateSplash";
import { TapToContinueOverlay } from "./ui/TapToContinueOverlay";
import { appStore, type AppStoreState } from "./app/store";
import { GameCanvas } from "./game/GameCanvas";
import { Landing } from "./ui/Landing";
import { Settings } from "./ui/Settings";
import { Lobby } from "./ui/Lobby";
import { Hud } from "./ui/Hud";
import { ResultsOverlay } from "./ui/ResultsOverlay";
import { PickOverlay } from "./ui/PickOverlay";
import { Toast } from "./ui/components/Toast";
import { ConnectingOverlay } from "./ui/components/ConnectingOverlay";
import { TouchControls } from "./ui/components/TouchControls";
import { clientLog } from "./util/logger";
import { useRoomConnection } from "./hooks/useRoomConnection";

export function App() {
  const [storeState, setStoreState] = useState<AppStoreState>(appStore.getState());

  useEffect(() => {
    return appStore.subscribe(setStoreState);
  }, []);

  // Auto-enable fullscreen on first mobile tap/interaction
  useEffect(() => {
    return initAutoFullscreenOnMobile();
  }, []);

  // Prevent blue selection boxes and context menus on touch hold for small devices
  useEffect(() => {
    return preventTouchSelectionOnHold();
  }, []);

  const {
    connection,
    isConnecting,
    isRestoringRoom,
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
  } = useRoomConnection();

  const { currentScreen, roomCode, isHost, settings, gameState, profile } = storeState;
  const isPick = gameState?.phase === "pick";
  const isResults = gameState?.phase === "results";
  const isFinal = gameState?.phase === "final";

  // Check if local player is in last place (or picker)
  const sortedPlayers = [...(gameState?.players || [])].sort((a, b) => b.score - a.score);
  const lastPlayer = sortedPlayers[sortedPlayers.length - 1];
  const isVote = pickOffer?.pickerId === "vote";
  const isLocalPicker =
    isVote ||
    (pickOffer
      ? pickOffer.pickerId === profile.playerId
      : lastPlayer?.id === profile.playerId || isHost);
  const pickerPlayer = gameState?.players?.find((p) => p.id === pickOffer?.pickerId);
  const pickerName = isVote
    ? "Everyone (Vote)"
    : pickerPlayer?.name || lastPlayer?.name || "Last place";

  return (
    <>
      {/* ── Portrait Orientation Splash for Mobile / Small Screens ───────── */}
      <PortraitRotateSplash />

      {/* ── Tap to Continue for Mobile Landscape Fullscreen ──────────────── */}
      <TapToContinueOverlay />

      {/* Connecting overlay modal spinner */}
      {isConnecting && <ConnectingOverlay />}

      {/* Global Toast Notifications (Auto-dismiss in 3s) */}
      <Toast />

      {/* ── Screen: Landing ────────────────────────────────────────────────── */}
      {currentScreen === "landing" && (!isRestoringRoom || !isConnecting) && (
        <div className="screen-container">
          <Landing onJoin={handleJoin} onCreate={handleCreateRoom} />
        </div>
      )}

      {/* ── Screen: Settings ──────────────────────────────────────────────── */}
      {currentScreen === "settings" && (
        <Settings
          initialSettings={settings || undefined}
          isHost={isHost}
          isLocked={gameState?.phase !== "lobby"}
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
          onKick={handleKick}
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
                onMuteToggle={() => {
                  clientLog.action("Toggle audio mute", { muted: !isMuted });
                  setIsMuted(!isMuted);
                }}
              />
            )}

            {/* Pick Twist Overlay */}
            {isPick && (
              <PickOverlay
                isPicker={isLocalPicker}
                pickerName={pickerName}
                cards={pickOffer?.cards}
                timeoutSec={pickOffer?.timeoutSec}
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
                onNextRound={handleNextRound}
                onRematch={handleRematch}
                onLeave={handleLeave}
              />
            )}

            {/* Touch controls overlay */}
            <TouchControls />
          </div>

          <div id="hint">
            Every round = a game mode + rule twists. Last place picks the next twist.
          </div>
        </>
      )}
    </>
  );
}
