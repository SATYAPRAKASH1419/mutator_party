import { useState, useEffect } from "preact/hooks";
import { ToastMessage, subscribeToast, hideToast } from "@/util/toast";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export function Toast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    return subscribeToast((t) => {
      setToast(t);
    });
  }, []);

  if (!toast) return null;

  const getBgColor = (type?: string) => {
    switch (type) {
      case "success":
        return "#10B981"; // Emerald green
      case "warning":
        return "#F59E0B"; // Amber
      case "info":
        return "#3B82F6"; // Blue
      case "error":
      default:
        return "#EF4444"; // Soft vivid red
    }
  };

  const renderIcon = (type?: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={15} style={{ flexShrink: 0 }} />;
      case "warning":
        return <AlertTriangle size={15} style={{ flexShrink: 0 }} />;
      case "info":
        return <Info size={15} style={{ flexShrink: 0 }} />;
      case "error":
      default:
        return <AlertCircle size={15} style={{ flexShrink: 0 }} />;
    }
  };

  // Strip any accidental leading emoji from the message text
  const cleanMessage = (toast.message || "")
    .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "")
    .trim();

  return (
    <div
      className="mp-global-toast"
      onClick={hideToast}
      role="alert"
      title="Click to dismiss"
    >
      <style>{`
        .mp-global-toast {
          position: fixed;
          top: max(16px, env(safe-area-inset-top, 16px));
          left: 50%;
          transform: translateX(-50%);
          background: ${getBgColor(toast.type)};
          color: #FFFFFF;
          border: 2px solid var(--mp-ink, #1B1B3A);
          box-shadow: 2.5px 3.5px 0 var(--mp-ink, #1B1B3A);
          border-radius: 9999px;
          padding: 7px 16px;
          font-family: var(--font-body, "Nunito", system-ui, -apple-system, sans-serif);
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.01em;
          line-height: 1.35;
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          animation: mpToastSpring 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          white-space: nowrap;
          user-select: none;
          -webkit-user-select: none;
        }

        .mp-global-toast-close {
          background: rgba(0, 0, 0, 0.16);
          border: none;
          color: #FFFFFF;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-left: 2px;
          transition: background 0.15s ease, transform 0.1s ease;
          padding: 0;
          line-height: 1;
        }

        .mp-global-toast-close:hover {
          background: rgba(0, 0, 0, 0.32);
          transform: scale(1.1);
        }

        @keyframes mpToastSpring {
          0% {
            transform: translateX(-50%) translateY(-22px) scale(0.85);
            opacity: 0;
          }
          70% {
            transform: translateX(-50%) translateY(3px) scale(1.03);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
      {renderIcon(toast.type)}
      <span>{cleanMessage}</span>
      <span className="mp-global-toast-close" aria-label="Dismiss">
        <X size={11} />
      </span>
    </div>
  );
}
