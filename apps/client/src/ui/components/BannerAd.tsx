import { useEffect, useRef, useState } from "preact/hooks";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface BannerAdProps {
  slotId?: string;
  adClient?: string;
  adSlot?: string;
  format?: "horizontal" | "rectangle" | "auto";
  className?: string;
}

export function BannerAd({
  slotId = "mp-lobby-google-ad",
  adClient,
  adSlot,
  format = "horizontal",
  className = "",
}: BannerAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Read environment variable if prop not explicitly provided
  const client =
    adClient ||
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID) ||
    "";
  const slot =
    adSlot ||
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_ADSENSE_LOBBY_SLOT_ID) ||
    "";

  const isLiveAd = Boolean(client && slot);

  useEffect(() => {
    if (!isLiveAd) return;

    // Load Google AdSense library if not already present
    const scriptId = "google-adsense-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.head.appendChild(script);
    }

    // Push ad request to Google
    try {
      if (typeof window !== "undefined") {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        setAdLoaded(true);
      }
    } catch (err) {
      console.warn("[Google Ads] Ad request error:", err);
      setAdError(true);
    }
  }, [client, slot, isLiveAd]);

  return (
    <div
      id={slotId}
      ref={adRef}
      className={`mp-google-ad-wrap ${className}`}
      data-ad-format={format}
    >
      <style>{`
        .mp-google-ad-wrap {
          position: relative;
          width: 100%;
          max-width: 440px;
          height: 52px;
          background: #FFFFFF;
          border: 2px solid #CBD5E1;
          border-radius: 12px;
          box-shadow: 1.5px 2px 0 rgba(27, 27, 58, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-sizing: border-box;
          user-select: none;
        }

        .mp-google-ad-badge {
          position: absolute;
          top: 2px;
          right: 6px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 8.5px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          display: flex;
          align-items: center;
          gap: 3px;
          z-index: 2;
        }

        .mp-google-icon-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #4285F4;
          display: inline-block;
        }

        /* Preview / Placeholder container when waiting for live Google Ad */
        .mp-google-ad-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0 12px;
          height: 100%;
          box-sizing: border-box;
        }

        .mp-google-ad-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mp-google-g-logo {
          font-family: "Product Sans", -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 900;
          font-size: 18px;
          background: linear-gradient(135deg, #4285F4 25%, #EA4335 50%, #FBBC05 75%, #34A853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }

        .mp-google-ad-title {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          color: #334155;
          line-height: 1.15;
        }

        .mp-google-ad-desc {
          font-size: 9.5px;
          color: #64748B;
          line-height: 1.1;
        }

        .mp-google-cta-btn {
          background: #1A73E8;
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }

        .mp-google-cta-btn:hover {
          background: #1557B0;
        }

        /* Real Google AdSense element */
        .mp-google-ad-ins {
          display: inline-block;
          width: 100%;
          height: 50px;
        }
      `}</style>

      {/* Ad Badge */}
      <div className="mp-google-ad-badge">
        <span className="mp-google-icon-dot" />
        <span>Ad by Google</span>
      </div>

      {isLiveAd && !adError ? (
        /* Real Google AdSense Banner */
        <ins
          className="adsbygoogle mp-google-ad-ins"
          style={{ display: "inline-block", width: "100%", height: "50px" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="false"
        />
      ) : (
        /* Styled Google Ads Compliant Placeholder (for dev/test & prior to production pub-ID) */
        <div className="mp-google-ad-preview">
          <div className="mp-google-ad-info">
            <span className="mp-google-g-logo">G</span>
            <div>
              <div className="mp-google-ad-title">Google Ads Banner Slot</div>
              <div className="mp-google-ad-desc">320x50 / 468x60 Leaderboard</div>
            </div>
          </div>
          <button type="button" className="mp-google-cta-btn">
            Learn More
          </button>
        </div>
      )}
    </div>
  );
}
