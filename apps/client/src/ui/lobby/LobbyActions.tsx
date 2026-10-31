interface LobbyActionsProps {
  isHost: boolean;
  isReady: boolean;
  unreadyGuests: number;
  onStart: () => void;
  onToggleReady: () => void;
}

export function LobbyActions({
  isHost,
  isReady,
  unreadyGuests,
  onStart,
  onToggleReady,
}: LobbyActionsProps) {
  return (
    <div className="mp-lobby-launchpad">
      <style>{`
        .mp-lobby-launchpad {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          gap: 3px;
          width: 100%;
          box-sizing: border-box;
        }

        .mp-launch-status {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          text-align: right;
          display: flex;
          align-items: center;
          gap: 5px;
          line-height: 1.1;
          white-space: nowrap;
        }

        .mp-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
          animation: mpPulse 1.5s infinite;
        }

        @keyframes mpPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes mpBtnIdlePulse {
          0%, 100% { box-shadow: 0 4px 0 var(--mp-ink, #1B1B3A); }
          50% { box-shadow: 0 6px 0 var(--mp-ink, #1B1B3A), 0 0 12px rgba(27, 27, 58, 0.15); }
        }

        .mp-btn-big-action {
          width: 100%;
          min-width: 200px;
          max-width: 320px;
          height: clamp(40px, 5.2vh, 48px);
          border-radius: 9999px;
          border: 3px solid var(--mp-ink, #1B1B3A);
          box-shadow: 0 4px 0 var(--mp-ink, #1B1B3A);
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: clamp(17px, 2vw, 21px);
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
          outline: none;
          letter-spacing: 0.5px;
          animation: mpBtnIdlePulse 2.5s ease-in-out infinite;
        }

        .mp-btn-big-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 var(--mp-ink, #1B1B3A);
          filter: brightness(1.04);
        }

        .mp-btn-big-action:active {
          transform: translateY(2px);
          box-shadow: 0 1.5px 0 var(--mp-ink, #1B1B3A);
        }

        .mp-btn-start-host {
          background: #FFC93C;
          color: var(--mp-ink, #1B1B3A);
        }

        .mp-btn-ready-guest {
          background: #3DDC97;
          color: var(--mp-ink, #1B1B3A);
        }

        .mp-btn-unready-guest {
          background: #FF6B6B;
          color: #FFFFFF;
        }

        @media (max-width: 768px), (max-height: 600px) {
          .mp-lobby-launchpad {
            align-items: flex-end;
          }
          .mp-launch-status {
            text-align: right;
            font-size: 11.5px;
          }
          .mp-btn-big-action {
            width: auto;
            min-width: 130px;
            max-width: 220px;
            height: 44px;
            font-size: clamp(14px, 2.8vw, 17px);
            padding: 0 14px;
          }
        }

        @media (max-width: 600px) and (orientation: portrait) {
          .mp-btn-big-action {
            width: auto;
          }
        }
      `}</style>

      {/* Dynamic Status line */}
      <div className="mp-launch-status">
        <span className="mp-pulse-dot" />
        <span>
          {isHost
            ? unreadyGuests > 0
              ? `Waiting for ${unreadyGuests} guest${unreadyGuests > 1 ? "s" : ""} to ready up`
              : "All ready! Bots fill empty slots"
            : isReady
              ? "You're ready! Waiting for host..."
              : "Hit Ready Up when you're set!"}
        </span>
      </div>

      {/* Big Action Button */}
      {isHost ? (
        <button
          type="button"
          className="mp-btn-big-action mp-btn-start-host"
          onClick={onStart}
        >
          <span>START MATCH</span>
        </button>
      ) : (
        <button
          type="button"
          className={`mp-btn-big-action ${isReady ? "mp-btn-unready-guest" : "mp-btn-ready-guest"}`}
          onClick={onToggleReady}
        >
          {isReady ? <span>Cancel Ready</span> : <span>READY UP!</span>}
        </button>
      )}
    </div>
  );
}
