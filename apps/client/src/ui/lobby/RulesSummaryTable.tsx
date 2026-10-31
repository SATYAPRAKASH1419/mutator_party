import { useMemo } from "preact/hooks";
import { THEMES, type RoomSettings } from "@mutator-party/shared";
import { GameModeList } from "../components/GameIcons";

interface RulesSummaryTableProps {
  settings: Partial<RoomSettings> | null;
}

export function RulesSummaryTable({ settings }: RulesSummaryTableProps) {
  const rounds = settings?.match?.rounds ?? 5;

  // Active Modes (🥊 Brawl, 💣 Bomb, 👑 Crown)
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
    if (settings?.respawn?.mode === "off") return "1 life (off)";
    return `${settings?.respawn?.lives ?? 3} lives`;
  }, [settings?.respawn?.mode, settings?.respawn?.lives]);

  // Power-ups text
  const powerUpsText = useMemo(() => {
    if (settings?.items?.enabled === false) return "Off";
    const itemsAllowed = settings?.items?.allowed ?? ["mega", "freeze", "swap", "shield"];
    if (itemsAllowed.length === 0) return "Off";
    return `On, ${settings?.items?.spots ?? 3} spots`;
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

  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "20px",
          fontWeight: 900,
          color: "var(--mp-ink)",
          marginBottom: "4px",
        }}
      >
        Rules for this room
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Row 1: Rounds */}
        <div className="mp-rules-row">
          <span>{rounds} rounds</span>
          <span></span>
        </div>

        {/* Row 2: Modes */}
        <div className="mp-rules-row">
          <span>Modes</span>
          <span style={{ fontSize: "15px", letterSpacing: "2px" }}>
            <GameModeList modes={modePool} />
          </span>
        </div>

        {/* Row 3: Twists */}
        <div className="mp-rules-row">
          <span>Twists</span>
          <span>{twistsCount} on, {twistRampText}</span>
        </div>

        {/* Row 4: Twist picked by */}
        <div className="mp-rules-row">
          <span>Twist picked by</span>
          <span>{twistPickerText}</span>
        </div>

        {/* Row 5: Layout */}
        <div className="mp-rules-row">
          <span>Layout</span>
          <span>{layoutText}</span>
        </div>

        {/* Row 6: Respawn */}
        <div className="mp-rules-row">
          <span>Respawn</span>
          <span>{respawnText}</span>
        </div>

        {/* Row 7: Power-ups */}
        <div className="mp-rules-row">
          <span>Power-ups</span>
          <span>{powerUpsText}</span>
        </div>

        {/* Row 8: Theme */}
        <div className="mp-rules-row" style={{ borderBottom: "none" }}>
          <span>Theme</span>
          <span>{themeText}</span>
        </div>
      </div>
    </div>
  );
}
