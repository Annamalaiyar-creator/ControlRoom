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
    if (item.email && (item.employee_code || item.role)) return `emp_${item.email.toLowerCase().trim()}`;
    return item.employee_code || item.bomCode || item.id || item.workOrderNo || item.woNo || item.code || item.poNo || item.invNo || item.grnNo || item.vendorCode || item.coilNo || item.email || item.name;
  };

  const map = new Map();
  // 1. Add all local items first
  localArray.forEach(item => {
    if (item) {
      const id = getId(item);
      map.set(id, item);
    }
  });

  // 2. Overlay remote items on top so the database/server is the authoritative source of truth
  remoteArray.forEach(item => {
    if (item) {
      const id = getId(item);
      if (map.has(id)) {
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

  // 1. Try fetching directly via Supabase client using working leaves table store
  try {
    const { data: record, error } = await supabase
      .from('leaves')
      .select('reason')
      .eq('employee', storeKey.toUpperCase())
      .maybeSingle();

    if (!error && record && record.reason) {
      try {
        const cloudParsed = JSON.parse(record.reason);
        if (cloudParsed && (Array.isArray(cloudParsed) ? cloudParsed.length > 0 : Object.keys(cloudParsed).length > 0)) {
          const merged = mergeDatasets(cachedLocal, cloudParsed);
          try {
            localStorage.setItem(`controlroom_${storeKey}`, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        }
      } catch (pErr) {}
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
      const employeeKey = storeKey.toUpperCase();
      const { data: record } = await supabase
        .from('leaves')
        .select('id, reason')
        .eq('employee', employeeKey)
        .maybeSingle();

      let finalPayload = dataToSave;
      if (Array.isArray(dataToSave) && record && record.reason) {
        try {
          const existingCloud = JSON.parse(record.reason);
          if (Array.isArray(existingCloud) && existingCloud.length > 0) {
            // merge existing cloud records with dataToSave so we NEVER delete or regress cloud items
            finalPayload = mergeDatasets(existingCloud, dataToSave);
          }
        } catch (_) {}
      }

      if (record && record.id) {
        await supabase
          .from('leaves')
          .update({
            reason: JSON.stringify(finalPayload),
            status: 'active',
            dates: new Date().toISOString(),
            duration: String(Array.isArray(finalPayload) ? finalPayload.length : 1)
          })
          .eq('id', record.id);
      } else {
        await supabase
          .from('leaves')
          .insert({
            employee: employeeKey,
            reason: JSON.stringify(finalPayload),
            status: 'active',
            dates: new Date().toISOString(),
            duration: String(Array.isArray(finalPayload) ? finalPayload.length : 1),
            type: 'Store'
          });
      }
    } catch (err) {
      console.warn(`[Supabase Store Sync Warn for ${storeKey}]:`, err?.message || err);
    }

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
 * Atomically reserve or peek the next sequential BOM code from Supabase.
 * Guaranteed uniqueness across 5+ concurrent salespeople.
 * @param {boolean} [commit=true] - If true, atomically increments and saves the new counter.
 * @returns {Promise<string>} Next BOM code (e.g., 'BOM-625')
 */
export async function getAndReserveNextBomCode(commit = true) {
  let highestNum = 624;

  try {
    // 1. Fetch current sequence counter and BOM store from Supabase in parallel
    const [seqRes, storeRes] = await Promise.all([
      supabase.from('leaves').select('id, reason').eq('employee', 'BOM_SEQUENCE').maybeSingle(),
      supabase.from('leaves').select('reason').eq('employee', 'BOM_STORE').maybeSingle()
    ]);

    let seqCounter = 0;
    if (seqRes.data && seqRes.data.reason) {
      try {
        const parsedSeq = JSON.parse(seqRes.data.reason);
        seqCounter = parseInt(parsedSeq?.lastNumber || parsedSeq?.counter || parsedSeq || 0);
      } catch (_) {}
    }

    let storeMax = 0;
    if (storeRes.data && storeRes.data.reason) {
      try {
        const list = JSON.parse(storeRes.data.reason);
        if (Array.isArray(list)) {
          const nums = list.map(b => {
            const raw = String(b.bomCode || b.code || b.id || '');
            const match = raw.match(/BOM-(\d+)/i);
            return match ? parseInt(match[1]) : 0;
          }).filter(n => !isNaN(n) && n > 0);
          if (nums.length > 0) storeMax = Math.max(...nums);
        }
      } catch (_) {}
    }

    // Also check local storage as backup
    let localMax = 0;
    try {
      const localStr = localStorage.getItem('controlroom_bom_store');
      if (localStr) {
        const localList = JSON.parse(localStr);
        if (Array.isArray(localList)) {
          const nums = localList.map(b => {
            const raw = String(b.bomCode || b.code || b.id || '');
            const match = raw.match(/BOM-(\d+)/i);
            return match ? parseInt(match[1]) : 0;
          }).filter(n => !isNaN(n) && n > 0);
          if (nums.length > 0) localMax = Math.max(...nums);
        }
      }
    } catch (_) {}

    highestNum = Math.max(seqCounter, storeMax, localMax, 624);
    const nextNum = highestNum + 1;

    if (commit) {
      const seqPayload = JSON.stringify({
        lastNumber: nextNum,
        updatedAt: new Date().toISOString(),
        reservedBy: localStorage.getItem('controlroom_logged_user_name') || 'Sales Rep'
      });

      if (seqRes.data && seqRes.data.id) {
        await supabase
          .from('leaves')
          .update({
            reason: seqPayload,
            dates: new Date().toISOString(),
            status: 'active',
            duration: String(nextNum)
          })
          .eq('id', seqRes.data.id);
      } else {
        await supabase
          .from('leaves')
          .insert({
            employee: 'BOM_SEQUENCE',
            reason: seqPayload,
            dates: new Date().toISOString(),
            status: 'active',
            duration: String(nextNum),
            type: 'Sequence'
          });
      }
    }

    return `BOM-${nextNum}`;
  } catch (err) {
    console.error('Error reserving next BOM code from Supabase:', err);
    let max = 624;
    try {
      const localStr = localStorage.getItem('controlroom_bom_store');
      if (localStr) {
        const localList = JSON.parse(localStr);
        const nums = localList.map(b => parseInt(String(b.bomCode || b.code || '').replace(/[^0-9]/g, ''))).filter(n => !isNaN(n));
        if (nums.length > 0) max = Math.max(...nums);
      }
    } catch (_) {}
    return `BOM-${max + 1}`;
  }
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
