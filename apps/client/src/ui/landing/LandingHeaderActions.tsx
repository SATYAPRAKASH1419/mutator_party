import { IconFullscreen, IconMinimize } from "../components/Icons";

interface LandingHeaderActionsProps {
  isMobile: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function LandingHeaderActions({
  isMobile,
  isFullscreen,
  onToggleFullscreen,
}: LandingHeaderActionsProps) {
  if (isMobile) return null;

  return (
    <button
      type="button"
      onClick={onToggleFullscreen}
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
  );
}

