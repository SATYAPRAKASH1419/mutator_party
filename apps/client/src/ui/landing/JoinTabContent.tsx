import type { RefObject } from "preact";
import { JoinCodeBoxes } from "./JoinCodeBoxes";

interface JoinTabContentProps {
  digits: string[];
  inputRefs: RefObject<HTMLInputElement>[];
  onDigitChange: (index: number, val: string) => void;
  onDigitKeyDown: (index: number, e: KeyboardEvent) => void;
  onJoin: () => void;
}

export function JoinTabContent({
  digits,
  inputRefs,
  onDigitChange,
  onDigitKeyDown,
  onJoin,
}: JoinTabContentProps) {
  return (
    <div className="mp-tab-content-container">
      <div
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color: "#64748B",
          textAlign: "center",
        }}
      >
        Enter the 5-letter room code:
      </div>

      <JoinCodeBoxes
        digits={digits}
        inputRefs={inputRefs}
        onDigitChange={onDigitChange}
        onDigitKeyDown={onDigitKeyDown}
      />

      <button
        type="button"
        className="mp-btn-cta"
        onClick={onJoin}
        style={{
          background: "var(--mp-mint, #3DDC97)",
        }}
      >
        <span>Join Room</span>
      </button>
    </div>
  );
}

