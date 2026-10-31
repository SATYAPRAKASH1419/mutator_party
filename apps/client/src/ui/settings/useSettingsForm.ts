import { useState, useMemo, useEffect } from "preact/hooks";
import {
  type GameConfig,
  type PresetId,
  type CustomPreset,
  type Mode,
  type Twist,
  type Item,
  type Theme,
  PRESETS,
  MODES,
  TWISTS,
  THEMES,
  HARSH_TWISTS,
  computeMatchPreview,
  isConfigEqual,
  encodeSettingsCode,
} from "@mutator-party/shared";
import {
  loadLastUsedConfig,
  saveLastUsedConfig,
  loadCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
} from "./settingsStorage";

export interface UseSettingsFormProps {
  initialSettings?: Partial<GameConfig>;
  onSave: (settings: Partial<GameConfig>) => void;
}

export function useSettingsForm({ initialSettings, onSave }: UseSettingsFormProps) {
  // Load initial configuration (host's last-used config or initialSettings fallback)
  const baseConfig: GameConfig = useMemo(() => {
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      return {
        ...PRESETS.chaosParty.config,
        ...initialSettings,
        room: { ...PRESETS.chaosParty.config.room, ...(initialSettings.room || {}) },
        match: { ...PRESETS.chaosParty.config.match, ...(initialSettings.match || {}) },
        arena: { ...PRESETS.chaosParty.config.arena, ...(initialSettings.arena || {}) },
        modes: { ...PRESETS.chaosParty.config.modes, ...(initialSettings.modes || {}) },
        twists: { ...PRESETS.chaosParty.config.twists, ...(initialSettings.twists || {}) },
        respawn: { ...PRESETS.chaosParty.config.respawn, ...(initialSettings.respawn || {}) },
        items: { ...PRESETS.chaosParty.config.items, ...(initialSettings.items || {}) },
        theme: { ...PRESETS.chaosParty.config.theme, ...(initialSettings.theme || {}) },
      };
    }
    return loadLastUsedConfig();
  }, []);

  // Determine which preset matches the initial config
  const initialPresetId: string = useMemo(() => {
    if (isConfigEqual(baseConfig, PRESETS.chaosParty.config)) return "chaosParty";
    if (isConfigEqual(baseConfig, PRESETS.classic.config)) return "classic";
    if (isConfigEqual(baseConfig, PRESETS.tournament.config)) return "tournament";
    if (isConfigEqual(baseConfig, PRESETS.chill.config)) return "chill";
    return "chaosParty";
  }, [baseConfig]);

  // Active preset ID (chaosParty, classic, tournament, chill, or custom ID)
  const [activePresetId, setActivePresetId] = useState<string>(initialPresetId);

  // Custom Presets stored in localStorage
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => loadCustomPresets());

  // ── Quick Tweaks (Layer 2) & Advanced (Layer 3) State ───────────────────────

  // Players & Bots
  const [maxPlayers, setMaxPlayers] = useState<number>(baseConfig.match.maxPlayers);
  const [minPlayersToStart, setMinPlayersToStart] = useState<number>(baseConfig.match.minPlayersToStart);
  const [fillBots, setFillBots] = useState<boolean>(baseConfig.match.fillBots);
  const [botSkill, setBotSkill] = useState<"easy" | "normal" | "hard">(baseConfig.match.botSkill);

  // Rounds & Timing
  const [rounds, setRounds] = useState<number>(baseConfig.match.rounds);
  const [roundTime, setRoundTime] = useState<"auto" | number>(baseConfig.match.roundTime);

  // Lives & Respawn
  const [respawnMode, setRespawnMode] = useState<"off" | "lives" | "unlimited">(baseConfig.respawn.mode);
  const [lives, setLives] = useState<number>(baseConfig.respawn.lives);

  // Theme
  const [themeMode, setThemeMode] = useState<"fixed" | "rotate" | "random" | "custom">(baseConfig.theme.mode);
  const [fixedTheme, setFixedTheme] = useState<Theme>(baseConfig.theme.fixed);

  // Twists & Hurdles
  const [allowedTwists, setAllowedTwists] = useState<Twist[]>([...baseConfig.twists.allowed]);
  const [twistsPerRound, setTwistsPerRound] = useState<"1" | "ramp" | "2" | "3">(
    (baseConfig.twists.perRound as any) || "ramp"
  );
  const [twistPicker, setTwistPicker] = useState<"last_place" | "vote" | "host" | "random" | "round_robin">(
    baseConfig.modes.twistPicker
  );
  const [themeLinked, setThemeLinked] = useState<boolean>(baseConfig.twists.themeLinked);

  // Arena
  const [platformCount, setPlatformCount] = useState<number>(baseConfig.arena.platformCount);
  const [islandSize, setIslandSize] = useState<"S" | "M" | "L">(baseConfig.arena.islandSize);
  const [layout, setLayout] = useState<"every_round" | "per_match" | "classic">(baseConfig.arena.layout);
  const [shuffleSpawns, setShuffleSpawns] = useState<boolean>(baseConfig.arena.shuffleSpawns);

  // Modes & Items
  const [selectedModes, setSelectedModes] = useState<Mode[]>([...baseConfig.modes.pool]);
  const [modeOrder, setModeOrder] = useState<"shuffle_bag" | "random" | "fixed">(baseConfig.modes.order);
  const [itemsEnabled, setItemsEnabled] = useState<boolean>(baseConfig.items.enabled);
  const [allowedItems, setAllowedItems] = useState<Item[]>([...baseConfig.items.allowed]);
  const [itemSpots, setItemSpots] = useState<number>(baseConfig.items.spots);
  const [firstTouch, setFirstTouch] = useState<boolean>(baseConfig.items.firstTouch);
  const [keepOnKO, setKeepOnKO] = useState<boolean>(baseConfig.items.keepOnKO);

  // Room & Safety
  const [roomName, setRoomName] = useState<string>(baseConfig.room.name);
  const [visibility, setVisibility] = useState<"public" | "private">(baseConfig.room.visibility);
  const [password, setPassword] = useState<string>(baseConfig.room.password || "");
  const [spectators, setSpectators] = useState<boolean>(baseConfig.room.spectators);
  const [chat, setChat] = useState<"off" | "emotes" | "filtered">(baseConfig.room.chat);
  const [allowKick, setAllowKick] = useState<boolean>(baseConfig.room.allowKick);

  // Tournament lock status
  const isTournament = activePresetId === "tournament";

  // Build current unified config object
  const currentConfig: GameConfig = useMemo(() => {
    return {
      version: 1,
      room: {
        name: roomName,
        visibility,
        password,
        chat,
        spectators: isTournament ? true : spectators,
        allowKick,
      },
      match: {
        maxPlayers,
        minPlayersToStart: Math.min(maxPlayers, isTournament ? Math.max(4, minPlayersToStart) : minPlayersToStart),
        fillBots: isTournament ? false : fillBots,
        botSkill,
        rounds,
        roundTime: isTournament ? 60 : roundTime,
        scoring: "standard",
      },
      arena: {
        platformCount,
        islandSize,
        layout: isTournament ? "per_match" : layout,
        mirror: true,
        shuffleSpawns: isTournament ? false : shuffleSpawns,
      },
      modes: {
        pool: selectedModes,
        order: isTournament ? "fixed" : modeOrder,
        fixedList: isTournament ? ["brawl", "crown", "bomb", "brawl", "crown", "bomb", "brawl"] : [],
        twistPicker: isTournament ? "vote" : twistPicker,
      },
      twists: {
        allowed: allowedTwists,
        perRound: isTournament ? "1" : twistsPerRound,
        themeLinked,
      },
      respawn: {
        mode: respawnMode,
        lives,
        delaySec: baseConfig.respawn.delaySec,
        shieldSec: baseConfig.respawn.shieldSec,
        where: "random_platform",
      },
      items: {
        enabled: isTournament ? false : itemsEnabled,
        allowed: allowedItems,
        spots: isTournament ? 0 : itemSpots,
        firstTouch,
        keepOnKO,
      },
      theme: {
        mode: isTournament ? "fixed" : themeMode,
        fixed: isTournament ? "sunny" : fixedTheme,
        perRound: [],
      },
    };
  }, [
    roomName,
    visibility,
    password,
    chat,
    spectators,
    allowKick,
    maxPlayers,
    minPlayersToStart,
    fillBots,
    botSkill,
    rounds,
    roundTime,
    respawnMode,
    lives,
    platformCount,
    islandSize,
    layout,
    shuffleSpawns,
    selectedModes,
    modeOrder,
    twistPicker,
    allowedTwists,
    twistsPerRound,
    themeLinked,
    itemsEnabled,
    allowedItems,
    itemSpots,
    firstTouch,
    keepOnKO,
    themeMode,
    fixedTheme,
    isTournament,
    baseConfig,
  ]);

  // Modified detection: compare currentConfig against the active preset's canonical config
  const isModified = useMemo(() => {
    let referenceConfig: GameConfig | null = null;
    if (activePresetId === "chaosParty") referenceConfig = PRESETS.chaosParty.config;
    else if (activePresetId === "classic") referenceConfig = PRESETS.classic.config;
    else if (activePresetId === "tournament") referenceConfig = PRESETS.tournament.config;
    else if (activePresetId === "chill") referenceConfig = PRESETS.chill.config;
    else {
      const custom = customPresets.find((p) => p.id === activePresetId);
      if (custom) referenceConfig = custom.config;
    }

    if (!referenceConfig) return false;
    return !isConfigEqual(currentConfig, referenceConfig);
  }, [currentConfig, activePresetId, customPresets]);

  // Active preset display name
  const activePresetName = useMemo(() => {
    if (activePresetId === "chaosParty") return "Chaos Party";
    if (activePresetId === "classic") return "Classic";
    if (activePresetId === "tournament") return "Tournament";
    if (activePresetId === "chill") return "Chill";
    const custom = customPresets.find((p) => p.id === activePresetId);
    return custom ? custom.name : "Custom";
  }, [activePresetId, customPresets]);

  // Live match preview string
  const matchPreview = useMemo(() => {
    return computeMatchPreview(currentConfig);
  }, [currentConfig]);

  // Validation
  const validationError = useMemo<string | null>(() => {
    if (selectedModes.length === 0) return "At least 1 game mode must be enabled";
    if (allowedTwists.length === 0) return "At least 1 twist must be enabled";
    if (rounds < 1 || rounds > 15) return "Rounds must be between 1 and 15";
    if (minPlayersToStart > maxPlayers) return "Min players cannot exceed max players";
    return null;
  }, [selectedModes, allowedTwists, rounds, minPlayersToStart, maxPlayers]);

  const isValid = validationError === null;

  // Apply a preset
  const applyPreset = (presetId: PresetId | string, config: GameConfig) => {
    setActivePresetId(presetId);

    setMaxPlayers(config.match.maxPlayers);
    setMinPlayersToStart(config.match.minPlayersToStart);
    setFillBots(config.match.fillBots);
    setBotSkill(config.match.botSkill);
    setRounds(config.match.rounds);
    setRoundTime(config.match.roundTime);

    setRespawnMode(config.respawn.mode);
    setLives(config.respawn.lives);

    setThemeMode(config.theme.mode);
    setFixedTheme(config.theme.fixed);

    setAllowedTwists([...config.twists.allowed]);
    setTwistsPerRound((config.twists.perRound as any) || "ramp");
    setTwistPicker(config.modes.twistPicker);
    setThemeLinked(config.twists.themeLinked);

    setPlatformCount(config.arena.platformCount);
    setIslandSize(config.arena.islandSize);
    setLayout(config.arena.layout);
    setShuffleSpawns(config.arena.shuffleSpawns);

    setSelectedModes([...config.modes.pool]);
    setModeOrder(config.modes.order);
    setItemsEnabled(config.items.enabled);
    setAllowedItems([...config.items.allowed]);
    setItemSpots(config.items.spots);
    setFirstTouch(config.items.firstTouch);
    setKeepOnKO(config.items.keepOnKO);
  };

  // Reset back to current preset defaults
  const resetToPreset = () => {
    let targetConfig: GameConfig = PRESETS.chaosParty.config;
    if (activePresetId === "classic") targetConfig = PRESETS.classic.config;
    else if (activePresetId === "tournament") targetConfig = PRESETS.tournament.config;
    else if (activePresetId === "chill") targetConfig = PRESETS.chill.config;
    else {
      const custom = customPresets.find((p) => p.id === activePresetId);
      if (custom) targetConfig = custom.config;
    }
    applyPreset(activePresetId, targetConfig);
  };

  // Surprise Me action
  const surpriseMe = () => {
    // Pick 4 to 8 random twists
    const shuffledTwists = [...TWISTS].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 5) + 4;
    setAllowedTwists(shuffledTwists.slice(0, count));

    // Randomize theme
    const pickTheme = Math.random() > 0.4;
    if (pickTheme) {
      setThemeMode("fixed");
      const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)] || "sunny";
      setFixedTheme(randomTheme);
    } else {
      setThemeMode("rotate");
    }

    // Randomize mode order
    const orders: Array<"shuffle_bag" | "random"> = ["shuffle_bag", "random"];
    setModeOrder(orders[Math.floor(Math.random() * orders.length)] || "shuffle_bag");
  };

  // Save as custom preset
  const handleSaveAsCustom = (name: string, icon: any) => {
    const updated = saveCustomPreset({
      name,
      icon,
      config: currentConfig,
    });
    setCustomPresets(updated);
    if (updated.length > 0) {
      const last = updated[updated.length - 1];
      if (last) setActivePresetId(last.id);
    }
  };

  // Delete custom preset
  const handleDeleteCustom = (id: string) => {
    const updated = deleteCustomPreset(id);
    setCustomPresets(updated);
    if (activePresetId === id) {
      applyPreset("chaosParty", PRESETS.chaosParty.config);
    }
  };

  // Save handler: persist to localStorage & notify server
  const handleSave = () => {
    if (!isValid) return;
    saveLastUsedConfig(currentConfig);
    onSave(currentConfig);
  };

  // Shareable settings code
  const settingsCode = useMemo(() => {
    return encodeSettingsCode(currentConfig);
  }, [currentConfig]);

  return {
    // Top-level state & metadata
    activePresetId,
    activePresetName,
    isModified,
    isTournament,
    matchPreview,
    settingsCode,
    customPresets,
    isValid,
    validationError,

    // Actions
    applyPreset,
    resetToPreset,
    surpriseMe,
    handleSave,
    handleSaveAsCustom,
    handleDeleteCustom,

    // Quick Tweaks values & setters
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
    respawnMode,
    lives,
    setRespawn: (mode: "off" | "lives" | "unlimited", l: number) => {
      setRespawnMode(mode);
      setLives(l);
    },
    themeMode,
    fixedTheme,
    setTheme: (mode: "fixed" | "rotate", fixed?: Theme) => {
      setThemeMode(mode);
      if (fixed) setFixedTheme(fixed);
    },

    // Advanced Accordion data & batch updater
    advancedData: {
      allowedTwists,
      twistsPerRound,
      twistPicker,
      themeLinked,
      platformCount,
      islandSize,
      layout,
      shuffleSpawns,
      selectedModes,
      modeOrder,
      itemsEnabled,
      allowedItems,
      itemSpots,
      firstTouch,
      keepOnKO,
      roomName,
      visibility,
      password,
      spectators,
      chat,
      allowKick,
      minPlayersToStart,
      maxPlayers,
    },
    updateAdvanced: (patch: any) => {
      if (patch.allowedTwists !== undefined) setAllowedTwists(patch.allowedTwists);
      if (patch.twistsPerRound !== undefined) setTwistsPerRound(patch.twistsPerRound);
      if (patch.twistPicker !== undefined) setTwistPicker(patch.twistPicker);
      if (patch.themeLinked !== undefined) setThemeLinked(patch.themeLinked);
      if (patch.platformCount !== undefined) setPlatformCount(patch.platformCount);
      if (patch.islandSize !== undefined) setIslandSize(patch.islandSize);
      if (patch.layout !== undefined) setLayout(patch.layout);
      if (patch.shuffleSpawns !== undefined) setShuffleSpawns(patch.shuffleSpawns);
      if (patch.selectedModes !== undefined) setSelectedModes(patch.selectedModes);
      if (patch.modeOrder !== undefined) setModeOrder(patch.modeOrder);
      if (patch.itemsEnabled !== undefined) setItemsEnabled(patch.itemsEnabled);
      if (patch.allowedItems !== undefined) setAllowedItems(patch.allowedItems);
      if (patch.itemSpots !== undefined) setItemSpots(patch.itemSpots);
      if (patch.firstTouch !== undefined) setFirstTouch(patch.firstTouch);
      if (patch.keepOnKO !== undefined) setKeepOnKO(patch.keepOnKO);
      if (patch.roomName !== undefined) setRoomName(patch.roomName);
      if (patch.visibility !== undefined) setVisibility(patch.visibility);
      if (patch.password !== undefined) setPassword(patch.password);
      if (patch.spectators !== undefined) setSpectators(patch.spectators);
      if (patch.chat !== undefined) setChat(patch.chat);
      if (patch.allowKick !== undefined) setAllowKick(patch.allowKick);
    },
  };
}
