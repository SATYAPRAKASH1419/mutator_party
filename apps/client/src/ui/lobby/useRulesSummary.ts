import { useMemo } from "preact/hooks";
import { THEMES, PRESETS, isConfigEqual, type RoomSettings } from "@mutator-party/shared";

export function useRulesSummary(settings: Partial<RoomSettings> | null) {
  const rounds = settings?.match?.rounds ?? 5;
  const roundTime = settings?.match?.roundTime ?? "auto";
  const botSkill = settings?.match?.botSkill ?? "normal";

  const presetName = useMemo(() => {
    if (!settings) return "Chaos Party";
    if (isConfigEqual(settings, PRESETS.chaosParty.config)) return "Chaos Party";
    if (isConfigEqual(settings, PRESETS.classic.config)) return "Classic";
    if (isConfigEqual(settings, PRESETS.tournament.config)) return "Tournament";
    if (isConfigEqual(settings, PRESETS.chill.config)) return "Chill";
    return "Custom";
  }, [settings]);

  // Active Modes
  const modePool = settings?.modes?.pool ?? ["brawl", "bomb", "crown"];
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

  return {
    rounds,
    roundTime,
    botSkill,
    modePool,
    modeIcons: modePool,
    twistsCount,
    twistRampText,
    twistPickerText,
    layoutText,
    respawnText,
    powerUpsText,
    themeText,
    presetName,
  };
}
