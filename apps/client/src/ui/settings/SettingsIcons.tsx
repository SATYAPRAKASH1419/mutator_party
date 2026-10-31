import type { Theme } from "@mutator-party/shared";

interface IconProps {
  size?: number;
  className?: string;
  style?: Record<string, any>;
}

/**
 * 24px grid, 3px stroke, #1B1B3A navy border SVG icon set
 * Strictly adhering to Mutator Party's playful neo-brutalist cartoon identity.
 */

// ─── Preset Icons ─────────────────────────────────────────────────────────────

export function ChaosPresetIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Explosive chaos starburst */}
      <path
        d="M16 2L19.5 9.5L28 6.5L23.5 14L30 18.5L22 21.5L24 30L16 24.5L8 30L10 21.5L2 18.5L8.5 14L4 6.5L12.5 9.5L16 2Z"
        fill="#FFD23F"
        stroke="#1B1B3A"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Cartoon eyes inside star */}
      <circle cx="13" cy="15" r="2.2" fill="#1B1B3A" />
      <circle cx="19" cy="15" r="2.2" fill="#1B1B3A" />
      {/* Wobbly smirk */}
      <path
        d="M13 19C14.5 21 17.5 21 19 19"
        stroke="#1B1B3A"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ClassicPresetIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Retro Arcade / Gamepad Body */}
      <rect
        x="3"
        y="8"
        width="26"
        height="16"
        rx="8"
        fill="#3DDC97"
        stroke="#1B1B3A"
        strokeWidth="2.6"
      />
      {/* D-Pad */}
      <path
        d="M8 16H14M11 13V19"
        stroke="#1B1B3A"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Action Buttons */}
      <circle cx="21" cy="14" r="1.8" fill="#FF5252" stroke="#1B1B3A" strokeWidth="1.8" />
      <circle cx="24" cy="17" r="1.8" fill="#FFD23F" stroke="#1B1B3A" strokeWidth="1.8" />
    </svg>
  );
}

export function TrophyPresetIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Handles */}
      <path
        d="M6 9C4 9 4 15 8 16M26 9C28 9 28 15 24 16"
        stroke="#1B1B3A"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Cup body */}
      <path
        d="M8 6H24V14C24 18.5 20.5 21 16 21C11.5 21 8 18.5 8 14V6Z"
        fill="#FFD23F"
        stroke="#1B1B3A"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Cup Star */}
      <path
        d="M16 9.5L17.2 12.2L20 12.5L17.8 14.3L18.5 17L16 15.5L13.5 17L14.2 14.3L12 12.5L14.8 12.2L16 9.5Z"
        fill="#FFFBF0"
        stroke="#1B1B3A"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Stem & Base */}
      <path d="M16 21V25" stroke="#1B1B3A" strokeWidth="2.6" strokeLinecap="round" />
      <rect
        x="10"
        y="25"
        width="12"
        height="4"
        rx="2"
        fill="#8B5CF6"
        stroke="#1B1B3A"
        strokeWidth="2.4"
      />
    </svg>
  );
}

export function CloudPresetIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Fluffy chill cloud */}
      <path
        d="M9 24H23C26.5 24 28 21.5 28 19C28 16.5 25.5 15 23 15C22.8 11.5 19.5 9 16 9C12.5 9 10 11.5 9.5 14.5C7 14.8 4 16.8 4 19.5C4 22.5 6.5 24 9 24Z"
        fill="#4CC9F0"
        stroke="#1B1B3A"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Relaxed closed eyes */}
      <path
        d="M11 17C12 18.5 13 18.5 14 17M18 17C19 18.5 20 18.5 21 17"
        stroke="#1B1B3A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Smile */}
      <path
        d="M14.5 20C15.5 21 16.5 21 17.5 20"
        stroke="#1B1B3A"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DiceIcon({ size = 20, isSpinning = false }: IconProps & { isSpinning?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        transition: isSpinning ? "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
        transform: isSpinning ? "rotate(360deg) scale(1.15)" : "rotate(0deg) scale(1)",
      }}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="#FFD23F"
        stroke="#1B1B3A"
        strokeWidth="2.4"
      />
      <circle cx="7.5" cy="7.5" r="1.6" fill="#1B1B3A" />
      <circle cx="16.5" cy="7.5" r="1.6" fill="#1B1B3A" />
      <circle cx="12" cy="12" r="1.6" fill="#1B1B3A" />
      <circle cx="7.5" cy="16.5" r="1.6" fill="#1B1B3A" />
      <circle cx="16.5" cy="16.5" r="1.6" fill="#1B1B3A" />
    </svg>
  );
}

// ─── Theme Arena Previews ─────────────────────────────────────────────────────

export function ThemeArenaThumbnail({
  theme,
  size = 54,
  isSelected = false,
}: {
  theme: Theme | "rotate";
  size?: number;
  isSelected?: boolean;
}) {
  const getThemeColors = () => {
    switch (theme) {
      case "sunny":
        return { sky: "#70D6FF", ground: "#3DDC97", accent: "#FFD23F" };
      case "neon":
        return { sky: "#16003B", ground: "#F72585", accent: "#7209B7" };
      case "candy":
        return { sky: "#FFC6FF", ground: "#FF99C8", accent: "#FCF6BD" };
      case "frozen":
        return { sky: "#A0C4FF", ground: "#BDB2FF", accent: "#E0AAFF" };
      case "desert":
        return { sky: "#FFB703", ground: "#FB8500", accent: "#DDA15E" };
      case "space":
        return { sky: "#0B091A", ground: "#4361EE", accent: "#4CC9F0" };
      case "diwali":
        return { sky: "#4A0E4E", ground: "#E63946", accent: "#FFD166" };
      case "rotate":
      default:
        return { sky: "#8B5CF6", ground: "#3DDC97", accent: "#FFD23F" };
    }
  };

  const { sky, ground, accent } = getThemeColors();

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size * 0.72}px`,
        borderRadius: "12px",
        overflow: "hidden",
        border: isSelected ? "3px solid #1B1B3A" : "2px solid #1B1B3A",
        boxShadow: isSelected ? "2px 2px 0 #1B1B3A" : "1.5px 1.5px 0 rgba(27,27,58,0.3)",
        position: "relative",
        background: sky,
        flexShrink: 0,
      }}
    >
      {theme === "rotate" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #FFD23F 0%, #3DDC97 50%, #8B5CF6 100%)",
          }}
        >
          <span style={{ fontSize: "16px", fontWeight: 900, color: "#1B1B3A" }}>🔄</span>
        </div>
      ) : (
        <>
          {/* Celestial / sun accent */}
          <div
            style={{
              position: "absolute",
              top: "4px",
              right: "6px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: accent,
              border: "1.2px solid #1B1B3A",
            }}
          />
          {/* Island platform */}
          <div
            style={{
              position: "absolute",
              bottom: "4px",
              left: "15%",
              width: "70%",
              height: "12px",
              background: ground,
              borderRadius: "4px",
              border: "1.5px solid #1B1B3A",
            }}
          />
        </>
      )}
    </div>
  );
}

// ─── Utility Icons ────────────────────────────────────────────────────────────

export function IconCheckMark({ size = 16, color = "#1B1B3A" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLock({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="9" rx="2" fill="#FF5252" stroke="#1B1B3A" strokeWidth="2.2" />
      <path
        d="M7 9V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V9"
        stroke="#1B1B3A"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

