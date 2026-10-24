import { useState, useMemo } from "preact/hooks";
import { THEMES, type RoomSettings } from "@mutator-party/shared";

interface ExpandableRulesProps {
  settings: Partial<RoomSettings> | null;
  isHost: boolean;
  onEditRules?: () => void;
}

export function ExpandableRules({
  settings,
  isHost,
  onEditRules,
}: ExpandableRulesProps) {
  // Collapsed by default as requested by user
  const [isExpanded, setIsExpanded] = useState(false);

  const rounds = settings?.match?.rounds ?? 5;
  const roundTime = settings?.match?.roundTime ?? "auto";

  // Active Modes
  const modePool = settings?.modes?.pool ?? ["brawl", "bomb", "crown"];
  const modeIcons = useMemo(() => {
    const icons: string[] = [];
    if (modePool.includes("brawl")) icons.push("🥊 Brawl");
    if (modePool.includes("bomb")) icons.push("💣 Bomb");
    if (modePool.includes("crown")) icons.push("👑 Crown");
    return icons.length > 0 ? icons.join(" • ") : "🥊 💣 👑";
  }, [modePool]);

  // Twists Summary
  const twistsCount = settings?.twists?.allowed?.length ?? 11;
  const twistRampText =
    settings?.twists?.perRound === "ramp"
      ? "ramp 1 to 3"
      : `${settings?.twists?.perRound ?? 1} per round`;

  // Twist Picker text
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

  // Layout text
  const layoutText =
    settings?.arena?.layout === "every_round"
      ? "New every round"
      : settings?.arena?.layout === "classic"
        ? "Classic"
        : "Per match";

  // Respawn text
  const respawnText = useMemo(() => {
    if (settings?.respawn?.mode === "unlimited") return "Unlimited";
    if (settings?.respawn?.mode === "off") return "1 life";
    return `${settings?.respawn?.lives ?? 3} lives`;
  }, [settings?.respawn?.mode, settings?.respawn?.lives]);

  // Power-ups text
  const powerUpsText = useMemo(() => {
    if (settings?.items?.enabled === false) return "Off";
    const itemsAllowed = settings?.items?.allowed ?? ["mega", "freeze", "swap", "shield"];
    if (itemsAllowed.length === 0) return "Off";
    return `On (${settings?.items?.spots ?? 3} spots)`;
  }, [settings?.items?.enabled, settings?.items?.allowed, settings?.items?.spots]);

  // Theme text
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
    <div className={`mp-expandable-rules ${isExpanded ? "is-expanded" : ""}`}>
      <style>{`
        .mp-expandable-rules {
          width: 100%;
          background: #FFFFFF;
          border: 2px solid var(--mp-ink, #1B1B3A);
          border-radius: 14px;
          box-shadow: 1.5px 2px 0 var(--mp-ink, #1B1B3A);
          overflow: hidden;
          transition: all 0.2s ease;
          box-sizing: border-box;
          margin-bottom: 2px;
          flex-shrink: 0;
        }

        .mp-rules-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3px 8px;
          cursor: pointer;
          background: #FFF9ED;
          gap: 6px;
          user-select: none;
          transition: background 0.15s ease;
          min-height: 28px;
          box-sizing: border-box;
        }

        .mp-rules-header-bar:hover {
          background: #FFF0D4;
        }

        .mp-rules-toggle-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #FFC93C;
          border: 1.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 9999px;
          box-shadow: 1px 1px 0 var(--mp-ink, #1B1B3A);
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 11.5px;
          font-weight: 900;
          color: var(--mp-ink, #1B1B3A);
          padding: 2px 8px;
          cursor: pointer;
          white-space: nowrap;
          outline: none;
          transition: transform 0.12s ease;
        }

        .mp-rules-toggle-btn:hover {
          transform: translateY(-1px);
        }

        .mp-rules-triangle {
          display: inline-block;
          font-size: 10px;
          transition: transform 0.2s ease;
          line-height: 1;
        }

        .mp-rules-short-chips {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          white-space: nowrap;
          flex: 1;
        }
        .mp-rules-short-chips::-webkit-scrollbar {
          display: none;
        }

        .mp-rules-chip {
          background: #F1F5F9;
          border: 1.5px solid rgba(27, 27, 58, 0.2);
          border-radius: 8px;
          padding: 2px 7px;
          font-size: 11px;
          font-weight: 800;
          color: var(--mp-ink, #1B1B3A);
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .mp-rules-full-body {
          padding: 8px 12px 10px;
          background: #FFFFFF;
          border-top: 1.5px dashed rgba(27, 27, 58, 0.15);
          animation: mpRulesSlideDown 0.2s ease-out;
          max-height: clamp(140px, 32vh, 220px);
          overflow-y: auto;
          box-sizing: border-box;
        }

        @keyframes mpRulesSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mp-rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px 16px;
          margin-bottom: 10px;
        }

        .mp-rules-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          font-weight: 800;
          padding: 3px 0;
          border-bottom: 1px solid rgba(27, 27, 58, 0.06);
        }

        .mp-rules-item-label {
          color: #64748B;
        }

        .mp-rules-item-val {
          color: var(--mp-ink, #1B1B3A);
        }

        .mp-btn-edit-rules {
          background: #FFEAA7;
          border: 2px solid var(--mp-ink, #1B1B3A);
          border-radius: 9999px;
          box-shadow: 1.5px 2px 0 var(--mp-ink, #1B1B3A);
          font-size: 12px;
          font-weight: 900;
          color: var(--mp-ink, #1B1B3A);
          padding: 4px 14px;
          cursor: pointer;
          outline: none;
          transition: transform 0.12s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .mp-btn-edit-rules:hover {
          transform: translateY(-1px);
        }

        .mp-btn-edit-rules:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>

      {/* Header Row: [ ▶ Rules ] + Short Chips */}
      <div
        className="mp-rules-header-bar"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        {/* Expandable Triangle Button */}
        <div className="mp-rules-toggle-btn">
          <span
            className="mp-rules-triangle"
            style={{
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ▶
          </span>
          <span>Rules</span>
        </div>

        {/* Short form rules display when collapsed */}
        <div className="mp-rules-short-chips">
          <span className="mp-rules-chip">🏆 {rounds} Rds</span>
          <span className="mp-rules-chip">🎮 {modeIcons}</span>
          <span className="mp-rules-chip">🌀 {twistsCount} Twists</span>
          <span className="mp-rules-chip">❤️ {respawnText}</span>
          <span className="mp-rules-chip">🤖 Bots: {botSkill}</span>
        </div>

        {/* Edit Rules Pill (Host only) */}
        {isHost && (
          <button
            type="button"
            className="mp-btn-edit-rules"
            onClick={(e) => {
              e.stopPropagation();
              onEditRules?.();
            }}
            title="Configure room settings"
          >
            <span>⚙️ Edit</span>
          </button>
        )}
      </div>

      {/* Complete Rules breakdown (Visible when expanded) */}
      {isExpanded && (
        <div className="mp-rules-full-body">
          <div className="mp-rules-grid">
            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Match Length</span>
              <span className="mp-rules-item-val">{rounds} rounds ({roundTime === "auto" ? "Auto timer" : `${roundTime}s`})</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Game Modes</span>
              <span className="mp-rules-item-val">{modeIcons}</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Twists & Hazards</span>
              <span className="mp-rules-item-val">{twistsCount} enabled ({twistRampText})</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Twist Selection</span>
              <span className="mp-rules-item-val">{twistPickerText}</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Arena Layout</span>
              <span className="mp-rules-item-val">{layoutText}</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Respawn & Lives</span>
              <span className="mp-rules-item-val">{respawnText}</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Power-ups</span>
              <span className="mp-rules-item-val">{powerUpsText}</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Arena Theme</span>
              <span className="mp-rules-item-val">{themeText}</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(27, 27, 58, 0.08)",
              paddingTop: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748B",
              }}
            >
              {isHost
                ? "You are the host. You can customize all room rules before starting."
                : "Host controls the room rules."}
            </span>

            {isHost && (
              <button
                type="button"
                className="mp-btn-edit-rules"
                onClick={onEditRules}
              >
                <span>⚙️ Open Full Settings</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

