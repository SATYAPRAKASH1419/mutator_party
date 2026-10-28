import { useEffect } from "preact/hooks";
import type { PlayerClientState } from "../app/store";
import { IconExit, IconRefresh, IconArrowRight } from "./components/Icons";
import { PlayerStandingRow } from "./results/PlayerStandingRow";

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
            <span style={{ fontSize: "16px", fontWeight: 900, color: "var(--mp-muted)" }}>
              Round {round} &middot; {modeName}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "36px",
                color: "var(--mp-sun)",
                WebkitTextStroke: "2px var(--mp-ink)",
                paintOrder: "stroke fill",
                textShadow: "0 4px 0 var(--mp-ink)",
                lineHeight: 1.1,
              }}
            >
              Standings
            </span>
          </>
        )}

        {/* Score Table */}
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
            {sorted.map((p, idx) => (
              <PlayerStandingRow
                key={p.id}
                player={p}
                index={idx}
                localPlayerId={localPlayerId}
                isFinal={isFinal}
              />
            ))}
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
            {isHost
              ? "Press Space or click button to continue"
              : "Waiting for host to continue..."}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {onLeave && (
              <button
                type="button"
                className="mp-btn"
                onClick={onLeave}
                style={{
                  background: "var(--mp-paper)",
                  color: "var(--mp-ink)",
                  padding: "8px 18px",
                  fontSize: "14px",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <IconExit size={16} />
                <span>Leave</span>
              </button>
            )}

            {isFinal ? (
              isHost && onRematch && (
                <button
                  type="button"
                  className="mp-btn"
                  onClick={onRematch}
                  style={{
                    background: "var(--mp-mint)",
                    color: "var(--mp-ink)",
                    padding: "10px 24px",
                    fontSize: "16px",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <IconRefresh size={18} />
                  <span>Rematch (Space)</span>
                </button>
              )
            ) : (
              isHost && onNextRound && (
                <button
                  type="button"
                  className="mp-btn"
                  onClick={onNextRound}
                  style={{
                    background: "var(--mp-sun)",
                    color: "var(--mp-ink)",
                    padding: "10px 24px",
                    fontSize: "16px",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>Next Round (Space)</span>
                  <IconArrowRight size={18} />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
