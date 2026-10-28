interface PlayerSpeechBubbleProps {
  emoji: string;
}

export function PlayerSpeechBubble({ emoji }: PlayerSpeechBubbleProps) {
  return (
    <div className="mp-speech-bubble">
      <span
        style={{
          fontSize: "20px",
          lineHeight: 1,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))",
        }}
      >
        {emoji}
      </span>
      <div className="mp-bubble-tail" />
      <div className="mp-bubble-tail-inner" />
    </div>
  );
}

