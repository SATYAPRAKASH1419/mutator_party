import { useState, useEffect } from "preact/hooks";
import { clientLog } from "../util/logger";
import { TWISTS, type Twist } from "@mutator-party/shared";

interface PickOverlayProps {
  onPick: (index: 0 | 1 | 2) => void;
  isPicker: boolean;
  pickerName?: string;
  cards?: string[];
  timeoutSec?: number;
}

const TWIST_CARDS: Record<string, { name: string; tag: string; icon: string }> = {
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

export function PickOverlay({
  onPick,
  isPicker,
  pickerName = "Last Place",
  cards: propCards,
  timeoutSec = 10,
}: PickOverlayProps) {
  const [countdown, setCountdown] = useState(timeoutSec);
  const cards = propCards && propCards.length > 0 ? propCards : ["speed", "low", "crumble"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          if (isPicker) onPick(0);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    const onKey = (e: KeyboardEvent) => {
      if (!isPicker) return;
      if (e.key === "1") onPick(0);
      else if (e.key === "2") onPick(1);
      else if (e.key === "3") onPick(2);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [isPicker, onPick]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(27,27,58,0.72)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "40px",
          color: "var(--mp-sun)",
          WebkitTextStroke: "2.5px var(--mp-ink)",
          paintOrder: "stroke fill",
          textShadow: "0 4px 0 var(--mp-ink)",
          textAlign: "center",
          marginBottom: "4px",
        }}
      >
        {isPicker ? "You are in last place" : `${pickerName} is picking a twist`}
      </div>

      <div
        style={{
          fontSize: "16px",
          fontWeight: 900,
          color: "#FFF8E7",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          marginBottom: "24px",
        }}
      >
        {isPicker
          ? "Choose the twist for the next round. Make it hurt."
          : "Wait for the twist to be locked in..."}
      </div>

      {/* 3 Twist Cards */}
      <div
        style={{
          display: "flex",
          gap: "18px",
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: "800px",
        }}
      >
        {cards.map((id, idx) => {
          const info = TWIST_CARDS[id] || { name: id, tag: "A game twist", icon: "⚡" };
          return (
            <button
              key={id}
              type="button"
              disabled={!isPicker}
              onClick={() => onPick(idx as 0 | 1 | 2)}
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
                {idx + 1}
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
        })}
      </div>

      {/* Countdown pill */}
      <div
        style={{
          marginTop: "20px",
          padding: "8px 24px",
          borderRadius: "9999px",
          background: "var(--mp-paper)",
          border: "2.5px solid var(--mp-ink)",
          boxShadow: "3px 4px 0 var(--mp-ink)",
          fontWeight: 900,
          fontSize: "14px",
          color: "var(--mp-ink)",
        }}
      >
        {isPicker
          ? `Press 1, 2 or 3, or tap a card. Auto-picks in ${countdown}s`
          : `Auto-picks in ${countdown}s`}
      </div>
    </div>
  );
}

