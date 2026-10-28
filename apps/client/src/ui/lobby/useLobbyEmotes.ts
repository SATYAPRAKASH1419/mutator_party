import { useState, useEffect } from "preact/hooks";
import type { SlotItem } from "./PlayerGrid";

export function useLobbyEmotes(displaySlots: SlotItem[], onEmote: (emoji: string) => void) {
  const [playerEmotes, setPlayerEmotes] = useState<Record<string, { emoji: string; key: number }>>({});

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

  return {
    playerEmotes,
    handleLocalEmote,
  };
}

