/**
 * Reusable Squircle Avatar Head matching Sticker-Pop theme.
 * Features customizable color and dynamic facial expressions for emojis.
 */
export function AvatarHead({
  color,
  size = 46,
  emotion,
}: {
  color: string;
  size?: number;
  emotion?: string | null;
}) {
  const eyeSize = Math.round(size * 0.32);
  const pupilSize = Math.round(size * 0.14);

  // Determine which expression to show
  const emo = emotion?.trim();
  const isLaugh = emo === "😂";
  const isFire = emo === "🔥";
  const isShock = emo === "👀";
  const isDerp = emo === "💩";
  const isCool = emo === "💪";
  const isDevil = emo === "😈";
  const isParty = emo === "🎉" || emo === "GG" || emo === "👏";

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.32)}px`,
        background: color,
        border: "2.5px solid var(--mp-ink, #1B1B3A)",
        boxShadow: "1.5px 2px 0 var(--mp-ink, #1B1B3A)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
        flexShrink: 0,
        transition: "transform 0.15s ease",
      }}
    >
      {/* ── 1. EYES ── */}
      {isDevil ? (
        /* Sinister devil furrowed eyes: \ / */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: `${Math.round(size * 0.08)}px`,
            marginTop: `-${Math.round(size * 0.02)}px`,
          }}
        >
          {/* Left sinister eye with angled brow */}
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

          {/* Right sinister eye with angled brow */}
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
      ) : isLaugh ? (
        /* Laughing closed happy arc eyes: ^ ^ */
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
      ) : isFire ? (
        /* Intense fierce / determined angled eyes: > < */
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
      ) : isShock ? (
        /* Huge wide shocked round eyes with pinpoint pupils: O O */
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
              width: `${Math.round(eyeSize * 1.15)}px`,
              height: `${Math.round(eyeSize * 1.15)}px`,
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
                width: `${Math.round(pupilSize * 0.7)}px`,
                height: `${Math.round(pupilSize * 0.7)}px`,
                borderRadius: "50%",
                background: "var(--mp-ink, #1B1B3A)",
              }}
            />
          </div>
          <div
            style={{
              width: `${Math.round(eyeSize * 1.15)}px`,
              height: `${Math.round(eyeSize * 1.15)}px`,
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
                width: `${Math.round(pupilSize * 0.7)}px`,
                height: `${Math.round(pupilSize * 0.7)}px`,
                borderRadius: "50%",
                background: "var(--mp-ink, #1B1B3A)",
              }}
            />
          </div>
        </div>
      ) : isDerp ? (
        /* Crazy silly googly eyes (one big, one small) */
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
      ) : isParty ? (
        /* Star eyes or wink: ★ ★ */
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
      ) : isCool ? (
        /* Confident wink: ^ • */
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
      ) : (
        /* Default Cartoon Eyes */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: `${Math.max(2, Math.round(size * 0.06))}px`,
            marginTop: `-${Math.round(size * 0.04)}px`,
          }}
        >
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
        </div>
      )}

      {/* ── 2. MOUTH / SMILE ── */}
      {isDevil ? (
        /* Evil devious smirk with sharp little white fang */
        <div
          style={{
            width: `${Math.round(size * 0.36)}px`,
            height: `${Math.round(size * 0.16)}px`,
            background: "var(--mp-ink, #1B1B3A)",
            border: "2px solid var(--mp-ink, #1B1B3A)",
            borderRadius: "0 0 12px 12px",
            marginTop: `${Math.round(size * 0.04)}px`,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            paddingRight: "4px",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "3.5px solid transparent",
              borderRight: "3.5px solid transparent",
              borderTop: "6.5px solid #FFFFFF",
            }}
          />
        </div>
      ) : isLaugh || isParty ? (
        /* Wide open laughing / party mouth with tongue: Ɒ */
        <div
          style={{
            width: `${Math.round(size * 0.36)}px`,
            height: `${Math.round(size * 0.2)}px`,
            background: "#B91C1C",
            border: "2px solid var(--mp-ink, #1B1B3A)",
            borderRadius: "0 0 12px 12px",
            marginTop: `${Math.round(size * 0.04)}px`,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: `${Math.round(size * 0.22)}px`,
              height: `${Math.round(size * 0.12)}px`,
              background: "#F472B6",
              borderRadius: "50%",
              position: "absolute",
              bottom: "-2px",
            }}
          />
        </div>
      ) : isShock ? (
        /* Surprised small open circle mouth: O */
        <div
          style={{
            width: `${Math.round(size * 0.16)}px`,
            height: `${Math.round(size * 0.18)}px`,
            borderRadius: "50%",
            background: "var(--mp-ink, #1B1B3A)",
            marginTop: `${Math.round(size * 0.05)}px`,
          }}
        />
      ) : isDerp ? (
        /* Silly tongue sticking out mouth */
        <div
          style={{
            position: "relative",
            marginTop: `${Math.round(size * 0.03)}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: `${Math.round(size * 0.26)}px`,
              height: "2.5px",
              background: "var(--mp-ink, #1B1B3A)",
              borderRadius: "2px",
            }}
          />
          <div
            style={{
              width: `${Math.round(size * 0.12)}px`,
              height: `${Math.round(size * 0.14)}px`,
              background: "#F472B6",
              border: "1.5px solid var(--mp-ink, #1B1B3A)",
              borderRadius: "0 0 8px 8px",
              position: "absolute",
              top: "1px",
            }}
          />
        </div>
      ) : isFire ? (
        /* Determined toothy grit grin */
        <div
          style={{
            width: `${Math.round(size * 0.3)}px`,
            height: `${Math.round(size * 0.12)}px`,
            background: "#FFFFFF",
            border: "2px solid var(--mp-ink, #1B1B3A)",
            borderRadius: "4px",
            marginTop: `${Math.round(size * 0.05)}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          <div style={{ width: "1.5px", height: "100%", background: "var(--mp-ink, #1B1B3A)" }} />
          <div style={{ width: "1.5px", height: "100%", background: "var(--mp-ink, #1B1B3A)" }} />
        </div>
      ) : (
        /* Default Curved Smile */
        <svg
          width={Math.round(size * 0.34)}
          height={Math.round(size * 0.16)}
          viewBox="0 0 16 8"
          fill="none"
          style={{ marginTop: `${Math.round(size * 0.04)}px` }}
        >
          <path
            d="M 2 2 Q 8 8 14 2"
            stroke="var(--mp-ink, #1B1B3A)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}
