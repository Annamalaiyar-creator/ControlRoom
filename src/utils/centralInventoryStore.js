import { VRM_PRODUCTS } from './vrmProductsData';

// Initial Seed Item Master derived strictly from official VRM catalog
export const INITIAL_CENTRAL_ITEMS = VRM_PRODUCTS.map((p, idx) => ({
  code: p.code,
  name: p.name,
  cat: p.material === 'HDG' || p.material === 'GAL' ? 'Structure Assemblies' : 'Aluminium Profiles',
  type: 'Finished Product',
  uom: p.uom || 'Nos',
  minLevel: 20,
  reorderLevel: 50,
  maxLevel: 1000,
  location: p.material === 'HDG' ? 'Finished Goods Bay - HDG' : p.material === 'GAL' ? 'Finished Goods Bay - GAL' : 'Finished Goods Bay - Aluminium',
  unitRate: 1200 + (idx * 50) % 2500,
  openingStock: 250 + (idx * 15) % 800
}));

// Transaction Types
export const TX_TYPES = {
  PURCHASE_RECEIPT: 'PURCHASE_RECEIPT',
  JOB_WORK_CONSUMPTION: 'JOB_WORK_CONSUMPTION',
  JOB_WORK_OUTPUT: 'JOB_WORK_OUTPUT',
  PRODUCTION_ISSUE: 'PRODUCTION_ISSUE',
  PRODUCTION_RETURN: 'PRODUCTION_RETURN',
  FINISHED_GOODS_RECEIPT: 'FINISHED_GOODS_RECEIPT',
  SALES_DISPATCH: 'SALES_DISPATCH',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
  SCRAP: 'SCRAP'
};

class CentralInventoryStore {
  constructor() {
    this.storageKeyItems = 'controlroom_central_items_v2';
    this.storageKeyTx = 'controlroom_central_transactions_v2';
    this.storageKeyGrn = 'controlroom_central_grns_v2';
    this.storageKeyJobWork = 'controlroom_central_jobworks_v2';
    this.storageKeyProdOrders = 'controlroom_central_prod_orders_v2';
    this.storageKeyReservations = 'controlroom_central_reservations_v2';
    this.storageKeyNotifications = 'controlroom_central_notifications_v2';

    this.initStore();
  }

  initStore() {
    // 1. Load Item Master
    const savedItems = localStorage.getItem(this.storageKeyItems);
    if (savedItems) {
      try {
        this.items = JSON.parse(savedItems);
      } catch (e) {
        this.items = [...INITIAL_CENTRAL_ITEMS];
      }
    } else {
      this.items = [...INITIAL_CENTRAL_ITEMS];
      this.saveItems();
    }

    // 2. Load Transactions Ledger
    const savedTx = localStorage.getItem(this.storageKeyTx);
    if (savedTx) {
      try {
        this.transactions = JSON.parse(savedTx);
      } catch (e) {
        this.transactions = [];
      }
    } else {
      // Seed initial opening stock transactions
      this.transactions = INITIAL_CENTRAL_ITEMS.map(item => ({
        id: `TX-INIT-${item.code}`,
        type: 'OPENING_STOCK',
        refNo: 'INIT-BAL-2026',
        dateTime: new Date().toISOString(),
        itemCode: item.code,
        itemName: item.name,
        qty: item.openingStock || 0,
        unit: item.uom,
        direction: 'IN',
        warehouse: item.location || 'Main Store',
        user: 'System Init',
        department: 'Store & Logistics',
        sourceDoc: 'Opening Stock Balance',
        remarks: 'Initial store ledger baseline'
      }));
      this.saveTransactions();
    }

    // 3. Load GRNs
    const savedGrn = localStorage.getItem(this.storageKeyGrn);
    if (savedGrn) {
      try {
        this.grnList = JSON.parse(savedGrn);
      } catch (e) {
        this.grnList = [];
      }
    } else {
      this.grnList = [
        {
          grnNo: 'GRN-00124',
          supplier: 'Hindalco Extrusions Ltd',
          poNo: 'PO-2026-088',
          grnDate: '2026-08-20',
          invNo: 'INV-HIND-991',
          invDate: '2026-08-19',
          warehouse: 'Main Raw Material Warehouse - Rack A1',
          materialCode: 'RM-ALU-6000',
          materialName: 'Aluminium Profile 6000mm Length',
          orderedQty: 100,
          receivedQty: 100,
          unit: 'Lengths',
          batchNo: 'BATCH-ALU-2026-08',
          status: 'Posted to Inventory',
          receivedBy: 'Rajesh Kumar (Store In-Charge)',
          remarks: 'Inspected and verified 100 lengths in good condition'
        }
      ];
      this.saveGrns();
    }

    // 4. Load Job Works
    const savedJw = localStorage.getItem(this.storageKeyJobWork);
    if (savedJw) {
      try {
        this.jobWorks = JSON.parse(savedJw);
      } catch (e) {
        this.jobWorks = [];
      }
    } else {
      this.jobWorks = [
        {
          jobWorkNo: 'JW-00124',
          prodOrderNo: 'PROD-2026-101',
          bomRef: 'BOM-SOLAR-001',
          inputMaterialCode: 'RM-ALU-6000',
          inputMaterialName: 'Aluminium Profile 6000mm Length',
          inputQty: 1,
          inputUnit: 'Length',
          outputMaterialCode: 'PM-ALU-300',
          outputMaterialName: 'Aluminium 300mm Cut Piece',
          expectedOutputQty: 8,
          actualOutputQty: 8,
          outputUnit: 'Pieces',
          employee: 'Suresh Kumar (Operator)',
          workstation: 'Cut-off Saw Station #2',
          machine: 'CNC Precision Saw M-04',
          assignedDate: '2026-08-21',
          dueDate: '2026-08-22',
          priority: 'High',
          status: 'Completed',
          instructions: 'Cut 6000mm length cleanly into 8 equal 300mm cut pieces'
        }
      ];
      this.saveJobWorks();
    }

    // 5. Load Production Orders
    const savedProd = localStorage.getItem(this.storageKeyProdOrders);
    if (savedProd) {
      try {
        this.productionOrders = JSON.parse(savedProd);
      } catch (e) {
        this.productionOrders = [];
      }
    } else {
      this.productionOrders = [
        {
          prodOrderNo: 'PROD-2026-101',
          bomCode: 'BOM-SOLAR-001',
          customerName: 'Tata Power Solar Systems',
          productCode: 'FG-SOLAR-STR',
          productName: 'Solar Structure Array Module',
          requiredQty: 10,
          producedQty: 0,
          status: 'In Production',
          createdAt: '2026-08-21',
          requiredMaterials: [
            { code: 'PM-ALU-300', name: 'Aluminium 300mm Cut Piece', reqQty: 80, issuedQty: 0, unit: 'Pieces' },
            { code: 'CON-BLT-M8', name: 'M8×30 Hex Bolt (SS304)', reqQty: 160, issuedQty: 0, unit: 'Nos' }
          ]
        }
      ];
      this.saveProdOrders();
    }

    // 6. Load Reservations
    const savedRes = localStorage.getItem(this.storageKeyReservations);
    if (savedRes) {
      try {
        this.reservations = JSON.parse(savedRes);
      } catch (e) {
        this.reservations = [];
      }
    } else {
      this.reservations = [
        {
          id: 'RES-001',
          refNo: 'BOM-SOLAR-001',
          itemCode: 'RM-ALU-6000',
          reservedQty: 20,
          date: '2026-08-21',
          status: 'Active'
        }
      ];
      this.saveReservations();
    }

    // 7. Load Notifications
    const savedNotif = localStorage.getItem(this.storageKeyNotifications);
    if (savedNotif) {
      try {
        this.notifications = JSON.parse(savedNotif);
      } catch (e) {
        this.notifications = [];
      }
    } else {
      this.notifications = [
        {
          id: 'NOTIF-001',
          type: 'INFO',
          title: 'System Central Inventory Initialized',
          message: 'Single-source-of-truth transaction ledger active.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          targetDepartments: ['Procurement', 'Production', 'Sales'],
          read: false
        }
      ];
      this.saveNotifications();
    }
  }

  // Helper Persistence Methods
  saveItems() { localStorage.setItem(this.storageKeyItems, JSON.stringify(this.items)); }
  saveTransactions() { localStorage.setItem(this.storageKeyTx, JSON.stringify(this.transactions)); }
  saveGrns() { localStorage.setItem(this.storageKeyGrn, JSON.stringify(this.grnList)); }
  saveJobWorks() { localStorage.setItem(this.storageKeyJobWork, JSON.stringify(this.jobWorks)); }
  saveProdOrders() { localStorage.setItem(this.storageKeyProdOrders, JSON.stringify(this.productionOrders)); }
  saveReservations() { localStorage.setItem(this.storageKeyReservations, JSON.stringify(this.reservations)); }
  saveNotifications() { localStorage.setItem(this.storageKeyNotifications, JSON.stringify(this.notifications)); }

  notifyChange() {
    this.evaluateStockAlerts();
    window.dispatchEvent(new Event('central_inventory_updated'));
  }

  // ----------------------------------------------------
  // DYNAMIC INVENTORY & LEDGER COMPUTATION
  // ----------------------------------------------------
  getInventoryItems() {
    return this.items.map(item => {
      // Calculate Stock IN & Stock OUT from append-only ledger
      const txs = this.transactions.filter(t => t.itemCode === item.code);
      const stockIn = txs.filter(t => t.direction === 'IN').reduce((acc, t) => acc + (parseFloat(t.qty) || 0), 0);
      const stockOut = txs.filter(t => t.direction === 'OUT').reduce((acc, t) => acc + (parseFloat(t.qty) || 0), 0);
      const onHand = Math.max(0, stockIn - stockOut);

      // Active Stock Reservations
      const activeRes = this.reservations
        .filter(r => r.itemCode === item.code && r.status === 'Active')
        .reduce((acc, r) => acc + (parseFloat(r.reservedQty) || 0), 0);

      const available = Math.max(0, onHand - activeRes);

      // Determine Low / Out Stock Status
      let status = 'In Stock';
      if (onHand === 0) {
        status = 'Out of Stock';
      } else if (onHand <= item.minLevel) {
        status = 'Low Stock';
      }

      return {
        ...item,
        onHand,
        stockIn,
        stockOut,
        reserved: activeRes,
        available,
        status
      };
    });
  }

  getItemStockHistory(itemCode) {
    return this.transactions
      .filter(t => t.itemCode === itemCode)
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  }

  // ----------------------------------------------------
  // STOCK ALERTS & NOTIFICATION ENGINE
  // ----------------------------------------------------
  evaluateStockAlerts() {
    const computedItems = this.getInventoryItems();
    computedItems.forEach(item => {
      if (item.onHand === 0) {
        this.addNotification({
          type: 'OUT_OF_STOCK',
          title: `OUT OF STOCK ALERT: ${item.name} (${item.code})`,
          message: `Current Stock is 0 ${item.uom}. Production may be blocked. Immediate procurement required!`,
          targetDepartments: ['Procurement', 'Production']
        });
      } else if (item.onHand <= item.minLevel) {
        this.addNotification({
          type: 'LOW_STOCK',
          title: `LOW STOCK ALERT: ${item.name} (${item.code})`,
          message: `Current Stock (${item.onHand} ${item.uom}) is below Minimum Level (${item.minLevel} ${item.uom}). Purchase action required.`,
          targetDepartments: ['Procurement', 'Production']
        });
      }
    });
  }

  addNotification({ type, title, message, targetDepartments }) {
    const exists = this.notifications.some(n => n.title === title && !n.read && n.date === new Date().toISOString().split('T')[0]);
    if (!exists) {
      const newNotif = {
        id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: type || 'INFO',
        title,
        message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        targetDepartments: targetDepartments || ['Procurement', 'Production'],
        read: false
      };
      this.notifications.unshift(newNotif);
      this.saveNotifications();
      window.dispatchEvent(new Event('central_notification_added'));
    }
  }

  getNotifications(userDept = 'All') {
    if (userDept === 'All') return this.notifications;
    return this.notifications.filter(n => n.targetDepartments.includes('All') || n.targetDepartments.includes(userDept));
  }

  markNotificationRead(id) {
    const n = this.notifications.find(x => x.id === id);
    if (n) {
      n.read = true;
      this.saveNotifications();
      window.dispatchEvent(new Event('central_notification_added'));
    }
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => { n.read = true; });
    this.saveNotifications();
    localStorage.setItem('controlroom_notifications_read', 'true');
    window.dispatchEvent(new Event('central_notification_added'));
  }

  // ----------------------------------------------------
  // 1. GRN -> INVENTORY (PURCHASE_RECEIPT)
  // ----------------------------------------------------
  createGRN(grnData) {
    const grnNo = grnData.grnNo || `GRN-${Date.now().toString().slice(-5)}`;
    const newGrn = {
      ...grnData,
      grnNo,
      status: grnData.status || 'Verified'
    };

    this.grnList.unshift(newGrn);
    this.saveGrns();

    // Auto post if Verified / Posted to Inventory
    if (newGrn.status === 'Verified' || newGrn.status === 'Posted to Inventory') {
      this.postGRNToInventory(newGrn);
    } else {
      this.notifyChange();
    }
    return newGrn;
  }

  postGRNToInventory(grnRecord) {
    // 1. Post Ledger Transaction
    const tx = {
      id: `TX-GRN-${Date.now()}`,
      type: TX_TYPES.PURCHASE_RECEIPT,
      refNo: grnRecord.grnNo,
      dateTime: new Date().toISOString(),
      itemCode: grnRecord.materialCode,
      itemName: grnRecord.materialName,
      qty: parseFloat(grnRecord.receivedQty) || 0,
      unit: grnRecord.unit || 'Nos',
      direction: 'IN',
      warehouse: grnRecord.warehouse || 'Main Raw Material Warehouse',
      user: grnRecord.receivedBy || 'Procurement User',
      department: 'Procurement',
      sourceDoc: `GRN: ${grnRecord.grnNo} (Supplier: ${grnRecord.supplier})`,
      remarks: grnRecord.remarks || 'Stock IN via Verified Goods Receipt Note'
    };

    this.transactions.push(tx);
    this.saveTransactions();

    // 2. Mark GRN Posted
    const target = this.grnList.find(g => g.grnNo === grnRecord.grnNo);
    if (target) {
      target.status = 'Posted to Inventory';
      this.saveGrns();
    }

    this.addNotification({
      type: 'GRN_POSTED',
      title: `GRN Received & Posted: ${grnRecord.grnNo}`,
      message: `Received +${grnRecord.receivedQty} ${grnRecord.unit} of ${grnRecord.materialName} from ${grnRecord.supplier}. Central Inventory updated.`,
      targetDepartments: ['Procurement', 'Production']
    });

    this.notifyChange();
  }

  // ----------------------------------------------------
  // 2. STOCK RESERVATIONS (BOM / PROD ORDER)
  // ----------------------------------------------------
  reserveStockForBOM(refNo, itemsList) {
    itemsList.forEach(item => {
      const res = {
        id: `RES-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        refNo,
        itemCode: item.itemCode || item.code,
        reservedQty: parseFloat(item.reqQty || item.qty) || 0,
        date: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
      this.reservations.push(res);
    });

    this.saveReservations();
    this.notifyChange();
  }

  releaseReservation(refNo, itemCode) {
    this.reservations = this.reservations.filter(r => !(r.refNo === refNo && r.itemCode === itemCode));
    this.saveReservations();
    this.notifyChange();
  }

  // ----------------------------------------------------
  // 3. JOB WORK DUAL TRANSFORMATION LEDGER (RAW -> PROCESSED)
  // ----------------------------------------------------
  createJobWork(jwData) {
    const jobWorkNo = jwData.jobWorkNo || `JW-${Date.now().toString().slice(-5)}`;
    const newJw = {
      ...jwData,
      jobWorkNo,
      status: jwData.status || 'Assigned'
    };
    this.jobWorks.unshift(newJw);
    this.saveJobWorks();

    this.addNotification({
      type: 'JOB_WORK_ASSIGNED',
      title: `Job Work Assigned: ${jobWorkNo}`,
      message: `Assigned to ${newJw.employee}: Cut/Process ${newJw.inputQty} ${newJw.inputUnit} ${newJw.inputMaterialName} -> ${newJw.expectedOutputQty} ${newJw.outputMaterialName}`,
      targetDepartments: ['Production']
    });

    this.notifyChange();
    return newJw;
  }

  completeJobWork(jobWorkNo, actualInput, actualOutput, scrapQty = 0, employeeNotes = '') {
    const jw = this.jobWorks.find(j => j.jobWorkNo === jobWorkNo);
    if (!jw) return;

    jw.actualInputQty = parseFloat(actualInput) || parseFloat(jw.inputQty);
    jw.actualOutputQty = parseFloat(actualOutput) || parseFloat(jw.expectedOutputQty);
    jw.scrapQty = parseFloat(scrapQty) || 0;
    jw.status = 'Completed';
    jw.completionDate = new Date().toISOString();
    jw.employeeRemarks = employeeNotes;
    this.saveJobWorks();

    const timestamp = new Date().toISOString();

    // Transaction 1: RAW / INPUT MATERIAL STOCK OUT
    const txOut = {
      id: `TX-JW-OUT-${Date.now()}`,
      type: TX_TYPES.JOB_WORK_CONSUMPTION,
      refNo: jw.jobWorkNo,
      dateTime: timestamp,
      itemCode: jw.inputMaterialCode,
      itemName: jw.inputMaterialName,
      qty: jw.actualInputQty,
      unit: jw.inputUnit || 'Nos',
      direction: 'OUT',
      warehouse: 'In-Process Workshop',
      user: jw.employee || 'Floor Operator',
      department: 'Production',
      sourceDoc: `Job Work: ${jw.jobWorkNo} (Ref: ${jw.prodOrderNo || 'N/A'})`,
      remarks: `Consumed ${jw.actualInputQty} ${jw.inputUnit} for transformation into ${jw.outputMaterialName}`
    };

    // Transaction 2: PROCESSED MATERIAL STOCK IN
    const txIn = {
      id: `TX-JW-IN-${Date.now()}`,
      type: TX_TYPES.JOB_WORK_OUTPUT,
      refNo: jw.jobWorkNo,
      dateTime: timestamp,
      itemCode: jw.outputMaterialCode,
      itemName: jw.outputMaterialName,
      qty: jw.actualOutputQty,
      unit: jw.outputUnit || 'Pieces',
      direction: 'IN',
      warehouse: 'In-Process Store',
      user: jw.employee || 'Floor Operator',
      department: 'Production',
      sourceDoc: `Job Work: ${jw.jobWorkNo}`,
      remarks: `Produced +${jw.actualOutputQty} ${jw.outputUnit} processed output from ${jw.inputMaterialName}`
    };

    this.transactions.push(txOut);
    this.transactions.push(txIn);

    // Optional Transaction 3: SCRAP STOCK IN
    if (jw.scrapQty > 0) {
      const txScrap = {
        id: `TX-JW-SCRAP-${Date.now()}`,
        type: TX_TYPES.SCRAP,
        refNo: jw.jobWorkNo,
        dateTime: timestamp,
        itemCode: 'SCRAP-ALU-OFFCUT',
        itemName: 'Aluminum Profile Offcut Scrap (300mm)',
        qty: jw.scrapQty,
        unit: 'mm',
        direction: 'IN',
        warehouse: 'Scrap Yard #1',
        user: jw.employee || 'Floor Operator',
        department: 'Production',
        sourceDoc: `Job Work: ${jw.jobWorkNo}`,
        remarks: `Scrap generated during transformation: ${jw.scrapQty} mm`
      };
      this.transactions.push(txScrap);
    }

    this.saveTransactions();

    // Check Variance
    const expected = parseFloat(jw.expectedOutputQty);
    const actual = parseFloat(jw.actualOutputQty);
    if (actual < expected) {
      this.addNotification({
        type: 'JOB_WORK_VARIANCE',
        title: `Job Work Variance Alert: ${jw.jobWorkNo}`,
        message: `Expected Output: ${expected} ${jw.outputUnit}, Actual Produced: ${actual} ${jw.outputUnit}. Variance: -${expected - actual} ${jw.outputUnit}`,
        targetDepartments: ['Production']
      });
    } else {
      this.addNotification({
        type: 'JOB_WORK_COMPLETED',
        title: `Job Work Completed: ${jw.jobWorkNo}`,
        message: `Stock OUT ${jw.actualInputQty} ${jw.inputUnit} ${jw.inputMaterialName} | Stock IN +${jw.actualOutputQty} ${jw.outputUnit} ${jw.outputMaterialName}`,
        targetDepartments: ['Production']
      });
    }

    this.notifyChange();
  }

  // ----------------------------------------------------
  // 4. PRODUCTION ORDER & MATERIAL ISSUE (PROCESSED -> FINISHED GOODS)
  // ----------------------------------------------------
  createProductionOrder(prodData) {
    const prodOrderNo = prodData.prodOrderNo || `PROD-${Date.now().toString().slice(-5)}`;
    const newOrder = {
      ...prodData,
      prodOrderNo,
      status: prodData.status || 'Material Reserved'
    };
    this.productionOrders.unshift(newOrder);
    this.saveProdOrders();

    // Reserve raw/processed materials
    if (newOrder.requiredMaterials && newOrder.requiredMaterials.length > 0) {
      this.reserveStockForBOM(prodOrderNo, newOrder.requiredMaterials);
    }

    this.notifyChange();
    return newOrder;
  }

  issueProductionMaterial(prodOrderNo, itemCode, issueQty, user = 'Production Supervisor') {
    const prod = this.productionOrders.find(p => p.prodOrderNo === prodOrderNo);
    const item = this.items.find(i => i.code === itemCode);
    if (!item) return;

    // Release Stock Reservation
    this.releaseReservation(prodOrderNo, itemCode);

    // Write PRODUCTION_ISSUE Stock OUT Ledger entry
    const tx = {
      id: `TX-PROD-ISSUE-${Date.now()}`,
      type: TX_TYPES.PRODUCTION_ISSUE,
      refNo: prodOrderNo,
      dateTime: new Date().toISOString(),
      itemCode: itemCode,
      itemName: item.name,
      qty: parseFloat(issueQty) || 0,
      unit: item.uom,
      direction: 'OUT',
      warehouse: item.location || 'In-Process Store',
      user,
      department: 'Production',
      sourceDoc: `Production Order: ${prodOrderNo}`,
      remarks: `Issued ${issueQty} ${item.uom} to production line`
    };

    this.transactions.push(tx);
    this.saveTransactions();

    if (prod) {
      prod.status = 'In Production';
      this.saveProdOrders();
    }

    this.addNotification({
      type: 'MATERIAL_ISSUED',
      title: `Material Issued for Production: ${prodOrderNo}`,
      message: `Issued ${issueQty} ${item.uom} of ${item.name} to Production Line.`,
      targetDepartments: ['Production']
    });

    this.notifyChange();
  }

  completeProductionOrder(prodOrderNo, finishedQty, user = 'Plant Manager') {
    const prod = this.productionOrders.find(p => p.prodOrderNo === prodOrderNo);
    if (!prod) return;

    const fgCode = prod.productCode || 'FG-SOLAR-STR';
    const fgItem = this.items.find(i => i.code === fgCode) || { name: prod.productName, uom: 'Structures', location: 'Finished Goods Bay' };

    prod.producedQty = (parseFloat(prod.producedQty) || 0) + (parseFloat(finishedQty) || 0);
    if (prod.producedQty >= prod.requiredQty) {
      prod.status = 'Completed';
    }
    this.saveProdOrders();

    // Write FINISHED_GOODS_RECEIPT Stock IN Ledger entry
    const tx = {
      id: `TX-FG-REC-${Date.now()}`,
      type: TX_TYPES.FINISHED_GOODS_RECEIPT,
      refNo: prodOrderNo,
      dateTime: new Date().toISOString(),
      itemCode: fgCode,
      itemName: prod.productName || fgItem.name,
      qty: parseFloat(finishedQty) || 0,
      unit: fgItem.uom || 'Nos',
      direction: 'IN',
      warehouse: fgItem.location || 'Finished Goods Warehouse Bay',
      user,
      department: 'Production',
      sourceDoc: `Production Order: ${prodOrderNo} Completion`,
      remarks: `Finished Assembly Receipt: +${finishedQty} ${fgItem.uom} added to Central Finished Goods Inventory`
    };

    this.transactions.push(tx);
    this.saveTransactions();

    this.addNotification({
      type: 'PRODUCTION_COMPLETED',
      title: `Production Completed: ${prodOrderNo}`,
      message: `Finished Goods Stock IN: +${finishedQty} ${fgItem.uom} ${prod.productName}. Ready for Sales Dispatch!`,
      targetDepartments: ['Production', 'Sales']
    });

    this.notifyChange();
  }

  // ----------------------------------------------------
  // 5. SALES DISPATCH & INVOICING (FINISHED GOODS OUT)
  // ----------------------------------------------------
  dispatchInvoiceOrder(invNo, fgItemCode, dispatchQty, customerName, user = 'Dispatch Executive') {
    const item = this.items.find(i => i.code === fgItemCode) || { name: 'Finished Solar Assembly', uom: 'Structures', location: 'Finished Goods Warehouse' };

    const tx = {
      id: `TX-SALES-DISP-${Date.now()}`,
      type: TX_TYPES.SALES_DISPATCH,
      refNo: invNo,
      dateTime: new Date().toISOString(),
      itemCode: fgItemCode,
      itemName: item.name,
      qty: parseFloat(dispatchQty) || 0,
      unit: item.uom || 'Nos',
      direction: 'OUT',
      warehouse: item.location || 'Finished Goods Warehouse',
      user,
      department: 'Sales & Dispatch',
      sourceDoc: `Invoice / Dispatch Note: ${invNo} (Customer: ${customerName})`,
      remarks: `Dispatched ${dispatchQty} ${item.uom} against Sales Invoice`
    };

    this.transactions.push(tx);
    this.saveTransactions();

    this.addNotification({
      type: 'SALES_DISPATCH',
      title: `Sales Dispatch Completed: ${invNo}`,
      message: `Dispatched ${dispatchQty} ${item.uom} ${item.name} to ${customerName}. Finished Goods Inventory updated.`,
      targetDepartments: ['Sales', 'Procurement', 'Production']
    });

    this.notifyChange();
  }

  // Stock Adjustment Manual Ledger Audit Entry
  recordStockAdjustment(itemCode, adjQty, direction, reason, user = 'Inventory Auditor') {
    const item = this.items.find(i => i.code === itemCode);
    if (!item) return;

    const tx = {
      id: `TX-ADJ-${Date.now()}`,
      type: TX_TYPES.STOCK_ADJUSTMENT,
      refNo: `AUDIT-${Date.now().toString().slice(-4)}`,
      dateTime: new Date().toISOString(),
      itemCode: itemCode,
      itemName: item.name,
      qty: Math.abs(parseFloat(adjQty)) || 0,
      unit: item.uom,
      direction: direction === 'Add' ? 'IN' : 'OUT',
      warehouse: item.location || 'Main Store',
      user,
      department: 'Store Audit',
      sourceDoc: 'Stock Audit Adjustment',
      remarks: reason || 'Inventory physical count correction'
    };

    this.transactions.push(tx);
    this.saveTransactions();
    this.notifyChange();
  }
}

export const centralInventoryStore = new CentralInventoryStore();
