import { PLAYER_COLORS } from "@mutator-party/shared";
import { AvatarHead } from "../components/AvatarHead";
import { IconClose } from "../components/Icons";
import {
  GameCrownIcon,
  GameCheckIcon,
  GameWaitIcon,
  GameEmoteIcon,
  GameDevilHorn,
} from "./LobbyIcons";

interface PlayerSlotCardProps {
  name: string;
  colorIdx: number;
  isHost: boolean;
  isReady: boolean;
  activeEmote?: string | null;
  activeEmoteKey?: number;
  canKick?: boolean;
  onKick?: () => void;
}

export function PlayerSlotCard({
  name,
  colorIdx,
  isHost,
  isReady,
  activeEmote,
  activeEmoteKey,
  canKick,
  onKick,
}: PlayerSlotCardProps) {
  const colorHex = PLAYER_COLORS[colorIdx % PLAYER_COLORS.length] || "#FF6B6B";
  const readyActive = isHost || isReady;
  const isDevilEmote = activeEmote === "😈";

  return (
    <div
      className={`mp-player-pod ${readyActive ? "is-ready" : "is-waiting"} ${activeEmote ? "has-emote" : ""}`}
      style={{
        background: `linear-gradient(180deg, #FFFFFF 20%, ${colorHex}22 100%)`,
      }}
    >
      <style>{`
        .mp-player-pod {
          border: 2.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 16px;
          box-shadow: 2px 3.5px 0 var(--mp-ink, #1B1B3A);
          padding: 8px 4px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          position: relative;
          box-sizing: border-box;
          height: clamp(125px, 18vh, 155px);
          width: 100%;
          min-width: 0;
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease;
          user-select: none;
        }

        .mp-player-pod:hover {
          transform: translateY(-4px) scale(1.03);
          box-shadow: 2.5px 6px 0 var(--mp-ink, #1B1B3A);
        }

        .mp-pod-top-stripe {
          position: absolute;
          top: 0;
          left: 12px;
          right: 12px;
          height: 3.5px;
          border-radius: 0 0 4px 4px;
        }

        /* ── Cartoon Comic Speech Bubble ── */
        .mp-speech-bubble {
          position: absolute;
          top: -42px;
          left: 50%;
          transform: translateX(-50%);
          background: #FFFFFF;
          border: 2.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 14px;
          box-shadow: 2px 2.5px 0 var(--mp-ink, #1B1B3A);
          padding: 3px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 30;
          animation: mpBubblePopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          pointer-events: none;
        }

        @keyframes mpBubblePopIn {
          0% { transform: translateX(-50%) translateY(8px) scale(0.3); opacity: 0; }
          60% { transform: translateX(-50%) translateY(-5px) scale(1.25); opacity: 1; }
          100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        }

        .mp-bubble-tail {
          position: absolute;
          bottom: -7px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid var(--mp-ink, #1B1B3A);
        }

        .mp-bubble-tail::after {
          content: "";
          position: absolute;
          bottom: 2.5px;
          left: -4px;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #FFFFFF;
        }

        .mp-bubble-emoji {
          font-size: 24px;
          line-height: 1;
        }

        /* ── Avatar Jumping & Squishing Animation ── */
        .mp-pod-avatar-wrap {
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        /* Standard Joyful Jump/Squish */
        .mp-pod-avatar-wrap.is-jumping {
          animation: mpAvatarJumpSquish 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes mpAvatarJumpSquish {
          0% { transform: translateY(0) scale(1, 1); }
          15% { transform: translateY(4px) scale(1.35, 0.65); } /* Squash anticipation */
          45% { transform: translateY(-20px) scale(0.82, 1.3) rotate(-5deg); } /* High jump! */
          70% { transform: translateY(-8px) scale(1.1, 0.95) rotate(3deg); }
          85% { transform: translateY(3px) scale(1.2, 0.8); } /* Land squash */
          100% { transform: translateY(0) scale(1, 1) rotate(0deg); }
        }

        /* 😈 Mischievous Devil Physics */
        .mp-pod-avatar-wrap.is-devil {
          animation: mpAvatarDevilPhysics 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes mpAvatarDevilPhysics {
          0% { transform: translateY(0) scale(1, 1) rotate(0deg); }
          18% { transform: translateY(6px) scale(1.35, 0.65) rotate(-9deg); } /* Sneaky devious crouch */
          40% { transform: translateY(-16px) scale(0.82, 1.25) rotate(12deg); } /* Sinister pop-up */
          52% { transform: translateY(-10px) scale(1.05, 0.95) rotate(-8deg); } /* Menacing laugh wobble */
          68% { transform: translateY(-12px) scale(0.95, 1.05) rotate(7deg); } /* Menacing laugh wobble */
          84% { transform: translateY(2px) scale(1.18, 0.82) rotate(-3deg); } /* Sinister smirk settle */
          100% { transform: translateY(0) scale(1, 1) rotate(0deg); }
        }

        /* Devil Horns */
        .mp-devil-horns {
          position: absolute;
          top: -10px;
          left: -3px;
          right: -3px;
          display: flex;
          justify-content: space-between;
          padding: 0 4px;
          pointer-events: none;
          z-index: 12;
          animation: mpHornPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes mpHornPop {
          0% { transform: scale(0.2) translateY(6px); opacity: 0; }
          70% { transform: scale(1.25) translateY(-2px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        .mp-devil-horn {
          font-size: 14px;
          color: #A855F7;
          line-height: 1;
          filter: drop-shadow(1px 1.5px 0 var(--mp-ink, #1B1B3A));
        }

        .mp-horn-left {
          transform: rotate(-25deg);
        }

        .mp-horn-right {
          transform: rotate(25deg);
        }

        .mp-pod-crown {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 16px;
          line-height: 1;
          filter: drop-shadow(0 2px 0 rgba(27,27,58,0.5));
          animation: mpCrownWiggle 2s ease-in-out infinite;
          z-index: 5;
        }

        @keyframes mpCrownWiggle {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          25% { transform: translateX(-50%) rotate(-8deg) translateY(-2px); }
          75% { transform: translateX(-50%) rotate(8deg) translateY(-2px); }
        }

        .mp-pod-name {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: clamp(11.5px, 1.25vw, 13px);
          font-weight: 900;
          color: var(--mp-ink, #1B1B3A);
          text-align: center;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.2;
          margin: 4px 0 2px;
          padding: 0 2px;
          box-sizing: border-box;
        }

        .mp-pod-status {
          font-family: var(--font-display, "Rubik", sans-serif);
          font-size: clamp(9.5px, 1vw, 11px);
          font-weight: 900;
          padding: 2.5px 10px;
          border-radius: 9999px;
          border: 1.5px solid var(--mp-ink, #1B1B3A);
          box-shadow: 1px 1.5px 0 var(--mp-ink, #1B1B3A);
          line-height: 1.15;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }

        .mp-pod-status.ready {
          background: #3DDC97;
          color: #064E3B;
        }

        .mp-pod-status.waiting {
          background: #FFEAA7;
          color: #78350F;
        }

        .mp-pod-status.host {
          background: #FFD700;
          color: var(--mp-ink, #1B1B3A);
        }
      `}</style>

      {/* Top Color Accent Stripe */}
      <div
        className="mp-pod-top-stripe"
        style={{ background: colorHex }}
      />

      {canKick && onKick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onKick();
          }}
          title="Kick player"
          style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#FF4D4D",
            color: "#FFF",
            border: "2px solid #1B1B3A",
            fontSize: "12px",
            fontWeight: 900,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
            boxShadow: "1px 2px 0 #1B1B3A",
          }}
        >
          <IconClose size={12} strokeWidth={3} />
        </button>
      )}

      {/* Comic Speech Bubble */}
      {activeEmote && (
        <div className="mp-speech-bubble" key={`bubble_${activeEmote}_${activeEmoteKey || 0}`}>
          <span className="mp-bubble-emoji">
            <GameEmoteIcon emote={activeEmote} size={24} />
          </span>
          <span className="mp-bubble-tail" />
        </div>
      )}

      {/* Expressive Character Avatar with squish/jump & face emotion */}
      <div
        className={`mp-pod-avatar-wrap ${isDevilEmote ? "is-devil" : activeEmote ? "is-jumping" : ""}`}
        key={activeEmoteKey ? `avatar_${activeEmote}_${activeEmoteKey}` : "avatar_idle"}
      >
        {/* Devil Horns when emoting 😈 */}
        {isDevilEmote && (
          <div className="mp-devil-horns">
            <GameDevilHorn side="left" size={14} />
            <GameDevilHorn side="right" size={14} />
          </div>
        )}

        {/* Host Crown sitting directly on avatar so it jumps together! */}
        {isHost && !isDevilEmote && (
          <span className="mp-pod-crown">
            <GameCrownIcon size={18} />
          </span>
        )}

        <AvatarHead
          color={colorHex}
          size={42}
          emotion={activeEmote}
        />
      </div>

      {/* Player Nickname */}
      <div className="mp-pod-name" title={name}>
        {name}
      </div>

      {/* Status Pill */}
      <div
        className={`mp-pod-status ${isHost ? "host" : isReady ? "ready" : "waiting"}`}
      >
        {isHost ? (
          <>
            <GameCrownIcon size={12} />
            <span>Host</span>
          </>
        ) : isReady ? (
          <>
            <GameCheckIcon size={11} />
            <span>Ready</span>
          </>
        ) : (
          <>
            <GameWaitIcon size={11} />
            <span>Wait</span>
          </>
        )}
      </div>
    </div>
  );
}
