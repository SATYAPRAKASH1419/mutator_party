import { PLAYER_COLORS } from "@mutator-party/shared";
import type { RoomClientState } from "../app/store";
import { IconVolumeOn, IconVolumeMute } from "./components/Icons";

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

  const isCrown = mode === "crown";
  const sorted = [...players].sort((a, b) =>
    isCrown ? b.score - a.score || a.id.localeCompare(b.id) : b.score - a.score,
  );

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
      <div
        style={{
          position: "absolute",
          left: "12px",
          top: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Round Panel */}
        <div
          style={{
            width: "110px",
            height: "34px",
            backgroundColor: "var(--mp-paper)",
            border: "3px solid var(--mp-ink)",
            borderRadius: "12px",
            boxShadow: "4px 5px 0 var(--mp-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-body)",
            fontWeight: 900,
            fontSize: "15px",
            color: "var(--mp-ink)",
          }}
        >
          Round {round}/{gameState?.maxRounds ?? 5}
        </div>

        {/* Mode Pill */}
        <div
          style={{
            height: "32px",
            padding: "0 16px",
            backgroundColor: "var(--mp-ink)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#FFFFFF",
            fontWeight: 900,
            fontSize: "14px",
            textTransform: "capitalize",
            boxShadow: "2px 3px 0 rgba(0,0,0,0.2)",
          }}
        >
          <span>{mode === "brawl" ? "🥊" : mode === "bomb" ? "💣" : "👑"}</span>
          <span>
            {mode === "brawl"
              ? "Brawl"
              : mode === "bomb"
                ? "Bomb Tag"
                : "Crown Rush"}
          </span>
        </div>
      </div>

      {/* 2. Top-Center: Big Countdown Timer & Twist Chips */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "8px",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Big 46px Timer */}
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "48px",
            color: timeLeft <= 10 ? "#FF6B6B" : "#FFFFFF",
            WebkitTextStroke: "6px var(--mp-ink)",
            paintOrder: "stroke fill",
            textShadow: "0 4px 0 var(--mp-ink)",
            lineHeight: 1,
          }}
        >
          {timeLeft}
        </div>

        {/* Twist Chips Row */}
        {twists.length > 0 && (
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            {twists.map((twist) => (
              <div
                key={twist}
                style={{
                  backgroundColor: "var(--mp-paper)",
                  border: "3px solid var(--mp-ink)",
                  borderRadius: "14px",
                  boxShadow: "3px 3px 0 var(--mp-ink)",
                  padding: "3px 14px",
                  fontSize: "14px",
                  fontWeight: 900,
                  color: "var(--mp-ink)",
                  whiteSpace: "nowrap",
                  textTransform: "capitalize",
                }}
              >
                ⚡ {twist}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Top-Right: Sound Toggle & Scoreboard Panel */}
      <div
        style={{
          position: "absolute",
          right: "12px",
          top: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "8px",
          pointerEvents: "auto",
        }}
      >
        {onMuteToggle && (
          <button
            type="button"
            onClick={onMuteToggle}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--mp-paper)",
              border: "2.5px solid var(--mp-ink)",
              boxShadow: "2px 3px 0 var(--mp-ink)",
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isMuted ? <IconVolumeMute size={16} /> : <IconVolumeOn size={16} />}
          </button>
        )}

        {/* Scoreboard Panel */}
        <div
          style={{
            width: "156px",
            backgroundColor: "var(--mp-paper)",
            border: "3.5px solid var(--mp-ink)",
            borderRadius: "16px",
            boxShadow: "5px 6px 0 var(--mp-ink)",
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {sorted.map((p) => {
            const isLocal = p.id === localPlayerId;
            const colorHex =
              PLAYER_COLORS[p.color % PLAYER_COLORS.length] || "#FF6B6B";
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  fontWeight: 900,
                  color: "var(--mp-ink)",
                  opacity: p.lives <= 0 && mode !== "crown" ? 0.4 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: colorHex,
                      border: "2px solid var(--mp-ink)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isLocal ? "You" : p.name}
                  </span>
                </div>
                <span style={{ marginLeft: "6px" }}>
                  {isCrown ? `${p.score}s` : p.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Controls Legend */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "8px",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.95)",
          fontSize: "13px",
          fontWeight: 900,
          textShadow: "0 2px 4px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
        }}
      >
        A/D or ◄/► Move • W/Space Jump • E/Shift Shove
      </div>
    </div>
  );
}
