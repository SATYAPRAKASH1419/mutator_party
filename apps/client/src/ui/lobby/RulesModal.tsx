import { useMemo } from "preact/hooks";
import { THEMES, type RoomSettings } from "@mutator-party/shared";
import { IconClose, IconSettings, IconRules } from "@/ui/components/Icons";

interface RulesModalProps {
  settings: Partial<RoomSettings> | null;
  isHost: boolean;
  onClose: () => void;
  onEditSettings?: () => void;
}

export function RulesModal({
  settings,
  isHost,
  onClose,
  onEditSettings,
}: RulesModalProps) {
  const rounds = settings?.match?.rounds ?? 5;
  const roundTime = settings?.match?.roundTime ?? "auto";

  const modePool = settings?.modes?.pool ?? ["brawl", "bomb", "crown"];
  const modeIcons = useMemo(() => {
    const icons: string[] = [];
    if (modePool.includes("brawl")) icons.push("🥊 Brawl");
    if (modePool.includes("bomb")) icons.push("💣 Bomb");
    if (modePool.includes("crown")) icons.push("👑 Crown");
    return icons.length > 0 ? icons.join(" • ") : "🥊 💣 👑";
  }, [modePool]);

  const twistsCount = settings?.twists?.allowed?.length ?? 11;
  const twistRampText =
    settings?.twists?.perRound === "ramp"
      ? "ramp 1 to 3"
      : `${settings?.twists?.perRound ?? 1} per round`;

  const twistPickerText = useMemo(() => {
    switch (settings?.modes?.twistPicker) {
      case "last_place":
        return "Last place";
      case "vote":
        return "Vote";
      case "host":
        return "Host";
      case "random":
        return "Random";
      case "round_robin":
        return "Round robin";
      default:
        return "Last place";
    }
  }, [settings?.modes?.twistPicker]);

  const layoutText =
    settings?.arena?.layout === "every_round"
      ? "New every round"
      : settings?.arena?.layout === "classic"
        ? "Classic"
        : "Per match";

  const respawnText = useMemo(() => {
    if (settings?.respawn?.mode === "unlimited") return "Unlimited";
    if (settings?.respawn?.mode === "off") return "1 life";
    return `${settings?.respawn?.lives ?? 3} lives`;
  }, [settings?.respawn?.mode, settings?.respawn?.lives]);

  const powerUpsText = useMemo(() => {
    if (settings?.items?.enabled === false) return "Off";
    const itemsAllowed = settings?.items?.allowed ?? ["mega", "freeze", "swap", "shield"];
    if (itemsAllowed.length === 0) return "Off";
    return `On (${settings?.items?.spots ?? 3} spots)`;
  }, [settings?.items?.enabled, settings?.items?.allowed, settings?.items?.spots]);

  const themeText = useMemo(() => {
    const mode = settings?.theme?.mode ?? "rotate";
    if (mode === "rotate") return `Rotate (${THEMES.length || 7})`;
    if (mode === "random") return "Random";
    if (mode === "custom") return "Custom";
    const th = settings?.theme?.fixed ?? "sunny";
    return th.charAt(0).toUpperCase() + th.slice(1);
  }, [settings?.theme?.mode, settings?.theme?.fixed]);

  const botSkill = settings?.match?.botSkill ?? "normal";

  return (
    <div className="mp-rules-modal-backdrop" onClick={onClose}>
      <style>{`
        .mp-rules-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(27, 27, 58, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          box-sizing: border-box;
          animation: mpFadeIn 0.15s ease-out;
        }

        @keyframes mpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .mp-rules-modal-card {
          background: #FFF8E7;
          border: 3.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 20px;
          box-shadow: 4px 6px 0 var(--mp-ink, #1B1B3A);
          width: min(500px, 100%);
          max-height: 85vh;
          overflow-y: auto;
          padding: 18px 20px;
          box-sizing: border-box;
          position: relative;
        }

        .mp-rules-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .mp-rules-modal-title {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 20px;
          font-weight: 900;
          color: var(--mp-ink, #1B1B3A);
        }

        .mp-rules-modal-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid var(--mp-ink, #1B1B3A);
          background: #FFE8E8;
          color: #DC2626;
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 1.5px 2px 0 var(--mp-ink, #1B1B3A);
        }

        .mp-modal-rule-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1.5px solid rgba(27, 27, 58, 0.08);
          font-size: 13px;
          font-weight: 800;
        }

        .mp-modal-rule-label {
          color: #64748B;
        }

        .mp-modal-rule-val {
          color: var(--mp-ink, #1B1B3A);
        }
      `}</style>

      <div
        className="mp-rules-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mp-rules-modal-header">
          <div className="mp-rules-modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconRules size={20} />
            <span>Room Rules</span>
          </div>
          <button
            type="button"
            className="mp-rules-modal-close"
            onClick={onClose}
            title="Close"
          >
            <IconClose size={14} />
          </button>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">Match Length</span>
          <span className="mp-modal-rule-val">{rounds} rounds ({roundTime === "auto" ? "Auto" : `${roundTime}s`})</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">Game Modes</span>
          <span className="mp-modal-rule-val">{modeIcons}</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">Twists & Hazards</span>
          <span className="mp-modal-rule-val">{twistsCount} on ({twistRampText})</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">Twist Selection</span>
          <span className="mp-modal-rule-val">{twistPickerText}</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">Arena Layout</span>
          <span className="mp-modal-rule-val">{layoutText}</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">Respawn & Lives</span>
          <span className="mp-modal-rule-val">{respawnText}</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">Power-ups</span>
          <span className="mp-modal-rule-val">{powerUpsText}</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">Theme</span>
          <span className="mp-modal-rule-val">{themeText}</span>
        </div>

        <div className="mp-modal-rule-row" style={{ borderBottom: "none" }}>
          <span className="mp-modal-rule-label">Bots</span>
          <span className="mp-modal-rule-val">Skill: {botSkill}</span>
        </div>

        {isHost && onEditSettings && (
          <button
            type="button"
            className="mp-btn"
            onClick={() => {
              onClose();
              onEditSettings();
            }}
            style={{
              width: "100%",
              marginTop: "14px",
              padding: "8px 16px",
              background: "#3DDC97",
              color: "var(--mp-ink)",
              border: "2.5px solid var(--mp-ink)",
              borderRadius: "9999px",
              fontWeight: 900,
              fontSize: "14px",
              boxShadow: "2px 2px 0 var(--mp-ink)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>Edit Settings in Full Screen</span>
            <IconSettings size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

