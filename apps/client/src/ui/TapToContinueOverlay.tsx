import { useState, useEffect } from "preact/hooks";
import {
  isMobileOrSmallDevice,
  isAppFullscreen,
  requestAppFullscreen,
} from "../util/fullscreen";

export function TapToContinueOverlay() {
  const [needsTap, setNeedsTap] = useState(() => {
    if (typeof window === "undefined") return false;
    const isLandscape = window.innerWidth >= window.innerHeight;
    return isMobileOrSmallDevice() && isLandscape && !isAppFullscreen();
  });

  useEffect(() => {
    const checkState = () => {
      const isLandscape = window.innerWidth >= window.innerHeight;
      const isMobile = isMobileOrSmallDevice();
      const inFullscreen = isAppFullscreen();
      setNeedsTap(isMobile && isLandscape && !inFullscreen);
    };

    window.addEventListener("resize", checkState);
    window.addEventListener("orientationchange", checkState);
    document.addEventListener("fullscreenchange", checkState);
    document.addEventListener("webkitfullscreenchange", checkState);

    return () => {
      window.removeEventListener("resize", checkState);
      window.removeEventListener("orientationchange", checkState);
      document.removeEventListener("fullscreenchange", checkState);
      document.removeEventListener("webkitfullscreenchange", checkState);
    };
  }, []);

  if (!needsTap) return null;

  const handleTap = async () => {
    await requestAppFullscreen();
    setNeedsTap(false);
  };

  return (
    <div
      onClick={handleTap}
      onTouchStart={handleTap}
      className="mp-tap-to-continue-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        background: "rgba(27, 27, 58, 0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        animation: "mpOverlayFadeIn 0.2s ease-out forwards",
      }}
    >
      <style>{`
        @keyframes mpOverlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mpTapPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          padding: "16px 30px",
          background: "rgba(255, 248, 231, 0.95)",
          border: "3.5px solid var(--mp-ink)",
          borderRadius: "9999px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3), 3px 5px 0 var(--mp-ink)",
          animation: "mpTapPulse 2s ease-in-out infinite",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 3.2vw, 28px)",
            color: "var(--mp-sun)",
            WebkitTextStroke: "1.5px var(--mp-ink)",
            paintOrder: "stroke fill",
            textShadow: "0 3px 0 var(--mp-ink)",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>Tap to Continue</span>
          <span style={{ fontSize: "26px" }}>🎮</span>
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "var(--mp-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          Tap anywhere for fullscreen play
        </span>
      </div>
    </div>
  );
}

