import { PLAYER_COLORS } from "@mutator-party/shared";
import type { PlayerClientState } from "../../app/store";

interface PlayerStandingRowProps {
  player: PlayerClientState;
  index: number;
  localPlayerId: string;
  isFinal: boolean;
}

export function PlayerStandingRow({
  player,
  index,
  localPlayerId,
  isFinal,
}: PlayerStandingRowProps) {
  const isLocal = player.id === localPlayerId;
  const colorHex = PLAYER_COLORS[player.color % PLAYER_COLORS.length] || "#FF6B6B";

  return (
    <div
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
        <span style={{ width: "18px", color: "var(--mp-ink)" }}>{index + 1}</span>
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
          {isLocal ? "You" : player.name}
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
            +{Math.max(0, 8 - index)}
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
          {player.score}
        </span>
      </div>
    </div>
  );
}

