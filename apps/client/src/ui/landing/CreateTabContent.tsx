interface CreateTabContentProps {
  onCreate: () => void;
}

export function CreateTabContent({ onCreate }: CreateTabContentProps) {
  return (
    <div className="mp-tab-content-container">
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#64748B",
          textAlign: "center",
          lineHeight: 1.35,
          padding: "4px 8px",
        }}
      >
        Host a party room for up to 8 players. Customize rounds, modes, and twists in the lobby!
      </div>

      <button
        type="button"
        className="mp-btn-cta"
        onClick={onCreate}
        style={{
          background: "var(--mp-sun, #FFC93C)",
        }}
      >
        <span>Create Room</span>
      </button>
    </div>
  );
}

