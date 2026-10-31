import { useState, useRef, useEffect } from "preact/hooks";
import { appStore } from "../../app/store";
import { clientLog } from "../../util/logger";
import { showToast } from "../../util/toast";
import {
  isMobileOrSmallDevice,
  isAppFullscreen,
  toggleAppFullscreen,
} from "../../util/fullscreen";

const FUN_NAMES = [
  "Crispy Samosa",
  "Spicy Biryani",
  "Chai Biscuit",
  "Tandoori Momo",
  "Butter Naan",
  "Sweet Jalebi",
  "Mango Lassi",
  "Pani Puri",
  "Cheesy Pizza",
  "Cosmic Taco",
  "Turbo Waffle",
  "Magic Donut",
  "Bunty_ji",
  "Pappaya",
  "Chahat",
  "Pink ball",
];

interface UseLandingFormProps {
  onJoin: (code: string) => void;
  onCreate: () => void;
}

export function useLandingForm({ onJoin, onCreate }: UseLandingFormProps) {
  const profile = appStore.getState().profile;
  const inviteMatch = window.location.pathname.match(/\/r\/([A-Za-z0-9]{5})/i);
  const initialCode =
    inviteMatch?.[1]?.toUpperCase() || appStore.getState().roomCode || "";

  const [activeTab, setActiveTab] = useState<"create" | "join">(
    inviteMatch ? "join" : "create",
  );
  const [name, setName] = useState(profile.name || "Austin");
  const [digits, setDigits] = useState<string[]>(() => {
    const chars = initialCode.toUpperCase().slice(0, 5).split("");
    while (chars.length < 5) chars.push("");
    return chars;
  });
  const [nameError, setNameError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(isAppFullscreen);
  const [isMobile, setIsMobile] = useState(isMobileOrSmallDevice);

  useEffect(() => {
    const handleOrientation = () => {
      setIsFullscreen(isAppFullscreen());
      setIsMobile(isMobileOrSmallDevice());
    };
    window.addEventListener("resize", handleOrientation);
    window.addEventListener("orientationchange", handleOrientation);
    document.addEventListener("fullscreenchange", handleOrientation);
    document.addEventListener("webkitfullscreenchange", handleOrientation);

    return () => {
      window.removeEventListener("resize", handleOrientation);
      window.removeEventListener("orientationchange", handleOrientation);
      document.removeEventListener("fullscreenchange", handleOrientation);
      document.removeEventListener("webkitfullscreenchange", handleOrientation);
    };
  }, []);

  const handleToggleFullscreen = () => {
    toggleAppFullscreen().catch(() => {});
  };

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleRollDice = () => {
    clientLog.action("Randomize name clicked");
    const randomName = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)]!;
    setName(randomName);
    setNameError("");
    appStore.setProfile({ name: randomName });
  };

  const handleDigitChange = (index: number, val: string) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!upper) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const next = [...digits];
    next[index] = upper[upper.length - 1]!;
    setDigits(next);

    // Auto advance focus to next box
    if (index < 4) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleDigitPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    if (!e.clipboardData) return;
    const upper = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);
    if (!upper) return;

    const next = upper.split("");
    while (next.length < 5) next.push("");
    setDigits(next);
    inputRefs[Math.min(upper.length, 4)]?.current?.focus();
  };

  const handleDigitKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
    if (e.key === "Enter") {
      handleJoinSubmit();
    }
  };

  const validateName = (): boolean => {
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 16) {
      setNameError("Name must be 2 to 16 characters.");
      showToast("Nickname must be 2 to 16 characters!", "warning");
      return false;
    }
    appStore.setProfile({ name: cleanName });
    return true;
  };

  const handleCreateSubmit = () => {
    if (!validateName()) return;
    onCreate();
  };

  const handleJoinSubmit = () => {
    if (!validateName()) return;

    const fullCode = digits.join("").toUpperCase();
    if (fullCode.length !== 5) {
      showToast("Enter a 5-letter room code (e.g. SDFFS)!", "warning");
      return;
    }

    onJoin(fullCode);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setNameError("");
    appStore.setProfile({ name: val });
  };

  return {
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
  };
}
