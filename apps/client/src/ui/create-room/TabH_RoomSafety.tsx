import { inputStyle } from "./constants";
import { Badge, Row, Toggle, Segmented } from "./components";

interface TabHProps {
  roomName: string;
  visibility: "public" | "private";
  password: string;
  chat: "off" | "emotes" | "filtered";
  spectators: boolean;
  allowKick: boolean;
  onRoomNameChange: (v: string) => void;
  onVisibilityChange: (v: "public" | "private") => void;
  onPasswordChange: (v: string) => void;
  onChatChange: (v: "off" | "emotes" | "filtered") => void;
  onSpectatorsChange: (v: boolean) => void;
  onAllowKickChange: (v: boolean) => void;
}

export function TabH_RoomSafety({
  roomName,
  visibility,
  password,
  chat,
  spectators,
  allowKick,
  onRoomNameChange,
  onVisibilityChange,
  onPasswordChange,
  onChatChange,
  onSpectatorsChange,
  onAllowKickChange,
}: TabHProps) {
  return (
    <div
      style={{
        padding: "16px 20px 64px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <div
        className="mp-panel"
        style={{
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: "20px",
              color: "var(--mp-ink)",
            }}
          >
            Room and safety settings
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginTop: "8px",
          }}
        >
          <Row label="Room name">
            <input
              type="text"
              value={roomName}
              onInput={(e) => onRoomNameChange((e.target as HTMLInputElement).value)}
              placeholder="My Mutator Party"
              style={inputStyle}
            />
          </Row>

          <Row label="Room visibility">
            <Segmented
              options={[
                { label: "Private (code only)", value: "private" },
                { label: "Public (listed)", value: "public" },
              ]}
              value={visibility}
              onChange={onVisibilityChange}
            />
          </Row>

          <Row label="Room password (optional)">
            <input
              type="text"
              value={password}
              onInput={(e) => onPasswordChange((e.target as HTMLInputElement).value)}
              placeholder="Leave empty for none"
              style={inputStyle}
            />
          </Row>

          <Row label="Chat permissions">
            <Segmented
              options={[
                { label: "Off", value: "off" },
                { label: "Emotes only", value: "emotes" },
                { label: "Filtered", value: "filtered" },
              ]}
              value={chat}
              onChange={onChatChange}
            />
          </Row>

          <Row label="Allow spectators">
            <Toggle checked={spectators} onChange={onSpectatorsChange} />
          </Row>

          <Row label="Host can kick players">
            <Toggle checked={allowKick} onChange={onAllowKickChange} />
          </Row>
        </div>
      </div>
    </div>
  );
}

