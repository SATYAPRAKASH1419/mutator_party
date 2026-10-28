/**
 * Client-Side Structured Action & Event Logger
 * Logs all user actions, network events, and game state transitions with clear visual formatting.
 */

const formatTime = () => {
  const d = new Date();
  return `${d.toTimeString().split(" ")[0]}.${d.getMilliseconds().toString().padStart(3, "0")}`;
};

export const clientLog = {
  /** User UI actions: clicks, toggles, picks, inputs */
  action: (name: string, payload?: unknown) => {
    const time = formatTime();
    if (payload !== undefined) {
      console.log(
        `%c[ACTION ${time}]%c ${name}`,
        "color: #00d26a; font-weight: bold; background: rgba(0,210,106,0.1); padding: 1px 4px; border-radius: 3px;",
        "color: inherit; font-weight: 600;",
        payload,
      );
    } else {
      console.log(
        `%c[ACTION ${time}]%c ${name}`,
        "color: #00d26a; font-weight: bold; background: rgba(0,210,106,0.1); padding: 1px 4px; border-radius: 3px;",
        "color: inherit; font-weight: 600;",
      );
    }
  },

  /** Network communications: sent packets, incoming broadcasts */
  net: (event: string, payload?: unknown) => {
    const time = formatTime();
    if (payload !== undefined) {
      console.log(
        `%c[NET ${time}]%c ${event}`,
        "color: #00b4d8; font-weight: bold; background: rgba(0,180,216,0.1); padding: 1px 4px; border-radius: 3px;",
        "color: inherit;",
        payload,
      );
    } else {
      console.log(
        `%c[NET ${time}]%c ${event}`,
        "color: #00b4d8; font-weight: bold; background: rgba(0,180,216,0.1); padding: 1px 4px; border-radius: 3px;",
        "color: inherit;",
      );
    }
  },

  /** State changes: screens, room phase, player join/leaves */
  state: (label: string, payload?: unknown) => {
    const time = formatTime();
    if (payload !== undefined) {
      console.log(
        `%c[STATE ${time}]%c ${label}`,
        "color: #9d4edd; font-weight: bold; background: rgba(157,78,221,0.1); padding: 1px 4px; border-radius: 3px;",
        "color: inherit;",
        payload,
      );
    } else {
      console.log(
        `%c[STATE ${time}]%c ${label}`,
        "color: #9d4edd; font-weight: bold; background: rgba(157,78,221,0.1); padding: 1px 4px; border-radius: 3px;",
        "color: inherit;",
      );
    }
  },

  /** In-game gameplay events: round start, shoves, hits, items */
  game: (name: string, payload?: unknown) => {
    const time = formatTime();
    if (payload !== undefined) {
      console.log(
        `%c[GAME ${time}]%c ${name}`,
        "color: #ff9f1c; font-weight: bold; background: rgba(255,159,28,0.1); padding: 1px 4px; border-radius: 3px;",
        "color: inherit;",
        payload,
      );
    } else {
      console.log(
        `%c[GAME ${time}]%c ${name}`,
        "color: #ff9f1c; font-weight: bold; background: rgba(255,159,28,0.1); padding: 1px 4px; border-radius: 3px;",
        "color: inherit;",
      );
    }
  },

  /** Warning events */
  warn: (name: string, payload?: unknown) => {
    const time = formatTime();
    console.warn(`[WARN ${time}] ${name}`, payload !== undefined ? payload : "");
  },

  /** Error events */
  error: (name: string, error?: unknown) => {
    const time = formatTime();
    console.error(`[ERROR ${time}] ${name}`, error !== undefined ? error : "");
  },
};

