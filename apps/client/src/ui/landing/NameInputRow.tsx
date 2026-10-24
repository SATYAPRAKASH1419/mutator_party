import { IconDice } from "@/ui/components/Icons";

interface NameInputRowProps {
  name: string;
  nameError: string;
  onNameChange: (val: string) => void;
  onRollDice: () => void;
}

export function NameInputRow({
  name,
  nameError,
  onNameChange,
  onRollDice,
}: NameInputRowProps) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
      <label
        style={{
          fontSize: "12px",
          fontWeight: 900,
          color: "var(--mp-ink, #1B1B3A)",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        Your Nickname
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
        <input
          type="text"
          value={name}
          onInput={(e) => onNameChange((e.target as HTMLInputElement).value)}
          maxLength={16}
          placeholder="Enter nickname..."
          autoComplete="nickname"
          autoCorrect="off"
          spellcheck={false}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "8px 16px",
            borderRadius: "9999px",
            border: "3px solid var(--mp-ink, #1B1B3A)",
            background: "#FFFFFF",
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            fontWeight: 900,
            color: "var(--mp-ink, #1B1B3A)",
            outline: "none",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
            boxSizing: "border-box",
          }}
        />

        {/* Party Dice Randomize Button */}
        <button
          type="button"
          onClick={onRollDice}
          title="Roll random fun nickname"
          className="mp-dice-btn"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "2.5px solid var(--mp-ink, #1B1B3A)",
            background: "var(--mp-sun, #FFC93C)",
            color: "var(--mp-ink, #1B1B3A)",
            boxShadow: "2px 2.5px 0 var(--mp-ink, #1B1B3A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
            transition: "transform 0.1s ease, box-shadow 0.1s ease",
          }}
        >
          <IconDice size={20} />
        </button>
      </div>

      {nameError && (
        <div
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "var(--mp-danger, #E63946)",
            paddingLeft: "4px",
          }}
        >
          {nameError}
        </div>
      )}
    </div>
  );
}

