import { useState } from "preact/hooks";
import { showToast } from "@/util/toast";
import {
  IconCopy,
  IconCheck,
  IconSettings,
  IconRules,
  IconExit,
} from "@/ui/components/Icons";

interface RoomCodeHeaderProps {
  roomCode: string;
  isHost: boolean;
  onOpenSettings?: () => void;
  onLeave?: () => void;
}

const CODE_TILE_COLORS = [
  "#FF5C5C", // Red / Coral
  "#2ECC71", // Emerald / Mint
  "#7C3AED", // Grape / Purple
  "#FFBE3C", // Sun Gold
  "#38B6FF", // Sky Cyan
  "#FF6584", // Bubble Pink
  "#FF9234", // Tangerine
  "#A855F7", // Violet
];

export function RoomCodeHeader({
  roomCode,
  isHost,
  onOpenSettings,
  onLeave,
}: RoomCodeHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    const code = (roomCode || "").toUpperCase();
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(code);
    } else {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    showToast(`Room code "${code}" copied!`, "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const codeChars = (roomCode || "MATCH").toUpperCase().slice(0, 5).split("");

  return (
    <div className="mp-room-code-header-wrap">
      <style>{`
        .mp-room-code-header-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 10px;
          flex-shrink: 0;
          user-select: none;
        }

        .mp-code-section {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .mp-code-label {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 13px;
          font-weight: 900;
          color: var(--mp-ink, #1B1B3A);
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        .mp-code-tiles-list {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mp-header-actions-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mp-header-pill-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 2px solid var(--mp-ink, #1B1B3A);
          border-radius: 9999px;
          box-shadow: 1.5px 2px 0 var(--mp-ink, #1B1B3A);
          font-family: var(--font-display, "Rubik", sans-serif);
          font-weight: 900;
          font-size: 12px;
          color: var(--mp-ink, #1B1B3A);
          cursor: pointer;
          padding: 4px 12px;
          transition: transform 0.12s ease;
          outline: none;
          white-space: nowrap;
          height: 32px;
          box-sizing: border-box;
        }

        .mp-header-pill-btn:hover {
          transform: translateY(-1.5px);
        }

        .mp-header-pill-btn:active {
          transform: translateY(1px);
          box-shadow: 0.5px 1px 0 var(--mp-ink, #1B1B3A);
        }

        .mp-btn-copy-code {
          background: #FFEAA7;
        }

        .mp-btn-copy-code.copied {
          background: #3DDC97;
          color: #065F46;
        }

        .mp-btn-settings {
          background: #FFFFFF;
        }

        .mp-btn-leave {
          background: #FFE8E8;
          color: #DC2626;
          border-color: #DC2626;
          box-shadow: 1.5px 2px 0 #DC2626;
          width: 32px;
          padding: 0;
          font-size: 15px;
        }
      `}</style>

      {/* Code Display (Click to Copy) */}
      <div
        className="mp-code-section"
        onClick={handleCopyCode}
        title="Click to copy code"
      >
        <span className="mp-code-label">Room:</span>
        <div className="mp-code-tiles-list">
          {codeChars.map((char, idx) => (
            <div
              key={`${char}_${idx}`}
              className="mp-code-tile"
              style={{
                background: CODE_TILE_COLORS[idx % CODE_TILE_COLORS.length],
              }}
            >
              {char}
            </div>
          ))}
        </div>
      </div>

      {/* Clean Right Actions */}
      <div className="mp-header-actions-group">
        {/* Copy Room Code Button */}
        <button
          type="button"
          className={`mp-header-pill-btn mp-btn-copy-code ${copied ? "copied" : ""}`}
          onClick={handleCopyCode}
          title="Copy 5-letter room code"
        >
          {copied ? (
            <>
              <IconCheck size={13} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <IconCopy size={13} />
              <span>Copy Code</span>
            </>
          )}
        </button>

        {/* Settings button */}
        {onOpenSettings && (
          <button
            type="button"
            className="mp-header-pill-btn mp-btn-settings"
            onClick={onOpenSettings}
            title={isHost ? "Edit room settings" : "View room rules"}
          >
            {isHost ? (
              <>
                <IconSettings size={13} />
                <span>Settings</span>
              </>
            ) : (
              <>
                <IconRules size={13} />
                <span>Rules</span>
              </>
            )}
          </button>
        )}

        {/* Leave Room Icon Pill */}
        {onLeave && (
          <button
            type="button"
            className="mp-header-pill-btn mp-btn-leave"
            onClick={onLeave}
            title="Leave room"
          >
            <IconExit size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
