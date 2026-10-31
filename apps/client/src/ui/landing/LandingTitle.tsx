function getLetterStyle(color: string) {
  return {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(26px, 6.8vw, 40px)",
    color,
    WebkitTextStroke: "clamp(2px, 0.5vw, 2.8px) var(--mp-ink, #1B1B3A)",
    paintOrder: "stroke fill",
    textShadow: "0 3px 0 var(--mp-ink, #1B1B3A)",
    lineHeight: 1,
    letterSpacing: "-0.5px",
  };
}

/**
 * Animated MUTATOR PARTY Title with individual sticker letters and subtitle
 */
export function LandingTitle() {
  return (
    <>
      <style>{`
        @keyframes mpTitleWobble {
          0%, 100% { transform: translateY(0) rotate(-0.8deg); }
          50% { transform: translateY(-5px) rotate(0.8deg); }
        }
        .mp-title-letters {
          animation: mpTitleWobble 3s ease-in-out infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: nowrap;
          max-width: 100%;
        }
      `}</style>
      <div className="mp-title-letters">
        <span style={getLetterStyle("#FF6B6B")}>M</span>
        <span style={getLetterStyle("#3DDC97")}>U</span>
        <span style={getLetterStyle("#8B5CF6")}>T</span>
        <span style={getLetterStyle("#FFC93C")}>A</span>
        <span style={getLetterStyle("#4CC9F0")}>T</span>
        <span style={getLetterStyle("#FF9F1C")}>O</span>
        <span style={getLetterStyle("#F15BB5")}>R</span>
        <span style={{ width: "clamp(6px, 1.8vw, 14px)" }} />
        <span style={getLetterStyle("#2EC4B6")}>P</span>
        <span style={getLetterStyle("#FF6B6B")}>A</span>
        <span style={getLetterStyle("#3DDC97")}>R</span>
        <span style={getLetterStyle("#8B5CF6")}>T</span>
        <span style={getLetterStyle("#4CC9F0")}>Y</span>
      </div>

      <div
        style={{
          fontSize: "clamp(12.5px, 2.8vw, 14px)",
          fontWeight: 900,
          color: "var(--mp-ink, #1B1B3A)",
          textAlign: "center",
          marginTop: "-4px",
          letterSpacing: "0.2px",
        }}
      >
        One link • Zero setup • Unlimited fun!
      </div>
    </>
  );
}
