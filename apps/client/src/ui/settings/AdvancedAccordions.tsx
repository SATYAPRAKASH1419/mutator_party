import { useState } from "preact/hooks";
import {
  TWISTS,
  ITEMS,
  MODES,
  type Twist,
  type Item,
  type Mode,
} from "@mutator-party/shared";
import { IconCheckMark } from "./SettingsIcons";
import { GameChevronIcon } from "../lobby/LobbyIcons";

export interface AdvancedSettingsData {
  // 1. Twists & Hurdles
  allowedTwists: Twist[];
  twistsPerRound: "1" | "ramp" | "2" | "3";
  twistPicker: "last_place" | "vote" | "host" | "random" | "round_robin";
  themeLinked: boolean;

  // 2. Arena
  platformCount: number;
  islandSize: "S" | "M" | "L";
  layout: "every_round" | "per_match" | "classic";
  shuffleSpawns: boolean;

  // 3. Modes & Power-ups
  selectedModes: Mode[];
  modeOrder: "shuffle_bag" | "random" | "fixed";
  itemsEnabled: boolean;
  allowedItems: Item[];
  itemSpots: number;
  firstTouch: boolean;
  keepOnKO: boolean;

  // 4. Room & Safety
  roomName: string;
  visibility: "public" | "private";
  password?: string;
  spectators: boolean;
  chat: "off" | "emotes" | "filtered";
  allowKick: boolean;
  minPlayersToStart: number;
  maxPlayers: number;
}

interface AdvancedAccordionsProps {
  data: AdvancedSettingsData;
  onChange: (patch: Partial<AdvancedSettingsData>) => void;
  isTournamentLocked?: boolean;
}

const TWIST_INFO: Record<Twist, { label: string; tooltip: string; icon: string }> = {
  low: { label: "Low Gravity", tooltip: "Low Gravity: float like an astronaut", icon: "🚀" },
  heavy: { label: "Heavy Gravity", tooltip: "Heavy Gravity: feet glued to the floor", icon: "⚓" },
  tiny: { label: "Tiny Players", tooltip: "Tiny Players: small targets, high squeaks", icon: "🐣" },
  giant: { label: "Giant Titans", tooltip: "Giant Titans: massive stomping brawlers", icon: "🦍" },
  lotto: { label: "Lotto Sizes", tooltip: "Lotto Sizes: random wacky scale for each player", icon: "🎲" },
  reverse: { label: "Reversed Controls", tooltip: "Reversed Controls: left is right, right is left!", icon: "🔀" },
  ice: { label: "Slippery Ice", tooltip: "Slippery Ice: zero friction, slide away", icon: "❄️" },
  speed: { label: "Turbo Speed", tooltip: "Turbo Speed: hyperspeed footwork", icon: "⚡" },
  flap: { label: "Flappy Jump", tooltip: "Flappy Jump: tap jump repeatedly to flap wings", icon: "🪽" },
  crumble: { label: "Crumbling Floors", tooltip: "Crumbling Floors: platforms shake and fall apart", icon: "💥" },
  wind: { label: "Gale Force", tooltip: "Gale Force: blows everyone sideways", icon: "💨" },
  dark: { label: "Lights Out", tooltip: "Lights Out: spotlit chaos in the dark", icon: "🔦" },
  bounce: { label: "Bouncy Arena", tooltip: "Bouncy Arena: trampoline bounce on every landing", icon: "🏀" },
};

const ITEM_INFO: Record<Item, { label: string; tooltip: string; icon: string }> = {
  mega: { label: "Mega Shove", tooltip: "Mega Shove: send rivals flying into orbit", icon: "🥊" },
  freeze: { label: "Freeze Blast", tooltip: "Freeze Blast: turn nearby opponents into ice cubes", icon: "🧊" },
  swap: { label: "Teleport Swap", tooltip: "Teleport Swap: instantly swap places with an opponent", icon: "🌀" },
  shield: { label: "Bubble Shield", tooltip: "Bubble Shield: deflector dome against shoves and bombs", icon: "🛡️" },
};

const MODE_INFO: Record<Mode, { label: string; tooltip: string; icon: string }> = {
  brawl: { label: "Brawl", tooltip: "Brawl: push enemies off platforms to be the last one standing", icon: "🥊" },
  bomb: { label: "Bomb Tag", tooltip: "Bomb Tag: pass the ticking bomb before it blows!", icon: "💣" },
  crown: { label: "Crown Rush", tooltip: "Crown Rush: hold the crown longest to win", icon: "👑" },
};

export function AdvancedAccordions({
  data,
  onChange,
  isTournamentLocked = false,
}: AdvancedAccordionsProps) {
  // Accordion state: one open at a time
  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggleAccordion = (idx: number) => {
    setOpenSection((prev) => (prev === idx ? null : idx));
  };

  // Toggle twist with minimum 1 guard
  const handleToggleTwist = (t: Twist) => {
    if (isTournamentLocked) return;
    const isCurrentlyOn = data.allowedTwists.includes(t);
    if (isCurrentlyOn) {
      if (data.allowedTwists.length <= 1) return; // Cannot turn off last twist
      onChange({ allowedTwists: data.allowedTwists.filter((x) => x !== t) });
    } else {
      onChange({ allowedTwists: [...data.allowedTwists, t] });
    }
  };

  // Toggle mode with minimum 1 guard
  const handleToggleMode = (m: Mode) => {
    if (isTournamentLocked) return;
    const isCurrentlyOn = data.selectedModes.includes(m);
    if (isCurrentlyOn) {
      if (data.selectedModes.length <= 1) return; // Cannot turn off last mode
      onChange({ selectedModes: data.selectedModes.filter((x) => x !== m) });
    } else {
      onChange({ selectedModes: [...data.selectedModes, m] });
    }
  };

  // Toggle item
  const handleToggleItem = (it: Item) => {
    if (isTournamentLocked) return;
    const isCurrentlyOn = data.allowedItems.includes(it);
    if (isCurrentlyOn) {
      onChange({ allowedItems: data.allowedItems.filter((x) => x !== it) });
    } else {
      onChange({ allowedItems: [...data.allowedItems, it] });
    }
  };

  // Live summaries for accordion headers
  const twistsSummary = `Twists · ${data.allowedTwists.length} of ${TWISTS.length} on · ${
    data.twistsPerRound === "ramp" ? "Ramp 1 to 3" : `${data.twistsPerRound}/round`
  }`;

  const arenaSummary = `Arena · ${data.platformCount} platforms · Size ${data.islandSize} · ${
    data.layout === "every_round" ? "Every round" : data.layout === "per_match" ? "Per match" : "Classic"
  }`;

  const modesSummary = `Modes & Items · ${data.selectedModes.length} modes · ${
    data.itemsEnabled ? `Items on (${data.itemSpots} spots)` : "Items off"
  }`;

  const safetySummary = `Room · ${data.visibility === "public" ? "Public" : "Private"} · Chat: ${data.chat}`;

  return (
    <section className="mp-advanced-layer" aria-label="Advanced Room Settings">
      <style>{`
        .mp-advanced-layer {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mp-accordion-card {
          background: #FFFBF0;
          border: 3px solid #1B1B3A;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 4px 4px 0 #1B1B3A;
          transition: box-shadow 0.15s ease;
        }

        .mp-accordion-header {
          width: 100%;
          background: #FFFBF0;
          border: none;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          text-align: left;
          min-height: 48px;
        }

        .mp-accordion-header:hover {
          background: #FFF7DE;
        }

        .mp-accordion-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .mp-accordion-title {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 15px;
          font-weight: 900;
          color: #1B1B3A;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }

        .mp-accordion-summary {
          font-size: 12.5px;
          font-weight: 700;
          color: #555577;
        }

        .mp-accordion-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          color: #1B1B3A;
          flex-shrink: 0;
        }

        .mp-accordion-arrow.is-open {
          transform: rotate(90deg);
        }

        .mp-accordion-body {
          padding: 16px;
          border-top: 2.5px solid #1B1B3A;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Chips Grid */
        .mp-chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mp-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 9999px;
          border: 2px solid #1B1B3A;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.12s ease;
          user-select: none;
          min-height: 40px;
          box-shadow: 2px 2px 0 #1B1B3A;
        }

        .mp-chip:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 2.5px 2.5px 0 #1B1B3A;
        }

        .mp-chip:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 0 0 #1B1B3A;
        }

        /* ON chip: full color + check icon */
        .mp-chip.is-on {
          background: #FFD23F;
          color: #1B1B3A;
        }

        .mp-chip.is-on.is-purple {
          background: #C4B5FD;
          color: #1B1B3A;
        }

        .mp-chip.is-on.is-green {
          background: #3DDC97;
          color: #1B1B3A;
        }

        /* OFF chip: dimmed, desaturated, no check */
        .mp-chip.is-off {
          background: #E8E5DF;
          color: #7A7A90;
          opacity: 0.65;
          box-shadow: none;
        }

        .mp-chip:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* Sub row controls inside accordion */
        .mp-sub-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        @media (min-width: 600px) {
          .mp-sub-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .mp-sub-label {
          font-size: 13.5px;
          font-weight: 800;
          color: #1B1B3A;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mp-segmented-sm {
          display: flex;
          background: #E8E5DF;
          border: 2px solid #1B1B3A;
          border-radius: 9999px;
          padding: 2px;
          gap: 2px;
          box-shadow: 1.5px 1.5px 0 #1B1B3A;
          min-height: 38px;
        }

        .mp-seg-btn-sm {
          border: none;
          background: transparent;
          border-radius: 9999px;
          font-size: 12.5px;
          font-weight: 800;
          color: #1B1B3A;
          cursor: pointer;
          padding: 4px 10px;
          transition: all 0.1s ease;
          white-space: nowrap;
        }

        .mp-seg-btn-sm.is-active {
          background: #FFD23F;
          box-shadow: 1px 1px 0 #1B1B3A;
          border: 1px solid #1B1B3A;
        }

        .mp-text-input {
          background: #FFFFFF;
          border: 2.5px solid #1B1B3A;
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 800;
          color: #1B1B3A;
          box-shadow: 2px 2px 0 #1B1B3A;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          max-width: 320px;
        }

        .mp-text-input:focus {
          border-color: #8B5CF6;
        }
      `}</style>

      {/* ════════ ACCORDION 1: TWISTS AND HURDLES ════════ */}
      <div className="mp-accordion-card">
        <button
          type="button"
          className="mp-accordion-header"
          onClick={() => toggleAccordion(1)}
          aria-expanded={openSection === 1}
        >
          <div className="mp-accordion-title-wrap">
            <h4 className="mp-accordion-title">
              <span>🌪️ Twists & Hurdles</span>
            </h4>
            <span className="mp-accordion-summary">{twistsSummary}</span>
          </div>
          <span className={`mp-accordion-arrow ${openSection === 1 ? "is-open" : ""}`}>
            <GameChevronIcon size={14} />
          </span>
        </button>

        {openSection === 1 && (
          <div className="mp-accordion-body">
            {/* Twist Chips */}
            <div className="mp-sub-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <span className="mp-sub-label">
                <span>Active Twists ({data.allowedTwists.length} enabled)</span>
                <span style={{ fontSize: "12px", color: "#666" }}>— At least 1 twist required</span>
              </span>
              <div className="mp-chips-grid">
                {TWISTS.map((t) => {
                  const isOn = data.allowedTwists.includes(t);
                  const isLastOne = isOn && data.allowedTwists.length <= 1;
                  const info = TWIST_INFO[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`mp-chip is-purple ${isOn ? "is-on" : "is-off"}`}
                      onClick={() => handleToggleTwist(t)}
                      disabled={isLastOne || isTournamentLocked}
                      title={isLastOne ? "At least 1 twist must stay enabled" : info.tooltip}
                    >
                      {isOn && <IconCheckMark size={14} />}
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Twists Per Round */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">🎲 Twists Per Round</span>
              <div className="mp-segmented-sm">
                {(["1", "ramp", "2", "3"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`mp-seg-btn-sm ${data.twistsPerRound === r ? "is-active" : ""}`}
                    onClick={() => onChange({ twistsPerRound: r })}
                    disabled={isTournamentLocked}
                  >
                    {r === "ramp" ? "Ramp 1 to 3" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Who Picks Twist */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">👑 Twist Picker</span>
              <div className="mp-segmented-sm">
                {(
                  [
                    { id: "last_place", label: "Last Place" },
                    { id: "vote", label: "Vote" },
                    { id: "host", label: "Host" },
                    { id: "random", label: "Random" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`mp-seg-btn-sm ${data.twistPicker === p.id ? "is-active" : ""}`}
                    onClick={() => onChange({ twistPicker: p.id })}
                    disabled={isTournamentLocked}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme-Linked Twists */}
            <div className="mp-sub-row">
              <span className="mp-sub-label" title="Theme-linked twists will bias twists to match current arena">
                <span>🔗 Theme-Linked Twists</span>
                <span style={{ fontSize: "12px", color: "#666" }}>(Ice in frozen theme, etc.)</span>
              </span>
              <button
                type="button"
                className={`mp-chip is-green ${data.themeLinked ? "is-on" : "is-off"}`}
                onClick={() => onChange({ themeLinked: !data.themeLinked })}
                disabled={isTournamentLocked}
              >
                {data.themeLinked && <IconCheckMark size={14} />}
                <span>{data.themeLinked ? "Enabled" : "Disabled"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 2: ARENA ════════ */}
      <div className="mp-accordion-card">
        <button
          type="button"
          className="mp-accordion-header"
          onClick={() => toggleAccordion(2)}
          aria-expanded={openSection === 2}
        >
          <div className="mp-accordion-title-wrap">
            <h4 className="mp-accordion-title">
              <span>🏝️ Arena Architecture</span>
            </h4>
            <span className="mp-accordion-summary">{arenaSummary}</span>
          </div>
          <span className={`mp-accordion-arrow ${openSection === 2 ? "is-open" : ""}`}>
            <GameChevronIcon size={14} />
          </span>
        </button>

        {openSection === 2 && (
          <div className="mp-accordion-body">
            {/* Floating Platforms Stepper (2 to 8) */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">☁️ Floating Platforms</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  className="mp-chip is-off"
                  onClick={() => onChange({ platformCount: Math.max(2, data.platformCount - 1) })}
                  disabled={data.platformCount <= 2 || isTournamentLocked}
                >
                  −
                </button>
                <span style={{ fontWeight: 900, minWidth: "40px", textAlign: "center" }}>
                  {data.platformCount}
                </span>
                <button
                  type="button"
                  className="mp-chip is-off"
                  onClick={() => onChange({ platformCount: Math.min(8, data.platformCount + 1) })}
                  disabled={data.platformCount >= 8 || isTournamentLocked}
                >
                  +
                </button>
              </div>
            </div>

            {/* Island Size (S, M, L) */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">📏 Island Size</span>
              <div className="mp-segmented-sm">
                {(["S", "M", "L"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`mp-seg-btn-sm ${data.islandSize === s ? "is-active" : ""}`}
                    onClick={() => onChange({ islandSize: s })}
                    disabled={isTournamentLocked}
                  >
                    Size {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Generation */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">🏗️ Layout Generation</span>
              <div className="mp-segmented-sm">
                {(
                  [
                    { id: "every_round", label: "Every Round" },
                    { id: "per_match", label: "Per Match" },
                    { id: "classic", label: "Classic" },
                  ] as const
                ).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={`mp-seg-btn-sm ${data.layout === l.id ? "is-active" : ""}`}
                    onClick={() => onChange({ layout: l.id })}
                    disabled={isTournamentLocked}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shuffle Spawn Spots */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">🔀 Shuffle Spawn Spots</span>
              <button
                type="button"
                className={`mp-chip is-green ${data.shuffleSpawns ? "is-on" : "is-off"}`}
                onClick={() => onChange({ shuffleSpawns: !data.shuffleSpawns })}
                disabled={isTournamentLocked}
              >
                {data.shuffleSpawns && <IconCheckMark size={14} />}
                <span>{data.shuffleSpawns ? "Yes" : "Fixed"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 3: MODES AND POWER-UPS ════════ */}
      <div className="mp-accordion-card">
        <button
          type="button"
          className="mp-accordion-header"
          onClick={() => toggleAccordion(3)}
          aria-expanded={openSection === 3}
        >
          <div className="mp-accordion-title-wrap">
            <h4 className="mp-accordion-title">
              <span>🥊 Modes & Power-ups</span>
            </h4>
            <span className="mp-accordion-summary">{modesSummary}</span>
          </div>
          <span className={`mp-accordion-arrow ${openSection === 3 ? "is-open" : ""}`}>
            <GameChevronIcon size={14} />
          </span>
        </button>

        {openSection === 3 && (
          <div className="mp-accordion-body">
            {/* Game Modes Chips */}
            <div className="mp-sub-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <span className="mp-sub-label">
                <span>Active Game Modes</span>
                <span style={{ fontSize: "12px", color: "#666" }}>— At least 1 mode required</span>
              </span>
              <div className="mp-chips-grid">
                {MODES.map((m) => {
                  const isOn = data.selectedModes.includes(m);
                  const isLastOne = isOn && data.selectedModes.length <= 1;
                  const info = MODE_INFO[m];
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`mp-chip is-purple ${isOn ? "is-on" : "is-off"}`}
                      onClick={() => handleToggleMode(m)}
                      disabled={isLastOne || isTournamentLocked}
                      title={isLastOne ? "At least 1 mode must stay enabled" : info.tooltip}
                    >
                      {isOn && <IconCheckMark size={14} />}
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Order */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">🔄 Mode Rotation Order</span>
              <div className="mp-segmented-sm">
                {(
                  [
                    { id: "shuffle_bag", label: "Shuffle Bag" },
                    { id: "random", label: "Random" },
                    { id: "fixed", label: "Fixed List" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`mp-seg-btn-sm ${data.modeOrder === o.id ? "is-active" : ""}`}
                    onClick={() => onChange({ modeOrder: o.id })}
                    disabled={isTournamentLocked}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Power-ups Toggle */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">⚡ Power-ups</span>
              <button
                type="button"
                className={`mp-chip is-green ${data.itemsEnabled ? "is-on" : "is-off"}`}
                onClick={() => onChange({ itemsEnabled: !data.itemsEnabled })}
                disabled={isTournamentLocked}
              >
                {data.itemsEnabled && <IconCheckMark size={14} />}
                <span>{data.itemsEnabled ? "Enabled" : "Disabled"}</span>
              </button>
            </div>

            {/* Dependent Item Settings (only when itemsEnabled is true) */}
            {data.itemsEnabled && (
              <>
                <div className="mp-sub-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <span className="mp-sub-label">Allowed Power-up Crates</span>
                  <div className="mp-chips-grid">
                    {ITEMS.map((it) => {
                      const isOn = data.allowedItems.includes(it);
                      const info = ITEM_INFO[it];
                      return (
                        <button
                          key={it}
                          type="button"
                          className={`mp-chip ${isOn ? "is-on" : "is-off"}`}
                          onClick={() => handleToggleItem(it)}
                          disabled={isTournamentLocked}
                          title={info.tooltip}
                        >
                          {isOn && <IconCheckMark size={14} />}
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mp-sub-row">
                  <span className="mp-sub-label">📦 Spots Per Round (0 to 5)</span>
                  <div className="mp-segmented-sm">
                    {[0, 1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`mp-seg-btn-sm ${data.itemSpots === s ? "is-active" : ""}`}
                        onClick={() => onChange({ itemSpots: s })}
                        disabled={isTournamentLocked}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mp-sub-row">
                  <span className="mp-sub-label">🖐️ First to Touch Claims Crate</span>
                  <button
                    type="button"
                    className={`mp-chip is-green ${data.firstTouch ? "is-on" : "is-off"}`}
                    onClick={() => onChange({ firstTouch: !data.firstTouch })}
                    disabled={isTournamentLocked}
                  >
                    {data.firstTouch && <IconCheckMark size={14} />}
                    <span>{data.firstTouch ? "Yes" : "Contested"}</span>
                  </button>
                </div>

                <div className="mp-sub-row">
                  <span className="mp-sub-label">💀 Keep Item After Knockout</span>
                  <button
                    type="button"
                    className={`mp-chip is-green ${data.keepOnKO ? "is-on" : "is-off"}`}
                    onClick={() => onChange({ keepOnKO: !data.keepOnKO })}
                    disabled={isTournamentLocked}
                  >
                    {data.keepOnKO && <IconCheckMark size={14} />}
                    <span>{data.keepOnKO ? "Keep" : "Lose on KO"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ════════ ACCORDION 4: ROOM AND SAFETY ════════ */}
      <div className="mp-accordion-card">
        <button
          type="button"
          className="mp-accordion-header"
          onClick={() => toggleAccordion(4)}
          aria-expanded={openSection === 4}
        >
          <div className="mp-accordion-title-wrap">
            <h4 className="mp-accordion-title">
              <span>🛡️ Room & Safety</span>
            </h4>
            <span className="mp-accordion-summary">{safetySummary}</span>
          </div>
          <span className={`mp-accordion-arrow ${openSection === 4 ? "is-open" : ""}`}>
            <GameChevronIcon size={14} />
          </span>
        </button>

        {openSection === 4 && (
          <div className="mp-accordion-body">
            {/* Room Name */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">🏷️ Room Name</span>
              <input
                type="text"
                className="mp-text-input"
                maxLength={24}
                value={data.roomName}
                placeholder="Custom Room"
                onChange={(e) => onChange({ roomName: (e.target as HTMLInputElement).value })}
              />
            </div>

            {/* Visibility (Public / Private) */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">🌐 Room Visibility</span>
              <div className="mp-segmented-sm">
                {(["private", "public"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`mp-seg-btn-sm ${data.visibility === v ? "is-active" : ""}`}
                    onClick={() => onChange({ visibility: v })}
                  >
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Password */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">🔑 Room Password (Optional)</span>
              <input
                type="password"
                className="mp-text-input"
                maxLength={12}
                value={data.password || ""}
                placeholder="Leave empty for none"
                onChange={(e) => onChange({ password: (e.target as HTMLInputElement).value })}
              />
            </div>

            {/* Spectators */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">👀 Allow Spectators</span>
              <button
                type="button"
                className={`mp-chip is-green ${data.spectators ? "is-on" : "is-off"}`}
                onClick={() => onChange({ spectators: !data.spectators })}
              >
                {data.spectators && <IconCheckMark size={14} />}
                <span>{data.spectators ? "Allowed" : "Off"}</span>
              </button>
            </div>

            {/* Chat Permissions (Off, Emotes only, Filtered) */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">💬 Chat Permissions</span>
              <div className="mp-segmented-sm">
                {(
                  [
                    { id: "off", label: "Off" },
                    { id: "emotes", label: "Emotes Only" },
                    { id: "filtered", label: "Filtered" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`mp-seg-btn-sm ${data.chat === c.id ? "is-active" : ""}`}
                    onClick={() => onChange({ chat: c.id })}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Host Kick Permission */}
            <div className="mp-sub-row">
              <span className="mp-sub-label">👢 Host Can Kick Players</span>
              <button
                type="button"
                className={`mp-chip is-green ${data.allowKick ? "is-on" : "is-off"}`}
                onClick={() => onChange({ allowKick: !data.allowKick })}
              >
                {data.allowKick && <IconCheckMark size={14} />}
                <span>{data.allowKick ? "Enabled" : "Disabled"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

