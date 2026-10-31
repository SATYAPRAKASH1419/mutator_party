import type { ComponentChildren } from "preact";

type GameMode = "brawl" | "bomb" | "crown";

export const MODE_DETAILS: Record<GameMode, { label: string; color: string }> = {
  brawl: { label: "Brawl", color: "#FF5252" },
  bomb: { label: "Bomb", color: "#6366F1" },
  crown: { label: "Crown", color: "#F59E0B" },
};

/**
 * High-polish cartoon Game Mode SVGs (Brawl Boxing Glove, Bomb Tag Bomb, Crown Rush Crown).
 */
export function GameModeIcon({
  mode,
  size = 18,
}: {
  mode: GameMode;
  size?: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-label={MODE_DETAILS[mode]?.label || mode}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {mode === "brawl" && (
          <>
            {/* Boxing Glove main body */}
            <path
              d="M7 14.5C5.5 13.5 4.5 11.5 5 8.5C5.5 5.5 8 4 12 4C16.5 4 18.5 6.5 18.5 10C18.5 12 17.5 13.5 15.5 14.5"
              fill="#FF5252"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Thumb */}
            <path
              d="M7 11.5C5.5 11.5 4.5 13 5 14.5C5.5 16 7.5 16.5 9 15.5L10 14.5"
              fill="#FF7676"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Wrist cuff */}
            <rect
              x="8"
              y="15.5"
              width="9"
              height="4.5"
              rx="1.5"
              fill="#FFFFFF"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="1.8"
            />
            <line x1="8" y1="17.8" x2="17" y2="17.8" stroke="#FF5252" strokeWidth="1.5" />
            {/* White shine highlight */}
            <path d="M8 6.5C10 5.5 13 5.5 15 6.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}

        {mode === "bomb" && (
          <>
            {/* Fuse */}
            <path
              d="M14.5 8.5C15.5 6.5 17 6 18.5 6.5"
              stroke="#F59E0B"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Spark star on fuse tip */}
            <polygon
              points="19.5,4 20.3,5.5 22,5.8 20.8,7 21.2,8.7 19.5,7.8 17.8,8.7 18.2,7 17,5.8 18.7,5.5"
              fill="#FFE66D"
            />
            <circle cx="19.5" cy="6.8" r="1.1" fill="#FF4D4D" />
            {/* Bomb Neck */}
            <rect
              x="11.5"
              y="7"
              width="4"
              height="2.5"
              rx="1"
              fill="#64748B"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="1.5"
            />
            {/* Bomb Spherical Body */}
            <circle
              cx="11.5"
              cy="14.5"
              r="6.5"
              fill="#2D2B55"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="2"
            />
            {/* White shine highlight */}
            <path
              d="M8.5 12C9 10.5 10.5 9.5 12 9.5"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </>
        )}

        {mode === "crown" && (
          <>
            {/* Crown Body */}
            <path
              d="M4 17L5 8.5L9 12L12 6L15 12L19 8.5L20 17H4Z"
              fill="#FFC93C"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Base rim */}
            <rect
              x="4"
              y="16.5"
              width="16"
              height="3"
              rx="1"
              fill="#F59E0B"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="1.5"
            />
            {/* Jewel spheres */}
            <circle cx="5" cy="8" r="1.3" fill="#EF4444" />
            <circle cx="12" cy="5.5" r="1.5" fill="#38B6FF" />
            <circle cx="19" cy="8" r="1.3" fill="#10B981" />
            {/* Center ruby gem */}
            <polygon
              points="12,12.5 13.5,14.5 12,16 10.5,14.5"
              fill="#EF4444"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="0.8"
            />
          </>
        )}
      </svg>
    </span>
  );
}

/**
 * Display list of modes formatted as compact sticker pills.
 */
export function GameModeList({
  modes,
  size = 15,
  separator = false,
}: {
  modes: readonly string[];
  size?: number;
  separator?: boolean;
}) {
  const validModes = modes.filter(
    (mode): mode is GameMode => mode in MODE_DETAILS,
  );

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      {validModes.map((mode, index) => (
        <span
          key={mode}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: "#FFFFFF",
            border: "1.8px solid var(--mp-ink, #1B1B3A)",
            borderRadius: "9999px",
            padding: "2px 8px 2px 5px",
            boxShadow: "1px 1.5px 0 var(--mp-ink, #1B1B3A)",
            fontSize: "12px",
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          <GameModeIcon mode={mode} size={size} />
          <span style={{ color: "var(--mp-ink, #1B1B3A)" }}>
            {MODE_DETAILS[mode].label}
          </span>
          {separator && index < validModes.length - 1 ? null : null}
        </span>
      ))}
    </span>
  );
}

export type RuleIconType =
  | "match"
  | "modes"
  | "twists"
  | "bots"
  | "respawn"
  | "powerups"
  | "theme"
  | "layout";

/**
 * Expressive Rule Category SVG icons styled for Mutator Party Sticker-Pop theme.
 */
export function GameRuleIcon({
  type,
  size = 16,
}: {
  type: RuleIconType;
  size?: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {type === "match" && (
          <>
            {/* Match Length / Stopwatch */}
            <circle cx="12" cy="13" r="8" fill="#FFFBEB" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" />
            <path d="M12 9V13L15 15" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 3H14M12 3V5" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="13" r="1.5" fill="var(--mp-ink, #1B1B3A)" />
          </>
        )}

        {type === "modes" && (
          <>
            {/* Arcade Game Controller */}
            <rect x="3" y="7" width="18" height="11" rx="5.5" fill="#FF6B6B" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" />
            <path d="M7 11V14M5.5 12.5H8.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="15.5" cy="11.5" r="1.2" fill="#FFD700" />
            <circle cx="17.5" cy="13.5" r="1.2" fill="#3DDC97" />
          </>
        )}

        {type === "twists" && (
          <>
            {/* Mystery / Twist Card */}
            <rect x="4" y="4" width="16" height="16" rx="4" fill="#A855F7" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" />
            <path
              d="M10 8.5C10 7.3 11 6.5 12.5 6.5C14 6.5 15 7.3 15 8.5C15 9.8 13.5 10.5 12.5 11.5V13"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12.5" cy="16" r="1.2" fill="#FFFFFF" />
          </>
        )}

        {type === "bots" && (
          <>
            {/* Cartoon Bot Face */}
            <rect x="4" y="8" width="16" height="12" rx="4" fill="#8B5CF6" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="4.5" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="4" r="1.5" fill="#3DDC97" />
            <circle cx="8.5" cy="13" r="1.5" fill="#00F2FE" />
            <circle cx="15.5" cy="13" r="1.5" fill="#00F2FE" />
            <path d="M9.5 16.5H14.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}

        {type === "respawn" && (
          <>
            {/* Cartoon Heart / Lives */}
            <path
              d="M12 20C12 20 4 14.5 4 9C4 6 6.5 4 9.5 4C11 4 12 5 12 5C12 5 13 4 14.5 4C17.5 4 20 6 20 9C20 14.5 12 20 12 20Z"
              fill="#FF4D4D"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M7 8C7 6.5 8.5 5.5 10 6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}

        {type === "powerups" && (
          <>
            {/* Power-up Star / Lightning Bolt */}
            <polygon
              points="13,2 5,14 12,14 11,22 19,10 12,10"
              fill="#FFD700"
              stroke="var(--mp-ink, #1B1B3A)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </>
        )}

        {type === "layout" && (
          <>
            {/* Arena Grid / Layout */}
            <rect x="4" y="4" width="16" height="16" rx="3" fill="#38B6FF" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" />
            <path d="M4 12H20M12 4V20" stroke="#FFFFFF" strokeWidth="1.8" />
          </>
        )}

        {type === "theme" && (
          <>
            {/* Theme Palette */}
            <circle cx="12" cy="12" r="8" fill="#FDE047" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" />
            <circle cx="9" cy="10" r="1.5" fill="#EF4444" />
            <circle cx="15" cy="10" r="1.5" fill="#38B6FF" />
            <circle cx="12" cy="15" r="1.5" fill="#10B981" />
          </>
        )}
      </svg>
    </span>
  );
}

/**
 * Cartoon Game Rulebook icon for modal headers.
 */
export function GameRulesTitleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5C4 3.9 4.9 3 6 3H18C19.1 3 20 3.9 20 5V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V5Z"
        fill="#FFEAA7"
        stroke="var(--mp-ink, #1B1B3A)"
        strokeWidth="2"
      />
      <path d="M8 3V21" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" />
      <path d="M13 3V9L15.5 7.5L18 9V3" fill="#FF5252" />
      <line x1="11" y1="13" x2="17" y2="13" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="11" y1="16" x2="15" y2="16" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function GameIconLabel({
  icon,
  children,
}: {
  icon: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
      {icon}
      {children}
    </span>
  );
}

export * from "../lobby/LobbyIcons";
