import { THEMES, type Theme } from "@mutator-party/shared";
import { THEME_INFO } from "./constants";
import { Card, Row, Segmented } from "./components";

interface CardGProps {
  themeMode: "fixed" | "rotate" | "random" | "custom";
  fixedTheme: Theme;
  onThemeModeChange: (v: "fixed" | "rotate" | "random" | "custom") => void;
  onFixedThemeChange: (th: Theme) => void;
}

export function CardG_Theme({
  themeMode,
  fixedTheme,
  onThemeModeChange,
  onFixedThemeChange,
}: CardGProps) {
  return (
    <Card badge="G" title="Theme">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: "8px",
          margin: "4px 0",
        }}
      >
        {THEMES.map((th) => {
          const isSel = fixedTheme === th;
          const info = THEME_INFO[th];
          return (
            <button
              key={th}
              type="button"
              onClick={() => onFixedThemeChange(th)}
              style={{
                padding: "8px 6px",
                borderRadius: "12px",
                border: isSel
                  ? "3px solid var(--mp-ink)"
                  : "2px solid var(--mp-ink)",
                background: info.bg,
                boxShadow: isSel
                  ? "0 0 0 2.5px var(--mp-sun), 2px 3px 0 var(--mp-ink)"
                  : "1px 2px 0 var(--mp-ink)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                transform: isSel ? "scale(1.04)" : "scale(1)",
                transition: "all 0.1s ease",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  color:
                    th === "neon" || th === "space" || th === "diwali"
                      ? "#FFF8E7"
                      : "var(--mp-ink)",
                  textShadow:
                    th === "neon" || th === "space" || th === "diwali"
                      ? "0 1px 2px rgba(0,0,0,0.8)"
                      : "none",
                }}
              >
                {info.name}
              </span>
            </button>
          );
        })}
      </div>

      <Row label="Theme rotation">
        <Segmented
          options={[
            { label: "Rotate", value: "rotate" },
            { label: "Fixed", value: "fixed" },
            { label: "Random", value: "random" },
            { label: "Custom", value: "custom" },
          ]}
          value={themeMode}
          onChange={onThemeModeChange}
        />
      </Row>
    </Card>
  );
}

