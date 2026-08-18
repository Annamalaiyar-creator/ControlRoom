import { supabase } from '../supabaseClient';

/**
 * Fetch a data collection from Supabase or server API with localStorage & fallback
 * @param {string} storeKey - Unique identifier (e.g. 'bom_store', 'invoice_store', 'customer_store')
 * @param {Array|Object} fallbackData - Default initial data if cloud is empty
 * @returns {Promise<Array|Object>}
 */
export async function fetchCloudStore(storeKey, fallbackData = []) {
  // 1. Try fetching directly via Supabase client
  try {
    const { data, error } = await supabase
      .from('controlroom_store')
      .select('data')
      .eq('key', storeKey)
      .single();

    if (!error && data && data.data) {
      try {
        localStorage.setItem(`controlroom_${storeKey}`, JSON.stringify(data.data));
      } catch (e) {}
      return data.data;
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
        try {
          localStorage.setItem(`controlroom_${storeKey}`, JSON.stringify(json.data));
        } catch (e) {}
        return json.data;
      }
    }
  } catch (err) {
    // continue to local storage
  }

  // 3. Fallback to localStorage
  try {
    const local = localStorage.getItem(`controlroom_${storeKey}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
        return parsed;
      }
    }
  } catch (e) {}

  return fallbackData;
}

/**
 * Save a data collection to Supabase, server API, & localStorage
 * @param {string} storeKey - Unique identifier
 * @param {Array|Object} storeData - Data to save
 */
export async function saveCloudStore(storeKey, storeData) {
  // 1. Immediately cache in localStorage
  try {
    localStorage.setItem(`controlroom_${storeKey}`, JSON.stringify(storeData));
  } catch (e) {}

  // 2. Async save to Supabase cloud database
  try {
    supabase
      .from('controlroom_store')
      .upsert({
        key: storeKey,
        data: storeData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      .then(({ error }) => {
        if (error) console.warn(`[Supabase] Cloud save notice for ${storeKey}:`, error.message);
      })
      .catch(() => {});
  } catch (err) {}

  // 3. Background save to server API
  try {
    fetch(`/api/store/${storeKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeData)
    }).catch(() => {});
  } catch (err) {}
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
