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

// Cache basePresets lookup for fast access
const basePresetsMap = basePresets || {};

/**
 * Get all active presets including custom/edited presets stored in localStorage or cloud
 */
export function getAllActivePresets() {
  let customMap = {};
  try {
    const raw = localStorage.getItem("controlroom_presets_store");
    if (raw && raw !== "undefined" && raw !== "null") {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            if (p && p.id) customMap[p.id] = p;
          });
        } else {
          // If previous version saved the entire 270 base presets into localStorage,
          // extract only the custom presets (isCustom === true) or presets with non-base IDs
          Object.entries(parsed).forEach(([key, val]) => {
            if (val && (val.isCustom || !basePresetsMap[key])) {
              customMap[key] = val;
            }
          });
        }
      }
    }
  } catch (e) {
    console.error("Error reading controlroom_presets_store", e);
  }

  // Combine standard base presets (all 270 items) and custom created presets
  return { ...basePresetsMap, ...customMap };
}

/**
 * Save or update a single preset into custom presets store
 */
export function saveCustomPreset(preset) {
  if (!preset || !preset.id) return getAllActivePresets();
  try {
    // 1. Read existing custom presets only
    let customMap = {};
    const raw = localStorage.getItem("controlroom_presets_store");
    if (raw && raw !== "undefined" && raw !== "null") {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            if (p && p.id) customMap[p.id] = p;
          });
        } else {
          Object.entries(parsed).forEach(([key, val]) => {
            if (val && (val.isCustom || !basePresetsMap[key])) {
              customMap[key] = val;
            }
          });
        }
      }
    }

    // 2. Add or update the preset
    const toSave = {
      ...preset,
      isCustom: true,
      updated_at: new Date().toISOString()
    };
    customMap[preset.id] = toSave;

    // 3. Save ONLY the custom presets map to localStorage (lightweight, safe from quota limit)
    localStorage.setItem("controlroom_presets_store", JSON.stringify(customMap));

    // 4. Create merged allPresets dictionary
    const merged = { ...basePresetsMap, ...customMap };

    // 5. Dispatch real-time update event
    window.dispatchEvent(new CustomEvent("vrm_presets_updated", { detail: merged }));
    return merged;
  } catch (e) {
    console.error("Error saving custom preset", e);
    return getAllActivePresets();
  }
}

/**
 * Delete a custom preset
 */
export function deleteCustomPreset(presetId) {
  if (!presetId) return getAllActivePresets();
  try {
    let customMap = {};
    const raw = localStorage.getItem("controlroom_presets_store");
    if (raw && raw !== "undefined" && raw !== "null") {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        if (Array.isArray(parsed)) {
          parsed.forEach(p => {
            if (p && p.id) customMap[p.id] = p;
          });
        } else {
          Object.entries(parsed).forEach(([key, val]) => {
            if (val && (val.isCustom || !basePresetsMap[key])) {
              customMap[key] = val;
            }
          });
        }
      }
    }

    delete customMap[presetId];
    localStorage.setItem("controlroom_presets_store", JSON.stringify(customMap));
    const merged = { ...basePresetsMap, ...customMap };
    window.dispatchEvent(new CustomEvent("vrm_presets_updated", { detail: merged }));
    return merged;
  } catch (e) {
    console.error("Error deleting custom preset", e);
    return getAllActivePresets();
  }
}


