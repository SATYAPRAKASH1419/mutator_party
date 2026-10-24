import { useState, useEffect } from "preact/hooks";
import {
  DEFAULTS,
  MODES,
  TWISTS,
  ITEMS,
  type RoomSettings,
  type Mode,
  type Twist,
  type Item,
  type Theme,
} from "@mutator-party/shared";

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

export interface SettingsProps {
  initialSettings?: Partial<RoomSettings>;
  onSave: (settings: Partial<RoomSettings>) => void;
  onCancel: () => void;
}

export type CreateRoomProps = SettingsProps;

export function Settings({
  initialSettings,
  onSave,
  onCancel,
}: SettingsProps) {
  // Preset state & Tab switcher
  const [activePreset, setActivePreset] = useState<
    "chaos" | "classic" | "tournament" | "chill" | "custom"
  >("chaos");
  const [activeTab, setActiveTab] = useState<"rules" | "safety">("rules");

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

  // ── Card A: Match and players ─────────────────────────────────────────────
  const [maxPlayers, setMaxPlayers] = useState(
    initialSettings?.match?.maxPlayers ?? 8,
  );
  const [minPlayersToStart, setMinPlayersToStart] = useState(
    initialSettings?.match?.minPlayersToStart ?? 2,
  );
  const [fillBots, setFillBots] = useState(
    initialSettings?.match?.fillBots ?? true,
  );
  const [botSkill, setBotSkill] = useState<"easy" | "normal" | "hard">(
    initialSettings?.match?.botSkill ?? "normal",
  );
  const [rounds, setRounds] = useState(initialSettings?.match?.rounds ?? 5);
  const [roundTime, setRoundTime] = useState<string>(
    String(initialSettings?.match?.roundTime ?? "auto"),
  );

  // ── Card B: Arena ────────────────────────────────────────────────────────
  const [platformCount, setPlatformCount] = useState(
    initialSettings?.arena?.platformCount ?? 4,
  );
  const [islandSize, setIslandSize] = useState<"S" | "M" | "L">(
    initialSettings?.arena?.islandSize ?? "M",
  );
  const [layout, setLayout] = useState<"every_round" | "per_match" | "classic">(
    initialSettings?.arena?.layout ?? "every_round",
  );
  const [mirror, setMirror] = useState(initialSettings?.arena?.mirror ?? true);
  const [shuffleSpawns, setShuffleSpawns] = useState(
    initialSettings?.arena?.shuffleSpawns ?? true,
  );

  // ── Card C: Modes and level picks ─────────────────────────────────────────
  const [selectedModes, setSelectedModes] = useState<Mode[]>(
    initialSettings?.modes?.pool ? [...initialSettings.modes.pool] : [...MODES],
  );
  const [modeOrder, setModeOrder] = useState<
    "shuffle_bag" | "random" | "fixed"
  >(initialSettings?.modes?.order ?? "shuffle_bag");
  const [twistPicker, setTwistPicker] = useState<
    "last_place" | "vote" | "host" | "random" | "round_robin"
  >(initialSettings?.modes?.twistPicker ?? "last_place");

  // ── Card D: Hurdles (twists and hazards) ───────────────────────────────────
  const [allowedTwists, setAllowedTwists] = useState<Twist[]>(
    initialSettings?.twists?.allowed
      ? [...initialSettings.twists.allowed]
      : [...TWISTS],
  );
  const [twistsPerRound, setTwistsPerRound] = useState<
    "1" | "ramp" | "2" | "3"
  >((initialSettings?.twists?.perRound as any) ?? "ramp");
  const [themeLinked, setThemeLinked] = useState(
    initialSettings?.twists?.themeLinked ?? false,
  );

  // ── Card E: Respawn and lives ─────────────────────────────────────────────
  const [respawnMode, setRespawnMode] = useState<"off" | "lives" | "unlimited">(
    initialSettings?.respawn?.mode ?? "lives",
  );
  const [lives, setLives] = useState(initialSettings?.respawn?.lives ?? 3);
  const [delaySec, setDelaySec] = useState(
    initialSettings?.respawn?.delaySec ?? 2,
  );
  const [shieldSec, setShieldSec] = useState(
    initialSettings?.respawn?.shieldSec ?? 1.5,
  );

  // ── Card F: Power-ups ─────────────────────────────────────────────────────
  const [itemsEnabled, setItemsEnabled] = useState(
    initialSettings?.items?.enabled ?? true,
  );
  const [allowedItems, setAllowedItems] = useState<Item[]>(
    initialSettings?.items?.allowed
      ? [...initialSettings.items.allowed]
      : [...ITEMS],
  );
  const [itemSpots, setItemSpots] = useState(
    initialSettings?.items?.spots ?? 3,
  );
  const [firstTouch, setFirstTouch] = useState(
    initialSettings?.items?.firstTouch ?? true,
  );
  const [keepOnKO, setKeepOnKO] = useState(
    initialSettings?.items?.keepOnKO ?? false,
  );

  // ── Card G: Theme ────────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<
    "fixed" | "rotate" | "random" | "custom"
  >(initialSettings?.theme?.mode ?? "rotate");
  const [fixedTheme, setFixedTheme] = useState<Theme>(
    initialSettings?.theme?.fixed ?? "sunny",
  );

  // ── Tab H: Room & safety ─────────────────────────────────────────────────
  const [roomName, setRoomName] = useState(initialSettings?.room?.name ?? "");
  const [visibility, setVisibility] = useState<"public" | "private">(
    initialSettings?.room?.visibility === "public" ? "public" : "private",
  );
  const [password, setPassword] = useState(
    initialSettings?.room?.password ?? "",
  );
  const [chat, setChat] = useState<"off" | "emotes" | "filtered">(
    initialSettings?.room?.chat ?? "emotes",
  );
  const [spectators, setSpectators] = useState(
    initialSettings?.room?.spectators ?? true,
  );
  const [allowKick, setAllowKick] = useState(
    initialSettings?.room?.allowKick ?? true,
  );

  // ── Presets Application ───────────────────────────────────────────────────
  const applyPreset = (preset: "classic" | "chaos" | "tournament" | "chill") => {
    setActivePreset(preset);
    if (preset === "classic") {
      setRounds(5);
      setMaxPlayers(8);
      setFillBots(true);
      setBotSkill("normal");
      setSelectedModes(["brawl", "bomb", "crown"]);
      setAllowedTwists([...TWISTS].slice(0, 5));
      setTwistsPerRound("1");
      setIslandSize("M");
      setPlatformCount(4);
      setLayout("classic");
      setMirror(true);
      setItemsEnabled(false);
      setRespawnMode("off");
    } else if (preset === "chaos") {
      setRounds(5);
      setMaxPlayers(8);
      setFillBots(true);
      setBotSkill("normal");
      setSelectedModes(["brawl", "bomb", "crown"]);
      setAllowedTwists([...TWISTS]);
      setTwistsPerRound("ramp");
      setIslandSize("M");
      setPlatformCount(4);
      setLayout("every_round");
      setMirror(false);
      setItemsEnabled(true);
      setAllowedItems([...ITEMS]);
      setItemSpots(3);
      setRespawnMode("lives");
      setLives(3);
      setDelaySec(2);
      setShieldSec(1.5);
    } else if (preset === "tournament") {
      setRounds(7);
      setMaxPlayers(8);
      setFillBots(false);
      setSelectedModes(["brawl"]);
      setAllowedTwists(["low", "ice", "speed"]);
      setTwistsPerRound("1");
      setIslandSize("L");
      setPlatformCount(4);
      setLayout("per_match");
      setMirror(true);
      setItemsEnabled(false);
      setRespawnMode("lives");
      setLives(2);
      setDelaySec(3);
      setShieldSec(1);
    } else if (preset === "chill") {
      setRounds(3);
      setMaxPlayers(6);
      setFillBots(true);
      setBotSkill("easy");
      setSelectedModes(["crown", "brawl"]);
      setAllowedTwists(["low", "bounce", "tiny"]);
      setTwistsPerRound("1");
      setIslandSize("L");
      setPlatformCount(5);
      setLayout("classic");
      setMirror(true);
      setItemsEnabled(true);
      setRespawnMode("unlimited");
      setDelaySec(1.5);
      setShieldSec(2);
    }
  };

  const markCustom = () => setActivePreset("custom");

  const toggleMode = (m: Mode) => {
    markCustom();
    if (selectedModes.includes(m)) {
      if (selectedModes.length > 1) {
        setSelectedModes(selectedModes.filter((x) => x !== m));
      }
    } else {
      setSelectedModes([...selectedModes, m]);
    }
  };

  const toggleTwist = (t: Twist) => {
    markCustom();
    if (allowedTwists.includes(t)) {
      if (allowedTwists.length > 1) {
        setAllowedTwists(allowedTwists.filter((x) => x !== t));
      }
    } else {
      setAllowedTwists([...allowedTwists, t]);
    }
  };

  const toggleItem = (it: Item) => {
    markCustom();
    if (allowedItems.includes(it)) {
      if (allowedItems.length > 1) {
        setAllowedItems(allowedItems.filter((x) => x !== it));
      }
    } else {
      setAllowedItems([...allowedItems, it]);
    }
  };

  const handleSave = () => {
    onSave({
      room: {
        name: roomName || "Custom Room",
        visibility,
        password: password || "",
        chat,
        spectators,
        allowKick,
      },
      match: {
        maxPlayers,
        minPlayersToStart,
        fillBots,
        botSkill,
        rounds,
        roundTime: roundTime === "auto" ? "auto" : Number(roundTime),
        scoring: initialSettings?.match?.scoring ?? DEFAULTS.match.scoring,
      },
      arena: {
        platformCount,
        islandSize,
        layout,
        mirror,
        shuffleSpawns,
      },
      modes: {
        pool: selectedModes,
        order: modeOrder,
        fixedList:
          initialSettings?.modes?.fixedList ??
          (DEFAULTS.modes.fixedList as Mode[]),
        twistPicker,
      },
      twists: {
        allowed: allowedTwists,
        perRound: twistsPerRound,
        themeLinked,
      },
      respawn: {
        mode: respawnMode,
        lives,
        delaySec,
        shieldSec,
        where: DEFAULTS.respawn.where,
      },
      items: {
        enabled: itemsEnabled,
        allowed: allowedItems,
        spots: itemSpots,
        firstTouch,
        keepOnKO,
      },
      theme: {
        mode: themeMode,
        fixed: fixedTheme,
        perRound: DEFAULTS.theme.perRound as Theme[],
      },
    });
  };

  return (
    <div className="mp-createroom-wrap">
      {/* Embedded Animation & Responsive Styles */}
      <style>{`
        .mp-createroom-wrap {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #7CD3FF 0%, #AEE6FF 28%, #FFF4DB 72%, #FFE5BA 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--safe-max-y, 8px) var(--safe-max-x, 14px);
          overflow-y: auto;
          overflow-x: hidden;
          box-sizing: border-box;
          -webkit-overflow-scrolling: touch;
        }

        .mp-createroom-panel {
          width: min(1040px, 100%);
          max-width: 100%;
          max-height: calc(100dvh - (var(--safe-max-y, 8px) * 2));
          height: min(880px, calc(100dvh - (var(--safe-max-y, 8px) * 2)));
          background: var(--mp-butter);
          border: 3.5px solid var(--mp-ink);
          border-radius: 20px;
          box-shadow: 4px 5px 0 var(--mp-ink);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
          position: relative;
          z-index: 10;
          margin: auto;
        }

        .mp-createroom-scroll {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          scroll-behavior: smooth;
        }

        .mp-createroom-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .mp-createroom-scroll::-webkit-scrollbar-track {
          background: rgba(27, 27, 58, 0.08);
          border-radius: 9999px;
          margin: 6px 0;
        }
        .mp-createroom-scroll::-webkit-scrollbar-thumb {
          background: var(--mp-ink);
          border-radius: 9999px;
          border: 2px solid var(--mp-butter);
        }
        .mp-createroom-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--mp-grape);
        }

        .mp-createroom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          padding: 12px 16px 64px;
          box-sizing: border-box;
          width: 100%;
          max-width: 1020px;
          margin: 0 auto;
        }

        @media (max-width: 700px) and (orientation: portrait) {
          .mp-createroom-grid {
            grid-template-columns: 1fr;
            padding: 10px 14px 60px;
            gap: 12px;
          }
          .mp-createroom-panel {
            width: 100%;
            max-height: calc(100dvh - 12px);
            height: calc(100dvh - 12px);
            border-radius: 18px;
            box-shadow: 3px 5px 0 var(--mp-ink);
          }
        }

        @media (orientation: landscape) and (max-height: 560px) {
          .mp-createroom-wrap {
            padding: max(4px, env(safe-area-inset-top, 0px)) var(--safe-max-x, 12px);
          }
          .mp-createroom-panel {
            width: min(1000px, 100%);
            max-width: 100%;
            max-height: calc(100dvh - 8px);
            height: calc(100dvh - 8px);
            margin: auto;
            border-radius: 16px;
            box-shadow: 3px 4px 0 var(--mp-ink);
          }
          .mp-createroom-grid {
            grid-template-columns: 1fr 1fr;
            padding: 8px 12px 56px;
            gap: 10px;
            max-width: 980px;
            margin: 0 auto;
          }
        }

        /* Floating Action Bar base style */
        .mp-createroom-floating-bar {
          position: fixed;
          bottom: max(14px, env(safe-area-inset-bottom, 14px));
          right: max(16px, env(safe-area-inset-right, 16px));
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 100;
          background: rgba(255, 243, 214, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 6px 10px;
          border-radius: 9999px;
          border: 2.5px solid var(--mp-ink);
          box-shadow: 3px 4px 0 var(--mp-ink);
          transition: all 0.2s ease;
        }

        /* ── Bigger Screen Optimization: Move floating buttons into the blank area ── */
        @media (min-width: 960px) {
          .mp-createroom-panel {
            width: min(920px, calc(100vw - 220px)) !important;
            max-width: calc(100vw - 220px) !important;
          }
          .mp-createroom-floating-bar {
            bottom: 24px !important;
            right: 24px !important;
          }
        }

        @keyframes mpFloatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* ── Main Settings Panel (Mockup 12) ─────────────────────────────── */}
      <div className="mp-panel mp-createroom-panel">
        {/* ── Top Header Bar (Compact & Connected) ───────────────────────── */}
        <div
          className="mp-createroom-header"
          style={{
            background: "var(--mp-night)",
            color: "var(--mp-paper)",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            borderBottom: "3px solid var(--mp-ink)",
            flexShrink: 0,
            flexWrap: "nowrap",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {/* Left: Title + Presets */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(19px, 2.4vw, 25px)",
                color: "var(--mp-sun)",
                WebkitTextStroke: "1.5px var(--mp-ink)",
                paintOrder: "stroke fill",
                textShadow: "0 2px 0 var(--mp-ink)",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              Room Settings
            </span>

            {/* Presets Chips */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                flexWrap: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 900,
                  opacity: 0.7,
                  marginRight: "2px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                }}
              >
                Presets:
              </span>
              {(
                [
                  { id: "chaos", label: "Chaos Party" },
                  { id: "classic", label: "Classic" },
                  { id: "tournament", label: "Tournament" },
                  { id: "chill", label: "Chill" },
                ] as const
              ).map((p) => {
                const isSel = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    style={{
                      background: isSel
                        ? "var(--mp-sun)"
                        : "rgba(255,255,255,0.12)",
                      color: isSel ? "var(--mp-ink)" : "var(--mp-paper)",
                      border: isSel
                        ? "1.8px solid var(--mp-ink)"
                        : "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "9999px",
                      padding: "3px 9px",
                      fontWeight: 900,
                      fontSize: "11px",
                      cursor: "pointer",
                      boxShadow: isSel ? "1.5px 1.5px 0 var(--mp-ink)" : "none",
                      transition: "all 0.1s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
              {activePreset === "custom" && (
                <span
                  style={{
                    background: "var(--mp-grape)",
                    color: "#fff",
                    borderRadius: "9999px",
                    padding: "2px 8px",
                    fontSize: "10.5px",
                    fontWeight: 900,
                    border: "1.5px solid var(--mp-ink)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Custom
                </span>
              )}
            </div>
          </div>

          {/* Right: Section Tabs + Fullscreen */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("rules")}
              style={{
                background:
                  activeTab === "rules"
                    ? "var(--mp-mint)"
                    : "rgba(255,255,255,0.12)",
                color: activeTab === "rules" ? "var(--mp-ink)" : "#fff",
                border:
                  activeTab === "rules"
                    ? "2px solid var(--mp-ink)"
                    : "1.5px solid rgba(255,255,255,0.25)",
                borderRadius: "9999px",
                padding: "4px 11px",
                fontWeight: 900,
                fontSize: "11.5px",
                cursor: "pointer",
                boxShadow:
                  activeTab === "rules" ? "1.5px 1.5px 0 var(--mp-ink)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
              }}
            >
              <span>🎮 Rules</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("safety")}
              style={{
                background:
                  activeTab === "safety"
                    ? "var(--mp-coral)"
                    : "rgba(255,255,255,0.12)",
                color: activeTab === "safety" ? "#fff" : "#fff",
                border:
                  activeTab === "safety"
                    ? "2px solid var(--mp-ink)"
                    : "1.5px solid rgba(255,255,255,0.25)",
                borderRadius: "9999px",
                padding: "4px 11px",
                fontWeight: 900,
                fontSize: "11.5px",
                cursor: "pointer",
                boxShadow:
                  activeTab === "safety" ? "1.5px 1.5px 0 var(--mp-ink)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
              }}
            >
              <span>🛡️ Room & Safety</span>
            </button>

            {/* Compact Fullscreen Toggle (Only on Desktop - mobile is always fullscreen) */}
            {!isMobile && (
              <button
                type="button"
                onClick={handleToggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                style={{
                  background: "rgba(255,255,255,0.14)",
                  color: "var(--mp-paper)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  borderRadius: "9999px",
                  padding: "4px 9px",
                  fontSize: "11px",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{isFullscreen ? "✕" : "⛶"}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Main Settings Content (Independently Scrollable Body) ─────── */}
        <div className="mp-createroom-scroll">
          {activeTab === "rules" ? (
            <div className="mp-createroom-grid">
              {/* ════════ COLUMN 1: CARDS A, B, C ════════ */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                <CardA_MatchPlayers
                  maxPlayers={maxPlayers}
                  minPlayersToStart={minPlayersToStart}
                  fillBots={fillBots}
                  botSkill={botSkill}
                  rounds={rounds}
                  roundTime={roundTime}
                  onMaxPlayersChange={(v) => {
                    markCustom();
                    setMaxPlayers(v);
                  }}
                  onMinPlayersChange={(v) => {
                    markCustom();
                    setMinPlayersToStart(v);
                  }}
                  onFillBotsChange={(v) => {
                    markCustom();
                    setFillBots(v);
                  }}
                  onBotSkillChange={(v) => {
                    markCustom();
                    setBotSkill(v);
                  }}
                  onRoundsChange={(v) => {
                    markCustom();
                    setRounds(v);
                  }}
                  onRoundTimeChange={(v) => {
                    markCustom();
                    setRoundTime(v);
                  }}
                />

                <CardB_Arena
                  platformCount={platformCount}
                  islandSize={islandSize}
                  layout={layout}
                  mirror={mirror}
                  shuffleSpawns={shuffleSpawns}
                  onPlatformCountChange={(v) => {
                    markCustom();
                    setPlatformCount(v);
                  }}
                  onIslandSizeChange={(v) => {
                    markCustom();
                    setIslandSize(v);
                  }}
                  onLayoutChange={(v) => {
                    markCustom();
                    setLayout(v);
                  }}
                  onMirrorChange={(v) => {
                    markCustom();
                    setMirror(v);
                  }}
                  onShuffleSpawnsChange={(v) => {
                    markCustom();
                    setShuffleSpawns(v);
                  }}
                />

                <CardC_Modes
                  selectedModes={selectedModes}
                  modeOrder={modeOrder}
                  twistPicker={twistPicker}
                  onToggleMode={toggleMode}
                  onModeOrderChange={(v) => {
                    markCustom();
                    setModeOrder(v);
                  }}
                  onTwistPickerChange={(v) => {
                    markCustom();
                    setTwistPicker(v);
                  }}
                />
              </div>

              {/* ════════ COLUMN 2: CARDS D, E, F, G ════════ */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                <CardD_Hurdles
                  allowedTwists={allowedTwists}
                  twistsPerRound={twistsPerRound}
                  themeLinked={themeLinked}
                  onToggleTwist={toggleTwist}
                  onTwistsPerRoundChange={(v) => {
                    markCustom();
                    setTwistsPerRound(v);
                  }}
                  onThemeLinkedChange={(v) => {
                    markCustom();
                    setThemeLinked(v);
                  }}
                />

                <CardE_Respawn
                  respawnMode={respawnMode}
                  lives={lives}
                  delaySec={delaySec}
                  shieldSec={shieldSec}
                  onRespawnModeChange={(v) => {
                    markCustom();
                    setRespawnMode(v);
                  }}
                  onLivesChange={(v) => {
                    markCustom();
                    setLives(v);
                  }}
                  onDelaySecChange={(v) => {
                    markCustom();
                    setDelaySec(v);
                  }}
                  onShieldSecChange={(v) => {
                    markCustom();
                    setShieldSec(v);
                  }}
                />

                <CardF_Items
                  itemsEnabled={itemsEnabled}
                  allowedItems={allowedItems}
                  itemSpots={itemSpots}
                  firstTouch={firstTouch}
                  keepOnKO={keepOnKO}
                  onItemsEnabledChange={(v) => {
                    markCustom();
                    setItemsEnabled(v);
                  }}
                  onToggleItem={toggleItem}
                  onItemSpotsChange={(v) => {
                    markCustom();
                    setItemSpots(v);
                  }}
                  onFirstTouchChange={(v) => {
                    markCustom();
                    setFirstTouch(v);
                  }}
                  onKeepOnKOChange={(v) => {
                    markCustom();
                    setKeepOnKO(v);
                  }}
                />

                <CardG_Theme
                  themeMode={themeMode}
                  fixedTheme={fixedTheme}
                  onThemeModeChange={(v) => {
                    markCustom();
                    setThemeMode(v);
                  }}
                  onFixedThemeChange={(th) => {
                    markCustom();
                    setFixedTheme(th);
                  }}
                />
              </div>
            </div>
          ) : (
            <TabH_RoomSafety
              roomName={roomName}
              visibility={visibility}
              password={password}
              chat={chat}
              spectators={spectators}
              allowKick={allowKick}
              onRoomNameChange={setRoomName}
              onVisibilityChange={setVisibility}
              onPasswordChange={setPassword}
              onChatChange={setChat}
              onSpectatorsChange={setSpectators}
              onAllowKickChange={setAllowKick}
            />
          )}
        </div>
      </div>

      {/* ── Floating Action Bar (Moved to blank area outside panel on bigger screens) ── */}
      <div className="mp-createroom-floating-bar">
        {/* Reset to preset defaults icon */}
        <button
          type="button"
          onClick={() =>
            applyPreset(
              activePreset === "custom" ? "chaos" : (activePreset as any),
            )
          }
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
          onClick={handleSave}
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
    </div>
  );
}
