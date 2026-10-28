import { PlayerSlotCard } from "./PlayerSlotCard";
import { BotSlotCard } from "./BotSlotCard";

export interface SlotItem {
  type: "player" | "bot";
  id: string;
  name?: string;
  colorIdx?: number;
  isHost?: boolean;
  isReady?: boolean;
  activeEmote?: string | null;
  activeEmoteKey?: number;
  canKick?: boolean;
  onKick?: (playerId: string) => void;
}

interface PlayerGridProps {
  slots: SlotItem[];
  fillBots: boolean;
  onKick?: (playerId: string) => void;
}

export function PlayerGrid({ slots, fillBots, onKick }: PlayerGridProps) {
  return (
    <div className="mp-lineup-stage">
      <style>{`
        .mp-lineup-stage {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: clamp(6px, 1vw, 12px);
          width: 100%;
          background: #FFFBF0;
          border: 3px solid var(--mp-ink, #1B1B3A);
          border-radius: 20px;
          box-shadow: 3px 4px 0 var(--mp-ink, #1B1B3A);
          padding: clamp(8px, 1.4vh, 14px) clamp(8px, 1.2vw, 14px);
          box-sizing: border-box;
          align-items: center;
          position: relative;
        }

        @media (max-width: 720px) {
          .mp-lineup-stage {
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 8px;
          }
        }
      `}</style>

      {slots.map((slot) => {
        if (slot.type === "player") {
          return (
            <PlayerSlotCard
              key={slot.id}
              name={slot.name || "Player"}
              colorIdx={slot.colorIdx ?? 0}
              isHost={Boolean(slot.isHost)}
              isReady={Boolean(slot.isReady)}
              activeEmote={slot.activeEmote}
              activeEmoteKey={slot.activeEmoteKey}
              canKick={slot.canKick}
              onKick={onKick ? () => onKick(slot.id) : undefined}
            />
          );
        }

        return <BotSlotCard key={slot.id} fillBots={fillBots} />;
      })}
    </div>
  );
}
