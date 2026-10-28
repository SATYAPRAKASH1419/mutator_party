import { useEffect } from "preact/hooks";
import { sound } from "../audio";
import type { RoomConnection } from "../../net/connection";

export function useGameInput(connection: RoomConnection | null, stateRef: { current: string }) {
  useEffect(() => {
    if (!connection) return;

    const keys: Record<string, boolean> = {};
    const touch = { left: false, right: false };
    let jumpQ = false;
    let shoveQ = false;
    let inputSeq = 0;
    let lastBits = -1;
    let lastSentTime = 0;

    function sendInputs() {
      if (!connection) return;
      let bits = 0;
      if (keys["a"] || keys["arrowleft"] || touch.left) bits |= 1;
      if (keys["d"] || keys["arrowright"] || touch.right) bits |= 2;
      if (jumpQ || keys["w"] || keys["arrowup"] || keys[" "]) {
        bits |= 4;
        jumpQ = false;
      }
      if (shoveQ || keys["e"] || keys["shift"] || keys["j"]) {
        bits |= 8;
        shoveQ = false;
      }

      const now = performance.now();
      const changed = bits !== lastBits;
      const heartbeat = now - lastSentTime >= 100;

      if (changed || heartbeat) {
        inputSeq = (inputSeq + 1) & 0xffff;
        lastBits = bits;
        lastSentTime = now;
        connection.send.input(inputSeq, bits);
      }
    }

    const inputTimer = setInterval(sendInputs, 1000 / 30);

    function onKeyDown(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
      }
      keys[k] = true;
      if (k === " " || k === "w" || k === "arrowup") {
        if (!jumpQ) sound.playJump();
        jumpQ = true;
      }
      if (k === "e" || k === "shift" || k === "j") {
        if (!shoveQ) sound.playShove();
        shoveQ = true;
      }
      if (stateRef.current === "pick" && (k === "1" || k === "2" || k === "3")) {
        connection?.send.pick((+k - 1) as 0 | 1 | 2);
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      keys[e.key.toLowerCase()] = false;
    }

    function onBlur() {
      for (const k in keys) keys[k] = false;
      touch.left = touch.right = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    // Touch controls
    const touchButtons = document.querySelectorAll<HTMLButtonElement>("#touch button");
    const cleanupTouchListeners: Array<() => void> = [];

    touchButtons.forEach((b) => {
      const k = b.dataset.k!;
      const downHandler = (e: Event) => {
        e.preventDefault();
        b.classList.add("on");
        if (k === "jump") {
          sound.playJump();
          jumpQ = true;
        } else if (k === "shove") {
          sound.playShove();
          shoveQ = true;
        } else {
          (touch as any)[k] = true;
        }
      };
      const upHandler = () => {
        b.classList.remove("on");
        if (k === "left" || k === "right") {
          (touch as any)[k] = false;
        }
      };

      b.addEventListener("pointerdown", downHandler);
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
        b.addEventListener(ev, upHandler),
      );

      cleanupTouchListeners.push(() => {
        b.removeEventListener("pointerdown", downHandler);
        ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
          b.removeEventListener(ev, upHandler),
        );
      });
    });

    return () => {
      clearInterval(inputTimer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      cleanupTouchListeners.forEach((cleanup) => cleanup());
    };
  }, [connection]);
}
