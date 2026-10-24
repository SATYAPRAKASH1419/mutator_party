import {
  LogOut,
  X,
  Copy,
  Check,
  Settings,
  Info,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Dices,
  Gamepad2,
  Link,
  RotateCw,
  RotateCcw,
  ArrowRight,
  Loader2,
} from "lucide-react";

export {
  LogOut,
  X,
  Copy,
  Check,
  Settings,
  Info,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Dices,
  Gamepad2,
  Link,
  RotateCw,
  RotateCcw,
  ArrowRight,
  Loader2,
  // Convenience aliases
  LogOut as IconExit,
  X as IconClose,
  Copy as IconCopy,
  Check as IconCheck,
  Settings as IconSettings,
  Info as IconRules,
  Maximize as IconFullscreen,
  Minimize as IconMinimize,
  Volume2 as IconVolumeOn,
  VolumeX as IconVolumeMute,
  Dices as IconDice,
  Gamepad2 as IconGamepad,
  Link as IconLink,
  RotateCw as IconRotate,
  RotateCcw as IconRefresh,
  ArrowRight as IconArrowRight,
};

export function IconSpinner({
  size = 32,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: Record<string, any>;
}) {
  return (
    <Loader2
      size={size}
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        animation: "mpSpin 1s linear infinite",
        ...style,
      }}
    />
  );
}
