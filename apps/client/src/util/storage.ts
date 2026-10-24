export interface SavedProfile {
  playerId: string;
  name: string;
  color: number;
  muted: boolean;
  reduceMotion: boolean;
}

const STORAGE_KEY = "mp_profile";

export function loadProfile(): SavedProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data.playerId === "string" && typeof data.name === "string") {
        return {
          playerId: data.playerId,
          name: data.name,
          color: typeof data.color === "number" ? data.color : 0,
          muted: Boolean(data.muted),
          reduceMotion: Boolean(data.reduceMotion),
        };
      }
    }
  } catch (e) {
    console.warn("Failed to load profile from localStorage:", e);
  }

  return {
    playerId: crypto.randomUUID(),
    name: "",
    color: Math.floor(Math.random() * 8),
    muted: false,
    reduceMotion: false,
  };
}

export function saveProfile(profile: Partial<SavedProfile>): void {
  try {
    const current = loadProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to save profile to localStorage:", e);
  }
}
