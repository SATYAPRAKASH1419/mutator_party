import { Card, Row, Stepper, Toggle, Segmented } from "./components";

interface CardBProps {
  platformCount: number;
  islandSize: "S" | "M" | "L";
  layout: "every_round" | "per_match" | "classic";
  mirror: boolean;
  shuffleSpawns: boolean;
  onPlatformCountChange: (v: number) => void;
  onIslandSizeChange: (v: "S" | "M" | "L") => void;
  onLayoutChange: (v: "every_round" | "per_match" | "classic") => void;
  onMirrorChange: (v: boolean) => void;
  onShuffleSpawnsChange: (v: boolean) => void;
}

export function CardB_Arena({
  platformCount,
  islandSize,
  layout,
  mirror,
  shuffleSpawns,
  onPlatformCountChange,
  onIslandSizeChange,
  onLayoutChange,
  onMirrorChange,
  onShuffleSpawnsChange,
}: CardBProps) {
  return (
    <Card badge="B" title="Arena">
      <Row label="Floating platforms">
        <Stepper
          value={platformCount}
          min={0}
          max={6}
          onChange={onPlatformCountChange}
        />
      </Row>

      <Row label="Island size">
        <Segmented
          options={[
            { label: "S (4 tiles)", value: "S" },
            { label: "M (6 tiles)", value: "M" },
            { label: "L (8 tiles)", value: "L" },
          ]}
          value={islandSize}
          onChange={onIslandSizeChange}
        />
      </Row>

      <Row label="Layout generation">
        <Segmented
          options={[
            { label: "Every round", value: "every_round" },
            { label: "Per match", value: "per_match" },
            { label: "Classic", value: "classic" },
          ]}
          value={layout}
          onChange={onLayoutChange}
        />
      </Row>

      <Row label="Mirror layout (fair symmetry)">
        <Toggle checked={mirror} onChange={onMirrorChange} />
      </Row>

      <Row label="Shuffle spawn spots">
        <Toggle checked={shuffleSpawns} onChange={onShuffleSpawnsChange} />
      </Row>
    </Card>
  );
}

