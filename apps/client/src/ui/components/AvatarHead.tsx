import { AvatarEyes } from "./avatar/AvatarEyes";
import { AvatarMouth } from "./avatar/AvatarMouth";

export interface AvatarHeadProps {
  color: string;
  size?: number;
  emotion?: string | null;
}

/**
 * Reusable Squircle Avatar Head matching Sticker-Pop theme.
 * Features customizable color and dynamic facial expressions for emojis.
 */
export function AvatarHead({
  color,
  size = 46,
  emotion,
}: AvatarHeadProps) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.32)}px`,
        background: color,
        border: "2.5px solid var(--mp-ink, #1B1B3A)",
        boxShadow: "1.5px 2px 0 var(--mp-ink, #1B1B3A)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
        flexShrink: 0,
        transition: "transform 0.15s ease",
      }}
    >
      <AvatarEyes size={size} emotion={emotion} />
      <AvatarMouth size={size} emotion={emotion} />
    </div>
  );
}
