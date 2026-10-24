import { Card, Row, Stepper, Segmented } from "./components";

interface CardEProps {
  respawnMode: "off" | "lives" | "unlimited";
  lives: number;
  delaySec: number;
  shieldSec: number;
  onRespawnModeChange: (v: "off" | "lives" | "unlimited") => void;
  onLivesChange: (v: number) => void;
  onDelaySecChange: (v: number) => void;
  onShieldSecChange: (v: number) => void;
}

export function CardE_Respawn({
  respawnMode,
  lives,
  delaySec,
  shieldSec,
  onRespawnModeChange,
  onLivesChange,
  onDelaySecChange,
  onShieldSecChange,
}: CardEProps) {
  return (
    <Card badge="E" title="Respawn and lives">
      <Row label="Respawn mode">
        <Segmented
          options={[
            { label: "Off", value: "off" },
            { label: "Lives", value: "lives" },
            { label: "Unlimited", value: "unlimited" },
          ]}
          value={respawnMode}
          onChange={onRespawnModeChange}
        />
      </Row>

      <Row label="Lives per player">
        <Stepper
          value={lives}
          min={1}
          max={9}
          disabled={respawnMode === "off"}
          onChange={onLivesChange}
        />
      </Row>

      <Row label="Respawn delay (sec)">
        <Stepper
          value={delaySec}
          min={1}
          max={5}
          step={0.5}
          disabled={respawnMode === "off"}
          onChange={onDelaySecChange}
        />
      </Row>

      <Row label="Spawn shield (sec)">
        <Stepper
          value={shieldSec}
          min={0}
          max={3}
          step={0.5}
          disabled={respawnMode === "off"}
          onChange={onShieldSecChange}
        />
      </Row>
    </Card>
  );
}

