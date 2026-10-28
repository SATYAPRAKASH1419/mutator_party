interface RoundModeBadgeProps {
  round: number;
  maxRounds?: number;
  mode: string;
}

export function RoundModeBadge({ round, maxRounds = 5, mode }: RoundModeBadgeProps) {
  return (
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
        Round {round}/{maxRounds}
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
  );
}

