import { IconVolumeOn, IconVolumeMute } from "../components/Icons";

interface AudioMuteButtonProps {
  isMuted?: boolean;
  onMuteToggle?: () => void;
}

export function AudioMuteButton({ isMuted, onMuteToggle }: AudioMuteButtonProps) {
  return (
    <button
      type="button"
      onClick={onMuteToggle}
      className="mp-btn"
      title={isMuted ? "Unmute Audio" : "Mute Audio"}
      style={{
        pointerEvents: "auto",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        backgroundColor: "var(--mp-paper)",
        border: "2.5px solid var(--mp-ink)",
        boxShadow: "2px 3px 0 var(--mp-ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: isMuted ? "var(--mp-coral)" : "var(--mp-ink)",
      }}
    >
      {isMuted ? <IconVolumeMute size={20} /> : <IconVolumeOn size={20} />}
    </button>
  );
}

