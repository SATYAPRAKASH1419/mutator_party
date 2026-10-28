import { useState } from "preact/hooks";
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

export type PresetType = "chaos" | "classic" | "tournament" | "chill" | "custom";

interface UseSettingsFormProps {
  initialSettings?: Partial<RoomSettings>;
  onSave: (settings: Partial<RoomSettings>) => void;
}

export function useSettingsForm({ initialSettings, onSave }: UseSettingsFormProps) {
  // Preset state & Tab switcher
  const [activePreset, setActivePreset] = useState<PresetType>("chaos");
  const [activeTab, setActiveTab] = useState<"rules" | "safety">("rules");

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

  const markCustom = () => setActivePreset("custom");

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

  return {
    activePreset,
    activeTab,
    setActiveTab,
    applyPreset,
    markCustom,
    handleSave,
    // Card A
    maxPlayers,
    setMaxPlayers,
    minPlayersToStart,
    setMinPlayersToStart,
    fillBots,
    setFillBots,
    botSkill,
    setBotSkill,
    rounds,
    setRounds,
    roundTime,
    setRoundTime,
    // Card B
    platformCount,
    setPlatformCount,
    islandSize,
    setIslandSize,
    layout,
    setLayout,
    mirror,
    setMirror,
    shuffleSpawns,
    setShuffleSpawns,
    // Card C
    selectedModes,
    modeOrder,
    setModeOrder,
    twistPicker,
    setTwistPicker,
    toggleMode,
    // Card D
    allowedTwists,
    twistsPerRound,
    setTwistsPerRound,
    themeLinked,
    setThemeLinked,
    toggleTwist,
    // Card E
    respawnMode,
    setRespawnMode,
    lives,
    setLives,
    delaySec,
    setDelaySec,
    shieldSec,
    setShieldSec,
    // Card F
    itemsEnabled,
    setItemsEnabled,
    allowedItems,
    itemSpots,
    setItemSpots,
    firstTouch,
    setFirstTouch,
    keepOnKO,
    setKeepOnKO,
    toggleItem,
    // Card G
    themeMode,
    setThemeMode,
    fixedTheme,
    setFixedTheme,
    // Tab H
    roomName,
    setRoomName,
    visibility,
    setVisibility,
    password,
    setPassword,
    chat,
    setChat,
    spectators,
    setSpectators,
    allowKick,
    setAllowKick,
  };
}

