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
    return item.employee_code || item.bomCode || item.id || item.workOrderNo || item.woNo || item.code || item.poNo || item.invNo || item.grnNo || item.vendorCode || item.coilNo || item.email || item.name;
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

  // For employees_store, fetch directly from Supabase users table
  if (storeKey === 'employees_store') {
    try {
      const { data: dbUsers, error: userErr } = await supabase
        .from('users')
        .select('*');

      if (!userErr && Array.isArray(dbUsers) && dbUsers.length > 0) {
        // Only map genuine ControlRoom registered employees (those with CODE:::ROLE:::STATUS metadata)
        const remoteEmployees = dbUsers
          .filter(u => u.department && u.department.includes(':::'))
          .map(u => {
            const parts = u.department.split(':::');
            const empCode = parts[0];
            const role = parts[1] || u.role || 'Sales Executive';
            const status = parts[2] || 'Pending Approval';

            return {
              id: u.id,
              employee_code: empCode,
              employee_name: u.name,
              email: u.email,
              password: u.password,
              role: role,
              department: u.department,
              status: status
            };
          });

        const merged = mergeDatasets(cachedLocal, remoteEmployees);
        try {
          localStorage.setItem(`controlroom_${storeKey}`, JSON.stringify(merged));
          const codes = merged.map(e => e.employee_code || e.code).filter(Boolean);
          localStorage.setItem('controlroom_registered_codes', JSON.stringify(codes));
        } catch (e) {}
        return merged;
      }
    } catch (err) {}
  }

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
  saveDebounceTimers[storeKey] = setTimeout(async () => {
    const dataToSave = pendingSaveData[storeKey];
    if (!dataToSave) return;

    // Direct persistence for employees to Supabase users table
    if (storeKey === 'employees_store' && Array.isArray(dataToSave)) {
      try {
        for (const emp of dataToSave) {
          if (!emp || !emp.email) continue;
          const cleanEmail = (emp.email || '').trim().toLowerCase();
          const cleanCode = emp.employee_code || emp.code || 'FE-VRM001';
          const cleanRole = emp.role || 'Floor Employee';
          const cleanStatus = emp.status || 'Pending Approval';
          // Store code, role, status in department field: CODE:::ROLE:::STATUS
          const deptMeta = `${cleanCode}:::${cleanRole}:::${cleanStatus}`;

          const { data: existing } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (existing && existing.id) {
            await supabase
              .from('users')
              .update({
                name: emp.employee_name || emp.name,
                password: emp.password || '123456',
                role: cleanRole,
                department: deptMeta
              })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('users')
              .insert({
                name: emp.employee_name || emp.name,
                email: cleanEmail,
                password: emp.password || '123456',
                role: cleanRole,
                department: deptMeta,
                annual_leave: 20,
                sick_leave: 5
              });
          }
        }
      } catch (err) {
        console.error('Error syncing employees to users table:', err);
      }
    }

    try {
      supabase
        .from('controlroom_store')
        .upsert({
          key: storeKey,
          data: dataToSave,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
        .then(() => {})
        .catch(() => {});
    } catch (err) {}

    try {
      fetch(`/api/store/${storeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      }).catch(() => {});
    } catch (err) {}
  }, 400);
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
          table: storeKey === 'employees_store' ? 'users' : 'controlroom_store',
          filter: storeKey === 'employees_store' ? undefined : `key=eq.${storeKey}`
        },
        async (payload) => {
          if (storeKey === 'employees_store') {
            const list = await fetchCloudStore('employees_store', []);
            onUpdateCallback(list);
          } else if (payload && payload.new && payload.new.data) {
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
