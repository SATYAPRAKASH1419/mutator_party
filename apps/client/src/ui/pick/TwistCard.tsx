export const TWIST_CARDS: Record<string, { name: string; tag: string; icon: string }> = {
  low: { name: "Moon Gravity", tag: "Jump to the sky", icon: "🌙" },
  heavy: { name: "Heavy Boots", tag: "Short hops, hard landings", icon: "⚓" },
  tiny: { name: "Tiny Tots", tag: "Everyone shrinks", icon: "🐭" },
  giant: { name: "Big Boys", tag: "Everyone is huge", icon: "🦣" },
  lotto: { name: "Size Lottery", tag: "Random size for each", icon: "🎲" },
  reverse: { name: "Reversed Controls", tag: "Left is right", icon: "🙃" },
  ice: { name: "Ice Rink", tag: "Zero grip", icon: "🧊" },
  speed: { name: "Turbo", tag: "Everything is fast", icon: "⚡" },
  flap: { name: "Flappy Mode", tag: "Jump any time, anywhere", icon: "🐦" },
  crumble: { name: "Crumbling Floor", tag: "The ground falls apart", icon: "🕳️" },
  wind: { name: "Gale Force", tag: "Wind keeps changing", icon: "💨" },
  dark: { name: "Lights Out", tag: "You see only what is near", icon: "🔦" },
  bounce: { name: "Trampoline Land", tag: "Land and you spring", icon: "🦘" },
};

interface TwistCardProps {
  id: string;
  index: number;
  isPicker: boolean;
  onPick: (index: 0 | 1 | 2) => void;
}

export function TwistCard({ id, index, isPicker, onPick }: TwistCardProps) {
  const info = TWIST_CARDS[id] || { name: id, tag: "A game twist", icon: "⚡" };

  return (
    <button
      type="button"
      disabled={!isPicker}
      onClick={() => onPick(index as 0 | 1 | 2)}
      className="mp-panel"
      style={{
        width: "220px",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        textAlign: "center",
        cursor: isPicker ? "pointer" : "default",
        transform: "scale(1)",
        transition: "transform 0.15s ease",
        position: "relative",
      }}
    >
      {/* Badge 1, 2, 3 */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "14px",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "var(--mp-ink)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: "15px",
        }}
      >
        {index + 1}
      </div>

      <div style={{ fontSize: "56px", marginTop: "12px" }}>{info.icon}</div>

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "20px",
          color: "var(--mp-ink)",
        }}
      >
        {info.name}
      </div>

      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--mp-muted)" }}>
        {info.tag}
      </div>
    </button>
  );
}

