import { PLAYER_COLORS } from "@mutator-party/shared";

interface PlayerScoreItem {
  id: string;
  name: string;
  color: any;
  score: number;
}

interface PlayerScoreListProps {
  players: PlayerScoreItem[];
  localPlayerId: string;
  mode: string;
}

export function PlayerScoreList({ players, localPlayerId, mode }: PlayerScoreListProps) {
  const isCrown = mode === "crown";
  const sorted = [...players].sort((a, b) =>
    isCrown ? b.score - a.score || a.id.localeCompare(b.id) : b.score - a.score,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        alignItems: "flex-end",
      }}
    >
      {sorted.map((p, idx) => {
        const isLocal = p.id === localPlayerId;
        const colorHex =
          typeof p.color === "number"
            ? PLAYER_COLORS[p.color % PLAYER_COLORS.length]
            : typeof p.color === "string" && p.color.startsWith("#")
            ? p.color
            : "#FF6B6B";

        return (
          <div
            key={p.id}
            style={{
              height: "26px",
              padding: "0 8px 0 4px",
              backgroundColor: isLocal ? "var(--mp-sun)" : "var(--mp-paper)",
              border: isLocal ? "2px solid var(--mp-ink)" : "1.5px solid var(--mp-ink)",
              borderRadius: "13px",
              boxShadow: "1.5px 2px 0 var(--mp-ink)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 900,
              maxWidth: "140px",
            }}
          >
            {/* Color Dot */}
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: colorHex,
                border: "1.5px solid var(--mp-ink)",
                flexShrink: 0,
              }}
            />

            {/* Name */}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "70px",
              }}
            >
              {isLocal ? "You" : p.name}
            </span>

            {/* Score */}
            <span
              style={{
                color: isLocal ? "var(--mp-ink)" : "var(--mp-grape)",
                flexShrink: 0,
              }}
            >
              {p.score}
            </span>

            {/* Crown indicator for leader in Crown mode */}
            {isCrown && idx === 0 && (
              <span style={{ fontSize: "11px", marginLeft: "-2px" }}>👑</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

