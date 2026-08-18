/**
 * ControlRoom Integrated Production & Inventory Store Manager
 * 
 * Single Source of Truth for Item Master, BOMs, Work Orders, Stock Movements,
 * Material Issue, Actual Consumption Variance, Scrap & Reusable Returns, and Audit Ledger.
 */

// Central Item Master Database
export const INITIAL_ITEM_MASTER = [
  // Raw Materials
  { code: 'RM-ROD-LONG', name: 'Long Rod (1200mm Steel Bar)', category: 'Raw Material', uom: 'Nos', stock: 1000, safetyStock: 200, unitRate: 150, location: 'RM Store #1', specs: 'Length: 1200mm | Grade: Fe500' },
  { code: 'RM-ROD-SHORT', name: 'Small Rod (600mm Steel Bar)', category: 'Raw Material', uom: 'Nos', stock: 850, safetyStock: 200, unitRate: 85, location: 'RM Store #1', specs: 'Length: 600mm | Grade: Fe500' },
  { code: 'RM-SHT-GI250', name: 'GI Sheet 2500×1250×2mm', category: 'Raw Material', uom: 'Sheet', stock: 45, safetyStock: 10, unitRate: 4134, location: 'RM Store #2', specs: '2500mm × 1250mm × 2mm | Galvanized GI' },
  { code: 'RM-ALU-COIL', name: 'Raw Aluminum Coil 1.5mm', category: 'Raw Material', uom: 'Kg', stock: 4200, safetyStock: 1000, unitRate: 245, location: 'RM Store #1', specs: 'Grade 6063-T6 | Thickness: 1.5mm' },
  
  // Fasteners & Hardware
  { code: 'RM-FST-BLT5', name: 'M8×30 Hex Bolt (SS304)', category: 'Component', uom: 'Nos', stock: 5000, safetyStock: 1000, unitRate: 12, location: 'Hardware Bin #4', specs: 'M8 Thread | 30mm Length' },
  { code: 'RM-FST-NUT5', name: 'M8 Lock Nut (SS304)', category: 'Component', uom: 'Nos', stock: 4800, safetyStock: 1000, unitRate: 6, location: 'Hardware Bin #4', specs: 'M8 Thread | Nylon Insert' },
  { code: 'RM-FST-WSH5', name: 'M8 Spring Washer', category: 'Component', uom: 'Nos', stock: 6500, safetyStock: 1000, unitRate: 3, location: 'Hardware Bin #4', specs: 'M8 Spring Washer' },

  // Finished Goods
  { code: 'FG-TRI-100', name: 'Triangle Structure (Solar Mount)', category: 'Finished Goods', uom: 'Nos', stock: 120, safetyStock: 50, unitRate: 1450, location: 'FG Warehouse #A', specs: 'Solar Array Support Triangle' },
  { code: 'FG-MNT-500', name: 'Mounting Plate 500×250mm', category: 'Finished Goods', uom: 'Nos', stock: 450, safetyStock: 100, unitRate: 380, location: 'FG Warehouse #A', specs: '500mm × 250mm × 2mm' },
  { code: 'FG-RAIL-100', name: 'Mini Rail 100 mm', category: 'Finished Goods', uom: 'Nos', stock: 1200, safetyStock: 300, unitRate: 215, location: 'FG Warehouse #B', specs: 'Aluminum Mounting Rail 100mm' },

  // Scrap & Reusable Materials
  { code: 'SCRAP-ALU', name: 'Aluminum Scrap Shavings & Edges', category: 'Scrap', uom: 'Kg', stock: 340, safetyStock: 0, unitRate: 140, location: 'Scrap Yard #1', specs: 'Melting Scrap' },
  { code: 'SCRAP-STL', name: 'Steel Offcut Scrap', category: 'Scrap', uom: 'Kg', stock: 210, safetyStock: 0, unitRate: 32, location: 'Scrap Yard #2', specs: 'Mixed Steel Scrap' },
  { code: 'REM-SHT-GI', name: 'Reusable GI Sheet Offcut (End Remnant)', category: 'Reusable Material', uom: 'Nos', stock: 14, safetyStock: 0, unitRate: 850, location: 'Remnant Storage Bin #1', specs: '700mm × 1250mm × 2mm Usable Sheet' }
];

// Configurable Bill of Materials (BOM) Registry
export const BOM_REGISTRY = {
  'BOM-TRIANGLE-001': {
    bomCode: 'BOM-TRIANGLE-001',
    productCode: 'FG-TRI-100',
    productName: 'Triangle Structure (Solar Mount)',
    uom: 'Nos',
    ruleType: 'ASSEMBLY_MULTI_COMPONENT',
    components: [
      { itemCode: 'RM-ROD-LONG', itemName: 'Long Rod (1200mm Steel Bar)', qtyPerUnit: 2, uom: 'Nos' },
      { itemCode: 'RM-ROD-SHORT', itemName: 'Small Rod (600mm Steel Bar)', qtyPerUnit: 2, uom: 'Nos' },
      { itemCode: 'RM-FST-BLT5', itemName: 'M8×30 Hex Bolt (SS304)', qtyPerUnit: 5, uom: 'Nos' },
      { itemCode: 'RM-FST-NUT5', itemName: 'M8 Lock Nut (SS304)', qtyPerUnit: 5, uom: 'Nos' },
      { itemCode: 'RM-FST-WSH5', itemName: 'M8 Spring Washer', qtyPerUnit: 5, uom: 'Nos' }
    ]
  },
  'BOM-PLATE-002': {
    bomCode: 'BOM-PLATE-002',
    productCode: 'FG-MNT-500',
    productName: 'Mounting Plate 500×250mm',
    uom: 'Nos',
    ruleType: '2D_SHEET_CUTTING',
    components: [
      { itemCode: 'RM-SHT-GI250', itemName: 'GI Sheet 2500×1250×2mm', qtyPerUnit: 0.0555, uom: 'Sheet', notes: 'Yields 18 Plates per Sheet' }
    ]
  },
  'BOM-MINIRAIL-003': {
    bomCode: 'BOM-MINIRAIL-003',
    productCode: 'FG-RAIL-100',
    productName: 'Mini Rail 100 mm',
    uom: 'Nos',
    ruleType: '1D_PROFILE_CUTTING',
    components: [
      { itemCode: 'RM-ALU-COIL', itemName: 'Raw Aluminum Coil 1.5mm', qtyPerUnit: 0.22, uom: 'Kg' }
    ]
  }
};

class ProductionInventoryStore {
  constructor() {
    this.itemMaster = [...INITIAL_ITEM_MASTER];
    this.workOrders = [
      {
        id: 'WO-2026-101',
        productCode: 'FG-TRI-100',
        productName: 'Triangle Structure (Solar Mount)',
        plannedQty: 100,
        bomCode: 'BOM-TRIANGLE-001',
        status: 'Material Issued',
        createdAt: '2026-08-11',
        targetDelivery: '2026-08-25',
        issuedAt: '2026-08-11 14:00',
        plannedMaterials: [
          { itemCode: 'RM-ROD-LONG', itemName: 'Long Rod (1200mm Steel Bar)', plannedQty: 200, issuedQty: 200, uom: 'Nos' },
          { itemCode: 'RM-ROD-SHORT', itemName: 'Small Rod (600mm Steel Bar)', plannedQty: 200, issuedQty: 200, uom: 'Nos' },
          { itemCode: 'RM-FST-BLT5', itemName: 'M8×30 Hex Bolt (SS304)', plannedQty: 500, issuedQty: 500, uom: 'Nos' },
          { itemCode: 'RM-FST-NUT5', itemName: 'M8 Lock Nut (SS304)', plannedQty: 500, issuedQty: 500, uom: 'Nos' },
          { itemCode: 'RM-FST-WSH5', itemName: 'M8 Spring Washer', plannedQty: 500, issuedQty: 500, uom: 'Nos' }
        ],
        actualConsumption: [
          { itemCode: 'RM-ROD-LONG', itemName: 'Long Rod (1200mm Steel Bar)', plannedQty: 200, actualQty: 204, variance: 4, variancePct: 2.0, reason: '2 rods damaged during bending line operation', uom: 'Nos' },
          { itemCode: 'RM-ROD-SHORT', itemName: 'Small Rod (600mm Steel Bar)', plannedQty: 200, actualQty: 200, variance: 0, variancePct: 0.0, reason: 'Exact consumption', uom: 'Nos' },
          { itemCode: 'RM-FST-BLT5', itemName: 'M8×30 Hex Bolt (SS304)', plannedQty: 500, actualQty: 510, variance: 10, variancePct: 2.0, reason: 'Thread stripping during torque test', uom: 'Nos' },
          { itemCode: 'RM-FST-NUT5', itemName: 'M8 Lock Nut (SS304)', plannedQty: 500, actualQty: 505, variance: 5, variancePct: 1.0, reason: 'Floor drop loss', uom: 'Nos' },
          { itemCode: 'RM-FST-WSH5', itemName: 'M8 Spring Washer', plannedQty: 500, actualQty: 500, variance: 0, variancePct: 0.0, reason: 'Exact consumption', uom: 'Nos' }
        ],
        output: {
          producedQty: 98,
          acceptedQty: 98,
          rejectedQty: 2,
          scrapWeightKg: 8.5,
          reusableMaterialQty: 0
        }
      }
    ];

    // Transaction Audit Ledger
    this.ledger = [
      { id: 'TXN-901', timestamp: '2026-08-11 14:00', woRef: 'WO-2026-101', itemCode: 'RM-ROD-LONG', actionType: 'MATERIAL_ISSUE', qty: -200, uom: 'Nos', user: 'Senthil Kumar', dept: 'Shop Floor', stockBefore: 1200, stockAfter: 1000, notes: 'Issued for 100 Nos Triangle Structure' },
      { id: 'TXN-902', timestamp: '2026-08-11 14:00', woRef: 'WO-2026-101', itemCode: 'RM-ROD-SHORT', actionType: 'MATERIAL_ISSUE', qty: -200, uom: 'Nos', user: 'Senthil Kumar', dept: 'Shop Floor', stockBefore: 1050, stockAfter: 850, notes: 'Issued for 100 Nos Triangle Structure' },
      { id: 'TXN-903', timestamp: '2026-08-11 14:00', woRef: 'WO-2026-101', itemCode: 'RM-FST-BLT5', actionType: 'MATERIAL_ISSUE', qty: -500, uom: 'Nos', user: 'Senthil Kumar', dept: 'Shop Floor', stockBefore: 5500, stockAfter: 5000, notes: 'Issued for 100 Nos Triangle Structure' }
    ];
  }

  getItemMaster() {
    return this.itemMaster;
  }

  getWorkOrders() {
    return this.workOrders;
  }

  getLedger() {
    return this.ledger;
  }

  // Calculate material requirement & check available stock
  calculateRequirement(bomCode, orderQty) {
    const bom = BOM_REGISTRY[bomCode];
    if (!bom) return null;

    const requirements = bom.components.map(comp => {
      const plannedQty = comp.qtyPerUnit * orderQty;
      const item = this.itemMaster.find(i => i.code === comp.itemCode);
      const availableStock = item ? item.stock : 0;
      const shortageQty = Math.max(0, plannedQty - availableStock);
      const stockAfter = availableStock - plannedQty;

      return {
        itemCode: comp.itemCode,
        itemName: comp.itemName,
        unitReq: comp.qtyPerUnit,
        plannedQty,
        uom: comp.uom,
        availableStock,
        shortageQty,
        stockAfter,
        status: shortageQty > 0 ? 'SHORTAGE_WARNING' : 'SUFFICIENT'
      };
    });

    const hasShortage = requirements.some(r => r.shortageQty > 0);

    return {
      bomCode,
      productName: bom.productName,
      orderQty,
      hasShortage,
      requirements
    };
  }

  // Create new Work Order
  createWorkOrder(data) {
    const { productName, productCode, plannedQty, bomCode, targetDelivery } = data;
    const req = this.calculateRequirement(bomCode, plannedQty);

    const newWO = {
      id: `WO-2026-${100 + this.workOrders.length + 1}`,
      productCode: productCode || 'FG-TRI-100',
      productName: productName || req?.productName || 'Custom Manufactured Product',
      plannedQty: Number(plannedQty),
      bomCode,
      status: 'Material Requirement Calculated',
      createdAt: new Date().toISOString().split('T')[0],
      targetDelivery: targetDelivery || '2026-09-01',
      plannedMaterials: req ? req.requirements : [],
      actualConsumption: [],
      output: null
    };

    this.workOrders.unshift(newWO);
    return newWO;
  }

  // Execute Material Issue -> Deduct from Inventory & append to Ledger
  issueMaterial(workOrderId) {
    const wo = this.workOrders.find(w => w.id === workOrderId);
    if (!wo) return { success: false, message: 'Work Order not found' };

    let stockErrors = [];

    // Verify stock availability
    wo.plannedMaterials.forEach(m => {
      const item = this.itemMaster.find(i => i.code === m.itemCode);
      if (!item || item.stock < m.plannedQty) {
        stockErrors.push(`${m.itemName}: Required ${m.plannedQty} ${m.uom}, Available: ${item ? item.stock : 0}`);
      }
    });

    if (stockErrors.length > 0) {
      return { success: false, message: `Cannot issue material due to stock shortage:\n${stockErrors.join('\n')}` };
    }

    // Deduct stock & write transaction log
    wo.plannedMaterials.forEach(m => {
      const item = this.itemMaster.find(i => i.code === m.itemCode);
      const stockBefore = item.stock;
      item.stock -= m.plannedQty;
      m.issuedQty = m.plannedQty;

      this.ledger.unshift({
        id: `TXN-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        woRef: wo.id,
        itemCode: item.code,
        itemName: item.name,
        actionType: 'MATERIAL_ISSUE',
        qty: -m.plannedQty,
        uom: item.uom,
        user: 'Senthil Kumar',
        dept: 'Shop Floor',
        stockBefore,
        stockAfter: item.stock,
        notes: `Material issued for Work Order ${wo.id} (${wo.productName})`
      });
    });

    wo.status = 'Material Issued';
    wo.issuedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    return { success: true, workOrder: wo };
  }

  // Record Actual Material Consumption & Variance
  recordActualConsumption(workOrderId, actualList) {
    const wo = this.workOrders.find(w => w.id === workOrderId);
    if (!wo) return false;

    wo.actualConsumption = actualList.map(a => {
      const diff = a.actualQty - a.plannedQty;
      const diffPct = a.plannedQty > 0 ? (diff / a.plannedQty) * 100 : 0;
      return {
        itemCode: a.itemCode,
        itemName: a.itemName,
        plannedQty: a.plannedQty,
        actualQty: Number(a.actualQty),
        variance: Number(diff.toFixed(2)),
        variancePct: Number(diffPct.toFixed(1)),
        reason: a.reason || 'Recorded during shift execution',
        uom: a.uom
      };
    });

    wo.status = 'Production Completed';
    return true;
  }

  // Post Finished Goods Output, Scrap, and Reusable Material Returns to Inventory
  postProductionOutput(workOrderId, outputData) {
    const wo = this.workOrders.find(w => w.id === workOrderId);
    if (!wo) return false;

    const { acceptedQty, rejectedQty, scrapWeightKg, reusableMaterialQty, reusableItemCode } = outputData;

    wo.output = {
      producedQty: Number(acceptedQty) + Number(rejectedQty),
      acceptedQty: Number(acceptedQty),
      rejectedQty: Number(rejectedQty),
      scrapWeightKg: Number(scrapWeightKg || 0),
      reusableMaterialQty: Number(reusableMaterialQty || 0)
    };

    // 1. Increase Finished Goods stock
    const fgItem = this.itemMaster.find(i => i.code === wo.productCode);
    if (fgItem) {
      const stockBefore = fgItem.stock;
      fgItem.stock += Number(acceptedQty);
      this.ledger.unshift({
        id: `TXN-${Date.now()}-FG`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        woRef: wo.id,
        itemCode: fgItem.code,
        itemName: fgItem.name,
        actionType: 'FINISHED_GOODS_RECEIPT',
        qty: Number(acceptedQty),
        uom: fgItem.uom,
        user: 'Senthil Kumar',
        dept: 'QC & Store',
        stockBefore,
        stockAfter: fgItem.stock,
        notes: `Production completed & posted for WO ${wo.id}`
      });
    }

    // 2. Increase Scrap stock
    if (scrapWeightKg > 0) {
      const scrapItem = this.itemMaster.find(i => i.code === 'SCRAP-ALU') || this.itemMaster.find(i => i.category === 'Scrap');
      if (scrapItem) {
        const stockBefore = scrapItem.stock;
        scrapItem.stock += Number(scrapWeightKg);
        this.ledger.unshift({
          id: `TXN-${Date.now()}-SCRAP`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          woRef: wo.id,
          itemCode: scrapItem.code,
          itemName: scrapItem.name,
          actionType: 'SCRAP_POSTING',
          qty: Number(scrapWeightKg),
          uom: scrapItem.uom,
          user: 'Senthil Kumar',
          dept: 'Shop Floor',
          stockBefore,
          stockAfter: scrapItem.stock,
          notes: `Process scrap generated from WO ${wo.id}`
        });
      }
    }

    // 3. Return Reusable Material to Inventory
    if (reusableMaterialQty > 0) {
      const remItem = this.itemMaster.find(i => i.code === (reusableItemCode || 'REM-SHT-GI')) || this.itemMaster.find(i => i.category === 'Reusable Material');
      if (remItem) {
        const stockBefore = remItem.stock;
        remItem.stock += Number(reusableMaterialQty);
        this.ledger.unshift({
          id: `TXN-${Date.now()}-REM`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          woRef: wo.id,
          itemCode: remItem.code,
          itemName: remItem.name,
          actionType: 'REUSABLE_MATERIAL_RETURN',
          qty: Number(reusableMaterialQty),
          uom: remItem.uom,
          user: 'Senthil Kumar',
          dept: 'Shop Floor',
          stockBefore,
          stockAfter: remItem.stock,
          notes: `Usable remnant material returned to stock from WO ${wo.id}`
        });
      }
    }

    wo.status = 'Production Closed';
    return true;
  }
}

export const prodInventoryStore = new ProductionInventoryStore();
