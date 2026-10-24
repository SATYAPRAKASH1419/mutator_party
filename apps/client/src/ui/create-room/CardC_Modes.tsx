import { type Mode } from "@mutator-party/shared";
import { Card, Row, Segmented } from "./components";

interface CardCProps {
  selectedModes: Mode[];
  modeOrder: "shuffle_bag" | "random" | "fixed";
  twistPicker: "last_place" | "vote" | "host" | "random" | "round_robin";
  onToggleMode: (m: Mode) => void;
  onModeOrderChange: (v: "shuffle_bag" | "random" | "fixed") => void;
  onTwistPickerChange: (
    v: "last_place" | "vote" | "host" | "random" | "round_robin",
  ) => void;
}

export function CardC_Modes({
  selectedModes,
  modeOrder,
  twistPicker,
  onToggleMode,
  onModeOrderChange,
  onTwistPickerChange,
}: CardCProps) {
  return (
    <Card badge="C" title="Modes and level picks">
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "4px",
        }}
      >
        {(["brawl", "bomb", "crown"] as const).map((m) => {
          const isSel = selectedModes.includes(m);
          const name =
            m === "brawl"
              ? "🥊 Last One Standing"
              : m === "bomb"
              ? "💣 Bomb Tag"
              : "👑 Crown Rush";
          return (
            <button
              key={m}
              type="button"
              onClick={() => onToggleMode(m)}
              style={{
                padding: "8px 14px",
                borderRadius: "9999px",
                border: "2.5px solid var(--mp-ink)",
                background: isSel ? "var(--mp-mint)" : "var(--mp-paper)",
                color: "var(--mp-ink)",
                fontWeight: 900,
                fontSize: "12.5px",
                cursor: "pointer",
                boxShadow: isSel ? "2px 2px 0 var(--mp-ink)" : "none",
                opacity: isSel ? 1 : 0.55,
                transition: "all 0.1s ease",
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      <Row label="Mode order">
        <Segmented
          options={[
            { label: "Shuffle bag", value: "shuffle_bag" },
            { label: "Random", value: "random" },
            { label: "Fixed list", value: "fixed" },
          ]}
          value={modeOrder}
          onChange={onModeOrderChange}
        />
      </Row>

      <Row label="Who picks the twist">
        <Segmented
          options={[
            { label: "Last place", value: "last_place" },
            { label: "Vote", value: "vote" },
            { label: "Host", value: "host" },
            { label: "Random", value: "random" },
          ]}
          value={twistPicker}
          onChange={onTwistPickerChange}
        />
      </Row>
    </Card>
  );
}

