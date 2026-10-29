import { useState, useEffect } from "preact/hooks";
import type { RoomSettings } from "@mutator-party/shared";

import { CardA_MatchPlayers } from "./create-room/CardA_MatchPlayers";
import { CardB_Arena } from "./create-room/CardB_Arena";
import { CardC_Modes } from "./create-room/CardC_Modes";
import { CardD_Hurdles } from "./create-room/CardD_Hurdles";
import { CardE_Respawn } from "./create-room/CardE_Respawn";
import { CardF_Items } from "./create-room/CardF_Items";
import { CardG_Theme } from "./create-room/CardG_Theme";
import { TabH_RoomSafety } from "./create-room/TabH_RoomSafety";
import {
  isMobileOrSmallDevice,
  isAppFullscreen,
  toggleAppFullscreen,
  requestAppFullscreen,
} from "../util/fullscreen";

import { useSettingsForm } from "./settings/useSettingsForm";
import { SettingsHeader } from "./settings/SettingsHeader";
import { SettingsActions } from "./settings/SettingsActions";

export interface SettingsProps {
  initialSettings?: Partial<RoomSettings>;
  onSave: (settings: Partial<RoomSettings>) => void;
  onCancel: () => void;
}

export function Settings({
  initialSettings,
  onSave,
  onCancel,
}: SettingsProps) {
  const form = useSettingsForm({ initialSettings, onSave });

  // Fullscreen state & Device detection
  const [isFullscreen, setIsFullscreen] = useState(isAppFullscreen);
  const [isMobile, setIsMobile] = useState(isMobileOrSmallDevice);

  useEffect(() => {
    const handleOrientation = () => {
      setIsFullscreen(isAppFullscreen());
      setIsMobile(isMobileOrSmallDevice());
    };
    window.addEventListener("resize", handleOrientation);
    window.addEventListener("orientationchange", handleOrientation);
    document.addEventListener("fullscreenchange", handleOrientation);
    document.addEventListener("webkitfullscreenchange", handleOrientation);

    // Auto-enter fullscreen for mobile / small screen devices
    if (isMobileOrSmallDevice() && !isAppFullscreen()) {
      requestAppFullscreen().catch(() => {});
    }

    return () => {
      window.removeEventListener("resize", handleOrientation);
      window.removeEventListener("orientationchange", handleOrientation);
      document.removeEventListener("fullscreenchange", handleOrientation);
      document.removeEventListener("webkitfullscreenchange", handleOrientation);
    };
  }, []);

  const handleToggleFullscreen = () => {
    toggleAppFullscreen().catch(() => {});
  };

  return (
    <div className="mp-createroom-wrap">
      {/* ── Main Settings Panel ─────────────────────────────── */}
      <div className="mp-panel mp-createroom-panel">
        {/* ── Top Header Bar ───────────────────────────────── */}
        <SettingsHeader
          activePreset={form.activePreset}
          activeTab={form.activeTab}
          isFullscreen={isFullscreen}
          isMobile={isMobile}
          onApplyPreset={form.applyPreset}
          onSelectTab={form.setActiveTab}
          onToggleFullscreen={handleToggleFullscreen}
        />

        {/* ── Main Settings Content (Scrollable Body) ─────── */}
        <div className="mp-createroom-scroll">
          {form.activeTab === "rules" ? (
            <div className="mp-createroom-grid">
              {/* ════════ COLUMN 1: CARDS A, B, C ════════ */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <CardA_MatchPlayers
                  maxPlayers={form.maxPlayers}
                  minPlayersToStart={form.minPlayersToStart}
                  fillBots={form.fillBots}
                  botSkill={form.botSkill}
                  rounds={form.rounds}
                  roundTime={form.roundTime}
                  onMaxPlayersChange={(v) => { form.markCustom(); form.setMaxPlayers(v); }}
                  onMinPlayersChange={(v) => { form.markCustom(); form.setMinPlayersToStart(v); }}
                  onFillBotsChange={(v) => { form.markCustom(); form.setFillBots(v); }}
                  onBotSkillChange={(v) => { form.markCustom(); form.setBotSkill(v); }}
                  onRoundsChange={(v) => { form.markCustom(); form.setRounds(v); }}
                  onRoundTimeChange={(v) => { form.markCustom(); form.setRoundTime(v); }}
                />

                <CardB_Arena
                  platformCount={form.platformCount}
                  islandSize={form.islandSize}
                  layout={form.layout}
                  mirror={form.mirror}
                  shuffleSpawns={form.shuffleSpawns}
                  onPlatformCountChange={(v) => { form.markCustom(); form.setPlatformCount(v); }}
                  onIslandSizeChange={(v) => { form.markCustom(); form.setIslandSize(v); }}
                  onLayoutChange={(v) => { form.markCustom(); form.setLayout(v); }}
                  onMirrorChange={(v) => { form.markCustom(); form.setMirror(v); }}
                  onShuffleSpawnsChange={(v) => { form.markCustom(); form.setShuffleSpawns(v); }}
                />

                <CardC_Modes
                  selectedModes={form.selectedModes}
                  modeOrder={form.modeOrder}
                  twistPicker={form.twistPicker}
                  onToggleMode={form.toggleMode}
                  onModeOrderChange={(v) => { form.markCustom(); form.setModeOrder(v); }}
                  onTwistPickerChange={(v) => { form.markCustom(); form.setTwistPicker(v); }}
                />
              </div>

              {/* ════════ COLUMN 2: CARDS D, E, F, G ════════ */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <CardD_Hurdles
                  allowedTwists={form.allowedTwists}
                  twistsPerRound={form.twistsPerRound}
                  themeLinked={form.themeLinked}
                  onToggleTwist={form.toggleTwist}
                  onTwistsPerRoundChange={(v) => { form.markCustom(); form.setTwistsPerRound(v); }}
                  onThemeLinkedChange={(v) => { form.markCustom(); form.setThemeLinked(v); }}
                />

                <CardE_Respawn
                  respawnMode={form.respawnMode}
                  lives={form.lives}
                  delaySec={form.delaySec}
                  shieldSec={form.shieldSec}
                  onRespawnModeChange={(v) => { form.markCustom(); form.setRespawnMode(v); }}
                  onLivesChange={(v) => { form.markCustom(); form.setLives(v); }}
                  onDelaySecChange={(v) => { form.markCustom(); form.setDelaySec(v); }}
                  onShieldSecChange={(v) => { form.markCustom(); form.setShieldSec(v); }}
                />

                <CardF_Items
                  itemsEnabled={form.itemsEnabled}
                  allowedItems={form.allowedItems}
                  itemSpots={form.itemSpots}
                  firstTouch={form.firstTouch}
                  keepOnKO={form.keepOnKO}
                  onItemsEnabledChange={(v) => { form.markCustom(); form.setItemsEnabled(v); }}
                  onToggleItem={form.toggleItem}
                  onItemSpotsChange={(v) => { form.markCustom(); form.setItemSpots(v); }}
                  onFirstTouchChange={(v) => { form.markCustom(); form.setFirstTouch(v); }}
                  onKeepOnKOChange={(v) => { form.markCustom(); form.setKeepOnKO(v); }}
                />

                <CardG_Theme
                  themeMode={form.themeMode}
                  fixedTheme={form.fixedTheme}
                  onThemeModeChange={(v) => { form.markCustom(); form.setThemeMode(v); }}
                  onFixedThemeChange={(th) => { form.markCustom(); form.setFixedTheme(th); }}
                />
              </div>
            </div>
          ) : (
            <TabH_RoomSafety
              roomName={form.roomName}
              visibility={form.visibility}
              password={form.password}
              chat={form.chat}
              spectators={form.spectators}
              allowKick={form.allowKick}
              onRoomNameChange={form.setRoomName}
              onVisibilityChange={form.setVisibility}
              onPasswordChange={form.setPassword}
              onChatChange={form.setChat}
              onSpectatorsChange={form.setSpectators}
              onAllowKickChange={form.setAllowKick}
            />
          )}
        </div>
      </div>

      {/* ── Floating Action Bar ── */}
      <SettingsActions
        onReset={() => form.applyPreset(form.activePreset === "custom" ? "chaos" : form.activePreset)}
        onCancel={onCancel}
        onSave={form.handleSave}
      />
    </div>
  );
}
