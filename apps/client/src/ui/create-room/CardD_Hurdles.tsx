import { TWISTS, type Twist } from "@mutator-party/shared";
import { TWIST_INFO } from "./constants";
import { Card, Row, Toggle, Segmented } from "./components";

interface CardDProps {
  allowedTwists: Twist[];
  twistsPerRound: "1" | "ramp" | "2" | "3";
  themeLinked: boolean;
  onToggleTwist: (t: Twist) => void;
  onTwistsPerRoundChange: (v: "1" | "ramp" | "2" | "3") => void;
  onThemeLinkedChange: (v: boolean) => void;
}

export function CardD_Hurdles({
  allowedTwists,
  twistsPerRound,
  themeLinked,
  onToggleTwist,
  onTwistsPerRoundChange,
  onThemeLinkedChange,
}: CardDProps) {
  return (
    <Card badge="D" title="Hurdles (twists and hazards)">
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          padding: "2px 0",
        }}
      >
        {TWISTS.map((t) => {
          const isAllowed = allowedTwists.includes(t);
          const info = TWIST_INFO[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => onToggleTwist(t)}
              style={{
                padding: "5px 10px",
                borderRadius: "9999px",
                border: "2px solid var(--mp-ink)",
                background: isAllowed ? "#D4F8E8" : "#E8E8EE",
                color: isAllowed ? "var(--mp-ink)" : "#888",
                fontWeight: 900,
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: isAllowed ? "none" : "line-through",
                boxShadow: isAllowed
                  ? "1.5px 1.5px 0 var(--mp-ink)"
                  : "none",
              }}
            >
              {info.icon} {info.name}
            </button>
          );
        })}
      </div>

      <Row label="Twists per round">
        <Segmented
          options={[
            { label: "1", value: "1" },
            { label: "Ramp 1 to 3", value: "ramp" },
            { label: "2", value: "2" },
            { label: "3", value: "3" },
          ]}
          value={twistsPerRound}
          onChange={onTwistsPerRoundChange}
        />
      </Row>

      <Row label="Theme linked twists">
        <Toggle checked={themeLinked} onChange={onThemeLinkedChange} />
      </Row>
      <span
        style={{
          fontSize: "11px",
          color: "var(--mp-muted)",
          marginTop: "-4px",
        }}
      >
        Hazards (spikes, bumpers, moving platforms): coming soon
      </span>
    </Card>
  );
}

