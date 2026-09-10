import { VRM_PRODUCTS } from './vrmProductsData';
import { centralInventoryStore } from './centralInventoryStore';

/**
 * Product Catalog & Live Stock Service
 * Provides the unified, full 285+ standardized VRM products catalog
 * combined with real-time stock balances from Central Inventory Store and Zoho Books.
 */
export const getFullProductsCatalogWithStock = (directItems = null) => {
  // 1. Build live stock map from Central Inventory Store
  const stockMap = new Map();

  try {
    const centralItems = centralInventoryStore.getInventoryItems();
    if (Array.isArray(centralItems)) {
      centralItems.forEach(ci => {
        const codeKey = String(ci.code || '').toLowerCase().trim();
        const nameKey = String(ci.name || '').toLowerCase().trim();
        const st = ci.available !== undefined 
          ? Number(ci.available) 
          : (ci.onHand !== undefined ? Number(ci.onHand) : Number(ci.stock || 0));
        
        if (codeKey) stockMap.set(codeKey, st);
        if (nameKey) stockMap.set(nameKey, st);
      });
    }
  } catch (e) {
    console.warn('[CATALOG] Central store stock query notice:', e.message);
  }

  // Also check raw materials store from localStorage for any live line adjustments
  try {
    const rawSaved = localStorage.getItem('controlroom_raw_materials_store');
    if (rawSaved) {
      const parsed = JSON.parse(rawSaved);
      if (Array.isArray(parsed)) {
        parsed.forEach(rm => {
          const codeKey = String(rm.code || '').toLowerCase().trim();
          const nameKey = String(rm.name || '').toLowerCase().trim();
          const st = Number(rm.stock !== undefined ? rm.stock : (rm.physicalStock || 0));
          if (codeKey && !stockMap.has(codeKey)) stockMap.set(codeKey, st);
          if (nameKey && !stockMap.has(nameKey)) stockMap.set(nameKey, st);
        });
      }
    }
  } catch (_) {}

  // 2. Map all 285 VRM standardized products with true stock
  const catalogMap = new Map();

  (VRM_PRODUCTS || []).forEach(p => {
    const codeKey = String(p.code || '').toLowerCase().trim();
    const nameKey = String(p.name || '').toLowerCase().trim();

    let realStock = 0;
    if (codeKey && stockMap.has(codeKey)) {
      realStock = stockMap.get(codeKey);
    } else if (nameKey && stockMap.has(nameKey)) {
      realStock = stockMap.get(nameKey);
    } else {
      // Look up partial match
      for (const [k, v] of stockMap.entries()) {
        if (k && (k === codeKey || k === nameKey || nameKey.includes(k) || k.includes(nameKey))) {
          realStock = v;
          break;
        }
      }
    }

    catalogMap.set(nameKey, {
      code: p.code || '',
      name: p.name || '',
      category: p.material || p.category || 'Structure Assembly',
      uom: p.uom || 'NOS',
      rate: String(p.price || p.rate || '0'),
      price: String(p.price || p.rate || '0'),
      gstRate: p.gst || '18%',
      stock: realStock,
      availableStock: realStock
    });
  });

  // 3. Include any items from Zoho or custom item store
  const mergeExtraItems = (items) => {
    if (!Array.isArray(items)) return;
    items.forEach(ci => {
      const nameKey = String(ci.name || '').toLowerCase().trim();
      const codeKey = String(ci.code || ci.sku || ci.itemId || ci.id || '').toLowerCase().trim();

      let realStock = 0;
      if (codeKey && stockMap.has(codeKey)) realStock = stockMap.get(codeKey);
      else if (nameKey && stockMap.has(nameKey)) realStock = stockMap.get(nameKey);
      else realStock = Number(ci.stock !== undefined ? ci.stock : (ci.availableStock !== undefined ? ci.availableStock : 0));

      if (nameKey) {
        const existing = catalogMap.get(nameKey);
        if (!existing) {
          catalogMap.set(nameKey, {
            code: ci.code || ci.sku || '',
            name: ci.name,
            category: ci.category || ci.description || 'Raw Material',
            uom: ci.uom || ci.unit || 'NOS',
            rate: String(ci.rate || ci.price || '0'),
            price: String(ci.rate || ci.price || '0'),
            gstRate: ci.gstRate || '18%',
            stock: realStock,
            availableStock: realStock
          });
        } else if (ci.rate || ci.price) {
          // If price is specified from Zoho, keep updated
          existing.rate = String(ci.rate || ci.price || existing.rate);
          existing.price = existing.rate;
        }
      }
    });
  };

  if (Array.isArray(directItems) && directItems.length > 0) {
    mergeExtraItems(directItems);
  }

  try {
    const customItemsStr = localStorage.getItem('controlroom_items_list');
    if (customItemsStr) {
      mergeExtraItems(JSON.parse(customItemsStr));
    }
  } catch (_) {}

  const fullList = Array.from(catalogMap.values());

  // Save to localStorage so other modules also have the full catalog ready
  try {
    localStorage.setItem('controlroom_items_list', JSON.stringify(fullList));
  } catch (_) {}

  return fullList;
};
