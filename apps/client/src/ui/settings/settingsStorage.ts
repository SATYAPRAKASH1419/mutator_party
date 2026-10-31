import {
  type GameConfig,
  type CustomPreset,
  PRESETS,
  sanitize,
  encodeSettingsCode,
  decodeSettingsCode,
} from "@mutator-party/shared";

const STORAGE_KEY_LAST_CONFIG = "mp_host_last_config";
const STORAGE_KEY_CUSTOM_PRESETS = "mp_custom_presets";
const MAX_CUSTOM_PRESETS = 3;

/**
 * Loads the host's last-used config from localStorage, or defaults to Chaos Party.
 */
export function loadLastUsedConfig(): GameConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return sanitize(parsed, PRESETS.chaosParty.config);
    }
  } catch (err) {
    console.warn("Failed to load last config from localStorage", err);
  }
  return PRESETS.chaosParty.config;
}

/**
 * Persists the host's config to localStorage as the last-used settings.
 */
export function saveLastUsedConfig(config: GameConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn("Failed to save last config to localStorage", err);
  }
}

/**
 * Loads user's custom presets from localStorage (up to 3).
 */
export function loadCustomPresets(): CustomPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PRESETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_CUSTOM_PRESETS).map((p) => ({
          ...p,
          config: sanitize(p.config, PRESETS.chaosParty.config),
        }));
      }
    }
  } catch (err) {
    console.warn("Failed to load custom presets from localStorage", err);
  }
  return [];
}

/**
 * Saves a new custom preset (max 3, replaces oldest if at capacity).
 */
export function saveCustomPreset(preset: Omit<CustomPreset, "id" | "createdAt">): CustomPreset[] {
  const current = loadCustomPresets();
  const newPreset: CustomPreset = {
    ...preset,
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };

  let updated: CustomPreset[];
  if (current.length >= MAX_CUSTOM_PRESETS) {
    // Keep 2 most recent and add new one
    updated = [...current.slice(1), newPreset];
  } else {
    updated = [...current, newPreset];
  }

  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save custom presets to localStorage", err);
  }

  return updated;
}

/**
 * Deletes a custom preset by ID.
 */
export function deleteCustomPreset(id: string): CustomPreset[] {
  const current = loadCustomPresets();
  const updated = current.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to delete custom preset from localStorage", err);
  }
  return updated;
}

export { encodeSettingsCode, decodeSettingsCode };

