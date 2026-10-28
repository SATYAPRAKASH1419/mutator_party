import { useState, useEffect } from "preact/hooks";
import { TwistCard } from "./pick/TwistCard";

interface PickOverlayProps {
  onPick: (index: 0 | 1 | 2) => void;
  isPicker: boolean;
  pickerName?: string;
  cards?: string[];
  timeoutSec?: number;
}

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
        {cards.map((id, idx) => (
          <TwistCard
            key={id}
            id={id}
            index={idx}
            isPicker={isPicker}
            onPick={onPick}
          />
        ))}
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
