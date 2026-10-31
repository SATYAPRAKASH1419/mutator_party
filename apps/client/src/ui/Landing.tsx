import { IconGamepad, IconLink } from "./components/Icons";
import { LandingBackground } from "./landing/LandingBackground";
import { LandingTitle } from "./landing/LandingTitle";
import { NameInputRow } from "./landing/NameInputRow";
import { CreateTabContent } from "./landing/CreateTabContent";
import { JoinTabContent } from "./landing/JoinTabContent";
import { LandingHeaderActions } from "./landing/LandingHeaderActions";
import { useLandingForm } from "./landing/useLandingForm";

// Quick Play icon — lightning bolt
function IconQuickPlay({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z"
        fill="var(--mp-ink, #1B1B3A)" stroke="var(--mp-ink, #1B1B3A)" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface LandingProps {
  onJoin: (code: string) => void;
  onCreate: () => void;
}

export function Landing({ onJoin, onCreate }: LandingProps) {
  const {
    activeTab,
    setActiveTab,
    name,
    nameError,
    digits,
    isFullscreen,
    isMobile,
    inputRefs,
    handleToggleFullscreen,
    handleRollDice,
    handleNameChange,
    handleDigitChange,
    handleDigitPaste,
    handleDigitKeyDown,
    handleCreateSubmit,
    handleJoinSubmit,
  } = useLandingForm({ onJoin, onCreate });

  return (
    <div className="mp-landing-wrap">
      {/* Background Scenery */}
      <LandingBackground />

      {/* Fullscreen Toggle (Desktop Only) */}
      <LandingHeaderActions
        isMobile={isMobile}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Main Game Modal */}
      <div className="mp-panel mp-landing-card">
        {/* Title */}
        <LandingTitle />

        {/* Common Player Nickname Row */}
        <NameInputRow
          name={name}
          nameError={nameError}
          onNameChange={handleNameChange}
          onRollDice={handleRollDice}
        />

        {/* Quick Play — biggest, most inviting button */}
        <button
          type="button"
          className="mp-btn-cta"
          onClick={handleCreateSubmit}
          style={{
            background: "var(--mp-sun, #FFC93C)",
            fontSize: "clamp(16px, 2.2vw, 20px)",
            height: "clamp(46px, 6vh, 56px)",
            boxShadow: "0 5px 0 var(--mp-ink, #1B1B3A)",
            gap: "10px",
          }}
        >
          <IconQuickPlay size={22} />
          <span>Quick Play</span>
        </button>

        {/* Modern Game Style Tab Switcher */}
        <div className="mp-tab-switcher">
          <button
            type="button"
            className={`mp-tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <IconGamepad size={16} />
            <span>Create Room</span>
          </button>
          <button
            type="button"
            className={`mp-tab-btn ${activeTab === "join" ? "active" : ""}`}
            onClick={() => setActiveTab("join")}
          >
            <IconLink size={16} />
            <span>Join Room</span>
          </button>
        </div>

        {/* Tab content — fixed min-height so card doesn't jump on tab switch */}
        <div style={{ minHeight: "130px" }}>
          {/* Tab 1: Create Room */}
          {activeTab === "create" && (
            <CreateTabContent onCreate={handleCreateSubmit} />
          )}

          {/* Tab 2: Join with Code */}
          {activeTab === "join" && (
            <JoinTabContent
              digits={digits}
              inputRefs={inputRefs}
              onDigitChange={handleDigitChange}
              onDigitPaste={handleDigitPaste}
              onDigitKeyDown={handleDigitKeyDown}
              onJoin={handleJoinSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
