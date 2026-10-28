/**
 * Fullscreen and Mobile Device Utility
 * Automatically triggers fullscreen on mobile/small devices in landscape mode upon interaction,
 * while leaving fullscreen optional on desktop devices.
 */

export function isMobileOrSmallDevice(): boolean {
  if (typeof window === "undefined") return false;
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      navigator.userAgent,
    );
  const isCoarsePointer =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  // Only true mobile/tablet devices (never desktop just because window was resized or DevTools opened)
  return isMobileUA || (isCoarsePointer && isTouch && window.innerWidth <= 850);
}

export function isAppFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement,
  );
}

export async function requestAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  if (isAppFullscreen()) return true;

  const docEl = document.documentElement as any;
  if (!docEl) return false;

  try {
    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen({ navigationUI: "hide" } as any);
    } else if (docEl.webkitRequestFullscreen) {
      await docEl.webkitRequestFullscreen();
    } else if (docEl.mozRequestFullScreen) {
      await docEl.mozRequestFullScreen();
    } else if (docEl.msRequestFullscreen) {
      await docEl.msRequestFullscreen();
    }

    // Attempt landscape lock if supported on mobile
    try {
      await (screen.orientation as any)?.lock?.("landscape");
    } catch {
      // Screen orientation lock is optional
    }

    return true;
  } catch {
    // Browsers require a user gesture (tap/click); subsequent click/tap will trigger
    return false;
  }
}

export async function exitAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  if (!isAppFullscreen()) return true;

  // Mobile / small devices remain in fullscreen
  if (isMobileOrSmallDevice()) return false;

  const doc = document as any;
  const exitMethod =
    doc.exitFullscreen ||
    doc.webkitExitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.msExitFullscreen;

  if (!exitMethod) return false;

  try {
    await exitMethod.call(doc);
    return true;
  } catch {
    return false;
  }
}

export async function toggleAppFullscreen(): Promise<void> {
  // Mobile devices always stay in fullscreen
  if (isMobileOrSmallDevice()) {
    if (!isAppFullscreen()) {
      await requestAppFullscreen();
    }
    return;
  }

  if (isAppFullscreen()) {
    await exitAppFullscreen();
  } else {
    await requestAppFullscreen();
  }
}

/**
 * Initializes continuous auto-fullscreen on landscape for mobile/small devices across all pages.
 * Listens on window and document capture phases so the very first interaction reliably triggers it.
 */
export function initAutoFullscreenOnMobile(): () => void {
  if (typeof window === "undefined") return () => {};

  const tryEnterFullscreen = () => {
    const isLandscape = window.innerWidth >= window.innerHeight;
    if (isMobileOrSmallDevice() && isLandscape && !isAppFullscreen()) {
      requestAppFullscreen().catch(() => {});
    }
  };

  // Fullscreen can only be initiated by a direct user gesture (tap/click), not automatically on load.
  // The event listeners below will trigger it on the first tap/click.

  // On orientation change or window resize (e.g. rotating into landscape on any page)
  window.addEventListener("orientationchange", tryEnterFullscreen, { passive: true });
  window.addEventListener("resize", tryEnterFullscreen, { passive: true });

  // On user activation (capture phase guarantees it runs before child stops propagation)
  document.addEventListener("click", tryEnterFullscreen, true);
  document.addEventListener("pointerdown", tryEnterFullscreen, true);
  document.addEventListener("touchstart", tryEnterFullscreen, true);
  document.addEventListener("touchend", tryEnterFullscreen, true);

  return () => {
    window.removeEventListener("orientationchange", tryEnterFullscreen);
    window.removeEventListener("resize", tryEnterFullscreen);
    document.removeEventListener("click", tryEnterFullscreen, true);
    document.removeEventListener("pointerdown", tryEnterFullscreen, true);
    document.removeEventListener("touchstart", tryEnterFullscreen, true);
    document.removeEventListener("touchend", tryEnterFullscreen, true);
  };
}

/**
 * Safe touch selection utility:
 * DevTools inspection and context menus are fully preserved on all platforms.
 */
export function preventTouchSelectionOnHold(): () => void {
  // Do not block contextmenu or selectstart events so browser DevTools and right-click Inspect work unhindered.
  return () => {};
}
