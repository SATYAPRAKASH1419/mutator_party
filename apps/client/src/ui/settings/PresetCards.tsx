import { useState } from "preact/hooks";
import {
  PRESETS,
  type PresetId,
  type CustomPreset,
  type GameConfig,
} from "@mutator-party/shared";
import {
  ChaosPresetIcon,
  ClassicPresetIcon,
  TrophyPresetIcon,
  CloudPresetIcon,
  DiceIcon,
  IconCheckMark,
} from "./SettingsIcons";

interface PresetCardsProps {
  activePresetId: string;
  customPresets: CustomPreset[];
  isLocked: boolean;
  onSelectPreset: (presetId: PresetId | string, config: GameConfig) => void;
  onSaveAsCustom: () => void;
  onSurpriseMe: () => void;
  onDeleteCustomPreset?: (id: string) => void;
}

const getCustomIconEmoji = (iconKey?: string) => {
  switch (iconKey) {
    case "flame": return "🔥";
    case "chaos": return "⚡";
    case "classic": return "🎮";
    case "trophy": return "🏆";
    case "cloud": return "☁️";
    case "heart": return "❤️";
    default: return "⭐";
  }
};

export function PresetCards({
  activePresetId,
  customPresets,
  isLocked,
  onSelectPreset,
  onSaveAsCustom,
  onSurpriseMe,
  onDeleteCustomPreset,
}: PresetCardsProps) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSurpriseClick = () => {
    if (isLocked) return;
    setIsSpinning(true);
    onSurpriseMe();
    setTimeout(() => setIsSpinning(false), 500);
  };

  const standardPresets: Array<{
    id: PresetId;
    name: string;
    promise: string;
    icon: (size: number) => any;
    rounds: number;
    lives: string;
    powerUps: string;
    config: GameConfig;
  }> = [
    {
      id: "chaosParty",
      name: "Chaos Party",
      promise: "Everything goes wrong, on purpose",
      icon: (s) => <ChaosPresetIcon size={s} />,
      rounds: PRESETS.chaosParty.config.match.rounds,
      lives: "3 Lives",
      powerUps: "Power-ups On",
      config: PRESETS.chaosParty.config,
    },
    {
      id: "classic",
      name: "Classic",
      promise: "Fair, simple, quick",
      icon: (s) => <ClassicPresetIcon size={s} />,
      rounds: PRESETS.classic.config.match.rounds,
      lives: "3 Lives",
      powerUps: "2 spots",
      config: PRESETS.classic.config,
    },
    {
      id: "tournament",
      name: "Tournament",
      promise: "Competitive, no luck",
      icon: (s) => <TrophyPresetIcon size={s} />,
      rounds: PRESETS.tournament.config.match.rounds,
      lives: "3 Lives",
      powerUps: "No power-ups",
      config: PRESETS.tournament.config,
    },
    {
      id: "chill",
      name: "Chill",
      promise: "Relaxed, for friends and family",
      icon: (s) => <CloudPresetIcon size={s} />,
      rounds: PRESETS.chill.config.match.rounds,
      lives: "∞ Lives",
      powerUps: "Power-ups On",
      config: PRESETS.chill.config,
    },
  ];

  return (
    <section className="mp-presets-layer" aria-label="Game Presets">
      <style>{`
        .mp-presets-layer {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mp-presets-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
        }

        .mp-presets-heading {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 15px;
          font-weight: 900;
          color: #1B1B3A;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mp-surprise-btn {
          background: #FFD23F;
          color: #1B1B3A;
          border: 2.5px solid #1B1B3A;
          border-radius: 9999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          box-shadow: 2px 2px 0 #1B1B3A;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          min-height: 40px;
        }

        .mp-surprise-btn:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 #1B1B3A;
        }

        .mp-surprise-btn:active:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 0 0 0 #1B1B3A;
        }

        .mp-surprise-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mp-presets-carousel {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 4px 4px 12px 4px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }

        .mp-preset-card {
          flex: 0 0 196px;
          background: #FFFBF0;
          border: 3px solid #1B1B3A;
          border-radius: 20px;
          padding: 14px;
          box-shadow: 4px 4px 0 #1B1B3A;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          text-align: left;
          scroll-snap-align: start;
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease, border-color 0.15s ease;
          user-select: none;
        }

        .mp-preset-card:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 4px 7px 0 #1B1B3A;
        }

        .mp-preset-card.is-selected {
          border-color: #1B1B3A;
          background: #FFFFFF;
          box-shadow: 4px 4px 0 #FFD23F, 4px 4px 0 2px #1B1B3A;
          animation: mpBounceSmall 0.25s ease-out;
        }

        @keyframes mpBounceSmall {
          0% { transform: scale(0.96); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }

        .mp-preset-check-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 24px;
          height: 24px;
          background: #3DDC97;
          border: 2px solid #1B1B3A;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 1.5px 1.5px 0 #1B1B3A;
        }

        .mp-preset-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mp-preset-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #FFF0D4;
          border: 2px solid #1B1B3A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mp-preset-title-wrap {
          display: flex;
          flex-direction: column;
        }

        .mp-preset-name {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 16px;
          font-weight: 900;
          color: #1B1B3A;
          line-height: 1.1;
        }

        .mp-preset-promise {
          font-size: 13px;
          color: #3E3E5E;
          line-height: 1.25;
          margin: 0;
          min-height: 32px;
        }

        .mp-preset-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: auto;
        }

        .mp-stat-chip {
          font-size: 11.5px;
          font-weight: 800;
          background: #E8E5DF;
          color: #1B1B3A;
          border: 1.5px solid #1B1B3A;
          border-radius: 9999px;
          padding: 2px 7px;
          white-space: nowrap;
        }

        .mp-save-preset-card {
          flex: 0 0 160px;
          border: 3px dashed #1B1B3A;
          background: rgba(255, 251, 240, 0.6);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          text-align: center;
          cursor: pointer;
          color: #1B1B3A;
          font-weight: 800;
          font-size: 13.5px;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .mp-save-preset-card:hover:not(:disabled) {
          background: #FFFBF0;
          transform: translateY(-2px);
        }

        .mp-save-plus-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2.5px solid #1B1B3A;
          background: #FFD23F;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          box-shadow: 2px 2px 0 #1B1B3A;
        }

        .mp-custom-delete-btn {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid #1B1B3A;
          background: #FF5252;
          color: #FFF;
          font-size: 11px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 1px 1px 0 #1B1B3A;
        }
      `}</style>

      <div className="mp-presets-top-bar">
        <div className="mp-presets-heading">
          <span>🎯 Choose Preset</span>
        </div>

        <button
          type="button"
          className="mp-surprise-btn"
          onClick={handleSurpriseClick}
          disabled={isLocked}
          title="Randomize twists, theme, and mode order within sane limits"
        >
          <DiceIcon size={18} isSpinning={isSpinning} />
          <span>Surprise Me</span>
        </button>
      </div>

      <div className="mp-presets-carousel" role="radiogroup" aria-label="Game Presets">
        {/* Standard 4 Presets */}
        {standardPresets.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <div
              key={preset.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              className={`mp-preset-card ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectPreset(preset.id, preset.config)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPreset(preset.id, preset.config);
                }
              }}
            >
              {isSelected && (
                <div className="mp-preset-check-badge">
                  <IconCheckMark size={14} color="#1B1B3A" />
                </div>
              )}

              <div className="mp-preset-header">
                <div className="mp-preset-icon-wrap">{preset.icon(28)}</div>
                <div className="mp-preset-title-wrap">
                  <span className="mp-preset-name">{preset.name}</span>
                </div>
              </div>

              <p className="mp-preset-promise">{preset.promise}</p>

              <div className="mp-preset-chips">
                <span className="mp-stat-chip">🎮 {preset.rounds} Rds</span>
                <span className="mp-stat-chip">❤️ {preset.lives}</span>
                <span className="mp-stat-chip">⚡ {preset.powerUps}</span>
              </div>
            </div>
          );
        })}

        {/* User Saved Custom Presets */}
        {customPresets.map((custom) => {
          const isSelected = activePresetId === custom.id;
          return (
            <div
              key={custom.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              className={`mp-preset-card ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectPreset(custom.id, custom.config)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPreset(custom.id, custom.config);
                }
              }}
            >
              {isSelected && (
                <div className="mp-preset-check-badge">
                  <IconCheckMark size={14} color="#1B1B3A" />
                </div>
              )}

              <div className="mp-preset-header">
                <div className="mp-preset-icon-wrap">
                  <span style={{ fontSize: "22px" }}>{getCustomIconEmoji(custom.icon)}</span>
                </div>
                <div className="mp-preset-title-wrap">
                  <span className="mp-preset-name">{custom.name}</span>
                </div>
              </div>

              <p className="mp-preset-promise">Custom host preset</p>

              <div className="mp-preset-chips">
                <span className="mp-stat-chip">🎮 {custom.config.match.rounds} Rds</span>
                <span className="mp-stat-chip">
                  ❤️ {custom.config.respawn.mode === "unlimited" ? "∞" : `${custom.config.respawn.lives}L`}
                </span>
              </div>

              {onDeleteCustomPreset && (
                <button
                  type="button"
                  className="mp-custom-delete-btn"
                  title="Delete custom preset"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCustomPreset(custom.id);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {/* Dashed Save as my preset card */}
        {customPresets.length < 3 && (
          <button
            type="button"
            className="mp-save-preset-card"
            onClick={onSaveAsCustom}
            disabled={isLocked}
            title="Save current configuration as custom preset"
          >
            <div className="mp-save-plus-circle">+</div>
            <span>Save as my preset</span>
          </button>
        )}
      </div>
    </section>
  );
}

