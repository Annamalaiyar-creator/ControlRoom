import basePresets from "./data/vrmPresetsData.json";

/**
 * VRM_HDG_PRESETS
 * Standardized Presets extracted from "VRM - Product - Standardized Names.xlsx"
 * Contains:
 * - Hat Purline Structures (126 configurations)
 * - C Purlin Structures (126 configurations)
 * - Mini Rail Kits (40mm, 60mm, 75mm, 100mm, 125mm)
 * - Adhesive Rail Kits (Penetrative & Non-Penetrative)
 * - Long Rail & Double C Rail Kits
 * - Triangle Structure Kits (North Slope, East-West, Ballast)
 * - BOS Solar Kits (3kW, 4kW, 5kW DCR)
 */
export const VRM_HDG_PRESETS = basePresets;

/**
 * Get all active presets including custom/edited presets stored in localStorage or cloud
 */
export function getAllActivePresets() {
  let customMap = {};
  try {
    const raw = localStorage.getItem("controlroom_presets_store");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            if (p && p.id) customMap[p.id] = p;
          });
        } else {
          customMap = parsed;
        }
      }
    }
  } catch (e) {
    console.error("Error reading controlroom_presets_store", e);
  }

  // Combine standard base presets (all 270 items) and user/tech-support created presets
  return { ...(basePresets || {}), ...customMap };
}

/**
 * Save or update a single preset into custom presets store
 */
export function saveCustomPreset(preset) {
  if (!preset || !preset.id) return;
  try {
    const current = getAllActivePresets();
    current[preset.id] = {
      ...preset,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem("controlroom_presets_store", JSON.stringify(current));
    // Dispatch custom event for real-time reactivity in open views
    window.dispatchEvent(new CustomEvent("vrm_presets_updated", { detail: current }));
    return current;
  } catch (e) {
    console.error("Error saving custom preset", e);
  }
}
