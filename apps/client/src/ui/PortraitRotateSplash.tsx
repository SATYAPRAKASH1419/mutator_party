import { useState, useEffect } from "preact/hooks";
import { isMobileOrSmallDevice, requestAppFullscreen } from "../util/fullscreen";
import { IconRotate } from "./components/Icons";

export function PortraitRotateSplash() {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === "undefined") return false;
    return isMobileOrSmallDevice() && window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const checkOrientation = () => {
      const portrait =
        isMobileOrSmallDevice() && window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);

      // When rotating into landscape, immediately trigger fullscreen
      if (!portrait && isMobileOrSmallDevice()) {
        requestAppFullscreen().catch(() => {});
      }
    };

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  const handleTryLandscape = async () => {
    await requestAppFullscreen();
    try {
      await (screen.orientation as any)?.lock?.("landscape");
    } catch {
      // Browser orientation lock is optional
    }
  };

  return (
    <div className="mp-rotate-splash-overlay">
      <style>{`
        .mp-rotate-splash-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: linear-gradient(180deg, #7CD3FF 0%, #AEE6FF 28%, #FFF4DB 72%, #FFE5BA 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          box-sizing: border-box;
          animation: mpSplashFadeIn 0.25s ease-out forwards;
        }

        @keyframes mpSplashFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .mp-rotate-card {
          width: min(360px, 92vw);
          background: var(--mp-paper);
          border: 3.5px solid var(--mp-ink);
          border-radius: 24px;
          box-shadow: 6px 8px 0 var(--mp-ink);
          padding: 28px 22px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-sizing: border-box;
        }

        .mp-device-anim-wrap {
          position: relative;
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mp-device-phone {
          width: 58px;
          height: 98px;
          background: var(--mp-butter);
          border: 3.5px solid var(--mp-ink);
          border-radius: 14px;
          box-shadow: 3px 4px 0 var(--mp-ink);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 6px 4px;
          box-sizing: border-box;
          animation: mpRotatePhone 2.6s ease-in-out infinite;
          transform-origin: center center;
        }

        .mp-device-screen {
          width: 100%;
          height: 72px;
          background: #8EDBFF;
          border: 2px solid var(--mp-ink);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .mp-device-notch {
          width: 16px;
          height: 4px;
          background: var(--mp-ink);
          border-radius: 2px;
        }

        .mp-device-home {
          width: 20px;
          height: 3px;
          background: var(--mp-ink);
          border-radius: 2px;
        }

        .mp-rotate-arrow {
          position: absolute;
          inset: 0;
          animation: mpPulseGlow 2.6s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes mpRotatePhone {
          0%, 15% {
            transform: rotate(0deg) scale(1);
          }
          45%, 70% {
            transform: rotate(-90deg) scale(1.08);
          }
          90%, 100% {
            transform: rotate(0deg) scale(1);
          }
        }

        @keyframes mpPulseGlow {
          0%, 100% { transform: scale(0.96); opacity: 0.7; }
          50% { transform: scale(1.06); opacity: 1; }
        }
      `}</style>

      <div className="mp-rotate-card">
        {/* Game Mini Badge */}
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "14px",
            color: "var(--mp-grape)",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          🎲 Mutator Party 🎮
        </span>

        {/* Animated Phone Rotation Illustration */}
        <div className="mp-device-anim-wrap">
          {/* Circular Rotation Guide Arrows */}
          <svg
            className="mp-rotate-arrow"
            viewBox="0 0 140 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="70"
              cy="70"
              r="58"
              stroke="#1B1B3A"
              strokeWidth="3"
              strokeDasharray="8 6"
              opacity="0.4"
            />
            <path
              d="M124 64C122 36 98 16 70 16"
              stroke="#FFC93C"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <polygon points="70,8 60,20 74,24" fill="#FFC93C" stroke="#1B1B3A" strokeWidth="2" />
            <path
              d="M16 76C18 104 42 124 70 124"
              stroke="#3DDC97"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <polygon points="70,132 80,120 66,116" fill="#3DDC97" stroke="#1B1B3A" strokeWidth="2" />
          </svg>

          {/* Animated Phone */}
          <div className="mp-device-phone">
            <div className="mp-device-notch" />
            <div className="mp-device-screen">
              🎮
            </div>
            <div className="mp-device-home" />
          </div>
        </div>

        {/* Bold Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              color: "var(--mp-sun)",
              WebkitTextStroke: "1.5px var(--mp-ink)",
              paintOrder: "stroke fill",
              textShadow: "0 3px 0 var(--mp-ink)",
              lineHeight: 1.15,
            }}
          >
            Rotate to Landscape
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "var(--mp-muted)",
              lineHeight: 1.4,
              padding: "0 8px",
            }}
          >
            Turn your phone sideways to unlock the full arena & party games!
          </span>
        </div>

        {/* Action Button: Auto rotate & fullscreen on click */}
        <button
          type="button"
          onClick={handleTryLandscape}
          className="mp-btn"
          style={{
            background: "var(--mp-mint)",
            color: "var(--mp-ink)",
            padding: "10px 22px",
            fontSize: "14px",
            fontWeight: 900,
            borderRadius: "9999px",
            boxShadow: "2.5px 3.5px 0 var(--mp-ink)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          <span>Tap to Rotate & Play</span>
          <IconRotate size={18} />
        </button>
      </div>
    </div>
  );
}

