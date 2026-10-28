import { PLAYER_COLORS } from "@mutator-party/shared";

interface ColorPaletteRowProps {
  selectedColor: number;
  onSelectColor: (idx: number) => void;
}

export function ColorPaletteRow({
  selectedColor,
  onSelectColor,
}: ColorPaletteRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "2px 0 6px" }}>
      <span style={{ fontSize: "12px", fontWeight: 900, color: "var(--mp-muted)" }}>Color:</span>
      <div style={{ display: "flex", gap: "6px" }}>
        {PLAYER_COLORS.map((hex, idx) => {
          const isSelected = selectedColor === idx;
          return (
            <button
              key={hex}
              type="button"
              onClick={() => onSelectColor(idx)}
              title={`Color ${idx + 1}`}
              style={{
                width: isSelected ? "24px" : "20px",
                height: isSelected ? "24px" : "20px",
                borderRadius: "50%",
                backgroundColor: hex,
                border: isSelected ? "2.5px solid var(--mp-ink)" : "2px solid rgba(27,27,58,0.5)",
                transform: isSelected ? "scale(1.15)" : "scale(1)",
                boxShadow: isSelected ? "0 2px 0 var(--mp-ink)" : "none",
                cursor: "pointer",
                padding: 0,
                outline: "none",
                transition: "transform 0.1s ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

