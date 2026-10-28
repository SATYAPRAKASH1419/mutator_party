import { useState, useMemo, useEffect } from "preact/hooks";
import { PLAYER_COLORS, type RoomSettings } from "@mutator-party/shared";
import type { PlayerClientState } from "../app/store";

import { RoomCodeHeader } from "./lobby/RoomCodeHeader";
import { PlayerGrid, type SlotItem } from "./lobby/PlayerGrid";
import { QuickEmotesBar } from "./lobby/QuickEmotesBar";
import { clientLog } from "../util/logger";
import { LobbyActions } from "./lobby/LobbyActions";
import { BannerAd } from "./components/BannerAd";
import { RulesModal } from "./lobby/RulesModal";

interface LobbyProps {
  roomCode: string;
  isHost: boolean;
  players: PlayerClientState[];
  settings: Partial<RoomSettings> | null;
  onStart: () => void;
  onToggleReady: (ready: boolean) => void;
  onEmote: (emoji: string) => void;
  onLeave: () => void;
  onEditRules?: () => void;
  onKick?: (playerId: string) => void;
}

export function Lobby({
  roomCode,
  isHost,
  players,
  settings,
  onStart,
  onToggleReady,
  onEmote,
  onLeave,
  onEditRules,
  onKick,
}: LobbyProps) {
  const [isReady, setIsReady] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [playerEmotes, setPlayerEmotes] = useState<Record<string, { emoji: string; key: number }>>({});

  const handleToggle = () => {
    clientLog.action("Lobby ready button clicked", { nextReady: !isReady });
    const next = !isReady;
    setIsReady(next);
    onToggleReady(next);
  };

  const handleOpenSettingsOrRules = () => {
    if (isHost && onEditRules) {
      onEditRules();
    } else {
      setShowRulesModal(true);
    }
  };

  const maxPlayers = settings?.match?.maxPlayers ?? 8;
  const fillBots = settings?.match?.fillBots ?? true;

  // Prepare 8 player/bot slots for 1x8 lineup row
  const actualPlayers = players && players.length > 0 ? players : [];
  const displaySlots: SlotItem[] = useMemo(() => {
    // If no players yet in state, show fallback host so slot is never empty
    const effectivePlayers: Array<{ id?: string; name?: string; color?: number }> =
      actualPlayers.length > 0
        ? actualPlayers
        : [
            {
              id: "host_local",
              name: isHost ? "Satya" : "Player",
              color: 0,
            },
          ];

    const slots: SlotItem[] = [];
    for (let i = 0; i < 8; i++) {
      if (i < effectivePlayers.length && effectivePlayers[i]) {
        const p = effectivePlayers[i]!;
        const slotId = p.id || `p_${i}`;
        const isPlayerHost = (p as any).host ?? (i === 0);
        const readyStatus = isPlayerHost ? true : ((p as any).ready ?? isReady);
        const canKick = isHost && !isPlayerHost;

        const activeEmoteData = playerEmotes[slotId];

        slots.push({
          type: "player",
          id: slotId,
          name: p.name || `Player ${i + 1}`,
          colorIdx: p.color !== undefined ? p.color : i % PLAYER_COLORS.length,
          isHost: isPlayerHost,
          isReady: readyStatus,
          canKick,
          activeEmote: activeEmoteData?.emoji || null,
          activeEmoteKey: activeEmoteData?.key,
        });
      } else {
        slots.push({
          type: "bot",
          id: `bot_slot_${i}`,
        });
      }
    }
    return slots;
  }, [actualPlayers, isHost, isReady, playerEmotes]);

  // Handle Emote trigger (Option 1: Pop speech bubble on local player's card)
  const handleLocalEmote = (emoji: string) => {
    const localId = displaySlots[0]?.id || "host_local";
    const newKey = Date.now() + Math.floor(Math.random() * 1000);
    setPlayerEmotes((prev) => ({ ...prev, [localId]: { emoji, key: newKey } }));
    onEmote(emoji);

    setTimeout(() => {
      setPlayerEmotes((prev) => {
        if (prev[localId]?.key === newKey) {
          const next = { ...prev };
          delete next[localId];
          return next;
        }
        return prev;
      });
    }, 2400);
  };

  useEffect(() => {
    const onRemoteEmote = (e: any) => {
      const detail = e.detail;
      if (!detail?.id) return;
      const targetSlot = displaySlots.find((s) => s.id === detail.playerId) || displaySlots[0];
      const slotId = targetSlot ? targetSlot.id : (displaySlots[0]?.id || "host_local");
      const newKey = Date.now() + Math.floor(Math.random() * 1000);
      setPlayerEmotes((prev) => ({ ...prev, [slotId]: { emoji: detail.id, key: newKey } }));
      setTimeout(() => {
        setPlayerEmotes((prev) => {
          if (prev[slotId]?.key === newKey) {
            const next = { ...prev };
            delete next[slotId];
            return next;
          }
          return prev;
        });
      }, 2400);
    };
    window.addEventListener("mp:emote", onRemoteEmote);
    return () => window.removeEventListener("mp:emote", onRemoteEmote);
  }, [displaySlots]);

  // Count unready guests
  const unreadyGuests = displaySlots.filter(
    (s) => s.type === "player" && !s.isHost && !s.isReady,
  ).length;

  return (
    <div className="mp-lobby-wrap">
      {/* Modern, Playful Single-Page Layout */}
      <style>{`
        .mp-lobby-wrap {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100dvh;
          max-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #9be5ff 0%, #cdefff 50%, #fff2d1 100%);
          padding: var(--safe-max-y, 8px) var(--safe-max-x, 14px);
          box-sizing: border-box;
          overflow: hidden;
          font-family: var(--font-body);
          user-select: none;
          -webkit-user-select: none;
        }

        .mp-lobby-container {
          width: min(1060px, 98vw);
          max-height: calc(100dvh - (var(--safe-max-y, 8px) * 2));
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-sizing: border-box;
          position: relative;
        }

        /* Hero Playful Stage Card */
        .mp-lobby-main-card {
          background: var(--mp-paper, #FFF8E7);
          border: 3.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 24px;
          box-shadow: 4px 6px 0 var(--mp-ink, #1B1B3A);
          padding: clamp(12px, 2vh, 18px) clamp(14px, 2vw, 22px);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: clamp(10px, 1.6vh, 16px);
          overflow: hidden;
          width: 100%;
        }

        /* Room Code Squircle Tile */
        .mp-code-tile {
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(34px, 4vw, 44px);
          height: clamp(40px, 4.6vw, 50px);
          border-radius: 13px;
          border: 2.5px solid var(--mp-ink, #1B1B3A);
          box-shadow: 0 3px 0 var(--mp-ink, #1B1B3A);
          font-family: var(--font-display);
          font-size: clamp(22px, 2.6vw, 28px);
          font-weight: 900;
          color: #FFFFFF;
          text-shadow: 
            1.5px 1.5px 0 var(--mp-ink, #1B1B3A),
            -1.2px -1.2px 0 var(--mp-ink, #1B1B3A),
            1.2px -1.2px 0 var(--mp-ink, #1B1B3A),
            -1.2px 1.2px 0 var(--mp-ink, #1B1B3A);
          line-height: 1;
          transition: transform 0.15s ease;
        }
        .mp-code-tile:hover {
          transform: translateY(-2px);
        }

        /* Center Stage Section */
        .mp-center-stage {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        /* Stage Subheading */
        .mp-stage-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0 4px;
        }

        .mp-stage-title {
          font-family: var(--font-display);
          font-size: clamp(15px, 1.7vw, 18px);
          font-weight: 900;
          color: var(--mp-ink, #1B1B3A);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mp-player-count-badge {
          background: #FFEAA7;
          border: 1.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 9999px;
          padding: 1px 8px;
          font-size: 11.5px;
          font-weight: 900;
        }

        /* Footer Row: Banner Ad on LEFT, Start Game on RIGHT */
        .mp-lobby-footer-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: clamp(12px, 2vw, 28px);
          width: 100%;
          padding-top: clamp(8px, 1.4vh, 12px);
          border-top: 2.5px dashed rgba(27, 27, 58, 0.14);
          flex-shrink: 0;
        }

        /* Left Side: Google Banner Ad Slot */
        .mp-footer-ad-side {
          flex: 1;
          max-width: 440px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        /* Right Side: Primary Game Launchpad */
        .mp-footer-action-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        /* Landscape Mobile adjustments */
        @media (orientation: landscape) and (max-height: 520px) {
          .mp-lobby-main-card {
            padding: 8px 12px;
            gap: 6px;
            border-radius: 18px;
          }
          .mp-code-tile {
            width: 30px;
            height: 36px;
            font-size: 19px;
          }
          .mp-stage-title {
            font-size: 13.5px;
          }
          .mp-lobby-footer-row {
            padding-top: 4px;
            gap: 8px;
          }
        }

        /* Portrait Mobile fallback */
        @media (max-width: 600px) and (orientation: portrait) {
          .mp-lobby-footer-row {
            flex-direction: column-reverse;
            gap: 10px;
          }
          .mp-footer-ad-side,
          .mp-footer-action-side {
            max-width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="mp-lobby-container">
        <div className="mp-lobby-main-card">
          {/* 1. ROOM CODE HEADER + SHARE + SETTINGS + LEAVE */}
          <RoomCodeHeader
            roomCode={roomCode}
            isHost={isHost}
            onOpenSettings={handleOpenSettingsOrRules}
            onLeave={onLeave}
          />

          {/* 2. CENTER STAGE: CHARACTER LINEUP PODIUM + SPEECH BUBBLES */}
          <div className="mp-center-stage">
            <div className="mp-stage-header">
              <div className="mp-stage-title">
                <span>Players in Room</span>
                <span className="mp-player-count-badge">
                  {actualPlayers.length > 0 ? actualPlayers.length : 1} / {maxPlayers}
                </span>
              </div>
            </div>

            {/* 1x8 Character Lineup Podium */}
            <PlayerGrid slots={displaySlots} fillBots={fillBots} onKick={onKick} />

            {/* Centered Arcade Reaction Deck */}
            <QuickEmotesBar onEmote={handleLocalEmote} />
          </div>

          {/* 3. FOOTER: BANNER AD (LEFT) + START GAME (RIGHT) */}
          <div className="mp-lobby-footer-row">
            {/* Left: Google Ads Banner Slot */}
            <div className="mp-footer-ad-side">
              <BannerAd slotId="mp-lobby-google-ad" format="horizontal" />
            </div>

            {/* Right: Primary Game Launchpad */}
            <div className="mp-footer-action-side">
              <LobbyActions
                isHost={isHost}
                isReady={isReady}
                unreadyGuests={unreadyGuests}
                onStart={onStart}
                onToggleReady={handleToggle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rules Modal (opened when a guest clicks ℹ️ Rules) */}
      {showRulesModal && (
        <RulesModal
          settings={settings}
          isHost={isHost}
          onClose={() => setShowRulesModal(false)}
          onEditSettings={onEditRules}
        />
      )}
    </div>
  );
}
