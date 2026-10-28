import type { PresetType } from "./useSettingsForm";

interface SettingsHeaderProps {
  activePreset: PresetType;
  activeTab: "rules" | "safety";
  isFullscreen: boolean;
  isMobile: boolean;
  onApplyPreset: (preset: "classic" | "chaos" | "tournament" | "chill") => void;
  onSelectTab: (tab: "rules" | "safety") => void;
  onToggleFullscreen: () => void;
}

const PRESETS = [
  { id: "chaos", label: "Chaos Party" },
  { id: "classic", label: "Classic" },
  { id: "tournament", label: "Tournament" },
  { id: "chill", label: "Chill" },
] as const;

export function SettingsHeader({
  activePreset,
  activeTab,
  isFullscreen,
  isMobile,
  onApplyPreset,
  onSelectTab,
  onToggleFullscreen,
}: SettingsHeaderProps) {
  return (
    <div
      className="mp-createroom-header"
      style={{
        background: "var(--mp-night)",
        color: "var(--mp-paper)",
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        borderBottom: "3px solid var(--mp-ink)",
        flexShrink: 0,
        flexWrap: "nowrap",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {/* Left: Title + Presets */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(19px, 2.4vw, 25px)",
            color: "var(--mp-sun)",
            WebkitTextStroke: "1.5px var(--mp-ink)",
            paintOrder: "stroke fill",
            textShadow: "0 2px 0 var(--mp-ink)",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Room Settings
        </span>

        {/* Presets Chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexWrap: "nowrap",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              opacity: 0.7,
              marginRight: "2px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            Presets:
          </span>
          {PRESETS.map((p) => {
            const isSel = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onApplyPreset(p.id)}
                style={{
                  background: isSel
                    ? "var(--mp-sun)"
                    : "rgba(255,255,255,0.12)",
                  color: isSel ? "var(--mp-ink)" : "var(--mp-paper)",
                  border: isSel
                    ? "1.8px solid var(--mp-ink)"
                    : "1px solid rgba(255,255,255,0.25)",
                  borderRadius: "9999px",
                  padding: "3px 9px",
                  fontWeight: 900,
                  fontSize: "11px",
                  cursor: "pointer",
                  boxShadow: isSel ? "1.5px 1.5px 0 var(--mp-ink)" : "none",
                  transition: "all 0.1s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {p.label}
              </button>
            );
          })}
          {activePreset === "custom" && (
            <span
              style={{
                background: "var(--mp-grape)",
                color: "#fff",
                borderRadius: "9999px",
                padding: "2px 8px",
                fontSize: "10.5px",
                fontWeight: 900,
                border: "1.5px solid var(--mp-ink)",
                whiteSpace: "nowrap",
              }}
            >
              Custom
            </span>
          )}
        </div>
      </div>

      {/* Right: Section Tabs + Fullscreen */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => onSelectTab("rules")}
          style={{
            background:
              activeTab === "rules"
                ? "var(--mp-mint)"
                : "rgba(255,255,255,0.12)",
            color: activeTab === "rules" ? "var(--mp-ink)" : "#fff",
            border:
              activeTab === "rules"
                ? "2px solid var(--mp-ink)"
                : "1.5px solid rgba(255,255,255,0.25)",
            borderRadius: "9999px",
            padding: "4px 11px",
            fontWeight: 900,
            fontSize: "11.5px",
            cursor: "pointer",
            boxShadow:
              activeTab === "rules" ? "1.5px 1.5px 0 var(--mp-ink)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            whiteSpace: "nowrap",
          }}
        >
          <span>🎮 Rules</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab("safety")}
          style={{
            background:
              activeTab === "safety"
                ? "var(--mp-coral)"
                : "rgba(255,255,255,0.12)",
            color: "#fff",
            border:
              activeTab === "safety"
                ? "2px solid var(--mp-ink)"
                : "1.5px solid rgba(255,255,255,0.25)",
            borderRadius: "9999px",
            padding: "4px 11px",
            fontWeight: 900,
            fontSize: "11.5px",
            cursor: "pointer",
            boxShadow:
              activeTab === "safety" ? "1.5px 1.5px 0 var(--mp-ink)" : "none",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            whiteSpace: "nowrap",
          }}
        >
          <span>🛡️ Room & Safety</span>
        </button>

        {/* Compact Fullscreen Toggle (Only on Desktop) */}
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            style={{
              background: "rgba(255,255,255,0.14)",
              color: "var(--mp-paper)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              borderRadius: "9999px",
              padding: "4px 9px",
              fontSize: "11px",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap",
            }}
          >
            <span>{isFullscreen ? "✕" : "⛶"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

