import basePresets from "./data/vrmPresetsData.json";
import { fetchCloudStore, saveCloudStoreImmediate } from "./utils/supabaseDataSync";

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

// Normalizer helper to enforce 5% GST default for DCR BOS Solar Proposal Kits
const normalizePresetGst = (preset) => {
  if (!preset) return preset;
  const isDcrBos = (preset.category && (preset.category === 'DCR BOS Solar Kits' || preset.category === 'BOS Solar Kits' || preset.category.includes('DCR BOS'))) ||
                   (preset.label && preset.label.includes('BOS KITS'));
  if (isDcrBos) {
    const updatedItems = Array.isArray(preset.items) ? preset.items.map(it => ({ ...it, gstRate: '5%' })) : [];
    return {
      ...preset,
      gstRate: '5%',
      gst: '5%',
      items: updatedItems
    };
  }
  return preset;
};

/**
 * Synchronize custom presets with server and Supabase cloud store across all systems and devices
 */
export async function syncPresetsWithCloud() {
  try {
    const [cloudPresets, serverRes] = await Promise.all([
      fetchCloudStore('presets_store', {}).catch(() => ({})),
      fetch('/api/store/presets_store').then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    let incomingMap = {};
    if (serverRes && serverRes.data && typeof serverRes.data === 'object') {
      const sData = serverRes.data;
      if (Array.isArray(sData)) {
        sData.forEach(p => { if (p && p.id && (p.isCustom || !basePresetsMap[p.id])) incomingMap[p.id] = p; });
      } else {
        Object.entries(sData).forEach(([k, v]) => {
          if (v && (v.isCustom || !basePresetsMap[k])) incomingMap[k] = v;
        });
      }
    }

    if (cloudPresets && typeof cloudPresets === 'object') {
      if (Array.isArray(cloudPresets)) {
        cloudPresets.forEach(p => { if (p && p.id && (p.isCustom || !basePresetsMap[p.id])) incomingMap[p.id] = p; });
      } else {
        Object.entries(cloudPresets).forEach(([k, v]) => {
          if (v && (v.isCustom || !basePresetsMap[k])) incomingMap[k] = v;
        });
      }
    }

    if (Object.keys(incomingMap).length > 0) {
      let localMap = {};
      try {
        const raw = localStorage.getItem("controlroom_presets_store");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'object' && parsed !== null) {
            if (Array.isArray(parsed)) {
              parsed.forEach(p => { if (p && p.id) localMap[p.id] = p; });
            } else {
              Object.entries(parsed).forEach(([k, v]) => {
                if (v && (v.isCustom || !basePresetsMap[k])) localMap[k] = v;
              });
            }
          }
        }
      } catch (_) {}

      const mergedCustom = { ...localMap, ...incomingMap };
      localStorage.setItem("controlroom_presets_store", JSON.stringify(mergedCustom));

      const mergedAll = { ...basePresetsMap, ...mergedCustom };
      const normalized = {};
      Object.keys(mergedAll).forEach(key => {
        normalized[key] = normalizePresetGst(mergedAll[key]);
      });
      window.dispatchEvent(new CustomEvent("vrm_presets_updated", { detail: normalized }));
      return normalized;
    }
  } catch (err) {
    console.warn("Could not sync presets with cloud:", err);
  }
  return getAllActivePresets();
}

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
          // extract only custom presets
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

  // Combine standard base presets and custom created presets, normalizing DCR BOS to 5% GST
  const combined = { ...basePresetsMap, ...customMap };
  const normalized = {};
  Object.keys(combined).forEach(key => {
    normalized[key] = normalizePresetGst(combined[key]);
  });
  return normalized;
}

/**
 * Save or update a single preset into custom presets store and sync to server & cloud
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

    // 3. Save to localStorage
    localStorage.setItem("controlroom_presets_store", JSON.stringify(customMap));

    // 4. Push to backend server and Supabase cloud store immediately
    fetch('/api/store/presets_store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customMap)
    }).catch(() => {});
    saveCloudStoreImmediate('presets_store', customMap).catch(() => {});

    // 5. Create merged allPresets dictionary
    const merged = { ...basePresetsMap, ...customMap };
    const normalized = {};
    Object.keys(merged).forEach(key => {
      normalized[key] = normalizePresetGst(merged[key]);
    });

    // 6. Dispatch real-time update event
    window.dispatchEvent(new CustomEvent("vrm_presets_updated", { detail: normalized }));
    return normalized;
  } catch (e) {
    console.error("Error saving custom preset", e);
    return getAllActivePresets();
  }
}

/**
 * Delete a custom preset and sync deletion to server & cloud
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

    // Push deletion to backend server and cloud store
    fetch('/api/store/presets_store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customMap)
    }).catch(() => {});
    saveCloudStoreImmediate('presets_store', customMap).catch(() => {});

    const merged = { ...basePresetsMap, ...customMap };
    const normalized = {};
    Object.keys(merged).forEach(key => {
      normalized[key] = normalizePresetGst(merged[key]);
    });
    window.dispatchEvent(new CustomEvent("vrm_presets_updated", { detail: normalized }));
    return normalized;
  } catch (e) {
    console.error("Error deleting custom preset", e);
    return getAllActivePresets();
  }
}

// Background auto-sync on browser load and window focus
if (typeof window !== "undefined") {
  setTimeout(() => {
    syncPresetsWithCloud();
  }, 150);

  window.addEventListener("focus", () => {
    syncPresetsWithCloud();
  });
}
