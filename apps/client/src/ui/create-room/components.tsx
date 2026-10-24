import type { ComponentChildren } from "preact";
import { stepperBtnStyle } from "./constants";

export function Card({
  badge,
  title,
  children,
}: {
  badge?: string;
  title: string;
  children: ComponentChildren;
}) {
  return (
    <div
      className="mp-panel"
      style={{
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "var(--mp-paper)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            fontWeight: 900,
            fontSize: "15.5px",
            color: "var(--mp-ink)",
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export function Badge({ letter }: { letter?: string }) {
  return null;
}

export function Row({
  label,
  children,
}: {
  label: string;
  children: ComponentChildren;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          fontWeight: 900,
          color: "var(--mp-ink)",
          minWidth: "120px",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export function Stepper({
  value,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "2.5px solid var(--mp-ink)",
        borderRadius: "9999px",
        background: disabled ? "#EAEAEA" : "var(--mp-paper)",
        opacity: disabled ? 0.6 : 1,
        overflow: "hidden",
        boxShadow: "1.5px 2px 0 var(--mp-ink)",
      }}
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        style={stepperBtnStyle}
      >
        −
      </button>
      <span
        style={{
          minWidth: "32px",
          textAlign: "center",
          fontWeight: 900,
          fontSize: "13px",
          padding: "0 6px",
          color: "var(--mp-ink)",
        }}
      >
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
        style={stepperBtnStyle}
      >
        +
      </button>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: "48px",
        height: "26px",
        borderRadius: "9999px",
        border: "2.5px solid var(--mp-ink)",
        backgroundColor: checked ? "var(--mp-mint)" : "#C0C0D0",
        position: "relative",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
        flexShrink: 0,
        boxShadow: "1.5px 2px 0 var(--mp-ink)",
      }}
    >
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          border: "2px solid var(--mp-ink)",
          position: "absolute",
          top: "1.5px",
          left: checked ? "23px" : "2px",
          transition: "left 0.15s ease",
        }}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "2.5px solid var(--mp-ink)",
        borderRadius: "9999px",
        background: "var(--mp-paper)",
        padding: "2px",
        gap: "2px",
        flexWrap: "wrap",
        boxShadow: "1.5px 2px 0 var(--mp-ink)",
      }}
    >
      {options.map((opt) => {
        const isSel = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              border: isSel ? "2px solid var(--mp-ink)" : "none",
              borderRadius: "9999px",
              background: isSel ? "var(--mp-sun)" : "transparent",
              color: "var(--mp-ink)",
              fontWeight: 900,
              fontSize: "12px",
              padding: "4px 10px",
              cursor: "pointer",
              transition: "background 0.1s ease",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

