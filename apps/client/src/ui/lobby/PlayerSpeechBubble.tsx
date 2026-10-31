import { GameEmoteIcon } from "./LobbyIcons";

interface PlayerSpeechBubbleProps {
  emoji: string;
}

export function PlayerSpeechBubble({ emoji }: PlayerSpeechBubbleProps) {
  return (
    <div className="mp-speech-bubble">
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))",
        }}
      >
        <GameEmoteIcon emote={emoji} size={24} />
      </span>
      <div className="mp-bubble-tail" />
      <div className="mp-bubble-tail-inner" />
    </div>
  );
}

