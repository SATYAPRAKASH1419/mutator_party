import { IconSpinner } from "./Icons";

export function ConnectingOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27,27,58,0.7)",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFF8E7",
        fontFamily: "var(--font-display)",
        fontSize: "24px",
        gap: "12px",
      }}
    >
      <IconSpinner size={42} />
      <span>Connecting to Room...</span>
    </div>
  );
}

