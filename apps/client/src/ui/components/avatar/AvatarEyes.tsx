interface AvatarEyesProps {
  size: number;
  emotion?: string | null;
}

export function AvatarEyes({ size, emotion }: AvatarEyesProps) {
  const eyeSize = Math.round(size * 0.32);
  const pupilSize = Math.round(size * 0.14);

  const emo = emotion?.trim();
  const isDevil = emo === "😈";
  const isLaugh = emo === "😂";
  const isFire = emo === "🔥";
  const isShock = emo === "👀";
  const isDerp = emo === "💩";
  const isCool = emo === "💪";
  const isParty = emo === "🎉" || emo === "GG" || emo === "👏";

  if (isDevil) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${Math.round(size * 0.08)}px`,
          marginTop: `-${Math.round(size * 0.02)}px`,
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: "-3px",
              left: "-2px",
              width: `${eyeSize + 2}px`,
              height: "2.5px",
              background: "var(--mp-ink, #1B1B3A)",
              transform: "rotate(22deg)",
              borderRadius: "2px",
              zIndex: 2,
            }}
          />
          <div
            style={{
              width: `${eyeSize}px`,
              height: `${eyeSize}px`,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "2px solid var(--mp-ink, #1B1B3A)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${pupilSize + 1}px`,
                height: `${pupilSize + 1}px`,
                borderRadius: "50%",
                background: "#7C3AED",
                border: "1px solid var(--mp-ink, #1B1B3A)",
                transform: "translate(2px, 0px)",
              }}
            />
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: "-3px",
              right: "-2px",
              width: `${eyeSize + 2}px`,
              height: "2.5px",
              background: "var(--mp-ink, #1B1B3A)",
              transform: "rotate(-22deg)",
              borderRadius: "2px",
              zIndex: 2,
            }}
          />
          <div
            style={{
              width: `${eyeSize}px`,
              height: `${eyeSize}px`,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "2px solid var(--mp-ink, #1B1B3A)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${pupilSize + 1}px`,
                height: `${pupilSize + 1}px`,
                borderRadius: "50%",
                background: "#7C3AED",
                border: "1px solid var(--mp-ink, #1B1B3A)",
                transform: "translate(2px, 0px)",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isLaugh) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${Math.round(size * 0.1)}px`,
          marginTop: `-${Math.round(size * 0.04)}px`,
        }}
      >
        <svg width={eyeSize} height={Math.round(eyeSize * 0.6)} viewBox="0 0 16 10">
          <path
            d="M 2 8 Q 8 1 14 8"
            fill="none"
            stroke="var(--mp-ink, #1B1B3A)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <svg width={eyeSize} height={Math.round(eyeSize * 0.6)} viewBox="0 0 16 10">
          <path
            d="M 2 8 Q 8 1 14 8"
            fill="none"
            stroke="var(--mp-ink, #1B1B3A)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (isFire) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${Math.round(size * 0.08)}px`,
          marginTop: `-${Math.round(size * 0.04)}px`,
        }}
      >
        <svg width={eyeSize} height={Math.round(eyeSize * 0.7)} viewBox="0 0 16 12">
          <path
            d="M 2 2 L 14 6 L 2 10"
            fill="none"
            stroke="var(--mp-ink, #1B1B3A)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg width={eyeSize} height={Math.round(eyeSize * 0.7)} viewBox="0 0 16 12">
          <path
            d="M 14 2 L 2 6 L 14 10"
            fill="none"
            stroke="var(--mp-ink, #1B1B3A)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (isShock) {
    const shockEyeSize = Math.round(eyeSize * 1.15);
    const shockPupilSize = Math.round(pupilSize * 0.7);
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${Math.round(size * 0.04)}px`,
          marginTop: `-${Math.round(size * 0.04)}px`,
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              width: `${shockEyeSize}px`,
              height: `${shockEyeSize}px`,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "2px solid var(--mp-ink, #1B1B3A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: `${shockPupilSize}px`,
                height: `${shockPupilSize}px`,
                borderRadius: "50%",
                background: "var(--mp-ink, #1B1B3A)",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isDerp) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${Math.round(size * 0.04)}px`,
          marginTop: `-${Math.round(size * 0.04)}px`,
        }}
      >
        <div
          style={{
            width: `${Math.round(eyeSize * 1.2)}px`,
            height: `${Math.round(eyeSize * 1.2)}px`,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "2px solid var(--mp-ink, #1B1B3A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: `${pupilSize}px`,
              height: `${pupilSize}px`,
              borderRadius: "50%",
              background: "var(--mp-ink, #1B1B3A)",
              transform: "translate(-1.5px, 1.5px)",
            }}
          />
        </div>
        <div
          style={{
            width: `${Math.round(eyeSize * 0.8)}px`,
            height: `${Math.round(eyeSize * 0.8)}px`,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "2px solid var(--mp-ink, #1B1B3A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: `${Math.round(pupilSize * 0.8)}px`,
              height: `${Math.round(pupilSize * 0.8)}px`,
              borderRadius: "50%",
              background: "var(--mp-ink, #1B1B3A)",
              transform: "translate(1px, -1px)",
            }}
          />
        </div>
      </div>
    );
  }

  if (isParty) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${Math.round(size * 0.08)}px`,
          fontSize: `${Math.round(size * 0.28)}px`,
          lineHeight: 1,
          color: "var(--mp-ink, #1B1B3A)",
          marginTop: `-${Math.round(size * 0.04)}px`,
        }}
      >
        <span>★</span>
        <span>★</span>
      </div>
    );
  }

  if (isCool) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: `${Math.round(size * 0.08)}px`,
          marginTop: `-${Math.round(size * 0.04)}px`,
        }}
      >
        <svg width={eyeSize} height={Math.round(eyeSize * 0.6)} viewBox="0 0 16 10">
          <path
            d="M 2 8 Q 8 1 14 8"
            fill="none"
            stroke="var(--mp-ink, #1B1B3A)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            width: `${eyeSize}px`,
            height: `${eyeSize}px`,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "2px solid var(--mp-ink, #1B1B3A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: `${pupilSize}px`,
              height: `${pupilSize}px`,
              borderRadius: "50%",
              background: "var(--mp-ink, #1B1B3A)",
              transform: "translate(1px, -1px)",
            }}
          />
        </div>
      </div>
    );
  }

  // Default Cartoon Eyes
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: `${Math.max(2, Math.round(size * 0.06))}px`,
        marginTop: `-${Math.round(size * 0.04)}px`,
      }}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            width: `${eyeSize}px`,
            height: `${eyeSize}px`,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "2px solid var(--mp-ink, #1B1B3A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${pupilSize}px`,
              height: `${pupilSize}px`,
              borderRadius: "50%",
              background: "var(--mp-ink, #1B1B3A)",
              transform: "translate(1.5px, -1px)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

