import { useState, useMemo } from "preact/hooks";
import { PLAYER_COLORS, type RoomSettings } from "@mutator-party/shared";
import type { PlayerClientState } from "../app/store";

import { RoomCodeHeader } from "./lobby/RoomCodeHeader";
import { PlayerGrid, type SlotItem } from "./lobby/PlayerGrid";
import { QuickEmotesBar } from "./lobby/QuickEmotesBar";
import { clientLog } from "../util/logger";
import { LobbyActions } from "./lobby/LobbyActions";
import { BannerAd } from "./components/BannerAd";
import { RulesModal } from "./lobby/RulesModal";
import { useLobbyEmotes } from "./lobby/useLobbyEmotes";
import { useRulesSummary } from "./lobby/useRulesSummary";

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
  const rulesSummary = useRulesSummary(settings);

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

        slots.push({
          type: "player",
          id: slotId,
          name: p.name || `Player ${i + 1}`,
          colorIdx: p.color !== undefined ? p.color : i % PLAYER_COLORS.length,
          isHost: isPlayerHost,
          isReady: readyStatus,
          canKick,
          activeEmote: null,
        });
      } else {
        slots.push({
          type: "bot",
          id: `bot_slot_${i}`,
        });
      }
    }
    return slots;
  }, [actualPlayers, isHost, isReady]);

  const { playerEmotes, handleLocalEmote } = useLobbyEmotes(displaySlots, onEmote);

  // Attach active emote data to display slots
  const enrichedSlots: SlotItem[] = useMemo(() => {
    return displaySlots.map((slot) => {
      const activeEmoteData = playerEmotes[slot.id];
      if (!activeEmoteData) return slot;
      return {
        ...slot,
        activeEmote: activeEmoteData.emoji,
        activeEmoteKey: activeEmoteData.key,
      };
    });
  }, [displaySlots, playerEmotes]);

  // Count unready guests
  const unreadyGuests = enrichedSlots.filter(
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

        /* Footer Row: Start Game only (ad moved below card) */
        .mp-lobby-footer-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: clamp(12px, 2vw, 28px);
          width: 100%;
          padding-top: clamp(8px, 1.4vh, 12px);
          border-top: 2.5px dashed rgba(27, 27, 58, 0.14);
          flex-shrink: 0;
        }

        /* Settings Summary Strip */
        .mp-settings-strip {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          padding: 6px 4px;
          border-top: 1.5px dashed rgba(27, 27, 58, 0.12);
        }

        .mp-setting-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(27, 27, 58, 0.06);
          border: 1.5px solid rgba(27, 27, 58, 0.14);
          border-radius: 9999px;
          padding: 2px 10px;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 800;
          color: var(--mp-ink, #1B1B3A);
          white-space: nowrap;
        }

        .mp-settings-edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #FFC93C;
          border: 1.5px solid var(--mp-ink, #1B1B3A);
          border-radius: 9999px;
          padding: 2px 10px;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 800;
          color: var(--mp-ink, #1B1B3A);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .mp-settings-edit-btn:hover { transform: translateY(-1px); }

        /* Ad below card */
        .mp-lobby-ad-below {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-top: 16px;
          width: 100%;
        }

        .mp-ad-label {
          font-size: 10px;
          color: #94A3B8;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          align-self: flex-start;
          margin-left: 4px;
        }

        /* Right Side: Primary Game Launchpad */
        .mp-footer-action-side {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          width: 100%;
        }

        /* Mobile / Small Devices inline ad slot (hidden on desktop) */
        .mp-footer-ad-mobile {
          display: none;
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
        }

        /* Mobile or Small Devices: Ad slot on LEFT, Start Match on RIGHT, hide settings strip */
        @media (max-width: 768px), (max-height: 600px) {
          .mp-lobby-ad-below {
            display: none !important;
          }

          /* Hide rounds, lives, powerups, bots bar on mobile screen */
          .mp-settings-strip {
            display: none !important;
          }

          .mp-lobby-footer-row {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 10px !important;
            padding-top: 6px !important;
          }

          /* Ad slot on the LEFT */
          .mp-footer-ad-mobile {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: center !important;
            flex: 1 1 0 !important;
            min-width: 0 !important;
            max-width: 380px !important;
          }

          .mp-footer-ad-mobile .mp-ad-label {
            font-size: 9px;
            margin-bottom: 2px;
            align-self: flex-start;
          }

          .mp-footer-ad-mobile .mp-google-ad-wrap {
            max-width: 100% !important;
            height: 44px !important;
          }

          /* Start Match action on the RIGHT */
          .mp-footer-action-side {
            flex: 0 0 auto !important;
            width: auto !important;
            justify-content: flex-end !important;
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
            <PlayerGrid slots={enrichedSlots} fillBots={fillBots} onKick={onKick} />

            {/* Centered Arcade Reaction Deck */}
            <QuickEmotesBar onEmote={handleLocalEmote} />
          </div>

          {/* Settings Summary Strip */}
          <div className="mp-settings-strip">
            <span
              className="mp-setting-chip"
              style={{
                background: "#8B5CF6",
                color: "#FFFFFF",
                fontWeight: 900,
                border: "2px solid #1B1B3A",
              }}
            >
              🎯 {rulesSummary.presetName}
            </span>
            <span className="mp-setting-chip">
              🎮 {settings?.match?.rounds ?? 5} rounds
            </span>
            <span className="mp-setting-chip">
              ❤️ {settings?.respawn?.mode === "unlimited" ? "∞ lives" : settings?.respawn?.mode === "off" ? "1 life" : `${settings?.respawn?.lives ?? 3} lives`}
            </span>
            <span className="mp-setting-chip">
              ⚡ Power-ups {settings?.items?.enabled === false ? "off" : "on"}
            </span>
            <span className="mp-setting-chip">
              🤖 Bots {settings?.match?.fillBots === false ? "off" : "on"}
            </span>
            {isHost && onEditRules && (
              <button
                type="button"
                className="mp-settings-edit-btn"
                onClick={onEditRules}
              >
                Edit
              </button>
            )}
          </div>

          {/* 3. FOOTER: BANNER AD (LEFT) + START GAME (RIGHT) FOR MOBILE/SMALL DEVICES */}
          <div className="mp-lobby-footer-row">
            {/* Mobile / Small Devices: Ad slot on the LEFT */}
            <div className="mp-footer-ad-mobile">
              <div className="mp-ad-label">Advertisement</div>
              <BannerAd slotId="mp-lobby-google-ad-mobile" format="horizontal" />
            </div>

            {/* Start Match button on the RIGHT */}
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

        {/* Ad below card — clear of primary button (AdSense policy) */}
        <div className="mp-lobby-ad-below">
          <div className="mp-ad-label">Advertisement</div>
          <BannerAd slotId="mp-lobby-google-ad" format="horizontal" />
        </div>
      </div>

      {/* Rules Modal (opened when a guest clicks ℹ️ Rules) */}
      {showRulesModal && (
        <RulesModal
          settings={settings}
          isHost={isHost}
          onClose={() => setShowRulesModal(false)}
          onEditSettings={() => {
            setShowRulesModal(false);
            if (isHost && onEditRules) onEditRules();
          }}
        />
      )}
    </div>
  );
}
