import { THEMES, type Theme } from "@mutator-party/shared";
import { ThemeArenaThumbnail } from "./SettingsIcons";

interface QuickTweaksCardProps {
  maxPlayers: number;
  onMaxPlayersChange: (v: number) => void;
  fillBots: boolean;
  onFillBotsChange: (v: boolean) => void;
  botSkill: "easy" | "normal" | "hard";
  onBotSkillChange: (v: "easy" | "normal" | "hard") => void;
  rounds: number;
  onRoundsChange: (v: number) => void;
  roundTime: "auto" | number;
  onRoundTimeChange: (v: "auto" | number) => void;
  respawnMode: "off" | "lives" | "unlimited";
  lives: number;
  onRespawnChange: (mode: "off" | "lives" | "unlimited", lives: number) => void;
  themeMode: "fixed" | "rotate" | "random" | "custom";
  fixedTheme: Theme;
  onThemeChange: (mode: "fixed" | "rotate", fixed?: Theme) => void;
  isTournamentLocked?: boolean;
}

export function QuickTweaksCard({
  maxPlayers,
  onMaxPlayersChange,
  fillBots,
  onFillBotsChange,
  botSkill,
  onBotSkillChange,
  rounds,
  onRoundsChange,
  roundTime,
  onRoundTimeChange,
  respawnMode,
  lives,
  onRespawnChange,
  themeMode,
  fixedTheme,
  onThemeChange,
  isTournamentLocked = false,
}: QuickTweaksCardProps) {
  // Stepper handlers
  const handleDecrementPlayers = () => {
    if (isTournamentLocked) return;
    if (maxPlayers > 2) onMaxPlayersChange(maxPlayers - 1);
  };
  const handleIncrementPlayers = () => {
    if (isTournamentLocked) return;
    if (maxPlayers < 8) onMaxPlayersChange(maxPlayers + 1);
  };

  const currentLivesSegment =
    respawnMode === "unlimited"
      ? "unlimited"
      : respawnMode === "off" || lives === 1
      ? 1
      : lives === 5
      ? 5
      : 3;

  return (
    <section className="mp-quick-tweaks-card" aria-label="Quick Tweaks">
      <style>{`
        .mp-quick-tweaks-card {
          background: #FFFBF0;
          border: 3px solid #1B1B3A;
          border-radius: 22px;
          padding: 16px;
          box-shadow: 4px 4px 0 #1B1B3A;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mp-quick-title-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px dashed rgba(27,27,58,0.2);
          padding-bottom: 8px;
        }

        .mp-quick-title {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 16px;
          font-weight: 900;
          color: #1B1B3A;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
        }

        .mp-quick-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        @media (min-width: 640px) {
          .mp-quick-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .mp-tweak-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mp-tweak-label {
          font-size: 13.5px;
          font-weight: 800;
          color: #1B1B3A;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mp-tweak-helper {
          font-size: 12px;
          font-weight: 600;
          color: #4A4A68;
        }

        /* Stepper Component */
        .mp-stepper {
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 2.5px solid #1B1B3A;
          border-radius: 9999px;
          overflow: hidden;
          box-shadow: 2.5px 2.5px 0 #1B1B3A;
          height: 44px;
        }

        .mp-stepper-btn {
          width: 44px;
          height: 44px;
          background: #FFD23F;
          border: none;
          color: #1B1B3A;
          font-size: 20px;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          transition: background 0.1s ease;
        }

        .mp-stepper-btn:hover:not(:disabled) {
          background: #FFC000;
        }

        .mp-stepper-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #E8E5DF;
        }

        .mp-stepper-value {
          flex: 1;
          text-align: center;
          font-size: 15px;
          font-weight: 900;
          color: #1B1B3A;
        }

        /* Segmented Buttons */
        .mp-segmented {
          display: flex;
          background: #E8E5DF;
          border: 2.5px solid #1B1B3A;
          border-radius: 9999px;
          padding: 2px;
          gap: 2px;
          box-shadow: 2px 2px 0 #1B1B3A;
          min-height: 44px;
          box-sizing: border-box;
        }

        .mp-segment-btn {
          flex: 1;
          background: transparent;
          border: none;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 800;
          color: #1B1B3A;
          cursor: pointer;
          padding: 6px 10px;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s ease;
          user-select: none;
          white-space: nowrap;
        }

        .mp-segment-btn:hover:not(.is-active):not(:disabled) {
          background: rgba(255,255,255,0.4);
        }

        .mp-segment-btn.is-active {
          background: #FFD23F;
          color: #1B1B3A;
          font-weight: 900;
          box-shadow: 1.5px 1.5px 0 #1B1B3A;
          border: 1.5px solid #1B1B3A;
        }

        .mp-segment-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Toggle Button */
        .mp-toggle-row {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
        }

        .mp-toggle-btn {
          width: 58px;
          height: 34px;
          background: #E8E5DF;
          border: 2.5px solid #1B1B3A;
          border-radius: 9999px;
          position: relative;
          cursor: pointer;
          box-shadow: 2px 2px 0 #1B1B3A;
          transition: background 0.15s ease;
          padding: 0;
          flex-shrink: 0;
        }

        .mp-toggle-btn.is-on {
          background: #3DDC97;
        }

        .mp-toggle-btn.is-disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .mp-toggle-knob {
          width: 24px;
          height: 24px;
          background: #FFFFFF;
          border: 2px solid #1B1B3A;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 3px;
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .mp-toggle-btn.is-on .mp-toggle-knob {
          transform: translateX(23px);
        }

        /* Themes Horizontal Thumbnail Scroll */
        .mp-theme-thumbnails {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 4px 2px 8px 2px;
          scrollbar-width: thin;
        }

        .mp-theme-thumb-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 56px;
        }

        .mp-theme-name {
          font-size: 11px;
          font-weight: 800;
          color: #1B1B3A;
          text-transform: capitalize;
        }
      `}</style>

      <div className="mp-quick-title-bar">
        <h3 className="mp-quick-title">
          <span>⚡ Quick Tweaks</span>
        </h3>
        <span className="mp-tweak-helper">Always visible core controls</span>
      </div>

      <div className="mp-quick-grid">
        {/* 1. Players Stepper (2 to 8) */}
        <div className="mp-tweak-item">
          <label className="mp-tweak-label">
            <span>👥 Max Players</span>
            <span className="mp-tweak-helper">2 to 8 players</span>
          </label>
          <div className="mp-stepper">
            <button
              type="button"
              className="mp-stepper-btn"
              onClick={handleDecrementPlayers}
              disabled={maxPlayers <= 2 || isTournamentLocked}
              aria-label="Decrease players"
            >
              −
            </button>
            <span className="mp-stepper-value">{maxPlayers} Players</span>
            <button
              type="button"
              className="mp-stepper-btn"
              onClick={handleIncrementPlayers}
              disabled={maxPlayers >= 8 || isTournamentLocked}
              aria-label="Increase players"
            >
              +
            </button>
          </div>
        </div>

        {/* 2. Bots Toggle + Skill */}
        <div className="mp-tweak-item">
          <div className="mp-tweak-label">
            <span>🤖 Bots</span>
            <span className="mp-tweak-helper">Fill empty slots</span>
          </div>
          <div className="mp-toggle-row">
            <button
              type="button"
              role="switch"
              aria-checked={fillBots}
              className={`mp-toggle-btn ${fillBots ? "is-on" : ""} ${isTournamentLocked ? "is-disabled" : ""}`}
              onClick={() => {
                if (!isTournamentLocked) onFillBotsChange(!fillBots);
              }}
              disabled={isTournamentLocked}
              title={isTournamentLocked ? "Locked in Tournament mode" : "Toggle bots on or off"}
            >
              <div className="mp-toggle-knob" />
            </button>

            {fillBots && (
              <div className="mp-segmented" style={{ flex: 1 }}>
                {(["easy", "normal", "hard"] as const).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className={`mp-segment-btn ${botSkill === skill ? "is-active" : ""}`}
                    onClick={() => onBotSkillChange(skill)}
                    disabled={isTournamentLocked}
                  >
                    {skill.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Rounds Segmented (3, 5, 7, 10) */}
        <div className="mp-tweak-item">
          <label className="mp-tweak-label">
            <span>🎮 Rounds</span>
            <span className="mp-tweak-helper">{rounds} total rounds</span>
          </label>
          <div className="mp-segmented">
            {[3, 5, 7, 10].map((r) => (
              <button
                key={r}
                type="button"
                className={`mp-segment-btn ${rounds === r ? "is-active" : ""}`}
                onClick={() => onRoundsChange(r)}
                disabled={isTournamentLocked}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Round Time Segmented (Auto, 45s, 60s, 90s) */}
        <div className="mp-tweak-item">
          <label className="mp-tweak-label">
            <span>⏱️ Round Time</span>
            <span className="mp-tweak-helper">Duration per round</span>
          </label>
          <div className="mp-segmented">
            {(["auto", 45, 60, 90] as const).map((t) => {
              const isActive = roundTime === t;
              return (
                <button
                  key={t}
                  type="button"
                  className={`mp-segment-btn ${isActive ? "is-active" : ""}`}
                  onClick={() => onRoundTimeChange(t)}
                  disabled={isTournamentLocked}
                >
                  {t === "auto" ? "Auto" : `${t}s`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Lives Segmented (1, 3, 5, Unlimited) */}
        <div className="mp-tweak-item">
          <label className="mp-tweak-label">
            <span>❤️ Lives</span>
            <span className="mp-tweak-helper">Knockout rules</span>
          </label>
          <div className="mp-segmented">
            {([1, 3, 5, "unlimited"] as const).map((l) => {
              const isActive = currentLivesSegment === l;
              return (
                <button
                  key={l}
                  type="button"
                  className={`mp-segment-btn ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    if (l === "unlimited") {
                      onRespawnChange("unlimited", 3);
                    } else if (l === 1) {
                      onRespawnChange("off", 1);
                    } else {
                      onRespawnChange("lives", l);
                    }
                  }}
                  disabled={isTournamentLocked}
                >
                  {l === "unlimited" ? "Unlimited" : `${l} ${l === 1 ? "Life" : "Lives"}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Theme: Thumbnail picker with Rotate option */}
        <div className="mp-tweak-item" style={{ gridColumn: "1 / -1" }}>
          <label className="mp-tweak-label">
            <span>🎨 Arena Theme</span>
            <span className="mp-tweak-helper">Visual backdrop & hazards</span>
          </label>
          <div className="mp-theme-thumbnails" role="radiogroup" aria-label="Arena Theme">
            {/* Rotate option */}
            <button
              type="button"
              className="mp-theme-thumb-btn"
              onClick={() => onThemeChange("rotate")}
              disabled={isTournamentLocked}
              title="Rotate themes every round"
            >
              <ThemeArenaThumbnail
                theme="rotate"
                isSelected={themeMode === "rotate"}
              />
              <span className="mp-theme-name">Rotate</span>
            </button>

            {/* All Themes */}
            {THEMES.map((th) => {
              const isSelected = themeMode === "fixed" && fixedTheme === th;
              return (
                <button
                  key={th}
                  type="button"
                  className="mp-theme-thumb-btn"
                  onClick={() => onThemeChange("fixed", th)}
                  disabled={isTournamentLocked}
                  title={`${th} theme arena`}
                >
                  <ThemeArenaThumbnail
                    theme={th}
                    isSelected={isSelected}
                  />
                  <span className="mp-theme-name">{th}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

