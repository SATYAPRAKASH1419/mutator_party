import { describe, it, expect, beforeEach } from "vitest";
import { PRESETS, decodeSettingsCode, encodeSettingsCode } from "@mutator-party/shared";
import {
  loadLastUsedConfig,
  saveLastUsedConfig,
  loadCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
} from "../src/ui/settings/settingsStorage";

describe("Settings Storage Layer", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = String(val);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
    };
    localStorage.clear();
  });

  it("loads default Chaos Party when storage is empty", () => {
    const config = loadLastUsedConfig();
    expect(config.match.rounds).toBe(5);
    expect(config.match.fillBots).toBe(true);
  });

  it("persists and restores host last-used config", () => {
    const classic = PRESETS.classic.config;
    saveLastUsedConfig(classic);

    const reloaded = loadLastUsedConfig();
    expect(reloaded.match.rounds).toBe(5);
    expect(reloaded.match.roundTime).toBe(60);
    expect(reloaded.theme.mode).toBe("fixed");
  });

  it("stores up to 3 custom presets and supports deletion", () => {
    expect(loadCustomPresets()).toHaveLength(0);

    saveCustomPreset({
      name: "Preset 1",
      icon: "star",
      config: PRESETS.chaosParty.config,
    });
    saveCustomPreset({
      name: "Preset 2",
      icon: "heart",
      config: PRESETS.classic.config,
    });
    const presets3 = saveCustomPreset({
      name: "Preset 3",
      icon: "flame",
      config: PRESETS.tournament.config,
    });
    expect(presets3).toHaveLength(3);

    // Adding 4th caps at 3 and rolls oldest
    const presets4 = saveCustomPreset({
      name: "Preset 4",
      icon: "star",
      config: PRESETS.chill.config,
    });
    expect(presets4).toHaveLength(3);
    expect(presets4.map((p) => p.name)).toEqual(["Preset 2", "Preset 3", "Preset 4"]);

    // Deletion
    const deleted = deleteCustomPreset(presets4[0]!.id);
    expect(deleted).toHaveLength(2);
    expect(deleted.map((p) => p.name)).toEqual(["Preset 3", "Preset 4"]);
  });

  it("round-trips 8-character tournament settings code", () => {
    const code = encodeSettingsCode(PRESETS.tournament.config);
    expect(code).toHaveLength(8);

    const decoded = decodeSettingsCode(code);
    expect(decoded).not.toBeNull();
    expect(decoded?.match.rounds).toBe(7);
    expect(decoded?.match.fillBots).toBe(false);
  });
});
