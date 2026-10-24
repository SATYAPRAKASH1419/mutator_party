function getLetterStyle(color: string) {
  return {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(22px, 6.2vw, 36px)",
    color,
    WebkitTextStroke: "clamp(1.8px, 0.45vw, 2.5px) var(--mp-ink, #1B1B3A)",
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "nowrap",
          maxWidth: "100%",
        }}
      >
        <span style={getLetterStyle("#FF6B6B")}>M</span>
        <span style={getLetterStyle("#3DDC97")}>U</span>
        <span style={getLetterStyle("#8B5CF6")}>T</span>
        <span style={getLetterStyle("#FFC93C")}>A</span>
        <span style={getLetterStyle("#4CC9F0")}>T</span>
        <span style={getLetterStyle("#FF9F1C")}>O</span>
        <span style={getLetterStyle("#F15BB5")}>R</span>
        <span style={{ width: "clamp(6px, 1.8vw, 12px)" }} />
        <span style={getLetterStyle("#2EC4B6")}>P</span>
        <span style={getLetterStyle("#FF6B6B")}>A</span>
        <span style={getLetterStyle("#3DDC97")}>R</span>
        <span style={getLetterStyle("#8B5CF6")}>T</span>
        <span style={getLetterStyle("#4CC9F0")}>Y</span>
      </div>

      <div
        style={{
          fontSize: "clamp(11.5px, 2.8vw, 13px)",
          fontWeight: 900,
          color: "var(--mp-ink, #1B1B3A)",
          textAlign: "center",
          marginTop: "-6px",
          letterSpacing: "0.2px",
        }}
      >
        One link • Zero setup • Unlimited fun!
      </div>
    </>
  );
}
