interface BotSlotCardProps {
  fillBots: boolean;
}

export function BotSlotCard({ fillBots }: BotSlotCardProps) {
  return (
    <div className="mp-bot-pod">
      <style>{`
        .mp-bot-pod {
          background: rgba(255, 255, 255, 0.55);
          border: 2.5px dashed #CBD5E1;
          border-radius: 16px;
          padding: 8px 4px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          height: clamp(125px, 18vh, 155px);
          width: 100%;
          min-width: 0;
          transition: background 0.15s ease, border-color 0.15s ease;
          user-select: none;
        }

        .mp-bot-pod:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: #94A3B8;
        }

        .mp-bot-avatar-wrap {
          margin-top: 10px;
          font-size: 36px;
          line-height: 1;
          filter: grayscale(0.2) drop-shadow(0 2px 3px rgba(0,0,0,0.08));
        }

        .mp-bot-name {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: clamp(11.5px, 1.2vw, 12.5px);
          font-weight: 800;
          color: #64748B;
          text-align: center;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.2;
          margin: 4px 0 2px;
        }

        .mp-bot-status {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: clamp(9px, 0.95vw, 10.5px);
          font-weight: 800;
          padding: 2.5px 8px;
          border-radius: 9999px;
          background: #E2E8F0;
          color: #475569;
          border: 1.2px solid #CBD5E1;
          line-height: 1.15;
          white-space: nowrap;
        }
      `}</style>

      {/* Bot Icon */}
      <div className="mp-bot-avatar-wrap">
        <span>{fillBots ? "🤖" : "👤"}</span>
      </div>

      {/* Label */}
      <div className="mp-bot-name">
        {fillBots ? "Bot Slot" : "Open Slot"}
      </div>

      {/* Status */}
      <div className="mp-bot-status">
        {fillBots ? "Auto-joins" : "Waiting"}
      </div>
    </div>
  );
}
