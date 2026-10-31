import { useState, useEffect } from "preact/hooks";
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
  const [invitationLinkCopied, setInvitationLinkCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Dismiss leave modal on Escape
  useEffect(() => {
    if (!showLeaveModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLeaveModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLeaveModal]);

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

  const handleCopyInvitationLink = async () => {
    const inviteUrl = new URL(window.location.href);
    inviteUrl.pathname = `/r/${(roomCode || "").toUpperCase()}`;
    inviteUrl.search = "";
    inviteUrl.hash = "";
    const link = inviteUrl.toString();

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(link);
    } else {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setInvitationLinkCopied(true);
    showToast("Invite link copied!", "success");
    setTimeout(() => setInvitationLinkCopied(false), 2000);
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

        /* ── Leave Room Confirmation Modal ── */
        .mp-leave-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(27, 27, 58, 0.72);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          padding: 16px;
          box-sizing: border-box;
        }

        .mp-leave-modal-card {
          background: #FFF8E7;
          border: 3.5px solid #1B1B3A;
          border-radius: 22px;
          padding: 24px 20px;
          box-shadow: 4px 6px 0 #1B1B3A;
          max-width: 380px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          text-align: center;
          animation: mpLeaveModalPop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-sizing: border-box;
        }

        @keyframes mpLeaveModalPop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .mp-leave-modal-title {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 20px;
          font-weight: 900;
          color: #1B1B3A;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .mp-leave-modal-body {
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 14px;
          font-weight: 600;
          color: #4A4A68;
          line-height: 1.45;
          margin: 0;
        }

        .mp-leave-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 4px;
        }

        .mp-leave-btn {
          height: 42px;
          padding: 0 18px;
          border-radius: 9999px;
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 14px;
          font-weight: 900;
          border: 2.5px solid #1B1B3A;
          cursor: pointer;
          box-shadow: 2.5px 2.5px 0 #1B1B3A;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        .mp-leave-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3.5px 3.5px 0 #1B1B3A;
        }

        .mp-leave-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 0 0 0 #1B1B3A;
        }

        .mp-btn-stay {
          background: #FFFBF0;
          color: #1B1B3A;
        }

        .mp-btn-confirm-leave {
          background: #FF5252;
          color: #FFFFFF;
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
        {/* Invite link */}
        <button
          type="button"
          className={`mp-header-pill-btn mp-btn-copy-code ${invitationLinkCopied ? "copied" : ""}`}
          onClick={handleCopyInvitationLink}
          title="Copy invitation link"
        >
          {invitationLinkCopied ? (
            <>
              <IconCheck size={13} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <IconCopy size={13} />
              <span>Copy Invitation Link</span>
            </>
          )}
        </button>

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
            onClick={() => setShowLeaveModal(true)}
            title="Leave room"
          >
            <IconExit size={15} />
          </button>
        )}
      </div>

      {/* Leave Room Confirmation Modal */}
      {showLeaveModal && (
        <div className="mp-leave-modal-backdrop" onClick={() => setShowLeaveModal(false)}>
          <div
            className="mp-leave-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label="Leave Room Confirmation"
          >
            <h4 className="mp-leave-modal-title">
              <span>🚪</span>
              <span>Leave Room?</span>
            </h4>
            <p className="mp-leave-modal-body">
              Are you sure you want to leave this room and return to the main menu?
            </p>
            <div className="mp-leave-modal-actions">
              <button
                type="button"
                className="mp-leave-btn mp-btn-stay"
                onClick={() => setShowLeaveModal(false)}
              >
                Stay
              </button>
              <button
                type="button"
                className="mp-leave-btn mp-btn-confirm-leave"
                onClick={() => {
                  setShowLeaveModal(false);
                  onLeave?.();
                }}
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
