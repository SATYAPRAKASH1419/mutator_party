import { useState } from "preact/hooks";
import type { RoomSettings } from "@mutator-party/shared";
import { useRulesSummary } from "./useRulesSummary";
import { GameModeList, GameRuleIcon } from "../components/GameIcons";
import { IconSettings } from "../components/Icons";
import { GameChevronIcon } from "./LobbyIcons";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = useRulesSummary(settings);

  return (
    <div className={`mp-expandable-rules ${isExpanded ? "is-expanded" : ""}`}>
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
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s ease",
            }}
          >
            <GameChevronIcon size={9} />
          </span>
          <span>Rules</span>
        </div>

        {/* Short form rules display when collapsed */}
        <div className="mp-rules-short-chips">
          <span className="mp-rules-chip"><GameRuleIcon type="match" /> {summary.rounds} Rds</span>
          <span className="mp-rules-chip"><GameModeList modes={summary.modeIcons} size={14} /></span>
          <span className="mp-rules-chip">Twists: {summary.twistsCount}</span>
          <span className="mp-rules-chip"><GameRuleIcon type="respawn" /> {summary.respawnText}</span>
          <span className="mp-rules-chip"><GameRuleIcon type="bots" /> Bots: {summary.botSkill}</span>
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
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <IconSettings size={12} />
              <span>Edit</span>
            </span>
          </button>
        )}
      </div>

      {/* Complete Rules breakdown (Visible when expanded) */}
      {isExpanded && (
        <div className="mp-rules-full-body">
          <div className="mp-rules-grid">
            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Match Length</span>
              <span className="mp-rules-item-val">
                {summary.rounds} rounds ({summary.roundTime === "auto" ? "Auto timer" : `${summary.roundTime}s`})
              </span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Game Modes</span>
              <span className="mp-rules-item-val">              <GameModeList modes={summary.modeIcons} separator /></span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Twists & Hazards</span>
              <span className="mp-rules-item-val">
                {summary.twistsCount} enabled ({summary.twistRampText})
              </span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Twist Selection</span>
              <span className="mp-rules-item-val">{summary.twistPickerText}</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Arena Layout</span>
              <span className="mp-rules-item-val">{summary.layoutText}</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Respawn & Lives</span>
              <span className="mp-rules-item-val">{summary.respawnText}</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Power-ups</span>
              <span className="mp-rules-item-val">{summary.powerUpsText}</span>
            </div>

            <div className="mp-rules-item">
              <span className="mp-rules-item-label">Arena Theme</span>
              <span className="mp-rules-item-val">{summary.themeText}</span>
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <IconSettings size={13} />
                  <span>Open Full Settings</span>
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
