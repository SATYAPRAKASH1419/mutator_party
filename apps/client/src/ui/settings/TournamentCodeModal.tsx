import { useState } from "preact/hooks";
import { decodeSettingsCode, type GameConfig } from "@mutator-party/shared";
import { IconCopy, IconCheck, IconClose } from "../components/Icons";

interface TournamentCodeModalProps {
  currentCode: string;
  onLoadCode: (config: GameConfig) => void;
  onClose: () => void;
}

export function TournamentCodeModal({
  currentCode,
  onLoadCode,
  onClose,
}: TournamentCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoad = () => {
    setErrorMsg(null);
    const decoded = decodeSettingsCode(inputCode);
    if (!decoded) {
      setErrorMsg("Invalid or corrupted 8-character code. Check and try again.");
      return;
    }
    onLoadCode(decoded);
    onClose();
  };

  return (
    <div className="mp-code-modal-backdrop" onClick={onClose}>
      <style>{`
        .mp-code-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(27, 27, 58, 0.72);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1300;
          padding: 16px;
          box-sizing: border-box;
        }

        .mp-code-modal-card {
          background: #FFF8E7;
          border: 3.5px solid #1B1B3A;
          border-radius: 22px;
          padding: 24px;
          box-shadow: 4px 6px 0 #1B1B3A;
          max-width: 420px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          box-sizing: border-box;
          animation: mpModalScale 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes mpModalScale {
          0% { transform: scale(0.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .mp-code-modal-title {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 20px;
          font-weight: 900;
          color: #1B1B3A;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mp-code-block {
          background: #FFFFFF;
          border: 2.5px solid #1B1B3A;
          border-radius: 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 2px 2px 0 #1B1B3A;
        }

        .mp-code-display {
          font-family: "Courier New", monospace;
          font-size: 22px;
          font-weight: 900;
          color: #8B5CF6;
          letter-spacing: 2px;
        }

        .mp-copy-code-btn {
          background: #FFD23F;
          border: 2px solid #1B1B3A;
          border-radius: 9999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 900;
          color: #1B1B3A;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 1.5px 1.5px 0 #1B1B3A;
          transition: transform 0.1s ease;
        }

        .mp-copy-code-btn:hover {
          transform: translateY(-1px);
        }

        .mp-input-code-row {
          display: flex;
          gap: 8px;
        }

        .mp-code-input {
          flex: 1;
          background: #FFFFFF;
          border: 2.5px solid #1B1B3A;
          border-radius: 12px;
          padding: 10px 12px;
          font-family: "Courier New", monospace;
          font-size: 16px;
          font-weight: 900;
          color: #1B1B3A;
          text-transform: uppercase;
          outline: none;
          box-shadow: 2px 2px 0 #1B1B3A;
        }

        .mp-code-input:focus {
          border-color: #8B5CF6;
        }

        .mp-load-btn {
          background: #3DDC97;
          border: 2.5px solid #1B1B3A;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 900;
          color: #1B1B3A;
          cursor: pointer;
          box-shadow: 2px 2px 0 #1B1B3A;
        }

        .mp-code-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #1B1B3A;
          background: #FFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div
        className="mp-code-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="mp-code-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <IconClose size={18} />
        </button>

        <h3 className="mp-code-modal-title">
          <span>🏆 Settings Code</span>
        </h3>

        <p style={{ fontSize: "13.5px", color: "#4A4A68", margin: 0 }}>
          Share your exact room or tournament configuration with other hosts.
        </p>

        {/* Current shareable code */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
            Current Room Code
          </span>
          <div className="mp-code-block">
            <span className="mp-code-display">{currentCode}</span>
            <button type="button" className="mp-copy-code-btn" onClick={handleCopy}>
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Load code section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
            Load Settings Code
          </span>
          <div className="mp-input-code-row">
            <input
              type="text"
              maxLength={8}
              className="mp-code-input"
              placeholder="e.g. 7K2M9N4Q"
              value={inputCode}
              onChange={(e) => setInputCode((e.target as HTMLInputElement).value)}
            />
            <button
              type="button"
              className="mp-load-btn"
              onClick={handleLoad}
              disabled={inputCode.trim().length !== 8}
            >
              Load
            </button>
          </div>
          {errorMsg && (
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF5252" }}>
              ⚠️ {errorMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export type PresetIconChoice = 'star' | 'heart' | 'flame' | 'chaos' | 'classic' | 'trophy' | 'cloud';

interface SaveCustomPresetModalProps {
  onSave: (name: string, icon: PresetIconChoice) => void;
  onClose: () => void;
}

export function SaveCustomPresetModal({ onSave, onClose }: SaveCustomPresetModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<PresetIconChoice>('star');

  const icons: Array<{ id: PresetIconChoice; emoji: string; label: string }> = [
    { id: 'star', emoji: '⭐', label: 'Star' },
    { id: 'flame', emoji: '🔥', label: 'Flame' },
    { id: 'chaos', emoji: '⚡', label: 'Chaos' },
    { id: 'classic', emoji: '🎮', label: 'Classic' },
    { id: 'trophy', emoji: '🏆', label: 'Trophy' },
    { id: 'cloud', emoji: '☁️', label: 'Cloud' },
    { id: 'heart', emoji: '❤️', label: 'Heart' },
  ];

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), icon);
    onClose();
  };

  return (
    <div className="mp-save-modal-backdrop" onClick={onClose}>
      <style>{`
        .mp-save-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(27, 27, 58, 0.72);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1300;
          padding: 16px;
          box-sizing: border-box;
        }

        .mp-save-modal-card {
          background: #FFF8E7;
          border: 3.5px solid #1B1B3A;
          border-radius: 22px;
          padding: 24px;
          box-shadow: 4px 6px 0 #1B1B3A;
          max-width: 400px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          box-sizing: border-box;
          animation: mpSaveModalScale 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes mpSaveModalScale {
          0% { transform: scale(0.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .mp-save-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #1B1B3A;
          background: #FFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 1px 1px 0 #1B1B3A;
        }

        .mp-save-modal-title {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 20px;
          font-weight: 900;
          color: #1B1B3A;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mp-save-input {
          width: 100%;
          height: 44px;
          background: #FFFFFF;
          border: 2.5px solid #1B1B3A;
          border-radius: 12px;
          padding: 0 14px;
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 15px;
          font-weight: 700;
          color: #1B1B3A;
          outline: none;
          box-sizing: border-box;
          box-shadow: 2px 2px 0 #1B1B3A;
        }

        .mp-save-input:focus {
          border-color: #8B5CF6;
        }

        .mp-icon-picker-row {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        .mp-icon-choice-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 2px solid #1B1B3A;
          background: #FFF;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 1.5px 1.5px 0 #1B1B3A;
          transition: transform 0.1s ease, background 0.1s ease;
        }

        .mp-icon-choice-btn:hover {
          transform: translate(-1px, -1px);
        }

        .mp-icon-choice-btn.is-active {
          background: #FFD23F;
          border-width: 2.5px;
          box-shadow: 2px 2px 0 #1B1B3A;
          transform: scale(1.06);
        }

        .mp-save-actions-row {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 6px;
        }

        .mp-save-modal-btn {
          height: 42px;
          padding: 0 18px;
          border-radius: 9999px;
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 14px;
          font-weight: 900;
          border: 2px solid #1B1B3A;
          cursor: pointer;
          box-shadow: 2px 2px 0 #1B1B3A;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }

        .mp-save-modal-btn:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 #1B1B3A;
        }

        .mp-save-modal-btn:active:not(:disabled) {
          transform: translate(1.5px, 1.5px);
          box-shadow: 0 0 0 #1B1B3A;
        }

        .mp-save-modal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .mp-btn-save-confirm {
          background: #3DDC97;
          color: #1B1B3A;
        }

        .mp-btn-save-cancel {
          background: #FFFBF0;
          color: #1B1B3A;
        }
      `}</style>

      <div
        className="mp-save-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Save Custom Preset"
      >
        <button
          type="button"
          className="mp-save-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <IconClose size={18} />
        </button>

        <h3 className="mp-save-modal-title">
          <span>💾 Save Custom Preset</span>
        </h3>

        <p style={{ fontSize: "13.5px", color: "#4A4A68", margin: 0, lineHeight: 1.4 }}>
          Save your current settings as a reusable one-tap preset (up to 3 presets saved locally).
        </p>

        {/* Preset Name Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#1B1B3A" }}>
            Preset Name
          </label>
          <input
            type="text"
            className="mp-save-input"
            maxLength={18}
            placeholder="e.g. Saturday Night Chaos"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            autoFocus
          />
        </div>

        {/* Icon Picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#1B1B3A" }}>
            Choose Icon
          </label>
          <div className="mp-icon-picker-row" role="radiogroup" aria-label="Preset Icon">
            {icons.map((item) => {
              const selected = icon === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mp-icon-choice-btn ${selected ? "is-active" : ""}`}
                  onClick={() => setIcon(item.id)}
                  title={item.label}
                  aria-checked={selected}
                  role="radio"
                >
                  {item.emoji}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mp-save-actions-row">
          <button
            type="button"
            className="mp-save-modal-btn mp-btn-save-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mp-save-modal-btn mp-btn-save-confirm"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save Preset
          </button>
        </div>
      </div>
    </div>
  );
}
