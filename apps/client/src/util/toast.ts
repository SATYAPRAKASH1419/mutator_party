export interface ToastMessage {
  id: number;
  message: string;
  type?: "error" | "info" | "success" | "warning";
}

type ToastListener = (toast: ToastMessage | null) => void;

let currentToast: ToastMessage | null = null;
let toastTimeout: any = null;
const listeners = new Set<ToastListener>();

export function showToast(
  message: string,
  type: "error" | "info" | "success" | "warning" = "error"
) {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  const id = Date.now();
  currentToast = { id, message, type };
  listeners.forEach((listener) => listener(currentToast));

  // Auto-dismiss strictly after 3 seconds (3000ms)
  toastTimeout = setTimeout(() => {
    if (currentToast?.id === id) {
      currentToast = null;
      listeners.forEach((listener) => listener(null));
    }
  }, 3000);
}

export function hideToast() {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  currentToast = null;
  listeners.forEach((listener) => listener(null));
}

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener);
  listener(currentToast);
  return () => {
    listeners.delete(listener);
  };
}

