import { useState, useEffect } from "preact/hooks";
import type { RoomSettings, GameConfig } from "@mutator-party/shared";

import { useSettingsForm } from "./settings/useSettingsForm";
import { SettingsHeader } from "./settings/SettingsHeader";
import { PresetCards } from "./settings/PresetCards";
import { QuickTweaksCard } from "./settings/QuickTweaksCard";
import { AdvancedAccordions } from "./settings/AdvancedAccordions";
import { SettingsActions } from "./settings/SettingsActions";
import { TournamentCodeModal, SaveCustomPresetModal } from "./settings/TournamentCodeModal";
import { RulesModal } from "./lobby/RulesModal";

export interface SettingsProps {
  initialSettings?: Partial<RoomSettings>;
  isHost?: boolean;
  isLocked?: boolean;
  onSave: (settings: Partial<RoomSettings>) => void;
  onCancel: () => void;
  onOpenRules?: () => void;
}

export function Settings({
  initialSettings,
  isHost = true,
  isLocked = false,
  onSave,
  onCancel,
  onOpenRules,
}: SettingsProps) {
  const form = useSettingsForm({ initialSettings, onSave });

  // Modals state
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Guard cancel/close if modified
  const handleAttemptClose = () => {
    if (form.isModified) {
      setShowUnsavedConfirm(true);
    } else {
      onCancel();
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showRulesModal) setShowRulesModal(false);
        else if (showCodeModal) setShowCodeModal(false);
        else if (showSavePresetModal) setShowSavePresetModal(false);
        else if (showResetConfirm) setShowResetConfirm(false);
        else if (showUnsavedConfirm) setShowUnsavedConfirm(false);
        else handleAttemptClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showRulesModal, showCodeModal, showSavePresetModal, showResetConfirm, showUnsavedConfirm, form.isModified]);

  const effectiveLocked = isLocked || !isHost;

  return (
    <div className="mp-settings-screen-wrap" role="dialog" aria-modal="true" aria-label="Room Settings">
      <style>{`
        .mp-settings-screen-wrap {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #9be5ff 0%, #cdefff 50%, #fff2d1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: clamp(8px, 1.5vh, 16px) clamp(10px, 2vw, 16px);
          box-sizing: border-box;
          overflow: hidden;
        }

        /* Responsive Single Centered Column (max 880px) */
        .mp-settings-main-card {
          background: var(--mp-paper, #FFF8E7);
          border: 3.5px solid #1B1B3A;
          border-radius: 24px;
          box-shadow: 4px 6px 0 #1B1B3A;
          width: 100%;
          max-width: 880px;
          height: min(900px, calc(100dvh - 24px));
          max-height: 94vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          animation: mpScaleInOvershoot 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Mobile full-screen bottom sheet with slide up */
        @media (max-width: 600px) {
          .mp-settings-screen-wrap {
            padding: 0;
            align-items: flex-end;
          }
          .mp-settings-main-card {
            max-width: 100%;
            height: 96vh;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            border-bottom: none;
            animation: mpSlideUpSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }

        @keyframes mpScaleInOvershoot {
          0% { transform: scale(0.92) translateY(12px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes mpSlideUpSheet {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }

        @keyframes mpModalPop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .mp-settings-scroll-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 20px 84px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: thin;
        }

        @media (max-width: 600px) {
          .mp-settings-scroll-body {
            padding: 12px 14px 96px 14px;
          }
        }

        /* Tournament banner note */
        .mp-tournament-note {
          background: #C4B5FD;
          border: 2.5px solid #1B1B3A;
          border-radius: 14px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          box-shadow: 2px 2px 0 #1B1B3A;
          flex-wrap: wrap;
        }

        .mp-tournament-text {
          font-size: 13px;
          font-weight: 800;
          color: #1B1B3A;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mp-code-pill-btn {
          background: #FFD23F;
          border: 2px solid #1B1B3A;
          border-radius: 9999px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 900;
          color: #1B1B3A;
          cursor: pointer;
          box-shadow: 1.5px 1.5px 0 #1B1B3A;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* Non-host Read Only Banner */
        .mp-readonly-banner {
          background: #4CC9F0;
          border: 2.5px solid #1B1B3A;
          border-radius: 14px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 800;
          color: #1B1B3A;
          box-shadow: 2px 2px 0 #1B1B3A;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Confirmation Modal System (Reset & Discard) ── */
        .mp-confirm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(27, 27, 58, 0.72);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          padding: 16px;
          box-sizing: border-box;
        }

        .mp-confirm-modal {
          background: #FFF8E7;
          border: 3.5px solid #1B1B3A;
          border-radius: 22px;
          padding: 24px 20px;
          box-shadow: 4px 6px 0 #1B1B3A;
          max-width: 380px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: center;
          animation: mpModalPop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-sizing: border-box;
        }

        .mp-confirm-title {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 20px;
          font-weight: 900;
          color: #1B1B3A;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .mp-confirm-body {
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 14px;
          font-weight: 600;
          color: #4A4A68;
          line-height: 1.5;
          margin: 0;
        }

        .mp-confirm-btns {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .mp-confirm-btn {
          height: 42px;
          padding: 0 18px;
          border-radius: 9999px;
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 13.5px;
          font-weight: 900;
          border: 2.5px solid #1B1B3A;
          cursor: pointer;
          box-shadow: 2.5px 2.5px 0 #1B1B3A;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        .mp-confirm-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3.5px 3.5px 0 #1B1B3A;
        }

        .mp-confirm-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 0 0 0 #1B1B3A;
        }

        .mp-btn-keep {
          background: #FFFBF0;
          color: #1B1B3A;
        }

        .mp-btn-danger-confirm {
          background: #FF5252;
          color: #FFFFFF;
        }

        .mp-btn-action-confirm {
          background: #3DDC97;
          color: #1B1B3A;
        }
      `}</style>

      <div className="mp-settings-main-card">
        {/* ── Header ────────────────────────────────────────── */}
        <SettingsHeader
          activePresetName={form.activePresetName}
          isModified={form.isModified}
          isLocked={effectiveLocked}
          matchPreview={form.matchPreview}
          onOpenRules={() => {
            if (onOpenRules) onOpenRules();
            else setShowRulesModal(true);
          }}
          onClose={handleAttemptClose}
        />

        {/* ── Scrollable Body ───────────────────────────────── */}
        <div className="mp-settings-scroll-body">
          {!isHost && (
            <div className="mp-readonly-banner">
              <span>👀</span>
              <span>You are viewing room settings in read-only mode. Only the host can make changes.</span>
            </div>
          )}

          {/* Tournament Mode Info Strip with share code */}
          {form.isTournament && (
            <div className="mp-tournament-note">
              <span className="mp-tournament-text">
                <span>🏆</span>
                <span>Competitive Rules: Seeded layout, 7 rounds, 0 power-ups, vote twist picker.</span>
              </span>
              <button
                type="button"
                className="mp-code-pill-btn"
                onClick={() => setShowCodeModal(true)}
              >
                <span>Code: {form.settingsCode}</span>
                <span>📋</span>
              </button>
            </div>
          )}

          {/* ════════ LAYER 1: PRESET CARDS ════════ */}
          <PresetCards
            activePresetId={form.activePresetId}
            customPresets={form.customPresets}
            isLocked={effectiveLocked}
            onSelectPreset={form.applyPreset}
            onSaveAsCustom={() => setShowSavePresetModal(true)}
            onSurpriseMe={form.surpriseMe}
            onDeleteCustomPreset={form.handleDeleteCustom}
          />

          {/* ════════ LAYER 2: QUICK TWEAKS ════════ */}
          <QuickTweaksCard
            maxPlayers={form.maxPlayers}
            onMaxPlayersChange={form.setMaxPlayers}
            fillBots={form.fillBots}
            onFillBotsChange={form.setFillBots}
            botSkill={form.botSkill}
            onBotSkillChange={form.setBotSkill}
            rounds={form.rounds}
            onRoundsChange={form.setRounds}
            roundTime={form.roundTime}
            onRoundTimeChange={form.setRoundTime}
            respawnMode={form.respawnMode}
            lives={form.lives}
            onRespawnChange={form.setRespawn}
            themeMode={form.themeMode}
            fixedTheme={form.fixedTheme}
            onThemeChange={form.setTheme}
            isTournamentLocked={form.isTournament || effectiveLocked}
          />

          {/* ════════ LAYER 3: ADVANCED ACCORDIONS ════════ */}
          <AdvancedAccordions
            data={form.advancedData}
            onChange={form.updateAdvanced}
            isTournamentLocked={effectiveLocked}
          />
        </div>

        {/* ── Floating Action Pill Bar (Host only) ───────────── */}
        {isHost && (
          <SettingsActions
            hasUnsavedChanges={form.isModified}
            isValid={form.isValid}
            validationError={form.validationError}
            onSave={form.handleSave}
            onCancel={handleAttemptClose}
            onReset={() => setShowResetConfirm(true)}
          />
        )}
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <RulesModal
          settings={form.advancedData as any}
          isHost={isHost}
          onClose={() => setShowRulesModal(false)}
        />
      )}

      {/* Tournament Settings Code Modal */}
      {showCodeModal && (
        <TournamentCodeModal
          currentCode={form.settingsCode}
          onLoadCode={(loadedConfig) => form.applyPreset("tournament", loadedConfig)}
          onClose={() => setShowCodeModal(false)}
        />
      )}

      {/* Save Custom Preset Dialog */}
      {showSavePresetModal && (
        <SaveCustomPresetModal
          onSave={form.handleSaveAsCustom}
          onClose={() => setShowSavePresetModal(false)}
        />
      )}

      {/* Reset to Preset Confirmation Modal */}
      {showResetConfirm && (
        <div className="mp-confirm-backdrop" onClick={() => setShowResetConfirm(false)}>
          <div
            className="mp-confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <h4 className="mp-confirm-title">
              <span>↺</span>
              <span>Reset Settings?</span>
            </h4>
            <p className="mp-confirm-body">
              This will restore all controls back to the clean preset defaults and discard your tweaks.
            </p>
            <div className="mp-confirm-btns">
              <button
                type="button"
                className="mp-confirm-btn mp-btn-keep"
                onClick={() => setShowResetConfirm(false)}
              >
                Keep Tweaks
              </button>
              <button
                type="button"
                className="mp-confirm-btn mp-btn-action-confirm"
                onClick={() => {
                  setShowResetConfirm(false);
                  form.resetToPreset();
                }}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal (on Cancel or Close) */}
      {showUnsavedConfirm && (
        <div className="mp-confirm-backdrop" onClick={() => setShowUnsavedConfirm(false)}>
          <div
            className="mp-confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <h4 className="mp-confirm-title">
              <span>⚠️</span>
              <span>Discard Changes?</span>
            </h4>
            <p className="mp-confirm-body">
              You have modified room settings that are not saved yet. Discard them and return to the lobby?
            </p>
            <div className="mp-confirm-btns">
              <button
                type="button"
                className="mp-confirm-btn mp-btn-keep"
                onClick={() => setShowUnsavedConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="mp-confirm-btn mp-btn-danger-confirm"
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  onCancel();
                }}
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
