/**
 * Animated twinkling sparkle star for playful backgrounds
 */
export function SparkleStar({
  size = 18,
  color = "#FFD25A",
  top,
  left,
  right,
  bottom,
  delay = "0s",
}: {
  size?: number;
  color?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: string;
}) {
  return (
    <div
      className="mp-anim"
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: "none",
        zIndex: 1,
        animation: `mpTwinkle 3.5s ease-in-out ${delay} infinite`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 0 C12 8, 16 12, 24 12 C16 12, 12 16, 12 24 C12 16, 8 12, 0 12 C8 12, 12 8, 12 0 Z" />
      </svg>
    </div>
  );
}
