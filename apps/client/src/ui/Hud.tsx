import type { RoomClientState } from "../app/store";
import { RoundModeBadge } from "./hud/RoundModeBadge";
import { TimerTwistBar } from "./hud/TimerTwistBar";
import { PlayerScoreList } from "./hud/PlayerScoreList";
import { AudioMuteButton } from "./hud/AudioMuteButton";

interface HudProps {
  gameState: RoomClientState;
  localPlayerId: string;
  onMuteToggle?: () => void;
  isMuted?: boolean;
}

export function Hud({
  gameState,
  localPlayerId,
  onMuteToggle,
  isMuted,
}: HudProps) {
  const { round, mode, twists, timeLeft, players } = gameState;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "var(--font-body)",
        color: "var(--mp-ink)",
      }}
    >
      {/* 1. Top-Left: Round Panel & Mode Pill */}
      <RoundModeBadge
        round={round}
        maxRounds={gameState?.maxRounds}
        mode={mode}
      />

      {/* 2. Top-Center: Big Countdown Timer & Twist Chips */}
      <TimerTwistBar
        timeLeft={timeLeft}
        twists={twists}
      />

      {/* 3. Top-Right: Sound Mute & Player Score Pills */}
      <div
        style={{
          position: "absolute",
          right: "12px",
          top: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "flex-end",
        }}
      >
        <AudioMuteButton
          isMuted={isMuted}
          onMuteToggle={onMuteToggle}
        />

        <PlayerScoreList
          players={players}
          localPlayerId={localPlayerId}
          mode={mode}
        />
      </div>
    </div>
  );
}
