import { supabase } from '../supabaseClient';

/**
 * Helper function to safely merge local and remote array datasets without losing local records
 */
function mergeDatasets(localArray, remoteArray) {
  if (!Array.isArray(localArray) && !Array.isArray(remoteArray)) {
    return remoteArray || localArray;
  }
  if (!Array.isArray(localArray)) return Array.isArray(remoteArray) ? remoteArray : [];
  if (!Array.isArray(remoteArray)) return localArray;

  const getId = (item) => {
    if (!item || typeof item !== 'object') return JSON.stringify(item);
    return item.bomCode || item.id || item.code || item.poNo || item.invNo || item.grnNo || item.vendorCode || item.coilNo || item.name;
  };

  const map = new Map();
  // 1. Add all remote items
  remoteArray.forEach(item => {
    if (item) {
      const id = getId(item);
      map.set(id, item);
    }
  });

  // 2. Add/overlay local items so locally created/edited data is strictly preserved
  localArray.forEach(item => {
    if (item) {
      const id = getId(item);
      if (map.has(id)) {
        // Deep merge item properties preferring non-empty local fields
        map.set(id, { ...map.get(id), ...item });
      } else {
        map.set(id, item);
      }
    }
  });

  return Array.from(map.values());
}

/**
 * Fetch a data collection from Supabase or server API with localStorage & fallback
 * @param {string} storeKey - Unique identifier (e.g. 'bom_store', 'invoice_store', 'customer_store')
 * @param {Array|Object} fallbackData - Default initial data if cloud is empty
 * @returns {Promise<Array|Object>}
 */
export async function fetchCloudStore(storeKey, fallbackData = []) {
  // Read current cached local data first
  let cachedLocal = fallbackData;
  try {
    const localStr = localStorage.getItem(`controlroom_${storeKey}`);
    if (localStr) {
      const parsed = JSON.parse(localStr);
      if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
        cachedLocal = parsed;
      }
    }
  } catch (e) {}

  // 1. Try fetching directly via Supabase client
  try {
    const { data, error } = await supabase
      .from('controlroom_store')
      .select('data')
      .eq('key', storeKey)
      .single();

    if (!error && data && data.data) {
      const merged = mergeDatasets(cachedLocal, data.data);
      try {
        localStorage.setItem(`controlroom_${storeKey}`, JSON.stringify(merged));
      } catch (e) {}
      return merged;
    }
  } catch (err) {
    // continue to server API fallback
  }

  // 2. Fallback to Node server endpoint /api/store/:key
  try {
    const res = await fetch(`/api/store/${storeKey}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && (Array.isArray(json.data) ? json.data.length > 0 : Object.keys(json.data).length > 0)) {
        const merged = mergeDatasets(cachedLocal, json.data);
        try {
          localStorage.setItem(`controlroom_${storeKey}`, JSON.stringify(merged));
        } catch (e) {}
        return merged;
      }
    }
  } catch (err) {
    // continue to local storage
  }

  // 3. Fallback to localStorage / initial data
  return cachedLocal;
}

const saveDebounceTimers = {};
const pendingSaveData = {};

/**
 * Save a data collection to Supabase, server API, & localStorage (Debounced to prevent lag)
 * @param {string} storeKey - Unique identifier
 * @param {Array|Object} storeData - Data to save
 */
export function saveCloudStore(storeKey, storeData) {
  // 1. Immediately cache in localStorage (fast sync)
  try {
    localStorage.setItem(`controlroom_${storeKey}`, JSON.stringify(storeData));
  } catch (e) {}

  pendingSaveData[storeKey] = storeData;

  // Clear existing debounce timer
  if (saveDebounceTimers[storeKey]) {
    clearTimeout(saveDebounceTimers[storeKey]);
  }

  // 2. Debounced save to Supabase cloud database & server API (500ms delay)
  saveDebounceTimers[storeKey] = setTimeout(() => {
    const dataToSave = pendingSaveData[storeKey];
    if (!dataToSave) return;

    try {
      supabase
        .from('controlroom_store')
        .upsert({
          key: storeKey,
          data: dataToSave,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
        .then(({ error }) => {
          if (error) console.warn(`[Supabase] Cloud save notice for ${storeKey}:`, error.message);
        })
        .catch(() => {});
    } catch (err) {}

    try {
      fetch(`/api/store/${storeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      }).catch(() => {});
    } catch (err) {}
  }, 600);
}

/**
 * Subscribe to real-time changes on a specific store in Supabase
 * @param {string} storeKey - Store key to listen to
 * @param {Function} onUpdateCallback - Callback when updated
 * @returns {Object} Subscription channel that can be unsubscribed
 */
export function subscribeToCloudStore(storeKey, onUpdateCallback) {
  try {
    const channel = supabase
      .channel(`sync_${storeKey}_${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'controlroom_store',
          filter: `key=eq.${storeKey}`
        },
        (payload) => {
          if (payload && payload.new && payload.new.data) {
            try {
              localStorage.setItem(`controlroom_${storeKey}`, JSON.stringify(payload.new.data));
            } catch (e) {}
            onUpdateCallback(payload.new.data);
          }
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.warn(`[SupabaseSync] Realtime subscribe error for ${storeKey}:`, err);
    return null;
  }
}
