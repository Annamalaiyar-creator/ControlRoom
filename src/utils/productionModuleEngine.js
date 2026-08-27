/**
 * ControlRoom Integrated Production & Inventory Engine
 * 
 * Features:
 * - Production BOM / Manufacturing Recipe System (1 Length -> 8 Mini Rail 100mm, etc.)
 * - 6-Stage Inventory State Engine (Physical, Reserved, Available, Issued, Consumed, Finished Goods)
 * - Whole Physical Stock Unit Constraint Guard (e.g. 100 pcs -> 13 Lengths physical)
 * - Work Order Lifecycle (DRAFT -> PENDING_MATERIAL -> RESERVED -> ISSUED -> ACCEPTED -> IN_PROGRESS -> VERIFICATION_PENDING -> APPROVED/CLOSED)
 * - Immutable Audit Ledger with Txn IDs
 * - Full Partial / Rejection Output & Additional Material Request handling
 */

import { fetchCloudStore, saveCloudStore, subscribeToCloudStore } from './supabaseDataSync';

// Initial Manufacturing Recipes (BOMs)
export const INITIAL_MANUFACTURING_RECIPES = [
  {
    id: 'RECIPE-MR100',
    productCode: 'MR100',
    productName: 'Mini Rail 100 mm Height',
    outputUnit: 'Pieces',
    expectedOutputQty: 24,
    rawMaterialCode: 'ALU-LEN-2414MM',
    rawMaterialName: 'Aluminium Length (2414 mm)',
    rawMaterialUnit: 'Raw Bars',
    inputQty: 1,
    notes: 'Mini Rail profile (100mm Height). User specifies custom Cut Length (mm) per order.'
  },
  {
    id: 'RECIPE-MR150',
    productCode: 'MR150',
    productName: 'Mini Rail 150 mm Height',
    outputUnit: 'Pieces',
    expectedOutputQty: 16,
    rawMaterialCode: 'ALU-LEN-2414MM',
    rawMaterialName: 'Aluminium Length (2414 mm)',
    rawMaterialUnit: 'Raw Bars',
    inputQty: 1,
    notes: 'Mini Rail profile (150mm Height). User specifies custom Cut Length (mm) per order.'
  },
  {
    id: 'RECIPE-LR2414',
    productCode: 'LR2414',
    productName: 'Long Rail 2414 mm',
    outputUnit: 'Pieces',
    expectedOutputQty: 1,
    rawMaterialCode: 'ALU-LEN-2414MM',
    rawMaterialName: 'Aluminium Length (2414 mm)',
    rawMaterialUnit: 'Raw Bars',
    inputQty: 1,
    notes: 'Standard 1 Aluminium Length (2414mm) yields 1 Full Long Rail 2414mm piece.'
  },
  {
    id: 'RECIPE-MC35',
    productCode: 'MC35',
    productName: 'Mid Clamp 35 mm',
    outputUnit: 'Pieces',
    expectedOutputQty: 40,
    rawMaterialCode: 'ALU-COIL-1.5',
    rawMaterialName: 'Aluminium Strip Coil 1.5mm',
    rawMaterialUnit: 'Kg',
    inputQty: 1,
    notes: '1 Kg Aluminium Coil produces 40 Mid Clamp pieces.'
  },
  {
    id: 'RECIPE-EC35',
    productCode: 'EC35',
    productName: 'End Clamp 35 mm',
    outputUnit: 'Pieces',
    expectedOutputQty: 40,
    rawMaterialCode: 'ALU-COIL-1.5',
    rawMaterialName: 'Aluminium Strip Coil 1.5mm',
    rawMaterialUnit: 'Kg',
    inputQty: 1,
    notes: '1 Kg Aluminium Coil produces 40 End Clamp pieces.'
  }
];

// Initial Multi-Stage Inventory Stock
export const INITIAL_INVENTORY_ITEMS = [
  {
    code: 'ALU-LEN-2414MM',
    name: 'Aluminium Length (2414 mm)',
    category: 'Raw Material',
    unit: 'Raw Bars',
    isWholeUnitOnly: true,
    physicalStock: 100,
    reservedStock: 0,
    availableStock: 100,
    issuedStock: 0,
    consumedStock: 0,
    safetyStock: 15,
    unitRate: 580,
    bayLocation: 'Bay #1 - Extrusion Yard'
  },
  {
    code: 'ALU-COIL-1.5',
    name: 'Aluminium Strip Coil 1.5mm',
    category: 'Raw Material',
    unit: 'Kg',
    isWholeUnitOnly: false,
    physicalStock: 500,
    reservedStock: 0,
    availableStock: 500,
    issuedStock: 0,
    consumedStock: 0,
    safetyStock: 50,
    unitRate: 260,
    bayLocation: 'Bay #2 - Coil Storage'
  },
  {
    code: 'MR100',
    name: 'Mini Rail 100 mm',
    category: 'Finished Goods',
    unit: 'Pieces',
    physicalStock: 50,
    reservedStock: 0,
    availableStock: 50,
    issuedStock: 0,
    consumedStock: 0,
    safetyStock: 100,
    unitRate: 120,
    bayLocation: 'Bay #4 - FG Store'
  },
  {
    code: 'MR150',
    name: 'Mini Rail 150 mm',
    category: 'Finished Goods',
    unit: 'Pieces',
    physicalStock: 30,
    reservedStock: 0,
    availableStock: 30,
    issuedStock: 0,
    consumedStock: 0,
    safetyStock: 50,
    unitRate: 160,
    bayLocation: 'Bay #4 - FG Store'
  },
  {
    code: 'LR3000',
    name: 'Long Rail 3000 mm',
    category: 'Finished Goods',
    unit: 'Pieces',
    physicalStock: 15,
    reservedStock: 0,
    availableStock: 15,
    issuedStock: 0,
    consumedStock: 0,
    safetyStock: 20,
    unitRate: 1100,
    bayLocation: 'Bay #4 - FG Store'
  }
];

// Seed Work Orders
export const INITIAL_WORK_ORDERS = [
  {
    id: 'WO-2026-00125',
    date: new Date().toISOString().split('T')[0],
    productionHead: 'Senthil Kumar (Production Head)',
    finishedProductCode: 'MR100',
    finishedProductName: 'Mini Rail 100 mm',
    targetQty: 8,
    unit: 'Pieces',
    recipeId: 'RECIPE-MR100',
    recipeRatio: '1 Aluminium Length → 24 Pieces',
    rawMaterialCode: 'ALU-LEN-2414MM',
    rawMaterialName: 'Aluminium Length (2414 mm)',
    rawMaterialRequiredQty: 0.33, // Exact calculated
    rawMaterialPhysicalToIssue: 1, // Physical whole unit required
    rawMaterialUnit: 'Length',
    expectedOutputQty: 24,
    excessTheoreticalQty: 16,
    priority: 'High',
    productionLocation: 'CNC Line 01',
    assignedEmployee: 'Floor Employee A (Karthik)',
    expectedStartDate: new Date().toISOString().split('T')[0],
    expectedCompletionDate: new Date().toISOString().split('T')[0],
    instructions: 'Cut 1 Aluminium Length (2414 mm) into 24 exact 100mm mini rail pieces. Check burr edges.',
    remarks: 'Urgent order for Vikram Solar site.',
    status: 'DRAFT', // DRAFT -> PENDING_MATERIAL -> RESERVED -> ISSUED -> ACCEPTED -> IN_PROGRESS -> VERIFICATION_PENDING -> APPROVED/CLOSED
    
    // Execution state
    reservedAt: null,
    issuedAt: null,
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    verifiedAt: null,

    actualGoodOutput: 0,
    actualRejectedOutput: 0,
    actualWastageOutput: 0,
    operatorRemarks: '',
    completionImages: [],

    progressHistory: [],
    materialIssueHistory: [],
    additionalMaterialRequests: [],
    reworkHistory: []
  }
];

class ProductionModuleEngine {
  constructor() {
    this.recipes = [...INITIAL_MANUFACTURING_RECIPES];
    this.inventory = [...INITIAL_INVENTORY_ITEMS];
    this.workOrders = [...INITIAL_WORK_ORDERS];
    this.ledger = [
      {
        id: 'TXN-2026-00001',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: 'INITIAL_STOCK',
        woId: null,
        itemCode: 'ALU-LEN-2414MM',
        itemName: 'Aluminium Length (2414 mm)',
        qty: 100,
        unit: 'Length',
        previousStock: 0,
        newStock: 100,
        user: 'System Admin',
        employee: null,
        reason: 'Initial stock intake setup',
        referenceDoc: 'INIT-SET'
      },
      {
        id: 'TXN-2026-00002',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: 'INITIAL_STOCK',
        woId: null,
        itemCode: 'MR100',
        itemName: 'Mini Rail 100 mm',
        qty: 50,
        unit: 'Pieces',
        previousStock: 0,
        newStock: 50,
        user: 'System Admin',
        employee: null,
        reason: 'Initial stock intake setup',
        referenceDoc: 'INIT-SET'
      }
    ];

    this.subscribers = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const savedRecipes = localStorage.getItem('vrm_prod_recipes');
      const savedInventory = localStorage.getItem('vrm_prod_inventory');
      const savedWOs = localStorage.getItem('vrm_prod_workorders');
      const savedLedger = localStorage.getItem('vrm_prod_ledger');

      if (savedRecipes) this.recipes = JSON.parse(savedRecipes);
      if (savedInventory) this.inventory = JSON.parse(savedInventory);
      if (savedWOs) this.workOrders = JSON.parse(savedWOs);
      if (savedLedger) this.ledger = JSON.parse(savedLedger);
    } catch (e) {
      console.error('Failed loading VRM Production Engine storage:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('vrm_prod_recipes', JSON.stringify(this.recipes));
      localStorage.setItem('vrm_prod_inventory', JSON.stringify(this.inventory));
      localStorage.setItem('vrm_prod_workorders', JSON.stringify(this.workOrders));
      localStorage.setItem('vrm_prod_ledger', JSON.stringify(this.ledger));

      saveCloudStore('vrm_prod_recipes', this.recipes);
      saveCloudStore('vrm_prod_inventory', this.inventory);
      saveCloudStore('vrm_prod_workorders', this.workOrders);
      saveCloudStore('vrm_prod_ledger', this.ledger);

      this.notifySubscribers();
    } catch (e) {
      console.error('Failed saving VRM Production Engine storage:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => cb());
  }

  // Calculate Raw Material Requirement from Manufacturing Recipe & Custom Cut Length (mm)
  calculateMaterialRequirement(productCode, targetQty, customCutLengthMm = null) {
    const recipe = this.recipes.find(r => r.productCode === productCode);
    const rawItem = this.inventory.find(i => (recipe && i.code === recipe.rawMaterialCode) || i.code === 'ALU-LEN-2414MM');

    // Parse cut length entered by user (e.g., "100", "100 mm", "500")
    let cutLenMm = 0;
    if (customCutLengthMm) {
      const parsed = parseFloat(String(customCutLengthMm).replace(/[^\d.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) cutLenMm = parsed;
    }

    // Standard raw material length is 2414 mm
    const rawLengthMm = 2414;
    const bladeKerfMm = 3; // 3mm mandatory saw blade kerf width per cut stroke

    // Calculate how many pieces fit in 1 length of 2414 mm (accounting for 3mm kerf per cut)
    let piecesPerLength = recipe ? Number(recipe.expectedOutputQty) : 1;
    if (cutLenMm > 0) {
      const effectiveCutLen = cutLenMm + bladeKerfMm;
      piecesPerLength = Math.floor(rawLengthMm / effectiveCutLen);
      if (piecesPerLength < 1) piecesPerLength = 1;
    }

    // Exact theoretical raw material length required
    const exactRequiredMatQty = Number(targetQty) / piecesPerLength;
    
    // Physical Whole Unit constraint rule (Must issue whole 2414 mm lengths)
    let physicalMatToIssue = Math.ceil(exactRequiredMatQty);
    let isWholeUnitConstraint = physicalMatToIssue > exactRequiredMatQty;
    let expectedTheoreticalOutput = physicalMatToIssue * piecesPerLength;

    // Wastage & Scrap Calculations (Product Length + Blade Kerf Loss)
    const netProductMmPerBar = piecesPerLength * cutLenMm;
    const kerfLossMmPerBar = piecesPerLength * bladeKerfMm;
    const usedLengthMmPerBar = netProductMmPerBar + kerfLossMmPerBar;
    const endOffcutScrapMmPerBar = Math.max(0, rawLengthMm - usedLengthMmPerBar);

    const totalIssuedMm = physicalMatToIssue * rawLengthMm;
    const totalNetProductMm = (Number(targetQty) || 0) * cutLenMm;
    const totalKerfLossMm = (Number(targetQty) || 0) * bladeKerfMm;
    const totalUtilizedMmForTarget = totalNetProductMm + totalKerfLossMm;
    const totalWastageMm = totalIssuedMm > 0 ? Math.max(0, totalIssuedMm - totalNetProductMm) : 0;
    const wastagePercent = totalIssuedMm > 0 ? Number(((totalWastageMm / totalIssuedMm) * 100).toFixed(2)) : 0;

    // Remainder Offcut Bar from Last Issued Unit
    const piecesInLastBar = (Number(targetQty) || 0) % piecesPerLength;
    const usedMmInLastBar = piecesInLastBar > 0 ? (piecesInLastBar * (cutLenMm + bladeKerfMm)) : 0;
    const remainderOffcutMm = piecesInLastBar > 0 ? Math.max(0, rawLengthMm - usedMmInLastBar) : 0;
    const remainderOffcutMeters = Number((remainderOffcutMm / 1000).toFixed(2));

    const availableStock = rawItem ? rawItem.availableStock : 0;
    const isSufficient = availableStock >= physicalMatToIssue;
    const shortageQty = isSufficient ? 0 : (physicalMatToIssue - availableStock);

    return {
      recipe: recipe || {
        rawMaterialName: 'Aluminium Length (2414 mm)',
        rawMaterialUnit: 'Raw Bars',
        expectedOutputQty: piecesPerLength
      },
      rawItem,
      cutLenMm,
      bladeKerfMm,
      netProductMmPerBar,
      kerfLossMmPerBar,
      totalKerfLossMm,
      targetQty: Number(targetQty) || 0,
      piecesPerLength,
      exactRequiredMatQty,
      physicalMatToIssue,
      isWholeUnitConstraint,
      expectedTheoreticalOutput,
      excessOutputPossible: expectedTheoreticalOutput - (Number(targetQty) || 0),
      endOffcutScrapMmPerBar,
      totalIssuedMm,
      totalUtilizedMmForTarget,
      totalWastageMm,
      totalWastageMeters: Number((totalWastageMm / 1000).toFixed(2)),
      wastagePercent,
      remainderOffcutMm,
      remainderOffcutMeters,
      availableStock,
      isSufficient,
      shortageQty
    };
  }

  // Create Work Order (Production Head)
  createWorkOrder(data) {
    const calc = this.calculateMaterialRequirement(data.finishedProductCode, data.targetQty);
    if (calc.error) {
      throw new Error(calc.error);
    }

    const woId = data.id || `WO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newWO = {
      id: woId,
      date: data.date || new Date().toISOString().split('T')[0],
      productionHead: data.productionHead || 'Senthil Kumar (Production Head)',
      finishedProductCode: data.finishedProductCode,
      finishedProductName: calc.recipe.productName,
      targetQty: Number(data.targetQty),
      unit: calc.recipe.outputUnit,
      recipeId: calc.recipe.id,
      recipeRatio: `1 ${calc.recipe.rawMaterialName} → ${calc.recipe.expectedOutputQty} ${calc.recipe.outputUnit}`,
      rawMaterialCode: calc.recipe.rawMaterialCode,
      rawMaterialName: calc.recipe.rawMaterialName,
      rawMaterialRequiredQty: calc.exactRequiredMatQty,
      rawMaterialPhysicalToIssue: calc.physicalMatToIssue,
      rawMaterialUnit: calc.recipe.rawMaterialUnit,
      expectedOutputQty: calc.expectedTheoreticalOutput,
      excessTheoreticalQty: calc.excessOutputPossible,
      priority: data.priority || 'Normal',
      productionLocation: data.productionLocation || 'CNC Line 01',
      assignedEmployee: data.assignedEmployee || 'Floor Employee A (Karthik)',
      expectedStartDate: data.expectedStartDate || new Date().toISOString().split('T')[0],
      expectedCompletionDate: data.expectedCompletionDate || new Date().toISOString().split('T')[0],
      instructions: data.instructions || `Produce ${data.targetQty} ${calc.recipe.outputUnit} of ${calc.recipe.productName}`,
      remarks: data.remarks || '',
      status: calc.isSufficient ? 'PENDING_MATERIAL' : 'PENDING_MATERIAL',
      
      reservedAt: null,
      issuedAt: null,
      acceptedAt: null,
      startedAt: null,
      completedAt: null,
      verifiedAt: null,

      actualGoodOutput: 0,
      actualRejectedOutput: 0,
      actualWastageOutput: 0,
      operatorRemarks: '',
      completionImages: [],

      progressHistory: [],
      materialIssueHistory: [],
      additionalMaterialRequests: [],
      reworkHistory: []
    };

    this.workOrders.unshift(newWO);
    this.saveToStorage();
    return newWO;
  }

  // 1. Material Reservation
  reserveMaterial(woId) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    const item = this.inventory.find(i => i.code === wo.rawMaterialCode);
    if (!item) throw new Error('Raw material item not found in inventory');

    if (item.availableStock < wo.rawMaterialPhysicalToIssue) {
      throw new Error(`Insufficient stock to reserve. Required: ${wo.rawMaterialPhysicalToIssue} ${wo.rawMaterialUnit}, Available: ${item.availableStock}`);
    }

    item.reservedStock += wo.rawMaterialPhysicalToIssue;
    item.availableStock = item.physicalStock - item.reservedStock;

    wo.status = 'MATERIAL_RESERVED';
    wo.reservedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Ledger entry for reservation
    this.addLedgerEntry({
      type: 'MATERIAL_RESERVATION',
      woId: wo.id,
      itemCode: item.code,
      itemName: item.name,
      qty: wo.rawMaterialPhysicalToIssue,
      unit: item.unit,
      previousStock: item.physicalStock,
      newStock: item.physicalStock,
      user: wo.productionHead,
      employee: wo.assignedEmployee,
      reason: `Reserved raw material for Work Order ${wo.id}`,
      referenceDoc: wo.id
    });

    this.saveToStorage();
    return wo;
  }

  // 2. Material Issue (Production Head physically hands over material)
  issueMaterial(woId) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    if (wo.status !== 'MATERIAL_RESERVED' && wo.status !== 'PENDING_MATERIAL') {
      // Auto reserve if not reserved yet
      this.reserveMaterial(woId);
    }

    const item = this.inventory.find(i => i.code === wo.rawMaterialCode);
    if (!item) throw new Error('Raw material item not found');

    // Move from reserved to issued
    item.reservedStock = Math.max(0, item.reservedStock - wo.rawMaterialPhysicalToIssue);
    item.issuedStock += wo.rawMaterialPhysicalToIssue;
    item.availableStock = item.physicalStock - item.reservedStock;

    wo.status = 'MATERIAL_ISSUED';
    wo.issuedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    wo.materialIssueHistory.push({
      timestamp: wo.issuedAt,
      qty: wo.rawMaterialPhysicalToIssue,
      unit: wo.rawMaterialUnit,
      issuedTo: wo.assignedEmployee,
      type: 'INITIAL_ISSUE'
    });

    // Ledger entry
    this.addLedgerEntry({
      type: 'MATERIAL_ISSUE',
      woId: wo.id,
      itemCode: item.code,
      itemName: item.name,
      qty: wo.rawMaterialPhysicalToIssue,
      unit: item.unit,
      previousStock: item.physicalStock,
      newStock: item.physicalStock,
      user: wo.productionHead,
      employee: wo.assignedEmployee,
      reason: `Issued ${wo.rawMaterialPhysicalToIssue} ${item.unit} to Floor Employee ${wo.assignedEmployee}`,
      referenceDoc: wo.id
    });

    this.saveToStorage();
    return wo;
  }

  // 3. Accept Work Order (Floor Employee)
  acceptWorkOrder(woId, employeeName) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    wo.status = 'ACCEPTED';
    wo.acceptedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (employeeName) wo.assignedEmployee = employeeName;

    this.saveToStorage();
    return wo;
  }

  // 4. Start Work (Floor Employee)
  startWork(woId) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    wo.status = 'IN_PROGRESS';
    wo.startedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    wo.progressHistory.push({
      timestamp: wo.startedAt,
      action: 'STARTED_WORK',
      completedQty: 0,
      rejectedQty: 0,
      remarks: 'Work started by operator'
    });

    this.saveToStorage();
    return wo;
  }

  // 5. Update Production Progress (Floor Employee)
  updateProgress(woId, completedQty, rejectedQty, wastageQty, remarks) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    wo.actualGoodOutput = Number(completedQty);
    wo.actualRejectedOutput = Number(rejectedQty || 0);
    wo.actualWastageOutput = Number(wastageQty || 0);

    wo.progressHistory.push({
      timestamp,
      action: 'PROGRESS_UPDATE',
      completedQty: Number(completedQty),
      rejectedQty: Number(rejectedQty || 0),
      wastageQty: Number(wastageQty || 0),
      remarks: remarks || 'Progress update'
    });

    this.saveToStorage();
    return wo;
  }

  // 6. Request Additional Material (Floor Employee)
  requestAdditionalMaterial(woId, additionalQty, reason) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    const reqObj = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      requestedQty: Number(additionalQty),
      unit: wo.rawMaterialUnit,
      reason: reason || 'Additional material needed for production',
      status: 'PENDING_APPROVAL'
    };

    wo.additionalMaterialRequests.push(reqObj);
    this.saveToStorage();
    return wo;
  }

  // Approve Additional Material Request (Production Head)
  approveAdditionalMaterialRequest(woId, requestId) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    const req = wo.additionalMaterialRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const item = this.inventory.find(i => i.code === wo.rawMaterialCode);
    if (!item) throw new Error('Raw material item not found');

    if (item.availableStock < req.requestedQty) {
      throw new Error(`Insufficient available stock for additional issue. Stock: ${item.availableStock}`);
    }

    // Update inventory
    item.issuedStock += req.requestedQty;
    item.availableStock = item.physicalStock - item.reservedStock;
    wo.rawMaterialPhysicalToIssue += req.requestedQty;

    req.status = 'APPROVED';
    req.approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    wo.materialIssueHistory.push({
      timestamp: req.approvedAt,
      qty: req.requestedQty,
      unit: req.unit,
      issuedTo: wo.assignedEmployee,
      type: 'ADDITIONAL_ISSUE'
    });

    // Ledger
    this.addLedgerEntry({
      type: 'ADDITIONAL_MATERIAL_ISSUE',
      woId: wo.id,
      itemCode: item.code,
      itemName: item.name,
      qty: req.requestedQty,
      unit: item.unit,
      previousStock: item.physicalStock,
      newStock: item.physicalStock,
      user: wo.productionHead,
      employee: wo.assignedEmployee,
      reason: `Approved additional material request (${req.reason})`,
      referenceDoc: req.id
    });

    this.saveToStorage();
    return wo;
  }

  // 7. Submit Work Order Completion (Floor Employee)
  submitCompletion(woId, completionData) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    wo.status = 'COMPLETED_PENDING_VERIFICATION';
    wo.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    wo.actualGoodOutput = Number(completionData.goodQty);
    wo.actualRejectedOutput = Number(completionData.rejectedQty || 0);
    wo.actualWastageOutput = Number(completionData.wastageQty || 0);
    wo.operatorRemarks = completionData.remarks || '';
    if (completionData.images) wo.completionImages = completionData.images;

    wo.progressHistory.push({
      timestamp: wo.completedAt,
      action: 'SUBMITTED_COMPLETION',
      completedQty: wo.actualGoodOutput,
      rejectedQty: wo.actualRejectedOutput,
      wastageQty: wo.actualWastageOutput,
      remarks: wo.operatorRemarks
    });

    this.saveToStorage();
    return wo;
  }

  // 8. Production Head Approval & Inventory Conversion
  approveProduction(woId) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    if (wo.status !== 'COMPLETED_PENDING_VERIFICATION') {
      throw new Error(`Work Order must be in verification status. Current status: ${wo.status}`);
    }

    const rawItem = this.inventory.find(i => i.code === wo.rawMaterialCode);
    const fgItem = this.inventory.find(i => i.code === wo.finishedProductCode);

    if (!rawItem) throw new Error('Raw material item not found');

    // 1. Raw Material Physical Consumption
    const consumedMatQty = wo.rawMaterialPhysicalToIssue;
    const rawPrevStock = rawItem.physicalStock;
    rawItem.physicalStock -= consumedMatQty;
    rawItem.issuedStock = Math.max(0, rawItem.issuedStock - consumedMatQty);
    rawItem.consumedStock += consumedMatQty;
    rawItem.availableStock = rawItem.physicalStock - rawItem.reservedStock;

    // Create Raw Material Consumption Ledger
    const rawTxnId = this.addLedgerEntry({
      type: 'PRODUCTION_CONSUMPTION',
      woId: wo.id,
      itemCode: rawItem.code,
      itemName: rawItem.name,
      qty: -consumedMatQty,
      unit: rawItem.unit,
      previousStock: rawPrevStock,
      newStock: rawItem.physicalStock,
      user: wo.productionHead,
      employee: wo.assignedEmployee,
      reason: `Consumed in Work Order ${wo.id} for ${wo.actualGoodOutput} ${wo.unit} ${wo.finishedProductName}`,
      referenceDoc: wo.id
    });

    // 2. Finished Goods Stock Addition (Only Good Output)
    let fgPrevStock = 0;
    if (fgItem) {
      fgPrevStock = fgItem.physicalStock;
      fgItem.physicalStock += wo.actualGoodOutput;
      fgItem.availableStock = fgItem.physicalStock - fgItem.reservedStock;
    } else {
      // Create FG item dynamically if not existing
      this.inventory.push({
        code: wo.finishedProductCode,
        name: wo.finishedProductName,
        category: 'Finished Goods',
        unit: wo.unit,
        physicalStock: wo.actualGoodOutput,
        reservedStock: 0,
        availableStock: wo.actualGoodOutput,
        issuedStock: 0,
        consumedStock: 0,
        safetyStock: 20,
        unitRate: 150,
        bayLocation: 'Bay #4 - FG Store'
      });
    }

    // Create FG Receipt Ledger
    const fgTxnId = this.addLedgerEntry({
      type: 'PRODUCTION_RECEIPT',
      woId: wo.id,
      itemCode: wo.finishedProductCode,
      itemName: wo.finishedProductName,
      qty: +wo.actualGoodOutput,
      unit: wo.unit,
      previousStock: fgPrevStock,
      newStock: fgPrevStock + wo.actualGoodOutput,
      user: wo.productionHead,
      employee: wo.assignedEmployee,
      reason: `Production receipt approved from Work Order ${wo.id}`,
      referenceDoc: wo.id
    });

    wo.status = 'APPROVED_CLOSED';
    wo.verifiedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    this.saveToStorage();
    return { wo, rawTxnId, fgTxnId };
  }

  // 9. Send for Rework (Production Head)
  sendForRework(woId, reworkReason) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    wo.status = 'REWORK_REQUIRED';
    wo.reworkHistory.push({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      reason: reworkReason || 'Dimensions / Quality check failed',
      productionHead: wo.productionHead
    });

    this.saveToStorage();
    return wo;
  }

  // 10. Cancel Work Order (Production Head)
  cancelWorkOrder(woId, cancelReason) {
    const wo = this.workOrders.find(w => w.id === woId);
    if (!wo) throw new Error('Work Order not found');

    const item = this.inventory.find(i => i.code === wo.rawMaterialCode);

    if (wo.status === 'MATERIAL_RESERVED' && item) {
      // Release reservation
      item.reservedStock = Math.max(0, item.reservedStock - wo.rawMaterialPhysicalToIssue);
      item.availableStock = item.physicalStock - item.reservedStock;

      this.addLedgerEntry({
        type: 'RESERVATION_RELEASE',
        woId: wo.id,
        itemCode: item.code,
        itemName: item.name,
        qty: wo.rawMaterialPhysicalToIssue,
        unit: item.unit,
        previousStock: item.physicalStock,
        newStock: item.physicalStock,
        user: wo.productionHead,
        employee: wo.assignedEmployee,
        reason: `Released reservation due to WO cancellation (${cancelReason})`,
        referenceDoc: wo.id
      });
    } else if (wo.status === 'MATERIAL_ISSUED' && item) {
      // Return issued stock back to available
      item.issuedStock = Math.max(0, item.issuedStock - wo.rawMaterialPhysicalToIssue);
      item.availableStock = item.physicalStock - item.reservedStock;

      this.addLedgerEntry({
        type: 'MATERIAL_RETURN',
        woId: wo.id,
        itemCode: item.code,
        itemName: item.name,
        qty: wo.rawMaterialPhysicalToIssue,
        unit: item.unit,
        previousStock: item.physicalStock,
        newStock: item.physicalStock,
        user: wo.productionHead,
        employee: wo.assignedEmployee,
        reason: `Controlled return of issued raw material (${cancelReason})`,
        referenceDoc: wo.id
      });
    }

    wo.status = 'CANCELLED';
    wo.remarks = `Cancelled: ${cancelReason}`;

    this.saveToStorage();
    return wo;
  }

  // Ledger Manager
  addLedgerEntry(entry) {
    const txnId = `TXN-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const fullEntry = {
      id: txnId,
      timestamp: entry.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: entry.type,
      woId: entry.woId,
      itemCode: entry.itemCode,
      itemName: entry.itemName,
      qty: entry.qty,
      unit: entry.unit,
      previousStock: entry.previousStock,
      newStock: entry.newStock,
      user: entry.user || 'Production Head',
      employee: entry.employee || 'Floor Employee',
      reason: entry.reason || '',
      referenceDoc: entry.referenceDoc || ''
    };

    this.ledger.unshift(fullEntry);
    return txnId;
  }

  // Getters
  getRecipes() {
    return this.recipes;
  }

  getInventory() {
    return this.inventory;
  }

  getWorkOrders() {
    return this.workOrders;
  }

  getWorkOrderById(woId) {
    return this.workOrders.find(w => w.id === woId) || null;
  }

  getLedger() {
    return this.ledger;
  }
}

export const prodModuleEngine = new ProductionModuleEngine();
