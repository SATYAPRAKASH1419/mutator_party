interface TimerTwistBarProps {
  timeLeft: number;
  twists: string[];
}

export function TimerTwistBar({ timeLeft, twists }: TimerTwistBarProps) {
  const displaySeconds = Math.max(0, Math.ceil(timeLeft));
  const isUrgent = displaySeconds <= 10;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "8px",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {/* Big Countdown Timer - Integer seconds only */}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "44px",
          color: isUrgent ? "var(--mp-coral)" : "var(--mp-sun)",
          WebkitTextStroke: "2px var(--mp-ink)",
          paintOrder: "stroke fill",
          textShadow: "0 4px 0 var(--mp-ink)",
          lineHeight: 1,
          animation: isUrgent ? "pulse 0.5s infinite alternate" : "none",
        }}
      >
        {displaySeconds}
      </div>

      {/* Active Twist Chips */}
      {twists && twists.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
          {twists.map((t) => (
            <div
              key={t}
              style={{
                backgroundColor: "var(--mp-grape)",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 900,
                padding: "2px 8px",
                borderRadius: "12px",
                border: "1.5px solid var(--mp-ink)",
                boxShadow: "1px 2px 0 var(--mp-ink)",
                textTransform: "capitalize",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

