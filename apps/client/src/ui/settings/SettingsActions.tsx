interface SettingsActionsProps {
  onReset: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function SettingsActions({
  onReset,
  onCancel,
  onSave,
}: SettingsActionsProps) {
  return (
    <div className="mp-createroom-floating-bar">
      {/* Reset to preset defaults icon */}
      <button
        type="button"
        onClick={onReset}
        className="mp-btn"
        title="Reset to preset defaults"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          padding: 0,
          background: "var(--mp-paper)",
          color: "var(--mp-ink)",
          fontSize: "18px",
          fontWeight: 900,
          border: "2px solid var(--mp-ink)",
          boxShadow: "1.5px 2px 0 var(--mp-ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ↺
      </button>

      {/* Cancel / Close Settings */}
      <button
        type="button"
        className="mp-btn"
        onClick={onCancel}
        title="Back to Lobby (Discard changes)"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          padding: 0,
          background: "var(--mp-coral)",
          color: "#fff",
          fontSize: "16px",
          fontWeight: 900,
          border: "2px solid var(--mp-ink)",
          boxShadow: "1.5px 2px 0 var(--mp-ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✕
      </button>

      {/* Save Settings button */}
      <button
        type="button"
        className="mp-btn"
        onClick={onSave}
        style={{
          background: "var(--mp-mint)",
          color: "var(--mp-ink)",
          padding: "7px 18px",
          fontSize: "14px",
          fontWeight: 900,
          border: "2.5px solid var(--mp-ink)",
          boxShadow: "2px 2px 0 var(--mp-ink)",
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>Save Settings</span>
        <span>✓</span>
      </button>
    </div>
  );
}

