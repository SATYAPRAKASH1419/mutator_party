import { Card, Row, Stepper, Toggle, Segmented } from "./components";

interface CardAProps {
  maxPlayers: number;
  minPlayersToStart: number;
  fillBots: boolean;
  botSkill: "easy" | "normal" | "hard";
  rounds: number;
  roundTime: string;
  onMaxPlayersChange: (v: number) => void;
  onMinPlayersChange: (v: number) => void;
  onFillBotsChange: (v: boolean) => void;
  onBotSkillChange: (v: "easy" | "normal" | "hard") => void;
  onRoundsChange: (v: number) => void;
  onRoundTimeChange: (v: string) => void;
}

export function CardA_MatchPlayers({
  maxPlayers,
  minPlayersToStart,
  fillBots,
  botSkill,
  rounds,
  roundTime,
  onMaxPlayersChange,
  onMinPlayersChange,
  onFillBotsChange,
  onBotSkillChange,
  onRoundsChange,
  onRoundTimeChange,
}: CardAProps) {
  return (
    <Card badge="A" title="Match and players">
      <Row label="Max players">
        <Stepper
          value={maxPlayers}
          min={2}
          max={12}
          onChange={(v) => {
            onMaxPlayersChange(v);
            if (minPlayersToStart > v) onMinPlayersChange(v);
          }}
        />
      </Row>

      <Row label="Min players to start">
        <Stepper
          value={minPlayersToStart}
          min={2}
          max={maxPlayers}
          onChange={onMinPlayersChange}
        />
      </Row>

      <Row label="Fill empty slots with bots">
        <Toggle checked={fillBots} onChange={onFillBotsChange} />
      </Row>

      <Row label="Bot skill">
        <Segmented
          options={[
            { label: "Easy", value: "easy" },
            { label: "Normal", value: "normal" },
            { label: "Hard", value: "hard" },
          ]}
          value={botSkill}
          onChange={onBotSkillChange}
        />
      </Row>

      <Row label="Rounds">
        <Stepper
          value={rounds}
          min={1}
          max={15}
          onChange={onRoundsChange}
        />
      </Row>

      <Row label="Round time">
        <Segmented
          options={[
            { label: "Auto", value: "auto" },
            { label: "45s", value: "45" },
            { label: "60s", value: "60" },
            { label: "75s", value: "75" },
            { label: "90s", value: "90" },
          ]}
          value={roundTime}
          onChange={onRoundTimeChange}
        />
      </Row>
    </Card>
  );
}

