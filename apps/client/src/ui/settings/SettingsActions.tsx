import { IconCheckMark } from "./SettingsIcons";

interface SettingsActionsProps {
  hasUnsavedChanges: boolean;
  isValid: boolean;
  validationError?: string | null;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  isMobile?: boolean;
}

export function SettingsActions({
  hasUnsavedChanges,
  isValid,
  validationError,
  onSave,
  onCancel,
  onReset,
}: SettingsActionsProps) {
  return (
    <div className="mp-settings-actions-floating" role="toolbar" aria-label="Settings actions">
      <style>{`
        /* ── Compact Floating Pill Bar of Lesser Width ── */
        .mp-settings-actions-floating {
          position: absolute;
          bottom: calc(10px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          width: fit-content;
          max-width: calc(100% - 24px);
          background: var(--mp-paper, #FFF8E7);
          border: 3px solid #1B1B3A;
          border-radius: 9999px;
          box-shadow: 0 6px 20px rgba(27,27,58,0.25), 3px 3px 0 #1B1B3A;
          padding: 5px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          z-index: 50;
          box-sizing: border-box;
          user-select: none;
          pointer-events: auto;
        }

        /* Small devices / Mobile: Move floating bar to the right */
        @media (max-width: 768px), (max-height: 600px), (pointer: coarse) {
          .mp-settings-actions-floating {
            left: auto;
            right: calc(14px + env(safe-area-inset-right, 0px));
            transform: none;
          }

          .mp-validation-error-floating {
            left: auto !important;
            right: 0 !important;
            transform: none !important;
          }
        }

        .mp-floating-divider {
          width: 2px;
          height: 22px;
          background: #1B1B3A;
          opacity: 0.2;
          border-radius: 1px;
        }

        /* Base button styles */
        .mp-pill-btn {
          font-family: var(--font-body, system-ui, sans-serif);
          font-weight: 900;
          border: 2px solid #1B1B3A;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          user-select: none;
          white-space: nowrap;
          box-sizing: border-box;
        }

        .mp-pill-btn:hover:not(:disabled) {
          transform: translate(-1px, -1px);
        }

        .mp-pill-btn:active:not(:disabled) {
          transform: translate(1.5px, 1.5px);
          box-shadow: none !important;
        }

        .mp-pill-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none !important;
        }

        /* Circular icon-only buttons for Reset and Cancel */
        .mp-icon-only-btn {
          width: 36px;
          min-width: 36px;
          height: 36px;
          min-height: 36px;
          padding: 0;
          border-radius: 50%;
          font-size: 16px;
          line-height: 1;
        }

        .mp-btn-reset-icon {
          background: #E8E5DF;
          color: #1B1B3A;
          box-shadow: 2px 2px 0 #1B1B3A;
        }

        .mp-btn-reset-icon:hover:not(:disabled) {
          box-shadow: 2.5px 2.5px 0 #1B1B3A;
          background: #DDD9D1;
        }

        .mp-btn-cancel-icon {
          background: #FFFBF0;
          color: #1B1B3A;
          box-shadow: 2px 2px 0 #1B1B3A;
        }

        .mp-btn-cancel-icon:hover:not(:disabled) {
          box-shadow: 2.5px 2.5px 0 #1B1B3A;
          background: #F4EEDC;
        }

        /* Save button: text with checkmark icon */
        .mp-btn-save-pill {
          height: 36px;
          min-height: 36px;
          padding: 0 16px;
          border-radius: 9999px;
          font-size: 13.5px;
          gap: 6px;
          background: #3DDC97;
          color: #1B1B3A;
          box-shadow: 2px 2px 0 #1B1B3A;
        }

        .mp-btn-save-pill:hover:not(:disabled) {
          box-shadow: 3px 3px 0 #1B1B3A;
          background: #33C787;
        }

        /* Floating validation error bubble directly above the pill */
        .mp-validation-error-floating {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          font-size: 11.5px;
          font-weight: 800;
          color: #FF5252;
          background: #FFFBF0;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 2px solid #1B1B3A;
          box-shadow: 2px 2px 0 #1B1B3A;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 60;
        }
      `}</style>

      {/* Floating validation error if any */}
      {validationError && (
        <div className="mp-validation-error-floating">
          <span>⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Reset to preset: circular icon only button (↺) */}
      <button
        type="button"
        className="mp-pill-btn mp-icon-only-btn mp-btn-reset-icon"
        onClick={onReset}
        title="Reset configuration back to preset defaults"
        aria-label="Reset to preset"
      >
        <span>↺</span>
      </button>

      <div className="mp-floating-divider" aria-hidden="true" />

      {/* Cancel: circular icon only button (✕) */}
      <button
        type="button"
        className="mp-pill-btn mp-icon-only-btn mp-btn-cancel-icon"
        onClick={onCancel}
        title="Cancel and discard changes"
        aria-label="Cancel"
      >
        <span>✕</span>
      </button>

      {/* Save settings: text with icon (✓ Save) */}
      <button
        type="button"
        className="mp-pill-btn mp-btn-save-pill"
        onClick={onSave}
        disabled={!isValid}
        title={isValid ? "Save and broadcast room settings" : "Fix invalid settings to save"}
        aria-label="Save settings"
      >
        <IconCheckMark size={14} />
        <span>Save</span>
      </button>
    </div>
  );
}
