import { IconRules, IconClose } from "../components/Icons";
import { IconLock } from "./SettingsIcons";

interface SettingsHeaderProps {
  activePresetName: string;
  isModified: boolean;
  isLocked: boolean;
  matchPreview: string;
  onOpenRules: () => void;
  onClose: () => void;
}

export function SettingsHeader({
  activePresetName,
  isModified,
  isLocked,
  matchPreview,
  onOpenRules,
  onClose,
}: SettingsHeaderProps) {
  return (
    <header className="mp-settings-header-container">
      <style>{`
        .mp-settings-header-container {
          background: var(--mp-paper, #FFF8E7);
          color: #1B1B3A;
          padding: 12px 18px 10px 18px;
          border-bottom: 3.5px solid #1B1B3A;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          position: sticky;
          top: 0;
          z-index: 20;
          user-select: none;
        }

        .mp-settings-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .mp-settings-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .mp-settings-title {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: clamp(20px, 3.2vw, 26px);
          font-weight: 900;
          color: #1B1B3A;
          letter-spacing: 0.5px;
          line-height: 1;
          margin: 0;
        }

        .mp-preset-badge {
          background: #8B5CF6;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 2px solid #1B1B3A;
          box-shadow: 2px 2px 0 #1B1B3A;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }

        .mp-preset-badge.is-modified {
          background: #7952D9;
          font-style: normal;
        }

        .mp-locked-badge {
          background: #FF5252;
          color: #FFFFFF;
          font-size: 12.5px;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 9999px;
          border: 2px solid #1B1B3A;
          box-shadow: 2px 2px 0 #1B1B3A;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }

        .mp-settings-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mp-header-btn {
          height: 38px;
          padding: 0 12px;
          border-radius: 9999px;
          font-size: 13.5px;
          font-weight: 900;
          border: 2.5px solid #1B1B3A;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          box-shadow: 2.5px 2.5px 0 #1B1B3A;
          min-width: 44px;
          min-height: 44px;
        }

        .mp-header-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3.5px 3.5px 0 #1B1B3A;
        }

        .mp-header-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 0 0 0 #1B1B3A;
        }

        .mp-btn-rules {
          background: #4CC9F0;
          color: #1B1B3A;
        }

        .mp-btn-close {
          background: #FFFFFF;
          color: #1B1B3A;
          width: 44px;
          height: 44px;
          padding: 0;
          border-radius: 50%;
        }

        .mp-match-preview-strip {
          font-size: 13.5px;
          font-weight: 800;
          color: #4A4A68;
          display: flex;
          align-items: center;
          gap: 6px;
          padding-top: 2px;
        }
      `}</style>

      <div className="mp-settings-header-top">
        <div className="mp-settings-title-group">
          <h2 className="mp-settings-title">Room Settings</h2>

          <div
            className={`mp-preset-badge ${isModified ? "is-modified" : ""}`}
            title={isModified ? "Settings have been tweaked from preset" : "Preset active"}
          >
            <span>{activePresetName}{isModified ? " (modified)" : ""}</span>
          </div>

          {isLocked && (
            <div className="mp-locked-badge" title="Match is in progress or Tournament locked">
              <IconLock size={14} />
              <span>Settings locked</span>
            </div>
          )}
        </div>

        <div className="mp-settings-header-actions">
          <button
            type="button"
            className="mp-header-btn mp-btn-rules"
            onClick={onOpenRules}
            aria-label="View Game Rules"
            title="Read Rules"
          >
            <IconRules size={18} />
            <span>Rules</span>
          </button>

          <button
            type="button"
            className="mp-header-btn mp-btn-close"
            onClick={onClose}
            aria-label="Close Settings"
            title="Close"
          >
            <IconClose size={20} />
          </button>
        </div>
      </div>

      {/* Live Match Preview Line */}
      <div className="mp-match-preview-strip">
        <span>⚡</span>
        <span>{matchPreview}</span>
      </div>
    </header>
  );
}
