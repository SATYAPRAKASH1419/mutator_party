import { GameChatIcon, GameEmoteIcon } from "./LobbyIcons";

interface QuickEmotesBarProps {
  onEmote: (emoji: string) => void;
}

const LOBBY_EMOTES = ["😂", "🔥", "🎉", "👀", "💪", "💩", "😈", "👏"];

export function QuickEmotesBar({ onEmote }: QuickEmotesBarProps) {
  return (
    <div className="mp-quick-emotes-bar">
      <style>{`
        .mp-quick-emotes-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          user-select: none;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid var(--mp-ink, #1B1B3A);
          border-radius: 9999px;
          box-shadow: 2px 2px 0 var(--mp-ink, #1B1B3A);
          padding: 4px 14px;
          width: fit-content;
          margin: 0 auto;
        }

        .mp-emotes-label {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 11.5px;
          font-weight: 900;
          color: var(--mp-ink, #1B1B3A);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mp-emotes-list {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mp-emote-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #FFFFFF;
          border: 2px solid var(--mp-ink, #1B1B3A);
          box-shadow: 1.5px 1.5px 0 var(--mp-ink, #1B1B3A);
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.12s ease;
          outline: none;
          padding: 0;
          flex-shrink: 0;
        }

        .mp-emote-btn:hover {
          transform: translateY(-3px) scale(1.18);
          box-shadow: 2px 3px 0 var(--mp-ink, #1B1B3A);
        }

        .mp-emote-btn:active {
          transform: translateY(1px) scale(0.92);
          box-shadow: 0.5px 0.5px 0 var(--mp-ink, #1B1B3A);
        }
      `}</style>

      <span className="mp-emotes-label">
        <span>React</span>
        <GameChatIcon size={14} />
      </span>

      <div className="mp-emotes-list">
        {LOBBY_EMOTES.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="mp-emote-btn"
            onClick={() => onEmote(emoji)}
            title={`React with ${emoji}`}
          >
            <GameEmoteIcon emote={emoji} size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}
