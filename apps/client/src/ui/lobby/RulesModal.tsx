import { useMemo, useEffect } from "preact/hooks";
import { type RoomSettings, PRESETS, isConfigEqual } from "@mutator-party/shared";
import { IconClose, IconSettings } from "../components/Icons";
import { GameModeList, GameRuleIcon, GameRulesTitleIcon } from "../components/GameIcons";

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

  const modePool = settings?.modes?.pool ?? ["brawl", "bomb", "crown"];
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

  const botsAllowed = settings?.match?.fillBots ?? true;

  const twistCount = settings?.twists?.allowed?.length ?? 11;

  const presetName = useMemo(() => {
    if (!settings) return "Chaos Party";
    if (isConfigEqual(settings, PRESETS.chaosParty.config)) return "Chaos Party";
    if (isConfigEqual(settings, PRESETS.classic.config)) return "Classic";
    if (isConfigEqual(settings, PRESETS.tournament.config)) return "Tournament";
    if (isConfigEqual(settings, PRESETS.chill.config)) return "Chill";
    return "Custom";
  }, [settings]);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="mp-rules-modal-backdrop" onClick={onClose}>
      <style>{`
        .mp-rules-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(27, 27, 58, 0.65);
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

        @keyframes mpModalBounceIn {
          from { transform: scale(0.85) translateY(8px); opacity: 0; }
          80% { transform: scale(1.04); opacity: 1; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .mp-rules-modal-card {
          background: #FFFBF0;
          border: 3.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 20px;
          box-shadow: 4px 6px 0 var(--mp-ink, #1B1B3A);
          width: min(500px, 100%);
          max-height: 85vh;
          overflow-y: auto;
          padding: 18px 20px;
          box-sizing: border-box;
          position: relative;
          animation: mpModalBounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .mp-rules-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 2px solid rgba(27, 27, 58, 0.1);
        }

        .mp-rules-modal-title {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 20px;
          font-weight: 900;
          color: var(--mp-ink, #1B1B3A);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mp-modal-close-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px solid var(--mp-ink, #1B1B3A);
          box-shadow: 1.5px 2px 0 var(--mp-ink, #1B1B3A);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--mp-ink, #1B1B3A);
          transition: transform 0.1s ease;
        }
        .mp-modal-close-btn:hover {
          transform: translateY(-1px);
        }

        .mp-modal-rule-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 0;
          border-bottom: 1.5px dashed rgba(27, 27, 58, 0.12);
          font-size: 15px;
        }

        .mp-modal-rule-label {
          color: #475569;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .mp-modal-rule-val {
          color: var(--mp-ink, #1B1B3A);
          font-weight: 900;
          text-align: right;
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
        }

        .mp-modal-twist-sub {
          font-size: 11.5px;
          color: #64748B;
          font-weight: 700;
          margin-top: 1px;
        }

        .mp-modal-hurdles-see-all {
          font-size: 12px;
          color: #8B5CF6;
          font-weight: 800;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
          background: none;
          border: none;
          padding: 0;
          line-height: 1;
        }

        .mp-modal-gotit-btn {
          width: 100%;
          margin-top: 16px;
          padding: 12px 16px;
          background: #3DDC97;
          color: var(--mp-ink, #1B1B3A);
          border: 2.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 9999px;
          font-family: var(--font-display, "Rubik", sans-serif);
          font-weight: 900;
          font-size: 16px;
          box-shadow: 2px 2px 0 var(--mp-ink, #1B1B3A);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .mp-modal-gotit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 2px 4px 0 var(--mp-ink, #1B1B3A);
        }
        .mp-modal-gotit-btn:active {
          transform: translateY(1px);
          box-shadow: 1px 1px 0 var(--mp-ink, #1B1B3A);
        }
      `}</style>
      <div
        className="mp-rules-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mp-rules-modal-header">
          <div className="mp-rules-modal-title">
            <GameRulesTitleIcon size={22} />
            <span>Game Rules</span>
            <span
              style={{
                background: "#8B5CF6",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 800,
                padding: "3px 9px",
                borderRadius: "9999px",
                border: "2px solid #1B1B3A",
                boxShadow: "1.5px 1.5px 0 #1B1B3A",
                marginLeft: "4px",
              }}
            >
              {presetName}
            </span>
          </div>
          <button
            type="button"
            className="mp-modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <IconClose size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">
            <GameRuleIcon type="match" size={17} />
            <span>Match Length</span>
          </span>
          <span className="mp-modal-rule-val">{rounds} Rounds</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">
            <GameRuleIcon type="modes" size={17} />
            <span>Game Modes</span>
          </span>
          <span className="mp-modal-rule-val">
            <GameModeList modes={modePool} />
          </span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">
            <GameRuleIcon type="twists" size={17} />
            <span>Who Picks Twist</span>
          </span>
          <span className="mp-modal-rule-val" style={{ flexDirection: "column", alignItems: "flex-end" }}>
            <span>{twistPickerText}</span>
            <span className="mp-modal-twist-sub">
              {twistPickerText === "Last place"
                ? "The player in last place chooses the next twist."
                : "Decides who picks the next twist each round."}
            </span>
          </span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">
            <GameRuleIcon type="layout" size={17} />
            <span>Twists in Pool</span>
          </span>
          <span className="mp-modal-rule-val" style={{ gap: 8 }}>
            <span>{twistCount} hurdles</span>
            <button
              type="button"
              className="mp-modal-hurdles-see-all"
              onClick={(e) => { e.stopPropagation(); }}
            >
              See all
            </button>
          </span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">
            <GameRuleIcon type="bots" size={17} />
            <span>Bots Allowed</span>
          </span>
          <span className="mp-modal-rule-val">{botsAllowed ? "Yes" : "No"}</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">
            <GameRuleIcon type="respawn" size={17} />
            <span>Respawn & Lives</span>
          </span>
          <span className="mp-modal-rule-val">{respawnText}</span>
        </div>

        <div className="mp-modal-rule-row">
          <span className="mp-modal-rule-label">
            <GameRuleIcon type="powerups" size={17} />
            <span>Powerups</span>
          </span>
          <span className="mp-modal-rule-val">{powerUpsText}</span>
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
              marginTop: "16px",
              padding: "10px 16px",
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

        {!isHost && (
          <button
            type="button"
            className="mp-modal-gotit-btn"
            onClick={onClose}
          >
            <span>Got it!</span>
          </button>
        )}
      </div>
    </div>
  );
}
