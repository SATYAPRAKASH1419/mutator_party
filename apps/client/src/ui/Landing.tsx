import { useState, useRef, useEffect } from "preact/hooks";
import { appStore } from "../app/store";
import { showToast } from "../util/toast";
import {
  IconFullscreen,
  IconMinimize,
  IconGamepad,
  IconLink,
} from "./components/Icons";
import {
  isMobileOrSmallDevice,
  isAppFullscreen,
  toggleAppFullscreen,
  requestAppFullscreen,
} from "../util/fullscreen";

import { LandingBackground } from "./landing/LandingBackground";
import { LandingTitle } from "./landing/LandingTitle";
import { NameInputRow } from "./landing/NameInputRow";
import { JoinCodeBoxes } from "./landing/JoinCodeBoxes";

interface LandingProps {
  onJoin: (code: string) => void;
  onCreate: () => void;
}

const FUN_NAMES = [
  "Crispy Samosa",
  "Spicy Biryani",
  "Chai Biscuit",
  "Tandoori Momo",
  "Butter Naan",
  "Sweet Jalebi",
  "Mango Lassi",
  "Pani Puri",
  "Cheesy Pizza",
  "Cosmic Taco",
  "Turbo Waffle",
  "Magic Donut",
  "Bunty",
  "Pappu",
  "Chintu",
  "Pinky",
];

export function Landing({ onJoin, onCreate }: LandingProps) {
  const profile = appStore.getState().profile;
  const initialCode = appStore.getState().roomCode || "";

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [name, setName] = useState(profile.name || "Satya");
  const [digits, setDigits] = useState<string[]>(() => {
    const chars = initialCode.toUpperCase().slice(0, 5).split("");
    while (chars.length < 5) chars.push("");
    return chars;
  });
  const [nameError, setNameError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(isAppFullscreen);
  const [isMobile, setIsMobile] = useState(isMobileOrSmallDevice);

  useEffect(() => {
    const handleOrientation = () => {
      setIsFullscreen(isAppFullscreen());
      setIsMobile(isMobileOrSmallDevice());
    };
    window.addEventListener("resize", handleOrientation);
    window.addEventListener("orientationchange", handleOrientation);
    document.addEventListener("fullscreenchange", handleOrientation);
    document.addEventListener("webkitfullscreenchange", handleOrientation);

    // Auto-enter fullscreen for mobile / small screen devices
    if (isMobileOrSmallDevice() && !isAppFullscreen()) {
      requestAppFullscreen().catch(() => {});
    }

    return () => {
      window.removeEventListener("resize", handleOrientation);
      window.removeEventListener("orientationchange", handleOrientation);
      document.removeEventListener("fullscreenchange", handleOrientation);
      document.removeEventListener("webkitfullscreenchange", handleOrientation);
    };
  }, []);

  const handleToggleFullscreen = () => {
    toggleAppFullscreen().catch(() => {});
  };

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleRollDice = () => {
    const randomName = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)]!;
    setName(randomName);
    setNameError("");
    appStore.setProfile({ name: randomName });
  };

  const handleDigitChange = (index: number, val: string) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!upper) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    // Support paste of entire code
    if (upper.length > 1) {
      const chars = upper.slice(0, 5).split("");
      const next = [...digits];
      for (let i = 0; i < 5; i++) {
        next[i] = chars[i] || "";
      }
      setDigits(next);
      const focusTarget = Math.min(chars.length, 4);
      inputRefs[focusTarget]?.current?.focus();
      return;
    }

    const next = [...digits];
    next[index] = upper[upper.length - 1]!;
    setDigits(next);

    // Auto advance focus to next box
    if (index < 4) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
    if (e.key === "Enter") {
      handleJoin();
    }
  };

  const validateName = (): boolean => {
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 16) {
      setNameError("Name must be 2 to 16 characters.");
      showToast("Nickname must be 2 to 16 characters!", "warning");
      return false;
    }
    appStore.setProfile({ name: cleanName });
    return true;
  };

  const handleCreate = () => {
    if (!validateName()) return;
    onCreate();
  };

  const handleJoin = () => {
    if (!validateName()) return;

    const fullCode = digits.join("").toUpperCase();
    if (fullCode.length !== 5) {
      showToast("Enter a 5-letter room code (e.g. SDFFS)!", "warning");
      return;
    }

    onJoin(fullCode);
  };

  return (
    <div className="mp-landing-wrap">
      {/* Animation & Styles */}
      <style>{`
        .mp-landing-wrap {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #7CD3FF 0%, #AEE6FF 28%, #FFF4DB 72%, #FFE5BA 100%);
          padding: var(--safe-max-y, 8px) var(--safe-max-x, 14px);
          overflow: hidden;
          box-sizing: border-box;
          font-family: var(--font-body);
          user-select: none;
          -webkit-user-select: none;
        }

        .mp-landing-card {
          width: min(430px, 92vw);
          padding: 16px 20px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          z-index: 10;
          background: var(--mp-paper, #FFF8E7);
          border: 3.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 22px;
          box-shadow: 5px 7px 0 var(--mp-ink, #1B1B3A);
          box-sizing: border-box;
          position: relative;
          margin: auto;
        }

        /* Fixed-height tab content container to ensure consistent card height */
        .mp-tab-content-container {
          width: 100%;
          min-height: 142px;
          height: 142px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          box-sizing: border-box;
        }

        /* Modern Segmented Tab Switcher */
        .mp-tab-switcher {
          display: flex;
          width: 100%;
          background: rgba(27, 27, 58, 0.08);
          border: 2px solid var(--mp-ink, #1B1B3A);
          border-radius: 9999px;
          padding: 3px;
          box-sizing: border-box;
          gap: 4px;
        }

        .mp-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 9999px;
          border: none;
          font-family: var(--font-body);
          font-weight: 900;
          font-size: 13.5px;
          cursor: pointer;
          outline: none;
          transition: all 0.15s ease;
          background: transparent;
          color: var(--mp-ink, #1B1B3A);
        }

        .mp-tab-btn.active {
          background: var(--mp-sun, #FFC93C);
          border: 2px solid var(--mp-ink, #1B1B3A);
          box-shadow: 1.5px 2px 0 var(--mp-ink, #1B1B3A);
        }

        /* 5-Box Inputs */
        .mp-code-box:focus {
          border-color: var(--mp-grape, #7C3AED) !important;
          background: #FFF3D6 !important;
          transform: translateY(-2px);
          box-shadow: 0 5px 0 var(--mp-ink, #1B1B3A) !important;
        }

        /* Primary Big CTA Buttons */
        .mp-btn-cta {
          width: 100%;
          padding: 11px 20px;
          border-radius: 9999px;
          border: 3.5px solid var(--mp-ink, #1B1B3A);
          font-family: var(--font-display);
          font-size: clamp(17px, 4vw, 20px);
          font-weight: 900;
          color: var(--mp-ink, #1B1B3A);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 0 var(--mp-ink, #1B1B3A);
          transition: transform 0.12s ease, filter 0.12s ease;
          outline: none;
        }
        .mp-btn-cta:hover {
          filter: brightness(1.04);
          transform: translateY(-2px);
          box-shadow: 0 6px 0 var(--mp-ink, #1B1B3A);
        }
        .mp-btn-cta:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 var(--mp-ink, #1B1B3A);
        }

        /* Compact Landscape Mobile Adjustments */
        @media (orientation: landscape) and (max-height: 520px) {
          .mp-landing-card {
            width: min(400px, 92vw);
            padding: 10px 16px 8px;
            gap: 6px;
          }
          .mp-tab-content-container {
            min-height: 118px;
            height: 118px;
          }
          .mp-btn-cta {
            padding: 7px 14px;
            font-size: 15px;
          }
          .mp-code-box {
            height: 42px !important;
            width: 38px !important;
            font-size: 22px !important;
          }
        }
      `}</style>

      {/* Background Scenery */}
      <LandingBackground />

      {/* Fullscreen Toggle (Desktop Only) */}
      {!isMobile && (
        <button
          type="button"
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
          className="mp-btn"
          style={{
            position: "fixed",
            top: "max(12px, env(safe-area-inset-top, 12px))",
            right: "max(12px, env(safe-area-inset-right, 12px))",
            padding: "6px 14px",
            fontSize: "12px",
            background: "rgba(255, 248, 231, 0.92)",
            color: "var(--mp-ink, #1B1B3A)",
            zIndex: 50,
            borderRadius: "9999px",
            border: "2.5px solid var(--mp-ink, #1B1B3A)",
            boxShadow: "2px 2px 0 var(--mp-ink, #1B1B3A)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {isFullscreen ? (
            <>
              <IconMinimize size={13} />
              <span>Exit</span>
            </>
          ) : (
            <>
              <IconFullscreen size={13} />
              <span>Fullscreen</span>
            </>
          )}
        </button>
      )}

      {/* Main Game Modal */}
      <div className="mp-panel mp-landing-card">
        {/* Title */}
        <LandingTitle />

        {/* Common Player Nickname Row */}
        <NameInputRow
          name={name}
          nameError={nameError}
          onNameChange={(val) => {
            setName(val);
            setNameError("");
            appStore.setProfile({ name: val });
          }}
          onRollDice={handleRollDice}
        />

        {/* Modern Game Style Tab Switcher */}
        <div className="mp-tab-switcher">
          <button
            type="button"
            className={`mp-tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <IconGamepad size={16} />
            <span>Create Room</span>
          </button>
          <button
            type="button"
            className={`mp-tab-btn ${activeTab === "join" ? "active" : ""}`}
            onClick={() => setActiveTab("join")}
          >
            <IconLink size={16} />
            <span>Join Room</span>
          </button>
        </div>

        {/* Tab 1: Create Room */}
        {activeTab === "create" && (
          <div className="mp-tab-content-container">
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748B",
                textAlign: "center",
                lineHeight: 1.35,
                padding: "4px 8px",
              }}
            >
              Host a party room for up to 8 players. Customize rounds, modes, and twists in the lobby!
            </div>

            <button
              type="button"
              className="mp-btn-cta"
              onClick={handleCreate}
              style={{
                background: "var(--mp-sun, #FFC93C)",
              }}
            >
              <span>Create Room</span>
            </button>
          </div>
        )}

        {/* Tab 2: Join with Code */}
        {activeTab === "join" && (
          <div className="mp-tab-content-container">
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#64748B",
                textAlign: "center",
              }}
            >
              Enter the 5-letter room code:
            </div>

            {/* 5 Distinct Squircle Boxes */}
            <JoinCodeBoxes
              digits={digits}
              inputRefs={inputRefs}
              onDigitChange={handleDigitChange}
              onDigitKeyDown={handleDigitKeyDown}
            />

            <button
              type="button"
              className="mp-btn-cta"
              onClick={handleJoin}
              style={{
                background: "var(--mp-mint, #3DDC97)",
              }}
            >
              <span>Join Room</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
