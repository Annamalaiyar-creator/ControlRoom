import { supabase } from '../supabaseClient';

/**
 * Universal safe fetcher for Zoho data in ControlRoom.
 * If backend Express /api/zoho/* is alive, it queries it.
 * If backend returns 404/405/HTML (e.g. IIS static hosting without Node.js),
 * it seamlessly pulls from the Supabase leaves cloud store or local cache.
 */

export async function getSafeZohoItems() {
  // 1. Try backend endpoint first
  try {
    const res = await fetch('/api/zoho/items');
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('controlroom_item_store', JSON.stringify(data));
        return data;
      }
    }
  } catch (_) {}

  // 2. Fallback to Supabase leaves cloud store (where items are synced)
  try {
    const { data: record } = await supabase
      .from('leaves')
      .select('reason')
      .eq('employee', 'ITEM_STORE')
      .maybeSingle();

    if (record && record.reason) {
      const parsed = JSON.parse(record.reason);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem('controlroom_item_store', JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Supabase items fetch notice:', err);
  }

  // 3. Fallback to localStorage
  try {
    const local = localStorage.getItem('controlroom_item_store');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  return [];
}

export async function getSafeZohoVendors() {
  // 1. Try backend endpoint first
  try {
    const res = await fetch('/api/zoho/vendors');
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('controlroom_vendor_store', JSON.stringify(data));
        return data;
      }
    }
  } catch (_) {}

  // 2. Fallback to Supabase leaves cloud store
  try {
    const { data: record } = await supabase
      .from('leaves')
      .select('reason')
      .eq('employee', 'VENDOR_STORE')
      .maybeSingle();

    if (record && record.reason) {
      const parsed = JSON.parse(record.reason);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem('controlroom_vendor_store', JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Supabase vendors fetch notice:', err);
  }

  // 3. Fallback to localStorage
  try {
    const local = localStorage.getItem('controlroom_vendor_store');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  return [];
}

export async function getSafeZohoPOs() {
  // 1. Try backend endpoint first
  try {
    const res = await fetch('/api/zoho/purchaseorders');
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('controlroom_po_store', JSON.stringify(data));
        return data;
      }
    }
  } catch (_) {}

  // 2. Fallback to Supabase leaves cloud store
  try {
    const { data: record } = await supabase
      .from('leaves')
      .select('reason')
      .eq('employee', 'PO_STORE')
      .maybeSingle();

    if (record && record.reason) {
      const parsed = JSON.parse(record.reason);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem('controlroom_po_store', JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Supabase POs fetch notice:', err);
  }

  // 3. Fallback to localStorage
  try {
    const local = localStorage.getItem('controlroom_po_store');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  return [];
}
