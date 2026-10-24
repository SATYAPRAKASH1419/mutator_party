import { SparkleStar } from "../components/SparkleStar";

export function SunWithGlow() {
  return (
    <div
      style={{
        position: "absolute",
        top: "clamp(12px, 3.5vw, 28px)",
        right: "clamp(12px, 7vw, 105px)",
        width: "clamp(75px, 14vw, 120px)",
        height: "clamp(75px, 14vw, 120px)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {/* Outer luminous glow halo */}
      <div
        className="mp-anim"
        style={{
          position: "absolute",
          top: "-35%",
          left: "-35%",
          width: "170%",
          height: "170%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255, 218, 90, 0.45) 0%, rgba(255, 235, 140, 0.2) 48%, rgba(255, 255, 255, 0) 72%)",
          animation: "mpSunPulse 6s ease-in-out infinite",
        }}
      />
      {/* Inner warm halo ring */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: "120%",
          height: "120%",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 224, 102, 0.35)",
        }}
      />
      {/* Sun Core Disc */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FFE866 0%, #FFA826 100%)",
          border: "clamp(2.5px, 0.5vw, 4px) solid rgba(255, 255, 255, 0.75)",
          boxShadow:
            "0 4px 20px rgba(255, 180, 40, 0.45), inset -4px -4px 10px rgba(230, 110, 0, 0.2)",
        }}
      />
    </div>
  );
}

export function FluffyCloud({
  width = 170,
  height = 95,
  flip = false,
  opacity = 0.95,
}: {
  width?: number;
  height?: number;
  flip?: boolean;
  opacity?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 170 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: flip ? "scaleX(-1)" : undefined,
        opacity,
        filter: "drop-shadow(0 6px 14px rgba(27, 27, 58, 0.08))",
      }}
    >
      <g fill="#FFFFFF">
        <circle cx="44" cy="56" r="25" />
        <circle cx="76" cy="40" r="31" />
        <circle cx="114" cy="44" r="26" />
        <circle cx="138" cy="58" r="19" />
        <rect x="36" y="52" width="102" height="26" rx="13" />
      </g>
      <path
        d="M 38 68 C 65 74, 115 74, 138 68 C 144 73, 136 78, 126 78 L 48 78 C 38 78, 32 73, 38 68 Z"
        fill="#F0F8FF"
        opacity="0.9"
      />
    </svg>
  );
}

export function BreezyCloud({
  width = 140,
  height = 80,
  opacity = 0.9,
}: {
  width?: number;
  height?: number;
  opacity?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        opacity,
        filter: "drop-shadow(0 4px 10px rgba(27, 27, 58, 0.06))",
      }}
    >
      <g fill="#FFFFFF">
        <circle cx="36" cy="48" r="22" />
        <circle cx="68" cy="34" r="28" />
        <circle cx="102" cy="46" r="20" />
        <rect x="28" y="44" width="76" height="24" rx="12" />
      </g>
      <path
        d="M 30 58 C 55 64, 85 64, 104 58 C 108 63, 102 68, 94 68 L 38 68 C 30 68, 26 63, 30 58 Z"
        fill="#F0F8FF"
        opacity="0.9"
      />
    </svg>
  );
}

export function FloatingIslandLeft() {
  return (
    <svg
      width="160"
      height="100"
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: "drop-shadow(0 8px 16px rgba(27, 27, 58, 0.12))",
      }}
    >
      <path
        d="M 15 32 Q 80 28 145 32 Q 135 75 90 92 Q 60 92 25 70 Z"
        fill="#C97A44"
        stroke="#1B1B3A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 30 55 Q 80 52 130 55 Q 120 72 90 88 Q 65 88 35 68 Z"
        fill="#A85828"
      />
      <path
        d="M 12 30 Q 80 24 148 30 C 152 38, 142 45, 134 40 C 126 46, 116 46, 110 40 C 102 47, 88 47, 80 41 C 72 47, 58 47, 50 41 C 42 47, 30 46, 24 40 C 16 45, 8 38, 12 30 Z"
        fill="#3DDC97"
        stroke="#1B1B3A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 18 29 Q 80 26 142 29"
        stroke="#7EF2BE"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="48"
        cy="22"
        r="3.5"
        fill="#FFD25A"
        stroke="#1B1B3A"
        strokeWidth="1.5"
      />
      <circle cx="48" cy="22" r="1.5" fill="#FF6B6B" />
      <path
        d="M 48 25 L 48 30"
        stroke="#1B1B3A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FloatingIslandRight() {
  return (
    <svg
      width="140"
      height="90"
      viewBox="0 0 140 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: "drop-shadow(0 8px 16px rgba(27, 27, 58, 0.12))",
      }}
    >
      <path
        d="M 15 28 Q 70 24 125 28 Q 115 65 75 80 Q 50 80 22 62 Z"
        fill="#C97A44"
        stroke="#1B1B3A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 26 48 Q 70 45 114 48 Q 104 62 75 76 Q 52 76 30 58 Z"
        fill="#A85828"
      />
      <path
        d="M 12 26 Q 70 22 128 26 C 132 34, 122 40, 115 36 C 108 42, 98 42, 92 36 C 85 42, 72 42, 65 37 C 58 42, 46 42, 40 37 C 32 42, 22 41, 16 36 C 10 40, 6 34, 12 26 Z"
        fill="#3DDC97"
        stroke="#1B1B3A"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M 18 25 Q 70 23 122 25"
        stroke="#7EF2BE"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="60"
        y="18"
        width="24"
        height="7"
        rx="3.5"
        fill="#FFC93C"
        stroke="#1B1B3A"
        strokeWidth="2"
      />
      <line x1="66" y1="25" x2="66" y2="27" stroke="#1B1B3A" strokeWidth="2" />
      <line x1="78" y1="25" x2="78" y2="27" stroke="#1B1B3A" strokeWidth="2" />
    </svg>
  );
}

/**
 * Background scenery layer containing sun, clouds, sparkle stars, and floating islands
 */
export function LandingBackground() {
  return (
    <>
      {/* Glowing Cartoon Sun */}
      <SunWithGlow />

      {/* Cloud 1: Grand Fluffy Cloud on Top Left */}
      <div
        className="mp-anim mp-bg-cloud-lg"
        style={{
          position: "absolute",
          top: "40px",
          left: "min(6vw, 60px)",
          zIndex: 2,
          pointerEvents: "none",
          animation:
            "mpFloatSlow 6s ease-in-out infinite, mpDriftSlow 12s ease-in-out infinite alternate",
        }}
      >
        <FluffyCloud width={180} height={100} />
      </div>

      {/* Cloud 2: Passing Cloud kissing the bottom edge of the Sun */}
      <div
        className="mp-anim mp-bg-cloud-lg"
        style={{
          position: "absolute",
          top: "85px",
          right: "min(8vw, 80px)",
          zIndex: 2,
          pointerEvents: "none",
          animation: "mpFloatMedium 7s ease-in-out 1s infinite",
        }}
      >
        <FluffyCloud width={160} height={90} flip={true} opacity={0.92} />
      </div>

      {/* Cloud 3: Breezy Cloud Mid-Left */}
      <div
        className="mp-anim"
        style={{
          position: "absolute",
          top: "32%",
          left: "min(10vw, 110px)",
          zIndex: 1,
          pointerEvents: "none",
          animation:
            "mpFloatSlow 8s ease-in-out 0.5s infinite, mpDriftReverse 14s ease-in-out infinite alternate",
        }}
      >
        <BreezyCloud width={135} height={75} opacity={0.88} />
      </div>

      {/* Cloud 4: Soft Distant Cloud Mid-Right */}
      <div
        className="mp-anim"
        style={{
          position: "absolute",
          top: "44%",
          right: "min(9vw, 95px)",
          zIndex: 1,
          pointerEvents: "none",
          animation:
            "mpFloatMedium 9s ease-in-out 2s infinite, mpDriftSlow 16s ease-in-out infinite alternate",
        }}
      >
        <BreezyCloud width={120} height={68} opacity={0.82} />
      </div>

      {/* Cloud 5: Soft Horizon Cloud */}
      <div
        className="mp-anim"
        style={{
          position: "absolute",
          bottom: "18%",
          left: "min(4vw, 35px)",
          zIndex: 1,
          pointerEvents: "none",
          animation: "mpFloatSlow 7.5s ease-in-out 1.5s infinite",
        }}
      >
        <FluffyCloud width={140} height={80} opacity={0.78} />
      </div>

      {/* Sparkle Stars & Confetti in the sky */}
      <SparkleStar size={20} color="#FFD25A" top="8%" left="22%" delay="0s" />
      <SparkleStar size={16} color="#FF6B6B" top="24%" left="5%" delay="1.2s" />
      <SparkleStar size={18} color="#3DDC97" top="15%" right="26%" delay="0.8s" />
      <SparkleStar size={15} color="#8B5CF6" top="38%" right="4%" delay="2s" />
      <SparkleStar size={17} color="#4CC9F0" bottom="25%" right="16%" delay="1.5s" />
      <SparkleStar size={14} color="#FFD25A" bottom="28%" left="18%" delay="2.5s" />

      {/* Floating Arena Islands at bottom corners */}
      <div
        className="mp-anim mp-bg-island"
        style={{
          position: "absolute",
          bottom: "-15px",
          left: "min(4vw, 40px)",
          zIndex: 2,
          pointerEvents: "none",
          animation: "mpFloatSlow 6s ease-in-out infinite",
        }}
      >
        <FloatingIslandLeft />
      </div>

      <div
        className="mp-anim mp-bg-island"
        style={{
          position: "absolute",
          bottom: "-20px",
          right: "min(5vw, 45px)",
          zIndex: 2,
          pointerEvents: "none",
          animation: "mpFloatMedium 7s ease-in-out 1.2s infinite",
        }}
      >
        <FloatingIslandRight />
      </div>
    </>
  );
}
