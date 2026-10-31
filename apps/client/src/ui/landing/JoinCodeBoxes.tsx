import { type RefObject } from "preact";

interface JoinCodeBoxesProps {
  digits: string[];
  inputRefs: RefObject<HTMLInputElement>[];
  onDigitChange: (index: number, val: string) => void;
  onDigitPaste: (e: ClipboardEvent) => void;
  onDigitKeyDown: (index: number, e: KeyboardEvent) => void;
}

// Tile colors matching lobby code tiles
const BOX_FILL_COLORS = ["#FF5C5C", "#2ECC71", "#7C3AED", "#FFBE3C", "#38B6FF"];

export function JoinCodeBoxes({
  digits,
  inputRefs,
  onDigitChange,
  onDigitPaste,
  onDigitKeyDown,
}: JoinCodeBoxesProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(6px, 1.8vw, 10px)",
        width: "100%",
        margin: "4px 0",
      }}
    >
      <style>{`
        .mp-code-box:focus {
          border-color: #FFC93C !important;
          box-shadow: 0 3.5px 0 var(--mp-ink, #1B1B3A), 0 0 0 3px rgba(255, 201, 60, 0.35) !important;
          outline: none;
        }
        @keyframes mpCodeBoxShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
      {digits.map((digit, idx) => {
        const isFilled = Boolean(digit);
        return (
          <input
            key={idx}
            ref={inputRefs[idx]}
            type="text"
            value={digit}
            maxLength={1}
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellcheck={false}
            onInput={(e) =>
              onDigitChange(idx, (e.target as HTMLInputElement).value)
            }
            onPaste={onDigitPaste}
            onKeyDown={(e) => onDigitKeyDown(idx, e)}
            className="mp-code-box"
            style={{
              width: "clamp(42px, 11vw, 52px)",
              height: "clamp(50px, 12vw, 60px)",
              borderRadius: "14px",
              border: "3px solid var(--mp-ink, #1B1B3A)",
              background: isFilled ? BOX_FILL_COLORS[idx] : "#FFFFFF",
              boxShadow: "0 3.5px 0 var(--mp-ink, #1B1B3A)",
              textAlign: "center",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 5.5vw, 32px)",
              fontWeight: 900,
              color: isFilled ? "#FFFFFF" : "var(--mp-ink, #1B1B3A)",
              outline: "none",
              textTransform: "uppercase",
              padding: 0,
              boxSizing: "border-box",
              transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
              textShadow: isFilled ? "1px 1px 0 rgba(0,0,0,0.35)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}
