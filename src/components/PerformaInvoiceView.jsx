import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Check, Hourglass, Edit3, Trash2, Eye, FileText, X, UploadCloud, CheckCircle, Search, AlertTriangle, ArrowLeft, ArrowRight, MoreVertical, Edit, Info, Calendar, Filter, ChevronLeft, ChevronRight, RotateCcw, Layers, Tag, MoreHorizontal, Download, Building2, Truck, Boxes, User, Landmark, ShieldCheck, Upload, FileCheck, ShoppingCart, Clock, Printer, Palette } from 'lucide-react';
import StatusBadge from './StatusBadge';
import SearchablePresetSelector from './SearchablePresetSelector';
import VRMProformaInvoicePrintTemplate from './VRMProformaInvoicePrintTemplate';
import { VRM_HDG_PRESETS, getAllActivePresets } from '../vrmHdgProposalPresets';
import { saveMediaToCache, getMediaFromCache, compressAndSaveFile } from '../utils/otherViewsShared';
import { getFullProductsCatalogWithStock } from '../utils/productCatalogService';
import { saveCloudStore, fetchCloudStore } from '../utils/supabaseDataSync';

const defaultSalesPIs = [
  {
    piNo: 'SPI-2025-101',
    vendor: 'Apex Infra Solutions',
    gstNo: '33AAAAA9999A1Z9',
    productName: 'Solar Mounting Structures & Fasteners',
    unitValue: 250000,
    quantity: 15,
    amount: '₹37,50,000',
    pdfName: 'sales_pi_apex_infra.pdf',
    piDate: '24 May 2025',
    expDate: '24 Jun 2025',
    status: 'Issued',
    statusType: 'issued',
    type: 'Sales PI'
  },
  {
    piNo: 'SPI-2025-102',
    vendor: 'SunGrid Power Systems',
    gstNo: '27BBBBB8888B2Z8',
    productName: 'Rooftop Solar Rails 4.2m',
    unitValue: 145000,
    quantity: 10,
    amount: '₹14,50,000',
    pdfName: 'sales_pi_sungrid.pdf',
    piDate: '22 May 2025',
    expDate: '22 Jun 2025',
    status: 'Issued',
    statusType: 'issued',
    type: 'Sales PI'
  }
];

const defaultProcurementPIs = [
  {
    piNo: 'PPI-2025-001',
    vendor: 'Tata Steel Ltd.',
    gstNo: '22AAAAA1234A1Z1',
    productName: 'Structural Steel Beams',
    unitValue: 187500,
    quantity: 10,
    amount: '₹18,75,000',
    pdfName: 'pi_tata_steel_2025.pdf',
    piDate: '20 May 2025',
    expDate: '20 Jun 2025',
    status: 'Issued',
    statusType: 'issued',
    type: 'Procurement PI'
  },
  {
    piNo: 'PPI-2025-002',
    vendor: 'Jindal Aluminium',
    gstNo: '29BBBBB5678B2Z2',
    productName: 'Aluminum Sheets',
    unitValue: 124000,
    quantity: 10,
    amount: '₹12,40,000',
    pdfName: 'pi_jindal_ref_99.pdf',
    piDate: '19 May 2025',
    expDate: '19 Jun 2025',
    status: 'Issued',
    statusType: 'issued',
    type: 'Procurement PI'
  },
  {
    piNo: 'PPI-2025-003',
    vendor: 'Havells India Ltd.',
    gstNo: '07CCCCC9012C3Z3',
    productName: 'Electrical Cables',
    unitValue: 63500,
    quantity: 10,
    amount: '₹6,35,000',
    pdfName: 'pi_havells_elect.pdf',
    piDate: '18 May 2025',
    expDate: '18 Jun 2025',
    status: 'Issued',
    statusType: 'issued',
    type: 'Procurement PI'
  }
];

const normalizePiRecord = (item) => {
  if (!item) return item;
  if (item.status === 'Pending Approval' || item.status === 'Approved') {
    return { ...item, status: 'Issued', statusType: 'issued' };
  }
  return item;
};

export default function PerformaInvoiceView({ onConvertToBom, userRole = 'Procurement Head', onNavigateTab }) {
  const isSalesRole = userRole === 'Sales Head' || userRole === 'Sales Executive';
  const storageKey = isSalesRole ? 'controlroom_sales_pi_store' : 'controlroom_procurement_pi_store';

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [selectedPi, setSelectedPi] = useState(null); // For viewing details popup overlay
  const [printModalPi, setPrintModalPi] = useState(null); // For official Print & PDF template
  const [searchQuery, setSearchQuery] = useState('');
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);

  const [piList, setPiList] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizePiRecord);
      }
      // If procurement store is checked but sales has records, check if user has converted PIs
      if (!isSalesRole) {
        const salesSaved = localStorage.getItem('controlroom_sales_pi_store');
        if (salesSaved) {
          const salesParsed = JSON.parse(salesSaved);
          if (Array.isArray(salesParsed) && salesParsed.length > 0) {
            return [...salesParsed, ...defaultProcurementPIs].map(normalizePiRecord);
          }
        }
      }
    } catch (e) {}
    return (isSalesRole ? defaultSalesPIs : defaultProcurementPIs).map(normalizePiRecord);
  });

  const currentEmpId = (localStorage.getItem('controlroom_logged_emp_id') || '').trim();
  const currentEmpName = (localStorage.getItem('controlroom_logged_user_name') || '').trim();
  const currentLoggedEmail = (localStorage.getItem('controlroom_logged_user') || '').trim().toLowerCase();
  const isRestrictedSalesUser = userRole === 'Sales Executive';

  const getEffectiveSalesPerson = () => {
    if (currentEmpName && currentEmpName !== 'undefined' && currentEmpName !== 'null') return currentEmpName;
    const storedUser = localStorage.getItem('controlroom_logged_user');
    if (storedUser && storedUser.trim() && storedUser !== 'undefined' && storedUser !== 'null') return storedUser.trim();
    if (userRole === 'Sales Head') return 'Vijay';
    if (userRole === 'Accounts Head') return 'Venkatesh';
    if (userRole === 'Technical Administrator' || userRole === 'CEO') return 'Annamalaiyar';
    return userRole || 'Sales Executive';
  };

  const visiblePIList = useMemo(() => {
    const raw = Array.isArray(piList) ? piList.filter(Boolean) : [];
    if (!isRestrictedSalesUser) return raw;

    const curCode = currentEmpId.toUpperCase();
    const curName = currentEmpName.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    const curEmail = currentLoggedEmail;

    return raw.filter(pi => {
      if (!pi) return false;
      const spCode = (pi.salesPersonCode || pi.createdById || '').trim().toUpperCase();
      if (curCode && spCode && spCode === curCode) return true;

      const spName = (pi.salesPerson || pi.salesperson || pi.salesRep || pi.createdBy || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      if (curName && spName) {
        if (spName === curName) return true;
        const cleanSp = spName.replace(/\s+/g, '');
        const cleanCur = curName.replace(/\s+/g, '');
        if (cleanSp === cleanCur || cleanSp.includes(cleanCur) || cleanCur.includes(cleanSp)) return true;
      }

      if (curEmail && (pi.salesPersonEmail || pi.email || '').toLowerCase() === curEmail) return true;
      return false;
    });
  }, [piList, isRestrictedSalesUser, currentEmpId, currentEmpName, currentLoggedEmail]);

  useEffect(() => {
    const cloudKey = isSalesRole ? 'sales_pi_store' : 'procurement_pi_store';
    Promise.all([
      fetchCloudStore(cloudKey).catch(() => []),
      fetch('/api/zoho/estimates').then(r => r.ok ? r.json() : []).catch(() => [])
    ]).then(([cloudData, zohoData]) => {
      const mergedMap = new Map();
      if (Array.isArray(cloudData)) {
        cloudData.forEach(p => { if (p && p.piNo) mergedMap.set(String(p.piNo).toLowerCase(), p); });
      }
      if (Array.isArray(zohoData)) {
        zohoData.forEach(zp => {
          if (zp && zp.piNo) {
            const k = String(zp.piNo).toLowerCase();
            if (!mergedMap.has(k)) {
              mergedMap.set(k, zp);
            } else {
              mergedMap.set(k, { ...mergedMap.get(k), ...zp });
            }
          }
        });
      }
      if (mergedMap.size > 0) {
        const result = Array.from(mergedMap.values()).map(normalizePiRecord);
        setPiList(result);
        try {
          localStorage.setItem(storageKey, JSON.stringify(result));
        } catch (_) {}
      }
    }).catch(() => {});
  }, [storageKey, isSalesRole]);

  const updatePiList = (newList) => {
    setPiList(newList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newList));
      saveCloudStore(isSalesRole ? 'sales_pi_store' : 'procurement_pi_store', newList);
      window.dispatchEvent(new Event('controlroom_storage_update'));
    } catch (e) {}
  };

  const handleConvertToBom = (pi) => {
    if (!pi) return;
    const cleanAmount = parseFloat(String(pi.amount || '').replace(/[^0-9.]/g, '')) || 0;
    const qty = parseFloat(pi.quantity) || 1;
    const rate = pi.unitValue || (cleanAmount > 0 ? cleanAmount / qty : 1000);

    const conversionData = {
      sourcePiNo: pi.piNo,
      customerName: pi.vendor || pi.customerName || '',
      contactPerson: pi.contactPerson || '',
      phone: pi.phone || '',
      email: pi.email || '',
      gstNo: pi.gstNo || '',
      productName: pi.productName || 'Solar Mounting Rails & Accessories',
      billingAddress: pi.billingAddress || null,
      deliveryAddress: pi.deliveryAddress || null,
      sameAsBilling: pi.sameAsBilling !== undefined ? pi.sameAsBilling : true,
      transportMode: pi.transportMode || 'Transport',
      transporterName: pi.transporterName || '',
      vehicleNo: pi.vehicleNo || '',
      transportScope: pi.transportScope || 'VRM Structures',
      paymentTerms: pi.paymentTerms || '',
      creditDays: pi.creditDays || '',
      presetGroups: pi.presetGroups || {},
      salesPerson: pi.salesPerson || pi.salesperson || pi.salesRep || getEffectiveSalesPerson(),
      salesPersonCode: pi.salesPersonCode || currentEmpId,
      createdBy: pi.createdBy || getEffectiveSalesPerson(),
      createdById: pi.createdById || currentEmpId,
      items: (pi.items && pi.items.length > 0) ? pi.items : [
        {
          name: pi.productName || 'Structural Steel Beams',
          category: 'PI Converted Materials',
          uom: 'NOS',
          qty: String(qty),
          rate: String(rate),
          gstRate: '18%'
        }
      ],
      remarks: `Converted automatically from Proforma Invoice (${pi.piNo}) dated ${pi.piDate || 'N/A'}.`
    };

    // Update PI record status to 'Converted to BOM' for accurate tracking
    const updatedList = piList.map(item => item.piNo === pi.piNo ? { ...item, status: 'Converted to BOM', statusType: 'converted' } : item);
    updatePiList(updatedList);

    try {
      localStorage.setItem('controlroom_pending_pi_to_bom', JSON.stringify(conversionData));
    } catch (e) {}

    if (typeof onConvertToBom === 'function') {
      onConvertToBom(conversionData);
    } else {
      window.dispatchEvent(new CustomEvent('controlroom_convert_pi_bom', { detail: conversionData }));
    }
  };

  // Confirmation and edit states
  const [deleteIdx, setDeleteIdx] = useState(null); // Row index to delete
  const [showSaveConfirm, setShowSaveConfirm] = useState(false); // Save confirmation
  const [showCancelConfirm, setShowCancelConfirm] = useState(false); // Cancel confirmation
  const [editIdx, setEditIdx] = useState(null); // Row index to edit
  const [activeDropdownIdx, setActiveDropdownIdx] = useState(null); // Active 3-dot dropdown index

  const [selectedPIs, setSelectedPIs] = useState([]);

  const handleSelectAll = (e, items) => {
    if (e.target.checked) {
      setSelectedPIs(items.map(pi => pi.piNo));
    } else {
      setSelectedPIs([]);
    }
  };

  const handleSelectRow = (piNo) => {
    if (selectedPIs.includes(piNo)) {
      setSelectedPIs(selectedPIs.filter(item => item !== piNo));
    } else {
      setSelectedPIs([...selectedPIs, piNo]);
    }
  };

  const [statusFilter, setStatusFilter] = useState('All');
  const [piTab, setPiTab] = useState('All');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPiTab('All');
    setCurrentPage(1);
  };

  // Resolve currently logged in user dynamically (matching Header & BOM creation)
  const getActiveUserName = () => {
    const stored = localStorage.getItem('controlroom_logged_user_name');
    if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim() !== '') return stored.trim();
    try {
      const u = JSON.parse(localStorage.getItem('controlroom_logged_user') || '{}');
      if (u.name) return u.name;
      if (u.fullName) return u.fullName;
      if (u.username) return u.username;
    } catch (e) {}
    if (userRole === 'Sales Head') return 'Vijay';
    if (userRole === 'CEO' || userRole === 'Technical Administrator') return 'Annamalaiyar';
    return 'Mohit JV';
  };

  // Preset Kits & Live Store
  const [activePresetsMap, setActivePresetsMap] = useState(() => getAllActivePresets());
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetSetCount, setPresetSetCount] = useState(1);
  const [presetKitPrice, setPresetKitPrice] = useState('');
  const [presetGroups, setPresetGroups] = useState({});
  const [selectedItemIndexes, setSelectedItemIndexes] = useState([]);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [piConfirmModal, setPiConfirmModal] = useState(null); // 'cancel' | 'draft' | 'create'
  const [previewDocModal, setPreviewDocModal] = useState(null);

  useEffect(() => {
    const handlePresetUpdate = (e) => {
      if (e.detail) setActivePresetsMap(e.detail);
    };
    window.addEventListener('vrm_presets_updated', handlePresetUpdate);
    return () => window.removeEventListener('vrm_presets_updated', handlePresetUpdate);
  }, []);

  // Customer directory lookup from localStorage for instant auto-complete
  const customerList = useMemo(() => {
    try {
      const stored = localStorage.getItem('controlroom_customer_store') || localStorage.getItem('controlroom_crm_customers') || localStorage.getItem('controlroom_customer_list');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { code: 'Vikram Solar Pvt Ltd', companyName: 'Vikram Solar Pvt Ltd', c2: 'Vikram Solar Pvt Ltd', gst: '33AABCV1234F1Z5', gstNo: '33AABCV1234F1Z5', contact: 'Rajesh Kannan', contactPerson: 'Rajesh Kannan', phone: '+91 98765 43210', email: 'rajesh@vikramsolar.com', billingAddress: 'Plot 42, SIDCO Industrial Estate, Ambattur', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
      { code: 'Tata Power Solar Systems Ltd', companyName: 'Tata Power Solar Systems Ltd', c2: 'Tata Power Solar Systems Ltd', gst: '27AAACT2345D1ZA', gstNo: '27AAACT2345D1ZA', contact: 'Karthik Raja', contactPerson: 'Karthik Raja', phone: '+91 98450 12345', email: 'karthik@tatapower.com', billingAddress: '12 Electronic City Phase 1', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      { code: 'Waaree Energies Ltd', companyName: 'Waaree Energies Ltd', c2: 'Waaree Energies Ltd', gst: '24AAACW5678B1Z2', gstNo: '24AAACW5678B1Z2', contact: 'Dharmesh Patel', contactPerson: 'Dharmesh Patel', phone: '+91 97234 56789', email: 'dharmesh@waaree.com', billingAddress: '88 Ring Road, Surat', city: 'Surat', state: 'Gujarat', pincode: '395001' }
    ];
  }, []);

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

  // Form Fields State
  const [pdfFile, setPdfFile] = useState(null);
  const [signedPiDoc, setSignedPiDoc] = useState(null);
  const [piNumber, setPiNumber] = useState('');
  const [piDate, setPiDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntilDate, setValidUntilDate] = useState('');
  const [salesPerson, setSalesPerson] = useState(getActiveUserName());
  const [vendorName, setVendorName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNo, setGstNo] = useState('');

  // Addresses State (Dual Addresses - no delivery proof required for PI)
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPincode, setBillingPincode] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');

  // Structured Line Items State (Fresh empty default)
  const [piItems, setPiItems] = useState([]);

  // Transport & Logistics
  const [transportMode, setTransportMode] = useState('Transport');
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transportScope, setTransportScope] = useState('VRM Structures');

  // Commercial Fields
  const [paymentTerms, setPaymentTerms] = useState('50% Advance + 50% Before Dispatch');
  const [creditDays, setCreditDays] = useState('');
  const [remarks, setRemarks] = useState('');

  // Customer auto-suggest handler
  const handleSelectCustomer = (cName) => {
    setVendorName(cName);
    const found = customerList.find(c =>
      (c.companyName || c.name || c.c2 || c.code || '').toLowerCase() === cName.toLowerCase()
    );
    if (found) {
      if (found.gst || found.gstNumber || found.gstNo) setGstNo(found.gst || found.gstNumber || found.gstNo);
      if (found.contact || found.contactPerson) setContactPerson(found.contact || found.contactPerson);
      if (found.phone) setPhone(found.phone);
      if (found.email) setEmail(found.email);
      const street = found.billingAddress || found.street || found.address || '';
      if (street) setBillingStreet(street);
      if (found.city) setBillingCity(found.city);
      if (found.state) setBillingState(found.state);
      if (found.pincode) setBillingPincode(found.pincode);
      if (sameAsBilling) {
        if (street) setDeliveryStreet(street);
        if (found.city) setDeliveryCity(found.city);
        if (found.state) setDeliveryState(found.state);
        if (found.pincode) setDeliveryPincode(found.pincode);
      }
    }
  };

  // Upload progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const uploadTimerRef = useRef(null);

  // Signed PI / Payment Advice upload handler using compressAndSaveFile
  const handleSignedDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const compressed = await compressAndSaveFile(file);
      setSignedPiDoc({
        name: compressed.name || file.name,
        size: compressed.size || file.size,
        type: compressed.type || file.type,
        dataUrl: compressed.dataUrl,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      });
      setPdfFile({ name: file.name, size: file.size });
      setUploadProgress(100);
    } catch (err) {
      console.warn('Doc compression failed, falling back:', err);
      setSignedPiDoc({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      });
      setPdfFile({ name: file.name, size: file.size });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    setPdfFile(null);
    setSignedPiDoc(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Financial calculations supporting multi-preset groups and line items
  const calculatePiTotals = () => {
    let kitSubtotal = 0;
    const groupIds = Object.keys(presetGroups || {});
    groupIds.forEach(grpId => {
      const grp = presetGroups[grpId];
      if (grp) {
        const unitPrice = parseFloat(grp.kitPrice) || 0;
        const multiplier = parseInt(grp.setCount) || 1;
        kitSubtotal += (unitPrice * multiplier);
      }
    });

    const itemsSub = (piItems || []).reduce((acc, item) => {
      if (item.isPresetItem) return acc;
      const q = parseFloat(item.qty) || 0;
      const r = parseFloat(item.rate) || 0;
      return acc + (q * r);
    }, 0);

    const sub = itemsSub + kitSubtotal;

    // 3. GST: Custom item GSTs + Preset kits GST (dynamically from preset's selected gstRate)
    const itemsGst = (piItems || []).reduce((acc, item) => {
      if (item.isPresetItem) return acc;
      const q = parseFloat(item.qty) || 0;
      const r = parseFloat(item.rate) || 0;
      const rowTot = q * r;
      const pct = parseFloat(String(item.gstRate || '18%').replace('%', '')) || 18;
      return acc + (rowTot * (pct / 100));
    }, 0);

    let kitGst = 0;
    groupIds.forEach(grpId => {
      const grp = presetGroups[grpId];
      let gRateStr = grp?.gstRate;
      if (!gRateStr) {
        const firstItem = (piItems || []).find(it => (it.presetGroupId || 'legacy_default') === grpId);
        gRateStr = firstItem?.gstRate || '18%';
      }
      const gPct = parseFloat(String(gRateStr).replace('%', '')) || 0;
      if (grp) {
        const unitPrice = parseFloat(grp.kitPrice) || 0;
        const multiplier = parseInt(grp.setCount) || 1;
        kitGst += (unitPrice * multiplier) * (gPct / 100);
      }
    });

    const gst = itemsGst + kitGst;

    const grand = sub + gst;
    const cgst = gst / 2;
    const sgst = gst / 2;
    return {
      sub: isNaN(sub) ? 0 : sub,
      kitSubtotal: isNaN(kitSubtotal) ? 0 : kitSubtotal,
      gst: isNaN(gst) ? 0 : gst,
      grand: isNaN(grand) ? 0 : grand,
      cgst: isNaN(cgst) ? 0 : cgst,
      sgst: isNaN(sgst) ? 0 : sgst
    };
  };

  const previewCurrentFormAsTemplate = () => {
    const totals = calculatePiTotals();
    const joinedProducts = (piItems || []).map(it => it.name).filter(Boolean).join(', ') || 'Solar Structure & Accessories';
    const previewData = {
      piNo: (piNumber && piNumber.trim() && piNumber !== 'Auto-Assigned') ? piNumber : 'DRAFT-PREVIEW',
      vendor: vendorName || 'Customer Company Name',
      customerName: vendorName || 'Customer Company Name',
      contactPerson,
      phone,
      email,
      gstNo: (gstNo || '').toUpperCase(),
      productName: joinedProducts,
      items: (piItems && piItems.length > 0) ? piItems : [
        {
          name: joinedProducts,
          description: 'Standard VRM Solar Structure & Accessories Kit',
          hsn: '73089090',
          qty: 1,
          uom: 'Set',
          rate: totals.sub || 100000,
          gstRate: '18%',
          amount: totals.sub || 100000
        }
      ],
      salesPerson: salesPerson || getEffectiveSalesPerson(),
      billingStreet,
      billingCity,
      billingState,
      billingPincode,
      deliveryStreet: sameAsBilling ? billingStreet : deliveryStreet,
      deliveryCity: sameAsBilling ? billingCity : deliveryCity,
      deliveryState: sameAsBilling ? billingState : deliveryState,
      deliveryPincode: sameAsBilling ? billingPincode : deliveryPincode,
      sameAsBilling,
      transportMode,
      transporterName,
      vehicleNo,
      transportScope,
      paymentTerms,
      creditDays,
      remarks,
      unitValue: Math.round(totals.sub),
      quantity: (piItems || []).reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0) || 1,
      subtotal: totals.sub,
      taxTotal: totals.gst,
      grandTotal: totals.grand,
      amount: '₹' + Math.round(totals.grand).toLocaleString('en-IN'),
      piDate: piDate || new Date().toISOString().split('T')[0],
      expDate: validUntilDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    };
    setPrintModalPi(previewData);
  };

  const handleAddMaterialRow = () => {
    setPiItems(prev => [...(prev || []), { name: '', category: '', uom: 'NOS', qty: '1', rate: '', gstRate: '18%' }]);
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

    setPiItems(prev => [...(prev || []), ...newItems]);
    setSelectedPreset('');
    setPresetSetCount(1);
  };

  const handleRemovePresetGroup = (groupId) => {
    setPiItems(prev => (prev || []).filter(item => (item.presetGroupId || 'legacy_default') !== groupId));
    setPresetGroups(prev => {
      const updated = { ...prev };
      delete updated[groupId];
      return updated;
    });
  };

  const handleRemoveMaterialRow = (idx) => {
    setPiItems(prev => (prev || []).filter((_, i) => i !== idx));
  };

  const fetchNextPiNumber = async () => {
    try {
      setPiNumber('Fetching...');
      const res = await fetch('/api/zoho/next-pi-number');
      if (res.ok) {
        const data = await res.json();
        if (data && data.nextPiNo) {
          setPiNumber(data.nextPiNo);
          return data.nextPiNo;
        }
      }
    } catch (e) {
      console.warn('Error fetching next PI number:', e);
    }
    const fallback = `PI-${String((piList.length || 0) + 1).padStart(5, '0')}`;
    setPiNumber(fallback);
    return fallback;
  };

  const resetForm = () => {
    setPdfFile(null);
    setSignedPiDoc(null);
    setUploadProgress(0);
    setIsUploading(false);
    setPiNumber('Auto-Assigned');
    setPiDate(new Date().toISOString().split('T')[0]);
    setValidUntilDate('');
    setVendorName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setGstNo('');
    setSalesPerson(getActiveUserName());
    setBillingStreet('');
    setBillingCity('');
    setBillingState('');
    setBillingPincode('');
    setDeliveryStreet('');
    setDeliveryCity('');
    setDeliveryState('');
    setDeliveryPincode('');
    setSameAsBilling(true);
    setTransportMode('Transport');
    setTransporterName('');
    setVehicleNo('');
    setTransportScope('VRM Structures');
    setPaymentTerms('50% Advance + 50% Before Dispatch');
    setCreditDays('');
    setRemarks('');
    setPiItems([]); // Fresh empty default with 0 prefilled items
    setSelectedPreset('');
    setPresetSetCount(1);
    setPresetKitPrice('');
    setPresetGroups({});
    setSelectedItemIndexes([]);
    setShowSaveConfirm(false);
    setShowClearConfirmModal(false);
    setPiConfirmModal(null);
  };

  // Triggers Save Confirmation modal
  const triggerSaveConfirm = (e) => {
    if (e) e.preventDefault();
    if (!vendorName || !vendorName.trim()) {
      alert('Please enter Customer / Company Name.');
      return;
    }
    if (!Array.isArray(piItems) || piItems.length === 0) {
      alert('Please add at least one line item or select a preset kit.');
      return;
    }
    setPiConfirmModal('create');
  };

  // Submits the new or edited PI
  const executeCreatePI = async (isDraft = false) => {
    const totals = calculatePiTotals();
    const joinedProducts = piItems.map(it => it.name).filter(Boolean).join(', ') || 'Solar Structure & Accessories';

    let cleanPiNo = (piNumber && piNumber.trim() && piNumber !== 'Auto-Assigned' && !piNumber.startsWith('Fetching'))
      ? piNumber.trim().toUpperCase()
      : null;

    if (!cleanPiNo) {
      cleanPiNo = await fetchNextPiNumber();
    }

    const newPI = {
      piNo: cleanPiNo,
      vendor: vendorName,
      customerName: vendorName,
      contactPerson,
      phone,
      email,
      gstNo: (gstNo || '').toUpperCase(),
      productName: joinedProducts,
      items: piItems,
      presetGroups,
      billingAddress: {
        street: billingStreet,
        city: billingCity,
        state: billingState,
        pincode: billingPincode
      },
      deliveryAddress: {
        street: sameAsBilling ? billingStreet : deliveryStreet,
        city: sameAsBilling ? billingCity : deliveryCity,
        state: sameAsBilling ? billingState : deliveryState,
        pincode: sameAsBilling ? billingPincode : deliveryPincode
      },
      sameAsBilling,
      transportMode,
      transporterName,
      vehicleNo,
      transportScope,
      paymentTerms,
      creditDays,
      remarks,
      unitValue: Math.round(totals.sub),
      quantity: piItems.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0) || 1,
      subtotal: totals.sub,
      kitSubtotal: totals.kitSubtotal,
      taxTotal: totals.gst,
      cgst: totals.cgst,
      sgst: totals.sgst,
      grandTotal: totals.grand,
      amount: '₹' + Math.round(totals.grand).toLocaleString('en-IN'),
      pdfName: pdfFile ? pdfFile.name : (signedPiDoc ? signedPiDoc.name : 'pi_document.pdf'),
      signedPiDoc: signedPiDoc || null,
      piDate: piDate || new Date().toISOString().split('T')[0],
      expDate: validUntilDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: isDraft ? 'Draft' : (editIdx !== null ? (piList[editIdx].status === 'Pending Approval' || piList[editIdx].status === 'Approved' ? 'Issued' : piList[editIdx].status) : 'Issued'),
      statusType: isDraft ? 'draft' : (editIdx !== null ? (piList[editIdx].statusType === 'pending' || piList[editIdx].statusType === 'approved' ? 'issued' : piList[editIdx].statusType) : 'issued'),
      salesPerson: editIdx !== null ? (piList[editIdx].salesPerson || getEffectiveSalesPerson()) : getEffectiveSalesPerson(),
      salesperson: editIdx !== null ? (piList[editIdx].salesPerson || getEffectiveSalesPerson()) : getEffectiveSalesPerson(),
      salesPersonCode: editIdx !== null ? (piList[editIdx].salesPersonCode || currentEmpId) : currentEmpId,
      createdBy: editIdx !== null ? (piList[editIdx].createdBy || getEffectiveSalesPerson()) : getEffectiveSalesPerson(),
      createdById: editIdx !== null ? (piList[editIdx].createdById || currentEmpId) : currentEmpId
    };

    if (editIdx !== null) {
      const updated = [...piList];
      updated[editIdx] = newPI;
      updatePiList(updated);
      setEditIdx(null);
    } else {
      updatePiList([newPI, ...piList]);
    }

    // Background push to Zoho Books Estimates API
    try {
      fetch('/api/zoho/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPI)
      }).then(res => res.json()).then(data => {
        if (data && data.estimate) {
          console.log('[ZOHO ESTIMATE SYNC SUCCESS]', data.estimate);
          if (data.estimate.zohoEstimateId) {
            setPiList(prev => prev.map(p => p.piNo === newPI.piNo ? { ...p, zohoEstimateId: data.estimate.zohoEstimateId } : p));
          }
        }
      }).catch(err => console.warn('[ZOHO ESTIMATE SYNC NOTICE]', err));
    } catch (e) {
      console.warn('Error pushing to Zoho estimate API:', e);
    }

    resetForm();
    setViewMode('list');
  };

  // Pre-populates the fields to edit a Performa Invoice
  const handleStartEdit = (pi, idx) => {
    setEditIdx(idx);
    setPiNumber(pi.piNo || '');
    setVendorName(pi.vendor || pi.customerName || '');
    setContactPerson(pi.contactPerson || '');
    setPhone(pi.phone || '');
    setEmail(pi.email || '');
    setGstNo(pi.gstNo || '');
    setSalesPerson(pi.salesPerson || getActiveUserName());
    setPaymentTerms(pi.paymentTerms || '50% Advance + 50% Before Dispatch');
    setCreditDays(pi.creditDays || '');
    setRemarks(pi.remarks || '');
    setTransportMode(pi.transportMode || 'Transport');
    setTransporterName(pi.transporterName || '');
    setVehicleNo(pi.vehicleNo || '');
    setTransportScope(pi.transportScope || 'VRM Structures');
    if (pi.billingAddress) {
      setBillingStreet(pi.billingAddress.street || '');
      setBillingCity(pi.billingAddress.city || '');
      setBillingState(pi.billingAddress.state || '');
      setBillingPincode(pi.billingAddress.pincode || '');
    }
    if (pi.deliveryAddress) {
      setDeliveryStreet(pi.deliveryAddress.street || '');
      setDeliveryCity(pi.deliveryAddress.city || '');
      setDeliveryState(pi.deliveryAddress.state || '');
      setDeliveryPincode(pi.deliveryAddress.pincode || '');
      setSameAsBilling(pi.sameAsBilling !== undefined ? pi.sameAsBilling : false);
    }
    if (pi.presetGroups) {
      setPresetGroups(pi.presetGroups);
    } else {
      setPresetGroups({});
    }
    if (Array.isArray(pi.items) && pi.items.length > 0) {
      setPiItems(pi.items);
    } else {
      setPiItems([
        {
          name: pi.productName || 'Solar Mounting Structures & Fasteners',
          category: 'Structure Kit',
          uom: 'SET',
          qty: String(pi.quantity || 1),
          rate: String(pi.unitValue || 25000),
          gstRate: '18%'
        }
      ]);
    }
    if (pi.signedPiDoc) {
      setSignedPiDoc(pi.signedPiDoc);
    } else if (pi.pdfName) {
      setSignedPiDoc({ name: pi.pdfName, size: 24000, uploadedAt: pi.piDate });
    } else {
      setSignedPiDoc(null);
    }
    setPdfFile(pi.pdfName ? { name: pi.pdfName, size: 3.2 * 1024 * 1024 } : null);
    setUploadProgress(100);
    setViewMode('edit');
    setActiveDropdownIdx(null);
  };

  // Deletes the PI
  const executeDeletePI = () => {
    if (deleteIdx !== null) {
      updatePiList(piList.filter((_, i) => i !== deleteIdx));
      setDeleteIdx(null);
    }
  };

  // Close dropdown menu when clicking anywhere else
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownIdx(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    };
  }, []);

  const renderStatusBadge = (type, label) => {
    return <StatusBadge type={type} label={label} size="sm" />;
  };

  const renderPdfIcon = () => {
    return (
      <div
        style={{
          width: '34px',
          height: '42px',
          borderRadius: '6px',
          backgroundColor: '#e2e8f0',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '10px',
            height: '10px',
            backgroundColor: '#cbd5e1',
            borderBottomLeftRadius: '4px',
            borderTopRightRadius: '6px'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '-6px',
            backgroundColor: '#ea580c',
            color: 'white',
            fontSize: '8px',
            fontWeight: 'bold',
            padding: '1px 4px',
            borderRadius: '3px',
            letterSpacing: '0.05em'
          }}
        >
          PDF
        </div>
      </div>
    );
  };

  // Helper to render the numbered label block
  const renderNumberedLabel = (number, text) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          {number}
        </span>
        <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
          {text} <span style={{ color: '#ef4444' }}>*</span>
        </span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>

      {/* ==================== VIEW 1: LIST DASHBOARD SCREEN ==================== */}
      {viewMode === 'list' && (() => {
        const uniqueStatuses = ['All', ...new Set(visiblePIList.map(pi => pi.status))];
        const filteredPIList = (visiblePIList || []).filter(pi => {
          if (!pi) return false;
          const searchLower = (searchQuery || '').toLowerCase();
          const matchesSearch = (pi.piNo || '').toLowerCase().includes(searchLower) ||
            (pi.vendor || '').toLowerCase().includes(searchLower) ||
            (pi.gstNo || '').toLowerCase().includes(searchLower) ||
            (pi.productName || '').toLowerCase().includes(searchLower);
          const currentStatus = (pi.status === 'Pending Approval' || pi.status === 'Approved') ? 'Issued' : (pi.status || 'Issued');
          const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter;
          const matchesTab = piTab === 'All' || currentStatus === piTab;
          return matchesSearch && matchesStatus && matchesTab;
        });

        const indexOfLastRow = currentPage * rowsPerPage;
        const indexOfFirstRow = indexOfLastRow - rowsPerPage;
        const currentRows = filteredPIList.slice(indexOfFirstRow, indexOfLastRow);
        const totalPages = Math.ceil(filteredPIList.length / rowsPerPage);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', minWidth: 0, width: '100%' }}>
            {/* Header section with Action Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text-primary)', margin: 0 }}>
                  Performa Invoices
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Manage commercial Proforma Invoices and customer billing
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => {
                    resetForm();
                    setEditIdx(null);
                    setViewMode('create');
                    fetchNextPiNumber();
                  }}
                  style={{
                    backgroundColor: '#0E7490',
                    border: 'none',
                    color: 'white',
                    height: '40px',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0 6px 0 20px',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(14, 116, 144, 0.2)',
                    transition: 'all 0.2s ease-in-out',
                    flexShrink: 0
                  }}
                >
                  <span>Create PI</span>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    color: '#0E7490',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <ArrowRight style={{ width: '16px', height: '16px', color: '#0E7490' }} />
                  </div>
                </button>
              </div>
            </div>



            {/* 1. FILTERS & SEARCH ROW CARD */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '12px 16px', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', width: '100%', boxSizing: 'border-box', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#f8fafc', flex: '1 1 240px', maxWidth: '380px', minWidth: '200px' }}>
                <Search style={{ width: '15px', height: '15px', color: '#64748b', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search Performa Invoices (PI No, Customer Name, GST No)..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', minWidth: 0, color: '#334155' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', cursor: 'pointer', backgroundColor: 'white', fontSize: '13px', color: '#475569' }}>
                  <span>Date Range</span>
                  <Calendar style={{ width: '14px', height: '14px', color: '#64748b' }} />
                </div>

                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 24px 0 10px', fontSize: '13px', backgroundColor: 'white', color: '#334155', minWidth: '130px', outline: 'none' }}>
                  {uniqueStatuses.map(s => (
                    <option key={s} value={s}>
                      {s === 'All' ? 'Status: All' : s}
                    </option>
                  ))}
                </select>

                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 16px', height: '38px', cursor: 'pointer', backgroundColor: 'white', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  <Filter style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                  <span>Filters</span>
                </button>

                <button
                  onClick={clearFilters}
                  title="Clear Filters"
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    height: '38px',
                    width: '38px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <RotateCcw style={{ width: '15px', height: '15px' }} />
                </button>
              </div>
            </div>

            {/* 2. STATUS SUB-TABS ROW & EXPORT BUTTON (EXACT WORK ORDERS REFERENCE DESIGN) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { id: 'All', label: 'All Invoices (Total Sent)', count: visiblePIList.length },
                  { id: 'Issued', label: 'Issued / Active', count: visiblePIList.filter(pi => {
                    const st = (pi.status === 'Pending Approval' || pi.status === 'Approved') ? 'Issued' : (pi.status || 'Issued');
                    return st === 'Issued';
                  }).length },
                  { id: 'Converted to BOM', label: 'Converted to BOM', count: visiblePIList.filter(pi => pi.status === 'Converted to BOM').length },
                  { id: 'Cancelled', label: 'Cancelled', count: visiblePIList.filter(pi => pi.status === 'Cancelled').length },
                  { id: 'Draft', label: 'Draft', count: visiblePIList.filter(pi => pi.status === 'Draft').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setPiTab(tab.id); setCurrentPage(1); }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '12px 0',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: piTab === tab.id ? '#0E7490' : '#64748b',
                      borderBottom: piTab === tab.id ? '2px solid #0E7490' : '2px solid transparent',
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
                      backgroundColor: tab.id === 'Converted to BOM' ? '#ecfdf5' : tab.id === 'Issued' ? '#f0fdf4' : tab.id === 'Cancelled' ? '#fef2f2' : '#f1f5f9',
                      color: tab.id === 'Converted to BOM' ? '#059669' : tab.id === 'Issued' ? '#16a34a' : tab.id === 'Cancelled' ? '#b91c1c' : '#475569',
                      fontWeight: 'bold'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', backgroundColor: 'white', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', marginBottom: '8px', flexShrink: 0 }}>
                <Download style={{ width: '14px', height: '14px' }} />
                Export
              </button>
            </div>

            {/* 3. MAIN DATA TABLE MATCHING EXACT REFERENCE DESIGN */}
            <div className="section-card" style={{ padding: 0, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="custom-table" style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: '#475569', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '12px', fontWeight: 'bold', height: '48px' }}>
                      <th style={{ width: '48px', minWidth: '48px', maxWidth: '48px', padding: '12px 0', textAlign: 'center', verticalAlign: 'middle', boxSizing: 'border-box' }}>
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAll(e, filteredPIList)}
                          checked={filteredPIList.length > 0 && filteredPIList.every(pi => selectedPIs.includes(pi.piNo))}
                          style={{ accentColor: '#0E7490', cursor: 'pointer', verticalAlign: 'middle', margin: 0 }}
                        />
                      </th>
                      <th style={{ width: '150px', minWidth: '140px', padding: '12px 14px', boxSizing: 'border-box' }}>PI No.</th>
                      <th style={{ minWidth: '220px', padding: '12px 14px', boxSizing: 'border-box' }}>Customer / Company</th>
                      <th style={{ width: '160px', minWidth: '150px', padding: '12px 14px', boxSizing: 'border-box' }}>GST No.</th>
                      <th style={{ width: '130px', minWidth: '120px', padding: '12px 14px', boxSizing: 'border-box' }}>PI Date</th>
                      <th style={{ width: '150px', minWidth: '130px', padding: '12px 14px', textAlign: 'right', boxSizing: 'border-box' }}>Total Amount</th>
                      <th style={{ width: '130px', minWidth: '120px', padding: '12px 14px', textAlign: 'center', boxSizing: 'border-box' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      return currentRows.map((pi, idx) => {
                        const isChecked = selectedPIs.includes(pi.piNo);

                        let statusBg = '#eff6ff';
                        let statusFg = '#2563eb';
                        const currentStatus = (pi.status === 'Pending Approval' || pi.status === 'Approved') ? 'Issued' : (pi.status || 'Issued');
                        if (currentStatus === 'Issued') {
                          statusBg = '#f0fdf4';
                          statusFg = '#16a34a';
                        } else if (currentStatus === 'Converted to BOM') {
                          statusBg = '#ecfdf5';
                          statusFg = '#059669';
                        } else if (currentStatus === 'Cancelled') {
                          statusBg = '#fef2f2';
                          statusFg = '#b91c1c';
                        } else if (currentStatus === 'Draft' || currentStatus === 'Overdue') {
                          statusBg = '#fef2f2';
                          statusFg = '#dc2626';
                        }

                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              transition: 'all 0.15s ease',
                              backgroundColor: isChecked ? '#ECFEFF' : 'transparent'
                            }}
                            className={`table-row-hover ${isChecked ? 'selected-row' : ''}`}
                          >
                            <td style={{
                              width: '48px',
                              minWidth: '48px',
                              padding: '12px 14px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              boxSizing: 'border-box',
                              borderLeft: isChecked ? '4px solid #0E7490' : '4px solid transparent'
                            }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSelectRow(pi.piNo)}
                                style={{ accentColor: '#0E7490', cursor: 'pointer', verticalAlign: 'middle', margin: 0 }}
                              />
                            </td>
                            <td
                              onClick={() => setSelectedPi(pi)}
                              style={{ padding: '12px 14px', fontWeight: 'bold', color: '#2563EB', cursor: 'pointer' }}
                            >
                              {pi.piNo}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1E293B' }}>
                              {pi.vendor || pi.customerName || 'N/A'}
                            </td>
                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569' }}>{pi.gstNo || '—'}</td>
                            <td style={{ padding: '12px 14px', color: '#64748B' }}>{pi.piDate}</td>
                            <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0F172A', textAlign: 'right' }}>{pi.amount}</td>
                            
                            {/* Pill status badge with bullet dot */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ backgroundColor: statusBg, color: statusFg, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusFg }}></span>
                                {currentStatus}
                              </span>
                            </td>

                            {/* Actions column removed per user request */}
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
                {/* 4. PAGINATION FOOTER EXACT MATCHING STANDARD RULES */}
                {filteredPIList.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9', backgroundColor: '#FFFFFF' }}>
                    {/* Left Side: Rows per page selector + Showing X to Y of Z entries */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Showing per page</span>
                        <select
                          value={rowsPerPage}
                          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          style={{ height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', padding: '0 8px', backgroundColor: 'white', fontWeight: 'bold' }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                        </select>
                      </div>
                      <span>Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredPIList.length)} of {filteredPIList.length} entries</span>
                    </div>

                    {/* Right Side: Page navigation controls adjacent to Go to page input */}
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
                          id="pi-goto-page-input"
                          style={{ width: '42px', height: '32px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <button
                          onClick={() => {
                            const val = parseInt(document.getElementById('pi-goto-page-input')?.value || '1', 10);
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
            </div>

            {/* Floating Selection Toolbar (exact reference design) */}
            {selectedPIs.length > 0 && (
              <div style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                zIndex: 10000,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '4px', paddingRight: '6px' }}>
                  <strong style={{ color: '#0F172A', fontSize: '14px' }}>{selectedPIs.length}</strong> Selected
                </span>

                {/* Direct View Details button */}
                <button
                  onClick={() => {
                    if (selectedPIs.length > 1) {
                      alert("You can't open details for multiple files at once. Please select a single item to view details.");
                      return;
                    }
                    const target = piList.find(p => p.piNo === selectedPIs[0]);
                    if (target) setSelectedPi(target);
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
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <Eye size={14} style={{ color: '#0E7490' }} /> View Details
                </button>

                {/* Direct Convert to BOM button */}
                {(() => {
                  const target = selectedPIs.length === 1 ? piList.find(p => p.piNo === selectedPIs[0]) : null;
                  const canConvert = target && target.status !== 'Cancelled' && target.status !== 'Converted to BOM';
                  if (!canConvert) return null;

                  return (
                    <button
                      onClick={() => handleConvertToBom(target)}
                      style={{
                        backgroundColor: '#4F46E5',
                        border: 'none',
                        color: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '6px 16px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                    >
                      <Layers size={14} style={{ color: '#FFFFFF' }} /> Convert to BOM →
                    </button>
                  );
                })()}

                <button
                  onClick={() => {
                    if (selectedPIs.length > 1) {
                      alert('You cannot edit multiple items at once.');
                    } else if (selectedPIs.length === 1) {
                      const targetPiNo = selectedPIs[0];
                      const idx = piList.findIndex(p => p.piNo === targetPiNo);
                      const targetPi = piList[idx] || { piNo: targetPiNo, vendor: '', gstNo: '', unitValue: 0, quantity: 1 };
                      handleStartEdit(targetPi, idx >= 0 ? idx : 0);
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
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <Edit3 size={14} style={{ color: '#64748B' }} /> Edit Info
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedPIs.length} selected PI(s)?`)) {
                      setSelectedPIs([]);
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
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <Trash2 size={14} style={{ color: '#DC2626' }} /> Delete
                </button>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowFloatingMenu(!showFloatingMenu)}
                    title="More actions"
                    style={{
                      backgroundColor: showFloatingMenu ? '#F1F5F9' : '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      color: '#64748B',
                      borderRadius: '10px',
                      padding: '6px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {showFloatingMenu && (
                    <div style={{
                      position: 'absolute',
                      bottom: '44px',
                      right: '0',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      minWidth: '170px',
                      padding: '6px',
                      zIndex: 10001,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <button
                        onClick={() => {
                          if (selectedPIs && selectedPIs.length > 1) {
                            alert("You can't open details for multiple files at once. Please select a single item to view details.");
                            setShowFloatingMenu(false);
                            return;
                          }
                          const target = (selectedPIs && selectedPIs.length > 0)
                            ? (piList.find(p => p.piNo === selectedPIs[0]) || { piNo: selectedPIs[0], vendor: 'Customer Reference' })
                            : (piList[0] || null);
                          if (target) setSelectedPi(target);
                          setShowFloatingMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#1E293B',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Eye size={14} style={{ color: '#0E7490' }} /> View Details
                      </button>

                      <button
                        onClick={() => {
                          alert(`Cloned ${selectedPIs.length} selected PI record(s).`);
                          setShowFloatingMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#1E293B',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Layers size={14} style={{ color: '#2563EB' }} /> Duplicate / Clone
                      </button>

                      <button
                        onClick={() => {
                          const target = (selectedPIs && selectedPIs.length > 0)
                            ? (piList.find(p => p.piNo === selectedPIs[0]) || { piNo: selectedPIs[0], vendor: 'Customer Reference' })
                            : null;
                          if (target) {
                            setPrintModalPi(target);
                          } else {
                            window.print();
                          }
                          setShowFloatingMenu(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#1E293B',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Printer size={14} style={{ color: '#0E7490' }} /> Export / Print PDF Template
                      </button>

                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPIs([])}
                  title="Deselect all"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    marginLeft: '2px'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== VIEW 2: DEDICATED FULL-PAGE CREATOR/EDITOR VIEW ==================== */}
      {(viewMode === 'create' || viewMode === 'edit') && (() => {
        const totals = calculatePiTotals();
        const hasAnyPreset = (piItems || []).some(it => it.isPresetItem);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '16px', boxSizing: 'border-box' }}>

            {/* Top Page Title Bar with Action Buttons matching BOM */}
            <div
              style={{
                background: 'linear-gradient(135deg, #075985 0%, #0E7490 50%, #0891B2 100%)',
                borderRadius: '18px',
                padding: '24px 28px',
                color: '#FFFFFF',
                boxShadow: '0 10px 25px -5px rgba(14, 116, 144, 0.4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileCheck style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
                    {viewMode === 'edit' ? `Edit Proforma Invoice: ${piNumber}` : 'Create Proforma Invoice (PI)'}
                  </h1>
                  <p style={{ fontSize: '13px', color: '#CFFAFE', margin: '4px 0 0 0' }}>
                    Configure customer commercial billing, structured preset kits, freight specifications & payment terms
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setPiConfirmModal('cancel')}
                  style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#FFFFFF', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerSaveConfirm}
                  style={{ border: 'none', background: '#10B981', color: 'white', padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle style={{ width: '16px', height: '16px' }} />
                  {viewMode === 'edit' ? 'Update & Release PI →' : 'Save & Release PI →'}
                </button>
              </div>
            </div>

            {/* SECTION 1: PI DETAILS & DATES */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
                  1
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  PI DETAILS & DATES
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    PI Date <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={piDate}
                    onChange={(e) => setPiDate(e.target.value)}
                    style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Payment Due / Valid Until Date
                  </label>
                  <input
                    type="date"
                    value={validUntilDate}
                    onChange={(e) => setValidUntilDate(e.target.value)}
                    style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    PI Number (Zoho Quote Sequence)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={piNumber || 'Auto-Assigned'}
                      placeholder="Auto-Assigned (Zoho Quote Sequence)"
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        padding: '0 14px',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#0E7490',
                        backgroundColor: '#F8FAFC',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'not-allowed'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#0E7490',
                      backgroundColor: '#ECFEFF',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #A5F3FC'
                    }}>
                      Locked (Auto)
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Sales Engineer / Creator
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={salesPerson || getActiveUserName()}
                      style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', fontWeight: '600', color: '#475569', backgroundColor: '#F8FAFC', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: '700', color: '#0E7490', backgroundColor: '#ECFEFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #A5F3FC' }}>
                      Account Owner (Locked)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: CUSTOMER INFORMATION & ADDRESSES (NO DELIVERY PROOF AS INSTRUCTED) */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
                  2
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CUSTOMER INFORMATION & ADDRESSES
                </h3>
              </div>

              {/* Row 1: Customer Contact details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Customer / Company Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    list="pi-customers-datalist"
                    placeholder="Search or enter customer..."
                    value={vendorName}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', fontWeight: '600', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <datalist id="pi-customers-datalist">
                    {(customerList || []).map((c, idx) => (
                      <option key={idx} value={c.companyName || c.name || c.c2 || c.code}>
                        {c.gst || c.gstNumber ? `GST: ${c.gst || c.gstNumber}` : ''}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kannan"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="accounts@solarclient.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Customer GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 33AABCV1234F1Z5"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                    style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', fontWeight: '700', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Row 2: Dual Addresses Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Billing Address Card */}
                <div style={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                      <Building2 size={14} color="#0E7490" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Official Billing Address</h4>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Primary address for invoices & commercial records</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Street / Premises Address</label>
                      <input
                        type="text"
                        placeholder="Plot No, Industrial Estate, Landmark..."
                        value={billingStreet}
                        onChange={(e) => {
                          setBillingStreet(e.target.value);
                          if (sameAsBilling) setDeliveryStreet(e.target.value);
                        }}
                        style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>City</label>
                        <input
                          type="text"
                          placeholder="City"
                          value={billingCity}
                          onChange={(e) => {
                            setBillingCity(e.target.value);
                            if (sameAsBilling) setDeliveryCity(e.target.value);
                          }}
                          style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>State</label>
                        <input
                          type="text"
                          placeholder="State"
                          value={billingState}
                          onChange={(e) => {
                            setBillingState(e.target.value);
                            if (sameAsBilling) setDeliveryState(e.target.value);
                          }}
                          style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>PIN Code</label>
                        <input
                          type="text"
                          placeholder="600001"
                          value={billingPincode}
                          onChange={(e) => {
                            setBillingPincode(e.target.value);
                            if (sameAsBilling) setDeliveryPincode(e.target.value);
                          }}
                          style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Address Card */}
                <div style={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: '#ECFEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0E7490' }}>
                        <Truck size={14} color="#0E7490" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Consignee / Delivery Site Address</h4>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>Site dispatch location</span>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#0E7490', cursor: 'pointer', backgroundColor: '#ECFEFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #A5F3FC' }}>
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => {
                          const isSame = e.target.checked;
                          setSameAsBilling(isSame);
                          if (isSame) {
                            setDeliveryStreet(billingStreet);
                            setDeliveryCity(billingCity);
                            setDeliveryState(billingState);
                            setDeliveryPincode(billingPincode);
                          }
                        }}
                        style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                      />
                      Same as Billing Address
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Site / Dispatch Location Address</label>
                      <input
                        type="text"
                        disabled={sameAsBilling}
                        placeholder="Solar Project Site, Survey No, Village..."
                        value={sameAsBilling ? billingStreet : deliveryStreet}
                        onChange={(e) => setDeliveryStreet(e.target.value)}
                        style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', backgroundColor: sameAsBilling ? '#F1F5F9' : 'white', cursor: sameAsBilling ? 'not-allowed' : 'text' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>City / District</label>
                        <input
                          type="text"
                          disabled={sameAsBilling}
                          placeholder="City"
                          value={sameAsBilling ? billingCity : deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', backgroundColor: sameAsBilling ? '#F1F5F9' : 'white', cursor: sameAsBilling ? 'not-allowed' : 'text' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>State</label>
                        <input
                          type="text"
                          disabled={sameAsBilling}
                          placeholder="State"
                          value={sameAsBilling ? billingState : deliveryState}
                          onChange={(e) => setDeliveryState(e.target.value)}
                          style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', backgroundColor: sameAsBilling ? '#F1F5F9' : 'white', cursor: sameAsBilling ? 'not-allowed' : 'text' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>PIN Code</label>
                        <input
                          type="text"
                          disabled={sameAsBilling}
                          placeholder="600001"
                          value={sameAsBilling ? billingPincode : deliveryPincode}
                          onChange={(e) => setDeliveryPincode(e.target.value)}
                          style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', backgroundColor: sameAsBilling ? '#F1F5F9' : 'white', cursor: sameAsBilling ? 'not-allowed' : 'text' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                    if (selectedItemIndexes.length > 0) {
                      setPiItems(prev => prev.filter((_, idx) => !selectedItemIndexes.includes(idx)));
                      setSelectedItemIndexes([]);
                    } else {
                      if (piItems.length > 0) setShowClearConfirmModal(true);
                    }
                  }}
                  title={selectedItemIndexes.length > 0 ? `Remove ${selectedItemIndexes.length} selected item(s)` : 'Clear all order items'}
                  style={{ border: 'none', backgroundColor: selectedItemIndexes.length > 0 ? '#EF4444' : '#FFE4E6', color: selectedItemIndexes.length > 0 ? 'white' : '#E11D48', width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
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

                {/* Items Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: '#475569', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', width: '30px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={piItems.length > 0 && selectedItemIndexes.length === piItems.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemIndexes(piItems.map((_, idx) => idx));
                            } else {
                              setSelectedItemIndexes([]);
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
                      {hasAnyPreset && <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%', color: '#0E7490', backgroundColor: '#ECFEFF' }}>Preset Amt (₹)</th>}
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '11%', textAlign: 'right' }}>Taxable (₹)</th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '11%', textAlign: 'right' }}>Total (₹)</th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '4%', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {piItems.length === 0 ? (
                      <tr>
                        <td colSpan={hasAnyPreset ? 10 : 9} style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Boxes size={28} style={{ color: '#CBD5E1' }} />
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>No products or materials in Proforma Invoice</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Select an engineering Preset above or click "+ Add Product / Item" to author PI line items</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      piItems.map((item, i) => {
                        const isChecked = selectedItemIndexes.includes(i);
                        const isPresetItem = Boolean(item.isPresetItem);
                        const groupId = item.presetGroupId;
                        const currentGroup = groupId ? (presetGroups[groupId] || { kitPrice: '', setCount: 1, presetName: item.presetName }) : null;

                        let isFirstInGroup = false;
                        let groupCount = 0;
                        if (isPresetItem && groupId) {
                          const itemsInGroup = piItems.filter(it => it.presetGroupId === groupId);
                          groupCount = itemsInGroup.length;
                          isFirstInGroup = piItems.findIndex(it => it.presetGroupId === groupId) === i;
                        }

                        const q = parseFloat(item.qty) || 0;
                        const r = parseFloat(item.rate) || 0;
                        const taxable = isPresetItem ? 0 : q * r;
                        const gstPct = parseFloat(String(item.gstRate || '18%').replace('%', '')) || 18;
                        const itemTotal = taxable + (taxable * (gstPct / 100));

                        return (
                          <tr
                            key={i}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              backgroundColor: isChecked ? '#ECFEFF' : (isPresetItem ? '#F8FAFC' : 'transparent'),
                              transition: 'background-color 0.15s ease'
                            }}
                          >
                            <td style={{
                              padding: '12px 14px',
                              textAlign: 'center',
                              borderLeft: isChecked ? '4px solid #0E7490' : '4px solid transparent'
                            }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedItemIndexes(prev => [...prev, i]);
                                  else setSelectedItemIndexes(prev => prev.filter(idx => idx !== i));
                                }}
                                style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="text"
                                    list={`pi-product-list-${i}`}
                                    placeholder="Type or select product / item..."
                                    value={item.name || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const matched = (itemsList || []).find(it => (it.name || '').toLowerCase() === val.toLowerCase() || (it.code || '').toLowerCase() === val.toLowerCase());
                                      setPiItems(prev => prev.map((mat, idx) => idx === i ? {
                                        ...mat,
                                        name: matched ? matched.name : val,
                                        rate: matched ? String(matched.price || matched.rate || mat.rate) : mat.rate,
                                        uom: matched ? (matched.uom || matched.unit || mat.uom) : mat.uom,
                                        category: matched ? (matched.category || matched.description || mat.category) : mat.category
                                      } : mat));
                                    }}
                                    style={{ width: '100%', height: '34px', borderRadius: '7px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '13px', backgroundColor: 'white', color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }}
                                  />
                                  <datalist id={`pi-product-list-${i}`}>
                                    {(itemsList || []).map((prod, pidx) => {
                                      const st = Number(prod.stock !== undefined ? prod.stock : 100);
                                      const isOutOfStock = st <= 0;
                                      const stockLabel = isOutOfStock ? '⚠️ (Stock: 0 / BLOCKED)' : `✓ (Available Stock: ${st})`;
                                      return (
                                        <option key={pidx} value={prod.name}>
                                          {prod.code ? `[${prod.code}] ${prod.name} ${stockLabel}` : `${prod.name} ${stockLabel}`}
                                        </option>
                                      );
                                    })}
                                  </datalist>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Description / Technical specs..."
                                  value={item.category || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPiItems(prev => prev.map((mat, idx) => idx === i ? { ...mat, category: val } : mat));
                                  }}
                                  style={{ width: '100%', height: '28px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '11px', color: '#64748B', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC' }}
                                />
                              </div>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <input
                                type="text"
                                list={`pi-uom-list-${i}`}
                                placeholder="UOM"
                                value={item.uom || 'NOS'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPiItems(prev => prev.map((mat, idx) => idx === i ? { ...mat, uom: val } : mat));
                                }}
                                style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '12px', textAlign: 'center', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF', fontWeight: '600' }}
                              />
                              <datalist id={`pi-uom-list-${i}`}>
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
                                  setPiItems(prev => prev.map((mat, idx) => idx === i ? { ...mat, qty: val } : mat));
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
                                    setPiItems(prev => prev.map((mat, idx) => idx === i ? { ...mat, rate: val } : mat));
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
                                    setPiItems(prev => prev.map((mat, idx) =>
                                      ((mat.presetGroupId || 'legacy_default') === groupId)
                                        ? { ...mat, gstRate: val }
                                        : mat
                                    ));
                                    setPresetGroups(prev => ({
                                      ...prev,
                                      [groupId]: { ...(prev[groupId] || currentGroup), gstRate: val }
                                    }));
                                  } else {
                                    setPiItems(prev => prev.map((mat, idx) => idx === i ? { ...mat, gstRate: val } : mat));
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
                                          title={currentGroup?.presetName}
                                        >
                                          {currentGroup?.presetName}
                                        </span>

                                        <div style={{ position: 'relative', width: '100%' }}>
                                          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: '700', color: '#6366F1', pointerEvents: 'none' }}>₹</span>
                                          <input
                                            type="number"
                                            value={currentGroup?.kitPrice || ''}
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
                                            value={currentGroup?.setCount !== undefined && currentGroup?.setCount !== null ? currentGroup.setCount : ''}
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
                                              setPiItems(prev => prev.map(mat => {
                                                if ((mat.presetGroupId || 'legacy_default') === groupId && mat.baseQty) {
                                                  return { ...mat, qty: String(Math.round(mat.baseQty * multiplier)) };
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
                                            set{(parseInt(currentGroup?.setCount) || 1) !== 1 ? 's' : ''}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                           <span style={{ fontSize: '10px', color: '#6366F1', fontWeight: '700' }}>GST:</span>
                                           <select
                                             value={currentGroup?.gstRate || item.gstRate || '18%'}
                                             onChange={(e) => {
                                               const val = e.target.value;
                                               if (groupId) {
                                                 setPresetGroups(prev => ({
                                                   ...prev,
                                                   [groupId]: { ...(prev[groupId] || currentGroup), gstRate: val }
                                                 }));
                                               }
                                               setPiItems(prev => prev.map((mat, idx) =>
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
                                            title={`Remove entire ${currentGroup?.presetName} preset`}
                                          >
                                            Remove Kit
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  );
                                }
                                return null;
                              } else {
                                return (
                                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#94A3B8', fontSize: '11px' }}>
                                    —
                                  </td>
                                );
                              }
                            })()}
                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                              {isPresetItem ? (
                                <span style={{ fontSize: '11px', color: '#94A3B8' }}>(In Kit Price)</span>
                              ) : (
                                `₹${taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                              )}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                              {isPresetItem ? (
                                <span style={{ fontSize: '11px', color: '#94A3B8' }}>—</span>
                              ) : (
                                `₹${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                              )}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                              {isPresetItem ? (
                                <span style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic' }}>Preset</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMaterialRow(i)}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                                  title="Remove item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddMaterialRow}
                  style={{ border: '1px solid #A5F3FC', background: '#ECFEFF', color: '#0E7490', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus style={{ width: '15px', height: '15px' }} />
                  Add Product / Item
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: BANK DETAILS & FINANCIAL BREAKDOWN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', alignItems: 'start' }}>

            {/* Left Column: Official Bank Details Card */}
            <div style={{ backgroundColor: '#F0FDFA', borderRadius: '16px', border: '1px solid #99F6E4', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Landmark size={18} color="#0E7490" />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>VRM Official Commercial Bank Details</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#0E7490', backgroundColor: '#CCFBF1', padding: '3px 8px', borderRadius: '4px', border: '1px solid #5EEAD4' }}>
                  Verified Account
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: '#334155' }}>
                <div><strong>Bank:</strong> HDFC Bank Ltd</div>
                <div><strong>Account Name:</strong> VRM STRUCTURES INDIA PVT LTD</div>
                <div><strong>Account No:</strong> 50200088912456</div>
                <div><strong>IFSC Code:</strong> HDFC0001234</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Branch:</strong> Ambattur Industrial Estate, Chennai - 600058</div>
              </div>
            </div>

            {/* Right Column: Real-Time Commercial Financial Summary Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #CBD5E1',
                borderTop: '4px solid #0E7490',
                padding: '24px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '0.04em' }}>
                    FINANCIAL BREAKDOWN
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0E7490', backgroundColor: '#ECFEFF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #A5F3FC' }}>
                    INR (₹) Commercial
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {totals.kitSubtotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4F46E5' }}>
                      <span style={{ fontWeight: '600' }}>Preset Kits Subtotal:</span>
                      <span style={{ fontWeight: '700' }}>₹{totals.kitSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>Line Items Subtotal:</span>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>₹{(totals.sub - totals.kitSubtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#0F172A', fontWeight: '700', borderTop: '1px dashed #E2E8F0', paddingTop: '8px' }}>
                    <span>Total Taxable Subtotal:</span>
                    <span>₹{totals.sub.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>CGST (9%):</span>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>SGST (9%):</span>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#0E7490', fontWeight: '700', backgroundColor: '#ECFEFF', padding: '6px 10px', borderRadius: '6px' }}>
                    <span>Total GST Amount (18%):</span>
                    <span>₹{totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '2px solid #0E7490',
                      paddingTop: '14px',
                      marginTop: '4px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', display: 'block' }}>Grand Total (INR)</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Inclusive of all statutory taxes</span>
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#0E7490' }}>
                      ₹{totals.grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={previewCurrentFormAsTemplate}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: '#ECFEFF',
                      color: '#0E7490',
                      border: '1px solid #A5F3FC',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Printer size={16} /> Preview Print / PDF
                  </button>
                  <button
                    type="button"
                    onClick={triggerSaveConfirm}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '8px',
                      backgroundColor: '#0E7490',
                      color: 'white',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(14, 116, 144, 0.3)'
                    }}
                  >
                    <Check size={18} /> Confirm & Save PI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPiConfirmModal('cancel')}
                    style={{
                      width: '100%',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: '#64748B',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Discard Changes
                  </button>
                </div>
              </div>

            </div>

          </div>
        );
      })()}

      {/* ==================== VIEW PI DETAILS DIALOG (MODAL OVERLAY) ==================== */}
      {selectedPi && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '28px',
              width: '460px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '16px', color: '#1e293b' }}>PI Details</strong>
                <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold' }}>{selectedPi.piNo}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setPrintModalPi(selectedPi)}
                  title="Open Print & PDF Template"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    backgroundColor: '#ECFEFF',
                    color: '#0E7490',
                    border: '1px solid #A5F3FC',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={13} /> Print / PDF
                </button>
                <button
                  onClick={() => setSelectedPi(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>

            {/* Layout showing exact same fields as creator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* PDF Document Preview block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>PI PDF File</span>
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  {renderPdfIcon()}

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                        {selectedPi.pdfName}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle style={{ width: '12px', height: '12px', fill: '#16a34a', color: 'white' }} /> Completed
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#16a34a' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8' }}>
                      <span>Document Attached</span>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPrintModalPi(selectedPi);
                        }}
                        style={{ fontSize: '11px', fontWeight: 'bold', color: '#0E7490', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Printer size={11} /> Open PDF Template
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Customer Name</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{selectedPi.vendor}</span>
              </div>

              {/* Product / Preset Items */}
              {selectedPi.items && Array.isArray(selectedPi.items) && selectedPi.items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Invoice Line Items ({selectedPi.items.length})</span>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', padding: '6px 8px' }}>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #CBD5E1', color: '#64748B', textAlign: 'left' }}>
                          <th style={{ padding: '4px' }}>Item</th>
                          <th style={{ padding: '4px', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '4px', textAlign: 'right' }}>Rate</th>
                          <th style={{ padding: '4px', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPi.items.map((it, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '4px', fontWeight: '600', color: '#1E293B' }}>{it.name}</td>
                            <td style={{ padding: '4px', textAlign: 'center', color: '#475569' }}>{it.qty} {it.uom || ''}</td>
                            <td style={{ padding: '4px', textAlign: 'right', color: '#475569' }}>₹{Number(it.rate || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold', color: '#0E7490' }}>₹{(Number(it.qty || 0) * Number(it.rate || 0)).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Product Name</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{selectedPi.productName || 'General Goods'}</span>
                </div>
              )}

              {/* GST No */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>GST No.</span>
                <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '600', color: '#334155' }}>
                  {selectedPi.gstNo}
                </span>
              </div>

              {/* Value and Quantity Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Value Of Product</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
                    ₹{(Number(selectedPi.unitValue) || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Quantity</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{selectedPi.quantity}</span>
                </div>
              </div>

              {/* Total Calculation Separator */}
              <div
                style={{
                  borderTop: '1px dashed #e2e8f0',
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Total Invoice Amount</span>
                <span style={{ fontSize: '18px', fontWeight: 'extrabold', color: '#2563eb' }}>
                  {selectedPi.amount}
                </span>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', width: '100%' }}>
              <button
                onClick={() => setSelectedPi(null)}
                style={{
                  height: '40px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Close Details
              </button>
              {selectedPi.status !== 'Cancelled' && selectedPi.status !== 'Converted to BOM' && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to mark Proforma Invoice ${selectedPi.piNo} as Cancelled?`)) {
                      const updated = piList.map(p => p.piNo === selectedPi.piNo ? { ...p, status: 'Cancelled', statusType: 'cancelled' } : p);
                      updatePiList(updated);
                      setSelectedPi(null);
                    }
                  }}
                  style={{
                    height: '40px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: '0 14px'
                  }}
                >
                  Cancel PI
                </button>
              )}
              <button
                onClick={() => {
                  const pi = selectedPi;
                  setSelectedPi(null);
                  handleConvertToBom(pi);
                }}
                style={{
                  height: '40px',
                  backgroundColor: '#4F46E5',
                  border: 'none',
                  color: 'white',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1.3,
                  boxShadow: '0 4px 10px rgba(79,70,229,0.25)'
                }}
              >
                <Layers style={{ width: '15px', height: '15px' }} />
                Convert to BOM →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION POPUP ==================== */}
      {deleteIdx !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          {/* Main Card Frame with White Padding */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              width: '420px',
              padding: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Embedded Red Header Pill Band: URGENT */}
            <div
              style={{
                backgroundColor: '#ff4d4d',
                color: 'white',
                fontSize: '12px',
                fontWeight: '800',
                height: '34px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '0.15em'
              }}
            >
              URGENT
            </div>

            {/* Inner box with dashed border - clean white background */}
            <div
              style={{
                padding: '16px',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'white'
              }}
            >
              {/* Title & Date Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
                  Delete Performa Invoice?
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                  {piList[deleteIdx].piDate}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Are you sure you want to permanently delete Performa Invoice <strong style={{ color: '#0f172a' }}>{piList[deleteIdx].piNo}</strong> for <strong>{piList[deleteIdx].vendor}</strong>? This action cannot be undone.
              </p>

              {/* Bottom line inside dashed area: Cancel on same line as Delete PI */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                <button
                  onClick={() => setDeleteIdx(null)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeletePI}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Delete PI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PI CONFIRMATION MODALS (CANCEL, DRAFT, CREATE) ==================== */}
      {piConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              width: '440px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: piConfirmModal === 'cancel' ? '#FEF2F2' : (piConfirmModal === 'draft' ? '#FFFBEB' : '#ECFEFF'),
                  color: piConfirmModal === 'cancel' ? '#EF4444' : (piConfirmModal === 'draft' ? '#D97706' : '#0E7490'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {piConfirmModal === 'cancel' ? <AlertTriangle size={20} /> : <FileCheck size={20} />}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  {piConfirmModal === 'cancel' ? 'Discard Proforma Invoice?' : 'Release Proforma Invoice?'}
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  {piConfirmModal === 'cancel' ? 'Unsaved modifications will be permanently lost' : 'Commercial document confirmation'}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {piConfirmModal === 'cancel' ? (
                <span>Are you sure you want to discard this Proforma Invoice? Any configured line items, preset structures, and addresses will be erased.</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>Customer:</strong> {vendorName || 'Not specified'}</div>
                  <div><strong>PI Number:</strong> {piNumber || 'N/A'}</div>
                  <div><strong>Total Value:</strong> ₹{calculatePiTotals().grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (incl. GST)</div>
                  <div><strong>Line Items / Scope:</strong> {piItems.length} material lines configured</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setPiConfirmModal(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (piConfirmModal === 'cancel') {
                    setPiConfirmModal(null);
                    resetForm();
                    setViewMode('list');
                  } else {
                    setPiConfirmModal(null);
                    executeCreatePI(false);
                  }
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: piConfirmModal === 'cancel' ? '#EF4444' : '#0E7490',
                  color: 'white',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {piConfirmModal === 'cancel' ? 'Yes, Discard' : 'Confirm & Release PI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CLEAR ALL ITEMS CONFIRMATION MODAL ==================== */}
      {showClearConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #FECDD3',
              width: '400px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FFF1F2', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Clear All Line Items?
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>This will remove all preset kits and items from the PI</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
              Are you sure you want to clear all {piItems.length} item lines? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Keep Items
              </button>
              <button
                type="button"
                onClick={() => {
                  setPiItems([]);
                  setPresetGroups({});
                  setShowClearConfirmModal(false);
                }}
                style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#E11D48', color: 'white', border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SIGNED DOCUMENT PREVIEW MODAL ==================== */}
      {previewDocModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #CBD5E1',
              width: '560px',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCheck size={18} color="#0E7490" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>{previewDocModal.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocModal(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', maxHeight: 'calc(85vh - 70px)' }}>
              {previewDocModal.dataUrl && previewDocModal.dataUrl.startsWith('data:image') ? (
                <img
                  src={previewDocModal.dataUrl}
                  alt={previewDocModal.name}
                  style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <FileText size={48} color="#0E7490" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{previewDocModal.name}</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>PDF document cached safely in offline local storage</span>
                  {previewDocModal.dataUrl && (
                    <a
                      href={previewDocModal.dataUrl}
                      download={previewDocModal.name}
                      style={{ marginTop: '8px', padding: '8px 16px', backgroundColor: '#0E7490', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: '700' }}
                    >
                      Download Attached File
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== OFFICIAL PROFORMA INVOICE PRINT & PDF TEMPLATE ==================== */}
      {printModalPi && (
        <VRMProformaInvoicePrintTemplate
          piData={printModalPi}
          onClose={() => setPrintModalPi(null)}
        />
      )}

    </div>
  );
}
