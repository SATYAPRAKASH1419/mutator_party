import { IconGamepad, IconLink } from "./components/Icons";
import { LandingBackground } from "./landing/LandingBackground";
import { LandingTitle } from "./landing/LandingTitle";
import { NameInputRow } from "./landing/NameInputRow";
import { ColorPaletteRow } from "./landing/ColorPaletteRow";
import { CreateTabContent } from "./landing/CreateTabContent";
import { JoinTabContent } from "./landing/JoinTabContent";
import { LandingHeaderActions } from "./landing/LandingHeaderActions";
import { useLandingForm } from "./landing/useLandingForm";

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
    selectedColor,
    digits,
    isFullscreen,
    isMobile,
    inputRefs,
    handleToggleFullscreen,
    handleRollDice,
    handleNameChange,
    handleColorChange,
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

        {/* 8-Color Avatar Palette Row */}
        <ColorPaletteRow
          selectedColor={selectedColor}
          onSelectColor={handleColorChange}
        />

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
  );
}
