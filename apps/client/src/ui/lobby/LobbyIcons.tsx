interface IconProps {
  size?: number;
  className?: string;
  style?: Record<string, any>;
}

/**
 * 👑 Host Crown - Cartoon Sticker-Pop Crown with gold fill, ink stroke, and gems.
 */
export function GameCrownIcon({ size = 16, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path
        d="M3 18.5L4.2 8L8.5 12.5L12 5.5L15.5 12.5L19.8 8L21 18.5H3Z"
        fill="#FFC93C"
        stroke="var(--mp-ink, #1B1B3A)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Crown base band */}
      <path
        d="M3 18.5H21V20C21 20.6 20.5 21 19.9 21H4.1C3.5 21 3 20.6 3 20V18.5Z"
        fill="#F59E0B"
        stroke="var(--mp-ink, #1B1B3A)"
        strokeWidth="2"
      />
      {/* Jewels on peaks */}
      <circle cx="4.2" cy="7.5" r="1.5" fill="#EF4444" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="1.2" />
      <circle cx="12" cy="5" r="1.8" fill="#38B6FF" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="1.2" />
      <circle cx="19.8" cy="7.5" r="1.5" fill="#10B981" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="1.2" />
      {/* Center ruby gem */}
      <polygon points="12,13 14,16 12,18 10,16" fill="#EF4444" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="1" />
      {/* Highlight sheen */}
      <path d="M5.5 17.5L6.5 11" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * ✓ Ready Status Badge - Chunky checkmark with round ends.
 */
export function GameCheckIcon({ size = 14, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path
        d="M4.5 12.5L9.5 17.5L19.5 6.5"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ⏳ Wait Status Badge - Cartoon arcade hourglass with flowing sand.
 */
export function GameWaitIcon({ size = 14, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Top and bottom wood plates */}
      <rect x="4" y="2.5" width="16" height="3" rx="1.5" fill="#78350F" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="18.5" width="16" height="3" rx="1.5" fill="#78350F" stroke="currentColor" strokeWidth="1.5" />
      {/* Glass hourglass body */}
      <path
        d="M6 5.5H18C18 10 13.5 12 13.5 12C13.5 12 18 14 18 18.5H6C6 14 10.5 12 10.5 12C10.5 12 6 10 6 5.5Z"
        fill="#FFFFFF"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Top sand level */}
      <path d="M7.5 7H16.5C16.5 9 14.5 10.5 12 10.5C9.5 10.5 7.5 9 7.5 7Z" fill="#F59E0B" />
      {/* Falling sand trickle */}
      <line x1="12" y1="10.5" x2="12" y2="15.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      {/* Bottom sand mound */}
      <path d="M8 17.5C8 15.5 10 15 12 15C14 15 16 15.5 16 17.5H8Z" fill="#F59E0B" />
    </svg>
  );
}

/**
 * 🤖 Cartoon Bot Avatar - Playful robot head with antenna, bolts, and glowing eyes.
 */
export function GameBotAvatarIcon({ size = 42, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Antenna */}
      <line x1="24" y1="11" x2="24" y2="4" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="4" r="3.5" fill="#3DDC97" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.5" />

      {/* Side Ear Bolts */}
      <rect x="3" y="21" width="5" height="10" rx="2" fill="#94A3B8" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.5" />
      <rect x="40" y="21" width="5" height="10" rx="2" fill="#94A3B8" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.5" />

      {/* Robot Head Body */}
      <rect
        x="6"
        y="10"
        width="36"
        height="32"
        rx="9"
        fill="#8B5CF6"
        stroke="var(--mp-ink, #1B1B3A)"
        strokeWidth="3"
      />

      {/* Visor Screen */}
      <rect
        x="11"
        y="16"
        width="26"
        height="13"
        rx="5"
        fill="#1E1B4B"
        stroke="var(--mp-ink, #1B1B3A)"
        strokeWidth="2"
      />

      {/* Glowing Cyan Eyes */}
      <rect x="15" y="19.5" width="6" height="6" rx="2" fill="#00F2FE" />
      <rect x="27" y="19.5" width="6" height="6" rx="2" fill="#00F2FE" />
      <circle cx="16.5" cy="21" r="1" fill="#FFFFFF" />
      <circle cx="28.5" cy="21" r="1" fill="#FFFFFF" />

      {/* Cute Speaker / Smile Mouth */}
      <path
        d="M19 34.5C20.5 36.5 23.5 37 24 37C24.5 37 27.5 36.5 29 34.5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Cheerful Blush Dots */}
      <circle cx="11" cy="32" r="1.8" fill="#F472B6" />
      <circle cx="37" cy="32" r="1.8" fill="#F472B6" />
    </svg>
  );
}

/**
 * 👤 Open Slot Avatar - Inviting guest placeholder with dashed squircle and gamer silhouette.
 */
export function GameOpenSlotAvatarIcon({ size = 42, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Dashed outer box */}
      <rect
        x="5"
        y="6"
        width="38"
        height="36"
        rx="10"
        fill="#F1F5F9"
        stroke="#94A3B8"
        strokeWidth="2.5"
        strokeDasharray="4 3"
      />

      {/* Gamer Head & Shoulders Silhouette */}
      <circle cx="24" cy="20" r="7" fill="#CBD5E1" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" />
      <path
        d="M14 36C14 30.5 18.5 28.5 24 28.5C29.5 28.5 34 30.5 34 36"
        fill="#CBD5E1"
        stroke="var(--mp-ink, #1B1B3A)"
        strokeWidth="2"
      />

      {/* Headset Arc & Cups */}
      <path
        d="M15 20C15 15 19 12 24 12C29 12 33 15 33 20"
        stroke="#64748B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="13.5" y="18" width="3" height="6" rx="1.5" fill="#64748B" />
      <rect x="31.5" y="18" width="3" height="6" rx="1.5" fill="#64748B" />

      {/* Inviting Plus (+) Badge on shoulder */}
      <circle cx="33" cy="13" r="5" fill="#3DDC97" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="1.8" />
      <path d="M33 10.5V15.5M30.5 13H35.5" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Mini Bot Badge Icon for status pills.
 */
export function GameBotBadgeIcon({ size = 12, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="12" height="10" rx="3" fill="#8B5CF6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="4" x2="8" y2="1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="1.5" r="1" fill="#3DDC97" />
      <circle cx="5" cy="8" r="1.2" fill="#00F2FE" />
      <circle cx="11" cy="8" r="1.2" fill="#00F2FE" />
      <path d="M5.5 11.5H10.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 💬 Comic Speech Bubble for Quick Emotes Bar label.
 */
export function GameChatIcon({ size = 15, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path
        d="M20 12C20 7.6 16.4 4 12 4C7.6 4 4 7.6 4 12C4 13.9 4.7 15.6 5.8 17L4.5 20.5L8.5 19.5C9.6 19.8 10.8 20 12 20C16.4 20 20 16.4 20 12Z"
        fill="#FFC93C"
        stroke="var(--mp-ink, #1B1B3A)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="12" r="1.4" fill="var(--mp-ink, #1B1B3A)" />
      <circle cx="12" cy="12" r="1.4" fill="var(--mp-ink, #1B1B3A)" />
      <circle cx="15.5" cy="12" r="1.4" fill="var(--mp-ink, #1B1B3A)" />
    </svg>
  );
}

/**
 * ▶ Rules Accordion Chevron with smooth vector triangle.
 */
export function GameChevronIcon({ size = 10, className = "", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path
        d="M3.5 2.5L8.5 6L3.5 9.5V2.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Devil Horn SVG for player slot emote effect.
 */
export function GameDevilHorn({
  side,
  size = 14,
}: {
  side: "left" | "right";
  size?: number;
}) {
  const isLeft = side === "left";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{
        display: "inline-block",
        transform: isLeft ? "rotate(-18deg) scaleX(-1)" : "rotate(18deg)",
        filter: "drop-shadow(1px 1.5px 0 var(--mp-ink, #1B1B3A))",
      }}
      aria-hidden="true"
    >
      <path
        d="M3 14C3.5 10 5.5 5 12 2C10 7 10.5 11 11 14C8 13.5 5.5 13.5 3 14Z"
        fill="#A855F7"
        stroke="var(--mp-ink, #1B1B3A)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 8 Game Cartoon Emote SVGs - 100% vector, playful, compatible across all OS and browsers!
 */
export function GameEmoteIcon({
  emote,
  size = 20,
}: {
  emote?: string | null;
  size?: number;
}) {
  if (!emote) return null;
  const key = emote.trim();

  // 1. 😂 Laughing with tears
  if (key === "😂" || key === "laugh") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Laugh">
        <circle cx="16" cy="16" r="14" fill="#FFD700" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.5" />
        {/* Squinting laughing eyes */}
        <path d="M8 12.5C9.5 10 12 10 13.5 12.5" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18.5 12.5C20 10 22.5 10 24 12.5" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.2" strokeLinecap="round" />
        {/* Wide laughing open mouth */}
        <path
          d="M9 16C9 22 23 22 23 16H9Z"
          fill="#831843"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Tongue */}
        <path d="M13 19C14 21.5 18 21.5 19 19H13Z" fill="#F43F5E" />
        {/* Blue Tears of Joy */}
        <path
          d="M5 14C5 12 7 13 7 14C7 15.5 5 16.5 5 14Z"
          fill="#38B6FF"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="1.5"
        />
        <path
          d="M27 14C27 12 25 13 25 14C25 15.5 27 16.5 27 14Z"
          fill="#38B6FF"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  // 2. 🔥 Cartoon Blazing Fire
  if (key === "🔥" || key === "fire") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Fire">
        <path
          d="M16 3C18 7.5 22 9.5 25 14C27.5 17.5 27 22 24.5 25.5C21.5 29.5 14 30 9.5 26.5C5.5 23.5 5 17.5 9 13.5C9.5 18 12.5 18 13.5 16C15 13 14 8 16 3Z"
          fill="#FF4D4D"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Inner flame */}
        <path
          d="M16 13C18 16 21 17.5 21 21C21 24.5 18 26.5 15.5 26.5C13 26.5 11 24 12 21C13 18 15 16 16 13Z"
          fill="#FFE66D"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  // 3. 🎉 Party Popper / Confetti Celebration
  if (key === "🎉" || key === "party") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Party">
        {/* Popper Cone */}
        <path
          d="M6 26L16 16L11 11L4 21L6 26Z"
          fill="#FFC93C"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Cone stripes */}
        <path d="M8 21L13.5 16" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 25L9.5 21.5" stroke="#38B6FF" strokeWidth="2" strokeLinecap="round" />
        {/* Bursting Confetti Stars and Streamers */}
        <circle cx="21" cy="7" r="2.2" fill="#EF4444" />
        <circle cx="26" cy="14" r="2" fill="#3DDC97" />
        <circle cx="17" cy="10" r="1.8" fill="#38B6FF" />
        <circle cx="27" cy="8" r="1.5" fill="#A855F7" />
        <path d="M18 14L22 17M20 11L25 10" stroke="#FFC93C" strokeWidth="2" strokeLinecap="round" />
        {/* Star burst */}
        <polygon points="21,3 22,5 24,5 22.5,6.5 23,8.5 21,7.5 19,8.5 19.5,6.5 18,5 20,5" fill="#FFE66D" />
      </svg>
    );
  }

  // 4. 👀 Expressive Peeking Eyes
  if (key === "👀" || key === "eyes") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Eyes">
        {/* Left Eye */}
        <ellipse cx="10" cy="16" rx="6.5" ry="9" fill="#FFFFFF" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.5" />
        <ellipse cx="12" cy="15.5" rx="3.5" ry="4.5" fill="var(--mp-ink, #1B1B3A)" />
        <circle cx="13" cy="14" r="1.3" fill="#FFFFFF" />

        {/* Right Eye */}
        <ellipse cx="22" cy="16" rx="6.5" ry="9" fill="#FFFFFF" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.5" />
        <ellipse cx="24" cy="15.5" rx="3.5" ry="4.5" fill="var(--mp-ink, #1B1B3A)" />
        <circle cx="25" cy="14" r="1.3" fill="#FFFFFF" />
      </svg>
    );
  }

  // 5. 💪 Muscular Cartoon Flex Arm
  if (key === "💪" || key === "flex") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Flex">
        <path
          d="M5 21C6 17 8 15 12 15C15 15 17 12 18 8C19 6 22 6 24 8C26 10 26 13 24 16C26 18 26 22 23 24C19 26 15 26 11 25L5 21Z"
          fill="#FFB088"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Bicep bump line */}
        <path d="M16 11C18 9.5 21 10 22 13" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2" strokeLinecap="round" />
        {/* Fist knuckle creases */}
        <path d="M22 17C21 19 19 20 16 20" stroke="#DD6B20" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  // 6. 💩 Kawaii Smiling Poop
  if (key === "💩" || key === "poop") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Poop">
        <path
          d="M16 5C17 7 15 8 18 10C22 12.5 23 15 21 18C25 19 26 23 23 26C19 28 12 28 8 26C5 23 6 19 10 18C8 15 10 12 13 10C16 8 15 6 16 5Z"
          fill="#92400E"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Kawaii Eyes */}
        <ellipse cx="12" cy="19" rx="2" ry="2.5" fill="#FFFFFF" />
        <circle cx="12.5" cy="19" r="1.3" fill="var(--mp-ink, #1B1B3A)" />
        <ellipse cx="19" cy="19" rx="2" ry="2.5" fill="#FFFFFF" />
        <circle cx="18.5" cy="19" r="1.3" fill="var(--mp-ink, #1B1B3A)" />
        {/* Happy Smile */}
        <path d="M13.5 23C14.5 24.5 16.5 24.5 17.5 23" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. 😈 Mischievous Devil
  if (key === "😈" || key === "devil") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Devil">
        {/* Horns */}
        <path d="M7 11L6 4L12 8" fill="#A855F7" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M25 11L26 4L20 8" fill="#A855F7" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Head */}
        <circle cx="16" cy="18" r="11" fill="#9333EA" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.5" />
        {/* Angled Eyebrows */}
        <path d="M9 13.5L14 16" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M23 13.5L18 16" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="2.4" strokeLinecap="round" />
        {/* Eyes */}
        <circle cx="11.5" cy="17.5" r="2" fill="#FFFFFF" />
        <circle cx="12" cy="17.5" r="1.2" fill="var(--mp-ink, #1B1B3A)" />
        <circle cx="20.5" cy="17.5" r="2" fill="#FFFFFF" />
        <circle cx="20" cy="17.5" r="1.2" fill="var(--mp-ink, #1B1B3A)" />
        {/* Sinister Grin */}
        <path
          d="M11 22C12.5 25 19.5 25 21 22H11Z"
          fill="#4C1D95"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  // 8. 👏 Clapping Cartoon Hands
  if (key === "👏" || key === "clap" || key === "GG") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Clap">
        {/* Left hand */}
        <path
          d="M8 22L13 14L17 17L11 25C9.5 26.5 7 24 8 22Z"
          fill="#FFB088"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Right hand clapping into it */}
        <path
          d="M24 22L19 14L15 17L21 25C22.5 26.5 25 24 24 22Z"
          fill="#FFB088"
          stroke="var(--mp-ink, #1B1B3A)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Clap impact sparks */}
        <path d="M16 11V6M12 9L9 6M20 9L23 6" stroke="#FFC93C" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  // Fallback for any other emoji/symbol
  return (
    <span style={{ fontSize: `${size}px`, lineHeight: 1, display: "inline-block" }}>
      {emote}
    </span>
  );
}

