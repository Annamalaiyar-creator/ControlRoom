import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Check, Trash2, Eye, FileText, Search, AlertCircle, AlertTriangle, X,
  CheckCircle, Clock, Calendar, Edit3, RotateCcw, UploadCloud, ChevronDown, ChevronUp,
  Truck, ShoppingCart, Upload, Printer, Download, Layers, CreditCard, Bell, MoreHorizontal, FileCheck, CheckSquare,
  Camera, Video, LayoutGrid, List, Layout, Sparkles, PackageCheck, Image, FileSpreadsheet, Loader
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { fetchCloudStore, saveCloudStore } from '../../utils/supabaseDataSync';
import { VRM_HDG_PRESETS, getAllActivePresets } from '../../vrmHdgProposalPresets';
import { VRM_PRODUCTS } from '../../utils/vrmProductsData';
import { saveMediaToCache, getMediaFromCache, stripDataUrlsFromRecord, compressAndSaveFile } from '../../utils/otherViewsShared';
import { getFullProductsCatalogWithStock } from '../../utils/productCatalogService';
import SearchablePresetSelector from '../SearchablePresetSelector';
import VRMBomPrintTemplate, { VRMBomPrintSheet } from '../VRMBomPrintTemplate';
import { notifyBomSentToDispatch } from '../../services/notificationService';

export default function BomOrdersView(props) {
  const {
    activeTab = 'BOM Orders',
    userRole = 'Sales Executive',
    convertingPiData,
    onClearConvertingPiData
  } = props;

  // Search & Filter states
  const [searchQueryText, setSearchQueryText] = useState('');
  const [filterDateVal, setFilterDateVal] = useState('');
  const [filterStatusSelect, setFilterStatusSelect] = useState('All');
  const [activeSubTab, setActiveSubTab] = useState('All');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [printingBomRecord, setPrintingBomRecord] = useState(null);
  const [exportFormatRecord, setExportFormatRecord] = useState(null);
  const [isExportingFormat, setIsExportingFormat] = useState(null); // 'pdf' | 'jpg' | 'csv' | null

  // BOM Store from localStorage & Supabase
  const [bomStore, setBomStore] = useState(() => {
    try {
      const saved = localStorage.getItem('controlroom_bom_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading controlroom_bom_store', e);
    }
    return [
      {
        bomCode: 'BOM-101',
        date: '2026-07-10',
        customerName: 'Vikram Solar Pvt Ltd',
        companyName: 'Vikram Solar Pvt Ltd',
        mobile: '+91 98765 43210',
        email: 'rajesh@vikramsolar.com',
        billingAddress: 'No 1427, GNT Road, Nagappa Industrial Estate, Puzhal, Chennai',
        deliveryAddress: 'No 1427, GNT Road, Nagappa Industrial Estate, Puzhal, Chennai',
        paymentType: '100% Advance',
        status: 'Pending Confirmation',
        items: [
          { name: 'Mini Rail 100 mm', category: 'Aluminum Mounting Rail', qty: 4, rate: 250, confirmed: false },
          { name: 'Mid Clamp 35 mm', category: '35mm Aluminum Clamp', qty: 6, rate: 45, confirmed: false },
          { name: 'End Clamp 35 mm', category: '35mm End Fastener', qty: 4, rate: 40, confirmed: false }
        ],
        payments: {
          advance50Uploaded: false,
          dispatch50Uploaded: false,
          advance100Uploaded: false,
          net30Uploaded: false,
          proofDoc: null
        },
        dispatchPacking: [],
        accountsVerification: {
          paymentStatus: null,
          hardCopyReceived: false,
          softCopyReceived: false
        },
        invoiceConfirmed: false,
        invoiceDeducted: false,
        grandTotal: 1430
      },
      {
        bomCode: 'BOM-102',
        date: '2026-07-12',
        customerName: 'Tata Power Renewable',
        companyName: 'Tata Power Ltd',
        mobile: '+91 98123 45678',
        email: 'anish.s@tatapower.com',
        billingAddress: 'Tata Power Tech Park, Whitefield, Bengaluru',
        deliveryAddress: 'Tata Power Tech Park, Whitefield, Bengaluru',
        paymentType: '50% Advance + 50% Dispatch',
        status: 'Sent to Production',
        items: [
          { name: 'Long Rail 3000 mm', category: '3 Meter Heavy Duty Rail', qty: 8, rate: 1800, confirmed: true },
          { name: 'Mini Rail 100 mm', category: 'Aluminum Mounting Rail', qty: 12, rate: 250, confirmed: true }
        ],
        payments: {
          advance50Uploaded: true,
          dispatch50Uploaded: false,
          proofDoc: 'payment_proof_50pct.pdf'
        },
        dispatchPacking: [
          { name: 'Long Rail 3000 mm', bomQty: 8, packed: true },
          { name: 'Mini Rail 100 mm', bomQty: 12, packed: true }
        ],
        accountsVerification: {
          paymentStatus: '50% Received',
          hardCopyReceived: true,
          softCopyReceived: true
        },
        invoiceConfirmed: false,
        invoiceDeducted: false,
        grandTotal: 17400
      }
    ];
  });

  // Customer List from localStorage
  const [customerList, setCustomerList] = useState(() => {
    try {
      const saved = localStorage.getItem('controlroom_customer_store') || localStorage.getItem('controlroom_customer_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { code: 'Vikram Solar Pvt Ltd', c2: 'Vikram Solar Pvt Ltd', gstNo: '33AABCU9603R1ZM', c3: 'Rajesh Kumar', c4: '+91 98765 43210', c5: 'rajesh@vikramsolar.com', status: 'ACTIVE' },
      { code: 'Tata Power Renewable', c2: 'Tata Power Ltd', gstNo: '29AAACT2727Q1ZW', c3: 'Anish Sharma', c4: '+91 98123 45678', c5: 'anish.s@tatapower.com', status: 'ACTIVE' },
      { code: 'Apex Infra Systems', c2: 'Apex Infra Ltd', gstNo: '33AABCA1234F1Z5', c3: 'Priya Sundaram', c4: '+91 99400 11223', c5: 'priya@apexinfra.com', status: 'ACTIVE' }
    ];
  });

  // Active Presets state (loaded from master JSON + localStorage/cloud)
  const [activePresetsMap, setActivePresetsMap] = useState(() => getAllActivePresets());

  // Full 285+ Standardized Products Catalog with Live Central Inventory Stock
  const [itemsList, setItemsList] = useState(() => getFullProductsCatalogWithStock());

  useEffect(() => {
    const refreshCatalog = () => {
      setItemsList(getFullProductsCatalogWithStock());
    };
    window.addEventListener('central_inventory_updated', refreshCatalog);
    window.addEventListener('controlroom_storage_update', refreshCatalog);
    window.addEventListener('storage', refreshCatalog);
    return () => {
      window.removeEventListener('central_inventory_updated', refreshCatalog);
      window.removeEventListener('controlroom_storage_update', refreshCatalog);
      window.removeEventListener('storage', refreshCatalog);
    };
  }, []);

  // Sync bomStore to localStorage & Supabase
  useEffect(() => {
    if (bomStore && Array.isArray(bomStore) && bomStore.length > 0) {
      const sanitized = bomStore.map(stripDataUrlsFromRecord);
      try {
        localStorage.setItem('controlroom_bom_store', JSON.stringify(sanitized));
      } catch (e) {
        console.error('Error setting controlroom_bom_store', e);
      }
      saveCloudStore('bom_store', sanitized);
    }
  }, [bomStore]);

  // Initial cloud fetch, polling and cross-tab storage listener
  useEffect(() => {
    const syncFromCloud = async () => {
      try {
        let data = null;
        try {
          const apiRes = await fetch('/api/boms');
          if (apiRes.ok) {
            const json = await apiRes.json();
            if (json && Array.isArray(json.data) && json.data.length > 0) {
              data = json.data;
            }
          }
        } catch (_) {}

        if (!data) {
          data = await fetchCloudStore('bom_store', []);
        }

        if (data && Array.isArray(data) && data.length > 0) {
          setBomStore(prev => {
            const map = new Map();
            let localCurrent = Array.isArray(prev) ? prev : [];
            try {
              const savedStr = localStorage.getItem('controlroom_bom_store');
              if (savedStr) {
                const parsed = JSON.parse(savedStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const currentMap = new Map();
                  localCurrent.forEach(i => i && currentMap.set(i.bomCode || i.code, i));
                  parsed.forEach(i => i && currentMap.set(i.bomCode || i.code, i));
                  localCurrent = Array.from(currentMap.values());
                }
              }
            } catch (e) { }

            // Remote database is primary source
            data.forEach(item => {
              if (item) {
                const k = item.bomCode || item.code;
                if (k) map.set(k, item);
              }
            });
            // Merge with local items
            localCurrent.forEach(item => {
              if (item) {
                const k = item.bomCode || item.code;
                if (k) {
                  if (map.has(k)) {
                    map.set(k, { ...map.get(k), ...item });
                  } else {
                    map.set(k, item);
                  }
                }
              }
            });
            const merged = Array.from(map.values());
            const sanitizedMerged = merged.map(stripDataUrlsFromRecord);
            try { localStorage.setItem('controlroom_bom_store', JSON.stringify(sanitizedMerged)); } catch (e) { }
            return sanitizedMerged;
          });
        }
      } catch (err) {
        console.error('Error in syncFromCloud:', err);
      }
    };

    // Initial fetch
    syncFromCloud();

    // Auto-poll every 6 seconds so all 5 sales people and dispatch see newly created BOMs and status changes in real time
    const pollInterval = setInterval(syncFromCloud, 6000);

    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem('controlroom_bom_store');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBomStore(parsed);
          }
        }
        const savedCust = localStorage.getItem('controlroom_customer_store') || localStorage.getItem('controlroom_customer_list');
        if (savedCust) {
          const parsedCust = JSON.parse(savedCust);
          if (Array.isArray(parsedCust) && parsedCust.length > 0) setCustomerList(parsedCust);
        }
      } catch (e) { }
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('controlroom_storage_update', syncFromStorage);
    window.addEventListener('controlroom_customer_update', syncFromStorage);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('controlroom_storage_update', syncFromStorage);
      window.removeEventListener('controlroom_customer_update', syncFromStorage);
    };
  }, []);

  // Form & Modals State
  const [showBOMForm, setShowBOMForm] = useState(false);
  const [confirmingBomModal, setConfirmingBomModal] = useState(null);
  const [uploadPaymentModal, setUploadPaymentModal] = useState(null);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentStageType, setPaymentStageType] = useState('100% Advance');
  const [quickPreviewRecord, setQuickPreviewRecord] = useState(null);
  const [previewDocModal, setPreviewDocModal] = useState(null); // { title: string, doc: object }
  const [customAlert, setCustomAlert] = useState(null);
  const [bomActionMenuIdx, setBomActionMenuIdx] = useState(null);

  // Create BOM Form Specific State
  const [newBomCode, setNewBomCode] = useState('');
  const [newBomProductName, setNewBomProductName] = useState('');
  const [newBomDeliveryAddress, setNewBomDeliveryAddress] = useState('');
  const [newBomDeliveryStreet, setNewBomDeliveryStreet] = useState('');
  const [newBomDeliveryCity, setNewBomDeliveryCity] = useState('');
  const [newBomDeliveryState, setNewBomDeliveryState] = useState('');
  const [newBomDeliveryPincode, setNewBomDeliveryPincode] = useState('');
  const [newBomPaymentType, setNewBomPaymentType] = useState('100% Paid');
  const [newBomCreditDays, setNewBomCreditDays] = useState(7);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [newBomDeliveryProofDoc, setNewBomDeliveryProofDoc] = useState(null);
  const [newBomPaymentProofDoc, setNewBomPaymentProofDoc] = useState(null);
  const [newBomRemarks, setNewBomRemarks] = useState('');
  const [newBomTransportMode, setNewBomTransportMode] = useState('Transport');
  const [newBomTransporterName, setNewBomTransporterName] = useState('');
  const [newBomVehicleNo, setNewBomVehicleNo] = useState('');
  const [newBomTransportScope, setNewBomTransportScope] = useState('VRM Structures');
  const [newBomLrNo, setNewBomLrNo] = useState('');
  const getEffectiveSalesPerson = () => {
    const storedName = localStorage.getItem('controlroom_logged_user_name');
    if (storedName && storedName.trim() && storedName !== 'undefined' && storedName !== 'null') {
      return storedName.trim();
    }
    const storedUser = localStorage.getItem('controlroom_logged_user');
    if (storedUser && storedUser.trim() && storedUser !== 'undefined' && storedUser !== 'null') {
      return storedUser.trim();
    }
    if (userRole === 'Sales Head') return 'Vijay';
    if (userRole === 'Sales Executive') return 'Mohith JV';
    if (userRole === 'Accounts Head') return 'Venkatesh';
    if (userRole === 'Accounts Executive') return 'Priya';
    if (userRole === 'Technical Administrator' || userRole === 'CEO') return 'Annamalaiyar';
    if (userRole === 'Procurement Head') return 'ARUN BOOPATHI M';
    if (userRole === 'Production Head') return 'Senthil Kumar';
    return 'Mohith JV';
  };
  const defaultSalesPersonName = getEffectiveSalesPerson();
  const [newBomSalesPerson, setNewBomSalesPerson] = useState(defaultSalesPersonName);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetSetCount, setPresetSetCount] = useState(1);
  const [presetKitPrice, setPresetKitPrice] = useState('');
  const [presetGroups, setPresetGroups] = useState({}); // { [groupId]: { groupId, presetId, presetName, setCount, kitPrice } }
  const [selectedBomItemIndexes, setSelectedBomItemIndexes] = useState([]);
  const [bomItemsLayoutMode, setBomItemsLayoutMode] = useState('modern_table'); // 'modern_table' | 'cards_grid' | 'split_workspace'
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [bomConfirmModal, setBomConfirmModal] = useState(null); // 'cancel' | 'draft' | 'create'
  const [bomMaterialsList, setBomMaterialsList] = useState([]);

  // Listen to preset updates from Tech Support preset manager
  useEffect(() => {
    const handlePresetUpdate = (e) => {
      if (e.detail) {
        setActivePresetsMap(e.detail);
      }
    };
    window.addEventListener('vrm_presets_updated', handlePresetUpdate);
    return () => window.removeEventListener('vrm_presets_updated', handlePresetUpdate);
  }, []);

  // CSV Export for BOM Order Specifications & Line Items
  const handleExportBomCsv = (record) => {
    if (!record) return;
    const bomCode = record.bomCode || record.code || 'BOM_Order';
    const customer = record.customerName || record.companyName || 'Customer';
    const date = record.createdAt || record.date || new Date().toISOString().split('T')[0];
    const status = record.status || 'Active';
    const salesPerson = (record.salesPerson || 'Mohit JV').replace(/\s*\([^)]*\)/g, '').trim();
    const paymentType = record.paymentType || '100% Paid';

    const bObj = record.billingAddressObj || {};
    const dObj = record.deliveryAddressObj || {};
    const bStr = record.billingAddress || (bObj.address ? `${bObj.address}, ${bObj.city || ''} ${bObj.state || ''} - ${bObj.pincode || ''}` : '');
    const dStr = record.deliveryAddress || (dObj.address ? `${dObj.address}, ${dObj.city || ''} ${dObj.state || ''} - ${dObj.pincode || ''}` : bStr);

    const transportMode = record.transportMode || 'Transport';
    const transportScope = record.transportScope || 'VRM Structures';
    const transporterName = record.transporterName || '—';
    const vehicleNo = record.vehicleNo || '—';
    const lrNo = record.lrNo || '—';

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = [];
    rows.push(['VRM STRUCTURES - BILL OF MATERIALS (BOM) ORDER SPECIFICATION']);
    rows.push([]);
    rows.push(['ORDER METADATA']);
    rows.push(['BOM Reference Code', bomCode, 'Order Date', date]);
    rows.push(['Customer / Company', customer, 'Order Status', status]);
    rows.push(['Sales Person', salesPerson, 'Payment Terms', paymentType]);
    rows.push([]);
    rows.push(['LOGISTICS & ADDRESS DETAILS']);
    rows.push(['Billing Address', bStr]);
    rows.push(['Delivery Address', dStr]);
    rows.push(['Transport Mode', transportMode, 'Transport Scope', transportScope]);
    rows.push(['Transporter Name', transporterName, 'Vehicle Number', vehicleNo, 'LR / Docket No', lrNo]);
    rows.push([]);
    rows.push(['LINE ITEMS BREAKDOWN']);
    rows.push(['#', 'Item Description', 'Category', 'Quantity', 'UOM', 'Unit Rate (INR)', 'Taxable Amount (INR)', 'GST Rate', 'GST Amount (INR)', 'Total (INR)']);

    const items = record.items || [];
    let calcSubtotal = 0;
    let calcTotalGst = 0;
    let calcGrandTotal = 0;

    items.forEach((it, idx) => {
      const name = it.name || it.itemName || it.title || it.description || `Item ${idx + 1}`;
      const cat = it.category || 'General';
      const qty = Number(it.quantity || it.qty || 0);
      const uom = it.uom || it.unit || 'NOS';
      const rate = Number(it.rate || it.unitPrice || it.price || 0);
      const taxable = Number(it.taxableAmount || (qty * rate) || 0);
      const gstRate = it.gstRate ? `${it.gstRate}%` : (it.gst ? `${it.gst}%` : '18%');
      const gstPct = Number(String(gstRate).replace('%', '')) || 18;
      const gstAmount = Number(it.gstAmount || (taxable * gstPct / 100) || 0);
      const total = Number(it.total || it.totalAmount || (taxable + gstAmount) || 0);

      calcSubtotal += taxable;
      calcTotalGst += gstAmount;
      calcGrandTotal += total;

      rows.push([
        idx + 1,
        name,
        cat,
        qty,
        uom,
        rate.toFixed(2),
        taxable.toFixed(2),
        gstRate,
        gstAmount.toFixed(2),
        total.toFixed(2)
      ]);
    });

    const finalGrandTotal = Number(record.grandTotal || calcGrandTotal);
    const finalTax = Number(record.totalTax || record.gstTotal || calcTotalGst);
    const finalSubtotal = Number(record.subTotal || record.subtotal || calcSubtotal);

    rows.push([]);
    rows.push(['', '', '', '', '', '', 'Subtotal', '', '', finalSubtotal.toFixed(2)]);
    rows.push(['', '', '', '', '', '', 'Total GST', '', '', finalTax.toFixed(2)]);
    rows.push(['', '', '', '', '', '', 'Grand Total (INR)', '', '', finalGrandTotal.toFixed(2)]);

    const csvContent = '\uFEFF' + rows.map(r => r.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${bomCode}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export BOM sheet as high-resolution PDF document using jsPDF + html2canvas
  const handleExportAsPdf = async (record) => {
    if (!record) return;
    setIsExportingFormat('pdf');
    try {
      const el = document.getElementById('bom-export-hidden-target');
      if (!el) {
        alert('Could not locate printable sheet element.');
        setIsExportingFormat(null);
        return;
      }
      await new Promise((res) => setTimeout(res, 350));
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, '', 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, '', 'FAST');
        heightLeft -= pageHeight;
      }

      const bomCode = record.bomCode || record.code || 'BOM_Order';
      pdf.save(`${bomCode}_document.pdf`);
      setExportFormatRecord(null);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsExportingFormat(null);
    }
  };

  // Export BOM sheet as high-resolution JPG image using html2canvas
  const handleExportAsJpg = async (record) => {
    if (!record) return;
    setIsExportingFormat('jpg');
    try {
      const el = document.getElementById('bom-export-hidden-target');
      if (!el) {
        alert('Could not locate printable sheet element.');
        setIsExportingFormat(null);
        return;
      }
      await new Promise((res) => setTimeout(res, 350));
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const bomCode = record.bomCode || record.code || 'BOM_Order';
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${bomCode}_sheet.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportFormatRecord(null);
    } catch (err) {
      console.error('JPG export failed:', err);
      alert('Failed to generate JPG: ' + err.message);
    } finally {
      setIsExportingFormat(null);
    }
  };

  // Permission Check for Cancel BOM (Strictly Dispatch, Production, and Billing Logins)
  const canCancelBom = [
    'Dispatch Head', 'Dispatch Executive',
    'Production Head', 'Technical Administrator', 'CEO', 'Floor Supervisor',
    'Billing', 'Invoice Executive', 'Accounts Head', 'Accounts Executive'
  ].includes(userRole);

  // Helper to Block / Deduct Inventory immediately upon BOM Creation or Verification
  const blockInventoryForBom = (bomItems = [], bomCode = '') => {
    if (!Array.isArray(bomItems) || bomItems.length === 0) return;
    try {
      // 1. Update controlroom_raw_materials_store
      const rawStoreStr = localStorage.getItem('controlroom_raw_materials_store');
      let currentMats = [];
      if (rawStoreStr) {
        try { currentMats = JSON.parse(rawStoreStr); } catch (_) {}
      }
      if (!Array.isArray(currentMats)) currentMats = [];

      // 2. Update controlroom_items_list
      const itemsListStr = localStorage.getItem('controlroom_items_list');
      let currentItems = [];
      if (itemsListStr) {
        try { currentItems = JSON.parse(itemsListStr); } catch (_) {}
      }
      if (!Array.isArray(currentItems)) currentItems = [];

      bomItems.forEach(pItem => {
        const qtyToBlock = parseFloat(pItem.qty || pItem.bomQty || 1) || 0;
        const pCode = (pItem.code || '').toUpperCase().trim();
        const pName = (pItem.name || pItem.description || '').toLowerCase().trim();

        // Match in raw materials store
        let match = currentMats.find(m => {
          const mCode = (m.code || '').toUpperCase().trim();
          const mName = (m.name || '').toLowerCase().trim();
          if (pCode && mCode === pCode) return true;
          if (pName && (mName === pName || mName.includes(pName) || pName.includes(mName))) return true;
          return false;
        });

        if (match) {
          const currStock = Math.max(0, parseFloat(String(match.stock).replace(/,/g, '')) || 0);
          const newStock = Math.max(0, currStock - qtyToBlock);
          match.stock = newStock;
          match.reserved = (parseFloat(match.reserved) || 0) + qtyToBlock;
          match.blockedForBom = (match.blockedForBom || 0) + qtyToBlock;
          const minL = parseFloat(String(match.minLevel || '100').replace(/,/g, '')) || 100;
          match.status = newStock === 0 ? 'Out of Stock' : (newStock <= minL ? 'Low Stock' : 'In Stock');
          match.lastUpdated = `Blocked for BOM ${bomCode}`;
        } else if (pName) {
          // If not existing in current store, register it with 0 available stock
          currentMats.push({
            code: pCode || `FG-${Date.now().toString().slice(-4)}`,
            name: pItem.name || 'Finished Good Item',
            cat: pItem.category || 'Finished Goods',
            unit: pItem.uom || 'Nos',
            stock: 0,
            reserved: qtyToBlock,
            blockedForBom: qtyToBlock,
            minLevel: 10,
            status: 'Out of Stock',
            store: 'Main Store',
            lastUpdated: `Blocked for BOM ${bomCode}`
          });
        }

        // Match in items list
        let itemMatch = currentItems.find(it => {
          const itCode = (it.code || '').toUpperCase().trim();
          const itName = (it.name || '').toLowerCase().trim();
          if (pCode && itCode === pCode) return true;
          if (pName && (itName === pName || itName.includes(pName) || pName.includes(itName))) return true;
          return false;
        });
        if (itemMatch) {
          const currStock = Math.max(0, parseFloat(String(itemMatch.stock || itemMatch.availableStock || 0).replace(/,/g, '')) || 0);
          const newStock = Math.max(0, currStock - qtyToBlock);
          itemMatch.stock = newStock;
          itemMatch.availableStock = newStock;
          itemMatch.reserved = (parseFloat(itemMatch.reserved) || 0) + qtyToBlock;
          itemMatch.status = newStock === 0 ? 'Out of Stock' : (newStock <= (itemMatch.minLevel || 20) ? 'Low Stock' : 'In Stock');
        }
      });

      localStorage.setItem('controlroom_raw_materials_store', JSON.stringify(currentMats));
      if (currentItems.length > 0) localStorage.setItem('controlroom_items_list', JSON.stringify(currentItems));
      saveCloudStore('raw_materials_store', currentMats);
      window.dispatchEvent(new Event('controlroom_raw_materials_update'));
      window.dispatchEvent(new Event('controlroom_storage_update'));
      setItemsList(currentMats);
    } catch (err) {
      console.error('Error blocking inventory for BOM:', err);
    }
  };

  // Helper to Restore / Unblock Inventory when a BOM is Cancelled
  const restoreInventoryForBom = (bomItems = [], bomCode = '') => {
    if (!Array.isArray(bomItems) || bomItems.length === 0) return;
    try {
      const rawStoreStr = localStorage.getItem('controlroom_raw_materials_store');
      let currentMats = [];
      if (rawStoreStr) {
        try { currentMats = JSON.parse(rawStoreStr); } catch (_) {}
      }
      if (!Array.isArray(currentMats)) currentMats = [];

      const itemsListStr = localStorage.getItem('controlroom_items_list');
      let currentItems = [];
      if (itemsListStr) {
        try { currentItems = JSON.parse(itemsListStr); } catch (_) {}
      }
      if (!Array.isArray(currentItems)) currentItems = [];

      bomItems.forEach(pItem => {
        const qtyToRestore = parseFloat(pItem.qty || pItem.bomQty || 1) || 0;
        const pCode = (pItem.code || '').toUpperCase().trim();
        const pName = (pItem.name || pItem.description || '').toLowerCase().trim();

        let match = currentMats.find(m => {
          const mCode = (m.code || '').toUpperCase().trim();
          const mName = (m.name || '').toLowerCase().trim();
          if (pCode && mCode === pCode) return true;
          if (pName && (mName === pName || mName.includes(pName) || pName.includes(mName))) return true;
          return false;
        });

        if (match) {
          const currStock = parseFloat(String(match.stock).replace(/,/g, '')) || 0;
          const newStock = currStock + qtyToRestore;
          match.stock = newStock;
          match.reserved = Math.max(0, (parseFloat(match.reserved) || 0) - qtyToRestore);
          match.blockedForBom = Math.max(0, (match.blockedForBom || 0) - qtyToRestore);
          const minL = parseFloat(String(match.minLevel || '100').replace(/,/g, '')) || 100;
          match.status = newStock === 0 ? 'Out of Stock' : (newStock <= minL ? 'Low Stock' : 'In Stock');
          match.lastUpdated = `Restored from Cancelled BOM ${bomCode}`;
        }

        let itemMatch = currentItems.find(it => {
          const itCode = (it.code || '').toUpperCase().trim();
          const itName = (it.name || '').toLowerCase().trim();
          if (pCode && itCode === pCode) return true;
          if (pName && (itName === pName || itName.includes(pName) || pName.includes(itName))) return true;
          return false;
        });
        if (itemMatch) {
          const currStock = parseFloat(String(itemMatch.stock || itemMatch.availableStock || 0).replace(/,/g, '')) || 0;
          const newStock = currStock + qtyToRestore;
          itemMatch.stock = newStock;
          itemMatch.availableStock = newStock;
          itemMatch.reserved = Math.max(0, (parseFloat(itemMatch.reserved) || 0) - qtyToRestore);
          itemMatch.status = newStock === 0 ? 'Out of Stock' : (newStock <= (itemMatch.minLevel || 20) ? 'Low Stock' : 'In Stock');
        }
      });

      localStorage.setItem('controlroom_raw_materials_store', JSON.stringify(currentMats));
      if (currentItems.length > 0) localStorage.setItem('controlroom_items_list', JSON.stringify(currentItems));
      saveCloudStore('raw_materials_store', currentMats);
      window.dispatchEvent(new Event('controlroom_raw_materials_update'));
      window.dispatchEvent(new Event('controlroom_storage_update'));
      setItemsList(currentMats);
    } catch (err) {
      console.error('Error restoring inventory for BOM:', err);
    }
  };

  // Execution function for Cancel BOM
  const handleCancelBomOrder = (bomToCancel) => {
    if (!bomToCancel) return;
    if (!canCancelBom) {
      alert('⛔ Access Restricted!\nOnly Dispatch, Production, or Billing logins are authorized to cancel a BOM and release reserved inventory.');
      return;
    }

    const bCode = bomToCancel.bomCode || bomToCancel.code;
    const confirmCancel = window.confirm(`⚠️ Are you sure you want to CANCEL BOM ${bCode}?\n\nThis will immediately release and restore all blocked items back into live inventory so other sales persons can book them.`);
    if (!confirmCancel) return;

    // 1. Restore Inventory
    restoreInventoryForBom(bomToCancel.items || bomToCancel.dispatchPacking, bCode);

    // 2. Update BOM status
    setBomStore(prev => {
      const updated = prev.map(b => (b.bomCode === bCode || b.code === bCode) ? {
        ...b,
        status: 'Cancelled & Stock Restored',
        cancelled: true,
        stockBlocked: false,
        cancelledBy: getEffectiveSalesPerson(),
        cancelledAt: new Date().toISOString()
      } : b);
      const sanitized = updated.map(stripDataUrlsFromRecord);
      try { localStorage.setItem('controlroom_bom_store', JSON.stringify(sanitized)); } catch (_) {}
      saveCloudStore('bom_store', sanitized);
      return sanitized;
    });

    if (confirmingBomModal && (confirmingBomModal.bomCode === bCode || confirmingBomModal.code === bCode)) {
      setConfirmingBomModal(prev => prev ? { ...prev, status: 'Cancelled & Stock Restored', cancelled: true, stockBlocked: false } : null);
    }

    alert(`✅ BOM (${bCode}) has been successfully CANCELLED.\nAll items have been restored and unblocked in live inventory.`);
  };

  // Alert function
  const showCustomAlert = (msg, title = null, type = null) => {
    let detectedType = type;
    let detectedTitle = title;
    const strMsg = String(msg || '');

    if (!detectedType) {
      if (strMsg.includes('❌') || strMsg.toLowerCase().includes('wrong') || strMsg.toLowerCase().includes('error') || strMsg.toLowerCase().includes('fail') || strMsg.toLowerCase().includes('invalid')) {
        detectedType = 'error';
        if (!detectedTitle) detectedTitle = 'Uh oh! Something went wrong';
      } else if (strMsg.includes('⚠️') || strMsg.toLowerCase().includes('warning') || strMsg.toLowerCase().includes('mandatory') || strMsg.toLowerCase().includes('differs')) {
        detectedType = 'warning';
        if (!detectedTitle) detectedTitle = 'Attention Required';
      } else if (strMsg.includes('✅') || strMsg.toLowerCase().includes('success') || strMsg.toLowerCase().includes('created') || strMsg.toLowerCase().includes('verified')) {
        detectedType = 'success';
        if (!detectedTitle) detectedTitle = 'Action Successful';
      } else {
        detectedType = 'info';
        if (!detectedTitle) detectedTitle = 'System Notification';
      }
    }

    const cleanMsg = strMsg.replace(/^[✅⚠️❌📦🚚🔄📝📩]\s*/, '');
    setCustomAlert({
      title: detectedTitle || (detectedType === 'error' ? 'Uh oh! Something went wrong' : 'Notification'),
      message: cleanMsg || 'Action completed.',
      type: detectedType || 'info'
    });
  };

  const alert = (msg, title, type) => showCustomAlert(msg, title, type);

  // Handle Proforma Invoice (PI) to Sales BOM auto-conversion
  useEffect(() => {
    let pendingPi = convertingPiData;
    if (!pendingPi) {
      try {
        const saved = localStorage.getItem('controlroom_pending_pi_to_bom');
        if (saved) {
          pendingPi = JSON.parse(saved);
          localStorage.removeItem('controlroom_pending_pi_to_bom');
        }
      } catch (e) { }
    }

    if (pendingPi) {
      setShowBOMForm(true);
      const nextNum = (bomStore || []).length + 550 + Math.floor(Math.random() * 50);
      setNewBomCode(`BOM-${nextNum}`);
      if (pendingPi.customerName) setNewBomProductName(pendingPi.customerName);
      if (pendingPi.remarks) setNewBomRemarks(pendingPi.remarks);
      if (Array.isArray(pendingPi.items) && pendingPi.items.length > 0) {
        setBomMaterialsList(pendingPi.items.map(it => ({
          name: it.name || 'Structural Steel Beams',
          category: it.category || 'PI Converted Goods',
          uom: it.uom || 'NOS',
          qty: String(it.qty || '1'),
          wastage: '0%',
          rate: String(it.rate || '1000'),
          gstRate: it.gstRate || '18%'
        })));
      }
      if (typeof onClearConvertingPiData === 'function') onClearConvertingPiData();
    }

    const handleCustomConvert = (e) => {
      if (e && e.detail) {
        setShowBOMForm(true);
        const nextNum = (bomStore || []).length + 550 + Math.floor(Math.random() * 50);
        setNewBomCode(`BOM-${nextNum}`);
        if (e.detail.customerName) setNewBomProductName(e.detail.customerName);
        if (e.detail.remarks) setNewBomRemarks(e.detail.remarks);
        if (Array.isArray(e.detail.items) && e.detail.items.length > 0) {
          setBomMaterialsList(e.detail.items.map(it => ({
            name: it.name || 'Structural Steel Beams',
            category: it.category || 'PI Converted Goods',
            uom: it.uom || 'NOS',
            qty: String(it.qty || '1'),
            wastage: '0%',
            rate: String(it.rate || '1000'),
            gstRate: it.gstRate || '18%'
          })));
        }
      }
    };

    window.addEventListener('controlroom_convert_pi_bom', handleCustomConvert);
    return () => {
      window.removeEventListener('controlroom_convert_pi_bom', handleCustomConvert);
    };
  }, [convertingPiData]);

  // Open Create BOM form handler
  const handleOpenCreateBom = () => {
    setNewBomSalesPerson(getEffectiveSalesPerson());
    setNewBomProductName('');
    setBomMaterialsList([]);
    setNewBomPaymentProofDoc(null);
    setNewBomDeliveryProofDoc(null);
    setNewBomRemarks('');
    setSameAsBilling(false);
    setNewBomDeliveryStreet('');
    setNewBomDeliveryCity('');
    setNewBomDeliveryState('');
    setNewBomDeliveryPincode('');

    // Fetch next sequential BOM code from server with fallback to local store
    fetch('/api/boms/next-code')
      .then(r => r.json())
      .then(d => {
        if (d && d.nextBomCode) {
          setNewBomCode(d.nextBomCode);
        } else {
          const existingNums = (bomStore || []).map(b => parseInt(String(b.bomCode || b.code || b.id || '').replace('BOM-', ''))).filter(n => !isNaN(n));
          const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 621;
          setNewBomCode(`BOM-${maxNum + 1}`);
        }
      })
      .catch(() => {
        const existingNums = (bomStore || []).map(b => parseInt(String(b.bomCode || b.code || b.id || '').replace('BOM-', ''))).filter(n => !isNaN(n));
        const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 621;
        setNewBomCode(`BOM-${maxNum + 1}`);
      });

    setShowBOMForm(true);
  };

  // Row selection handler
  const handleSelectRowGeneric = (code) => {
    setSelectedRows(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Config for BOM Orders Table
  const isSalesBOM = activeTab === 'Sales BOM' || userRole === 'Sales Executive' || activeTab === 'Create BOM';
  const pageConfig = {
    title: activeTab === 'Sales BOM' ? 'Sales Bill of Materials (BOM)' :
           activeTab === 'BOM' ? 'Bill of Materials (BOM)' :
           activeTab === 'BOM / Routing' ? 'Bill of Materials & Production Routing' :
           activeTab === 'Create BOM' ? 'Create BOM' :
           'BOM Orders & Client Specifications',
    subtitle: (activeTab === 'Sales BOM' || isSalesBOM) ? 'Customer order BOMs, product specifications and sales quotations' :
              activeTab === 'BOM' ? 'Standard raw material consumption lists and component requirements' :
              activeTab === 'BOM / Routing' ? 'Multi-level BOM definitions, component ratios, and sequential routing processes' :
              'Create and manage customer order BOMs, product specifications, and payment terms',
    actionText: 'Create BOM',
    searchPlaceholder: `Search ${activeTab} (BOM Code, Customer Name, Product)...`,
    tabs: [
      { id: 'All', label: 'All BOMs', count: (bomStore || []).length, bg: '#e2e8f0', fg: '#475569' },
      { id: 'Draft', label: 'Draft', count: (bomStore || []).filter(b => b.status === 'Draft').length, bg: '#fff7ed', fg: '#c2410c' },
      { id: 'Pending', label: 'Pending Sales Confirmation', count: (bomStore || []).filter(b => !b.status || b.status === 'Pending Sales Confirmation' || b.status.includes('Pending Confirmation') || b.status === 'Draft').length, bg: '#fef3c7', fg: '#b45309' },
      { id: 'AddressAction', label: 'Address Proof Requested', count: (bomStore || []).filter(b => b.addressProofReuploadRequested || b.status === 'Address Proof Requested from Sales').length, bg: '#fee2e2', fg: '#b91c1c' },
      { id: 'Sent', label: 'Sales Confirmed / Forwarded', count: (bomStore || []).filter(b => b.status === 'Sales Confirmed - Sent to Dispatch' || b.status === 'Sent to Production' || b.status === 'Confirmed' || b.salesConfirmed).length, bg: '#dcfce7', fg: '#166534' },
      { id: 'Cancelled', label: 'Cancelled & Restored', count: (bomStore || []).filter(b => b.status === 'Cancelled & Stock Restored' || b.cancelled).length, bg: '#f1f5f9', fg: '#64748b' }
    ],
    headers: ['BOM Code', 'Date of Entry', 'Customer Name', 'Sales Person', 'Payment Type', 'Total (₹)', 'Status'],
    rows: (bomStore || []).filter(Boolean).map(b => {
      const isDraft = b.status === 'Draft';
      const isCancelled = b.status === 'Cancelled & Stock Restored' || b.cancelled;
      const isAddressRequested = b.addressProofReuploadRequested || b.status === 'Address Proof Requested from Sales';
      const isPending = !b.status || b.status === 'Pending Sales Confirmation' || b.status === 'Pending Confirmation' || b.status === 'Pending';
      const isPackedOrDispatch = (b.status || '').toLowerCase().includes('dispatch') || (b.status || '').toLowerCase().includes('packed') || (b.status || '').toLowerCase().includes('loading');
      const isConfirmed = b.status === 'Sales Confirmed - Sent to Dispatch' || b.status === 'Sent to Production' || b.status === 'Confirmed' || b.salesConfirmed || isPackedOrDispatch;

      let stBg = '#dcfce7';
      let stFg = '#166534';
      let stBorder = '1px solid #bbf7d0';
      let tabGroup = 'Sent';

      if (isCancelled) {
        stBg = '#f1f5f9';
        stFg = '#64748b';
        stBorder = '1px solid #cbd5e1';
        tabGroup = 'Cancelled';
      } else if (isDraft) {
        stBg = '#fff7ed';
        stFg = '#c2410c';
        stBorder = '1px solid #fed7aa';
        tabGroup = 'Draft';
      } else if (isAddressRequested) {
        stBg = '#fee2e2';
        stFg = '#b91c1c';
        stBorder = '1px solid #fca5a5';
        tabGroup = 'AddressAction';
      } else if (isPending) {
        stBg = '#fef3c7';
        stFg = '#b45309';
        stBorder = '1px solid #fde68a';
        tabGroup = 'Pending';
      } else if (isPackedOrDispatch) {
        stBg = '#e0e7ff';
        stFg = '#3730a3';
        stBorder = '1px solid #c7d2fe';
        tabGroup = 'Sent';
      }

      return {
        ...b,
        code: b.bomCode || b.code || 'BOM-101',
        c2: b.date || new Date().toISOString().split('T')[0],
        c3: b.customerName || b.companyName || 'Customer Order',
        salesPerson: (() => {
          const sp = (b.salesPerson || '').replace(/\s*\([^)]*\)/g, '').trim();
          if (!sp) return (defaultSalesPersonName || 'Sales Executive');
          return sp;
        })(),
        c4: b.paymentType || '100% Advance',
        c5: `₹ ${parseFloat(b.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        status: isAddressRequested ? 'Address Proof Requested from Sales' : (b.status || 'Pending Sales Confirmation'),
        stBg,
        stFg,
        stBorder,
        tabGroup
      };
    })
  };

  const filteredRows = (pageConfig.rows || []).filter(r => {
    const matchesSearch = !searchQueryText ||
      (r.code && r.code.toLowerCase().includes(searchQueryText.toLowerCase())) ||
      (r.c2 && r.c2.toLowerCase().includes(searchQueryText.toLowerCase())) ||
      (r.c3 && r.c3.toLowerCase().includes(searchQueryText.toLowerCase())) ||
      (r.customerName && r.customerName.toLowerCase().includes(searchQueryText.toLowerCase()));

    const subTab = (activeSubTab || 'All').toLowerCase();
    const rStatus = (r.status || '').toLowerCase();
    const rTabGroup = (r.tabGroup || '').toLowerCase();

    const matchesTab = subTab === 'all' ||
      subTab === 'all boms' ||
      rTabGroup.toLowerCase() === subTab ||
      (subTab === 'addressaction' && (r.addressProofReuploadRequested || rStatus.includes('address proof'))) ||
      (subTab.includes('cancel') && (rStatus.includes('cancel') || r.cancelled)) ||
      (subTab.includes('pending') && (rStatus.includes('pending') || rStatus.includes('draft')) && !r.cancelled) ||
      (subTab.includes('draft') && rStatus.includes('draft') && !r.cancelled) ||
      (subTab.includes('sent') && (rStatus.includes('sent') || rStatus.includes('confirm') || rStatus.includes('production') || r.salesConfirmed) && !r.cancelled);

    return matchesSearch && matchesTab;
  });

  // Calculate totals for Create BOM form
  const calculateBOMTotals = () => {
    // 1. Calculate preset kits subtotal across all preset groups that currently have items in bomMaterialsList
    const activeGroupIds = Array.from(new Set(
      (bomMaterialsList || [])
        .filter(it => it.isPresetItem)
        .map(it => it.presetGroupId || 'legacy_default')
    ));

    let kitSubtotal = 0;
    activeGroupIds.forEach(grpId => {
      const grp = presetGroups[grpId];
      if (grp) {
        const unitPrice = parseFloat(grp.kitPrice) || 0;
        const multiplier = parseInt(grp.setCount) || 1;
        kitSubtotal += (unitPrice * multiplier);
      } else if (grpId === 'legacy_default') {
        const unitPrice = (selectedPreset && presetKitPrice !== '') ? (parseFloat(presetKitPrice) || 0) : 0;
        const multiplier = parseInt(presetSetCount) || 1;
        kitSubtotal += (unitPrice * multiplier);
      }
    });

    // 2. Individual items subtotal (exclude preset items because their cost is in kitSubtotal)
    const itemsSub = (bomMaterialsList || []).reduce((acc, item) => {
      if (item.isPresetItem) return acc;
      const q = parseFloat(item.qty) || 0;
      const r = parseFloat(item.rate) || 0;
      return acc + (q * r);
    }, 0);

    const sub = itemsSub + kitSubtotal;
    const disc = 0;

    // 3. GST: Custom item GSTs + Preset kits GST (dynamically from each preset's selected gstRate)
    const itemsGst = (bomMaterialsList || []).reduce((acc, item) => {
      if (item.isPresetItem) return acc;
      const q = parseFloat(item.qty) || 0;
      const r = parseFloat(item.rate) || 0;
      const rowTot = q * r;
      const pct = parseFloat(String(item.gstRate || '18%').replace('%', '')) || 18;
      return acc + (rowTot * (pct / 100));
    }, 0);

    let kitGst = 0;
    activeGroupIds.forEach(grpId => {
      const grp = presetGroups[grpId];
      let gRateStr = grp?.gstRate;
      if (!gRateStr) {
        const firstItem = (bomMaterialsList || []).find(it => (it.presetGroupId || 'legacy_default') === grpId);
        gRateStr = firstItem?.gstRate || '18%';
      }
      const gPct = parseFloat(String(gRateStr).replace('%', '')) || 0;
      let groupTotal = 0;
      if (grp) {
        const unitPrice = parseFloat(grp.kitPrice) || 0;
        const multiplier = parseInt(grp.setCount) || 1;
        groupTotal = unitPrice * multiplier;
      } else if (grpId === 'legacy_default') {
        const unitPrice = (selectedPreset && presetKitPrice !== '') ? (parseFloat(presetKitPrice) || 0) : 0;
        const multiplier = parseInt(presetSetCount) || 1;
        groupTotal = unitPrice * multiplier;
      }
      kitGst += groupTotal * (gPct / 100);
    });

    const gst = itemsGst + kitGst;

    const grand = sub - disc + gst;
    const cgst = gst / 2;
    const sgst = gst / 2;
    return {
      sub: isNaN(sub) ? 0 : sub,
      kitSubtotal: isNaN(kitSubtotal) ? 0 : kitSubtotal,
      disc: isNaN(disc) ? 0 : disc,
      gst: isNaN(gst) ? 0 : gst,
      grand: isNaN(grand) ? 0 : grand,
      cgst: isNaN(cgst) ? 0 : cgst,
      sgst: isNaN(sgst) ? 0 : sgst
    };
  };

  const totals = calculateBOMTotals();

  // Helper to render Document Preview Modal consistently across all views & forms
  const renderDocPreviewModal = () => {
    if (!previewDocModal) return null;
    const rawDoc = previewDocModal.doc;
    const docTitle = previewDocModal.title || 'Document Preview';
    const docName = typeof rawDoc === 'string' ? rawDoc : (rawDoc?.name || 'Uploaded File');

    let resolvedData = null;
    if (typeof rawDoc === 'string') {
      if (rawDoc.startsWith('data:') || rawDoc.startsWith('http://') || rawDoc.startsWith('https://') || rawDoc.startsWith('blob:')) {
        resolvedData = rawDoc;
      } else {
        resolvedData = getMediaFromCache(rawDoc);
      }
    } else if (rawDoc && typeof rawDoc === 'object') {
      resolvedData = rawDoc.dataUrl || rawDoc.url || rawDoc.fileData || rawDoc.proofDocData || (rawDoc.name ? getMediaFromCache(rawDoc.name) : null);
      if (!resolvedData && rawDoc instanceof Blob) {
        try {
          resolvedData = URL.createObjectURL(rawDoc);
        } catch (e) { }
      }
    }

    const isImg = Boolean(
      resolvedData && (
        resolvedData.startsWith('data:image/') ||
        rawDoc?.type?.startsWith('image/') ||
        /\.(jpg|jpeg|png|webp|gif|bmp|svg)($|\?)/i.test(docName) ||
        /\.(jpg|jpeg|png|webp|gif|bmp|svg)($|\?)/i.test(resolvedData)
      )
    );

    const isVid = Boolean(
      resolvedData && (
        resolvedData.startsWith('data:video/') ||
        rawDoc?.type?.startsWith('video/') ||
        /\.(mp4|webm|mov|mkv|avi)($|\?)/i.test(docName) ||
        /\.(mp4|webm|mov|mkv|avi)($|\?)/i.test(resolvedData)
      )
    );

    return (
      <div
        onClick={() => setPreviewDocModal(null)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15,23,42,0.75)',
          backdropFilter: 'blur(3px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            border: '1px solid #E2E8F0'
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{docTitle}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B', wordBreak: 'break-all' }}>{docName}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {resolvedData && (
                <a
                  href={resolvedData}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={docName || 'document'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#0E7490',
                    backgroundColor: '#ECFEFF',
                    border: '1px solid #A5F3FC',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} /> Open / Download
                </a>
              )}
              <button
                onClick={() => setPreviewDocModal(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '8px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px', backgroundColor: '#0F172A' }}>
            {!resolvedData ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                <p style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#F1F5F9' }}>No visual preview available</p>
                <p style={{ fontSize: '12px', marginTop: '6px' }}>Attached file: {docName}</p>
              </div>
            ) : isImg ? (
              <img
                src={resolvedData}
                alt={docName}
                style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.5)' }}
              />
            ) : isVid ? (
              <video
                controls
                autoPlay
                src={resolvedData}
                style={{ maxWidth: '100%', maxHeight: '68vh', borderRadius: '8px', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.5)' }}
              />
            ) : (
              <iframe
                src={resolvedData}
                title={docName}
                style={{ width: '100%', height: '580px', border: 'none', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
              />
            )}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {rawDoc?.size ? `Size: ${rawDoc.size}` : ''}
            </span>
            <button
              onClick={() => setPreviewDocModal(null)}
              style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#334155', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER 1: FULL CREATE BOM FORM
  // ==========================================
  if (showBOMForm) {
    const handleAddMaterialRow = () => {
      setBomMaterialsList(prev => [...(prev || []), { name: '', category: '', uom: 'NOS', qty: '1', wastage: '0%', rate: '', gstRate: '18%' }]);
    };

    const handleAddPresetToOrder = (presetId, targetPreset, setsCount) => {
      if (!targetPreset || !targetPreset.items || targetPreset.items.length === 0) return;
      const groupId = 'preset_grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const multiplier = Math.max(1, parseInt(setsCount) || 1);

      let defaultPrice = '';
      if (targetPreset.price || targetPreset.rate) {
        defaultPrice = String(targetPreset.price || targetPreset.rate);
      } else {
        const origSum = targetPreset.items.reduce((acc, it) => acc + (parseFloat(it.qty || 1) * parseFloat(it.rate || 0)), 0);
        defaultPrice = origSum > 0 ? String(origSum) : '';
      }

      const presetName = targetPreset.label || presetId;
      const initialGstRate = targetPreset.gstRate || targetPreset.gst || '18%';

      setPresetGroups(prev => ({
        ...prev,
        [groupId]: {
          groupId,
          presetId,
          presetName,
          setCount: multiplier,
          kitPrice: defaultPrice,
          gstRate: initialGstRate
        }
      }));

      const newItems = targetPreset.items.map(it => {
        const baseQ = parseFloat(it.qty) || 1;
        return {
          ...it,
          presetGroupId: groupId,
          presetName,
          baseQty: baseQ,
          qty: String(Math.round(baseQ * multiplier)),
          rate: '0',
          gstRate: it.gstRate || initialGstRate,
          isPresetItem: true
        };
      });

      setBomMaterialsList(prev => [...(prev || []), ...newItems]);
      setSelectedPreset('');
      setPresetSetCount(1);
    };

    const handleRemovePresetGroup = (groupId) => {
      setBomMaterialsList(prev => (prev || []).filter(item => (item.presetGroupId || 'legacy_default') !== groupId));
      setPresetGroups(prev => {
        const updated = { ...prev };
        delete updated[groupId];
        return updated;
      });
    };

    const handleRemoveMaterialRow = (idx) => {
      const itemToRemove = bomMaterialsList[idx];
      setBomMaterialsList(prev => {
        const updated = (prev || []).filter((_, i) => i !== idx);
        if (itemToRemove && itemToRemove.presetGroupId) {
          const remainingInGroup = updated.filter(it => it.presetGroupId === itemToRemove.presetGroupId);
          if (remainingInGroup.length === 0) {
            setPresetGroups(pgPrev => {
              const c = { ...pgPrev };
              delete c[itemToRemove.presetGroupId];
              return c;
            });
          }
        }
        return updated;
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '16px', boxSizing: 'border-box' }}>
        {/* Top Page Title Bar with Action Buttons */}
        <div style={{
          background: 'linear-gradient(135deg, #075985 0%, #0E7490 50%, #0891B2 100%)',
          borderRadius: '18px',
          padding: '24px 28px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(14, 116, 144, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
                Create Sales Bill of Materials (BOM)
              </h1>
              <p style={{ fontSize: '13px', color: '#CFFAFE', margin: '4px 0 0 0' }}>
                Configure customer order, specify delivery destination, upload document proofs, & compile BOM preset items
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setBomConfirmModal('cancel')}
              style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#FFFFFF', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => setBomConfirmModal('draft')}
              style={{ border: 'none', background: '#FFFFFF', color: '#0E7490', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
              <FileText style={{ width: '15px', height: '15px' }} />
              Save as Draft
            </button>
            <button
              onClick={() => {
                if (!newBomProductName || !newBomProductName.trim()) {
                  alert('⚠️ Please select or enter a Customer Name before creating the BOM order.');
                  return;
                }
                if (!bomMaterialsList || bomMaterialsList.length === 0) {
                  alert('⚠️ Please add at least one Product / Item to the BOM materials list.');
                  return;
                }
                setBomConfirmModal('create');
              }}
              style={{ border: 'none', background: '#10B981', color: 'white', padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckCircle style={{ width: '16px', height: '16px' }} />
              Create Order →
            </button>
          </div>
        </div>

        {/* SECTION 1: ORDER INFORMATION */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
              1
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ORDER INFORMATION
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Order Date</label>
              <input
                type="date"
                value={new Date().toISOString().split('T')[0]}
                disabled
                readOnly
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#64748B', backgroundColor: '#F1F5F9', cursor: 'not-allowed', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Delivery Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                placeholder="Select date"
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', backgroundColor: 'white', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Order Number</label>
              <input
                type="text"
                value={newBomCode}
                readOnly
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#94A3B8', backgroundColor: '#F8FAFC', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Sales Person / Creator <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={newBomSalesPerson || defaultSalesPersonName}
                title="Creator name is tied to the logged-in account and cannot be modified"
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#475569',
                  backgroundColor: '#F1F5F9',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CUSTOMER INFORMATION & ADDRESSES */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
              2
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              CUSTOMER INFORMATION
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Customer Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                list="bom-customer-name-suggestions"
                placeholder="Type or select customer from list..."
                value={newBomProductName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewBomProductName(val);
                  const target = (val || '').toLowerCase().trim();
                  if (!target) return;

                  const chosen = customerList.find(c => {
                    const code = (c.code || '').toLowerCase().trim();
                    const c2 = (c.c2 || '').toLowerCase().trim();
                    const cName = (c.customerName || '').toLowerCase().trim();
                    const comp = (c.companyName || '').toLowerCase().trim();
                    return code === target || c2 === target || cName === target || comp === target ||
                           (code && code.startsWith(target)) || (c2 && c2.startsWith(target)) ||
                           (cName && cName.startsWith(target)) || (comp && comp.startsWith(target)) ||
                           (c2 && c2.includes(target)) || (comp && comp.includes(target));
                  });

                  if (chosen) {
                    const bObj = chosen.billingAddressObj || {};
                    const bAddr = bObj.address || chosen.c6 || chosen.billingAddress || chosen.address || '';
                    const dObj = chosen.deliveryAddressObj || {};
                    const dAddr = dObj.address || chosen.c7 || chosen.deliveryAddress || chosen.dispatchAddress || '';

                    const clean = (s) => String(s || '').trim().toLowerCase();
                    const isSame = !dAddr || (
                      clean(dAddr) === clean(bAddr) &&
                      clean(dObj.city || chosen.city || '') === clean(bObj.city || chosen.city || '') &&
                      clean(dObj.state || chosen.state || '') === clean(bObj.state || chosen.state || '') &&
                      clean(dObj.pincode || chosen.pincode || '') === clean(bObj.pincode || chosen.pincode || '')
                    );

                    setSameAsBilling(isSame);
                    setNewBomDeliveryProofDoc(null);
                    if (dAddr && !isSame) {
                      setNewBomDeliveryStreet(dObj.address || chosen.c7 || chosen.deliveryAddress || chosen.dispatchAddress || '');
                      setNewBomDeliveryCity(dObj.city || chosen.dispatchCity || chosen.city || '');
                      setNewBomDeliveryState(dObj.state || chosen.dispatchState || chosen.state || '');
                      setNewBomDeliveryPincode(dObj.pincode || chosen.dispatchPincode || chosen.pincode || '');
                    } else {
                      setNewBomDeliveryStreet(bObj.address || chosen.c6 || chosen.billingAddress || chosen.address || '');
                      setNewBomDeliveryCity(bObj.city || chosen.city || '');
                      setNewBomDeliveryState(bObj.state || chosen.state || '');
                      setNewBomDeliveryPincode(bObj.pincode || chosen.pincode || '');
                    }
                  }
                }}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', backgroundColor: 'white', boxSizing: 'border-box', outline: 'none' }}
              />
              <datalist id="bom-customer-name-suggestions">
                {customerList.map((c, idx) => {
                  const val = c.code || c.customerName || c.companyName;
                  const label = c.c2 || c.companyName;
                  return (
                    <option key={idx} value={val}>
                      {label && label !== val ? `${val} (${label})` : val}
                    </option>
                  );
                })}
              </datalist>
            </div>
          </div>

          {(() => {
            const target = (newBomProductName || '').toLowerCase().trim();
            const selCust = target ? customerList.find(c => {
              const code = (c.code || '').toLowerCase().trim();
              const c2 = (c.c2 || '').toLowerCase().trim();
              const cName = (c.customerName || '').toLowerCase().trim();
              const comp = (c.companyName || '').toLowerCase().trim();
              return code === target || c2 === target || cName === target || comp === target ||
                     (code && code.startsWith(target)) || (c2 && c2.startsWith(target)) ||
                     (cName && cName.startsWith(target)) || (comp && comp.startsWith(target)) ||
                     (c2 && c2.includes(target)) || (comp && comp.includes(target));
            }) : null;

            const companyName = selCust ? (selCust.c2 || selCust.companyName || selCust.customerName || selCust.code) : (newBomProductName || '—');
            const mobileNo = selCust ? (selCust.c4 || selCust.primaryContact?.phone || selCust.phone || selCust.primaryContact?.whatsapp || '—') : '—';
            const emailAddr = selCust ? (selCust.c5 || selCust.primaryContact?.email || selCust.email || '—') : '—';

            const bObj = selCust?.billingAddressObj || {};
            const billingStreet = bObj.address || selCust?.c6 || selCust?.billingAddress || selCust?.address || '—';
            const billingCity = bObj.city || selCust?.city || '—';
            const billingState = bObj.state || selCust?.state || '—';
            const billingPincode = bObj.pincode || selCust?.pincode || '—';

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Company Name</label>
                    <input type="text" value={companyName} readOnly style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#64748B', backgroundColor: '#F8FAFC', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Mobile Number</label>
                    <input type="text" value={mobileNo} readOnly style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#64748B', backgroundColor: '#F8FAFC', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Email</label>
                    <input type="text" value={emailAddr} readOnly style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#64748B', backgroundColor: '#F8FAFC', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Billing Address Card */}
                  <div style={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                        <FileText style={{ width: '14px', height: '14px' }} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Billing Address</h4>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>Primary address for invoices & tax records</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Address</label>
                      <input type="text" readOnly value={billingStreet} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '12px', color: '#475569', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>City</label>
                        <input type="text" readOnly value={billingCity} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '12px', color: '#475569', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>State</label>
                        <input type="text" readOnly value={billingState} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '12px', color: '#475569', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Pincode</label>
                        <input type="text" readOnly value={billingPincode} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '12px', color: '#475569', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Card */}
                  <div style={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: '#ECFEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0E7490' }}>
                          <Truck style={{ width: '14px', height: '14px' }} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Delivery Address</h4>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>Destination for physical dispatch</span>
                        </div>
                      </div>

                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#0E7490', cursor: 'pointer', backgroundColor: '#ECFEFF', padding: '4px 10px', borderRadius: '8px', border: '1px solid #A5F3FC' }}>
                        <input
                          type="checkbox"
                          checked={sameAsBilling}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSameAsBilling(checked);
                            if (checked) {
                              setNewBomDeliveryStreet(billingStreet !== '—' ? billingStreet : '');
                              setNewBomDeliveryCity(billingCity !== '—' ? billingCity : '');
                              setNewBomDeliveryState(billingState !== '—' ? billingState : '');
                              setNewBomDeliveryPincode(billingPincode !== '—' ? billingPincode : '');
                              setNewBomDeliveryProofDoc(null);
                            } else {
                              setNewBomDeliveryStreet('');
                              setNewBomDeliveryCity('');
                              setNewBomDeliveryState('');
                              setNewBomDeliveryPincode('');
                            }
                          }}
                          style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                        />
                        Same as Billing
                      </label>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Plot No 42, SIDCO Industrial Estate, Ambattur"
                        value={sameAsBilling ? (billingStreet !== '—' ? billingStreet : '') : newBomDeliveryStreet}
                        disabled={sameAsBilling}
                        onChange={(e) => setNewBomDeliveryStreet(e.target.value)}
                        style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: sameAsBilling ? '#64748B' : '#0F172A', backgroundColor: sameAsBilling ? '#F1F5F9' : '#FFFFFF', boxSizing: 'border-box', outline: 'none', cursor: sameAsBilling ? 'not-allowed' : 'text' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>City</label>
                        <input type="text" placeholder="e.g. Chennai" value={sameAsBilling ? (billingCity !== '—' ? billingCity : '') : newBomDeliveryCity} disabled={sameAsBilling} onChange={(e) => setNewBomDeliveryCity(e.target.value)} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: sameAsBilling ? '#64748B' : '#0F172A', backgroundColor: sameAsBilling ? '#F1F5F9' : '#FFFFFF', boxSizing: 'border-box', outline: 'none', cursor: sameAsBilling ? 'not-allowed' : 'text' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>State</label>
                        <input type="text" placeholder="e.g. Tamil Nadu" value={sameAsBilling ? (billingState !== '—' ? billingState : '') : newBomDeliveryState} disabled={sameAsBilling} onChange={(e) => setNewBomDeliveryState(e.target.value)} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: sameAsBilling ? '#64748B' : '#0F172A', backgroundColor: sameAsBilling ? '#F1F5F9' : '#FFFFFF', boxSizing: 'border-box', outline: 'none', cursor: sameAsBilling ? 'not-allowed' : 'text' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Pincode</label>
                        <input type="text" placeholder="e.g. 600058" value={sameAsBilling ? (billingPincode !== '—' ? billingPincode : '') : newBomDeliveryPincode} disabled={sameAsBilling} onChange={(e) => setNewBomDeliveryPincode(e.target.value)} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: sameAsBilling ? '#64748B' : '#0F172A', backgroundColor: sameAsBilling ? '#F1F5F9' : '#FFFFFF', boxSizing: 'border-box', outline: 'none', cursor: sameAsBilling ? 'not-allowed' : 'text' }} />
                      </div>
                    </div>
                    {(() => {
                      const effectiveDeliveryStreet = sameAsBilling ? (billingStreet !== '—' ? billingStreet : '') : newBomDeliveryStreet;
                      const effectiveDeliveryCity = sameAsBilling ? (billingCity !== '—' ? billingCity : '') : newBomDeliveryCity;
                      const effectiveDeliveryState = sameAsBilling ? (billingState !== '—' ? billingState : '') : newBomDeliveryState;
                      const effectiveDeliveryPincode = sameAsBilling ? (billingPincode !== '—' ? billingPincode : '') : newBomDeliveryPincode;

                      const clean = (str) => String(str || '').trim().toLowerCase();
                      const hasEnteredDeliveryAddress = Boolean(clean(effectiveDeliveryStreet) || clean(effectiveDeliveryCity) || clean(effectiveDeliveryPincode));

                      // Check if delivery matches billing
                      const isMatchingBilling = Boolean(sameAsBilling) || (
                        hasEnteredDeliveryAddress &&
                        clean(effectiveDeliveryStreet) === clean(billingStreet !== '—' ? billingStreet : '') &&
                        clean(effectiveDeliveryCity) === clean(billingCity !== '—' ? billingCity : '') &&
                        clean(effectiveDeliveryState) === clean(billingState !== '—' ? billingState : '') &&
                        clean(effectiveDeliveryPincode) === clean(billingPincode !== '—' ? billingPincode : '')
                      );

                      // ONLY render proof uploader if addresses do NOT match AND user has specified a different delivery destination
                      if (isMatchingBilling || !hasEnteredDeliveryAddress) {
                        return null;
                      }

                      return (
                        <div style={{ marginTop: '6px', padding: '14px 16px', backgroundColor: '#FEF2F2', border: '1px dashed #F87171', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertCircle style={{ width: '14px', height: '14px' }} />
                              </div>
                              <div>
                                <h5 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                                  Delivery Address Proof Document <span style={{ color: '#64748B', fontWeight: '600' }}>(Optional)</span>
                                </h5>
                                <span style={{ fontSize: '11px', color: '#64748B' }}>
                                  Delivery address differs from billing address. Upload proof (GST / Electricity Bill / Consignee Lease) if available.
                                </span>
                              </div>
                            </div>
                            {newBomDeliveryProofDoc && (
                              <span style={{ fontSize: '11px', fontWeight: '800', color: '#166534', backgroundColor: '#DCFCE7', padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle style={{ width: '12px', height: '12px' }} /> Attached
                              </span>
                            )}
                          </div>

                          {newBomDeliveryProofDoc ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FECACA' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText style={{ width: '16px', height: '16px', color: '#DC2626' }} />
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>{newBomDeliveryProofDoc.name}</div>
                                  <div style={{ fontSize: '10px', color: '#64748B' }}>{newBomDeliveryProofDoc.size || '1.2 MB'} • Uploaded</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocModal({ title: 'Delivery Address Proof Document', doc: newBomDeliveryProofDoc })}
                                  style={{ border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px' }}
                                >
                                  <Eye style={{ width: '13px', height: '13px' }} /> View Image
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewBomDeliveryProofDoc(null)}
                                  style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Trash2 style={{ width: '13px', height: '13px' }} /> Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files && e.dataTransfer.files[0];
                                if (file) {
                                  compressAndSaveFile(file, (docMeta) => {
                                    if (docMeta) {
                                      if (docMeta.name && docMeta.dataUrl) saveMediaToCache(docMeta.name, docMeta.dataUrl);
                                      setNewBomDeliveryProofDoc(docMeta);
                                    }
                                  });
                                }
                              }}
                              style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '16px 20px', textAlign: 'center', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                            >
                              <UploadCloud style={{ width: '28px', height: '28px', color: '#DC2626' }} />
                              <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                                Drag & drop address proof document here or
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFFFFF', border: '1px solid #DC2626', color: '#DC2626', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                  <Upload style={{ width: '13px', height: '13px' }} />
                                  Browse Files
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files && e.target.files[0];
                                      if (file) {
                                        compressAndSaveFile(file, (docMeta) => {
                                          if (docMeta) {
                                            if (docMeta.name && docMeta.dataUrl) saveMediaToCache(docMeta.name, docMeta.dataUrl);
                                            setNewBomDeliveryProofDoc(docMeta);
                                          }
                                        });
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                              <span style={{ fontSize: '11px', color: '#94A3B8' }}>Supported: PDF, JPG, PNG (720p HD auto-compressed)</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* SECTION 3: ORDER ITEMS & BILL OF MATERIALS */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
          {/* Section 3 Header — Clean Single Row */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', gap: '20px', flexWrap: 'wrap', borderBottom: '1px solid #F1F5F9' }}>
            {/* Left: Badge + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>3</div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ORDER ITEMS & BILL OF MATERIALS</span>
            </div>

            {/* Preset Pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', backgroundColor: '#ECFEFF', padding: '0 16px', borderRadius: '20px', height: '40px', border: '1px solid #CFFAFE' }}>
              <Layers style={{ width: '15px', height: '15px', color: '#0E7490' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0E7490' }}>Preset:</span>
            </div>

            {/* Searchable Preset Selector */}
            <SearchablePresetSelector
              value={selectedPreset}
              activePresetsMap={activePresetsMap}
              accentColor="#0E7490"
              width="380px"
              placeholder="Pick a Preset to add..."
              style={{ height: '40px' }}
              onChange={(val, targetPreset) => {
                if (val && targetPreset && targetPreset.items) {
                  handleAddPresetToOrder(val, targetPreset, 1);
                } else if (!val) {
                  setSelectedPreset('');
                }
              }}
            />

            {/* Clear Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedBomItemIndexes.length > 0) {
                  setBomMaterialsList(prev => prev.filter((_, idx) => !selectedBomItemIndexes.includes(idx)));
                  setSelectedBomItemIndexes([]);
                } else {
                  if (bomMaterialsList.length > 0) setShowClearConfirmModal(true);
                }
              }}
              title={selectedBomItemIndexes.length > 0 ? `Remove ${selectedBomItemIndexes.length} selected item(s)` : 'Clear all order items'}
              style={{ border: 'none', backgroundColor: selectedBomItemIndexes.length > 0 ? '#EF4444' : '#FFE4E6', color: selectedBomItemIndexes.length > 0 ? 'white' : '#E11D48', width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          {/* Active Preset Badges / Pills */}
          {Object.values(presetGroups).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '12px 24px 0 24px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Active Presets in Order:</span>
              {Object.values(presetGroups).map(grp => (
                <span
                  key={grp.groupId}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#ECFEFF',
                    color: '#0E7490',
                    border: '1px solid #A5F3FC',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  <Layers size={13} style={{ color: '#0E7490' }} />
                  {grp.presetName} ({grp.setCount} Set{grp.setCount > 1 ? 's' : ''})
                  <button
                    type="button"
                    onClick={() => handleRemovePresetGroup(grp.groupId)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 0 0 2px', display: 'flex', alignItems: 'center', color: '#0891B2' }}
                    title={`Remove ${grp.presetName}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Section 3 Content */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Clear confirm modal */}
          {showClearConfirmModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle style={{ width: '20px', height: '20px' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Clear All Order Items?</h3>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Are you sure you want to delete all items from this BOM list?</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setShowClearConfirmModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => { setBomMaterialsList([]); setSelectedPreset(''); setPresetGroups({}); setPresetKitPrice(''); setPresetSetCount(1); setSelectedBomItemIndexes([]); setShowClearConfirmModal(false); }} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#DC2626', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Clear All Items</button>
                </div>
              </div>
            </div>
          )}

          {/* Clean Modern Items Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#475569', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', width: '30px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={bomMaterialsList.length > 0 && selectedBomItemIndexes.length === bomMaterialsList.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBomItemIndexes(bomMaterialsList.map((_, idx) => idx));
                        } else {
                          setSelectedBomItemIndexes([]);
                        }
                      }}
                      style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '30%' }}>Product / Item <span style={{ color: '#EF4444' }}>*</span></th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%' }}>UOM</th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '8%', textAlign: 'center' }}>Qty <span style={{ color: '#EF4444' }}>*</span></th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%' }}>Price (₹)</th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%', textAlign: 'center' }}>GST Rate</th>
                  {bomMaterialsList.some(it => it.isPresetItem) && <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%', color: '#0E7490', backgroundColor: '#ECFEFF' }}>Preset Amt (₹)</th>}
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '11%', textAlign: 'right' }}>Taxable (₹)</th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '11%', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '4%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bomMaterialsList.length === 0 ? (
                  <tr>
                    <td colSpan={bomMaterialsList.some(it => it.isPresetItem) ? 10 : 9} style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
                      No items added yet. Pick a preset above or click <strong>+ Add Product / Item</strong> below.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const hasAnyPreset = bomMaterialsList.some(it => it.isPresetItem);
                    return bomMaterialsList.map((item, i) => {
                    const q = parseFloat(item.qty) || 0;
                    const r = parseFloat(item.rate) || 0;
                    const taxable = q * r;
                    const gstPct = parseFloat(String(item.gstRate || '18%').replace('%', '')) || 18;
                    const gstAmt = taxable * (gstPct / 100);
                    const rowTot = taxable + gstAmt;
                    const isChecked = selectedBomItemIndexes.includes(i);

                    const isPresetItem = Boolean(item.isPresetItem);
                    const groupId = item.presetGroupId || (isPresetItem ? 'legacy_default' : null);
                    const groupItems = isPresetItem ? bomMaterialsList.filter(it => (it.presetGroupId || 'legacy_default') === groupId) : [];
                    const isFirstInGroup = isPresetItem && bomMaterialsList.findIndex(it => (it.presetGroupId || 'legacy_default') === groupId) === i;
                    const groupCount = groupItems.length;
                    const currentGroup = (groupId && presetGroups[groupId]) || {
                      groupId: groupId || 'legacy_default',
                      presetName: item.presetName || selectedPreset || 'Preset Kit',
                      setCount: presetSetCount || 1,
                      kitPrice: presetKitPrice || ''
                    };

                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isChecked ? '#ECFEFF' : (i % 2 === 1 ? '#FAFBFC' : 'white') }}>
                        <td style={{ padding: '12px 10px', textAlign: 'center', borderLeft: isChecked ? '4px solid #0E7490' : '4px solid transparent' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedBomItemIndexes(prev => [...prev, i]);
                              else setSelectedBomItemIndexes(prev => prev.filter(idx => idx !== i));
                            }}
                            style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {/* Line 1: Product / Item Name */}
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                list={`product-list-${i}`}
                                placeholder="Type or select product / item..."
                                value={item.name || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const matched = (itemsList || []).find(it => (it.name || '').toLowerCase() === val.toLowerCase() || (it.code || '').toLowerCase() === val.toLowerCase());
                                  setBomMaterialsList(prev => prev.map((mat, idx) => idx === i ? {
                                    ...mat,
                                    name: matched ? matched.name : val,
                                    rate: matched ? String(matched.price || matched.rate || mat.rate) : mat.rate,
                                    uom: matched ? (matched.uom || matched.unit || mat.uom) : mat.uom,
                                    category: matched ? (matched.category || matched.description || mat.category) : mat.category
                                  } : mat));
                                }}
                                style={{ width: '100%', height: '34px', borderRadius: '7px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '13px', backgroundColor: 'white', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }}
                              />
                              <datalist id={`product-list-${i}`}>
                                {(itemsList || []).map((prod, pidx) => {
                                  const st = Number(prod.stock !== undefined ? prod.stock : (prod.availableStock !== undefined ? prod.availableStock : 0));
                                  const isOutOfStock = st <= 0;
                                  const stockLabel = isOutOfStock ? '⚠️ (Stock: 0 / BLOCKED)' : `✓ (Available Stock: ${st.toLocaleString()} ${prod.uom || 'NOS'})`;
                                  return (
                                    <option key={pidx} value={prod.name}>
                                      {prod.code ? `[${prod.code}] ${prod.name} ${stockLabel}` : `${prod.name} ${stockLabel}`}
                                    </option>
                                  );
                                })}
                              </datalist>
                            </div>
                            {/* Line 2: Description */}
                            <input
                              type="text"
                              placeholder="Description..."
                              value={item.category || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBomMaterialsList(prev => prev.map((mat, idx) => idx === i ? { ...mat, category: val } : mat));
                              }}
                              style={{ width: '100%', height: '28px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '11px', color: '#64748B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <input
                            type="text"
                            list={`uom-list-${i}`}
                            placeholder="UOM"
                            value={item.uom || 'NOS'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBomMaterialsList(prev => prev.map((mat, idx) => idx === i ? { ...mat, uom: val } : mat));
                            }}
                            style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '12px', textAlign: 'center', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF', fontWeight: '600' }}
                          />
                          <datalist id={`uom-list-${i}`}>
                            <option value="NOS" />
                            <option value="SET" />
                            <option value="KG" />
                            <option value="MTR" />
                            <option value="PCS" />
                            <option value="BOX" />
                            <option value="PKT" />
                            <option value="PAIR" />
                          </datalist>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <input
                            type="number"
                            value={item.qty}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value;
                              setBomMaterialsList(prev => prev.map((mat, idx) => idx === i ? { ...mat, qty: val } : mat));
                            }}
                            style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '13px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {isPresetItem ? (
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>—</span>
                          ) : (
                            <input
                              type="number"
                              value={item.rate}
                              placeholder="0.00"
                              onChange={(e) => {
                                const val = e.target.value;
                                setBomMaterialsList(prev => prev.map((mat, idx) => idx === i ? { ...mat, rate: val } : mat));
                              }}
                              style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '13px', textAlign: 'right', outline: 'none', boxSizing: 'border-box' }}
                            />
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <select
                            value={item.gstRate || (currentGroup && currentGroup.gstRate) || '18%'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (isPresetItem && groupId) {
                                setBomMaterialsList(prev => prev.map((mat, idx) =>
                                  ((mat.presetGroupId || 'legacy_default') === groupId || idx === i)
                                    ? { ...mat, gstRate: val }
                                    : mat
                                ));
                                setPresetGroups(prev => ({
                                  ...prev,
                                  [groupId]: { ...(prev[groupId] || currentGroup), gstRate: val }
                                }));
                              } else {
                                setBomMaterialsList(prev => prev.map((mat, idx) => idx === i ? { ...mat, gstRate: val } : mat));
                              }
                            }}
                            style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #C7D2FE', padding: '0 6px', fontSize: '12px', fontWeight: '700', color: '#4338CA', backgroundColor: '#EEF2FF', outline: 'none', cursor: 'pointer', textAlign: 'center' }}
                          >
                            <option value="18%">18% GST</option>
                            <option value="12%">12% GST</option>
                            <option value="5%">5% GST</option>
                            <option value="0%">0% Exempt</option>
                          </select>
                        </td>
                        {hasAnyPreset && (() => {
                          if (isPresetItem) {
                            if (isFirstInGroup) {
                              return (
                                <td
                                  rowSpan={groupCount}
                                  style={{
                                    padding: '12px 10px',
                                    verticalAlign: 'middle',
                                    backgroundColor: '#EEF2FF',
                                    borderLeft: '2px solid #C7D2FE',
                                    borderRight: '2px solid #C7D2FE'
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        color: '#4338CA',
                                        textAlign: 'center',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '120px',
                                        display: 'block'
                                      }}
                                      title={currentGroup.presetName}
                                    >
                                      {currentGroup.presetName}
                                    </span>

                                    <div style={{ position: 'relative', width: '100%' }}>
                                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: '700', color: '#6366F1', pointerEvents: 'none' }}>₹</span>
                                      <input
                                        type="number"
                                        value={currentGroup.kitPrice}
                                        placeholder="0.00"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (groupId) {
                                            setPresetGroups(prev => ({
                                              ...prev,
                                              [groupId]: { ...(prev[groupId] || currentGroup), kitPrice: val }
                                            }));
                                          }
                                          setPresetKitPrice(val);
                                        }}
                                        style={{
                                          width: '100%', height: '42px', borderRadius: '8px',
                                          border: '2px solid #818CF8', padding: '0 10px 0 26px',
                                          fontSize: '15px', fontWeight: '800', color: '#312E81',
                                          textAlign: 'right', outline: 'none', boxSizing: 'border-box',
                                          backgroundColor: 'white'
                                        }}
                                      />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <span style={{ fontSize: '11px', color: '#6366F1', fontWeight: '600' }}>
                                        {groupCount} items ×
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        max="999"
                                        value={currentGroup.setCount !== undefined && currentGroup.setCount !== null ? currentGroup.setCount : ''}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                          const rawVal = e.target.value;
                                          if (rawVal === '') {
                                            if (groupId) {
                                              setPresetGroups(prev => ({
                                                ...prev,
                                                [groupId]: { ...(prev[groupId] || currentGroup), setCount: '' }
                                              }));
                                            }
                                            return;
                                          }
                                          const parsed = parseInt(rawVal);
                                          const valToSave = isNaN(parsed) ? '' : Math.max(0, parsed);
                                          if (groupId) {
                                            setPresetGroups(prev => ({
                                              ...prev,
                                              [groupId]: { ...(prev[groupId] || currentGroup), setCount: valToSave }
                                            }));
                                          }
                                          const multiplier = isNaN(parsed) ? 0 : Math.max(0, parsed);
                                          setBomMaterialsList(prev => prev.map(mat => {
                                            if ((mat.presetGroupId || 'legacy_default') === groupId && mat.baseQty) {
                                              return { ...mat, qty: String(Math.round(mat.baseQty * multiplier)) };
                                            }
                                            return mat;
                                          }));
                                        }}
                                        onBlur={() => {
                                          const current = currentGroup.setCount;
                                          const finalCount = (current === '' || isNaN(parseInt(current)) || parseInt(current) < 0) ? 1 : Math.max(0, parseInt(current));
                                          if (groupId) {
                                            setPresetGroups(prev => ({
                                              ...prev,
                                              [groupId]: { ...(prev[groupId] || currentGroup), setCount: finalCount }
                                            }));
                                          }
                                          setBomMaterialsList(prev => prev.map(mat => {
                                            if ((mat.presetGroupId || 'legacy_default') === groupId && mat.baseQty) {
                                              return { ...mat, qty: String(Math.round(mat.baseQty * finalCount)) };
                                            }
                                            return mat;
                                          }));
                                        }}
                                        style={{
                                          width: '42px', height: '26px', borderRadius: '6px',
                                          border: '1.5px solid #818CF8', fontSize: '13px',
                                          fontWeight: '800', color: '#312E81', textAlign: 'center',
                                          padding: '0 2px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box'
                                        }}
                                        title="Sets multiplier for this preset"
                                      />
                                      <span style={{ fontSize: '11px', color: '#6366F1', fontWeight: '600' }}>
                                        set{(parseInt(currentGroup.setCount) || 1) !== 1 ? 's' : ''}
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                      <span style={{ fontSize: '10px', color: '#6366F1', fontWeight: '700' }}>GST:</span>
                                      <select
                                        value={currentGroup.gstRate || item.gstRate || '18%'}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (groupId) {
                                            setPresetGroups(prev => ({
                                              ...prev,
                                              [groupId]: { ...(prev[groupId] || currentGroup), gstRate: val }
                                            }));
                                          }
                                          setBomMaterialsList(prev => prev.map((mat, idx) =>
                                            ((mat.presetGroupId || 'legacy_default') === groupId || idx === i)
                                              ? { ...mat, gstRate: val }
                                              : mat
                                          ));
                                        }}
                                        style={{
                                          height: '24px', borderRadius: '6px',
                                          border: '1.5px solid #818CF8', padding: '0 4px',
                                          fontSize: '11px', fontWeight: '800',
                                          color: '#312E81', backgroundColor: '#FFFFFF',
                                          outline: 'none', cursor: 'pointer'
                                        }}
                                        title="Change GST Rate for this preset"
                                      >
                                        <option value="18%">18%</option>
                                        <option value="12%">12%</option>
                                        <option value="5%">5%</option>
                                        <option value="0%">0%</option>
                                      </select>
                                    </div>

                                    {groupId && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePresetGroup(groupId)}
                                        style={{
                                          border: 'none',
                                          backgroundColor: 'transparent',
                                          color: '#EF4444',
                                          fontSize: '10px',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          marginTop: '2px'
                                        }}
                                        title={`Remove entire ${currentGroup.presetName} preset`}
                                      >
                                        Remove Kit
                                      </button>
                                    )}
                                  </div>
                                </td>
                              );
                            } else {
                              return null;
                            }
                          } else {
                            return <td style={{ padding: '12px 10px', textAlign: 'center' }}><span style={{ fontSize: '11px', color: '#CBD5E1' }}>—</span></td>;
                          }
                        })()}
                        <td style={{ padding: '12px 10px', color: '#475569', textAlign: 'right', fontWeight: '600' }}>
                          {isPresetItem ? (
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>—</span>
                          ) : (
                            `₹${taxable.toFixed(2)}`
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#0F172A', textAlign: 'right' }}>
                          {isPresetItem ? (
                            <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>—</span>
                          ) : (
                            `₹${rowTot.toFixed(2)}`
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialRow(i)}
                            style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete Item"
                          >
                            <Trash2 style={{ width: '15px', height: '15px' }} />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                  })()
                )}

              </tbody>
            </table>
          </div>

          <div>
            <button
              onClick={handleAddMaterialRow}
              style={{ border: '1px solid #A5F3FC', background: '#ECFEFF', color: '#0E7490', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              Add Product / Item
            </button>
          </div>
          </div>
        </div>

        {/* SECTION 4: TRANSPORT & LOGISTICS */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
              4
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TRANSPORT & LOGISTICS DETAILS
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Mode of Transport <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={newBomTransportMode}
                onChange={(e) => setNewBomTransportMode(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', backgroundColor: 'white', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Transport">Transport</option>
                <option value="Own Vehicle">Own Vehicle</option>
                <option value="Porter">Porter</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Transport Name</label>
              <input
                type="text"
                value={newBomTransporterName}
                onChange={(e) => setNewBomTransporterName(e.target.value)}
                placeholder="e.g. VRL Logistics / TCI Freight / Local Transport"
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', backgroundColor: 'white', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Vehicle Number</label>
              <input
                type="text"
                value={newBomVehicleNo}
                onChange={(e) => setNewBomVehicleNo(e.target.value)}
                placeholder="e.g. TN 01 AB 1234 / KA 04 C 5678"
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', backgroundColor: 'white', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Scope</label>
              <select
                value={newBomTransportScope}
                onChange={(e) => setNewBomTransportScope(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', backgroundColor: 'white', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
              >
                <option value="VRM Structures">VRM Structures</option>
                <option value="Customer Scope">Customer Scope</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 5: PAYMENT TERMS & FINANCIAL SUMMARY */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
              5
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PAYMENT TERMS & ORDER SUMMARY
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Payment Terms</label>
                <select
                  value={newBomPaymentType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewBomPaymentType(val);
                    if (val === 'Credit Payment' || val === 'Payment While Dispatch') {
                      setNewBomPaymentProofDoc(null);
                    }
                  }}
                  style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', backgroundColor: 'white', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="100% Paid">100% Paid</option>
                  <option value="Partial Payment">Partial Payment</option>
                  <option value="Payment While Dispatch">Payment While Dispatch</option>
                  <option value="Credit Payment">Credit Payment</option>
                </select>
              </div>

              {newBomPaymentType === 'Credit Payment' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155' }}>Credit Timeline (Days)</label>
                    <span style={{ fontSize: '11px', color: '#0E7490', fontWeight: '700' }}>Default: 7 Days</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={newBomCreditDays}
                    onChange={(e) => setNewBomCreditDays(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #A5F3FC', padding: '0 14px', fontSize: '13px', color: '#0F172A', backgroundColor: '#F0FDFA', boxSizing: 'border-box', outline: 'none', fontWeight: '700' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Remarks / Notes</label>
                <textarea
                  rows={3}
                  value={newBomRemarks}
                  onChange={(e) => setNewBomRemarks(e.target.value)}
                  placeholder="Enter remarks, consignee references, or invoice notes..."
                  style={{ width: '100%', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '12px 14px', fontSize: '13px', color: '#0F172A', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>

            <div>
              {newBomPaymentType === 'Credit Payment' ? (
                <div style={{ border: '1px solid #C7D2FE', borderRadius: '14px', padding: '20px', backgroundColor: '#F5F3FF', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', boxSizing: 'border-box', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#5B21B6' }}>Credit Payment Terms Active</h4>
                      <span style={{ fontSize: '11px', color: '#6D28D9' }}>{newBomCreditDays} Days Credit Window</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#4C1D95', margin: 0, lineHeight: '1.5' }}>
                    Payment slip is not required upfront. Salesperson will receive continuous notification reminders.
                  </p>
                </div>
              ) : newBomPaymentType === 'Payment While Dispatch' ? (
                <div style={{ border: '1px solid #C7D2FE', borderRadius: '14px', padding: '20px', backgroundColor: '#EEF2FF', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', boxSizing: 'border-box', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#DBEAFE', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1E3A8A' }}>Payment While Dispatch Active</h4>
                      <span style={{ fontSize: '11px', color: '#2563EB' }}>Payment slip due when goods are packed</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#1E3A8A', margin: 0, lineHeight: '1.5' }}>
                    BOM will proceed with production immediately. Payment receipt will be attached prior to final release.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                      Payment Attachment / Slip <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    {newBomPaymentProofDoc && (
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#166534', backgroundColor: '#DCFCE7', padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle style={{ width: '12px', height: '12px' }} /> Attached
                      </span>
                    )}
                  </div>

                  {newBomPaymentProofDoc ? (
                    <div style={{ border: '1px solid #86EFAC', borderRadius: '12px', padding: '16px', backgroundColor: '#F0FDF4', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileCheck style={{ width: '18px', height: '18px' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{newBomPaymentProofDoc.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{newBomPaymentProofDoc.size || '1.2 MB'} • Payment Document Attached</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewDocModal({ title: 'Payment Proof Document', doc: newBomPaymentProofDoc })}
                            style={{ border: '1px solid #BBF7D0', background: '#DCFCE7', color: '#166534', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye style={{ width: '13px', height: '13px' }} /> View Image
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewBomPaymentProofDoc(null)}
                            style={{ border: 'none', background: '#FEE2E2', color: '#DC2626', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 style={{ width: '13px', height: '13px' }} /> Remove
                          </button>
                        </div>
                      </div>
                      {newBomPaymentProofDoc.dataUrl && (
                        <div style={{ borderTop: '1px solid #BBF7D0', paddingTop: '10px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px' }}>
                          <img src={newBomPaymentProofDoc.dataUrl} alt="Payment Proof Preview" style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files && e.dataTransfer.files[0];
                        if (file) {
                          compressAndSaveFile(file, (res) => {
                            if (res) {
                              if (res.name && res.dataUrl) saveMediaToCache(res.name, res.dataUrl);
                              setNewBomPaymentProofDoc(res);
                            }
                          });
                        }
                      }}
                      style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '24px 16px', textAlign: 'center', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
                    >
                      <UploadCloud style={{ width: '34px', height: '34px', color: '#6366F1' }} />
                      <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                        Drag & drop payment slip / bank advice here or
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ECFEFF', border: '1px solid #A5F3FC', color: '#0E7490', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                          <Upload style={{ width: '13px', height: '13px' }} />
                          Browse Files
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files && e.target.files[0];
                              if (file) {
                                compressAndSaveFile(file, (res) => {
                                  if (res) {
                                    if (res.name && res.dataUrl) saveMediaToCache(res.name, res.dataUrl);
                                    setNewBomPaymentProofDoc(res);
                                  }
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>Supported formats: PDF, JPG, PNG (Max 5MB)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subtotals & GST Tax Calculation Breakdown */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', fontSize: '13px' }}>
            {selectedPreset && totals.kitSubtotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '320px', color: '#0E7490', backgroundColor: '#ECFEFF', padding: '6px 10px', borderRadius: '6px' }}>
                <span style={{ fontWeight: '700' }}>Preset ({presetSetCount} Set{presetSetCount > 1 ? 's' : ''})</span>
                <strong style={{ color: '#0E7490' }}>₹{totals.kitSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '320px', color: '#64748B' }}>
              <span>Taxable Subtotal (Before GST)</span>
              <strong style={{ color: '#0F172A' }}>₹{totals.sub.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '320px', color: '#64748B', fontSize: '12px' }}>
              <span>CGST (9%)</span>
              <span style={{ color: '#475569', fontWeight: '600' }}>₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '320px', color: '#64748B', fontSize: '12px' }}>
              <span>SGST (9%)</span>
              <span style={{ color: '#475569', fontWeight: '600' }}>₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '320px', color: '#0E7490', fontWeight: '700', backgroundColor: '#ECFEFF', padding: '6px 10px', borderRadius: '6px' }}>
              <span>Total Applicable GST (18%)</span>
              <span>₹{totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '320px', color: '#0F172A', fontSize: '17px', fontWeight: '800', borderTop: '1px solid #E2E8F0', paddingTop: '10px', marginTop: '4px' }}>
              <span>Grand Total (Incl. GST)</span>
              <span style={{ color: '#0E7490' }}>₹{totals.grand.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '20px', marginTop: '10px' }}>
            <button onClick={() => setBomConfirmModal('cancel')} style={{ border: '1px solid #CBD5E1', background: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => setBomConfirmModal('draft')} style={{ border: '1px solid #A5F3FC', background: '#ECFEFF', color: '#0E7490', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText style={{ width: '15px', height: '15px' }} /> Save as Draft</button>
            <button
              onClick={() => {
                if (!newBomProductName || !newBomProductName.trim()) {
                  alert('⚠️ Please select or enter a Customer Name before creating the BOM order.');
                  return;
                }
                if (!bomMaterialsList || bomMaterialsList.length === 0) {
                  alert('⚠️ Please add at least one Product / Item to the BOM materials list.');
                  return;
                }
                setBomConfirmModal('create');
              }}
              style={{ border: 'none', background: '#0E7490', color: 'white', padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 14px rgba(14,116,144,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Check style={{ width: '16px', height: '16px' }} /> Create & Send to Dispatch
            </button>
          </div>
        </div>

        {/* CONFIRMATION / SUBMISSION MODAL */}
        {bomConfirmModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: bomConfirmModal === 'cancel' ? '#FEE2E2' : '#ECFEFF', color: bomConfirmModal === 'cancel' ? '#DC2626' : '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {bomConfirmModal === 'cancel' ? <AlertTriangle style={{ width: '20px', height: '20px' }} /> : <Layers style={{ width: '20px', height: '20px' }} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                    {bomConfirmModal === 'cancel' && 'Discard BOM Form?'}
                    {bomConfirmModal === 'draft' && 'Save BOM as Draft?'}
                    {bomConfirmModal === 'create' && 'Confirm & Send to Dispatch?'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B', lineHeight: '1.4' }}>
                    {bomConfirmModal === 'cancel' && 'Are you sure you want to cancel? Any unsaved changes entered in this BOM form will be lost.'}
                    {bomConfirmModal === 'draft' && 'Save this Bill of Materials as a draft order so you can review and update it later?'}
                    {bomConfirmModal === 'create' && `Are you sure you want to create this BOM order and forward it directly to Dispatch for packing?`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <button onClick={() => setBomConfirmModal(null)} style={{ border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Go Back</button>
                <button
                  onClick={async () => {
                    if (bomConfirmModal === 'cancel') {
                      setShowBOMForm(false);
                      setBomConfirmModal(null);
                      setSelectedPreset('');
                      setPresetKitPrice('');
                      setPresetSetCount(1);
                      setPresetGroups({});
                      setNewBomTransportMode('Transport');
                      setNewBomTransporterName('');
                      setNewBomVehicleNo('');
                      setNewBomTransportScope('VRM Structures');
                    } else if (bomConfirmModal === 'draft' || bomConfirmModal === 'create') {
                      const isDraft = bomConfirmModal === 'draft';
                      const target = (newBomProductName || '').toLowerCase().trim();
                      const selCust = target ? customerList.find(c => {
                        const code = (c.code || '').toLowerCase().trim();
                        const c2 = (c.c2 || '').toLowerCase().trim();
                        const cName = (c.customerName || '').toLowerCase().trim();
                        const comp = (c.companyName || '').toLowerCase().trim();
                        return code === target || c2 === target || cName === target || comp === target ||
                               (code && code.startsWith(target)) || (c2 && c2.startsWith(target)) ||
                               (cName && cName.startsWith(target)) || (comp && comp.startsWith(target)) ||
                               (c2 && c2.includes(target)) || (comp && comp.includes(target));
                      }) : null;

                      const bObj = selCust?.billingAddressObj || {};
                      const bStreet = bObj.address || selCust?.c6 || selCust?.billingAddress || '';
                      const bCity = bObj.city || '';
                      const bState = bObj.state || '';
                      const bPin = bObj.pincode || '';

                      const formatAddr = (st, ct, sta, pin) => {
                        const parts = [st, ct, sta, pin ? `Pincode: ${pin}` : ''].filter(Boolean);
                        return parts.join(', ');
                      };

                      const billingObj = { address: bStreet, city: bCity, state: bState, pincode: bPin };
                      const billingFull = formatAddr(bStreet, bCity, bState, bPin) || selCust?.c6 || selCust?.billingAddress || '-';
                      const deliveryFull = sameAsBilling
                        ? billingFull
                        : (formatAddr(newBomDeliveryStreet, newBomDeliveryCity, newBomDeliveryState, newBomDeliveryPincode) || newBomDeliveryAddress || '-');

                      const deliveryObj = sameAsBilling
                        ? { address: bStreet, city: bCity, state: bState, pincode: bPin }
                        : { address: newBomDeliveryStreet, city: newBomDeliveryCity, state: newBomDeliveryState, pincode: newBomDeliveryPincode };

                      const existingNumsRec = (bomStore || []).map(b => parseInt(String(b.bomCode || b.code || b.id || '').replace('BOM-', ''))).filter(n => !isNaN(n));
                      const maxNumRec = existingNumsRec.length > 0 ? Math.max(621, ...existingNumsRec) : 621;
                      const finalCode = newBomCode || `BOM-${maxNumRec + 1}`;

                      const hasPaymentProof = Boolean(newBomPaymentProofDoc);
                      const newBomRecord = {
                        id: finalCode,
                        bomCode: finalCode,
                        code: finalCode,
                        date: new Date().toISOString().split('T')[0],
                        customerName: selCust?.c2 || selCust?.code || newBomProductName || 'Customer Order',
                        companyName: selCust?.c2 || selCust?.code || newBomProductName || '-',
                        mobile: selCust?.c4 || '-',
                        email: selCust?.c5 || '-',
                        billingAddress: billingFull,
                        billingAddressObj: billingObj,
                        deliveryAddress: deliveryFull,
                        deliveryAddressObj: deliveryObj,
                        deliveryAddressProofDoc: sameAsBilling ? null : (newBomDeliveryProofDoc || null),
                        transportMode: newBomTransportMode || 'Transport',
                        transportScope: newBomTransportScope || 'VRM Structures',
                        transporterName: newBomTransporterName || '',
                        vehicleNo: newBomVehicleNo || '',
                        lrNo: newBomLrNo || '',
                        paymentType: newBomPaymentType || '100% Paid',
                        creditDays: newBomPaymentType === 'Credit Payment' ? (parseInt(newBomCreditDays) || 7) : null,
                        creditDueDate: newBomPaymentType === 'Credit Payment' ? new Date(Date.now() + (parseInt(newBomCreditDays) || 7) * 86400000).toISOString().split('T')[0] : null,
                        paymentProofDoc: newBomPaymentProofDoc || null,
                        paymentUpdated: newBomPaymentType === '100% Paid' && Boolean(newBomPaymentProofDoc),
                        remarks: newBomRemarks || '',
                        status: isDraft ? 'Draft' : 'Sales Confirmed - Sent to Dispatch',
                        salesConfirmed: !isDraft,
                        salesConfirmedAt: !isDraft ? new Date().toISOString() : null,
                        salesPerson: (newBomSalesPerson && newBomSalesPerson.trim()) ? newBomSalesPerson.trim() : defaultSalesPersonName,
                        items: (bomMaterialsList || []).map(item => ({
                          name: item.name || 'Custom Item',
                          category: item.category || '',
                          uom: item.uom || 'NOS',
                          qty: parseFloat(item.qty) || 0,
                          rate: parseFloat(item.rate) || 0,
                          gstRate: item.gstRate || '18%',
                          confirmed: !isDraft
                        })),
                        payments: {
                          advance50Uploaded: false,
                          dispatch50Uploaded: false,
                          advance100Uploaded: newBomPaymentType === '100% Paid' && hasPaymentProof,
                          net30Uploaded: false,
                          proofDoc: newBomPaymentProofDoc ? newBomPaymentProofDoc.name : null,
                          proofDocObj: newBomPaymentProofDoc || null,
                          paymentUpdated: newBomPaymentType === '100% Paid' && Boolean(newBomPaymentProofDoc)
                        },
                        dispatchPacking: (bomMaterialsList || []).map(item => ({
                          name: item.name || 'Custom Item',
                          bomQty: parseFloat(item.qty) || 0,
                          packed: false
                        })),
                        accountsVerification: {
                          paymentStatus: null,
                          hardCopyReceived: false,
                          softCopyReceived: false
                        },
                        invoiceConfirmed: false,
                        invoiceDeducted: false,
                        stockBlocked: !isDraft,
                        stockBlockedAt: !isDraft ? new Date().toISOString() : null,
                        presetName: Object.values(presetGroups).map(g => `${g.presetName} (${g.setCount} Set${g.setCount > 1 ? 's' : ''})`).join(' + ') || selectedPreset || null,
                        presetKitPrice: totals.kitSubtotal || ((selectedPreset && presetKitPrice !== '') ? parseFloat(presetKitPrice) : null),
                        presetSetCount: Object.values(presetGroups).reduce((s, g) => s + (parseInt(g.setCount) || 1), 0) || (selectedPreset ? (parseInt(presetSetCount) || 1) : null),
                        presetGroups: Object.values(presetGroups),
                        subTotal: totals.sub || 0,
                        gstAmount: totals.gst || 0,
                        cgstAmount: totals.cgst || 0,
                        sgstAmount: totals.sgst || 0,
                        grandTotal: totals.grand || 0
                      };

                      // Block and reserve inventory immediately so other sales reps see 0 stock
                      if (!isDraft && Array.isArray(newBomRecord.items) && newBomRecord.items.length > 0) {
                        blockInventoryForBom(newBomRecord.items, newBomRecord.bomCode);
                      }

                      let sanitizedNewBom = stripDataUrlsFromRecord(newBomRecord);

                      // 1. Immediately send to Central Server with isNew flag to guarantee unique sequential number
                      let finalAssignedCode = finalCode;
                      try {
                        const sRes = await fetch('/api/boms', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ bom: sanitizedNewBom, isNew: !isDraft })
                        });
                        if (sRes.ok) {
                          const sData = await sRes.json();
                          if (sData && (sData.bomCode || sData.bom?.bomCode)) {
                            finalAssignedCode = sData.bomCode || sData.bom?.bomCode;
                            sanitizedNewBom.bomCode = finalAssignedCode;
                            sanitizedNewBom.code = finalAssignedCode;
                            sanitizedNewBom.id = finalAssignedCode;
                          }
                        }
                      } catch (err) {
                        console.error('Error in /api/boms sync:', err);
                      }

                      // 2. Update local state and persist
                      setBomStore(prev => {
                        const current = Array.isArray(prev) ? prev : [];
                        const filtered = current.filter(item => item && (item.bomCode !== finalAssignedCode && item.code !== finalAssignedCode));
                        const updatedList = [sanitizedNewBom, ...filtered];
                        try {
                          localStorage.setItem('controlroom_bom_store', JSON.stringify(updatedList));
                        } catch (e) {
                          console.warn('Storage quota hit for local storage', e);
                        }
                        saveCloudStore('bom_store', updatedList);
                        setShowBOMForm(false);
                        setBomConfirmModal(null);
                        setCurrentPage(1);
                        try {
                          window.dispatchEvent(new Event('controlroom_storage_update'));
                        } catch (e) { }
                        return updatedList;
                      });

                      // 3. If sent to dispatch, trigger live notifications and synthesized sound
                      if (!isDraft) {
                        notifyBomSentToDispatch({
                          bomCode: finalAssignedCode,
                          customerName: sanitizedNewBom.companyName || sanitizedNewBom.customerName,
                          salesPerson: sanitizedNewBom.salesPerson
                        });
                        alert(`✅ BOM (${finalAssignedCode}) successfully created and sent to Dispatch for packing!`);
                      } else {
                        alert(`📝 BOM (${finalAssignedCode}) saved as Draft.`);
                      }

                      setNewBomPaymentProofDoc(null);
                      setNewBomDeliveryProofDoc(null);
                      setNewBomRemarks('');
                      setNewBomTransportMode('Transport');
                      setNewBomTransporterName('');
                      setNewBomVehicleNo('');
                      setNewBomTransportScope('VRM Structures');
                      setNewBomLrNo('');
                      setNewBomCreditDays(7);
                      setNewBomPaymentType('100% Paid');
                      setNewBomProductName('');
                      setBomMaterialsList([]);
                      setSelectedPreset('');
                      setPresetKitPrice('');
                      setPresetSetCount(1);
                      setPresetGroups({});
                      setNewBomCode('');
                      setShowBOMForm(false);
                      setBomConfirmModal(null);
                      alert(isDraft ? `📝 BOM (${newBomRecord.bomCode}) saved as Draft!` : `✅ BOM (${newBomRecord.bomCode}) created!\nStatus: Pending Sales Confirmation.\nPlease review & confirm the BOM before forwarding to Dispatch.`);
                    }
                  }}
                  style={{
                    border: 'none',
                    backgroundColor: bomConfirmModal === 'cancel' ? '#DC2626' : bomConfirmModal === 'draft' ? '#0E7490' : '#166534',
                    color: 'white',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {bomConfirmModal === 'cancel' && 'Yes, Discard'}
                  {bomConfirmModal === 'draft' && 'Yes, Save Draft'}
                  {bomConfirmModal === 'create' && 'Yes, Confirm & Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENT PREVIEW MODAL */}
        {renderDocPreviewModal()}
      </div>
    );
  }

  // ==========================================
  // RENDER 2: CONFIRMING / EDITING BOM MODAL
  // ==========================================
  if (confirmingBomModal) {
    const isEditMode = Boolean(
      confirmingBomModal.isEditMode !== false &&
      ['Draft', 'Pending Confirmation', 'Pending Sales Confirmation', 'Edited / Pending Confirmation', 'Cancelled & Reissued to Dispatch', 'ACTIVE', 'Active', 'Pending Verification', 'Pending'].includes(confirmingBomModal.status || 'Pending Sales Confirmation')
    );
    const isAlreadyForwarded = !isEditMode;
    const grandTotalCalc = (confirmingBomModal.items || []).reduce((acc, it) => acc + ((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)), 0);

    const bObj = confirmingBomModal.billingAddressObj || {
      address: confirmingBomModal.billingAddress || '',
      city: '',
      state: '',
      pincode: ''
    };
    const dObj = confirmingBomModal.deliveryAddressObj || {
      address: confirmingBomModal.deliveryAddress || '',
      city: '',
      state: '',
      pincode: ''
    };

    const formatAddr = (obj, fallbackStr) => {
      if (!obj) return fallbackStr || '—';
      const { address, city, state, pincode } = obj;
      const parts = [];
      if (address && address.trim() && address.trim() !== '—') parts.push(address.trim());
      if (city && city.trim() && city.trim() !== '—') parts.push(city.trim());
      if (state && state.trim() && state.trim() !== '—' && pincode && pincode.trim() && pincode.trim() !== '—') {
        parts.push(`${state.trim()} - ${pincode.trim()}`);
      } else {
        if (state && state.trim() && state.trim() !== '—') parts.push(state.trim());
        if (pincode && pincode.trim() && pincode.trim() !== '—') parts.push(pincode.trim());
      }
      return parts.length > 0 ? parts.join(', ') : (fallbackStr || '—');
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '16px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              {isAlreadyForwarded ? `BOM Details & Order Summary — ${confirmingBomModal.bomCode}` : `BOM Verification & Order Editing — ${confirmingBomModal.bomCode}`}
            </h1>
            <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', display: 'block' }}>
              {isAlreadyForwarded
                ? 'Review verified bill of materials, product breakdown, and order specifications.'
                : 'Review & modify company details, billing/delivery addresses, payment terms, or product specifications before final dispatch.'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setExportFormatRecord(confirmingBomModal)}
              title="Export BOM (PDF, JPG, or CSV)"
              style={{
                border: '1px solid #0E7490',
                backgroundColor: '#ECFEFF',
                color: '#0E7490',
                height: '40px',
                padding: '0 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Download size={15} style={{ color: '#0E7490' }} /> Export
            </button>
            <button
              onClick={() => setConfirmingBomModal(null)}
              style={{ border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', height: '40px', padding: '0 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Back to BOM Dashboard
            </button>

            {canCancelBom && confirmingBomModal.status !== 'Cancelled & Stock Restored' && (
              <button
                onClick={() => handleCancelBomOrder(confirmingBomModal)}
                style={{
                  border: '1px solid #FECACA',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  height: '40px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <XCircle style={{ width: '16px', height: '16px' }} />
                Cancel BOM & Restore Stock
              </button>
            )}

            {!isAlreadyForwarded && (
              <button
                onClick={() => {
                  const isDeliveryMatching = Boolean(confirmingBomModal.sameAsBilling) || (
                    ((dObj.address || '').trim() === (bObj.address || '').trim()) &&
                    ((dObj.city || '').trim() === (bObj.city || '').trim()) &&
                    ((dObj.state || '').trim() === (bObj.state || '').trim()) &&
                    ((dObj.pincode || '').trim() === (bObj.pincode || '').trim())
                  );



                  const currentItemsList = confirmingBomModal.items || [];
                  const unconfirmedItems = currentItemsList.filter(it => !it.confirmed);
                  if (unconfirmedItems.length > 0) {
                    alert(`⚠️ Please confirm all products first!\n\n${unconfirmedItems.length} product(s) still need to be verified with the tick mark (✓) or click "Confirm All Products" below before sending BOM to Dispatch.`);
                    return;
                  }

                  const bStr = formatAddr(bObj, confirmingBomModal.billingAddress);
                  const dStr = confirmingBomModal.sameAsBilling ? bStr : formatAddr(dObj, confirmingBomModal.deliveryAddress);
                  const finalDObj = confirmingBomModal.sameAsBilling ? { ...bObj } : { ...dObj };

                  const finalizedItems = currentItemsList.map(i => ({ ...i, confirmed: true }));
                  const packingItems = (confirmingBomModal.dispatchPacking && confirmingBomModal.dispatchPacking.length > 0)
                    ? confirmingBomModal.dispatchPacking
                    : finalizedItems.map(it => ({
                      name: it.name || it.c2 || 'Item',
                      bomQty: it.qty || 1,
                      packed: false
                    }));

                  // Ensure inventory is blocked upon verification if not already blocked
                  if (!confirmingBomModal.stockBlocked) {
                    blockInventoryForBom(finalizedItems, confirmingBomModal.bomCode);
                  }

                  const updatedBomData = {
                    ...confirmingBomModal,
                    companyName: confirmingBomModal.companyName,
                    paymentType: confirmingBomModal.paymentType,
                    billingAddress: bStr,
                    billingAddressObj: bObj,
                    deliveryAddress: dStr,
                    deliveryAddressObj: finalDObj,
                    deliveryAddressProofDoc: confirmingBomModal.sameAsBilling ? null : (confirmingBomModal.deliveryAddressProofDoc || null),
                    items: finalizedItems,
                    dispatchPacking: packingItems,
                    salesPerson: (confirmingBomModal.salesPerson || defaultSalesPersonName || 'Mohit JV').replace(/\s*\([^)]*\)/g, '').trim(),
                    status: 'Sales Confirmed - Sent to Dispatch',
                    salesConfirmed: true,
                    salesConfirmedAt: new Date().toISOString(),
                    stockBlocked: true,
                    stockBlockedAt: confirmingBomModal.stockBlockedAt || new Date().toISOString(),
                    addressProofReuploadRequested: false,
                    subTotal: confirmingBomModal.subTotal || grandTotalCalc,
                    gstAmount: confirmingBomModal.gstAmount || (grandTotalCalc * 0.18),
                    grandTotal: confirmingBomModal.grandTotal || (grandTotalCalc * 1.18)
                  };

                  setBomStore(prev => prev.map(b => b.bomCode === confirmingBomModal.bomCode ? {
                    ...b,
                    ...updatedBomData
                  } : b));

                  // Push to server immediately so Dispatch sees it in real time
                  try {
                    fetch('/api/boms', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ bom: stripDataUrlsFromRecord(updatedBomData), isUpdate: true })
                    }).catch(err => console.error('Error updating BOM to Dispatch:', err));
                  } catch (_) {}

                  // Trigger Real-time Workflow Notification with synthesized sound & deep-link to Dispatch Orders
                  notifyBomSentToDispatch({
                    bomCode: confirmingBomModal.bomCode,
                    customerName: confirmingBomModal.companyName || confirmingBomModal.customerName,
                    salesPerson: confirmingBomModal.salesPerson
                  });

                  setConfirmingBomModal(null);
                  alert(`✅ BOM (${confirmingBomModal.bomCode}) successfully verified by Sales and forwarded to Dispatch!`);
                }}
                style={{
                  border: 'none',
                  backgroundColor: '#0E7490',
                  color: 'white',
                  height: '40px',
                  padding: '0 24px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(14,116,144,0.3)'
                }}
              >
                <CheckCircle style={{ width: '16px', height: '16px' }} />
                Confirm BOM & Send to Dispatch
              </button>
            )}
          </div>
        </div>

        {/* ORDER DETAILS & ADDRESSES */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0E7490', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isAlreadyForwarded ? 'BILL OF MATERIALS SUMMARY' : 'ORDER DETAILS & ADDRESSES'}
            </span>
            <span style={{
              backgroundColor: isAlreadyForwarded ? '#DCFCE7' : '#FEF3C7',
              color: isAlreadyForwarded ? '#166534' : '#B45309',
              padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'inline-block'
            }}>
              {confirmingBomModal.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                CUSTOMER NAME
              </label>
              <input
                type="text"
                value={confirmingBomModal.customerName}
                readOnly
                style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', fontWeight: '700', color: '#475569', backgroundColor: '#F8FAFC', outline: 'none', cursor: 'not-allowed', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                COMPANY NAME {!isAlreadyForwarded && <span style={{ color: '#2563EB', fontSize: '10px' }}>(Editable)</span>}
              </label>
              {isAlreadyForwarded ? (
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', height: '40px', display: 'flex', alignItems: 'center' }}>
                  {confirmingBomModal.companyName || confirmingBomModal.customerName || '—'}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Company Name..."
                  value={confirmingBomModal.companyName || ''}
                  onChange={(e) => setConfirmingBomModal({ ...confirmingBomModal, companyName: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                />
              )}
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                PAYMENT TYPE {!isAlreadyForwarded && <span style={{ color: '#2563EB', fontSize: '10px' }}>(Editable)</span>}
              </label>
              {isAlreadyForwarded ? (
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563EB', height: '40px', display: 'flex', alignItems: 'center' }}>
                  {confirmingBomModal.paymentType}
                </div>
              ) : (
                <select
                  value={confirmingBomModal.paymentType || '100% Advance'}
                  onChange={(e) => setConfirmingBomModal({ ...confirmingBomModal, paymentType: e.target.value })}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', fontWeight: '700', color: '#2563EB', backgroundColor: '#FFFFFF', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  <option value="100% Advance">100% Advance</option>
                  <option value="50% Advance + 50% Dispatch">50% Advance + 50% Dispatch</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                </select>
              )}
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#0E7490', display: 'block', marginBottom: '6px' }}>
                SALES PERSON / CREATOR
              </label>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0E7490', height: '40px', display: 'flex', alignItems: 'center', backgroundColor: '#F0FDFA', padding: '0 12px', borderRadius: '8px', border: '1px solid #CCFBF1' }}>
                👤 {(confirmingBomModal.salesPerson || defaultSalesPersonName || 'Mohit JV').replace(/\s*\([^)]*\)/g, '').trim()}
              </div>
            </div>
          </div>

          {/* Structured Address Cards */}
          {(() => {
            const bStreet = bObj.address || '—';
            const bCity = bObj.city || '—';
            const bState = bObj.state || '—';
            const bPin = bObj.pincode || '—';

            const dStreet = dObj.address || '—';
            const dCity = dObj.city || '—';
            const dState = dObj.state || '—';
            const dPin = dObj.pincode || '—';

            const isDeliveryMatching = Boolean(confirmingBomModal.sameAsBilling) || (
              ((dObj.address || '').trim() === (bObj.address || '').trim()) &&
              ((dObj.city || '').trim() === (bObj.city || '').trim()) &&
              ((dObj.state || '').trim() === (bObj.state || '').trim()) &&
              ((dObj.pincode || '').trim() === (bObj.pincode || '').trim())
            );

            if (isAlreadyForwarded) {
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                      <FileText style={{ width: '13px', height: '13px', color: '#2563EB' }} /> Billing Address
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                      <div><strong>Address:</strong> {bStreet}</div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: '#64748B', fontSize: '11px' }}>
                        <span>City: <strong style={{ color: '#334155' }}>{bCity}</strong></span>
                        <span>State: <strong style={{ color: '#334155' }}>{bState}</strong></span>
                        <span>Pincode: <strong style={{ color: '#334155' }}>{bPin}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                      <Truck style={{ width: '13px', height: '13px', color: '#0E7490' }} /> Delivery Address
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                      <div><strong>Address:</strong> {dStreet}</div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: '#64748B', fontSize: '11px' }}>
                        <span>City: <strong style={{ color: '#334155' }}>{dCity}</strong></span>
                        <span>State: <strong style={{ color: '#334155' }}>{dState}</strong></span>
                        <span>Pincode: <strong style={{ color: '#334155' }}>{dPin}</strong></span>
                      </div>
                      {confirmingBomModal.deliveryAddressProofDoc ? (
                        <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#166534' }}>
                            <FileText style={{ width: '13px', height: '13px' }} />
                            Address Proof: {confirmingBomModal.deliveryAddressProofDoc.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: 'Delivery Address Proof Document', doc: confirmingBomModal.deliveryAddressProofDoc })}
                              style={{ border: '1px solid #BBF7D0', background: '#FFFFFF', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Eye style={{ width: '12px', height: '12px' }} /> View Image
                            </button>
                            <span style={{ fontSize: '10px', color: '#15803D', fontWeight: '800' }}>Verified</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '4px' }}>
                {/* Editable Billing */}
                <div style={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                      <FileText style={{ width: '14px', height: '14px' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Billing Address</h4>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Editable for order invoice billing</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Address</label>
                    <input
                      type="text"
                      placeholder="Street Address..."
                      value={bObj.address || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfirmingBomModal({
                          ...confirmingBomModal,
                          billingAddressObj: { ...bObj, address: val },
                          deliveryAddressObj: confirmingBomModal.sameAsBilling ? { ...dObj, address: val } : dObj
                        });
                      }}
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>City</label>
                      <input type="text" placeholder="City..." value={bObj.city || ''} onChange={(e) => setConfirmingBomModal({ ...confirmingBomModal, billingAddressObj: { ...bObj, city: e.target.value } })} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>State</label>
                      <input type="text" placeholder="State..." value={bObj.state || ''} onChange={(e) => setConfirmingBomModal({ ...confirmingBomModal, billingAddressObj: { ...bObj, state: e.target.value } })} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Pincode</label>
                      <input type="text" placeholder="Pincode..." value={bObj.pincode || ''} onChange={(e) => setConfirmingBomModal({ ...confirmingBomModal, billingAddressObj: { ...bObj, pincode: e.target.value } })} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  </div>
                </div>

                {/* Editable Delivery */}
                <div style={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: '#ECFEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0E7490' }}>
                        <Truck style={{ width: '14px', height: '14px' }} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Delivery Address</h4>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>Destination for physical dispatch</span>
                      </div>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#0E7490', cursor: 'pointer', backgroundColor: '#ECFEFF', padding: '4px 10px', borderRadius: '8px', border: '1px solid #A5F3FC' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(confirmingBomModal.sameAsBilling)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setConfirmingBomModal({
                            ...confirmingBomModal,
                            sameAsBilling: checked,
                            deliveryAddressObj: checked ? { ...bObj } : dObj
                          });
                        }}
                        style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                      />
                      Same as Billing
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Plot No 42, SIDCO Industrial Estate"
                      value={confirmingBomModal.sameAsBilling ? (bObj.address || '') : (dObj.address || '')}
                      disabled={confirmingBomModal.sameAsBilling}
                      onChange={(e) => setConfirmingBomModal({ ...confirmingBomModal, deliveryAddressObj: { ...dObj, address: e.target.value } })}
                      style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: confirmingBomModal.sameAsBilling ? '#64748B' : '#0F172A', backgroundColor: confirmingBomModal.sameAsBilling ? '#F1F5F9' : '#FFFFFF', boxSizing: 'border-box', outline: 'none', cursor: confirmingBomModal.sameAsBilling ? 'not-allowed' : 'text' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>City</label>
                      <input type="text" placeholder="e.g. Chennai" value={confirmingBomModal.sameAsBilling ? (bObj.city || '') : (dObj.city || '')} disabled={confirmingBomModal.sameAsBilling} onChange={(e) => setConfirmingBomModal({ ...confirmingBomModal, deliveryAddressObj: { ...dObj, city: e.target.value } })} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: confirmingBomModal.sameAsBilling ? '#64748B' : '#0F172A', backgroundColor: confirmingBomModal.sameAsBilling ? '#F1F5F9' : '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>State</label>
                      <input type="text" placeholder="e.g. Tamil Nadu" value={confirmingBomModal.sameAsBilling ? (bObj.state || '') : (dObj.state || '')} disabled={confirmingBomModal.sameAsBilling} onChange={(e) => setConfirmingBomModal({ ...confirmingBomModal, deliveryAddressObj: { ...dObj, state: e.target.value } })} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: confirmingBomModal.sameAsBilling ? '#64748B' : '#0F172A', backgroundColor: confirmingBomModal.sameAsBilling ? '#F1F5F9' : '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Pincode</label>
                      <input type="text" placeholder="e.g. 600058" value={confirmingBomModal.sameAsBilling ? (bObj.pincode || '') : (dObj.pincode || '')} disabled={confirmingBomModal.sameAsBilling} onChange={(e) => setConfirmingBomModal({ ...confirmingBomModal, deliveryAddressObj: { ...dObj, pincode: e.target.value } })} style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: confirmingBomModal.sameAsBilling ? '#64748B' : '#0F172A', backgroundColor: confirmingBomModal.sameAsBilling ? '#F1F5F9' : '#FFFFFF', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  </div>

                  {!isDeliveryMatching ? (
                    <div style={{ marginTop: '6px', padding: '14px 16px', backgroundColor: '#FEF2F2', border: '1px dashed #F87171', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertCircle style={{ width: '14px', height: '14px' }} />
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                              Delivery Address Proof Document <span style={{ color: '#64748B', fontWeight: '600' }}>(Optional)</span>
                            </h5>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Upload proof (GST / Electricity Bill / Lease Agreement) if available.</span>
                          </div>
                        </div>
                        {confirmingBomModal.deliveryAddressProofDoc && (
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#166534', backgroundColor: '#DCFCE7', padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle style={{ width: '12px', height: '12px' }} /> Attached
                          </span>
                        )}
                      </div>

                      {confirmingBomModal.deliveryAddressProofDoc && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FECACA' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText style={{ width: '16px', height: '16px', color: '#DC2626' }} />
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>{confirmingBomModal.deliveryAddressProofDoc.name}</div>
                                <div style={{ fontSize: '10px', color: '#64748B' }}>{confirmingBomModal.deliveryAddressProofDoc.size || '1.2 MB'} • Current Version</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: 'Delivery Address Proof Document', doc: confirmingBomModal.deliveryAddressProofDoc })}
                                style={{ border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye style={{ width: '13px', height: '13px' }} /> View Image
                              </button>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                <Upload style={{ width: '11px', height: '11px' }} /> Upload New Version
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files && e.target.files[0];
                                    if (file) {
                                      compressAndSaveFile(file, (docMeta) => {
                                        if (docMeta) {
                                          saveMediaToCache(docMeta.name, docMeta.dataUrl);
                                          const prevDoc = confirmingBomModal.deliveryAddressProofDoc;
                                          const existingHistory = Array.isArray(prevDoc.history) ? prevDoc.history : [];
                                          const updatedHistory = [...existingHistory, {
                                            name: prevDoc.name,
                                            size: prevDoc.size,
                                            uploadedAt: prevDoc.uploadedAt || new Date().toISOString(),
                                            dataUrl: prevDoc.dataUrl
                                          }];
                                          setConfirmingBomModal(prev => ({
                                            ...prev,
                                            addressProofReuploadRequested: false,
                                            deliveryAddressProofDoc: {
                                              ...docMeta,
                                              uploadedAt: new Date().toISOString(),
                                              history: updatedHistory
                                            }
                                          }));
                                        }
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Render Previous Preserved Versions If Any */}
                          {confirmingBomModal.deliveryAddressProofDoc.history && confirmingBomModal.deliveryAddressProofDoc.history.length > 0 && (
                            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                                📁 Previous Address Proof Uploads Preserved ({confirmingBomModal.deliveryAddressProofDoc.history.length}):
                              </span>
                              {confirmingBomModal.deliveryAddressProofDoc.history.map((histItem, hIdx) => (
                                <div key={hIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#475569' }}>
                                  <span>• {histItem.name} ({histItem.size || 'Cached'})</span>
                                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{new Date(histItem.uploadedAt || Date.now()).toLocaleDateString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {!confirmingBomModal.deliveryAddressProofDoc && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFFFFF', border: '1px solid #DC2626', color: '#DC2626', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            <Upload style={{ width: '13px', height: '13px' }} />
                            Upload Address Proof Document
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files && e.target.files[0];
                                if (file) {
                                  compressAndSaveFile(file, (docMeta) => {
                                    if (docMeta) {
                                      saveMediaToCache(docMeta.name, docMeta.dataUrl);
                                      setConfirmingBomModal(prev => ({
                                        ...prev,
                                        addressProofReuploadRequested: false,
                                        deliveryAddressProofDoc: {
                                          ...docMeta,
                                          uploadedAt: new Date().toISOString(),
                                          history: []
                                        }
                                      }));
                                    }
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#166534', backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', padding: '8px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle style={{ width: '13px', height: '13px' }} /> Delivery address matches registered billing address. No additional address proof required.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* DISPATCH PACKED ITEMS MEDIA VIEWER FOR SALES */}
          {(() => {
            const packMedia = confirmingBomModal.dispatchPackingMedia || {};
            const packPhotos = packMedia.photos || [];
            const packVideos = packMedia.videos || [];
            const hasMedia = packPhotos.length > 0 || packVideos.length > 0;

            if (!hasMedia && !confirmingBomModal.status?.includes('Dispatch') && !confirmingBomModal.status?.includes('Packed') && !confirmingBomModal.dispatchPacking) {
              return null;
            }

            return (
              <div style={{
                marginTop: '16px',
                backgroundColor: 'white',
                padding: '18px 22px',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                        Dispatch Packed Items Media ({packPhotos.length} Photos, {packVideos.length} Videos)
                      </h4>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        Photos and videos captured by Dispatch Fulfillment Team during packing
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: hasMedia ? '#DCFCE7' : '#F1F5F9',
                    color: hasMedia ? '#166534' : '#64748B',
                    border: `1px solid ${hasMedia ? '#BBF7D0' : '#E2E8F0'}`
                  }}>
                    {hasMedia ? '✓ Media Attached' : 'Awaiting Dispatch Media'}
                  </span>
                </div>

                {hasMedia ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '4px' }}>
                    {packPhotos.map((ph, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setPreviewDocModal({ title: ph.name || `Packed Item Photo ${pIdx + 1}`, doc: { name: ph.name || `Photo ${pIdx + 1}`, dataUrl: ph.dataUrl } })}
                        style={{
                          height: '84px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1.5px solid #CBD5E1',
                          backgroundColor: '#0F172A',
                          position: 'relative',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <img src={ph.dataUrl} alt={ph.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          backgroundColor: 'rgba(15,23,42,0.75)', color: '#FFFFFF',
                          padding: '2px 6px', fontSize: '10px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <span>📷 View Photo</span>
                          <span>›</span>
                        </div>
                      </div>
                    ))}
                    {packVideos.map((vd, vIdx) => (
                      <div
                        key={vIdx}
                        onClick={() => setPreviewDocModal({ title: vd.name || `Packed Item Video ${vIdx + 1}`, doc: { name: vd.name || `Video ${vIdx + 1}`, dataUrl: vd.dataUrl } })}
                        style={{
                          height: '84px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1.5px solid #CBD5E1',
                          backgroundColor: '#0F172A',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          position: 'relative',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Video size={22} style={{ color: '#38BDF8' }} />
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          backgroundColor: 'rgba(15,23,42,0.75)', color: '#FFFFFF',
                          padding: '2px 6px', fontSize: '10px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <span>🎥 Watch Video</span>
                          <span>›</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                    No dispatch packing photos or videos attached yet for this order.
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* PRODUCT ITEMS TABLE */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                {isAlreadyForwarded ? 'Itemized Product & Material Breakdown' : 'Product Verification List'}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                {isAlreadyForwarded
                  ? 'Itemized specifications and rate breakdown passed to Production & Dispatch teams.'
                  : 'Check every product box after verifying item details. Modify or add products if incorrect.'}
              </span>
            </div>

            {!isAlreadyForwarded && (
              <button
                onClick={() => {
                  const currentItems = confirmingBomModal.items || [];
                  const updatedItems = [...currentItems, { name: '', category: '', qty: 1, rate: 0, confirmed: false }];
                  setConfirmingBomModal({ ...confirmingBomModal, items: updatedItems });
                }}
                style={{ border: '1px solid #A5F3FC', backgroundColor: '#ECFEFF', color: '#0E7490', height: '36px', padding: '0 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus style={{ width: '14px', height: '14px' }} /> Add New Product
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  {!isAlreadyForwarded && (
                    <th style={{ padding: '12px 10px', width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        title="Select and confirm all products"
                        checked={(confirmingBomModal.items || []).length > 0 && (confirmingBomModal.items || []).every(it => it.confirmed)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const updated = (confirmingBomModal.items || []).map(it => ({ ...it, confirmed: checked }));
                          setConfirmingBomModal({ ...confirmingBomModal, items: updated });
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#166534', cursor: 'pointer' }}
                      />
                    </th>
                  )}
                  <th style={{ padding: '12px 10px', width: '40px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '12px 10px', width: '25%' }}>Product / Component Name</th>
                  <th style={{ padding: '12px 10px', width: '18%' }}>Description</th>
                  <th style={{ padding: '12px 10px', width: '9%', textAlign: 'center' }}>UOM</th>
                  <th style={{ padding: '12px 10px', width: '9%', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '12px 10px', width: '12%', textAlign: 'right' }}>Rate (₹)</th>
                  <th style={{ padding: '12px 10px', width: '13%', textAlign: 'right' }}>Total (₹)</th>
                  {!isAlreadyForwarded && <th style={{ padding: '12px 10px', width: '50px', textAlign: 'center' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {(confirmingBomModal.items || []).map((item, idx) => {
                  const itemQty = parseFloat(item.qty) || 0;
                  const itemRate = parseFloat(item.rate) || 0;
                  const itemTotal = itemQty * itemRate;

                  if (isAlreadyForwarded) {
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: '#64748B' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 10px', fontWeight: '700', color: '#0F172A' }}>{item.name || '—'}</td>
                        <td style={{ padding: '12px 10px', color: '#64748B' }}>{item.category || item.specs || '—'}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>{item.uom || item.unit || 'NOS'}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', color: '#2563EB' }}>{itemQty}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: '#334155' }}>₹ {itemRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>₹ {itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: item.confirmed ? '#F0FDF4' : 'transparent' }}>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(item.confirmed)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const updatedItems = (confirmingBomModal.items || []).map((it, i) => i === idx ? { ...it, confirmed: checked } : it);
                            setConfirmingBomModal({ ...confirmingBomModal, items: updatedItems });
                          }}
                          style={{ width: '16px', height: '16px', accentColor: '#166534', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '700', color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            list={`confirm-product-list-${idx}`}
                            placeholder="Type or select product / item..."
                            value={item.name || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matched = (itemsList || []).find(it => (it.name || '').toLowerCase() === val.toLowerCase() || (it.code || '').toLowerCase() === val.toLowerCase());
                              const updatedItems = (confirmingBomModal.items || []).map((it, i) => i === idx ? {
                                ...it,
                                name: matched ? matched.name : val,
                                rate: matched ? Number(matched.price || matched.rate || it.rate) : it.rate,
                                uom: matched ? (matched.uom || matched.unit || it.uom) : it.uom,
                                category: matched ? (matched.category || matched.description || it.category) : it.category
                              } : it);
                              setConfirmingBomModal({ ...confirmingBomModal, items: updatedItems });
                            }}
                            style={{
                              width: '100%',
                              height: '34px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              padding: '0 8px',
                              fontSize: '12px',
                              color: '#0F172A',
                              backgroundColor: 'white',
                              outline: 'none',
                              fontWeight: '600',
                              boxSizing: 'border-box'
                            }}
                          />
                          <datalist id={`confirm-product-list-${idx}`}>
                            {(itemsList || []).map((prod, pidx) => {
                              const st = Number(prod.stock !== undefined ? prod.stock : (prod.availableStock !== undefined ? prod.availableStock : 0));
                              const isOutOfStock = st <= 0;
                              const stockLabel = isOutOfStock ? '⚠️ (Stock: 0 / BLOCKED)' : `✓ (Available Stock: ${st.toLocaleString()} ${prod.uom || prod.unit || 'NOS'})`;
                              return (
                                <option key={pidx} value={prod.name}>
                                  {prod.code ? `[${prod.code}] ${prod.name} ${stockLabel}` : `${prod.name} ${stockLabel}`}
                                </option>
                              );
                            })}
                          </datalist>
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <input
                          type="text"
                          placeholder="Description..."
                          value={item.category || item.specs || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedItems = (confirmingBomModal.items || []).map((it, i) => i === idx ? { ...it, category: val, specs: val } : it);
                            setConfirmingBomModal({ ...confirmingBomModal, items: updatedItems });
                          }}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', color: '#0F172A', outline: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <input
                          type="text"
                          placeholder="UOM"
                          value={item.uom || item.unit || 'NOS'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedItems = (confirmingBomModal.items || []).map((it, i) => i === idx ? { ...it, uom: val, unit: val } : it);
                            setConfirmingBomModal({ ...confirmingBomModal, items: updatedItems });
                          }}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '12px', textAlign: 'center', fontWeight: '700', color: '#0F172A', outline: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedItems = (confirmingBomModal.items || []).map((it, i) => i === idx ? { ...it, qty: val } : it);
                            setConfirmingBomModal({ ...confirmingBomModal, items: updatedItems });
                          }}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '12px', textAlign: 'center', color: '#0F172A', outline: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedItems = (confirmingBomModal.items || []).map((it, i) => i === idx ? { ...it, rate: val } : it);
                            setConfirmingBomModal({ ...confirmingBomModal, items: updatedItems });
                          }}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px', textAlign: 'right', color: '#0F172A', outline: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>
                        ₹ {itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            const updatedItems = (confirmingBomModal.items || []).filter((_, i) => i !== idx);
                            setConfirmingBomModal({ ...confirmingBomModal, items: updatedItems });
                          }}
                          style={{ border: 'none', background: '#FEE2E2', color: '#DC2626', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Math & Action Block */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {isAlreadyForwarded ? (
              <>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Showing {confirmingBomModal.items?.length || 0} itemized BOM components</span>
                <div style={{ fontSize: '14px', color: '#334155' }}>
                  Total Order Value: <strong style={{ color: '#0F172A', fontSize: '16px', fontWeight: '900' }}>₹ {(parseFloat(confirmingBomModal.grandTotal) || grandTotalCalc).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                    const isDeliveryMatching = Boolean(confirmingBomModal.sameAsBilling) || (
                      ((dObj.address || '').trim() === (bObj.address || '').trim()) &&
                      ((dObj.city || '').trim() === (bObj.city || '').trim()) &&
                      ((dObj.state || '').trim() === (bObj.state || '').trim()) &&
                      ((dObj.pincode || '').trim() === (bObj.pincode || '').trim())
                    );



                    const currentItems = confirmingBomModal.items || [];
                    const allCheckedItems = currentItems.map(it => ({ ...it, confirmed: true }));
                    const bStr = formatAddr(bObj, confirmingBomModal.billingAddress);
                    const dStr = confirmingBomModal.sameAsBilling ? bStr : formatAddr(dObj, confirmingBomModal.deliveryAddress);
                    const finalDObj = confirmingBomModal.sameAsBilling ? { ...bObj } : { ...dObj };

                    setConfirmingBomModal({ ...confirmingBomModal, items: allCheckedItems });
                    setBomStore(prev => prev.map(b => b.bomCode === confirmingBomModal.bomCode ? {
                      ...b,
                      companyName: confirmingBomModal.companyName || b.companyName,
                      paymentType: confirmingBomModal.paymentType || b.paymentType,
                      billingAddress: bStr,
                      billingAddressObj: bObj,
                      deliveryAddress: dStr,
                      deliveryAddressObj: finalDObj,
                      deliveryAddressProofDoc: confirmingBomModal.sameAsBilling ? null : (confirmingBomModal.deliveryAddressProofDoc || null),
                      items: allCheckedItems,
                      status: 'Pending Confirmation',
                      grandTotal: grandTotalCalc
                    } : b));
                    alert('All product specifications confirmed! You can now click Send BOM.');
                  }}
                  style={{ border: 'none', backgroundColor: '#1E40AF', color: 'white', height: '38px', padding: '0 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckSquare style={{ width: '14px', height: '14px' }} /> Confirm All Products
                </button>
            )}
          </div>
        </div>

        {/* DOCUMENT PREVIEW MODAL */}
        {renderDocPreviewModal()}
      </div>
    );
  }

  // ==========================================
  // RENDER 3: DEFAULT BOM TABLE & PAGINATION
  // ==========================================
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      {/* 1. TOP HEADER WITH CREATE BOM BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            {pageConfig.title}
          </h2>
          <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            {pageConfig.subtitle}
          </span>
        </div>
        {userRole !== 'CEO' && userRole !== 'MD' && userRole !== 'Managing Director' && (
          <button
            onClick={handleOpenCreateBom}
            style={{
              backgroundColor: '#0E7490',
              border: 'none',
              color: '#FFFFFF',
              height: '40px',
              padding: '0 6px 0 20px',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(14, 116, 144, 0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{pageConfig.actionText}</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0E7490'
            }}>
              <Plus size={16} strokeWidth={3} />
            </div>
          </button>
        )}
      </div>

      {/* ADDRESS PROOF RE-UPLOAD REQUEST NOTIFICATION BANNER */}
      {(bomStore || []).some(b => b.addressProofReuploadRequested || b.status === 'Address Proof Requested from Sales') && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#991B1B' }}>
                Action Required: Address Proof Re-upload Requested by Accounts / Invoice Desk
              </div>
              <div style={{ fontSize: '12px', color: '#B91C1C' }}>
                Accounts team requested verified address proof document for orders where delivery address differs from billing address. Previous uploads are preserved in document history.
              </div>
            </div>
          </div>
          <button
            onClick={() => { setActiveSubTab('AddressAction'); setCurrentPage(1); }}
            style={{
              border: 'none',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Review Requested Orders
          </button>
        </div>
      )}

      {/* 2. FILTERS & SEARCH ROW */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', width: '100%', boxSizing: 'border-box', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#f8fafc', width: '340px' }}>
          <Search style={{ width: '15px', height: '15px', color: '#64748b' }} />
          <input
            type="text"
            placeholder={pageConfig.searchPlaceholder}
            value={searchQueryText}
            onChange={(e) => setSearchQueryText(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#334155' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: 'white' }}>
            <Calendar style={{ width: '14px', height: '14px', color: '#64748b' }} />
            <input
              type="date"
              value={filterDateVal}
              onChange={(e) => setFilterDateVal(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'transparent' }}
            />
          </div>

          <button
            onClick={() => { setSearchQueryText(''); setFilterDateVal(''); setFilterStatusSelect('All'); }}
            title="Clear Filters"
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              height: '38px',
              width: '38px'
            }}
          >
            <RotateCcw style={{ width: '15px', height: '15px' }} />
          </button>
        </div>
      </div>

      {/* 3. STATUS SUB-TABS ROW */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '20px', padding: '4px 0', alignItems: 'center', flexWrap: 'wrap' }}>
        {pageConfig.tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveSubTab(tab.id); setCurrentPage(1); }}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '10px 4px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: activeSubTab === tab.id ? '#2563eb' : '#64748b',
              borderBottom: activeSubTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {tab.label}
            <span style={{
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '12px',
              backgroundColor: tab.bg,
              color: tab.fg,
              fontWeight: 'bold'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. MAIN DATA TABLE WITH INTERACTIVE ROW SELECTION */}
      <div className="section-card" style={{ padding: '0', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#475569', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '12px', fontWeight: 'bold', height: '48px' }}>
                <th style={{ width: '48px', minWidth: '48px', maxWidth: '48px', padding: '12px 0', textAlign: 'center', verticalAlign: 'middle', boxSizing: 'border-box' }}>
                  <input
                    type="checkbox"
                    style={{ accentColor: '#0E7490', cursor: 'pointer', verticalAlign: 'middle', margin: 0 }}
                    checked={filteredRows.length > 0 && filteredRows.every(r => selectedRows.includes(r.code))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(filteredRows.map(r => r.code));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                  />
                </th>
                {pageConfig.headers.filter(h => h !== 'Action' && h !== 'Actions').map((h, i) => {
                  const isRight = h.includes('Total') || h.includes('Value') || h.includes('Rate');
                  let colWidth = 'auto';
                  let minColWidth = '140px';
                  if (i === 0) { colWidth = '150px'; minColWidth = '150px'; }
                  else if (i === 1) { minColWidth = '220px'; }
                  else if (h === 'Status') { colWidth = '160px'; minColWidth = '160px'; }
                  else if (isRight) { colWidth = '150px'; minColWidth = '150px'; }
                  else if (h.includes('Date')) { colWidth = '130px'; minColWidth = '130px'; }
                  else if (h.includes('Payment')) { colWidth = '150px'; minColWidth = '150px'; }

                  return (
                    <th key={i} style={{
                      width: colWidth,
                      minWidth: minColWidth,
                      padding: '12px 14px',
                      fontWeight: 'bold',
                      textAlign: isRight ? 'right' : 'left',
                      boxSizing: 'border-box',
                      whiteSpace: 'nowrap'
                    }}>
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, idx) => {
                const isChecked = selectedRows.includes(row.code);
                return (
                  <tr key={idx} style={{
                    borderBottom: '1px solid #F1F5F9',
                    transition: 'all 0.15s ease',
                    backgroundColor: isChecked ? '#ECFEFF' : 'transparent'
                  }} className={`table-row-hover ${isChecked ? 'selected-row' : ''}`}>
                    <td style={{
                      width: '48px',
                      minWidth: '48px',
                      padding: '12px 0',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      boxSizing: 'border-box',
                      borderLeft: isChecked ? '4px solid #0E7490' : '4px solid transparent'
                    }}>
                      <input
                        type="checkbox"
                        style={{ accentColor: '#0E7490', cursor: 'pointer', verticalAlign: 'middle', margin: 0 }}
                        checked={isChecked}
                        onChange={() => handleSelectRowGeneric(row.code)}
                      />
                    </td>
                    <td
                      onClick={() => {
                        const isDraftOrPending = ['Draft', 'Pending Confirmation', 'Edited / Pending Confirmation', 'Cancelled & Reissued to Dispatch', 'ACTIVE', 'Active', 'Pending Verification', 'Pending'].includes(row.status);
                        setConfirmingBomModal({ ...row, isEditMode: isDraftOrPending });
                      }}
                      style={{ padding: '12px 14px', fontWeight: 'bold', color: '#2563EB', cursor: 'pointer' }}
                    >
                      {row.code}
                    </td>
                    <td
                      onClick={() => {
                        const isDraftOrPending = ['Draft', 'Pending Confirmation', 'Edited / Pending Confirmation', 'Cancelled & Reissued to Dispatch', 'ACTIVE', 'Active', 'Pending Verification', 'Pending'].includes(row.status);
                        setConfirmingBomModal({ ...row, isEditMode: isDraftOrPending });
                      }}
                      style={{ padding: '12px 14px', color: '#64748B', cursor: 'pointer' }}
                    >
                      {row.c2}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1E293B' }}>{row.c3}</td>
                    <td style={{ padding: '12px 14px', color: '#0E7490', fontWeight: '700', fontSize: '12px' }}>
                      <span style={{ backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        👤 {(row.salesPerson || defaultSalesPersonName || 'Mohit JV').replace(/\s*\([^)]*\)/g, '').trim()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{row.c4}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0F172A', textAlign: 'right' }}>{row.c5}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'left' }}>
                      <span style={{ backgroundColor: row.stBg, color: row.stFg, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px', border: row.stBorder }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: row.stFg }}></span>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER - STRICT RULES MATCH */}
        {filteredRows.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', fontSize: '13px', color: '#64748B', borderTop: '1px solid #F1F5F9', backgroundColor: '#FFFFFF' }}>
            {/* Left Side: Rows per page selector + Showing X to Y entries */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Showing per page</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', padding: '0 8px', backgroundColor: 'white', fontWeight: 'bold' }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>
              <span>Showing {filteredRows.length === 0 ? 0 : indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredRows.length)} of {filteredRows.length} entries</span>
            </div>

            {/* Right Side: Page navigation controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  style={{ border: '1px solid #E2E8F0', background: currentPage === 1 ? '#F8FAFC' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '6px', color: '#64748B', fontWeight: 'bold' }}
                >
                  &laquo;
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  style={{ border: '1px solid #E2E8F0', background: currentPage === 1 ? '#F8FAFC' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '6px', color: '#64748B' }}
                >
                  &lt;
                </button>

                {(() => {
                  let start = Math.max(1, currentPage - 1);
                  let end = start + 2;
                  if (end > totalPages) {
                    end = totalPages;
                    start = Math.max(1, end - 2);
                  }
                  return Array.from({ length: Math.max(1, end - start + 1) }, (_, i) => start + i).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        border: '1px solid #E2E8F0',
                        background: page === currentPage ? '#0E7490' : 'white',
                        color: page === currentPage ? 'white' : '#475569',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: page === currentPage ? 'bold' : '500'
                      }}
                    >
                      {page}
                    </button>
                  ));
                })()}

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  style={{ border: '1px solid #E2E8F0', background: (currentPage === totalPages || totalPages === 0) ? '#F8FAFC' : 'white', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '6px', color: '#64748B' }}
                >
                  &gt;
                </button>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(totalPages)}
                  style={{ border: '1px solid #E2E8F0', background: (currentPage === totalPages || totalPages === 0) ? '#F8FAFC' : 'white', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '6px', color: '#64748B', fontWeight: 'bold' }}
                >
                  &raquo;
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Go to page</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages || 1}
                  defaultValue={currentPage}
                  id="bom-orders-goto-page-input"
                  style={{ width: '42px', height: '32px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}
                />
                <button
                  onClick={() => {
                    const val = parseInt(document.getElementById('bom-orders-goto-page-input')?.value || '1', 10);
                    if (val >= 1 && val <= totalPages) setCurrentPage(val);
                  }}
                  style={{ height: '32px', padding: '0 10px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#0E7490', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  Go &rsaquo;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BAR FOR SELECTED ROWS */}
      {selectedRows.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '50px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '8px 16px',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          gap: '8px',
          zIndex: 10000,
          width: 'max-content',
          maxWidth: 'calc(100vw - 32px)',
          overflowX: 'auto',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '4px', paddingRight: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <strong style={{ color: '#0F172A', fontSize: '14px' }}>{selectedRows.length}</strong> Selected
          </span>

          {userRole !== 'CEO' && userRole !== 'MD' && userRole !== 'Managing Director' && (
            <button
              onClick={() => {
                if (selectedRows.length > 1) {
                  alert('You cannot edit multiple items at once.');
                } else if (selectedRows.length === 1) {
                  const codeVal = selectedRows[0];
                  const targetRow = (filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || { code: codeVal };
                  setConfirmingBomModal({ ...targetRow, isEditMode: true });
                }
              }}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#1E293B',
                borderRadius: '10px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Edit3 size={14} style={{ color: '#64748B' }} /> Edit Info
            </button>
          )}

          {userRole !== 'CEO' && userRole !== 'MD' && userRole !== 'Managing Director' && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedRows.length} selected BOM item(s)?`)) {
                  setBomStore(prev => prev.filter(b => !selectedRows.includes(b.bomCode || b.code)));
                  setSelectedRows([]);
                }
              }}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#1E293B',
                borderRadius: '10px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Trash2 size={14} style={{ color: '#DC2626' }} /> Delete
            </button>
          )}

          {userRole !== 'CEO' && userRole !== 'MD' && userRole !== 'Managing Director' && (() => {
            const isTargetAlreadyConfirmed = (selectedRows || []).every(codeVal => {
              const row = (filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || (bomStore || []).find(b => (b.bomCode || b.code) === codeVal);
              return row && (row.salesConfirmed || ['Sales Confirmed - Sent to Dispatch', 'Sent to Production', 'Confirmed', 'Packed & Ready for Dispatch', 'Partially Packed', 'Closed', 'CLOSED', 'Dispatch Packing Verified - Sent to Accounts'].includes(row.status));
            });
            if (isTargetAlreadyConfirmed) return null;

            return (
              <button
                onClick={() => {
                  if (selectedRows.length > 1) {
                    alert('Please select a single BOM to confirm and review.');
                  } else if (selectedRows.length === 1) {
                    const codeVal = selectedRows[0];
                    const targetRow = (filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || { code: codeVal };
                    const isDraftOrPending = ['Draft', 'Pending Confirmation', 'Pending Sales Confirmation', 'Edited / Pending Confirmation', 'Cancelled & Reissued to Dispatch', 'ACTIVE', 'Active', 'Pending Verification', 'Pending'].includes(targetRow.status);
                    setConfirmingBomModal({ ...targetRow, isEditMode: isDraftOrPending });
                  }
                }}
                style={{
                  backgroundColor: '#0E7490',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(14, 116, 144, 0.25)'
                }}
              >
                <CheckCircle size={14} style={{ color: '#FFFFFF' }} /> Confirm BOM
              </button>
            );
          })()}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const codeVal = (selectedRows && selectedRows.length > 0) ? selectedRows[0] : null;
              const targetRow = codeVal
                ? ((filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || { code: codeVal, name: `Record #${codeVal}` })
                : (filteredRows && filteredRows[0] ? filteredRows[0] : null);
              setQuickPreviewRecord(targetRow);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#1E293B',
              borderRadius: '10px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Eye size={14} style={{ color: '#0E7490' }} /> View Details
          </button>

          <button
            onClick={() => {
              const codeVal = (selectedRows && selectedRows.length > 0) ? selectedRows[0] : null;
              const targetRow = codeVal
                ? ((filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || (bomStore || []).find(b => b.bomCode === codeVal))
                : ((bomStore || [])[0] || (filteredRows || [])[0]);

              if (targetRow) {
                setUploadPaymentModal(targetRow);
              }
            }}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#1E293B',
              borderRadius: '10px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <CreditCard size={14} style={{ color: '#2563EB' }} /> Payment Details
          </button>

          {canCancelBom && (() => {
            const hasCancellable = (selectedRows || []).some(codeVal => {
              const row = (filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || (bomStore || []).find(b => (b.bomCode || b.code) === codeVal);
              return row && row.status !== 'Cancelled & Stock Restored';
            });
            if (!hasCancellable) return null;

            return (
              <button
                onClick={() => {
                  const targetCode = selectedRows[0];
                  const targetBom = (filteredRows || []).find(r => r.code === targetCode || r.id === targetCode || r.bomCode === targetCode) || (bomStore || []).find(b => (b.bomCode || b.code) === targetCode);
                  if (targetBom) handleCancelBomOrder(targetBom);
                }}
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(220, 38, 38, 0.1)'
                }}
              >
                <XCircle size={14} style={{ color: '#DC2626' }} /> Cancel BOM
              </button>
            );
          })()}

          <button
            onClick={() => {
              const codeVal = (selectedRows && selectedRows.length > 0) ? selectedRows[0] : null;
              const targetRow = codeVal
                ? ((filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || (bomStore || []).find(b => (b.bomCode || b.code) === codeVal))
                : ((bomStore || [])[0] || (filteredRows || [])[0]);

              if (targetRow) {
                setPrintingBomRecord(targetRow);
              } else {
                alert('Please select a BOM record to print.');
              }
            }}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#1E293B',
              borderRadius: '10px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Printer size={14} style={{ color: '#059669' }} /> Print
          </button>

          <button
            onClick={() => {
              setSelectedRows([]);
              setShowFloatingMoreMenu(false);
            }}
            title="Deselect all"
            style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* QUICK PREVIEW DRAWER */}
      {quickPreviewRecord && (
        <div
          onClick={() => setQuickPreviewRecord(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 20000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#FFFFFF', width: '580px', maxWidth: '92vw', height: '100vh', overflowY: 'auto', boxShadow: '-12px 0 40px rgba(15, 23, 42, 0.2)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>BOM Order Preview</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setExportFormatRecord(quickPreviewRecord)}
                  title="Export BOM (PDF, JPG, or CSV)"
                  style={{
                    border: '1px solid #0E7490',
                    backgroundColor: '#ECFEFF',
                    color: '#0E7490',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <Download size={14} style={{ color: '#0E7490' }} /> Export
                </button>
                <button
                  onClick={() => {
                    const rec = quickPreviewRecord;
                    setQuickPreviewRecord(null);
                    setConfirmingBomModal({ ...rec, isEditMode: true });
                  }}
                  style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#1E293B', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  View Full Details
                </button>
                <button onClick={() => setQuickPreviewRecord(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'inline-flex', alignItems: 'center' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '4px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ECFEFF', color: '#0E7490', border: '2px solid #0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', flexShrink: 0 }}>
                {(quickPreviewRecord.customerName || quickPreviewRecord.companyName || 'B').charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  {quickPreviewRecord.customerName || quickPreviewRecord.companyName || 'Customer Order'}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Ref Code: <strong style={{ color: '#0E7490' }}>{quickPreviewRecord.bomCode || quickPreviewRecord.code}</strong>
                </span>
              </div>
            </div>

            {/* Order Meta Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>REF CODE</span>
                <strong style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800' }}>{quickPreviewRecord.bomCode || quickPreviewRecord.code}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>STATUS</span>
                <strong style={{ fontSize: '13px', color: '#0E7490', fontWeight: '800' }}>{quickPreviewRecord.status}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>TOTAL ITEMS</span>
                <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800' }}>{(quickPreviewRecord.items || []).length}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase' }}>ORDER VALUE</span>
                <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800' }}>
                  {quickPreviewRecord.grandTotal ? `₹ ${Number(quickPreviewRecord.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : (quickPreviewRecord.c5 || '—')}
                </strong>
              </div>
            </div>

            {/* Sales & Payment Terms Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block' }}>Sales Creator</span>
                <strong style={{ fontSize: '13px', color: '#0E7490', fontWeight: '800' }}>
                  👤 {(quickPreviewRecord.salesPerson || 'Mohit JV').replace(/\s*\([^)]*\)/g, '').trim()}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block' }}>Payment Terms</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: '800' }}>
                    {quickPreviewRecord.paymentType || '100% Paid'}
                  </strong>
                  {(quickPreviewRecord.paymentProofDoc || quickPreviewRecord.payments?.proofDoc) && (
                    <button
                      type="button"
                      onClick={() => setPreviewDocModal({ title: 'Payment Proof Document', doc: quickPreviewRecord.paymentProofDoc || { name: quickPreviewRecord.payments?.proofDoc, dataUrl: quickPreviewRecord.payments?.proofDocData } })}
                      style={{ border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Eye size={10} /> Proof
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Structured Billing & Delivery Addresses */}
            {(() => {
              const bObj = quickPreviewRecord.billingAddressObj || {};
              const dObj = quickPreviewRecord.deliveryAddressObj || {};
              const bStr = quickPreviewRecord.billingAddress || (bObj.address ? `${bObj.address}, ${bObj.city || ''} ${bObj.state || ''} - ${bObj.pincode || ''}` : 'Billing address on file');
              const dStr = quickPreviewRecord.deliveryAddress || (dObj.address ? `${dObj.address}, ${dObj.city || ''} ${dObj.state || ''} - ${dObj.pincode || ''}` : bStr);
              const addrDoc = quickPreviewRecord.deliveryAddressProofDoc;

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#2563EB', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                      <FileText size={12} /> Billing Address
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                      {bStr}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#0E7490' }}>
                        <Truck size={12} /> Delivery Address
                      </span>
                      {quickPreviewRecord.sameAsBilling && (
                        <span style={{ fontSize: '10px', color: '#166534', fontWeight: '700' }}>Same as Billing</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                      {dStr}
                    </div>
                    {addrDoc && (
                      <div style={{ marginTop: '4px', padding: '6px 8px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10.5px', color: '#166534', fontWeight: '700' }}>
                          📄 {addrDoc.name || 'Address Proof'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal({ title: 'Delivery Address Proof Document', doc: addrDoc })}
                          style={{ border: 'none', background: 'transparent', color: '#0E7490', cursor: 'pointer', fontSize: '10.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                        >
                          <Eye size={11} /> View
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Transport & Logistics Section if present */}
            {(quickPreviewRecord.transportMode || quickPreviewRecord.transporterName || quickPreviewRecord.vehicleNo || quickPreviewRecord.lrNo || quickPreviewRecord.transportScope) && (
              <div style={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Logistics & Dispatch Information</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', fontSize: '11.5px' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '10px' }}>Mode</span>
                    <strong>{quickPreviewRecord.transportMode || 'Transport'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '10px' }}>Scope</span>
                    <strong style={{ color: quickPreviewRecord.transportScope === 'Customer Scope' ? '#0284C7' : '#0F172A' }}>{quickPreviewRecord.transportScope || 'VRM Structures'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '10px' }}>Transporter</span>
                    <strong>{quickPreviewRecord.transporterName || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '10px' }}>Vehicle No</span>
                    <strong>{quickPreviewRecord.vehicleNo || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '10px' }}>LR / Docket</span>
                    <strong>{quickPreviewRecord.lrNo || '—'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Itemized List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Itemized Products & Materials</h4>
                <span style={{ fontSize: '11px', color: '#64748B' }}>{(quickPreviewRecord.items || []).length} items</span>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                      <th style={{ padding: '8px 10px' }}>#</th>
                      <th style={{ padding: '8px 10px' }}>Product Description</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(quickPreviewRecord.items || []).map((it, idx) => {
                      const q = Number(it.qty || 1);
                      const r = Number(it.rate || 0);
                      const lineTotal = q * r;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 10px', color: '#94A3B8', fontWeight: '700' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0F172A' }}>
                            <div>{it.name || '—'}</div>
                            {it.category && <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '500' }}>{it.category}</span>}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '800', color: '#0E7490' }}>{q} {it.uom || ''}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>₹ {r.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>₹ {lineTotal.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dispatch Packed Items Media Section in Quick Preview */}
            {(() => {
              const packMedia = quickPreviewRecord.dispatchPackingMedia || {};
              const packPhotos = packMedia.photos || [];
              const packVideos = packMedia.videos || [];
              const hasMedia = packPhotos.length > 0 || packVideos.length > 0;

              if (!hasMedia && !quickPreviewRecord.status?.includes('Dispatch') && !quickPreviewRecord.status?.includes('Packed') && !quickPreviewRecord.dispatchPacking) {
                return null;
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Camera size={16} style={{ color: '#0E7490' }} />
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                        Dispatch Packed Items Media ({packPhotos.length} Photos, {packVideos.length} Videos)
                      </h4>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Captured by Dispatch</span>
                  </div>

                  {hasMedia ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                      {packPhotos.map((ph, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setPreviewDocModal({ title: ph.name || `Photo ${pIdx + 1}`, doc: { name: ph.name || `Photo ${pIdx + 1}`, dataUrl: ph.dataUrl } })}
                          style={{ height: '76px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #CBD5E1', backgroundColor: '#0F172A', position: 'relative' }}
                        >
                          <img src={ph.dataUrl} alt={ph.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', fontSize: '9px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                            <span>📷 Photo</span>
                            <span>›</span>
                          </div>
                        </div>
                      ))}
                      {packVideos.map((vd, vIdx) => (
                        <div
                          key={vIdx}
                          onClick={() => setPreviewDocModal({ title: vd.name || `Video ${vIdx + 1}`, doc: { name: vd.name || `Video ${vIdx + 1}`, dataUrl: vd.dataUrl } })}
                          style={{ height: '76px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #CBD5E1', backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative' }}
                        >
                          <Video size={20} style={{ color: '#38BDF8' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', fontSize: '9px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                            <span>🎥 Video</span>
                            <span>›</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px dashed #E2E8F0' }}>
                      No packing photos or videos attached yet for this order.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VIEW / UPLOAD PAYMENT DETAILS MODAL */}
      {uploadPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', maxWidth: '520px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Payment Details & Proof</h3>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>{uploadPaymentModal.bomCode} — {uploadPaymentModal.paymentType || '100% Full Advance'}</span>
                </div>
              </div>
              <button onClick={() => setUploadPaymentModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}><X style={{ width: '18px', height: '18px' }} /></button>
            </div>

            {(() => {
              const proofObj = uploadPaymentModal.paymentProofDoc || uploadPaymentModal.payments?.proofDocObj;
              const hasProof = Boolean(proofObj || uploadPaymentModal.payments?.proofDoc);
              const proofName = typeof proofObj === 'object' ? proofObj?.name : (uploadPaymentModal.payments?.proofDoc || proofObj);
              const proofData = (typeof proofObj === 'object' ? proofObj?.dataUrl : uploadPaymentModal.payments?.proofDocData) || getMediaFromCache(proofName);
              const isImage = proofData && (proofData.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(proofName || ''));

              return (
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Payment Status</span>
                    <span style={{ backgroundColor: hasProof ? '#DCFCE7' : '#FEF3C7', color: hasProof ? '#166534' : '#B45309', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '12px', border: hasProof ? '1px solid #BBF7D0' : '1px solid #FDE68A' }}>
                      {hasProof ? '✓ Payment Proof Uploaded' : '• Pending Payment Upload'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Customer Name</span>
                      <strong style={{ color: '#0F172A' }}>{uploadPaymentModal.customerName || uploadPaymentModal.companyName || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Payment Terms</span>
                      <strong style={{ color: '#0F172A' }}>{uploadPaymentModal.paymentType || '100% Full Advance'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Grand Total Amount</span>
                      <strong style={{ color: '#059669', fontSize: '14px', fontWeight: '800' }}>
                        ₹ {Number(uploadPaymentModal.grandTotal || uploadPaymentModal.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '11px', marginBottom: '2px' }}>Order Ref Code</span>
                      <strong style={{ color: '#0E7490' }}>{uploadPaymentModal.bomCode || '—'}</strong>
                    </div>
                  </div>

                  {hasProof ? (
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>Payment Proof Document:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px 14px' }}>
                        {isImage && proofData ? (
                          <img src={proofData} alt="Proof" style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {proofName || 'Payment_Proof_Document.pdf'}
                          </div>
                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Verified</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDocModal({
                              title: 'Payment Proof Document',
                              doc: typeof proofObj === 'object' && proofObj !== null ? { ...proofObj, dataUrl: proofData } : { name: proofName, dataUrl: proofData }
                            });
                          }}
                          style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '6px 12px', borderRadius: '8px', border: '1px solid #BFDBFE', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Eye size={13} /> View Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#B45309' }}>Upload Payment Proof File:</span>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Payment Stage</label>
                        <select
                          value={paymentStageType}
                          onChange={(e) => setPaymentStageType(e.target.value)}
                          style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', color: '#0F172A', outline: 'none' }}
                        >
                          <option value="100% Advance">100% Full Advance Payment</option>
                          <option value="50% Advance">Stage 1: 50% Advance Payment</option>
                          <option value="50% Dispatch">Stage 2: 50% Dispatch Payment</option>
                          <option value="Net 30 Days">Net 30 Days Credit Payment</option>
                        </select>
                      </div>

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (f) {
                            compressAndSaveFile(f, (res) => {
                              if (res) setPaymentProofFile(res);
                            });
                          }
                        }}
                        style={{ width: '100%', padding: '10px', border: '1px dashed #CBD5E1', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
              <button
                onClick={() => setUploadPaymentModal(null)}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Close
              </button>
              {!(uploadPaymentModal.paymentProofDoc || uploadPaymentModal.payments?.proofDocObj || uploadPaymentModal.payments?.proofDoc) && (
                <button
                  onClick={() => {
                    if (!paymentProofFile) {
                      alert('Please attach or select payment proof file!');
                      return;
                    }
                    const pDocObj = typeof paymentProofFile === 'object' ? paymentProofFile : { name: paymentProofFile, dataUrl: null };
                    setBomStore(prev => prev.map(b => b.bomCode === uploadPaymentModal.bomCode ? {
                      ...b,
                      status: 'Payment Uploaded & Verified',
                      paymentProofDoc: pDocObj,
                      payments: {
                        ...b.payments,
                        proofDoc: pDocObj.name,
                        proofDocObj: pDocObj,
                        proofDocData: pDocObj.dataUrl,
                        advance100Uploaded: paymentStageType === '100% Advance',
                        advance50Uploaded: paymentStageType === '50% Advance' || b.payments?.advance50Uploaded,
                        dispatch50Uploaded: paymentStageType === '50% Dispatch' || b.payments?.dispatch50Uploaded,
                        net30Uploaded: paymentStageType === 'Net 30 Days'
                      }
                    } : b));
                    setUploadPaymentModal(null);
                    alert('✅ Payment proof uploaded successfully!');
                  }}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Save & Verify Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT POPUP */}
      {customAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                backgroundColor: customAlert.type === 'error' ? '#FEE2E2' : customAlert.type === 'warning' ? '#FEF3C7' : '#DCFCE7',
                color: customAlert.type === 'error' ? '#DC2626' : customAlert.type === 'warning' ? '#B45309' : '#166534',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {customAlert.type === 'error' ? <AlertCircle size={20} /> : customAlert.type === 'warning' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{customAlert.title}</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>{customAlert.message}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={() => setCustomAlert(null)}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0E7490', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {renderDocPreviewModal()}

      {/* EXPORT FORMAT SELECTOR MODAL (PDF / JPG / CSV) */}
      {exportFormatRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => !isExportingFormat && setExportFormatRecord(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#ECFEFF',
                    border: '1px solid #CFFAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Download size={20} style={{ color: '#0E7490' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                    Select Export Format
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
                    {exportFormatRecord.bomCode || exportFormatRecord.code || 'BOM Order'} • Choose your required format
                  </p>
                </div>
              </div>
              <button
                disabled={Boolean(isExportingFormat)}
                onClick={() => setExportFormatRecord(null)}
                style={{
                  border: 'none',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isExportingFormat ? 'not-allowed' : 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Format Options */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* PDF Option */}
              <div
                onClick={() => !isExportingFormat && handleExportAsPdf(exportFormatRecord)}
                style={{
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  cursor: isExportingFormat ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  backgroundColor: '#FFFFFF',
                  transition: 'all 0.18s ease',
                  opacity: isExportingFormat && isExportingFormat !== 'pdf' ? 0.45 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#FFF1F2',
                      border: '1px solid #FFE4E6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FileText size={24} style={{ color: '#E11D48' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>PDF Document</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#FFE4E6', color: '#BE123C' }}>.pdf</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                      Official printable A4 document with complete specifications, items, and authorized signature.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={Boolean(isExportingFormat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0E7490',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: isExportingFormat ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isExportingFormat === 'pdf' ? (
                    <>
                      <Loader size={13} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    'Export PDF'
                  )}
                </button>
              </div>

              {/* JPG Option */}
              <div
                onClick={() => !isExportingFormat && handleExportAsJpg(exportFormatRecord)}
                style={{
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  cursor: isExportingFormat ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  backgroundColor: '#FFFFFF',
                  transition: 'all 0.18s ease',
                  opacity: isExportingFormat && isExportingFormat !== 'jpg' ? 0.45 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#EEF2FF',
                      border: '1px solid #E0E7FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Image size={24} style={{ color: '#4F46E5' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>JPG Image</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#E0E7FF', color: '#4338CA' }}>.jpg</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                      High-resolution graphic image formatted for instant mobile viewing, WhatsApp, and chat.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={Boolean(isExportingFormat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0E7490',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: isExportingFormat ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isExportingFormat === 'jpg' ? (
                    <>
                      <Loader size={13} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    'Export JPG'
                  )}
                </button>
              </div>

              {/* CSV Option */}
              <div
                onClick={() => {
                  if (!isExportingFormat) {
                    handleExportBomCsv(exportFormatRecord);
                    setExportFormatRecord(null);
                  }
                }}
                style={{
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  cursor: isExportingFormat ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  backgroundColor: '#FFFFFF',
                  transition: 'all 0.18s ease',
                  opacity: isExportingFormat ? 0.45 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #D1FAE5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FileSpreadsheet size={24} style={{ color: '#059669' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>CSV Spreadsheet</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#D1FAE5', color: '#047857' }}>.csv</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                      Structured tabular spreadsheet with item breakdown, GST, pricing, and customer metadata.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={Boolean(isExportingFormat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0E7490',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: isExportingFormat ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #F1F5F9',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center'
              }}
            >
              <button
                type="button"
                disabled={Boolean(isExportingFormat)}
                onClick={() => setExportFormatRecord(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: isExportingFormat ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden offscreen sheet for high-res PDF / JPG rasterization */}
      {exportFormatRecord && (
        <div
          id="bom-export-hidden-target"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '880px',
            backgroundColor: '#FFFFFF',
            pointerEvents: 'none',
            zIndex: -9999
          }}
        >
          <VRMBomPrintSheet bomData={exportFormatRecord} id="export-sheet-hidden-canvas" />
        </div>
      )}

      {/* PRINTABLE BOM ORDER SHEET TEMPLATE */}
      {printingBomRecord && (
        <VRMBomPrintTemplate
          bomData={printingBomRecord}
          onClose={() => setPrintingBomRecord(null)}
        />
      )}
    </div>
  );
}

