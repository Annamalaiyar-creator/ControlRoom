import { fetchCloudStore, saveCloudStore } from '../utils/supabaseDataSync';

export const DEFAULT_BRANDING = {
  logoUrl: '/vrm_logo.png',
  logoHeight: 56,
  showLogo: true,
  stampMode: 'vector', // 'vector' | 'custom' | 'none'
  customStampUrl: null,
  stampSize: 230,
  showSignatoryStamp: true,
  stampText: 'VRM STRUCTURES INDIA',
  stampLocation: 'CHENNAI - AUTHORIZED',
  forCompanyText: 'For VRM Structures India Pvt Ltd',
  signatoryTitle: 'Authorized Signatory',
  signatoryName: '',
  signatureMode: 'none', // 'none' | 'vector' | 'custom'
  customSignatureUrl: null
};

const STORAGE_KEY = 'vrm_company_branding';

/**
 * Reads the synchronous local cache for immediate zero-latency UI rendering.
 */
export const getCachedBranding = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const constantLogo = localStorage.getItem('vrm_constant_logo');
    const constantStamp = localStorage.getItem('vrm_constant_stamp');

    let branding = { ...DEFAULT_BRANDING };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          branding = { ...branding, ...parsed };
        }
      } catch (_) {}
    }

    // Inherit legacy local constant keys if not explicitly set
    if (!branding.customStampUrl && constantStamp) {
      branding.customStampUrl = constantStamp;
      branding.stampMode = 'custom';
    }
    if (constantLogo && (!branding.logoUrl || branding.logoUrl === '/vrm_logo.png')) {
      branding.logoUrl = constantLogo;
    }

    return branding;
  } catch (e) {
    return { ...DEFAULT_BRANDING };
  }
};

/**
 * Fetches the master company branding from the central backend server / cloud database.
 * Syncs the local browser cache and dispatches an update event so all open views reflect the change.
 */
export const fetchMasterBranding = async () => {
  try {
    // 1. Try fetching from Node server store
    const res = await fetch('/api/store/company_branding_store');
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data && typeof json.data === 'object' && !Array.isArray(json.data)) {
        if (json.data.logoUrl || json.data.customStampUrl || json.data.stampText) {
          applyAndCacheBranding(json.data);
          return json.data;
        }
      }
    }

    // 2. Fallback to Supabase cloud store
    const cloudData = await fetchCloudStore('company_branding_store', null);
    if (cloudData && typeof cloudData === 'object' && !Array.isArray(cloudData)) {
      if (cloudData.logoUrl || cloudData.customStampUrl || cloudData.stampText) {
        applyAndCacheBranding(cloudData);
        return cloudData;
      }
    }
  } catch (err) {
    console.warn('[BrandingService] Error fetching master branding from server:', err);
  }
  return getCachedBranding();
};

/**
 * Internal helper to save branding into localStorage and notify listeners.
 */
const applyAndCacheBranding = (data) => {
  try {
    const current = getCachedBranding();
    const merged = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    if (merged.customStampUrl) {
      localStorage.setItem('vrm_constant_stamp', merged.customStampUrl);
    }
    if (merged.logoUrl) {
      localStorage.setItem('vrm_constant_logo', merged.logoUrl);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vrm_branding_updated', { detail: merged }));
    }
  } catch (e) {
    console.warn('[BrandingService] Could not cache branding to localStorage:', e);
  }
};

/**
 * Saves company branding updates locally AND pushes to the central backend server
 * so that all other logins, browsers, and devices immediately receive the exact same assets.
 */
export const saveCompanyBranding = async (updates) => {
  try {
    const current = getCachedBranding();
    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    // 1. Immediate local cache write
    applyAndCacheBranding(updated);

    // 2. Async save to server backend store (/api/store/company_branding_store)
    try {
      await fetch('/api/store/company_branding_store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (netErr) {
      console.warn('[BrandingService] Server post error:', netErr);
    }

    // 3. Persist to Supabase cloud store for multi-system resilience
    try {
      saveCloudStore('company_branding_store', updated);
    } catch (sErr) {
      console.warn('[BrandingService] Supabase cloud store error:', sErr);
    }

    return updated;
  } catch (err) {
    console.error('[BrandingService] Error saving company branding:', err);
    return getCachedBranding();
  }
};

/**
 * Subscribe to live branding updates across components and browser storage events.
 */
export const subscribeBrandingUpdates = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e) => {
    callback(e.detail || getCachedBranding());
  };

  const handleStorageEvent = (e) => {
    if (e.key === STORAGE_KEY || e.key === 'vrm_constant_stamp' || e.key === 'vrm_constant_logo') {
      callback(getCachedBranding());
    }
  };

  window.addEventListener('vrm_branding_updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('vrm_branding_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
};
