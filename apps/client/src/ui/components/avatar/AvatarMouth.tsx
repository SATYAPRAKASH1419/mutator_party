interface AvatarMouthProps {
  size: number;
  emotion?: string | null;
}

export function AvatarMouth({ size, emotion }: AvatarMouthProps) {
  const emo = emotion?.trim();
  const isDevil = emo === "😈";
  const isLaugh = emo === "😂";
  const isParty = emo === "🎉" || emo === "GG" || emo === "👏";
  const isShock = emo === "👀";
  const isDerp = emo === "💩";
  const isFire = emo === "🔥";

  if (isDevil) {
    return (
      <div
        style={{
          width: `${Math.round(size * 0.36)}px`,
          height: `${Math.round(size * 0.16)}px`,
          background: "var(--mp-ink, #1B1B3A)",
          border: "2px solid var(--mp-ink, #1B1B3A)",
          borderRadius: "0 0 12px 12px",
          marginTop: `${Math.round(size * 0.04)}px`,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          paddingRight: "4px",
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "3.5px solid transparent",
            borderRight: "3.5px solid transparent",
            borderTop: "6.5px solid #FFFFFF",
          }}
        />
      </div>
    );
  }

  if (isLaugh || isParty) {
    return (
      <div
        style={{
          width: `${Math.round(size * 0.36)}px`,
          height: `${Math.round(size * 0.2)}px`,
          background: "#B91C1C",
          border: "2px solid var(--mp-ink, #1B1B3A)",
          borderRadius: "0 0 12px 12px",
          marginTop: `${Math.round(size * 0.04)}px`,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: `${Math.round(size * 0.22)}px`,
            height: `${Math.round(size * 0.12)}px`,
            background: "#F472B6",
            borderRadius: "50%",
            position: "absolute",
            bottom: "-2px",
          }}
        />
      </div>
    );
  }

  if (isShock) {
    return (
      <div
        style={{
          width: `${Math.round(size * 0.16)}px`,
          height: `${Math.round(size * 0.18)}px`,
          borderRadius: "50%",
          background: "var(--mp-ink, #1B1B3A)",
          marginTop: `${Math.round(size * 0.05)}px`,
        }}
      />
    );
  }

  if (isDerp) {
    return (
      <div
        style={{
          position: "relative",
          marginTop: `${Math.round(size * 0.03)}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: `${Math.round(size * 0.26)}px`,
            height: "2.5px",
            background: "var(--mp-ink, #1B1B3A)",
            borderRadius: "2px",
          }}
        />
        <div
          style={{
            width: `${Math.round(size * 0.12)}px`,
            height: `${Math.round(size * 0.14)}px`,
            background: "#F472B6",
            border: "1.5px solid var(--mp-ink, #1B1B3A)",
            borderRadius: "0 0 8px 8px",
            position: "absolute",
            top: "1px",
          }}
        />
      </div>
    );
  }

  if (isFire) {
    return (
      <div
        style={{
          width: `${Math.round(size * 0.3)}px`,
          height: `${Math.round(size * 0.12)}px`,
          background: "#FFFFFF",
          border: "2px solid var(--mp-ink, #1B1B3A)",
          borderRadius: "4px",
          marginTop: `${Math.round(size * 0.05)}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        <div style={{ width: "1.5px", height: "100%", background: "var(--mp-ink, #1B1B3A)" }} />
        <div style={{ width: "1.5px", height: "100%", background: "var(--mp-ink, #1B1B3A)" }} />
      </div>
    );
  }

  // Default curved smile
  return (
    <svg
      width={Math.round(size * 0.34)}
      height={Math.round(size * 0.16)}
      viewBox="0 0 16 8"
      fill="none"
      style={{ marginTop: `${Math.round(size * 0.04)}px` }}
    >
      <path
        d="M 2 2 Q 8 8 14 2"
        stroke="var(--mp-ink, #1B1B3A)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

