import { useEffect } from "preact/hooks";
import { PLAYER_COLORS } from "@mutator-party/shared";
import type { PlayerClientState } from "../app/store";
import { IconExit, IconRefresh, IconArrowRight } from "./components/Icons";

interface ResultsOverlayProps {
  isFinal: boolean;
  round: number;
  mode?: string;
  players: PlayerClientState[];
  localPlayerId: string;
  isHost: boolean;
  onNextRound?: () => void;
  onRematch?: () => void;
  onLeave?: () => void;
}

export function ResultsOverlay({
  isFinal,
  round,
  mode = "brawl",
  players,
  localPlayerId,
  isHost,
  onNextRound,
  onRematch,
  onLeave,
}: ResultsOverlayProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "Enter") {
        if (isFinal) {
          if (onRematch) onRematch();
        } else {
          if (onNextRound) onNextRound();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFinal, onRematch, onNextRound]);

  const modeName =
    mode === "bomb" ? "💣 Bomb Tag" : mode === "crown" ? "👑 Crown Rush" : "🥊 Last One Standing";

  return (
    <div
      onClick={() => {
        if (isFinal && onRematch) onRematch();
        else if (!isFinal && onNextRound) onNextRound();
      }}
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(27,27,58,0.72)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
        cursor: "pointer",
      }}
    >
      <div
        className="mp-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(540px, 94%)",
          padding: "28px 24px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          textAlign: "center",
        }}
      >
        {isFinal ? (
          <>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "var(--mp-muted)" }}>
              Party winner
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "48px",
                color: "var(--mp-mint)",
                WebkitTextStroke: "2px var(--mp-ink)",
                paintOrder: "stroke fill",
                textShadow: "0 4px 0 var(--mp-ink)",
                lineHeight: 1.1,
              }}
            >
              {winner?.id === localPlayerId ? "You" : winner?.name || "Player"}
            </span>
          </>
        ) : (
          <>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "36px",
                color: "var(--mp-ink)",
                lineHeight: 1.1,
              }}
            >
              Round {round} results
            </span>
            <span style={{ fontSize: "14px", fontWeight: 900, color: "var(--mp-muted)" }}>
              {modeName}
            </span>
          </>
        )}

        {/* Standings Table with pts & total headers */}
        <div style={{ width: "100%", marginTop: "10px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "24px",
              paddingRight: "14px",
              fontSize: "12px",
              fontWeight: 900,
              color: "var(--mp-muted)",
              marginBottom: "4px",
            }}
          >
            {!isFinal && <span style={{ width: "36px", textAlign: "right" }}>pts</span>}
            <span style={{ width: "36px", textAlign: "right" }}>total</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            {sorted.map((p, idx) => {
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
                    padding: "6px 14px",
                    borderRadius: "9999px",
                    backgroundColor: isLocal ? "#FFE58F" : "transparent",
                    border: isLocal ? "2px solid var(--mp-ink)" : "2px solid transparent",
                    fontWeight: 900,
                    fontSize: "15px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "18px", color: "var(--mp-ink)" }}>{idx + 1}</span>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        backgroundColor: colorHex,
                        border: "2px solid var(--mp-ink)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "var(--mp-ink)" }}>
                      {isLocal ? "You" : p.name}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "24px" }}>
                    {!isFinal && (
                      <span
                        style={{
                          width: "36px",
                          textAlign: "right",
                          color: "var(--mp-mint)",
                          fontFamily: "var(--font-display)",
                          fontSize: "16px",
                        }}
                      >
                        +{Math.max(0, 8 - idx)}
                      </span>
                    )}
                    <span
                      style={{
                        width: "36px",
                        textAlign: "right",
                        fontFamily: "var(--font-display)",
                        fontSize: "18px",
                        color: "var(--mp-ink)",
                      }}
                    >
                      {p.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtext and Buttons */}
        <div style={{ marginTop: "14px", width: "100%" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 900,
              color: "var(--mp-ink)",
              marginBottom: "8px",
            }}
          >
            {isFinal
              ? "Tap or press Space to play again"
              : "Tap or press Space to continue"}
          </div>

          <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "center" }}>
            {onLeave && (
              <button
                type="button"
                className="mp-btn"
                onClick={onLeave}
                style={{
                  background: "var(--mp-coral)",
                  padding: "8px 20px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <IconExit size={15} />
                <span>Leave</span>
              </button>
            )}
            {isFinal && onRematch && (
              <button
                type="button"
                className="mp-btn"
                onClick={onRematch}
                style={{
                  background: "var(--mp-mint)",
                  padding: "8px 26px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Rematch</span>
                <IconRefresh size={15} />
              </button>
            )}
            {!isFinal && isHost && onNextRound && (
              <button
                type="button"
                className="mp-btn"
                onClick={onNextRound}
                style={{
                  background: "var(--mp-mint)",
                  padding: "8px 26px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Next Round</span>
                <IconArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
