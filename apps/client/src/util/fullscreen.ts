/**
 * Fullscreen and Mobile Device Utility
 * Automatically triggers fullscreen on mobile/small devices in landscape mode upon interaction,
 * while leaving fullscreen optional on desktop devices.
 */

export function isMobileOrSmallDevice(): boolean {
  if (typeof window === "undefined") return false;
  // A device is "small / mobile" if screen dimensions are small (width <= 960 or height <= 580)
  // or if userAgent is mobile / tablet
  const isSmallScreen = window.innerWidth <= 960 || window.innerHeight <= 580;
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      navigator.userAgent,
    );
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    ("msMaxTouchPoints" in navigator && (navigator as any).msMaxTouchPoints > 0);

  return isSmallScreen || isMobileUA || (isTouch && window.innerWidth <= 1024);
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
  } catch (err) {
    // Browsers require a user gesture (tap/click); subsequent click/tap will trigger
    return false;
  }
}

export async function exitAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  if (!isAppFullscreen()) return true;

  // Mobile / small devices must always remain in fullscreen
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

  // Immediate check on mount/load
  tryEnterFullscreen();

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
