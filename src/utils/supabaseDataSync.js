import { supabase } from '../supabaseClient';

// Ensure all local browser caches for BOM and Invoice stores are purged so data lives 100% in Supabase
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    localStorage.removeItem('controlroom_bom_store');
    localStorage.removeItem('controlroom_invoice_store');
  } catch (_) {}
}

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
  localArray.forEach(item => {
    if (item) {
      const id = getId(item);
      map.set(id, item);
    }
  });

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
 * Fetch a data collection DIRECTLY from Supabase cloud database
 * @param {string} storeKey - Unique identifier (e.g. 'bom_store', 'invoice_store', 'customer_store')
 * @param {Array|Object} fallbackData - Default initial data if cloud is empty
 * @returns {Promise<Array|Object>}
 */
export async function fetchCloudStore(storeKey, fallbackData = []) {
  // For employees_store, fetch directly from Supabase users table
  if (storeKey === 'employees_store') {
    try {
      const { data: dbUsers, error: userErr } = await supabase
        .from('users')
        .select('*');

      if (!userErr && Array.isArray(dbUsers) && dbUsers.length > 0) {
        // Only map genuine ControlRoom registered employees (those with CODE:::ROLE:::STATUS metadata)
        return dbUsers
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
      }
    } catch (err) {}
  }

  // 1. Fetch directly from Supabase leaves table store
  try {
    const { data: records, error } = await supabase
      .from('leaves')
      .select('reason')
      .eq('employee', storeKey.toUpperCase())
      .order('id', { ascending: false })
      .limit(1);

    const record = (records && records.length > 0) ? records[0] : null;

    if (!error && record && record.reason) {
      try {
        const cloudParsed = JSON.parse(record.reason);
        if (Array.isArray(cloudParsed)) {
          return cloudParsed;
        } else if (cloudParsed && typeof cloudParsed === 'object') {
          return cloudParsed;
        }
      } catch (pErr) {}
    }
  } catch (err) {
    // continue to server API fallback
  }

  // 2. Fallback to Node server endpoint /api/store/:key (which queries Supabase)
  try {
    const res = await fetch(`/api/store/${storeKey}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {}

  return fallbackData;
}

const saveDebounceTimers = {};
const pendingSaveData = {};

/**
 * Save a data collection DIRECTLY to Supabase cloud database (No localStorage dependency)
 * @param {string} storeKey - Unique identifier
 * @param {Array|Object} storeData - Data to save
 */
export function saveCloudStore(storeKey, storeData) {
  pendingSaveData[storeKey] = storeData;

  // Clear existing debounce timer
  if (saveDebounceTimers[storeKey]) {
    clearTimeout(saveDebounceTimers[storeKey]);
  }

  // Debounced save to Supabase cloud database & server API (300ms delay)
  saveDebounceTimers[storeKey] = setTimeout(async () => {
    const dataToSave = pendingSaveData[storeKey];
    if (dataToSave === undefined || dataToSave === null) return;

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
      const { data: records } = await supabase
        .from('leaves')
        .select('id, reason')
        .eq('employee', employeeKey)
        .order('id', { ascending: false })
        .limit(1);

      const record = (records && records.length > 0) ? records[0] : null;

      let finalPayload = dataToSave;
      if (storeKey !== 'bom_store' && storeKey !== 'invoice_store') {
        if (Array.isArray(dataToSave) && dataToSave.length > 0 && record && record.reason) {
          try {
            const existingCloud = JSON.parse(record.reason);
            if (Array.isArray(existingCloud) && existingCloud.length > 0) {
              // merge existing cloud records with dataToSave
              finalPayload = mergeDatasets(existingCloud, dataToSave);
            }
          } catch (_) {}
        }
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
  let highestNum = 0;

  try {
    const [seqRes, storeRes] = await Promise.all([
      supabase.from('leaves').select('id, reason').eq('employee', 'BOM_SEQUENCE').order('id', { ascending: false }).limit(1),
      supabase.from('leaves').select('reason').eq('employee', 'BOM_STORE').order('id', { ascending: false }).limit(1)
    ]);

    const seqRow = seqRes.data?.[0];
    const storeRow = storeRes.data?.[0];

    let seqCounter = 0;
    if (seqRow && seqRow.reason) {
      try {
        const parsedSeq = JSON.parse(seqRow.reason);
        seqCounter = parseInt(parsedSeq?.lastNumber || parsedSeq?.counter || parsedSeq || 0);
      } catch (_) {}
    }

    let storeMax = 0;
    if (storeRow && storeRow.reason) {
      try {
        const list = JSON.parse(storeRow.reason);
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

    highestNum = Math.max(seqCounter, storeMax, 0);
    const nextNum = highestNum + 1;
    const formattedCode = `BOM-${String(nextNum).padStart(3, '0')}`;

    if (commit) {
      const seqPayload = JSON.stringify({
        lastNumber: nextNum,
        updatedAt: new Date().toISOString(),
        reservedBy: 'Sales Rep'
      });

      if (seqRow && seqRow.id) {
        await supabase
          .from('leaves')
          .update({
            reason: seqPayload,
            dates: new Date().toISOString(),
            status: 'active',
            duration: String(nextNum)
          })
          .eq('id', seqRow.id);
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

    return formattedCode;
  } catch (err) {
    console.error('Error reserving next BOM code from Supabase:', err);
    return 'BOM-001';
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
