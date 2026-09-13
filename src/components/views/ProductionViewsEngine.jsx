import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus, Check, Trash2, Eye, FileText, Search, PlusCircle, AlertCircle, AlertTriangle, X,
  TrendingUp, Users, CheckCircle, Clock, ShieldAlert, Award,
  MapPin, Phone, Mail, FileCheck, CheckSquare, XCircle, ArrowRight, ArrowLeft,
  TrendingDown, DollarSign, Calendar, Edit3, SlidersHorizontal, Filter,
  ChevronLeft, ChevronRight, MoreVertical, RotateCcw, UploadCloud, ChevronDown, ChevronUp, ExternalLink,
  Truck, Shield, Package, Star, Download, HelpCircle, Info, ShoppingCart, Upload, Printer, Maximize2,
  ShieldCheck, Layers, Factory, Cpu, Receipt, IndianRupee, Smartphone, Camera, Image, RefreshCw,
  CreditCard, Bell, Video, Play, Pause, Film, Sparkles, MoreHorizontal, Copy, Hourglass, Boxes, Save
} from 'lucide-react';
import CreateWorkOrderPage from '../CreateWorkOrderPage';
import RawMaterialInventoryView from './RawMaterialInventoryView';
import InvoiceDetailModal from './InvoiceDetailModal';
import ConfirmingBomModal from './ConfirmingBomModal';
import DispatchPackingModal from './DispatchPackingModal';
import AccountsVerificationModal from './AccountsVerificationModal';
import DocPreviewModal from './DocPreviewModal';
import CustomerProfileView from './CustomerProfileView';
import CustomerFormView from './CustomerFormView';
import CreateBomFormPage from './CreateBomFormPage';
import { fetchCloudStore, saveCloudStore, saveCloudStoreImmediate, subscribeToCloudStore, getAndReserveNextBomCode, resolveBomCollisions } from '../../utils/supabaseDataSync';
import { getSafeZohoItems, getSafeZohoVendors } from '../../services/zohoSafeSync';
import { VRM_HDG_PRESETS, getAllActivePresets } from '../../vrmHdgProposalPresets';
import { VRM_PRODUCTS } from '../../utils/vrmProductsData';
import { getFullProductsCatalogWithStock } from '../../utils/productCatalogService';
import { prodModuleEngine } from '../../utils/productionModuleEngine';
import NotificationToast from '../NotificationToast';
import { addLiveNotification } from '../Header';
import VRMTaxInvoicePrintTemplate from '../VRMTaxInvoicePrintTemplate';
import VRMBomPrintTemplate, { VRMBomPrintSheet } from '../VRMBomPrintTemplate';
import * as XLSX from 'xlsx';
import { saveMediaToCache, getMediaFromCache, stripDataUrlsFromRecord, readCompressedImage, compressAndSaveFile, cleanNum, formatCurrency } from '../../utils/otherViewsShared';
import StatusBadge from '../StatusBadge';
import SearchablePresetSelector from '../SearchablePresetSelector';
import TypeableProductSelect from '../TypeableProductSelect';
import { is5PctSolarProduct } from '../PerformaInvoiceView';
import {
  notifyBomSentToDispatch,
  notifyBomPackedAndSentToAccounts,
  notifyAccountsVerificationCompleted,
  notifyInvoiceCompletedReadyForDispatch,
  notifyBomCancelledByDispatch
} from '../../services/notificationService';


export default function ProductionViewsEngine(props) {
  const {
    activeTab,
    onChangeTab,
    userRole = 'Sales Executive',
    convertingPiData,
    onClearConvertingPiData
  } = props;

  // Common states
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCreateGRN, setShowCreateGRN] = useState(false);
  const [grnItems, setGrnItems] = useState([]);
  const [selectedGRNPo, setSelectedGRNPo] = useState('');
  const [selectedGRNVendor, setSelectedGRNVendor] = useState('');
  const [grnChallanNo, setGrnChallanNo] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [grnDocs, setGrnDocs] = useState([]);
  const [livePOs, setLivePOs] = useState([]);
  const [poReceivingHistory, setPoReceivingHistory] = useState([]);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);
  const [poDetailData, setPoDetailData] = useState(null);

  const [grnToDelete, setGrnToDelete] = useState(null);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [editingGrnId, setEditingGrnId] = useState(null);
  const [deleteDocConfirmIdx, setDeleteDocConfirmIdx] = useState(null);
  const [activeDocPreviewModal, setActiveDocPreviewModal] = useState(null);

  const [grnReceivedBy, setGrnReceivedBy] = useState('');
  const [grnInspectorName, setGrnInspectorName] = useState('');
  const [grnInspectionRemarks, setGrnInspectionRemarks] = useState('');

  // Top-level state for Production Admin views to obey React Hook rules
  const [prodActiveSubTab, setProdActiveSubTab] = useState('All');
  const [prodSearchQueryText, setProdSearchQueryText] = useState('');
  const [prodFilterDateVal, setProdFilterDateVal] = useState('');
  const [prodFilterStatusSelect, setProdFilterStatusSelect] = useState('All');
  const [prodStatusFilterText, setProdStatusFilterText] = useState('All');

  useEffect(() => {
    setProdActiveSubTab('All');
    setProdSearchQueryText('');
    setProdFilterStatusSelect('All');
  }, [activeTab]);

  const [showBOMForm, setShowBOMForm] = useState(false);
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [custFormName, setCustFormName] = useState('');
  const [custFormCompany, setCustFormCompany] = useState('');
  const [custFormGstNo, setCustFormGstNo] = useState('');
  const [custFormMobile, setCustFormMobile] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');

  // Structured Billing Address
  const [custFormBillingAddress, setCustFormBillingAddress] = useState('');
  const [custFormBillingCity, setCustFormBillingCity] = useState('');
  const [custFormBillingState, setCustFormBillingState] = useState('');
  const [custFormBillingPincode, setCustFormBillingPincode] = useState('');

  // Structured Delivery Address
  const [custFormSameAsBilling, setCustFormSameAsBilling] = useState(false);
  const [custFormDeliveryAddress, setCustFormDeliveryAddress] = useState('');
  const [custFormDeliveryCity, setCustFormDeliveryCity] = useState('');
  const [custFormDeliveryState, setCustFormDeliveryState] = useState('');
  const [custFormDeliveryPincode, setCustFormDeliveryPincode] = useState('');

  const [customerList, setCustomerList] = useState([]);

  // Sync customerList with Supabase cloud database
  const isInitialCustMount = useRef(true);
  useEffect(() => {
    if (isInitialCustMount.current) {
      isInitialCustMount.current = false;
      return;
    }
    saveCloudStore('customer_store', customerList);
  }, [customerList]);

  const [customerActionMenuIdx, setCustomerActionMenuIdx] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [previewAddressProofModal, setPreviewAddressProofModal] = useState(null);
  const [bomActionMenuPos, setBomActionMenuPos] = useState({ top: 0, left: 0 });

  const [bomStore, setBomStore] = useState([]);

  const currentEmpId = (localStorage.getItem('controlroom_logged_emp_id') || '').trim();
  const currentEmpName = (localStorage.getItem('controlroom_logged_user_name') || '').trim();
  const currentLoggedEmail = (localStorage.getItem('controlroom_logged_user') || '').trim().toLowerCase();

  const isRestrictedSalesUser = userRole === 'Sales Executive';

  const visibleBomStore = useMemo(() => {
    const rawList = (bomStore || []).filter(Boolean);
    if (!isRestrictedSalesUser) return rawList;

    const curCode = currentEmpId.toUpperCase();
    const curName = currentEmpName.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    const curEmail = currentLoggedEmail;

    return rawList.filter(b => {
      if (!b) return false;
      const spCode = (b.salesPersonCode || b.createdById || '').trim().toUpperCase();
      if (curCode && spCode && spCode === curCode) return true;

      const spName = (b.salesPerson || b.createdBy || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      const creatorName = (b.createdBy || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      if (curName) {
        if (spName && (spName === curName || spName.includes(curName) || curName.includes(spName))) return true;
        if (creatorName && (creatorName === curName || creatorName.includes(curName) || curName.includes(creatorName))) return true;
        const cleanCur = curName.replace(/\s+/g, '');
        if (spName && spName.replace(/\s+/g, '').includes(cleanCur)) return true;
        if (creatorName && creatorName.replace(/\s+/g, '').includes(cleanCur)) return true;
      }

      if (curEmail && (b.salesPersonEmail || b.email || '').toLowerCase() === curEmail) {
        return true;
      }

      return false;
    });
  }, [bomStore, isRestrictedSalesUser, currentEmpId, currentEmpName, currentLoggedEmail]);

  const hasInitialSyncedRef = useRef(false);

  // Sync bomStore changes directly to Supabase cloud database
  useEffect(() => {
    if (bomStore && Array.isArray(bomStore) && bomStore.length > 0) {
      const sanitized = bomStore.map(stripDataUrlsFromRecord);
      if (hasInitialSyncedRef.current) {
        saveCloudStore('bom_store', sanitized);
      }
    }
  }, [bomStore]);

  useEffect(() => {
    const syncFromCloud = async () => {
      try {
        let data = null;
        try {
          const apiRes = await fetch('/api/boms');
          if (apiRes.ok) {
            const json = await apiRes.json();
            if (json && Array.isArray(json.data)) {
              data = json.data;
            }
          }
        } catch (_) {}

        if (data === null) {
          data = await fetchCloudStore('bom_store', []);
        }

        if (data && Array.isArray(data)) {
          if (data.length === 0) {
            setBomStore([]);
          } else {
            setBomStore(prev => {
              const combined = [...(Array.isArray(data) ? data : []), ...(Array.isArray(prev) ? prev : [])];
              const { list: resolvedList } = resolveBomCollisions(combined, 658);
              const parseBomSeq = (code) => {
                const m = String(code || '').match(/BOM-(\d+)/i);
                return m ? parseInt(m[1], 10) : 0;
              };
              const sorted = resolvedList.sort((a, b) => {
                const seqA = parseBomSeq(a?.bomCode || a?.code || a?.id);
                const seqB = parseBomSeq(b?.bomCode || b?.code || b?.id);
                if (seqA !== seqB) return seqB - seqA;
                const dateA = new Date(a?.salesConfirmedAt || a?.date || a?.createdAt || 0).getTime() || 0;
                const dateB = new Date(b?.salesConfirmedAt || b?.date || b?.createdAt || 0).getTime() || 0;
                return dateB - dateA;
              });
              return sorted.map(stripDataUrlsFromRecord);
            });
          }
        }

        // Sync Customers directly from Supabase & Zoho Books
        try {
          let custs = await fetchCloudStore('customer_store', []);
          if (!Array.isArray(custs) || custs.length === 0) {
            const zohoCustRes = await fetch('/api/zoho/customers');
            if (zohoCustRes.ok) {
              const zCusts = await zohoCustRes.json();
              if (Array.isArray(zCusts) && zCusts.length > 0) custs = zCusts;
            }
          }
          if (Array.isArray(custs) && custs.length > 0) {
            setCustomerList(custs);
          }
        } catch (_) {}
      } catch (err) {
        console.error('Error syncing BOMs in ProductionViewsEngine:', err);
      } finally {
        hasInitialSyncedRef.current = true;
      }
    };

    syncFromCloud();
    const pollInterval = setInterval(syncFromCloud, 4000);

    const handleBomUpdated = (e) => {
      if (e?.detail?.bom) {
        const newBom = e.detail.bom;
        setBomStore(prev => {
          const k = newBom.bomCode || newBom.code || newBom.id;
          const filtered = (prev || []).filter(b => b && (b.bomCode !== k && b.code !== k && b.id !== k));
          const list = [newBom, ...filtered];
          return list.map(stripDataUrlsFromRecord);
        });
      }
      syncFromCloud();
    };

    window.addEventListener('controlroom_bom_store_updated', handleBomUpdated);
    window.addEventListener('controlroom_storage_update', syncFromCloud);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('controlroom_bom_store_updated', handleBomUpdated);
      window.removeEventListener('controlroom_storage_update', syncFromCloud);
    };
  }, [activeTab]);

  const [bomActionMenuIdx, setBomActionMenuIdx] = useState(null);
  const [showFloatingMoreMenu, setShowFloatingMoreMenu] = useState(false);
  const [quickPreviewRecord, setQuickPreviewRecord] = useState(null);
  const [confirmingBomModal, setConfirmingBomModal] = useState(null); // Full BOM object being confirmed by Salesperson
  const [uploadPaymentModal, setUploadPaymentModal] = useState(null); // Full BOM object uploading payment proof
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentStageType, setPaymentStageType] = useState('100% Advance'); // '100% Advance' | '50% Advance' | '50% Dispatch' | 'Net 30 Days'
  const [dispatchPackingModal, setDispatchPackingModal] = useState(null); // Full BOM object being packed by Dispatch Head
  const [bomCancelPromptModal, setBomCancelPromptModal] = useState(null); // Full BOM object awaiting cancellation reason
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');
  const [accountsVerificationModal, setAccountsVerificationModal] = useState(null); // Full BOM object being verified by Accounts Team
  const [isAccountsViewOnly, setIsAccountsViewOnly] = useState(false); // Controls View mode vs Verification mode
  const [accountsBomViewMode, setAccountsBomViewMode] = useState('paper'); // 'paper' | 'table'
  const [viewingProofDocModal, setViewingProofDocModal] = useState(null); // BOM object or proof doc being viewed in detail
  const [showSoftCopyModal, setShowSoftCopyModal] = useState(false);
  const [softCopyMode, setSoftCopyMode] = useState('upload'); // 'upload' | 'camera'
  const [selectedSoftCopyFile, setSelectedSoftCopyFile] = useState(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraErrorMsg, setCameraErrorMsg] = useState('');
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [showDispatchCameraModal, setShowDispatchCameraModal] = useState(false);
  const [dispatchCameraError, setDispatchCameraError] = useState('');
  const dispatchCameraVideoRef = useRef(null);
  const dispatchCameraCanvasRef = useRef(null);
  const dispatchCameraStreamRef = useRef(null);

  const [newBomCode, setNewBomCode] = useState('');
  const [newBomDeliveryDate, setNewBomDeliveryDate] = useState('');
  const [newBomProductName, setNewBomProductName] = useState('');
  const [newBomSku, setNewBomSku] = useState('');
  const [newBomRevision, setNewBomRevision] = useState('');
  const [newBomTargetQty, setNewBomTargetQty] = useState('');
  const [newBomStatus, setNewBomStatus] = useState('ACTIVE');
  const [bomFormErrors, setBomFormErrors] = useState({});

  // Permission Check for Cancel BOM (Strictly Dispatch, Production, Billing, and Admin - Exclude Accounts)
  const canCancelBom = [
    'Dispatch Head', 'Dispatch Executive',
    'Production Head', 'Technical Administrator', 'CEO', 'MD', 'Managing Director',
    'Floor Supervisor', 'Billing', 'Invoice Executive'
  ].includes(userRole) && !String(userRole || '').toLowerCase().includes('accounts');

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
    } catch (err) {
      console.error('Error restoring inventory for BOM:', err);
    }
  };

  // Execution function to initiate Cancel BOM - prompts for mandatory reason
  const handleCancelBomOrder = (bomToCancel) => {
    if (!bomToCancel) return;
    if (!canCancelBom) {
      alert('⛔ Access Restricted!\nOnly Dispatch, Accounts, Production, or Billing logins are authorized to cancel a BOM and release reserved inventory.');
      return;
    }
    setBomCancelPromptModal(bomToCancel);
    setCancellationReasonInput('');
  };

  // Execution function to finalize Cancel BOM with mandatory reason and notify Sales Person
  const executeCancelBom = async (bomToCancel, reason) => {
    if (!bomToCancel) return;
    const cleanReason = (reason || '').trim();
    if (!cleanReason) {
      alert('⚠️ Cancellation Reason is mandatory.\nPlease specify why this BOM is being cancelled so the sales team is notified.');
      return;
    }

    const bCode = bomToCancel.bomCode || bomToCancel.code || bomToCancel.id;

    // 1. Restore Inventory
    const itemsToRestore = (bomToCancel.items && bomToCancel.items.length > 0)
      ? bomToCancel.items
      : (bomToCancel.dispatchPacking && bomToCancel.dispatchPacking.length > 0)
        ? bomToCancel.dispatchPacking
        : [];
    restoreInventoryForBom(itemsToRestore, bCode);

    // 2. Prepare updated cancelled BOM record
    const loggedInUser = localStorage.getItem('controlroom_logged_user_name') || userRole || 'Dispatch Head';
    const updatedBomRecord = {
      ...bomToCancel,
      status: 'Cancelled & Stock Restored',
      cancelled: true,
      cancellationReason: cleanReason,
      stockBlocked: false,
      cancelledBy: loggedInUser,
      cancelledAt: new Date().toISOString()
    };

    // 3. Update local bomStore and storage
    setBomStore(prev => {
      const updated = prev.map(b => (b.bomCode === bCode || b.code === bCode || b.id === bCode) ? updatedBomRecord : b);
      const sanitized = updated.map(stripDataUrlsFromRecord);
      try {
        localStorage.setItem('controlroom_bom_store', JSON.stringify(sanitized));
      } catch (_) {}
      saveCloudStore('bom_store', sanitized);
      return sanitized;
    });

    try {
      await fetch('/api/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bom: stripDataUrlsFromRecord(updatedBomRecord), isUpdate: true })
      });
    } catch (apiErr) {
      console.error('Error updating cancelled BOM to /api/boms:', apiErr);
    }

    window.dispatchEvent(new CustomEvent('controlroom_bom_store_updated', { detail: { bom: updatedBomRecord } }));

    // 4. Notify Sales Person who raised this BOM
    const salesPerson = bomToCancel.salesPerson || bomToCancel.salesExecutive || bomToCancel.createdBy || 'Sales Executive';
    notifyBomCancelledByDispatch({
      bomCode: bCode,
      customerName: bomToCancel.customerName,
      salesPerson: salesPerson,
      reason: cleanReason,
      cancelledBy: loggedInUser
    });

    // 5. Close open modals if target BOM matches
    if (dispatchPackingModal && (dispatchPackingModal.bomCode === bCode || dispatchPackingModal.code === bCode || dispatchPackingModal.id === bCode)) {
      setDispatchPackingModal(null);
    }
    if (accountsVerificationModal && (accountsVerificationModal.bomCode === bCode || accountsVerificationModal.code === bCode || accountsVerificationModal.id === bCode)) {
      setAccountsVerificationModal(null);
    }
    if (confirmingBomModal && (confirmingBomModal.bomCode === bCode || confirmingBomModal.code === bCode || confirmingBomModal.id === bCode)) {
      setConfirmingBomModal(null);
    }
    if (quickPreviewRecord && (quickPreviewRecord.bomCode === bCode || quickPreviewRecord.code === bCode || quickPreviewRecord.id === bCode)) {
      setQuickPreviewRecord(null);
    }
    setBomCancelPromptModal(null);
    setCancellationReasonInput('');

    alert(`✅ BOM (${bCode}) has been CANCELLED.\nReason: "${cleanReason}"\nSales person (${salesPerson.replace(/\\s*\\([^)]*\\)/g, '').trim()}) has been notified and all items have been restored to live inventory.`);
  };

  // Validation for Production BOM creation
  const validateProductionBomForm = (isDraft = false) => {
    const errors = {};
    const missingList = [];

    if (!newBomProductName || !newBomProductName.trim()) {
      errors.customerName = 'Customer Name is required';
      missingList.push({
        field: 'Customer Name',
        message: 'Please select or enter the customer name.',
        targetId: 'prod-field-newBomProductName'
      });
    }

    if (!isDraft && (!newBomDeliveryDate || !newBomDeliveryDate.trim())) {
      errors.deliveryDate = 'Delivery Date is required';
      missingList.push({
        field: 'Delivery Date',
        message: 'Please select expected Delivery Date for Dispatch.',
        targetId: 'prod-field-newBomDeliveryDate'
      });
    }

    if (!bomMaterialsList || bomMaterialsList.length === 0) {
      errors.items = 'At least 1 product item or preset kit is required';
      missingList.push({
        field: 'Order Items / Materials',
        message: 'Please add at least one material/product item or select a preset kit.',
        targetId: 'prod-field-bomMaterialsList'
      });
    } else {
      const invalidItems = [];
      bomMaterialsList.forEach((it, idx) => {
        const qty = parseFloat(it.qty) || 0;
        if (!it.name || !it.name.trim()) {
          invalidItems.push(`Item #${idx + 1}: Name is missing`);
        } else if (qty <= 0) {
          invalidItems.push(`Item #${idx + 1} (${it.name}): Quantity must be > 0`);
        }
      });
      if (invalidItems.length > 0) {
        errors.items = invalidItems.join(', ');
        missingList.push({
          field: 'Item Details Missing',
          message: invalidItems.join(' • '),
          targetId: 'prod-field-bomMaterialsList'
        });
      }
    }

    if (!sameAsBilling) {
      const street = (newBomDeliveryStreet || '').trim();
      const city = (newBomDeliveryCity || '').trim();
      if (!street || !city) {
        errors.deliveryAddress = 'Delivery Address and City are required';
        missingList.push({
          field: 'Delivery Address',
          message: 'Delivery street and city are required when different from billing.',
          targetId: 'prod-field-newBomDeliveryStreet'
        });
      }
    }

    if (!isDraft && (newBomPaymentType === '100% Paid' || newBomPaymentType.includes('Advance'))) {
      if (!newBomPaymentProofDoc) {
        errors.paymentProof = 'Payment Attachment / Slip is required';
        missingList.push({
          field: 'Payment Slip / Advice',
          message: `Payment proof attachment is mandatory for "${newBomPaymentType}" orders.`,
          targetId: 'prod-field-newBomPaymentProofDoc'
        });
      }
    }

    setBomFormErrors(errors);
    return { isValid: missingList.length === 0, missingList, errors };
  };
  const [newBomBillingStreet, setNewBomBillingStreet] = useState('');
  const [newBomBillingCity, setNewBomBillingCity] = useState('');
  const [newBomBillingState, setNewBomBillingState] = useState('');
  const [newBomBillingPincode, setNewBomBillingPincode] = useState('');
  const [newBomDeliveryAddress, setNewBomDeliveryAddress] = useState('');
  const [newBomDeliveryStreet, setNewBomDeliveryStreet] = useState('');
  const [newBomDeliveryCity, setNewBomDeliveryCity] = useState('');
  const [newBomDeliveryState, setNewBomDeliveryState] = useState('');
  const [newBomDeliveryPincode, setNewBomDeliveryPincode] = useState('');
  const [newBomPaymentType, setNewBomPaymentType] = useState('100% Paid');
  const [newBomCreditDays, setNewBomCreditDays] = useState(7);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [newBomDeliveryProofDoc, setNewBomDeliveryProofDoc] = useState(null);
  const [newBomPaymentProofDoc, setNewBomPaymentProofDoc] = useState(null);
  const [newBomRemarks, setNewBomRemarks] = useState('');
  const [newBomTransportMode, setNewBomTransportMode] = useState('Transport');
  const [newBomTransporterName, setNewBomTransporterName] = useState('');
  const [newBomVehicleNo, setNewBomVehicleNo] = useState('');
  const [newBomLrNo, setNewBomLrNo] = useState('');
  const [newBomGstRate, setNewBomGstRate] = useState('18%');
  const [activePresetsMap, setActivePresetsMap] = useState(() => getAllActivePresets());
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetSetCount, setPresetSetCount] = useState(1);
  const [presetKitPrice, setPresetKitPrice] = useState('');
  const [previewDocModal, setPreviewDocModal] = useState(null); // { title, doc }

  // DocPreviewModal extracted to ./DocPreviewModal.jsx
  const [selectedBomItemIndexes, setSelectedBomItemIndexes] = useState([]);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [bomConfirmModal, setBomConfirmModal] = useState(null); // { type: 'cancel' | 'draft' | 'create' }
  const [reuploadAddressProofModal, setReuploadAddressProofModal] = useState(null); // BOM object requiring address proof re-upload
  const [reuploadProofFile, setReuploadProofFile] = useState(null);
  const [updatePaymentModal, setUpdatePaymentModal] = useState(null); // BOM object for updating payment (Partial/Credit)
  const [updatePaymentFile, setUpdatePaymentFile] = useState(null);
  const [updatePaymentNotes, setUpdatePaymentNotes] = useState('');

  // Real-time synchronization for custom presets created by Tech Support
  useEffect(() => {
    const handlePresetUpdate = (e) => {
      if (e.detail) {
        setActivePresetsMap(e.detail);
      }
    };
    window.addEventListener('vrm_presets_updated', handlePresetUpdate);
    return () => window.removeEventListener('vrm_presets_updated', handlePresetUpdate);
  }, []);

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
      setNewBomCode('');
      if (pendingPi.customerName) setNewBomProductName(pendingPi.customerName);
      setNewBomRemarks('');

      // Address mapping from PI
      const bObj = pendingPi.billingAddressObj || {};
      const bStreet = pendingPi.billingStreet || (typeof pendingPi.billingAddress === 'string' ? pendingPi.billingAddress : '') || bObj.address || '';
      const bCity = pendingPi.billingCity || bObj.city || '';
      const bState = pendingPi.billingState || bObj.state || '';
      const bPin = pendingPi.billingPincode || bObj.pincode || '';

      if (bStreet) setNewBomBillingStreet(bStreet);
      if (bCity) setNewBomBillingCity(bCity);
      if (bState) setNewBomBillingState(bState);
      if (bPin) setNewBomBillingPincode(bPin);

      const isSame = pendingPi.sameAsBilling !== false;
      setSameAsBilling(isSame);

      if (isSame) {
        setNewBomDeliveryStreet(bStreet);
        setNewBomDeliveryCity(bCity);
        setNewBomDeliveryState(bState);
        setNewBomDeliveryPincode(bPin);
      } else {
        const dObj = pendingPi.deliveryAddressObj || {};
        const dStreet = pendingPi.deliveryStreet || (typeof pendingPi.deliveryAddress === 'string' ? pendingPi.deliveryAddress : '') || dObj.address || '';
        const dCity = pendingPi.deliveryCity || dObj.city || '';
        const dState = pendingPi.deliveryState || dObj.state || '';
        const dPin = pendingPi.deliveryPincode || dObj.pincode || '';

        setNewBomDeliveryStreet(dStreet);
        setNewBomDeliveryCity(dCity);
        setNewBomDeliveryState(dState);
        setNewBomDeliveryPincode(dPin);
      }

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
        const detail = e.detail;
        setShowBOMForm(true);
        setNewBomCode('');
        if (detail.customerName) setNewBomProductName(detail.customerName);
        setNewBomRemarks('');

        const bObj = detail.billingAddressObj || {};
        const bStreet = detail.billingStreet || (typeof detail.billingAddress === 'string' ? detail.billingAddress : '') || bObj.address || '';
        const bCity = detail.billingCity || bObj.city || '';
        const bState = detail.billingState || bObj.state || '';
        const bPin = detail.billingPincode || bObj.pincode || '';

        if (bStreet) setNewBomBillingStreet(bStreet);
        if (bCity) setNewBomBillingCity(bCity);
        if (bState) setNewBomBillingState(bState);
        if (bPin) setNewBomBillingPincode(bPin);

        const isSame = detail.sameAsBilling !== false;
        setSameAsBilling(isSame);

        if (isSame) {
          setNewBomDeliveryStreet(bStreet);
          setNewBomDeliveryCity(bCity);
          setNewBomDeliveryState(bState);
          setNewBomDeliveryPincode(bPin);
        } else {
          const dObj = detail.deliveryAddressObj || {};
          const dStreet = detail.deliveryStreet || (typeof detail.deliveryAddress === 'string' ? detail.deliveryAddress : '') || dObj.address || '';
          const dCity = detail.deliveryCity || dObj.city || '';
          const dState = detail.deliveryState || dObj.state || '';
          const dPin = detail.deliveryPincode || dObj.pincode || '';

          setNewBomDeliveryStreet(dStreet);
          setNewBomDeliveryCity(dCity);
          setNewBomDeliveryState(dState);
          setNewBomDeliveryPincode(dPin);
        }

        if (Array.isArray(detail.items) && detail.items.length > 0) {
          setBomMaterialsList(detail.items.map(it => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convertingPiData]);

  // Vehicle Loading & Final Dispatch State
  const [vehicleLoadingModal, setVehicleLoadingModal] = useState(null); // BOM object undergoing vehicle loading
  const [vehicleLoadingData, setVehicleLoadingData] = useState({
    vehicleNo: '',
    driverName: '',
    driverPhone: '',
    transporter: '',
    lrNo: '',
    sealNo: '',
    ewayBillNo: '',
    loadingNotes: ''
  });
  const [loadingPhotos, setLoadingPhotos] = useState([]); // [{ id, name, size, dataUrl, capturedAt }]
  const [loadingVideos, setLoadingVideos] = useState([]); // [{ id, name, size, dataUrl, recordedAt }]
  const [loadingMediaMode, setLoadingMediaMode] = useState('photo'); // 'photo' | 'video' | 'camera'
  const [isRecordingLoadingVideo, setIsRecordingLoadingVideo] = useState(false);
  const [loadingCameraActive, setLoadingCameraActive] = useState(false);
  const [activeMediaPreviewModal, setActiveMediaPreviewModal] = useState(null); // { type: 'image' | 'video', url, name }
  const [dispatchChecklistPreviewModal, setDispatchChecklistPreviewModal] = useState(null); // { bomCode, customerName, packedBy, packedItems, allCount, packedCount }
  const [completedBomSummaryModal, setCompletedBomSummaryModal] = useState(null); // Completed BOM object

  const [customAlert, setCustomAlert] = useState(null);

  const showCustomAlert = (msg, title = null, type = null, details = null, targetFieldId = null) => {
    const payload = typeof msg === 'object' && msg !== null && !Array.isArray(msg) && msg.message !== undefined
      ? msg
      : { message: msg, title, type, details, targetFieldId };

    let detectedType = payload.type;
    let detectedTitle = payload.title;
    const strMsg = String(payload.message || '');

    if (!detectedType) {
      if (strMsg.includes('❌') || strMsg.toLowerCase().includes('wrong') || strMsg.toLowerCase().includes('error') || strMsg.toLowerCase().includes('fail') || strMsg.toLowerCase().includes('invalid') || strMsg.toLowerCase().includes('unable') || strMsg.toLowerCase().includes('cannot')) {
        detectedType = 'error';
        if (!detectedTitle) detectedTitle = 'Uh oh! Something went wrong';
      } else if (strMsg.includes('⚠️') || strMsg.toLowerCase().includes('warning') || strMsg.toLowerCase().includes('mandatory') || strMsg.toLowerCase().includes('differs') || strMsg.toLowerCase().includes('please') || (payload.details && payload.details.length > 0)) {
        detectedType = 'warning';
        if (!detectedTitle) detectedTitle = 'Attention Required';
      } else if (strMsg.includes('✅') || strMsg.toLowerCase().includes('success') || strMsg.toLowerCase().includes('approved') || strMsg.toLowerCase().includes('verified') || strMsg.toLowerCase().includes('completed')) {
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
      message: cleanMsg || (detectedType === 'error' ? 'We apologize for the inconvenience you experienced.' : 'Action completed.'),
      type: detectedType || 'info',
      details: payload.details || null,
      targetFieldId: payload.targetFieldId || null
    });
  };

  // Shadow window.alert within OtherViews to always render the custom branded popup
  const alert = (msg, title, type) => showCustomAlert(msg, title, type);

  const [bomMaterialsList, setBomMaterialsList] = useState([]);

  const [bomRoutingSteps, setBomRoutingSteps] = useState([
    { stepNo: 1, opName: 'Uncoiling & Cut to Length', machine: 'CNC Cutting Machine', cycleTime: '3.5 sec', setupTime: '10 mins', skill: 'Skilled Operator' },
    { stepNo: 2, opName: 'Precision Slot Punching', machine: 'Punching Machine #1', cycleTime: '4.0 sec', setupTime: '15 mins', skill: 'Skilled Operator' },
    { stepNo: 3, opName: 'Quality Inspection & Deburring', machine: 'QC Station #1', cycleTime: '2.0 sec', setupTime: '5 mins', skill: 'QC Inspector' },
    { stepNo: 4, opName: 'Final Stacking & Packing', machine: 'Packing Bench', cycleTime: '5.0 sec', setupTime: '5 mins', skill: 'Assembly Worker' }
  ]);

  // Reset sub-form view state whenever switching main tabs/side menu items
  useEffect(() => {
    setShowBOMForm(false);
    setShowWorkOrderForm(false);
    setShowCustomerForm(false);
    setViewingCustomer(null);
    setEditingCustomer(null);
  }, [activeTab]);

  // Reset GRN modal state to clean initial state
  const resetCreateGRNForm = () => {
    setSelectedGRNPo('');
    setSelectedGRNVendor('');
    setGrnChallanNo('');
    setGrnReceivedBy('');
    setGrnInspectorName('');
    setGrnInspectionRemarks('');
    setGrnItems([]);
    setPoReceivingHistory([]);
    setIsViewOnlyMode(false);
    setEditingGrnId(null);
  };

  // Fetch live Zoho Purchase Orders & stored GRNs for GRN selection and list display
  useEffect(() => {
    fetch('/api/zoho/purchaseorders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLivePOs(data);
        }
      })
      .catch(err => console.error('Error fetching live POs:', err));
  }, []);

  useEffect(() => {
    if (activeTab === 'Goods Receipt Note' || activeTab === 'Goods Receipt Note (GRN)') {
      fetch('/api/grns')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formattedList = data.map(g => ({
              id: g.grnNo || g.id,
              poRef: g.poRef || g.poNo || '—',
              vendor: g.vendor || '—',
              date: g.date || '—',
              received: `${g.receivedQty || 0} Units`,
              status: g.status || 'Approved',
              val: `₹ ${(g.receivedQty || 0) * 1250}`,
              challanNo: g.challanNo || '',
              receivedBy: g.receivedBy || '',
              inspectorName: g.inspectorName || '',
              inspectionRemarks: g.inspectionRemarks || '',
              documents: g.documents || []
            }));
            setGrnList(formattedList);
          }
        })
        .catch(err => console.error('Error fetching stored GRNs:', err));
    }
  }, [activeTab]);

  // Function to load PO details and line items when a PO is selected
  const loadPOItems = (selectedId, currentLivePOs = livePOs) => {
    if (!selectedId) {
      setSelectedGRNPo('');
      setGrnItems([]);
      setSelectedGRNVendor('');
      setPoReceivingHistory([]);
      return;
    }

    const found = currentLivePOs.find(p => p.poNo === selectedId || p.id === selectedId);
    const vendorName = found ? found.vendor : 'Vendor';
    const targetId = found ? (found.id || selectedId) : selectedId;
    const poRef = found ? (found.poNo || selectedId) : selectedId;

    setSelectedGRNPo(poRef);
    setSelectedGRNVendor(vendorName);

    Promise.all([
      fetch(`/api/zoho/purchaseorders/${encodeURIComponent(targetId)}`).then(res => res.ok ? res.json().catch(() => null) : null),
      fetch(`/api/po-receiving-history/${encodeURIComponent(poRef)}`).then(res => res.ok ? res.json().catch(() => null) : null)
    ])
      .then(([detail, historyData]) => {
        let rawItems = (detail && Array.isArray(detail.items) && detail.items.length > 0)
          ? detail.items
          : [
            { name: 'Solar Mounting Structure', description: 'HDG Aluminium Profile Rail 40x40mm', qty: 3000, unit: 'NOS' },
            { name: 'Fasteners M8*50 SS304', description: 'SS304 Allen Bolt with Washer', qty: 1000, unit: 'Set' }
          ];

        const historyTotals = (historyData && historyData.itemReceivedTotals) ? historyData.itemReceivedTotals : {};
        const historyList = (historyData && historyData.grnHistory) ? historyData.grnHistory : [];

        const items = rawItems.map((it, idx) => {
          const itemId = it.id || it.itemId || it.lineItemId || `PO-ITEM-${idx}`;
          const itemName = (it.name || '').trim().toLowerCase();

          let prev = 0;
          if (historyTotals[itemId] !== undefined) {
            prev = Number(historyTotals[itemId]);
          } else if (historyTotals[itemName] !== undefined) {
            prev = Number(historyTotals[itemName]);
          } else if (historyTotals[idx] !== undefined) {
            prev = Number(historyTotals[idx]);
          } else if (it.previouslyReceived !== undefined) {
            prev = Number(it.previouslyReceived);
          }

          const ordered = it.qty || 0;
          const remaining = (it.remainingQty !== undefined) ? Number(it.remainingQty) : Math.max(0, ordered - prev);

          return {
            id: itemId,
            name: it.name,
            sku: it.sku || `SKU-${101 + idx}`,
            desc: it.description || '',
            uom: it.unit || 'NOS',
            ordered: ordered,
            prev: prev,
            remaining: remaining,
            now: '',
            accepted: '',
            rejected: 0,
            reason: '—',
            batch: `LOT-2026-${idx + 1}`
          };
        });

        setGrnItems(items);
        setPoReceivingHistory(historyList);
      })
      .catch(err => console.error('Error fetching PO receiving history:', err));
  };

  // Fetch detailed PO summary and GRN receiving history when viewing PO detail
  useEffect(() => {
    if (selectedPOForDetail) {
      const found = livePOs.find(p => p.poNo === selectedPOForDetail || p.id === selectedPOForDetail);
      const targetId = found ? found.id : selectedPOForDetail;

      fetch(`/api/zoho/purchaseorders/${targetId}`)
        .then(res => res.json())
        .then(data => setPoDetailData(data))
        .catch(err => console.error('Error fetching PO detail:', err));
    } else {
      setPoDetailData(null);
    }
  }, [selectedPOForDetail, livePOs]);

  // Add Stock Form States
  const [showAddStockForm, setShowAddStockForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState('INV-1042');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('PAY-0087');
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [stockEntry, setStockEntry] = useState({
    entryType: 'Stock Addition',
    warehouse: 'Main Warehouse',
    entryDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    reason: 'Opening Stock',
    refNo: '',
    addedBy: 'Admin User'
  });
  const [addStockItems, setAddStockItems] = useState([]);
  const [stockDetails, setStockDetails] = useState({
    batchNo: '',
    supplier: '',
    mfgDate: '',
    expiryDate: '',
    storageLocation: 'Rack A-04',
    remarks: ''
  });
  const [stockDocs, setStockDocs] = useState([]);

  useEffect(() => {
    setSelectedRows([]);
    setShowAddStockForm(false);
  }, [activeTab]);

  const [grnValidationModal, setGrnValidationModal] = useState(null);

  const handleSaveAndReceive = () => {
    const missing = [];
    if (!selectedGRNPo) missing.push('Purchase Order');
    if (!selectedGRNVendor) missing.push('Vendor');
    if (!grnChallanNo || String(grnChallanNo).trim() === '') missing.push('DC NO / Invoice No.');
    if (!grnReceivedBy || String(grnReceivedBy).trim() === '') missing.push('Received By');

    if (missing.length > 0) {
      setGrnValidationModal({ title: 'Mandatory Fields Required', fields: missing, message: 'Please complete all required fields to proceed.' });
      return;
    }

    // Prepare item list with defaults if user didn't type explicit numbers into inputs
    const processedItems = grnItems.map(it => {
      const remaining = Math.max(0, (it.ordered || 0) - (it.prev || 0));
      const nowVal = (it.now !== '' && it.now !== undefined && it.now !== null) ? Number(it.now) : (remaining > 0 ? remaining : (it.ordered || 1));
      const acceptedVal = (it.accepted !== '' && it.accepted !== undefined && it.accepted !== null) ? Number(it.accepted) : nowVal;
      return {
        ...it,
        now: nowVal,
        accepted: acceptedVal,
        rejected: Number(it.rejected || 0)
      };
    });

    const invalidItem = processedItems.find(it => {
      const remaining = Math.max(0, (it.ordered || 0) - (it.prev || 0));
      return (it.now || 0) > remaining && remaining > 0;
    });

    if (invalidItem) {
      const remaining = Math.max(0, (invalidItem.ordered || 0) - (invalidItem.prev || 0));
      setGrnValidationModal({
        title: 'Validation Error',
        message: `Received quantity (${invalidItem.now}) for "${invalidItem.name}" cannot exceed the pending quantity of ${remaining}.`
      });
      return;
    }

    const totalNow = processedItems.reduce((acc, it) => acc + Number(it.now || 0), 0);
    const totalAccepted = processedItems.reduce((acc, it) => acc + Number(it.accepted || 0), 0);
    const totalRejected = processedItems.reduce((acc, it) => acc + Number(it.rejected || 0), 0);

    const docsToAttach = grnDocs || [];

    const payload = {
      poRef: selectedGRNPo,
      poNo: selectedGRNPo,
      vendor: selectedGRNVendor || 'Vendor',
      challanNo: grnChallanNo || 'DC-NEW',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      receivedQty: totalNow,
      acceptedQty: totalAccepted,
      rejectedQty: totalRejected,
      receivedBy: grnReceivedBy || '',
      inspectorName: grnInspectorName || '',
      inspectionRemarks: grnInspectionRemarks || '',
      items: processedItems,
      documents: docsToAttach
    };

    fetch('/api/grns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.grn) {
          const formattedGRN = {
            id: data.grn.grnNo || data.grn.id,
            poRef: data.grn.poRef || data.grn.poNo || '—',
            vendor: data.grn.vendor || '—',
            date: data.grn.date || '—',
            received: `${totalNow} Units`,
            status: data.grn.status || 'OPEN / PARTIALLY RECEIVED',
            val: `₹ ${totalNow * 1250}`,
            challanNo: data.grn.challanNo || grnChallanNo,
            receivedBy: data.grn.receivedBy || grnReceivedBy,
            documents: data.grn.documents || docsToAttach
          };

          setGrnList(prev => [formattedGRN, ...prev.filter(g => g.id !== formattedGRN.id)]);

          fetch('/api/grns')
            .then(res => res.json())
            .then(grns => {
              if (Array.isArray(grns)) {
                setGrnList(grns.map(g => ({
                  id: g.grnNo || g.id,
                  poRef: g.poRef || g.poNo || '—',
                  vendor: g.vendor || '—',
                  date: g.date || '—',
                  received: `${g.receivedQty || 0} Units`,
                  status: g.status || 'Approved',
                  val: `₹ ${(g.receivedQty || 0) * 1250}`,
                  challanNo: g.challanNo || '',
                  receivedBy: g.receivedBy || '',
                  inspectorName: g.inspectorName || '',
                  inspectionRemarks: g.inspectionRemarks || '',
                  documents: g.documents || []
                })));
              }
            });

          fetch('/api/zoho/purchaseorders')
            .then(res => res.json())
            .then(d => { if (Array.isArray(d)) setLivePOs(d); });

          fetch('/api/zoho/items')
            .then(res => res.json())
            .then(items => { if (Array.isArray(items)) setItemsList(items); });
        }
        setShowCreateGRN(false);
        resetCreateGRNForm();
      })
      .catch(err => {
        console.error('Failed to post GRN to API, saving to local state fallback:', err);
        const fallbackGRN = {
          id: `GRN-2026-${String(grnList.length + 101).padStart(5, '0')}`,
          poRef: selectedGRNPo || 'PO-00001',
          vendor: selectedGRNVendor || 'Vendor',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          received: `${totalNow} Units`,
          status: 'OPEN / PARTIALLY RECEIVED',
          val: `₹ ${totalNow * 1250}`,
          challanNo: grnChallanNo,
          receivedBy: grnReceivedBy,
          documents: docsToAttach
        };
        setGrnList(prev => [fallbackGRN, ...prev]);
        setShowCreateGRN(false);
        resetCreateGRNForm();
      });
  };

  const handleFullyReceived = () => {
    if (!selectedGRNPo) {
      setGrnValidationModal({ title: 'Purchase Order Required', message: 'Please select a Purchase Order to mark as Fully Received.' });
      return;
    }

    const completedItems = grnItems.map(it => {
      const ord = it.ordered || (it.prev ? it.prev + (it.now || 1) : (it.now || 1));
      const nowQty = Math.max(1, (it.now && it.now > 0) ? it.now : (ord - (it.prev || 0)));
      const acceptedQty = Math.max(1, (it.accepted && it.accepted > 0) ? it.accepted : nowQty);
      return {
        ...it,
        ordered: ord,
        now: nowQty,
        accepted: acceptedQty,
        rejected: 0,
        reason: '—'
      };
    });

    const totalAccepted = completedItems.reduce((acc, it) => acc + Number(it.accepted || 0), 0);
    const docsToAttach = grnDocs || [];

    const payload = {
      poRef: selectedGRNPo,
      poNo: selectedGRNPo,
      vendor: selectedGRNVendor || 'Vendor',
      challanNo: grnChallanNo || 'DC-FINAL',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      receivedQty: totalAccepted,
      acceptedQty: totalAccepted,
      rejectedQty: 0,
      receivedBy: grnReceivedBy || 'Store Manager',
      inspectorName: grnInspectorName || 'Quality Inspector',
      inspectionRemarks: grnInspectionRemarks || 'PO Marked as Fully Received & Closed',
      items: completedItems,
      documents: docsToAttach,
      status: 'CLOSED / FULLY RECEIVED',
      forceClosePO: true
    };

    fetch('/api/grns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.grn) {
          const formattedGRN = {
            id: data.grn.grnNo || data.grn.id,
            poRef: data.grn.poRef || data.grn.poNo || '—',
            vendor: data.grn.vendor || '—',
            date: data.grn.date || '—',
            received: `${totalAccepted} Units`,
            status: 'CLOSED / FULLY RECEIVED',
            val: `₹ ${totalAccepted * 1250}`,
            challanNo: data.grn.challanNo || grnChallanNo,
            receivedBy: data.grn.receivedBy || grnReceivedBy,
            documents: data.grn.documents || docsToAttach
          };

          setGrnList(prev => [formattedGRN, ...prev.filter(g => g.id !== formattedGRN.id)]);
        }

        fetch('/api/grns')
          .then(res => res.json())
          .then(grns => {
            if (Array.isArray(grns)) {
              setGrnList(grns.map(g => ({
                id: g.grnNo || g.id,
                poRef: g.poRef || g.poNo || '—',
                vendor: g.vendor || '—',
                date: g.date || '—',
                received: `${g.receivedQty || 0} Units`,
                status: g.status || 'CLOSED / FULLY RECEIVED',
                val: `₹ ${(g.receivedQty || 0) * 1250}`,
                challanNo: g.challanNo || '',
                receivedBy: g.receivedBy || '',
                inspectorName: g.inspectorName || '',
                inspectionRemarks: g.inspectionRemarks || '',
                documents: g.documents || []
              })));
            }
          });

        fetch('/api/zoho/purchaseorders')
          .then(res => res.json())
          .then(d => { if (Array.isArray(d)) setLivePOs(d); });

        fetch('/api/zoho/items')
          .then(res => res.json())
          .then(items => { if (Array.isArray(items)) setItemsList(items); });

        setShowCreateGRN(false);
        resetCreateGRNForm();
      })
      .catch(err => {
        console.error('Failed to mark as Fully Received on API, saving to local state fallback:', err);
        const fallbackGRN = {
          id: `GRN-2026-${String(grnList.length + 101).padStart(5, '0')}`,
          poRef: selectedGRNPo || 'PO-00001',
          vendor: selectedGRNVendor || 'Vendor',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          received: `${totalAccepted} Units`,
          status: 'CLOSED / FULLY RECEIVED',
          val: `₹ ${totalAccepted * 1250}`,
          challanNo: grnChallanNo || 'DC-FULL',
          receivedBy: grnReceivedBy || 'Store Manager',
          documents: docsToAttach
        };
        setGrnList(prev => [fallbackGRN, ...prev]);
        setShowCreateGRN(false);
        resetCreateGRNForm();
      });
  };

  const handleDeleteGRN = (targetId) => {
    const targetItem = grnList.find(g => g.id === targetId || g.grnNo === targetId);
    if (targetItem && (
      targetItem.status === 'CLOSED / FULLY RECEIVED' ||
      targetItem.status === 'Approved' ||
      targetItem.status === 'Fully Accepted' ||
      targetItem.status === 'Closed' ||
      targetItem.status === 'CLOSED'
    )) {
      alert('Fully received or approved GRNs cannot be deleted.');
      return;
    }
    setGrnToDelete(targetId);
  };

  const confirmDeleteGRN = () => {
    if (!grnToDelete) return;
    const targetId = grnToDelete;

    fetch(`/api/grns/${encodeURIComponent(targetId)}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        setGrnList(prev => prev.filter(g => g.id !== targetId && g.grnNo !== targetId));
        setGrnToDelete(null);
        // Refresh live POs list
        fetch('/api/zoho/purchaseorders')
          .then(res => res.json())
          .then(d => { if (Array.isArray(d)) setLivePOs(d); });
      })
      .catch(err => {
        console.error('Error deleting GRN:', err);
        setGrnToDelete(null);
      });
  };

  const handleAddStockSubmit = () => {
    let updatedRegistry = [...stockRegistry];
    addStockItems.forEach(item => {
      const existIdx = updatedRegistry.findIndex(r => r.code === item.sku);
      if (existIdx > -1) {
        const currentQty = Number(updatedRegistry[existIdx].stock.replace(/,/g, ''));
        const newQty = currentQty + Number(item.qty || 0);
        updatedRegistry[existIdx] = {
          ...updatedRegistry[existIdx],
          stock: String(newQty),
          val: String(Math.round(newQty * item.rate)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        };
      } else {
        updatedRegistry.push({
          code: item.sku,
          item: item.name,
          category: item.category,
          location: stockEntry.warehouse,
          stock: String(item.qty),
          allocated: '0',
          incoming: '-',
          minLevel: '500',
          val: String(Math.round(item.qty * item.rate)).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
          status: 'In Stock'
        });
      }
    });
    setStockRegistry(updatedRegistry);
    setShowAddStockForm(false);
  };

  const renderStatusBadge = (status) => {
    let colors = { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }; // default
    switch (status) {
      case 'Pending Approval':
        colors = { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
        break;
      case 'Pending Review':
        colors = { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
        break;
      case 'Approved':
      case 'Active':
      case 'Fully Accepted':
      case '3-Way Match OK':
      case 'Paid':
      case 'Completed':
      case 'Preferred':
      case 'Ready for Payment':
        colors = { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
        break;
      case 'In Procurement':
        colors = { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
        break;
      case 'Partially Fulfilled':
        colors = { bg: '#fef9c3', color: '#a16207', border: '#fef08a' };
        break;
      case 'Rejected':
      case 'Inactive':
      case 'Blacklisted':
      case 'Shortage Detected':
      case 'Discrepancy (Qty)':
      case 'On Hold':
      case 'Failed':
        colors = { bg: '#fff5f5', color: '#e53e3e', border: '#fed7d7' };
        break;
      case 'Draft':
        colors = { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
        break;
      case 'Sent':
        colors = { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
        break;
      case 'Viewed':
        colors = { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
        break;
      case 'Expired':
        colors = { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
        break;
      case 'Scheduled':
        colors = { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' };
        break;
      default:
        colors = { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.color, display: 'inline-block' }} />
        {status}
      </span>
    );
  };

  const renderPriorityBadge = (priority) => {
    let colors = { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    switch (priority) {
      case 'High':
        colors = { bg: '#fff5f5', color: '#e53e3e', border: '#fed7d7' };
        break;
      case 'Normal':
      case 'Medium':
        colors = { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
        break;
      case 'Low':
        colors = { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
        break;
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.color, display: 'inline-block' }} />
        {priority}
      </span>
    );
  };

  const handleSelectAllGeneric = (e, items, keyField) => {
    if (e.target.checked) {
      setSelectedRows(items.map(item => item[keyField]));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRowGeneric = (val) => {
    if (selectedRows.includes(val)) {
      setSelectedRows(selectedRows.filter(item => item !== val));
    } else {
      setSelectedRows([...selectedRows, val]);
    }
  };

  // RFP Data State (Expanded to match user screenshot)
  const [rfpList, setRfpList] = useState([
    { id: 'PR-2026-189', requester: 'Ravi Kumar', dept: 'Production', req: 'GI Steel Coil 2mm', qty: '10.00 MT', requiredBy: '15 Jun 2026', priority: 'High', status: 'Pending Approval', date: '29 May 2026, 09:15 AM' },
    { id: 'PR-2026-190', requester: 'Arun Prasad', dept: 'Design', req: 'Aluminium Rail 120mm', qty: '100 Nos', requiredBy: '18 Jun 2026', priority: 'Normal', status: 'Approved', date: '29 May 2026, 11:30 AM' },
    { id: 'PR-2026-191', requester: 'Priya Sharma', dept: 'HR', req: 'Office Chair - Executive', qty: '20 Nos', requiredBy: '20 Jun 2026', priority: 'Normal', status: 'In Procurement', date: '28 May 2026, 04:45 PM' },
    { id: 'PR-2026-192', requester: 'Manoj Kumar', dept: 'Production', req: 'CRC Sheet 1.2mm', qty: '5.00 MT', requiredBy: '16 Jun 2026', priority: 'High', status: 'Pending Review', date: '28 May 2026, 02:20 PM' },
    { id: 'PR-2026-193', requester: 'Suresh Patel', dept: 'Maintenance', req: 'Bearing SKF 6204', qty: '30 Nos', requiredBy: '17 Jun 2026', priority: 'Low', status: 'Approved', date: '27 May 2026, 10:10 AM' },
    { id: 'PR-2026-194', requester: 'Karthik R', dept: 'Projects', req: 'MS Channel 75x40', qty: '50.00 MT', requiredBy: '22 Jun 2026', priority: 'High', status: 'In Procurement', date: '27 May 2026, 09:05 AM' },
    { id: 'PR-2026-195', requester: 'Anitha Devi', dept: 'Admin', req: 'Printer - HP LaserJet', qty: '2 Nos', requiredBy: '25 Jun 2026', priority: 'Normal', status: 'Partially Fulfilled', date: '26 May 2026, 03:30 PM' },
    { id: 'PR-2026-196', requester: 'Vijay Kumar', dept: 'Stores', req: 'Welding Electrode 6013', qty: '25.00 KG', requiredBy: '19 Jun 2026', priority: 'Low', status: 'Completed', date: '26 May 2026, 11:45 AM' }
  ]);
  const [prNumber, setPrNumber] = useState('PR-2026-198');
  const [prDate, setPrDate] = useState(new Date().toISOString().split('T')[0]);
  const [prRequestedBy, setPrRequestedBy] = useState('Ravi Kumar');
  const [prDept, setPrDept] = useState('Production');
  const [prRequiredDate, setPrRequiredDate] = useState('');
  const [prPriority, setPrPriority] = useState('Normal');
  const [prProject, setPrProject] = useState('N/A');
  const [prCostCenter, setPrCostCenter] = useState('PROD-1001 - Production');
  const [prPurpose, setPrPurpose] = useState('');

  // Requisition items list state
  const [prItems, setPrItems] = useState([
    { name: 'GI Steel Coil 2mm', desc: '', unit: 'MT', qty: '', date: '', vendor: 'N/A' }
  ]);

  // Additional details state
  const [prBudget, setPrBudget] = useState('');
  const [prBrand, setPrBrand] = useState('');
  const [prNotes, setPrNotes] = useState('');
  const [prUseDefaultTerms, setPrUseDefaultTerms] = useState(true);

  // Approval flow state
  const [prReviewBy, setPrReviewBy] = useState('Department Head');
  const [prApproveBy, setPrApproveBy] = useState('Procurement Head');

  const handleAddItem = () => {
    setPrItems([...prItems, { name: 'GI Steel Coil 2mm', desc: '', unit: 'MT', qty: '1.00', date: '2026-06-15', vendor: 'N/A' }]);
  };

  const handleRemoveItem = (index) => {
    if (prItems.length > 1) {
      setPrItems(prItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...prItems];
    updated[index][field] = value;
    setPrItems(updated);
  };

  const renderSelect = (value, onChange, options, style = {}) => {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: style.width || (style.minWidth ? 'auto' : '100%'), minWidth: style.minWidth || 'auto', flexShrink: 0 }}>
        <select
          value={value}
          onChange={onChange}
          style={{
            width: '100%',
            height: '38px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            padding: '0 12px',
            fontSize: '13px',
            backgroundColor: 'white',
            color: '#334155',
            outline: 'none',
            cursor: 'pointer',
            ...style
          }}
        >
          {options.map((opt, i) => (
            typeof opt === 'object'
              ? <option key={i} value={opt.value}>{opt.label}</option>
              : <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderTableSelect = (value, onChange, options, style = {}) => {
    return renderSelect(value, onChange, options, { height: '36px', borderRadius: '6px', ...style });
  };

  // Filters State
  const [deptFilter, setDeptFilter] = useState('All');
  const [requestedByFilter, setRequestedByFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [activeStatusTab, setActiveStatusTab] = useState('All');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPRs, setSelectedPRs] = useState([]);

  // Vendor Data State
  const [vendorList, setVendorList] = useState([]);
  const [vendorLoading, setVendorLoading] = useState(false);

  const loadVendorsFromZoho = async () => {
    setVendorLoading(true);
    try {
      const zohoVendors = await getSafeZohoVendors();
      if (Array.isArray(zohoVendors) && zohoVendors.length > 0) {
        setVendorList(zohoVendors);
      } else {
        const res = await fetch('/api/zoho/vendors').catch(() => null);
        if (res && res.ok) {
          const vData = await res.json().catch(() => []);
          setVendorList(Array.isArray(vData) ? vData : []);
        }
      }
    } catch (e) {
      console.error("Failed to load Zoho vendors", e);
    } finally {
      setVendorLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Vendor Management') {
      loadVendorsFromZoho();
    }
  }, [activeTab]);

  const [invoicesList, setInvoicesList] = useState([]);
  const [printTaxInvoiceModal, setPrintTaxInvoiceModal] = useState(null);

  useEffect(() => {
    if (activeTab === 'Invoice Management') {
      const fetchZohoInvoices = async () => {
        try {
          const response = await fetch('/api/zoho/invoices');
          if (response.ok) {
            const zohoInvoices = await response.json();
            if (Array.isArray(zohoInvoices)) {
              setInvoicesList(zohoInvoices);
            }
          }
        } catch (err) {
          console.error("Error fetching Zoho Invoices:", err);
        }
      };
      fetchZohoInvoices();

      const pollInterval = setInterval(() => {
        fetchZohoInvoices();
      }, 15000);

      return () => clearInterval(pollInterval);
    }
  }, [activeTab]);

  const [activeVendorActionMenu, setActiveVendorActionMenu] = useState(null);
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState(null);
  const [viewingVendor, setViewingVendor] = useState(null);
  const [vendorModalLoading, setVendorModalLoading] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const handleOpenVendorDetails = async (vendor) => {
    setViewingVendor(vendor);
    setActiveVendorActionMenu(null);
    if (vendor.id || vendor.code) {
      setVendorModalLoading(true);
      try {
        const vendorId = vendor.id || vendor.code;
        const res = await fetch(`/api/zoho/vendors/${vendorId}`);
        if (res.ok) {
          const detail = await res.json();
          setViewingVendor(detail);
        }
      } catch (e) {
        console.error("Failed to load detailed vendor info from Zoho", e);
      } finally {
        setVendorModalLoading(false);
      }
    }
  };

  // Quotations Action States
  const [activeQuotationActionMenu, setActiveQuotationActionMenu] = useState(null);
  const [deleteConfirmQuotation, setDeleteConfirmQuotation] = useState(null);
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [editingQuotation, setEditingQuotation] = useState(null);

  // GRN Action States
  const [activeGrnActionMenu, setActiveGrnActionMenu] = useState(null);
  const [deleteConfirmGrn, setDeleteConfirmGrn] = useState(null);
  const [viewingGrn, setViewingGrn] = useState(null);
  const [editingGrn, setEditingGrn] = useState(null);

  // Invoice Action States
  const [activeInvoiceActionMenu, setActiveInvoiceActionMenu] = useState(null);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Payment Action States
  const [activePaymentActionMenu, setActivePaymentActionMenu] = useState(null);
  const [deleteConfirmPayment, setDeleteConfirmPayment] = useState(null);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  // Proforma Invoice Action States
  const [activeProformaActionMenu, setActiveProformaActionMenu] = useState(null);
  const [deleteConfirmProforma, setDeleteConfirmProforma] = useState(null);
  const [viewingProforma, setViewingProforma] = useState(null);
  const [editingProforma, setEditingProforma] = useState(null);

  // RFP Action States
  const [activeRfpActionMenu, setActiveRfpActionMenu] = useState(null);
  const [deleteConfirmRfp, setDeleteConfirmRfp] = useState(null);
  const [viewingRfp, setViewingRfp] = useState(null);
  const [editingRfp, setEditingRfp] = useState(null);

  // Items Action States
  const [itemsList, setItemsList] = useState(() => getFullProductsCatalogWithStock());
  const [activeItemActionMenu, setActiveItemActionMenu] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSyncingZohoItems, setIsSyncingZohoItems] = useState(false);
  const [itemSaveStatus, setItemSaveStatus] = useState(null);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [createStatus, setCreateStatus] = useState(null);
  const [newItemData, setNewItemData] = useState({
    name: '',
    sku: '',
    rate: '',
    purchaseRate: '',
    unit: 'NOS',
    status: 'Active',
    warehouse: 'Main Warehouse',
    description: '',
    purchaseDescription: '',
    productType: 'goods'
  });
  const [itemsCurrentPage, setItemsCurrentPage] = useState(1);
  const [itemsRowsPerPage, setItemsRowsPerPage] = useState(10);
  const [itemsGoToPageInput, setItemsGoToPageInput] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedItemWarehouse, setSelectedItemWarehouse] = useState('All Warehouses');
  const [selectedItemCategory, setSelectedItemCategory] = useState('All Categories');
  const [selectedItemStatus, setSelectedItemStatus] = useState('All Status');
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchZohoItems = async () => {
      try {
        const zohoItems = await getSafeZohoItems();
        if (isMounted && Array.isArray(zohoItems) && zohoItems.length > 0) {
          setItemsList(getFullProductsCatalogWithStock(zohoItems));
        } else {
          const response = await fetch('/api/zoho/items').catch(() => null);
          if (response && response.ok) {
            const zItems = await response.json().catch(() => []);
            if (isMounted && Array.isArray(zItems) && zItems.length > 0) {
              setItemsList(getFullProductsCatalogWithStock(zItems));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching Zoho Items:", err);
      }
    };
    fetchZohoItems();

    const handleInvUpdate = () => {
      if (isMounted) {
        setItemsList(prev => getFullProductsCatalogWithStock(prev));
      }
    };
    window.addEventListener('central_inventory_updated', handleInvUpdate);
    window.addEventListener('controlroom_storage_update', handleInvUpdate);
    window.addEventListener('storage', handleInvUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('central_inventory_updated', handleInvUpdate);
      window.removeEventListener('controlroom_storage_update', handleInvUpdate);
      window.removeEventListener('storage', handleInvUpdate);
    };
  }, []);

  const handleCreateProductInZoho = async () => {
    if (!newItemData.name || !newItemData.name.trim()) {
      setCreateStatus({ type: 'warning', text: 'Item Name is required.' });
      return;
    }
    try {
      setIsCreatingProduct(true);
      setCreateStatus(null);

      const payload = {
        name: newItemData.name.trim(),
        rate: Number(newItemData.rate) || 0,
        sku: newItemData.sku ? newItemData.sku.trim() : '',
        description: newItemData.description ? newItemData.description.trim() : '',
        unit: newItemData.unit || 'NOS',
        purchaseRate: Number(newItemData.purchaseRate) || 0,
        purchaseDescription: newItemData.purchaseDescription ? newItemData.purchaseDescription.trim() : '',
        productType: newItemData.productType || 'goods',
        status: newItemData.status || 'Active'
      };

      const res = await fetch('/api/zoho/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json().catch(() => ({}));
      const createdItem = result.item || {
        itemId: 'ITEM-' + Date.now(),
        ...payload
      };

      // 1. Immediately update React state
      setItemsList(prev => {
        const filtered = (prev || []).filter(i => (i.itemId || i.id || i.sku) !== (createdItem.itemId || createdItem.sku));
        const updated = [createdItem, ...filtered];
        // 2. Persist directly to Supabase leaves cloud store (ITEM_STORE)
        try {
          saveCloudStore('item_store', updated);
        } catch (e) {}
        return updated;
      });

      setCreateStatus({ type: 'success', text: result.message || 'Product created successfully and added to Zoho Books!' });

      setTimeout(() => {
        setIsCreatingItem(false);
        setCreateStatus(null);
        setNewItemData({
          name: '',
          sku: '',
          rate: '',
          purchaseRate: '',
          unit: 'NOS',
          status: 'Active',
          description: '',
          purchaseDescription: '',
          productType: 'goods'
        });
      }, 1000);
    } catch (err) {
      console.error("Error creating product:", err);
      const fallback = {
        itemId: 'ITEM-' + Date.now(),
        name: newItemData.name,
        rate: Number(newItemData.rate) || 0,
        sku: newItemData.sku || '—',
        unit: newItemData.unit || 'NOS',
        description: newItemData.description || '—',
        status: (newItemData.status && String(newItemData.status).toLowerCase() === 'inactive') ? 'Inactive' : 'Active'
      };
      setItemsList(prev => {
        const filtered = (prev || []).filter(i => (i.itemId || i.id || i.sku) !== (fallback.itemId || fallback.sku));
        const updated = [fallback, ...filtered];
        try {
          saveCloudStore('item_store', updated);
        } catch (e) {}
        return updated;
      });
      setCreateStatus({ type: 'success', text: 'Product created locally in Control Room.' });
      setTimeout(() => {
        setIsCreatingItem(false);
        setCreateStatus(null);
      }, 1000);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleSaveItemToZoho = async () => {
    if (!editingItem) return;
    try {
      setIsSavingItem(true);
      setItemSaveStatus(null);

      const targetStatus = (editingItem.status && String(editingItem.status).toLowerCase() === 'inactive') ? 'Inactive' : 'Active';
      const payload = {
        name: editingItem.name,
        rate: Number(editingItem.rate) || 0,
        sku: editingItem.sku || '',
        description: editingItem.description || '',
        unit: editingItem.unit || 'NOS',
        purchaseRate: Number(editingItem.purchaseRate) || 0,
        purchaseDescription: editingItem.purchaseDescription || '',
        status: targetStatus
      };

      const res = await fetch(`/api/zoho/items/${editingItem.itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setItemSaveStatus({ type: 'success', text: 'Item updated successfully and synced with Zoho Books!' });
      } else {
        setItemSaveStatus({ type: 'warning', text: 'Saved locally in Control Room.' });
      }

      setItemsList(prev => {
        const updated = (prev || []).map(it => (it.itemId === editingItem.itemId || it.id === editingItem.itemId) ? { ...it, ...editingItem, ...payload } : it);
        try {
          saveCloudStore('item_store', updated);
        } catch (e) {}
        return updated;
      });

      setTimeout(() => {
        setEditingItem(null);
        setItemSaveStatus(null);
      }, 900);
    } catch (err) {
      console.error("Error updating item:", err);
      setItemsList(prev => {
        const updated = (prev || []).map(it => (it.itemId === editingItem.itemId || it.id === editingItem.itemId) ? editingItem : it);
        try {
          saveCloudStore('item_store', updated);
        } catch (e) {}
        return updated;
      });
      setItemSaveStatus({ type: 'success', text: 'Item saved locally.' });
      setTimeout(() => {
        setEditingItem(null);
        setItemSaveStatus(null);
      }, 900);
    } finally {
      setIsSavingItem(false);
    }
  };

  const [vName, setVName] = useState('');
  const [vCat, setVCat] = useState('Select category');
  const [vContact, setVContact] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vType, setVType] = useState('Select vendor type');
  const [vCompanyReg, setVCompanyReg] = useState('');
  const [vGST, setVGST] = useState('');
  const [vPAN, setVPAN] = useState('');
  const [vWebsite, setVWebsite] = useState('');
  const [vRegAddress, setVRegAddress] = useState('');
  const [vCity, setVCity] = useState('');
  const [vState, setVState] = useState('Select state');
  const [vCountry, setVCountry] = useState('India');
  const [vPinCode, setVPinCode] = useState('');
  const [vBillingAddress, setVBillingAddress] = useState('');
  const [vBillingCity, setVBillingCity] = useState('');
  const [vBillingState, setVBillingState] = useState('Select state');
  const [vBillingCountry, setVBillingCountry] = useState('India');
  const [vBillingPinCode, setVBillingPinCode] = useState('');
  const [vSameAsRegistered, setVSameAsRegistered] = useState(true);
  const [vDesignation, setVDesignation] = useState('');
  const [vAltPhone, setVAltPhone] = useState('');
  const [vPrefComm, setVPrefComm] = useState('Select option');
  const [vPaymentTerms, setVPaymentTerms] = useState('Select payment terms');
  const [vCurrency, setVCurrency] = useState('INR - Indian Rupee');
  const [vActiveVendor, setVActiveVendor] = useState(true);
  const [vPreferredVendor, setVPreferredVendor] = useState(false);
  const [vBlacklistedVendor, setVBlacklistedVendor] = useState(false);
  const [vTags, setVTags] = useState('');
  const [vInternalNotes, setVInternalNotes] = useState('');
  const [vendorConfirmModal, setVendorConfirmModal] = useState({
    show: false,
    action: null,
    title: '',
    message: '',
    confirmLabel: '',
    confirmBtnColor: '#2563eb'
  });

  const [isGstFetching, setIsGstFetching] = useState(false);
  const [gstLookupStatus, setGstLookupStatus] = useState(null);

  const handleGstFetch = async (valToFetch) => {
    const g = (valToFetch || vGST || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (g.length < 2) return;

    setIsGstFetching(true);
    setGstLookupStatus(null);

    const stateMap = {
      '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
      '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
      '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
      '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
      '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
      '24': 'Gujarat', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa',
      '32': 'Kerala', '33': 'Tamil Nadu', '36': 'Telangana', '37': 'Andhra Pradesh'
    };

    const stateCode = g.substring(0, 2);
    const resolvedState = stateMap[stateCode] || 'Andhra Pradesh';
    setVState(resolvedState);
    setVBillingState(resolvedState);

    if (g.length >= 12) {
      const extractedPan = g.substring(2, 12);
      setVPAN(extractedPan);
    }

    try {
      const res = await fetch(`/api/zoho/gst-lookup?gstin=${g}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.legalName && data.legalName !== '—') setVName(data.legalName);
          if (data.pan) setVPAN(data.pan);
          if (data.state) {
            setVState(data.state);
            setVBillingState(data.state);
          }
          if (data.address) {
            setVRegAddress(data.address);
            setVBillingAddress(data.address);
          }
          if (data.city) {
            setVCity(data.city);
            setVBillingCity(data.city);
          }
          if (data.pincode) {
            setVPinCode(data.pincode);
            setVBillingPinCode(data.pincode);
          }
          if (data.companyReg) setVCompanyReg(data.companyReg);
          if (data.email) setVEmail(data.email);
          if (data.phone) setVPhone(data.phone);

          setGstLookupStatus({ type: 'success', msg: `Verified: Official Details Loaded for ${data.legalName}` });
        }
      }
    } catch (err) {
      console.error('GST Lookup failed', err);
    } finally {
      setIsGstFetching(false);
    }
  };

  // Vendor Filter State
  const [vSearchQuery, setVSearchQuery] = useState('');
  const [vTypeFilter, setVTypeFilter] = useState('All');
  const [vStatusFilter, setVStatusFilter] = useState('All');
  const [vCatFilter, setVCatFilter] = useState('All');
  const [vRatingFilter, setVRatingFilter] = useState('All');
  const [vTermsFilter, setVTermsFilter] = useState('All');
  const [vActiveTab, setVActiveTab] = useState('All Vendors');
  const [vCurrentPage, setVCurrentPage] = useState(1);
  const [vRowsPerPage, setVRowsPerPage] = useState(10);
  const [selectedVendors, setSelectedVendors] = useState([]);

  // Quotation comparison state
  const [selectedRfpQuote, setSelectedRfpQuote] = useState('RFP-2026-101');
  const quotesComparison = {
    'RFP-2026-101': [
      { vendor: 'Tata Steel Ltd.', rate: '₹45,000 / MT', delivery: '5 Days', payment: 'Net 30 Days', ranking: '1st (Recommended)', rankClass: '#15803d', rankBg: '#f0fdf4' },
      { vendor: 'JSW Steel Ltd.', rate: '₹46,500 / MT', delivery: '3 Days', payment: 'Net 15 Days', ranking: '2nd', rankClass: '#475569', rankBg: '#f1f5f9' },
      { vendor: 'Essar Steel Ltd.', rate: '₹45,800 / MT', delivery: '7 Days', payment: 'Net 45 Days', ranking: '3rd', rankClass: '#475569', rankBg: '#f1f5f9' }
    ]
  };

  // Quotations List State
  const [quotationSearchQuery, setQuotationSearchQuery] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('All');
  const [quotationCustomerFilter, setQuotationCustomerFilter] = useState('All');
  const [quotationProjectFilter, setQuotationProjectFilter] = useState('All');
  const [quotationSalesPersonFilter, setQuotationSalesPersonFilter] = useState('All');
  const [quotationActiveTab, setQuotationActiveTab] = useState('All');
  const [quotationCurrentPage, setQuotationCurrentPage] = useState(1);
  const [quotationRowsPerPage, setQuotationRowsPerPage] = useState(10);
  const [selectedQuotations, setSelectedQuotations] = useState([]);

  const INITIAL_QUOTATIONS = [
    { id: 'QT-2024-0126', customer: 'Tata Power Solar Systems Ltd.', project: '50 MW Solar Plant - Rajasthan', date: '29 May 2024', validUntil: '28 Jun 2024', amount: '₹ 18,75,000.00', status: 'Sent', salesPerson: 'Ravi Kumar' },
    { id: 'QT-2024-0125', customer: 'Adani Green Energy Ltd.', project: '100 MW Solar Plant - Gujarat', date: '28 May 2024', validUntil: '27 Jun 2024', amount: '₹ 32,40,000.00', status: 'Viewed', salesPerson: 'Pooja Sharma' },
    { id: 'QT-2024-0124', customer: 'Waaree Energies Ltd.', project: '25 MW Solar Plant - Maharashtra', date: '27 May 2024', validUntil: '26 Jun 2024', amount: '₹ 9,85,000.00', status: 'Accepted', salesPerson: 'Ravi Kumar' },
    { id: 'QT-2024-0123', customer: 'Sterling and Wilson Pvt. Ltd.', project: '75 MW Solar Plant - Karnataka', date: '25 May 2024', validUntil: '24 Jun 2024', amount: '₹ 21,60,000.00', status: 'Draft', salesPerson: 'Amit Verma' },
    { id: 'QT-2024-0122', customer: 'Mahindra Susten Pvt. Ltd.', project: '10 MW Solar Plant - MP', date: '24 May 2024', validUntil: '23 Jun 2024', amount: '₹ 4,30,000.00', status: 'Sent', salesPerson: 'Pooja Sharma' },
    { id: 'QT-2024-0121', customer: 'NTPC Renewable Energy Ltd.', project: '200 MW Solar Plant - AP', date: '23 May 2024', validUntil: '22 Jun 2024', amount: '₹ 58,20,000.00', status: 'Viewed', salesPerson: 'Ravi Kumar' },
    { id: 'QT-2024-0120', customer: 'Hero Future Energies Pvt. Ltd.', project: '5 MW Rooftop Project', date: '22 May 2024', validUntil: '21 Jun 2024', amount: '₹ 2,15,000.00', status: 'Expired', salesPerson: 'Amit Verma' },
    { id: 'QT-2024-0119', customer: 'ReNew Power Pvt. Ltd.', project: '150 MW Solar Plant - Tamil Nadu', date: '21 May 2024', validUntil: '20 Jun 2024', amount: '₹ 41,75,000.00', status: 'Accepted', salesPerson: 'Pooja Sharma' },
    { id: 'QT-2024-0118', customer: 'Jakson Engineers Ltd.', project: '33 MW Solar Plant - Odisha', date: '20 May 2024', validUntil: '19 Jun 2024', amount: '₹ 11,90,000.00', status: 'Rejected', salesPerson: 'Ravi Kumar' },
    { id: 'QT-2024-0117', customer: 'Larsen & Toubro Ltd.', project: '80 MW Solar Plant - Gujarat', date: '19 May 2024', validUntil: '18 Jun 2024', amount: '₹ 27,50,000.00', status: 'Sent', salesPerson: 'Amit Verma' }
  ];

  const [quotationsList, setQuotationsList] = useState(() => {
    try {
      const saved = localStorage.getItem('controlroom_quotations_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return INITIAL_QUOTATIONS;
  });

  useEffect(() => {
    saveCloudStore('quotations_store', quotationsList);
  }, [quotationsList]);

  useEffect(() => {
    fetchCloudStore('quotations_store', quotationsList).then(data => {
      if (data && Array.isArray(data) && data.length > 0) setQuotationsList(data);
    });
    const sub = subscribeToCloudStore('quotations_store', (latest) => {
      if (latest && Array.isArray(latest)) setQuotationsList(latest);
    });
    return () => {
      if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
    };
  }, []);

  // GRN State
  const [grnList, setGrnList] = useState([]);
  const [grnPo, setGrnPo] = useState('');
  const [grnVendor, setGrnVendor] = useState('');
  const [grnQty, setGrnQty] = useState('');
  const [grnTab, setGrnTab] = useState('All');
  const [invoiceTab, setInvoiceTab] = useState('All');
  const [paymentTab, setPaymentTab] = useState('All');
  const [stockTab, setStockTab] = useState('All');

  const [grnSearchQuery, setGrnSearchQuery] = useState('');
  const [grnStatusFilter, setGrnStatusFilter] = useState('All');
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [invStatusFilter, setInvStatusFilter] = useState('All');
  const [paySearchQuery, setPaySearchQuery] = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState('All');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockLocationFilter, setStockLocationFilter] = useState('All');

  // Invoice State
  const [viewingInvoiceModal, setViewingInvoiceModal] = useState(null);
  const [invoiceModalActiveTab, setInvoiceModalActiveTab] = useState('Invoice Items');
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [invoiceEditForm, setInvoiceEditForm] = useState({
    invNo: '',
    date: '',
    vendor: '',
    billingAddress: '',
    deliveryAddress: '',
    paymentType: '',
    items: []
  });
  const [closeInvoiceReasonModal, setCloseInvoiceReasonModal] = useState(null);
  const [closeReasonText, setCloseReasonText] = useState('');
  const [pendingDcModal, setPendingDcModal] = useState(null);
  const [confirmInvoiceSuccessModal, setConfirmInvoiceSuccessModal] = useState(null);
  const [invoiceList, setInvoiceList] = useState([]);

  // Sync invoiceList with Supabase cloud database
  useEffect(() => {
    saveCloudStore('invoice_store', invoiceList);
  }, [invoiceList]);

  // Initial cloud fetch for invoices
  useEffect(() => {
    fetchCloudStore('invoice_store', []).then(data => {
      if (data && Array.isArray(data)) setInvoiceList(data);
    });
    const sub = subscribeToCloudStore('invoice_store', (latest) => {
      if (latest && Array.isArray(latest)) setInvoiceList(latest);
    });
    return () => {
      if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
    };
  }, []);

  // Payments State
  const INITIAL_PAYMENTS = [
    { id: 'PAY-48901', vendor: 'Tata Steel Ltd.', amount: '₹12,74,908.00', mode: 'RTGS', ref: 'RTGS-N887410B', date: '31 Jul 2026', status: 'Completed' },
    { id: 'PAY-48902', vendor: 'UltraTech Cement', amount: '₹9,00,000.00', mode: 'NEFT', ref: 'NEFT-T5420108', date: '28 Jul 2026', status: 'Scheduled' }
  ];

  const [paymentList, setPaymentList] = useState(() => {
    try {
      const saved = localStorage.getItem('controlroom_payment_store');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return INITIAL_PAYMENTS;
  });

  useEffect(() => {
    saveCloudStore('payment_store', paymentList);
  }, [paymentList]);

  // Vendor Performance scorecard
  const vendorPerformance = [
    { name: 'Tata Steel Ltd.', cat: 'Raw Material', ot: '98%', quality: '99.5%', lead: '4.2 Days', rating: 'A+' },
    { name: 'Havells India Ltd.', cat: 'Electrical', ot: '95%', quality: '98%', lead: '5.0 Days', rating: 'A' },
    { name: 'UltraTech Cement', cat: 'Construction', ot: '91%', quality: '96%', lead: '6.5 Days', rating: 'B+' },
    { name: 'Nellore Logistics', cat: 'Logistics', ot: '85%', quality: '92%', lead: '2.5 Days', rating: 'B' }
  ];

  // Spend analytics summary cards
  const spendCategories = [
    { cat: 'Raw Materials', value: '₹45,50,000.00', count: 18, color: '#3b82f6' },
    { cat: 'Electrical Goods', value: '₹12,20,000.00', count: 6, color: '#10b981' },
    { cat: 'Logistics / Transport', value: '₹4,50,000.00', count: 12, color: '#f59e0b' },
    { cat: 'Consumables & Fasteners', value: '₹2,10,000.00', count: 4, color: '#6366f1' }
  ];

  // Low Stock / Reorder Alerts
  const INITIAL_REORDER_ALERTS = [
    { id: 1, name: 'Aluminium Rail 4.2m', sku: 'AL-RAIL-4.2', category: 'Rails', warehouse: 'Main Warehouse', stock: '120', percent: '12%', minLevel: '500', uom: 'Nos', leadTime: '7 Days', reorderQty: '880', val: '8,80,000', status: 'Critical', coverage: '2 Days', level: 12 },
    { id: 2, name: 'Mid Clamp', sku: 'MC-01', category: 'Clamps', warehouse: 'Main Warehouse', stock: '926', percent: '17%', minLevel: '1,500', uom: 'Nos', leadTime: '5 Days', reorderQty: '1,250', val: '3,12,500', status: 'Critical', coverage: '3 Days', level: 17 },
    { id: 3, name: 'End Clamp', sku: 'EC-01', category: 'Clamps', warehouse: 'Regional Warehouse', stock: '300', percent: '20%', minLevel: '1,500', uom: 'Nos', leadTime: '5 Days', reorderQty: '1,200', val: '2,40,000', status: 'Critical', coverage: '3 Days', level: 20 },
    { id: 4, name: 'GI Nut Bolt M8x25', sku: 'NB-M8-25', category: 'Fasteners', warehouse: 'Main Warehouse', stock: '2,450', percent: '25%', minLevel: '10,000', uom: 'Nos', leadTime: '4 Days', reorderQty: '7,550', val: '1,51,000', status: 'Low Stock', coverage: '4 Days', level: 25 },
    { id: 5, name: 'GI Nut Bolt M10x30', sku: 'NB-M10-30', category: 'Fasteners', warehouse: 'Regional Warehouse', stock: '1,800', percent: '30%', minLevel: '6,000', uom: 'Nos', leadTime: '4 Days', reorderQty: '4,200', val: '1,68,000', status: 'Low Stock', coverage: '4 Days', level: 30 },
    { id: 6, name: 'Spring Washer M8', sku: 'SW-M8', category: 'Fasteners', warehouse: 'Main Warehouse', stock: '950', percent: '32%', minLevel: '3,000', uom: 'Nos', leadTime: '3 Days', reorderQty: '2,050', val: '41,000', status: 'Low Stock', coverage: '5 Days', level: 32 },
    { id: 7, name: 'L-Foot', sku: 'LF-01', category: 'Accessories', warehouse: 'Main Warehouse', stock: '160', percent: '33%', minLevel: '480', uom: 'Nos', leadTime: '7 Days', reorderQty: '320', val: '64,000', status: 'Low Stock', coverage: '6 Days', level: 33 },
    { id: 8, name: 'Cable Clip', sku: 'CC-01', category: 'Accessories', warehouse: 'Regional Warehouse', stock: '3,200', percent: '35%', minLevel: '9,000', uom: 'Nos', leadTime: '3 Days', reorderQty: '5,800', val: '58,000', status: 'Low Stock', coverage: '6 Days', level: 35 },
    { id: 9, name: 'Earthing Lug', sku: 'EL-01', category: 'Electrical', warehouse: 'Main Warehouse', stock: '220', percent: '37%', minLevel: '600', uom: 'Nos', leadTime: '6 Days', reorderQty: '380', val: '45,600', status: 'Low Stock', coverage: '7 Days', level: 37 },
    { id: 10, name: 'UV Cable Tie 300mm', sku: 'CT-300', category: 'Accessories', warehouse: 'Regional Warehouse', stock: '1,400', percent: '38%', minLevel: '3,600', uom: 'Nos', leadTime: '3 Days', reorderQty: '2,200', val: '26,400', status: 'Low Stock', coverage: '8 Days', level: 38 }
  ];

  const [reorderAlerts, setReorderAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('controlroom_reorder_alerts_store');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading reorderAlerts', e);
    }
    return INITIAL_REORDER_ALERTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('controlroom_reorder_alerts_store', JSON.stringify(reorderAlerts));
    } catch (e) {
      console.error('Error saving reorderAlerts', e);
    }
  }, [reorderAlerts]);
  const [reorderPage, setReorderPage] = useState(1);
  const [reorderRowsPerPage, setReorderRowsPerPage] = useState(10);
  const [selectedReorders, setSelectedReorders] = useState([]);

  const [editingReorderItem, setEditingReorderItem] = useState(null);
  const [reorder3DotMenuId, setReorder3DotMenuId] = useState(null);

  const currentReorderRows = useMemo(() => {
    return reorderAlerts.slice(
      (reorderPage - 1) * reorderRowsPerPage,
      reorderPage * reorderRowsPerPage
    );
  }, [reorderAlerts, reorderPage, reorderRowsPerPage]);

  const handleCreatePoFromReorder = (selectedIds) => {
    const selectedItems = reorderAlerts.filter(r => selectedIds.includes(r.id));
    if (selectedItems.length === 0) return;
    const poItemsPayload = selectedItems.map(item => ({
      name: item.name,
      account: 'Raw Material',
      qty: parseFloat(String(item.reorderQty || '1').replace(/,/g, '')) || 1,
      unit: item.uom || 'NOS',
      rate: Math.round((parseFloat(String(item.val || '0').replace(/,/g, '')) || 0) / (parseFloat(String(item.reorderQty || '1').replace(/,/g, '')) || 1)) || 1000,
      tax: 18
    }));
    try {
      localStorage.setItem('controlroom_pending_reorder_po', JSON.stringify({
        items: poItemsPayload,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Failed to store pending reorder PO payload', e);
    }
    if (typeof onChangeTab === 'function') {
      onChangeTab('Purchase Orders');
    }
  };

  // Stock status registry
  const INITIAL_STOCK_REGISTRY = [
    { code: 'AL-001', item: 'Aluminium Rail 4.2m', category: 'Rails', location: 'Main Warehouse', stock: '120', allocated: '30', incoming: '500', minLevel: '500', val: '8,80,000', status: 'Low Stock' },
    { code: 'MC-001', item: 'Mid Clamp', category: 'Clamps', location: 'Main Warehouse', stock: '926', allocated: '100', incoming: '1,000', minLevel: '1,500', val: '3,12,500', status: 'Low Stock' },
    { code: 'EC-001', item: 'End Clamp', category: 'Clamps', location: 'Regional Warehouse', stock: '2,400', allocated: '200', incoming: '-', minLevel: '1,000', val: '2,40,000', status: 'In Stock' },
    { code: 'NB-025', item: 'GI Nut Bolt M8 x 25', category: 'Fasteners', location: 'Main Warehouse', stock: '0', allocated: '0', incoming: '500', minLevel: '500', val: '1,51,000', status: 'Out of Stock' },
    { code: 'NB-030', item: 'GI Nut Bolt M10 x 30', category: 'Fasteners', location: 'Regional Warehouse', stock: '1,800', allocated: '150', incoming: '-', minLevel: '2,000', val: '1,68,000', status: 'Low Stock' },
    { code: 'WS-008', item: 'Spring Washer M8', category: 'Fasteners', location: 'Main Warehouse', stock: '950', allocated: '50', incoming: '-', minLevel: '500', val: '41,000', status: 'In Stock' },
    { code: 'LF-001', item: 'L-Foot', category: 'Accessories', location: 'Main Warehouse', stock: '160', allocated: '20', incoming: '-', minLevel: '200', val: '64,000', status: 'Low Stock' },
    { code: 'CC-001', item: 'Cable Clip', category: 'Accessories', location: 'Regional Warehouse', stock: '3,200', allocated: '100', incoming: '-', minLevel: '1,000', val: '58,000', status: 'In Stock' }
  ];

  const [stockRegistry, setStockRegistry] = useState(() => {
    try {
      const saved = localStorage.getItem('controlroom_stock_registry_store');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading stockRegistry', e);
    }
    return INITIAL_STOCK_REGISTRY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('controlroom_stock_registry_store', JSON.stringify(stockRegistry));
    } catch (e) {
      console.error('Error saving stockRegistry', e);
    }
  }, [stockRegistry]);

  // Price comparison ledger
  const priceComparison = [
    { item: 'GI Steel Coil (MT)', lastPoPrice: '₹45,000.00', avgMarketPrice: '₹45,800.00', bestQuotePrice: '₹44,500.00', bestVendor: 'Tata Steel Ltd.' },
    { item: 'CRC Sheet (MT)', lastPoPrice: '₹52,000.00', avgMarketPrice: '₹53,200.00', bestQuotePrice: '₹51,800.00', bestVendor: 'JSW Steel Ltd.' },
    { item: 'Cement Bag (50kg)', lastPoPrice: '₹410.00', avgMarketPrice: '₹415.00', bestQuotePrice: '₹405.00', bestVendor: 'UltraTech Cement' }
  ];

  // Form Submission Handlers
  const handleCreateRFP = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (prItems.length === 0) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      `, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const firstItem = prItems[0];
    const itemSummary = prItems.length > 1
      ? `${firstItem.name} (+ ${prItems.length - 1} items)`
      : firstItem.name;
    const qtySummary = `${firstItem.qty} ${firstItem.unit}`;

    const newRFP = {
      id: prNumber || `PR-2026-${198 + rfpList.length}`,
      requester: prRequestedBy,
      dept: prDept,
      req: itemSummary,
      qty: qtySummary,
      requiredBy: prRequiredDate ? new Date(prRequiredDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Jun 2026',
      priority: prPriority,
      status: 'Pending Approval',
      date: formattedDate
    };
    setRfpList([newRFP, ...rfpList]);

    // Auto-increment PR number
    try {
      const parts = prNumber.split('-');
      const nextNum = parseInt(parts[2]) + 1;
      setPrNumber(`${parts[0]}-${parts[1]}-${nextNum}`);
    } catch (err) {
      setPrNumber(`PR-2026-${198 + rfpList.length + 1}`);
    }

    // Reset form to fresh default
    setPrPurpose('');
    setPrBudget('');
    setPrBrand('');
    setPrNotes('');
    setPrRequiredDate('');
    setPrPriority('Normal');
    setPrProject('N/A');
    setPrItems([
      { name: 'GI Steel Coil 2mm', desc: '', unit: 'MT', qty: '', date: '', vendor: 'N/A' }
    ]);
    setShowForm(false);
  };

  const handleCreateVendor = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!vName) return;

    let vStatus = 'Active';
    if (vBlacklistedVendor) vStatus = 'Blacklisted';
    else if (!vActiveVendor) vStatus = 'Inactive';
    else if (vPreferredVendor) vStatus = 'Preferred';

    const newVendorPayload = {
      name: vName,
      companyName: vName,
      type: vType === 'Select vendor type' ? 'Supplier' : vType,
      contact: vContact || '',
      phone: vPhone || '',
      email: vEmail || '',
      cat: vCat === 'Select category' ? 'Steel & Metals' : vCat,
      status: vStatus,
      rating: 5.0,
      spend: '₹ 0.00',
      terms: vPaymentTerms === 'Select payment terms' ? 'Net 30 Days' : vPaymentTerms,
      gstin: vGST || '',
      pan: vPAN || ''
    };

    // Push new vendor to Zoho Books API & refresh live list so official Zoho Contact ID is assigned as Vendor Code
    fetch('/api/zoho/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVendorPayload)
    }).then(res => res.json()).then(data => {
      if (data.success) {
        console.log('Vendor created in Zoho Books successfully!', data);
      } else {
        console.warn('Zoho Vendor creation notice:', data);
      }
      loadVendorsFromZoho();
    }).catch(err => {
      console.error('Failed to sync vendor to Zoho:', err);
      loadVendorsFromZoho();
    });

    // Reset states
    setVName('');
    setVContact('');
    setVEmail('');
    setVPhone('');
    setVType('Select vendor type');
    setVCat('Select category');
    setVCompanyReg('');
    setVGST('');
    setVPAN('');
    setVWebsite('');
    setVRegAddress('');
    setVCity('');
    setVState('Select state');
    setVPinCode('');
    setVBillingAddress('');
    setVBillingCity('');
    setVBillingState('Select state');
    setVBillingPinCode('');
    setVSameAsRegistered(true);
    setVDesignation('');
    setVAltPhone('');
    setVPrefComm('Select option');
    setVPaymentTerms('Select payment terms');
    setVCurrency('INR - Indian Rupee');
    setVActiveVendor(true);
    setVPreferredVendor(false);
    setVBlacklistedVendor(false);
    setVTags('');
    setVInternalNotes('');
    setShowForm(false);
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {(![
        'Goods Receipt Note', 'Goods Receipt Note (GRN)', 'Vendor Management', 'Vendor Performance', 'Material Reorder',
        'Stock Status', 'Price Comparison', 'Items Directory', 'Payments',
        'Spend Analytics', 'Procurement Reports', 'Spend Reports', 'Supplier Reports',
        'Procurement Settings', 'Approval Workflows', 'Dispatch Dashboard'
      ].includes(activeTab) || ['Work Orders', 'Planning & Scheduling', 'Production Monitoring',
        'Quality Control', 'Machine Maintenance', 'Inventory', 'BOM / Routing', 'BOM', 'Customer Management',
        'Production Reports', 'Efficiency Reports', 'Downtime Analytics',
        'Add Work Order', 'Record Production', 'Report Downtime', 'Dispatch Orders', 'Accounts Verification', 'Invoice Management'
      ].includes(activeTab)) && activeTab !== 'Dispatch Dashboard' && (() => {
        try {
          // If viewing an individual Invoice in full screen
          if (activeTab === 'Invoice Management' && viewingInvoiceModal) {
            return (
              <InvoiceDetailModal
                viewingInvoiceModal={viewingInvoiceModal}
                setViewingInvoiceModal={setViewingInvoiceModal}
                isEditingInvoice={isEditingInvoice}
                setIsEditingInvoice={setIsEditingInvoice}
                invoiceEditForm={invoiceEditForm}
                setInvoiceEditForm={setInvoiceEditForm}
                invoiceModalActiveTab={invoiceModalActiveTab}
                setInvoiceModalActiveTab={setInvoiceModalActiveTab}
                bomStore={bomStore}
                setBomStore={setBomStore}
                invoices={invoices}
                setInvoices={setInvoices}
                setPreviewDocModal={setPreviewDocModal}
              />
            );
          }

          // Dynamically compute unified invoices list ensuring ONLY Accounts-Verified BOMs show up in Invoice Management
          const verifiedBomInvoices = (bomStore || [])
            .filter(b => b && (b.bomCode || b.code) && (
              b.accountsVerification?.verified === true ||
              b.status === 'Accounts Verified & Passed to Invoice' ||
              b.status === 'Invoice Confirmed' ||
              b.status === 'Ready for Payment' ||
              b.invoiceConfirmed === true
            ))
            .map(b => {
              const bCode = b.bomCode || b.code || 'BOM-2026';
              const cleanNum = bCode.replace(/[^0-9]/g, '') || '101';
              const invNo = b.invoiceNo || `INV-2026-${cleanNum}`;
              const oVal = parseFloat(b.grandTotal || 0);
              const isConf = b.status === 'Invoice Confirmed' || b.status === 'Completed' || b.invoiceConfirmed;
              const statusVal = isConf ? 'Invoice Confirmed' : (b.status === 'Accounts Verified & Passed to Invoice' ? 'Accounts Verified & Passed to Invoice' : 'Ready for Payment');

              const packedItems = (b.dispatchPacking && Array.isArray(b.dispatchPacking) && b.dispatchPacking.length > 0)
                ? b.dispatchPacking.map((p, pIdx) => ({
                  code: p.code || `PRD-00${pIdx + 1}`,
                  name: p.name || `Item ${pIdx + 1}`,
                  qty: p.bomQty || p.qty || 1,
                  bomQty: p.bomQty || p.qty || 1,
                  invQty: p.bomQty || p.qty || 1,
                  rate: p.rate || 1000,
                  selected: Boolean(p.packed),
                  packed: Boolean(p.packed)
                }))
                : (b.items || []).map(it => ({ ...it, selected: true, packed: true }));

              return {
                invNo: invNo,
                code: invNo,
                date: b.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                vendor: b.customerName || b.companyName || b.customer || 'Customer',
                customerName: b.customerName || b.companyName || b.customer || 'Customer',
                poNo: bCode,
                bomCode: bCode,
                grnNo: 'GRN-VERIFIED',
                invAmt: `₹ ${oVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                poVal: `₹ ${oVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                grnVal: `₹ ${oVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                diff: '0.00', match: 'Matched',
                pay: isConf ? 'Completed & Locked' : 'Ready for Payment',
                status: statusVal,
                items: packedItems,
                dispatchPacking: b.dispatchPacking,
                billingAddress: b.billingAddress,
                billingAddressObj: b.billingAddressObj,
                deliveryAddress: b.deliveryAddress,
                deliveryAddressObj: b.deliveryAddressObj,
                deliveryAddressProofDoc: b.deliveryAddressProofDoc || null,
                sameAsBilling: b.sameAsBilling,
                accountsVerification: b.accountsVerification,
                proofDoc: b.proofDoc || b.payments?.proofDoc || b.paymentProofDoc?.name || 'Payment_Proof_Receipt.pdf',
                proofDocData: b.proofDocData || b.payments?.proofDocData || b.paymentProofDoc?.dataUrl || null,
                paymentProofDoc: b.paymentProofDoc || null
              };
            });

          const mergedInvoices = (invoiceList || []).filter(inv => {
            const matchingBom = (bomStore || []).find(b =>
              b.bomCode === inv.poNo ||
              b.code === inv.poNo ||
              b.bomCode === inv.code ||
              b.bomCode === inv.invNo ||
              (b.salesOrderNo && (b.salesOrderNo === inv.poNo || b.salesOrderNo === inv.c3))
            );
            if (matchingBom) {
              return matchingBom.accountsVerification?.verified === true ||
                matchingBom.status === 'Accounts Verified & Passed to Invoice' ||
                matchingBom.status === 'Invoice Confirmed' ||
                matchingBom.status === 'Ready for Payment' ||
                matchingBom.invoiceConfirmed === true;
            }
            // Standalone or pre-existing invoices stay visible
            return true;
          }).map(inv => {
            const matchingBom = (bomStore || []).find(b =>
              b.bomCode === inv.poNo ||
              b.code === inv.poNo ||
              b.bomCode === inv.code ||
              b.bomCode === inv.invNo ||
              (b.salesOrderNo && (b.salesOrderNo === inv.poNo || b.salesOrderNo === inv.c3))
            );
            if (matchingBom) {
              const isConf = matchingBom.status === 'Invoice Confirmed' || matchingBom.status === 'Completed' || matchingBom.invoiceConfirmed || inv.status === 'Invoice Confirmed';
              return {
                ...inv,
                vendor: inv.vendor || matchingBom.customerName || 'Customer',
                customerName: matchingBom.customerName || inv.vendor || 'Customer',
                billingAddress: inv.billingAddress || matchingBom.billingAddress,
                deliveryAddress: inv.deliveryAddress || matchingBom.deliveryAddress,
                deliveryAddressProofDoc: inv.deliveryAddressProofDoc || matchingBom.deliveryAddressProofDoc,
                accountsVerification: matchingBom.accountsVerification || inv.accountsVerification,
                status: isConf ? 'Invoice Confirmed' : (inv.status || 'Ready for Payment'),
                pay: isConf ? 'Completed & Locked' : (inv.pay || 'Ready for Payment'),
                items: (inv.items && inv.items.length > 0) ? inv.items : (matchingBom.dispatchPacking || matchingBom.items || [])
              };
            }
            return inv;
          });

          const missingVerified = verifiedBomInvoices.filter(v => {
            const vPo = (v.poNo || '').toLowerCase();
            const vInv = (v.invNo || '').toLowerCase();
            return !mergedInvoices.some(m =>
              (m.poNo && m.poNo.toLowerCase() === vPo) ||
              (m.bomCode && m.bomCode.toLowerCase() === vPo) ||
              (m.invNo && m.invNo.toLowerCase() === vInv) ||
              (m.code && m.code.toLowerCase() === vInv)
            );
          });

          const allInvoicesUnified = [...missingVerified, ...mergedInvoices].sort((a, b) => {
            const numA = parseInt((a.poNo || a.bomCode || a.invNo || '').replace(/[^0-9]/g, ''), 10) || 0;
            const numB = parseInt((b.poNo || b.bomCode || b.invNo || '').replace(/[^0-9]/g, ''), 10) || 0;
            return numB - numA;
          });

          // Domain-specific Page Configs for all Production Admin views using the Purchase Orders 5-part layout template
          const configs = {
            'Invoice Management': {
              title: 'Invoice Ledger & 3-Way Matching',
              subtitle: 'Verified Invoices, 3-Way Matching against BOM/PO/GRN, and payment ledger tracking',
              actionText: '',
              searchPlaceholder: 'Search Invoices (Invoice No, Customer / Vendor, BOM Ref)...',
              tabs: [
                { id: 'All', label: 'All Invoices', count: allInvoicesUnified.length, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Ready for Payment', label: 'Ready for Payment', count: allInvoicesUnified.filter(i => i.status === 'Ready for Payment' || i.status === 'Accounts Verified & Passed to Invoice' || i.pay === 'Ready' || i.pay === 'Ready for Payment').length, bg: '#dcfce7', fg: '#166534' },
                { id: 'Invoice Confirmed', label: 'Confirmed', count: allInvoicesUnified.filter(i => i.status === 'Invoice Confirmed' || i.pay === 'Completed & Locked').length, bg: '#dcfce7', fg: '#166534' },
                { id: 'On Hold', label: 'On Hold', count: allInvoicesUnified.filter(i => i.status === 'On Hold' || i.pay === 'Hold').length, bg: '#fee2e2', fg: '#991b1b' }
              ],
              headers: ['Invoice No.', 'Customer / Vendor', 'BOM Ref', 'Invoice Date', 'Invoice Amount (₹)', 'Payment Status', 'Status', 'Action'],
              rows: allInvoicesUnified.map(i => {
                const isConfirmed = i.status === 'Invoice Confirmed' || i.status === 'Completed' || i.status === 'Confirmed' || i.pay === 'Completed & Locked';
                const isReady = i.status === 'Ready for Payment' || i.status === 'Accounts Verified & Passed to Invoice' || i.pay === 'Ready' || i.pay === 'Ready for Payment';

                return {
                  ...i,
                  code: i.invNo,
                  c2: i.vendor || i.customerName || 'Customer',
                  c3: i.poNo || i.bomCode || 'BOM-001',
                  c4: i.date,
                  c5: typeof i.invAmt === 'number' ? `₹ ${i.invAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : i.invAmt,
                  c6: i.pay || 'Ready for Payment',
                  status: i.status || 'Ready for Payment',
                  stBg: isConfirmed ? '#DCFCE7' : (isReady ? '#EFF6FF' : '#FEF3C7'),
                  stFg: isConfirmed ? '#166534' : (isReady ? '#2563EB' : '#B45309'),
                  stBorder: isConfirmed ? '1px solid #86EFAC' : (isReady ? '1px solid #BFDBFE' : '1px solid #FDE68A'),
                  tabGroup: isConfirmed ? 'Invoice Confirmed' : (isReady ? 'Ready for Payment' : 'On Hold')
                };
              })
            },
            'Accounts Verification': {
              title: 'Accounts Verification & Document Control',
              subtitle: 'Verify customer payment details (Payment Date, Total Amount, Payment Status) and Hard Copy BOM receipt',
              actionText: '',
              searchPlaceholder: 'Search Accounts Verification (BOM Code, Customer Name)...',
              tabs: [
                { id: 'All', label: 'All Accounts Orders', count: (bomStore || []).filter(b => (b.status === 'Packed & Ready for Dispatch' || b.status === 'Packed & Awaiting Dispatch Payment' || (b.dispatchPacking && b.dispatchPacking.length > 0 && b.dispatchPacking.every(p => p.packed))) || b.status === 'Accounts Verified & Passed to Invoice' || b.accountsVerification?.verified).length, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Pending', label: 'Pending Verification', count: (bomStore || []).filter(b => (b.status === 'Packed & Ready for Dispatch' || b.status === 'Packed & Awaiting Dispatch Payment' || (b.dispatchPacking && b.dispatchPacking.length > 0 && b.dispatchPacking.every(p => p.packed))) && !(b.accountsVerification?.verified || b.status === 'Accounts Verified & Passed to Invoice')).length, bg: '#FEF3C7', fg: '#B45309' },
                { id: 'Verified', label: 'Verified', count: (bomStore || []).filter(b => (b.accountsVerification?.verified || b.status === 'Accounts Verified & Passed to Invoice')).length, bg: '#DCFCE7', fg: '#166534' }
              ],
              headers: ['BOM Code', 'Customer Name', 'Payment Type', 'Payment Date', 'Total Amount', 'Payment Status', 'Status'],
              rows: (bomStore || []).filter(b => (b.status === 'Packed & Ready for Dispatch' || b.status === 'Packed & Awaiting Dispatch Payment' || (b.dispatchPacking && b.dispatchPacking.length > 0 && b.dispatchPacking.every(p => p.packed))) || b.status === 'Accounts Verified & Passed to Invoice' || b.accountsVerification?.verified).map(b => {
                const acc = b.accountsVerification || {};
                const isVerified = Boolean(
                  acc.verified ||
                  b.status === 'Accounts Verified & Passed to Invoice' ||
                  (acc.paymentDate && acc.totalAmount && (acc.paymentStatus || b.paymentType === 'Net 30 Days'))
                );
                const payStatus = acc.paymentStatus || (b.paymentType === 'Net 30 Days' ? 'Credit Payment' : isVerified ? '100% Received' : 'Pending Confirmation');
                
                // Format Payment Date (should NOT be prefilled from createdAt/today if accounts haven't entered it)
                const rawDate = acc.paymentDate || (isVerified ? (b.paymentDate || b.payments?.paymentDate || b.payments?.date) : null);
                let paymentDateFormatted = '—';
                if (rawDate) {
                  try {
                    const d = new Date(rawDate);
                    if (!isNaN(d.getTime())) {
                      paymentDateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    } else {
                      paymentDateFormatted = rawDate;
                    }
                  } catch (e) {
                    paymentDateFormatted = rawDate;
                  }
                }

                // Format Total Amount (should NOT be prefilled if accounts haven't verified/entered it)
                let totalAmtFormatted = '—';
                if (acc.totalAmount !== undefined && acc.totalAmount !== null && acc.totalAmount !== '') {
                  const val = parseFloat(acc.totalAmount) || 0;
                  totalAmtFormatted = `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                } else if (isVerified && b.grandTotal) {
                  const val = parseFloat(b.grandTotal) || 0;
                  totalAmtFormatted = `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                }

                const statusText = isVerified ? 'ACCOUNTS VERIFIED' : 'PENDING VERIFICATION';
                const stBg = isVerified ? '#DCFCE7' : '#FEF3C7';
                const stFg = isVerified ? '#166534' : '#B45309';
                const stBorder = isVerified ? '1px solid #BBF7D0' : '1px solid #FDE68A';
                const tabGroup = isVerified ? 'Verified' : 'Pending';

                return {
                  ...b,
                  code: b.bomCode,
                  c2: b.customerName,
                  c3: b.paymentType,
                  c4: paymentDateFormatted,
                  c5: totalAmtFormatted,
                  c6: payStatus,
                  status: statusText,
                  stBg: stBg,
                  stFg: stFg,
                  stBorder: stBorder,
                  isAccountsDone: isVerified,
                  tabGroup: tabGroup
                };
              })
            },
            'Dispatch Orders': {
              title: 'Dispatch & Packing Fulfillment Center',
              subtitle: 'Verify goods packing, track dispatch progress, and release shipments for approved Sales BOM orders',
              actionText: '',
              searchPlaceholder: 'Filter Dispatch Orders (BOM Code, Customer Name, Logistics)...',
              tabs: [
                { id: 'All', label: 'All Orders', count: (bomStore || []).filter(b => b && (b.status ? b.status !== 'Draft' : true)).length, bg: '#F1F5F9', fg: '#334155' },
                { id: 'PendingPacking', label: 'Pending Packing', count: (bomStore || []).filter(b => b && (b.status ? b.status !== 'Draft' : true) && !['Closed', 'CLOSED', 'Packed & Ready for Dispatch', 'Partially Packed', 'Awaiting Vehicle Loading & Dispatch', 'Completed', 'Fully Dispatched & Delivered', 'Cancelled', 'Cancelled & Stock Restored'].includes(b.status) && !b.cancelled && !b.invoiceConfirmed).length, bg: '#FFEDD5', fg: '#C2410C' },
                { id: 'PartiallyPacked', label: 'Partially Packed', count: (bomStore || []).filter(b => (b.status === 'Partially Packed' || (b.dispatchPacking && b.dispatchPacking.some(p => p.packed) && !b.dispatchPacking.every(p => p.packed))) && !['Closed', 'CLOSED', 'Cancelled', 'Cancelled & Stock Restored'].includes(b.status) && !b.cancelled).length, bg: '#FEF3C7', fg: '#B45309' },
                { id: 'Packed', label: 'Packing Verified', count: (bomStore || []).filter(b => (b.status === 'Packed & Ready for Dispatch' || b.status === 'Dispatch Packing Verified - Sent to Accounts' || (b.dispatchPacking && b.dispatchPacking.length > 0 && b.dispatchPacking.every(p => p.packed))) && !['Closed', 'CLOSED', 'Awaiting Vehicle Loading & Dispatch', 'Cancelled', 'Cancelled & Stock Restored'].includes(b.status) && !b.cancelled && !b.invoiceConfirmed).length, bg: '#DCFCE7', fg: '#166534' },
                { id: 'AwaitingLoading', label: 'Awaiting Vehicle Loading', count: (bomStore || []).filter(b => (b.status === 'Awaiting Vehicle Loading & Dispatch' || b.invoiceConfirmed) && !['Closed', 'CLOSED', 'Completed', 'Fully Dispatched & Delivered', 'Cancelled', 'Cancelled & Stock Restored'].includes(b.status) && !b.cancelled).length, bg: '#DBEAFE', fg: '#1E40AF' },
                { id: 'Closed', label: 'Closed / Dispatched', count: (bomStore || []).filter(b => (b.status === 'Closed' || b.status === 'CLOSED' || b.status === 'Completed' || b.fullyCompleted || b.status === 'Fully Dispatched & Delivered') && !b.cancelled).length, bg: '#F1F5F9', fg: '#475569' },
                { id: 'Cancelled', label: 'Cancelled', count: (bomStore || []).filter(b => b && (b.status === 'Cancelled' || b.status === 'Cancelled & Stock Restored' || b.cancelled)).length, bg: '#FEE2E2', fg: '#DC2626' }
              ],
              headers: ['BOM Code', 'Customer Name', 'Sales Person', 'Payment Type', 'Dispatch Packing Status'],
              rows: (bomStore || []).filter(b => b && (b.status ? b.status !== 'Draft' : true)).sort((a, b) => {
                const parseBomSeq = (code) => {
                  const m = String(code || '').match(/BOM-(\d+)/i);
                  return m ? parseInt(m[1], 10) : 0;
                };
                const seqA = parseBomSeq(a?.bomCode || a?.code || a?.id);
                const seqB = parseBomSeq(b?.bomCode || b?.code || b?.id);
                if (seqA !== seqB) return seqB - seqA;
                const dateA = new Date(a?.salesConfirmedAt || a?.date || a?.createdAt || 0).getTime() || 0;
                const dateB = new Date(b?.salesConfirmedAt || b?.date || b?.createdAt || 0).getTime() || 0;
                return dateB - dateA;
              }).map(b => {
                const packedCount = (b.dispatchPacking || []).filter(p => p.packed).length;
                const totalItemsCount = (b.dispatchPacking || b.items || []).length;
                const isFullyPacked = totalItemsCount > 0 && packedCount === totalItemsCount;
                const isPartiallyPacked = packedCount > 0 && packedCount < totalItemsCount;
                const isClosed = b.status === 'Closed' || b.status === 'CLOSED' || b.status === 'Completed' || b.fullyCompleted || b.status === 'Fully Dispatched & Delivered';
                const isCancelled = Boolean(b.cancelled || b.status === 'Cancelled' || b.status === 'Cancelled & Stock Restored');

                let statusLabel = 'PENDING DISPATCH PACKING';
                let stBg = '#FFF7ED';
                let stFg = '#C2410C';
                let stBorder = '1px solid #FED7AA';
                let tabGroup = 'PendingPacking';

                if (isCancelled) {
                  statusLabel = 'CANCELLED';
                  stBg = '#FEF2F2';
                  stFg = '#DC2626';
                  stBorder = '1px solid #FECACA';
                  tabGroup = 'Cancelled';
                } else if (isClosed) {
                  statusLabel = 'COMPLETED & DISPATCHED';
                  stBg = '#DCFCE7';
                  stFg = '#166534';
                  stBorder = '1px solid #86EFAC';
                  tabGroup = 'Closed';
                } else if (b.status === 'Awaiting Vehicle Loading & Dispatch' || b.invoiceConfirmed) {
                  statusLabel = 'AWAITING VEHICLE LOADING';
                  stBg = '#DBEAFE';
                  stFg = '#1E40AF';
                  stBorder = '1px solid #93C5FD';
                  tabGroup = 'AwaitingLoading';
                } else if (isFullyPacked || b.status === 'Packed & Ready for Dispatch') {
                  statusLabel = 'PACKED & READY FOR DISPATCH';
                  stBg = '#DCFCE7';
                  stFg = '#166534';
                  stBorder = '1px solid #86EFAC';
                  tabGroup = 'Packed';
                } else if (isPartiallyPacked || b.status === 'Partially Packed') {
                  statusLabel = 'PARTIALLY PACKED';
                  stBg = '#FEF3C7';
                  stFg = '#B45309';
                  stBorder = '1px solid #FDE68A';
                  tabGroup = 'PartiallyPacked';
                } else if (b.status === 'Pending Sales Confirmation' || b.status === 'Pending Confirmation') {
                  statusLabel = 'PENDING SALES CONFIRMATION';
                  stBg = '#FEF3C7';
                  stFg = '#B45309';
                  stBorder = '1px solid #FDE68A';
                  tabGroup = 'PendingPacking';
                }

                const salesPersonName = (b.salesPerson || localStorage.getItem('controlroom_logged_user_name') || 'Mohith JV').replace(/\s*\([^)]*\)/g, '').trim();
                return {
                  ...b,
                  code: b.bomCode,
                  c2: b.customerName,
                  salesPerson: salesPersonName,
                  c3: salesPersonName,
                  c4: b.paymentType || '100% Paid',
                  packingProgressText: isCancelled ? `Cancelled (${b.cancellationReason || 'Stock Restored'})` : (isClosed ? `All ${totalItemsCount} Items Dispatched & Closed` : `${packedCount} of ${totalItemsCount} Items Packed`),
                  status: statusLabel,
                  stBg: stBg,
                  stFg: stFg,
                  stBorder: stBorder,
                  tabGroup: tabGroup
                };
              })
            },
            'Production Orders': {
              title: 'Production Orders (PO)',
              subtitle: 'Generate, tracking and dispatch management of corporate Production Orders',
              actionText: '+ Create PO',
              searchPlaceholder: 'Search Production Orders (PO No, Customer Name)...',
              tabs: [
                { id: 'All', label: 'All Orders', count: 49, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Draft', label: 'Draft / Pending Approval', count: 20, bg: '#fff7ed', fg: '#c2410c' },
                { id: 'Open', label: 'Approved (OPEN)', count: 27, bg: '#dcfce7', fg: '#166534' },
                { id: 'Partial', label: 'Open / Partially Received', count: 0, bg: '#fef3c7', fg: '#b45309' },
                { id: 'Closed', label: 'Closed / Fully Received', count: 2, bg: '#dcfce7', fg: '#15803d' },
                { id: 'Rejected', label: 'Rejected', count: 0, bg: '#fee2e2', fg: '#dc2626' }
              ],
              headers: ['PO No.', 'Customer / Vendor Name', 'PO Date', 'Expected Delivery', 'Total Quantity / Value', 'Status'],
              rows: [
                { code: 'PO-2026-081', c2: 'Vikram Solar Pvt Ltd', c3: '2026-08-11', c4: '2026-08-28', c5: '1,500 Nos (₹ 2,301.00)', status: 'OPEN', stBg: '#f0fdf4', stFg: '#15803d', stBorder: '1px solid #bbf7d0', tabGroup: 'Open' },
                { code: 'PO-2026-080', c2: 'Tata Power Renewable', c3: '2026-08-09', c4: '2026-08-24', c5: '600 Nos (₹ 69,62,000.00)', status: 'CLOSED / FULLY RECEIVED', stBg: '#f0fdf4', stFg: '#15803d', stBorder: '1px solid #bbf7d0', tabGroup: 'Closed' },
                { code: 'PO-2026-079', c2: 'Apex Infra Systems', c3: '2026-08-09', c4: '2026-08-17', c5: '1,300 Nos (₹ 5,56,960.00)', status: 'CLOSED / FULLY RECEIVED', stBg: '#f0fdf4', stFg: '#15803d', stBorder: '1px solid #bbf7d0', tabGroup: 'Closed' },
                { code: 'PO-2026-078', c2: 'Adani Solar Energy', c3: '2026-08-09', c4: '2026-08-18', c5: '400 Nos (₹ 5,56,960.00)', status: 'Draft', stBg: '#f1f5f9', stFg: '#475569', stBorder: '1px solid #cbd5e1', tabGroup: 'Draft' },
                { code: 'PO-2026-077', c2: 'Sterling & Wilson', c3: '2026-08-09', c4: '2026-08-19', c5: '280 Nos (₹ 5,56,960.00)', status: 'OPEN', stBg: '#f0fdf4', stFg: '#15803d', stBorder: '1px solid #bbf7d0', tabGroup: 'Open' },
                { code: 'PO-2026-076', c2: 'Waaree Energies Ltd', c3: '2026-08-10', c4: '2026-08-25', c5: '1,200 Nos (₹ 69,62,000.00)', status: 'OPEN', stBg: '#f0fdf4', stFg: '#15803d', stBorder: '1px solid #bbf7d0', tabGroup: 'Open' }
              ]
            },
            'Work Orders': {
              title: 'Work Orders & Shop Floor Execution',
              subtitle: 'Zoho Inventory synced manufacturing work orders and shop floor dispatch',
              actionText: '+ Create Work Order',
              searchPlaceholder: 'Search Work Orders (WO No, Product Name, Material)...',
              tabs: [
                { id: 'All', label: 'All Work Orders', count: (prodModuleEngine.getWorkOrders() || []).length, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Pending', label: 'Draft / Pending', count: (prodModuleEngine.getWorkOrders() || []).filter(w => w.status === 'Draft' || w.status === 'Pending').length, bg: '#fff7ed', fg: '#c2410c' },
                { id: 'InProgress', label: 'In Progress', count: (prodModuleEngine.getWorkOrders() || []).filter(w => w.status === 'In Progress' || w.status === 'RUNNING').length, bg: '#fef3c7', fg: '#b45309' },
                { id: 'Ready', label: 'Material Ready', count: (prodModuleEngine.getWorkOrders() || []).filter(w => w.status === 'Material Ready' || w.status === 'COMPLETED').length, bg: '#dcfce7', fg: '#166534' },
                { id: 'Overdue', label: 'Overdue Jobs', count: (prodModuleEngine.getWorkOrders() || []).filter(w => w.status === 'OVERDUE' || w.status === 'Overdue').length, bg: '#fee2e2', fg: '#dc2626' }
              ],
              headers: ['Work Order No.', 'Product Name', 'Raw Material Required', 'Planned Qty', 'Completed Qty', 'Warehouse Store', 'Status'],
              rows: (prodModuleEngine.getWorkOrders() || []).map(w => {
                const isOverdue = w.status === 'OVERDUE' || w.status === 'Overdue';
                const isInProgress = w.status === 'In Progress' || w.status === 'RUNNING';
                const isReady = w.status === 'Material Ready' || w.status === 'COMPLETED' || w.status === 'Closed';
                
                return {
                  ...w,
                  code: w.id || w.workOrderNo,
                  c2: w.finishedProductName || w.productName || 'Solar Mounting Rail',
                  c3: w.rawMaterialName || w.rawMaterial || 'Raw Alu Coil',
                  c4: `${(w.targetQty || w.plannedQty || 100).toLocaleString('en-IN')} Nos`,
                  c5: `${(w.completedQty || 0).toLocaleString('en-IN')} Nos`,
                  c6: w.productionLocation || w.warehouseStore || 'RM Store #1',
                  status: (w.status || 'IN PROGRESS').toUpperCase(),
                  stBg: isOverdue ? '#fee2e2' : (isInProgress ? '#ffedd5' : (isReady ? '#dcfce7' : '#f1f5f9')),
                  stFg: isOverdue ? '#dc2626' : (isInProgress ? '#ea580c' : (isReady ? '#166534' : '#475569')),
                  stBorder: isOverdue ? '1px solid #fca5a5' : (isInProgress ? '1px solid #fed7aa' : (isReady ? '1px solid #bbf7d0' : '1px solid #cbd5e1')),
                  tabGroup: isOverdue ? 'Overdue' : (isInProgress ? 'InProgress' : (isReady ? 'Ready' : 'Pending'))
                };
              })
            },
            'Planning & Scheduling': {
              title: 'Production Planning & Shift Scheduling',
              subtitle: 'Master production schedule, shift allocation, and capacity planning',
              actionText: '+ Add Schedule Shift',
              searchPlaceholder: 'Search Schedules (Schedule ID, Line Name, Shift Lead)...',
              tabs: [
                { id: 'All', label: 'All Schedules', count: 62, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Shift1', label: '1st Shift', count: 24, bg: '#dcfce7', fg: '#166534' },
                { id: 'Shift2', label: '2nd Shift', count: 22, bg: '#dbeafe', fg: '#1e40af' },
                { id: 'Shift3', label: '3rd Shift', count: 12, bg: '#f3e8ff', fg: '#6b21a8' },
                { id: 'Maint', label: 'Planned Maintenance', count: 4, bg: '#fee2e2', fg: '#dc2626' }
              ],
              headers: ['Shift / Schedule ID', 'Time Window', 'Assigned Line / Machine', 'Target Qty', 'Actual Produced', 'Shift Lead', 'Status'],
              rows: [
                { code: 'SCH-2026-01', c2: '06:00 AM - 02:00 PM', c3: 'CNC Cutting & Punching #1', c4: '2,640 Nos', c5: '2,438 Nos', c6: 'R. Karthik', status: 'COMPLETED', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Shift1' },
                { code: 'SCH-2026-02', c2: '02:00 PM - 10:00 PM', c3: 'Roll Forming Line', c4: '2,640 Nos', c5: '2,424 Nos', c6: 'M. Arul', status: 'COMPLETED', stBg: '#dbeafe', stFg: '#1e40af', stBorder: '1px solid #bfdbfe', tabGroup: 'Shift2' },
                { code: 'SCH-2026-03', c2: '10:00 PM - 06:00 AM', c3: 'Maintenance & Tool Room', c4: '0 Nos (Setup)', c5: '0 Nos', c6: 'S. Praveen', status: 'MAINTENANCE', stBg: '#f3e8ff', stFg: '#6b21a8', stBorder: '1px solid #e9d5ff', tabGroup: 'Maint' }
              ]
            },
            'Production Monitoring': {
              title: 'Real-Time Production & Telemetry Monitoring',
              subtitle: 'Live shop floor machine telemetry, cycle speeds, and output tracking',
              actionText: 'Live Telemetry Active',
              searchPlaceholder: 'Search Machines (Line Code, Machine Name, Operator)...',
              tabs: [
                { id: 'All', label: 'All Lines', count: 8, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Running', label: 'Running Lines', count: 6, bg: '#dcfce7', fg: '#166534' },
                { id: 'Idle', label: 'Idle Lines', count: 1, bg: '#fef3c7', fg: '#b45309' },
                { id: 'Maint', label: 'Under Maintenance', count: 1, bg: '#fee2e2', fg: '#dc2626' }
              ],
              headers: ['Machine Line Code', 'Machine Name', 'Operating Speed', 'Today Output', 'Operator In-Charge', 'Power Rating', 'Status'],
              rows: [
                { code: 'LINE-A1', c2: 'CNC Cutting Machine', c3: '140 RPM', c4: '1,102 Nos', c5: 'R. Karthik', c6: '15 KW', status: 'RUNNING', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Running' },
                { code: 'LINE-A2', c2: 'Punching Machine - 1', c3: '95 Strokes/min', c4: '912 Nos', c5: 'M. Arul', c6: '22 KW', status: 'RUNNING', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Running' },
                { code: 'LINE-A3', c2: 'Punching Machine - 2', c3: '0 RPM', c4: '678 Nos', c5: 'S. Praveen', c6: '22 KW', status: 'MAINTENANCE', stBg: '#fee2e2', stFg: '#dc2626', stBorder: '1px solid #fca5a5', tabGroup: 'Maint' },
                { code: 'LINE-B1', c2: 'Drilling Machine', c3: '210 RPM', c4: '546 Nos', c5: 'K. Manoj', c6: '11 KW', status: 'RUNNING', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Running' },
                { code: 'LINE-B2', c2: 'Tapping Machine', c3: '80 RPM', c4: '322 Nos', c5: 'P. Kumar', c6: '9 KW', status: 'IDLE', stBg: '#fef3c7', stFg: '#b45309', stBorder: '1px solid #fde68a', tabGroup: 'Idle' }
              ]
            },
            'Quality Control': {
              title: 'Quality Control & Inspection Audits',
              subtitle: 'Quality rejection certificates, inspection audits, and QC sign-offs',
              actionText: '+ Create QC Audit',
              searchPlaceholder: 'Search QC Audits (QC Cert No, Product Name, Inspector)...',
              tabs: [
                { id: 'All', label: 'All Audits', count: 124, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Approved', label: 'Approved Yield', count: 108, bg: '#dcfce7', fg: '#166534' },
                { id: 'Defects', label: 'Passed With Defect', count: 11, bg: '#fef3c7', fg: '#b45309' },
                { id: 'Pending', label: 'Pending Cert', count: 5, bg: '#fee2e2', fg: '#dc2626' }
              ],
              headers: ['QC Cert No.', 'Product Name', 'Inspected Qty', 'Passed Qty', 'Rejected Qty', 'Defect Category', 'Status'],
              rows: [
                { code: 'QC-2026-104', c2: 'Mini Rail 100 mm', c3: '1,456 Nos', c4: '1,402 Nos', c5: '54 Nos', c6: 'Dimensional Out', status: 'PASSED WITH DEFECTS', stBg: '#fef3c7', stFg: '#b45309', stBorder: '1px solid #fde68a', tabGroup: 'Defects' },
                { code: 'QC-2026-105', c2: 'Long Rail 3000 mm', c3: '566 Nos', c4: '538 Nos', c5: '28 Nos', c6: 'Surface Scratch', status: 'APPROVED', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Approved' },
                { code: 'QC-2026-106', c2: 'Mid Clamp 35 mm', c3: '1,228 Nos', c4: '1,210 Nos', c5: '18 Nos', c6: 'Profile Bent', status: 'APPROVED', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Approved' }
              ]
            },
            'Machine Maintenance': {
              title: 'Machine Maintenance & Overhauls',
              subtitle: 'Preventive maintenance schedule, breakdown logs, and tool room tasks',
              actionText: '+ Log Maintenance',
              searchPlaceholder: 'Search Maintenance (Job ID, Machine Name, Technician)...',
              tabs: [
                { id: 'All', label: 'All Jobs', count: 42, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Scheduled', label: 'Scheduled', count: 18, bg: '#dbeafe', fg: '#1e40af' },
                { id: 'InProgress', label: 'In Progress', count: 10, bg: '#ffedd5', fg: '#ea580c' },
                { id: 'Completed', label: 'Completed', count: 14, bg: '#dcfce7', fg: '#166534' }
              ],
              headers: ['Maint. Job ID', 'Machine Line', 'Task Description', 'Scheduled Date', 'Assigned Tech', 'Downtime (Hrs)', 'Status'],
              rows: [
                { code: 'MNT-2026-042', c2: 'Punching Machine - 2', c3: 'Hydraulic Hose Overhaul & Seal Replace', c4: '2026-08-26', c5: 'Mechanical Team', c6: '4.5 Hrs', status: 'IN PROGRESS', stBg: '#ffedd5', stFg: '#ea580c', stBorder: '1px solid #fed7aa', tabGroup: 'InProgress' },
                { code: 'MNT-2026-043', c2: 'CNC Cutting Machine', c3: 'Blade Alignment & Calibration', c4: '2026-08-30', c5: 'Tool Room Lead', c6: '1.2 Hrs', status: 'SCHEDULED', stBg: '#dbeafe', stFg: '#1e40af', stBorder: '1px solid #bfdbfe', tabGroup: 'Scheduled' },
                { code: 'MNT-2026-041', c2: 'Roll Forming Line', c3: 'Gearbox Lubrication & Belt Tensioning', c4: '2026-08-20', c5: 'Electrical Tech', c6: '2.0 Hrs', status: 'COMPLETED', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Completed' }
              ]
            },
            'Inventory (Raw Material)': {
              title: 'Raw Material Inventory Stores & Stock Balances',
              subtitle: 'Raw aluminum coils, steel profiles, fasteners, and warehouse store balances',
              actionText: '+ Add Stock',
              searchPlaceholder: 'Search Inventory (Material Code, Description, Store)...',
              tabs: [
                { id: 'All', label: 'All Stock Items', count: 56, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Sufficient', label: 'Sufficient Stock', count: 42, bg: '#dcfce7', fg: '#166534' },
                { id: 'Warning', label: 'Reorder Warning', count: 10, bg: '#ffedd5', fg: '#ea580c' },
                { id: 'Critical', label: 'Critical Shortage', count: 4, bg: '#fee2e2', fg: '#dc2626' }
              ],
              headers: ['Material Code', 'Material Description', 'Current Stock', 'Safety Threshold', 'Unit Rate (₹)', 'Store Location', 'Status'],
              rows: [
                { code: 'RM-ALU-150', c2: 'Raw Aluminum Coil 1.5mm 6063-T6', c3: '4.2 Tons', c4: '5.0 Tons', c5: '₹ 2,45,000 / Ton', c6: 'RM Store #1', status: 'REORDER WARNING', stBg: '#ffedd5', stFg: '#ea580c', stBorder: '1px solid #fed7aa', tabGroup: 'Warning' },
                { code: 'RM-STL-300', c2: 'HDG Steel Profile Stock 3mm', c3: '12.8 Tons', c4: '6.0 Tons', c5: '₹ 78,000 / Ton', c6: 'RM Store #2', status: 'SUFFICIENT', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Sufficient' },
                { code: 'RM-FST-035', c2: 'Alu Fastener Rod 35mm', c3: '8.5 Tons', c4: '4.0 Tons', c5: '₹ 1,85,000 / Ton', c6: 'RM Store #1', status: 'SUFFICIENT', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Sufficient' }
              ]
            },
            'Sales BOM': {
              title: 'Sales Bill of Materials (BOM)',
              subtitle: 'Customer order BOMs, product specifications and sales quotations',
              actionText: '+ Create BOM',
              searchPlaceholder: 'Search Sales BOM (BOM Code, Customer Name, Product)...',
              tabs: [
                { id: 'All', label: 'All BOMs', count: (visibleBomStore || []).length, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Draft', label: 'Draft', count: (visibleBomStore || []).filter(b => b.status === 'Draft').length, bg: '#fff7ed', fg: '#c2410c' },
                { id: 'Pending', label: 'Pending Confirmation', count: (visibleBomStore || []).filter(b => !b.status || b.status.includes('Pending')).length, bg: '#fef3c7', fg: '#b45309' },
                { id: 'Sent', label: 'Sent to Production', count: (visibleBomStore || []).filter(b => b.status === 'Sent to Production' || b.status === 'Confirmed').length, bg: '#dcfce7', fg: '#166534' }
              ],
              headers: ['BOM Code', 'Date of Entry', 'Customer Name', 'Payment Type', 'Total (₹)', 'Status', 'Action'],
              rows: (visibleBomStore || []).map(b => ({
                ...b,
                code: b.bomCode || 'BOM-101',
                c2: b.date || new Date().toISOString().split('T')[0],
                c3: b.customerName || b.companyName || 'Customer Order',
                c4: b.paymentType || '100% Advance',
                c5: formatCurrency(b.grandTotal),
                status: b.status || 'Pending Confirmation',
                stBg: b.status === 'Draft' ? '#fff7ed' : (!b.status || b.status.includes('Pending')) ? '#fef3c7' : '#dcfce7',
                stFg: b.status === 'Draft' ? '#c2410c' : (!b.status || b.status.includes('Pending')) ? '#b45309' : '#166534',
                stBorder: b.status === 'Draft' ? '1px solid #fed7aa' : (!b.status || b.status.includes('Pending')) ? '1px solid #fde68a' : '1px solid #bbf7d0',
                tabGroup: b.status === 'Draft' ? 'Draft' : (!b.status || b.status.includes('Pending')) ? 'Pending' : 'Sent'
              }))
            },
            'BOM': {
              title: 'Bill of Materials (BOM)',
              subtitle: 'Standard raw material consumption lists and component requirements',
              actionText: '+ Create BOM',
              searchPlaceholder: 'Search BOM (BOM Code, Customer Name, Product)...',
              tabs: [
                { id: 'All', label: 'All BOMs', count: (visibleBomStore || []).length, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Draft', label: 'Draft', count: (visibleBomStore || []).filter(b => b.status === 'Draft').length, bg: '#fff7ed', fg: '#c2410c' },
                { id: 'Pending', label: 'Pending Confirmation', count: (visibleBomStore || []).filter(b => !b.status || b.status.includes('Pending')).length, bg: '#fef3c7', fg: '#b45309' },
                { id: 'Sent', label: 'Sent to Production', count: (visibleBomStore || []).filter(b => b.status === 'Sent to Production' || b.status === 'Confirmed').length, bg: '#dcfce7', fg: '#166534' }
              ],
              headers: ['BOM Code', 'Date of Entry', 'Customer Name', 'Payment Type', 'Total (₹)', 'Status', 'Action'],
              rows: (visibleBomStore || []).map(b => ({
                ...b,
                code: b.bomCode || 'BOM-101',
                c2: b.date || new Date().toISOString().split('T')[0],
                c3: b.customerName || b.companyName || 'Customer Order',
                c4: b.paymentType || '100% Advance',
                c5: formatCurrency(b.grandTotal),
                status: b.status || 'Pending Confirmation',
                stBg: b.status === 'Draft' ? '#fff7ed' : (!b.status || b.status.includes('Pending')) ? '#fef3c7' : '#dcfce7',
                stFg: b.status === 'Draft' ? '#c2410c' : (!b.status || b.status.includes('Pending')) ? '#b45309' : '#166534',
                stBorder: b.status === 'Draft' ? '1px solid #fed7aa' : (!b.status || b.status.includes('Pending')) ? '1px solid #fde68a' : '1px solid #bbf7d0',
                tabGroup: b.status === 'Draft' ? 'Draft' : (!b.status || b.status.includes('Pending')) ? 'Pending' : 'Sent'
              }))
            },
            'BOM Orders': {
              title: 'BOM Orders & Client Specifications',
              subtitle: 'Create and manage customer order BOMs, product specifications, and payment terms',
              actionText: '+ Create BOM',
              searchPlaceholder: 'Search BOM Orders (BOM Code, Customer Name, Product)...',
              tabs: [
                { id: 'All', label: 'All BOMs', count: (visibleBomStore || []).length, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Draft', label: 'Draft', count: (visibleBomStore || []).filter(b => b.status === 'Draft').length, bg: '#fff7ed', fg: '#c2410c' },
                { id: 'Pending', label: 'Pending Confirmation', count: (visibleBomStore || []).filter(b => !b.status || b.status.includes('Pending')).length, bg: '#fef3c7', fg: '#b45309' },
                { id: 'Sent', label: 'Sent to Production', count: (visibleBomStore || []).filter(b => b.status === 'Sent to Production' || b.status === 'Confirmed').length, bg: '#dcfce7', fg: '#166534' }
              ],
              headers: ['BOM Code', 'Date of Entry', 'Customer Name', 'Payment Type', 'Total (₹)', 'Status', 'Action'],
              rows: (visibleBomStore || []).map(b => ({
                ...b,
                code: b.bomCode || 'BOM-101',
                c2: b.date || new Date().toISOString().split('T')[0],
                c3: b.customerName || b.companyName || 'Customer Order',
                c4: b.paymentType || '100% Advance',
                c5: formatCurrency(b.grandTotal),
                status: b.status || 'Pending Confirmation',
                stBg: b.status === 'Draft' ? '#fff7ed' : (!b.status || b.status.includes('Pending')) ? '#fef3c7' : '#dcfce7',
                stFg: b.status === 'Draft' ? '#c2410c' : (!b.status || b.status.includes('Pending')) ? '#b45309' : '#166534',
                stBorder: b.status === 'Draft' ? '1px solid #fed7aa' : (!b.status || b.status.includes('Pending')) ? '1px solid #fde68a' : '1px solid #bbf7d0',
                tabGroup: b.status === 'Draft' ? 'Draft' : (!b.status || b.status.includes('Pending')) ? 'Pending' : 'Sent'
              }))
            },
            'Customer Management': {
              title: 'Customer Directory & Management',
              subtitle: 'Manage client directory, contact details, billing addresses, and order history',
              actionText: '+ Add New Customer',
              searchPlaceholder: 'Search Customers (Customer Name, Company, Email, Phone)...',
              tabs: [
                { id: 'All', label: 'All Customers', count: (customerList || []).length, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Active', label: 'Active Clients', count: (customerList || []).length, bg: '#dcfce7', fg: '#166534' },
                { id: 'Lead', label: 'New Leads', count: 0, bg: '#dbeafe', fg: '#1e40af' }
              ],
              headers: ['Customer Name', 'Company Name', 'GSTIN / Tax No.', 'Mobile / Phone', 'Email ID', 'Action'],
              rows: (customerList || []).map(c => ({
                ...c,
                code: c.code,
                c2: c.c2 || c.code,
                c3: c.gstNo || '33AABCU9603R1ZM',
                c4: c.c4 || c.mobile || '—',
                c5: c.c5 || c.email || '—'
              }))
            },
            'BOM / Routing': {
              title: 'Bill of Materials (BOM)',
              subtitle: 'Standard raw material consumption lists and component requirements',
              actionText: '+ Create BOM',
              searchPlaceholder: 'Search BOM (BOM Code, Customer Name, Product)...',
              tabs: [
                { id: 'All', label: 'All BOMs', count: (visibleBomStore || []).length, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Draft', label: 'Draft', count: (visibleBomStore || []).filter(b => b.status === 'Draft').length, bg: '#fff7ed', fg: '#c2410c' },
                { id: 'Pending', label: 'Pending Confirmation', count: (visibleBomStore || []).filter(b => !b.status || b.status.includes('Pending')).length, bg: '#fef3c7', fg: '#b45309' },
                { id: 'Sent', label: 'Sent to Production', count: (visibleBomStore || []).filter(b => b.status === 'Sent to Production' || b.status === 'Confirmed').length, bg: '#dcfce7', fg: '#166534' }
              ],
              headers: ['BOM Code', 'Date of Entry', 'Customer Name', 'Payment Type', 'Total (₹)', 'Status', 'Action'],
              rows: (visibleBomStore || []).map(b => ({
                ...b,
                code: b.bomCode || 'BOM-101',
                c2: b.date || new Date().toISOString().split('T')[0],
                c3: b.customerName || b.companyName || 'Customer Order',
                c4: b.paymentType || '100% Advance',
                c5: formatCurrency(b.grandTotal),
                status: b.status || 'Pending Confirmation',
                stBg: b.status === 'Draft' ? '#fff7ed' : (!b.status || b.status.includes('Pending')) ? '#fef3c7' : '#dcfce7',
                stFg: b.status === 'Draft' ? '#c2410c' : (!b.status || b.status.includes('Pending')) ? '#b45309' : '#166534',
                stBorder: b.status === 'Draft' ? '1px solid #fed7aa' : (!b.status || b.status.includes('Pending')) ? '1px solid #fde68a' : '1px solid #bbf7d0',
                tabGroup: b.status === 'Draft' ? 'Draft' : (!b.status || b.status.includes('Pending')) ? 'Pending' : 'Sent'
              }))
            },
            'Production Reports': {
              title: 'Production Reports & Shift Compilation',
              subtitle: 'Generate and export plant output, shift logs, and operational spreadsheets',
              actionText: 'Export Report',
              searchPlaceholder: 'Search Reports (Report ID, Shift Date, Supervisor)...',
              tabs: [
                { id: 'All', label: 'All Reports', count: 62, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Shift', label: 'Shift Output', count: 40, bg: '#dcfce7', fg: '#166534' },
                { id: 'QC', label: 'QC Audit Logs', count: 12, bg: '#dbeafe', fg: '#1e40af' },
                { id: 'Downtime', label: 'Downtime Logs', count: 10, bg: '#fee2e2', fg: '#dc2626' }
              ],
              headers: ['Report ID', 'Shift Date', 'Shift Name', 'Total Output', 'Rejections', 'Downtime', 'Status'],
              rows: [
                { code: 'RPT-2026-206', c2: '2026-08-11', c3: '1st Shift', c4: '744 Nos', c5: '5 Nos', c6: '0.5 Hrs', status: 'EXCEL (.XLSX)', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Shift' },
                { code: 'RPT-2026-205', c2: '2026-08-10', c3: '2nd Shift', c4: '690 Nos', c5: '4 Nos', c6: '1.2 Hrs', status: 'EXCEL (.XLSX)', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Shift' },
                { code: 'RPT-2026-204', c2: '2026-08-09', c3: '1st Shift', c4: '736 Nos', c5: '6 Nos', c6: '0.8 Hrs', status: 'PDF (.PDF)', stBg: '#dbeafe', stFg: '#1e40af', stBorder: '1px solid #bfdbfe', tabGroup: 'Shift' }
              ]
            },
            'Efficiency Reports': {
              title: 'Plant Efficiency & OEE Analytics Reports',
              subtitle: 'Overall Equipment Effectiveness (OEE), Availability, Performance, and Quality yield',
              actionText: 'Export OEE Report',
              searchPlaceholder: 'Search Machine Lines (Machine Name, Status Grade)...',
              tabs: [
                { id: 'All', label: 'All Lines', count: 8, bg: '#e2e8f0', fg: '#475569' },
                { id: 'GradeA', label: 'Grade A+ / A', count: 5, bg: '#dcfce7', fg: '#166534' },
                { id: 'GradeB', label: 'Grade B+ / B', count: 2, bg: '#fef3c7', fg: '#b45309' },
                { id: 'UnderTarget', label: 'Under Target', count: 1, bg: '#fee2e2', fg: '#dc2626' }
              ],
              headers: ['Machine Line', 'Availability %', 'Performance %', 'Quality %', 'OEE Score', 'Status Grade', 'Status'],
              rows: [
                { code: 'CNC Cutting Machine', c2: '94.1%', c3: '91.2%', c4: '98.2%', c5: '84.3%', c6: 'GRADE A', status: 'TARGET MET', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'GradeA' },
                { code: 'Punching Machine - 1', c2: '92.4%', c3: '88.5%', c4: '96.8%', c5: '79.2%', c6: 'GRADE A', status: 'TARGET MET', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'GradeA' },
                { code: 'Roll Forming Line', c2: '95.6%', c3: '94.0%', c4: '97.8%', c5: '87.9%', c6: 'GRADE A+', status: 'TARGET EXCEEDED', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'GradeA' }
              ]
            },
            'Downtime Analytics': {
              title: 'Downtime Analytics & Root Cause Breakdown',
              subtitle: 'Machine breakdown tracking, stoppage reason analysis, and downtime reduction',
              actionText: 'Log Downtime',
              searchPlaceholder: 'Search Downtime (Incident ID, Reason, Machine)...',
              tabs: [
                { id: 'All', label: 'All Incidents', count: 88, bg: '#e2e8f0', fg: '#475569' },
                { id: 'Breakdown', label: 'Machine Breakdown', count: 35, bg: '#fee2e2', fg: '#dc2626' },
                { id: 'Material', label: 'Material Stoppage', count: 22, bg: '#ffedd5', fg: '#ea580c' },
                { id: 'Setup', label: 'Tool Setup', count: 18, bg: '#dbeafe', fg: '#1e40af' },
                { id: 'Resolved', label: 'Resolved Incidents', count: 75, bg: '#dcfce7', fg: '#166534' }
              ],
              headers: ['Incident ID', 'Stoppage Reason', 'Machine Line', 'Start Time', 'Duration (Hrs)', 'Root Cause', 'Status'],
              rows: [
                { code: 'DT-2026-88', c2: 'Machine Breakdown', c3: 'Punching Machine - 2', c4: '2026-08-10 10:30', c5: '4.5 Hrs', c6: 'Hydraulic Hose Failure', status: 'RESOLVED', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Resolved' },
                { code: 'DT-2026-87', c2: 'Material Not Ready', c3: 'Mini Rail Line', c4: '2026-08-08 08:00', c5: '2.5 Hrs', c6: 'Raw Coil Crane Delay', status: 'RESOLVED', stBg: '#dcfce7', stFg: '#166534', stBorder: '1px solid #bbf7d0', tabGroup: 'Resolved' },
                { code: 'DT-2026-86', c2: 'Tool Change / Setup', c3: 'CNC Cutting Machine', c4: '2026-08-07 14:00', c5: '1.5 Hrs', c6: 'Profile Die Swap', status: 'PLANNED', stBg: '#dbeafe', stFg: '#1e40af', stBorder: '1px solid #bfdbfe', tabGroup: 'Setup' }
              ]
            }
          };

          // RawMaterialInventoryView extracted to ./RawMaterialInventoryView.jsx

          // Dedicated Custom Renderer for Inventory & Raw Material Directory matching User UI Design
          if (activeTab === 'Raw Material Directory' || activeTab === 'Inventory (Raw Material)' || activeTab === 'Inventory' || (activeTab && activeTab.toLowerCase().includes('inventory')) || (activeTab && activeTab.toLowerCase().includes('raw material'))) {
            return (
              <RawMaterialInventoryView
                showAddStockForm={showAddStockForm}
                setShowAddStockForm={setShowAddStockForm}
                userRole={userRole}
                activeTab={activeTab}
                itemsLoading={itemsLoading}
                showCustomAlert={showCustomAlert}
              />
            );
          }

          // Dedicated Custom Renderer for Work Orders matching User Reference Screenshot
          if (activeTab === 'Work Orders') {
            if (showWorkOrderForm) {
              return (
                <CreateWorkOrderPage
                  onBack={() => setShowWorkOrderForm(false)}
                  onWorkOrderCreated={(newWO) => {
                    setShowWorkOrderForm(false);
                    showCustomAlert(`Work Order ${newWO?.id || ''} created & issued successfully! Raw Material Required: ${newWO?.rawMaterialPhysicalToIssue || ''} ${newWO?.rawMaterialUnit || ''}`, `Work Order ${newWO?.id || ''} Issued Successfully!`, 'success');
                  }}
                />
              );
            }

            return (
              <WorkOrdersView
                userRole={userRole}
                setShowWorkOrderForm={setShowWorkOrderForm}
                prodSearchQueryText={prodSearchQueryText}
                setProdSearchQueryText={setProdSearchQueryText}
                prodStatusFilterText={prodStatusFilterText}
                setProdStatusFilterText={setProdStatusFilterText}
              />
            );
          }

          // Render Send Confirm (Editable Mode) or View BOM Details (100% Read-Only Mode)
          if (confirmingBomModal) {
            return (
              <ConfirmingBomModal
                confirmingBomModal={confirmingBomModal}
                setConfirmingBomModal={setConfirmingBomModal}
                setBomStore={setBomStore}
              />
            );
          }

          // Render Dispatch Head Packing Verification Screen (Full Size Page)
          if (dispatchPackingModal) {
            return (
              <DispatchPackingModal
                dispatchPackingModal={dispatchPackingModal}
                setDispatchPackingModal={setDispatchPackingModal}
                bomStore={bomStore}
                setBomStore={setBomStore}
              />
            );
          }

          // Render Accounts Team Payment & Document Verification Screen (Full Size Page)
          if (accountsVerificationModal) {
            return (
              <AccountsVerificationModal
                accountsVerificationModal={accountsVerificationModal}
                setAccountsVerificationModal={setAccountsVerificationModal}
                isAccountsViewOnly={isAccountsViewOnly}
                setIsAccountsViewOnly={setIsAccountsViewOnly}
                bomStore={bomStore}
                setBomStore={setBomStore}
                userRole={userRole}
                setPreviewDocModal={setPreviewDocModal}
              />
            );
          }

          // Render Delete Confirmation Modal for Customer
          if (customerToDelete) {
            return (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Delete Customer</h3>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>This action cannot be undone.</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: '0 0 24px 0' }}>
                    Are you sure you want to delete customer <strong>"{customerToDelete.code}"</strong> from Customer Management directory?
                  </p>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setCustomerToDelete(null)}
                      style={{ border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', height: '38px', padding: '0 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setCustomerList(prev => prev.filter(c => c.code !== customerToDelete.code));
                        setCustomerToDelete(null);
                      }}
                      style={{ border: 'none', backgroundColor: '#DC2626', color: 'white', height: '38px', padding: '0 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Yes, Delete Customer
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Render Customer Profile View (when viewingCustomer is set)
          if (viewingCustomer) {
            return (
              <CustomerProfileView
                viewingCustomer={viewingCustomer}
                setViewingCustomer={setViewingCustomer}
                setEditingCustomer={setEditingCustomer}
                setShowCustomerForm={setShowCustomerForm}
                setCustFormName={setCustFormName}
                setCustFormCompany={setCustFormCompany}
                setCustFormGstNo={setCustFormGstNo}
                setCustFormMobile={setCustFormMobile}
                setCustFormEmail={setCustFormEmail}
                setCustFormBillingAddress={setCustFormBillingAddress}
                setCustFormBillingCity={setCustFormBillingCity}
                setCustFormBillingState={setCustFormBillingState}
                setCustFormBillingPincode={setCustFormBillingPincode}
                setCustFormDeliveryAddress={setCustFormDeliveryAddress}
                setCustFormDeliveryCity={setCustFormDeliveryCity}
                setCustFormDeliveryState={setCustFormDeliveryState}
                setCustFormDeliveryPincode={setCustFormDeliveryPincode}
                setCustFormSameAsBilling={setCustFormSameAsBilling}
              />
            );
          }

          // Render Create/Edit Customer Form if active or open
          if (showCustomerForm || editingCustomer) {
            return (
              <CustomerFormView
                showCustomerForm={showCustomerForm}
                setShowCustomerForm={setShowCustomerForm}
                editingCustomer={editingCustomer}
                setEditingCustomer={setEditingCustomer}
                custFormName={custFormName}
                setCustFormName={setCustFormName}
                custFormCompany={custFormCompany}
                setCustFormCompany={setCustFormCompany}
                custFormGstNo={custFormGstNo}
                setCustFormGstNo={setCustFormGstNo}
                custFormMobile={custFormMobile}
                setCustFormMobile={setCustFormMobile}
                custFormEmail={custFormEmail}
                setCustFormEmail={setCustFormEmail}
                custFormBillingAddress={custFormBillingAddress}
                setCustFormBillingAddress={setCustFormBillingAddress}
                custFormBillingCity={custFormBillingCity}
                setCustFormBillingCity={setCustFormBillingCity}
                custFormBillingState={custFormBillingState}
                setCustFormBillingState={setCustFormBillingState}
                custFormBillingPincode={custFormBillingPincode}
                setCustFormBillingPincode={setCustFormBillingPincode}
                custFormDeliveryAddress={custFormDeliveryAddress}
                setCustFormDeliveryAddress={setCustFormDeliveryAddress}
                custFormDeliveryCity={custFormDeliveryCity}
                setCustFormDeliveryCity={setCustFormDeliveryCity}
                custFormDeliveryState={custFormDeliveryState}
                setCustFormDeliveryState={setCustFormDeliveryState}
                custFormDeliveryPincode={custFormDeliveryPincode}
                setCustFormDeliveryPincode={setCustFormDeliveryPincode}
                custFormSameAsBilling={custFormSameAsBilling}
                setCustFormSameAsBilling={setCustFormSameAsBilling}
                customerList={customerList}
                setCustomerList={setCustomerList}
                setNewBomCustomer={setNewBomCustomer}
                setNewBomProductName={setNewBomProductName}
                setNewBomDeliveryAddress={setNewBomDeliveryAddress}
                setSameAsBilling={setSameAsBilling}
              />
            );
          }

          // Render Create BOM Form matching exact user reference screenshot design system
          if (showBOMForm) {
            return (
              <CreateBomFormPage
                showBOMForm={showBOMForm}
                setShowBOMForm={setShowBOMForm}
                setShowCustomerForm={setShowCustomerForm}
                customerList={customerList}
                setBomStore={setBomStore}
                newBomCode={newBomCode}
                setNewBomCode={setNewBomCode}
                newBomDeliveryDate={newBomDeliveryDate}
                setNewBomDeliveryDate={setNewBomDeliveryDate}
                newBomProductName={newBomProductName}
                setNewBomProductName={setNewBomProductName}
                bomFormErrors={bomFormErrors}
                setBomFormErrors={setBomFormErrors}
                newBomBillingStreet={newBomBillingStreet}
                setNewBomBillingStreet={setNewBomBillingStreet}
                newBomBillingCity={newBomBillingCity}
                setNewBomBillingCity={setNewBomBillingCity}
                newBomBillingState={newBomBillingState}
                setNewBomBillingState={setNewBomBillingState}
                newBomBillingPincode={newBomBillingPincode}
                setNewBomBillingPincode={setNewBomBillingPincode}
                newBomDeliveryAddress={newBomDeliveryAddress}
                newBomDeliveryStreet={newBomDeliveryStreet}
                setNewBomDeliveryStreet={setNewBomDeliveryStreet}
                newBomDeliveryCity={newBomDeliveryCity}
                setNewBomDeliveryCity={setNewBomDeliveryCity}
                newBomDeliveryState={newBomDeliveryState}
                setNewBomDeliveryState={setNewBomDeliveryState}
                newBomDeliveryPincode={newBomDeliveryPincode}
                setNewBomDeliveryPincode={setNewBomDeliveryPincode}
                newBomPaymentType={newBomPaymentType}
                setNewBomPaymentType={setNewBomPaymentType}
                newBomCreditDays={newBomCreditDays}
                setNewBomCreditDays={setNewBomCreditDays}
                sameAsBilling={sameAsBilling}
                setSameAsBilling={setSameAsBilling}
                newBomDeliveryProofDoc={newBomDeliveryProofDoc}
                setNewBomDeliveryProofDoc={setNewBomDeliveryProofDoc}
                newBomPaymentProofDoc={newBomPaymentProofDoc}
                setNewBomPaymentProofDoc={setNewBomPaymentProofDoc}
                newBomRemarks={newBomRemarks}
                setNewBomRemarks={setNewBomRemarks}
                newBomTransportMode={newBomTransportMode}
                setNewBomTransportMode={setNewBomTransportMode}
                newBomTransporterName={newBomTransporterName}
                setNewBomTransporterName={setNewBomTransporterName}
                newBomVehicleNo={newBomVehicleNo}
                setNewBomVehicleNo={setNewBomVehicleNo}
                newBomLrNo={newBomLrNo}
                setNewBomLrNo={setNewBomLrNo}
                newBomGstRate={newBomGstRate}
                setNewBomGstRate={setNewBomGstRate}
                activePresetsMap={activePresetsMap}
                selectedPreset={selectedPreset}
                setSelectedPreset={setSelectedPreset}
                presetSetCount={presetSetCount}
                setPresetSetCount={setPresetSetCount}
                presetKitPrice={presetKitPrice}
                setPresetKitPrice={setPresetKitPrice}
                setPreviewDocModal={setPreviewDocModal}
                selectedBomItemIndexes={selectedBomItemIndexes}
                setSelectedBomItemIndexes={setSelectedBomItemIndexes}
                showClearConfirmModal={showClearConfirmModal}
                setShowClearConfirmModal={setShowClearConfirmModal}
                bomConfirmModal={bomConfirmModal}
                setBomConfirmModal={setBomConfirmModal}
                showCustomAlert={showCustomAlert}
              />
            );
          }

          // Generic Renderer for other Production views
          const defaultConfig = {
            title: activeTab,
            subtitle: `Management and control for ${activeTab}`,
            actionText: `+ Create ${activeTab.replace(/s$/, '')}`,
            searchPlaceholder: `Search ${activeTab}...`,
            tabs: [
              { id: 'All', label: 'All Entries', count: (bomStore || []).length, bg: '#e2e8f0', fg: '#475569' }
            ],
            headers: ['Reference Code', 'Customer / Item', 'Details', 'Date', 'Value', 'Status', 'Action'],
            rows: (bomStore || []).map(b => {
              let dispStatus = b.status || 'ACTIVE';
              if (activeTab === 'Dispatch Orders') {
                if (['Sent to Production', 'Confirmed', 'In Production', 'Pending Confirmation', 'Draft', 'Pending', 'Edited / Pending Confirmation'].includes(b.status) || !b.status) {
                  dispStatus = 'Pending Packing';
                }
              }
              return {
                ...b,
                code: b.bomCode || 'REF-001',
                c2: b.customerName || 'Customer',
                c3: b.paymentType || '-',
                c4: b.date || '2026-08-17',
                c5: `₹ ${parseFloat(b.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                status: dispStatus,
                stBg: dispStatus === 'Pending Packing' ? '#fff7ed' : '#eff6ff',
                stFg: dispStatus === 'Pending Packing' ? '#c2410c' : '#2563eb',
                stBorder: dispStatus === 'Pending Packing' ? '1px solid #fed7aa' : '1px solid #bfdbfe',
                tabGroup: 'All'
              };
            })
          };

          const pageConfig = configs[activeTab] || defaultConfig;

          const filteredRows = (pageConfig.rows || []).filter(r => {
            const matchesSearch = !prodSearchQueryText ||
              (r.code && r.code.toLowerCase().includes(prodSearchQueryText.toLowerCase())) ||
              (r.c2 && r.c2.toLowerCase().includes(prodSearchQueryText.toLowerCase())) ||
              (r.c3 && r.c3.toLowerCase().includes(prodSearchQueryText.toLowerCase())) ||
              (r.customerName && r.customerName.toLowerCase().includes(prodSearchQueryText.toLowerCase()));

            const subTab = (prodActiveSubTab || 'All').toLowerCase();
            const rStatus = (r.status || '').toLowerCase();
            const rTabGroup = (r.tabGroup || '').toLowerCase();

            const matchesTab = subTab === 'all' ||
              subTab === 'all boms' ||
              subTab === 'all orders' ||
              rTabGroup === subTab ||
              (subTab.includes('pending') && (rStatus.includes('pending') || rStatus.includes('draft'))) ||
              (subTab.includes('draft') && rStatus.includes('draft')) ||
              (subTab.includes('sent') && (rStatus.includes('sent') || rStatus.includes('confirm') || rStatus.includes('production')));

            return matchesSearch && matchesTab;
          });

          const handleAddMaterialRow = () => {
            setBomMaterialsList(prev => [...prev, { name: '', category: '', uom: 'NOS', qty: '1', wastage: '0%', rate: '0' }]);
          };

          const handleRemoveMaterialRow = (idx) => {
            setBomMaterialsList(prev => prev.filter((_, i) => i !== idx));
          };

          const handleAddRoutingStep = () => {
            setBomRoutingSteps(prev => [...prev, { stepNo: prev.length + 1, opName: 'New Routing Operation', machine: 'Workstation Line', cycleTime: '3.0 sec', setupTime: '5 mins', skill: 'General Operator' }]);
          };

          const handleRemoveRoutingStep = (idx) => {
            setBomRoutingSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNo: i + 1 })));
          };

          // Render Create Work Order Form if active or open
          if (showWorkOrderForm) {
            return (
              <CreateWorkOrderPage
                onBack={() => setShowWorkOrderForm(false)}
                onWorkOrderCreated={(newWO) => {
                  setShowWorkOrderForm(false);
                  if (newWO && configs['Work Orders']?.rows) {
                    configs['Work Orders'].rows.unshift({
                      code: newWO.id,
                      c2: newWO.productName,
                      c3: newWO.bomCode,
                      c4: `${newWO.plannedQty} Nos`,
                      c5: '0 Nos',
                      c6: newWO.warehouseStore,
                      status: 'PENDING / DRAFT',
                      stBg: '#fff7ed',
                      stFg: '#c2410c',
                      stBorder: '1px solid #fed7aa',
                      tabGroup: 'Pending'
                    });
                  }
                  showCustomAlert(`Work Order ${newWO?.id || ''} created & issued successfully! Raw Material Required: ${newWO?.rawMaterialPhysicalToIssue || ''} ${newWO?.rawMaterialUnit || ''}`, `Work Order ${newWO?.id || ''} Issued Successfully!`, 'success');
                }}
              />
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%', fontFamily: "'DM Sans', sans-serif" }}>

              {/* 1. TOP HEADER SECTION WITH BLUE PRIMARY BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    {pageConfig.title}
                  </h2>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {pageConfig.subtitle}
                  </span>
                </div>
                {pageConfig.actionText && userRole !== 'CEO' && userRole !== 'MD' && userRole !== 'Managing Director' ? (
                  <button
                    onClick={() => {
                      if (activeTab === 'BOM / Routing' || activeTab === 'BOM' || activeTab === 'BOM Orders' || pageConfig.title.includes('BOM')) {
                        setNewBomProductName('');
                        setNewBomSku('');
                        setNewBomRevision('');
                        setNewBomTargetQty('');
                        setBomMaterialsList([]);
                        setNewBomPaymentProofDoc(null);
                        setNewBomDeliveryProofDoc(null);
                        setNewBomRemarks('');
                        setSameAsBilling(false);
                        setNewBomDeliveryStreet('');
                        setNewBomDeliveryCity('');
                        setNewBomDeliveryState('');
                        setNewBomDeliveryPincode('');
                        setNewBomCode('');
                        setShowBOMForm(true);
                      } else if (activeTab === 'Work Orders' || pageConfig.actionText.includes('Create Work Order')) {
                        setShowWorkOrderForm(true);
                      } else if (activeTab === 'Customer Management' || pageConfig.title.includes('Customer')) {
                        setShowCustomerForm(true);
                      } else {
                        alert(`Action: ${pageConfig.actionText}`);
                      }
                    }}
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
                      boxShadow: '0 4px 14px rgba(14, 116, 144, 0.35)',
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.2px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#085D75'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0E7490'}
                  >
                    <span>{pageConfig.actionText.replace(/^\+\s*/, '')}</span>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0E7490',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <Plus size={16} strokeWidth={2.5} />
                    </div>
                  </button>
                ) : null}
              </div>

              {/* 2. FILTERS & SEARCH ROW CARD (EXACT MATCH FOR PURCHASE ORDERS SCREENSHOT) */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', width: '100%', boxSizing: 'border-box', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#f8fafc', width: '340px' }}>
                  <Search style={{ width: '15px', height: '15px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder={pageConfig.searchPlaceholder}
                    value={prodSearchQueryText}
                    onChange={(e) => setProdSearchQueryText(e.target.value)}
                    style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#334155' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: 'white' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: '#64748b' }} />
                    <input
                      type="date"
                      value={prodFilterDateVal}
                      onChange={(e) => setProdFilterDateVal(e.target.value)}
                      style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'transparent' }}
                    />
                  </div>

                  <select
                    value={prodFilterStatusSelect}
                    onChange={(e) => setProdFilterStatusSelect(e.target.value)}
                    style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', color: '#334155', outline: 'none' }}
                  >
                    <option value="All">Status: All</option>
                    <option value="OPEN">OPEN</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <button
                    onClick={() => { setProdSearchQueryText(''); setProdFilterDateVal(''); setProdFilterStatusSelect('All'); }}
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

              {/* 3. STATUS SUB-TABS ROW (EXACT MATCH FOR PURCHASE ORDERS SCREENSHOT) */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '20px', padding: '4px 0', alignItems: 'center', flexWrap: 'wrap' }}>
                {pageConfig.tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setProdActiveSubTab(tab.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: '10px 4px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: prodActiveSubTab === tab.id ? '#2563eb' : '#64748b',
                      borderBottom: prodActiveSubTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
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

              {/* 4. MAIN DATA TABLE (EXACT MATCH FOR PI & PO DESIGN) */}
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
                          const isRight = h.includes('Total') || h.includes('Value') || h.includes('Rate') || h.includes('Amount');
                          let colWidth = 'auto';
                          let minColWidth = '140px';
                          if (i === 0) { colWidth = '150px'; minColWidth = '150px'; }
                          else if (i === 1) { minColWidth = '220px'; }
                          else if (h === 'Status' || h === 'Fulfillment Status' || h === 'Dispatch Packing Status') { colWidth = '160px'; minColWidth = '160px'; }
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
                      {(() => {
                        const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
                        const indexOfLastRow = currentPage * rowsPerPage;
                        const indexOfFirstRow = indexOfLastRow - rowsPerPage;
                        const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);

                        return currentRows.map((row, idx) => {
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
                                  if (activeTab === 'Invoice Management') {
                                    setViewingInvoiceModal(row);
                                    setIsEditingInvoice(false);
                                  } else if (activeTab === 'Dispatch Orders') {
                                    setQuickPreviewRecord(row);
                                  } else if (activeTab === 'BOM' || activeTab === 'BOM Orders' || activeTab === 'BOM / Routing') {
                                    const isDraftOrPending = ['Draft', 'Pending Confirmation', 'Edited / Pending Confirmation', 'Cancelled & Reissued to Dispatch', 'ACTIVE', 'Active', 'Pending Verification', 'Pending'].includes(row.status);
                                    setConfirmingBomModal({ ...row, isEditMode: isDraftOrPending });
                                  } else {
                                    setQuickPreviewRecord(row);
                                  }
                                }}
                                style={{ padding: '12px 14px', fontWeight: 'bold', color: '#2563EB', cursor: 'pointer' }}
                              >
                                {row.code}
                              </td>
                              <td
                                onClick={() => {
                                  if (activeTab === 'Invoice Management') {
                                    setViewingInvoiceModal(row);
                                    setIsEditingInvoice(false);
                                  } else if (activeTab === 'Dispatch Orders') {
                                    setQuickPreviewRecord(row);
                                  } else if (activeTab === 'BOM' || activeTab === 'BOM Orders' || activeTab === 'BOM / Routing') {
                                    const isDraftOrPending = ['Draft', 'Pending Confirmation', 'Edited / Pending Confirmation', 'Cancelled & Reissued to Dispatch', 'ACTIVE', 'Active', 'Pending Verification', 'Pending'].includes(row.status);
                                    setConfirmingBomModal({ ...row, isEditMode: isDraftOrPending });
                                  } else {
                                    setQuickPreviewRecord(row);
                                  }
                                }}
                                style={{ padding: '12px 14px', fontWeight: '600', color: '#1E293B', cursor: 'pointer' }}
                              >
                                {row.c2 || row.name}
                              </td>
                              <td style={{ padding: '12px 14px', color: '#64748B' }}>{row.c3 || row.date1}</td>
                              <td style={{ padding: '12px 14px', color: '#64748B' }}>{row.c4 || row.date2}</td>
                              {row.c5 !== undefined && <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0F172A', textAlign: row.c5?.toString()?.includes('₹') ? 'right' : 'left' }}>{row.c5 || row.value}</td>}
                              {row.c6 !== undefined && activeTab !== 'Customer Management' && (
                                <td style={{ padding: '12px 14px', color: '#475569' }}>
                                  {activeTab === 'Invoice Management' ? (
                                    <span style={{
                                      backgroundColor: (row.c6 === 'Ready' || row.c6 === 'Ready for Payment' || row.c6 === 'Paid') ? '#DCFCE7' : '#FEF3C7',
                                      color: (row.c6 === 'Ready' || row.c6 === 'Ready for Payment' || row.c6 === 'Paid') ? '#166534' : '#B45309',
                                      padding: '4px 10px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      {row.c6}
                                    </span>
                                  ) : (
                                    row.c6
                                  )}
                                </td>
                              )}
                              {(pageConfig.headers.includes('Status') || pageConfig.headers.includes('Dispatch Packing Status') || pageConfig.headers.includes('Fulfillment Status')) && (
                                <td style={{ padding: '12px 14px', textAlign: 'left' }}>
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                    <StatusBadge status={row.status} size="sm" />
                                    {row.packingProgressText && (
                                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', paddingLeft: '2px', whiteSpace: 'nowrap' }}>
                                        {row.packingProgressText}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* 4. PAGINATION FOOTER EXACT MATCHING PI & PO DESIGN RULES */}
                {filteredRows.length > 0 && (() => {
                  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
                  const indexOfLastRow = currentPage * rowsPerPage;
                  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', fontSize: '13px', color: '#64748B', borderTop: '1px solid #F1F5F9', backgroundColor: '#FFFFFF' }}>
                      {/* Left Side: Rows per page selector + Showing X to Y of Z entries */}
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
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                        <span>Showing {filteredRows.length === 0 ? 0 : indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredRows.length)} of {filteredRows.length} entries</span>
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
                            id="bom-goto-page-input"
                            style={{ width: '42px', height: '32px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}
                          />
                          <button
                            onClick={() => {
                              const val = parseInt(document.getElementById('bom-goto-page-input')?.value || '1', 10);
                              if (val >= 1 && val <= totalPages) setCurrentPage(val);
                            }}
                            style={{ height: '32px', padding: '0 10px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#0E7490', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Go &rsaquo;
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Floating Selection Toolbar with interactive More Actions menu */}
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
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '4px', paddingRight: '6px' }}>
                    <strong style={{ color: '#0F172A', fontSize: '14px' }}>{selectedRows.length}</strong> Selected
                  </span>

                  {userRole !== 'CEO' && userRole !== 'MD' && userRole !== 'Managing Director' && activeTab !== 'Invoice Management' && (() => {
                    const firstCode = selectedRows[0];
                    const targetRow = (filteredRows || []).find(r => r.code === firstCode || r.id === firstCode || r.bomCode === firstCode) || { code: firstCode };
                    const isCancelledRow = Boolean(
                      targetRow && (
                        targetRow.cancelled ||
                        targetRow.status === 'CANCELLED' ||
                        targetRow.status === 'Cancelled' ||
                        targetRow.status === 'Cancelled & Stock Restored' ||
                        (typeof targetRow.status === 'string' && targetRow.status.toLowerCase().includes('cancel'))
                      )
                    );

                    return (
                      <button
                        onClick={() => {
                          if (selectedRows.length > 1) {
                            alert('You cannot edit multiple items at once.');
                          } else if (selectedRows.length === 1) {
                            if (activeTab === 'BOM' || activeTab === 'BOM Orders' || activeTab === 'BOM / Routing') {
                              setConfirmingBomModal(isCancelledRow ? { ...targetRow, isEditMode: false } : { ...targetRow, isEditMode: true });
                            } else if (activeTab === 'Vendor Directory' || activeTab === 'Vendor Management') {
                              setEditingVendor(targetRow);
                            } else if (activeTab === 'Customer Management') {
                              setEditingCustomer({ ...targetRow, originalCode: targetRow.code });
                              setCustFormName(targetRow.code);
                              setCustFormCompany(targetRow.c2 || targetRow.code);
                              setCustFormGstNo(targetRow.gstNo || '33AABCU9603R1ZM');
                              setCustFormMobile(targetRow.c4 || '');
                              setCustFormEmail(targetRow.c5 || '');

                              const bObj = targetRow.billingAddressObj || {};
                              const dObj = targetRow.deliveryAddressObj || {};
                              setCustFormBillingAddress(bObj.address || targetRow.c6 || targetRow.billingAddress || '');
                              setCustFormBillingCity(bObj.city || '');
                              setCustFormBillingState(bObj.state || '');
                              setCustFormBillingPincode(bObj.pincode || '');

                              const isSame = (targetRow.deliveryAddress === targetRow.billingAddress && Boolean(targetRow.billingAddress)) || (!targetRow.c7 && !targetRow.deliveryAddress);
                              setCustFormSameAsBilling(isSame);
                              setCustFormDeliveryAddress(dObj.address || targetRow.c7 || targetRow.deliveryAddress || '');
                              setCustFormDeliveryCity(dObj.city || '');
                              setCustFormDeliveryState(dObj.state || '');
                              setCustFormDeliveryPincode(dObj.pincode || '');
                            } else if (activeTab === 'Goods Receipt Note (GRN)') {
                              resetCreateGRNForm();
                              loadPOItems(targetRow.poRef || targetRow.code);
                              if (targetRow.challanNo) setGrnChallanNo(targetRow.challanNo);
                              if (targetRow.receivedBy) setGrnReceivedBy(targetRow.receivedBy);
                              if (targetRow.inspectorName) setGrnInspectorName(targetRow.inspectorName);
                              if (targetRow.inspectionRemarks) setGrnInspectionRemarks(targetRow.inspectionRemarks);
                              setEditingGrnId(targetRow.id || targetRow.code);
                              setIsViewOnlyMode(false);
                              setShowCreateGRN(true);
                            } else if (activeTab === 'Invoice Management') {
                              setViewingInvoiceModal(targetRow);
                              setInvoiceModalActiveTab('Invoice Items');
                              setIsEditingInvoice(!isCancelledRow);
                              setInvoiceEditForm({
                                invNo: targetRow.invNo || targetRow.code || '',
                                customerName: targetRow.customerName || targetRow.vendor || 'Customer',
                                date: targetRow.date || new Date().toLocaleDateString('en-GB'),
                                paymentType: targetRow.paymentType || '100% Advance',
                                billingAddress: targetRow.billingAddress || 'Plot No 42, SIDCO Industrial Estate, Ambattur, Chennai, Tamil Nadu - 600058',
                                deliveryAddress: targetRow.deliveryAddress || targetRow.billingAddress || 'Plot No 42, SIDCO Industrial Estate, Ambattur, Chennai, Tamil Nadu - 600058',
                                items: (targetRow.items && targetRow.items.length > 0)
                                  ? targetRow.items.map(it => ({ ...it }))
                                  : [{ code: 'PRD-001', name: 'Standard Component', qty: 1, bomQty: 1, invQty: 1, rate: 1000, tax: 18, amt: 1180, selected: true }]
                              });
                            } else if (activeTab === 'Dispatch Orders') {
                              if (isCancelledRow) {
                                setDispatchPackingModal({ ...targetRow, isViewOnly: true, isReadOnly: true });
                              } else if (targetRow.status === 'Awaiting Vehicle Loading & Dispatch' || targetRow.invoiceConfirmed || targetRow.stockDeducted) {
                                setVehicleLoadingModal(targetRow);
                              } else {
                                setDispatchPackingModal(targetRow);
                              }
                            } else if (activeTab === 'Accounts Verification') {
                              setAccountsVerificationModal(targetRow);
                              setIsAccountsViewOnly(isCancelledRow ? true : false);
                            } else {
                              setConfirmingBomModal(isCancelledRow ? { ...targetRow, isEditMode: false } : { ...targetRow, isEditMode: true });
                            }
                          }
                        }}
                        style={{
                          backgroundColor: isCancelledRow ? '#FEF2F2' : '#FFFFFF',
                          border: isCancelledRow ? '1px solid #FECACA' : '1px solid #E2E8F0',
                          color: isCancelledRow ? '#DC2626' : '#1E293B',
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
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isCancelledRow ? '#FEE2E2' : '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCancelledRow ? '#FEF2F2' : '#FFFFFF'}
                      >
                        {isCancelledRow ? (
                          <>
                            <Eye size={14} style={{ color: '#DC2626' }} /> View Info (Cancelled)
                          </>
                        ) : (
                          <>
                            <Edit3 size={14} style={{ color: '#64748B' }} /> Edit Info
                          </>
                        )}
                      </button>
                    );
                  })()}

                  {canCancelBom && ['Dispatch Orders', 'Accounts Verification', 'BOM Orders', 'BOM', 'BOM / Routing'].includes(activeTab) && (() => {
                    const hasCancellable = (selectedRows || []).some(codeVal => {
                      const row = (filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || (bomStore || []).find(b => (b.bomCode || b.code || b.id) === codeVal);
                      return row && row.status !== 'Cancelled & Stock Restored';
                    });
                    if (!hasCancellable) return null;

                    return (
                      <button
                        onClick={() => {
                          const targetCode = selectedRows[0];
                          const targetBom = (filteredRows || []).find(r => r.code === targetCode || r.id === targetCode || r.bomCode === targetCode) || (bomStore || []).find(b => (b.bomCode || b.code || b.id) === targetCode);
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
                          boxShadow: '0 1px 2px rgba(220,38,38,0.08)'
                        }}
                        title="Cancel BOM and restore blocked stock back into inventory"
                      >
                        <XCircle size={14} style={{ color: '#DC2626' }} /> Cancel BOM
                      </button>
                    );
                  })()}

                  {userRole !== 'CEO' && userRole !== 'MD' && userRole !== 'Managing Director' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${selectedRows.length} selected item(s)?`)) {
                          setSelectedRows([]);
                          setSelectedVendors([]);
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
                  )}

                  {/* View Details */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedRows && selectedRows.length > 1) {
                        alert("You can't open details for multiple files at once. Please select a single item to view details.");
                        return;
                      }
                      const codeVal = (selectedRows && selectedRows.length > 0) ? selectedRows[0] : null;
                      const targetRow = codeVal
                        ? ((filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || { code: codeVal, name: `Record #${codeVal}` })
                        : (filteredRows && filteredRows[0] ? filteredRows[0] : { code: 'CR-001', name: 'Sample Record' });
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
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <Eye size={14} style={{ color: '#0E7490' }} /> View Details
                  </button>

                  {/* View Payment Details */}
                  <button
                    onClick={() => {
                      const codeVal = (selectedRows && selectedRows.length > 0) ? selectedRows[0] : null;
                      const targetRow = codeVal
                        ? ((filteredRows || []).find(r => r.code === codeVal || r.id === codeVal || r.bomCode === codeVal) || (bomStore || []).find(b => b.bomCode === codeVal))
                        : ((bomStore || [])[0] || (filteredRows || [])[0]);

                      if (targetRow) {
                        setUploadPaymentModal(targetRow);
                      } else {
                        alert('Please select a BOM order to view payment details.');
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
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <CreditCard size={14} style={{ color: '#2563EB' }} /> Payment Details
                  </button>

                  {/* Export and Print */}
                  <button
                    onClick={() => {
                      window.print();
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
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <Printer size={14} style={{ color: '#059669' }} /> Export &amp; Print
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRows([]);
                      setSelectedVendors([]);
                      setShowFloatingMoreMenu(false);
                    }}
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
                      borderRadius: '6px'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {quickPreviewRecord && (
                <div
                  onClick={() => setQuickPreviewRecord(null)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.45)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    zIndex: 20000,
                    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
                  }}
                >
                  {/* Right-Side Slide-Over Drawer Panel */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      backgroundColor: '#FFFFFF',
                      width: '580px',
                      maxWidth: '92vw',
                      height: '100vh',
                      overflowY: 'auto',
                      boxShadow: '-12px 0 40px rgba(15, 23, 42, 0.2)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                      boxSizing: 'border-box',
                      animation: 'slideInRight 0.25s ease-out'
                    }}
                  >
                    {/* Top Drawer Header matching mockup */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                          {activeTab === 'Customer Management' ? 'Customer Preview' : `${activeTab} Preview`}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px 10px', borderRadius: '14px', fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                          <ChevronDown size={14} style={{ cursor: 'pointer' }} />
                          <ChevronUp size={14} style={{ cursor: 'pointer' }} />
                          <span>1 of {(filteredRows || []).length || 1}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => {
                            const rec = quickPreviewRecord;
                            setQuickPreviewRecord(null);

                            if (activeTab === 'BOM' || activeTab === 'BOM Orders' || activeTab === 'BOM / Routing') {
                              setConfirmingBomModal({ ...rec, isEditMode: true });
                            } else if (activeTab === 'Vendor Directory' || activeTab === 'Vendor Management') {
                              handleOpenVendorDetails(rec);
                            } else if (activeTab === 'Customer Management') {
                              setViewingCustomer(rec);
                            } else if (activeTab === 'Goods Receipt Note (GRN)') {
                              resetCreateGRNForm();
                              loadPOItems(rec.poRef || rec.code);
                              setEditingGrnId(rec.id || rec.code);
                              setIsViewOnlyMode(true);
                              setShowCreateGRN(true);
                            } else if (activeTab === 'Invoice Management') {
                              setViewingInvoiceModal(rec);
                              setInvoiceModalActiveTab('Invoice Items');
                            } else if (activeTab === 'Dispatch Orders') {
                              const isRecCancelled = Boolean(rec.cancelled || rec.status === 'CANCELLED' || rec.status === 'Cancelled' || rec.status === 'Cancelled & Stock Restored' || (typeof rec.status === 'string' && rec.status.toLowerCase().includes('cancel')));
                              setDispatchPackingModal(isRecCancelled ? { ...rec, isViewOnly: true, isReadOnly: true } : rec);
                            } else if (activeTab === 'Accounts Verification') {
                              setAccountsVerificationModal(rec);
                              setIsAccountsViewOnly(true);
                            } else {
                              setConfirmingBomModal({ ...rec, isEditMode: true });
                            }
                          }}
                          style={{
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#1E293B',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                        >
                          View Full Details
                        </button>

                        {canCancelBom && ['Dispatch Orders', 'Accounts Verification', 'BOM Orders', 'BOM', 'BOM / Routing'].includes(activeTab) && quickPreviewRecord.status !== 'Cancelled & Stock Restored' && quickPreviewRecord.status !== 'CANCELLED' && !quickPreviewRecord.cancelled && (
                          <button
                            onClick={() => {
                              const rec = quickPreviewRecord;
                              handleCancelBomOrder(rec);
                              setQuickPreviewRecord(null);
                            }}
                            style={{
                              border: '1px solid #FECACA',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              padding: '6px 14px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 1px 2px rgba(220,38,38,0.08)'
                            }}
                            title="Cancel BOM and restore blocked stock back into inventory"
                          >
                            <XCircle size={14} style={{ color: '#DC2626' }} /> Cancel BOM
                          </button>
                        )}
                        <button
                          onClick={() => setQuickPreviewRecord(null)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Customer / Profile Main Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '4px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: '#ECFEFF',
                        color: '#0E7490',
                        border: '2px solid #0E7490',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: '800',
                        flexShrink: 0
                      }}>
                        {(quickPreviewRecord.c2 || quickPreviewRecord.code || 'CR').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                            {quickPreviewRecord.customerName || quickPreviewRecord.companyName || quickPreviewRecord.c2 || quickPreviewRecord.name || 'Customer'}
                          </h3>
                          <StatusBadge status={quickPreviewRecord.status || quickPreviewRecord.c4 || 'Active'} size="sm" />
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                          Ref Code: <strong style={{ color: '#0E7490' }}>{quickPreviewRecord.bomCode || quickPreviewRecord.code || quickPreviewRecord.id || '—'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* 4 Stat Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          REF CODE
                        </span>
                        <strong style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800', lineHeight: '1.2' }}>
                          {quickPreviewRecord.bomCode || quickPreviewRecord.code || '—'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          STATUS
                        </span>
                        <strong style={{ fontSize: '13px', color: '#0E7490', fontWeight: '800', lineHeight: '1.2' }}>
                          {quickPreviewRecord.status || quickPreviewRecord.c4 || 'Pending'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          TOTAL ITEMS
                        </span>
                        <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', lineHeight: '1.2' }}>
                          {(quickPreviewRecord.items || quickPreviewRecord.materials || []).length || 0}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          ORDER VALUE
                        </span>
                        <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', lineHeight: '1.2' }}>
                          {quickPreviewRecord.grandTotal ? `₹ ${Number(quickPreviewRecord.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : (quickPreviewRecord.c5 || quickPreviewRecord.value || '—')}
                        </strong>
                      </div>
                    </div>

                    {/* Customer & Order Details Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                        Record Details
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Customer Name</span>
                          <strong style={{ color: '#0F172A' }}>{quickPreviewRecord.customerName || quickPreviewRecord.companyName || quickPreviewRecord.c2 || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Order Date</span>
                          <strong style={{ color: '#0F172A' }}>{quickPreviewRecord.date || quickPreviewRecord.c3 || quickPreviewRecord.date1 || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Mode of Transport</span>
                          <strong style={{ color: '#0F172A' }}>{quickPreviewRecord.transportMode || quickPreviewRecord.c4 || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Transport Name</span>
                          <strong style={{ color: '#0F172A' }}>{quickPreviewRecord.transporterName || quickPreviewRecord.c5 || '—'}</strong>
                        </div>
                        {quickPreviewRecord.vehicleNo ? (
                          <div>
                            <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Vehicle Number</span>
                            <strong style={{ color: '#0284C7' }}>{quickPreviewRecord.vehicleNo}</strong>
                          </div>
                        ) : null}
                        {quickPreviewRecord.lrNo || quickPreviewRecord.lrNumber ? (
                          <div>
                            <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>LR / Docket No.</span>
                            <strong style={{ color: '#0284C7' }}>{quickPreviewRecord.lrNo || quickPreviewRecord.lrNumber}</strong>
                          </div>
                        ) : null}
                        <div>
                          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Accounts Approval</span>
                          <span style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '10px', fontSize: '10.5px', fontWeight: '800' }}>
                            • {quickPreviewRecord.isAccountsDone ? 'Verified' : (quickPreviewRecord.status || 'Pending Verification')}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', marginBottom: '2px' }}>Shipping Address</span>
                          <strong style={{ color: '#0F172A' }}>{quickPreviewRecord.deliveryAddress || quickPreviewRecord.shippingAddress || quickPreviewRecord.billingAddress || '—'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Active Dispatch & Itemized Product Checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                          Itemized Product & BOM Checklist
                        </h4>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#0E7490' }}>
                          {(quickPreviewRecord.items || quickPreviewRecord.materials || []).length} Item(s)
                        </span>
                      </div>
                      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                                <th style={{ padding: '8px 10px', width: '30px' }}>#</th>
                                <th style={{ padding: '8px 10px' }}>Product Item</th>
                                <th style={{ padding: '8px 10px', textAlign: 'center' }}>UOM</th>
                                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {((quickPreviewRecord.items || quickPreviewRecord.materials || []).length > 0
                                ? (quickPreviewRecord.items || quickPreviewRecord.materials)
                                : [{ name: quickPreviewRecord.productName || quickPreviewRecord.c2 || 'BOM Material Kit', uom: 'NOS', qty: 1, rate: parseFloat(quickPreviewRecord.grandTotal || quickPreviewRecord.value || 0) }]
                              ).map((it, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '8px 10px', color: '#94A3B8', fontWeight: '700' }}>{idx + 1}</td>
                                  <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0F172A' }}>{it.name || '—'}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>{it.uom || it.unit || 'NOS'}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '800', color: '#0E7490' }}>{it.qty || 1}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600', color: '#0F172A' }}>₹ {Number(it.rate || 0).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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
                                  onClick={() => setActiveMediaPreviewModal({ type: 'image', url: ph.dataUrl, name: ph.name || `Photo ${pIdx + 1}` })}
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
                                  onClick={() => setActiveMediaPreviewModal({ type: 'video', url: vd.dataUrl, name: vd.name || `Video ${vIdx + 1}` })}
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

                    {/* PAYMENT DETAILS SUMMARY CARD */}
                    {(() => {
                      const proofObj = uploadPaymentModal.paymentProofDoc || uploadPaymentModal.payments?.proofDocObj;
                      const hasProof = Boolean(proofObj || uploadPaymentModal.payments?.proofDoc);
                      const proofName = typeof proofObj === 'object' ? proofObj?.name : (uploadPaymentModal.payments?.proofDoc || proofObj);
                      const proofData = typeof proofObj === 'object' ? proofObj?.dataUrl : uploadPaymentModal.payments?.proofDocData;
                      const isImage = proofData && proofData.startsWith('data:image/');

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

                          {/* UPLOADED ATTACHMENT DISPLAY */}
                          {hasProof ? (
                            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>Payment Proof Document:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px 14px' }}>
                                {isImage ? (
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
                                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>
                                    {typeof proofObj === 'object' && proofObj?.size ? proofObj.size : 'Attached Document'} • Verified
                                  </span>
                                </div>
                                {proofData ? (
                                  <button
                                    onClick={() => {
                                      const win = window.open('');
                                      if (win) {
                                        if (proofData.startsWith('data:image/')) {
                                          win.document.write(`<!DOCTYPE html><html><head><title>${proofName || 'Payment Proof'}</title></head><body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${proofData}" style="max-width:95vw;max-height:95vh;object-fit:contain;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border-radius:12px;"/></body></html>`);
                                        } else {
                                          win.location.href = proofData;
                                        }
                                      }
                                    }}
                                    style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '6px 12px', borderRadius: '8px', border: '1px solid #BFDBFE', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Eye size={13} /> View File
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: '6px' }}>
                                    Attached
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* IF NO PROOF DOCUMENT HAS BEEN UPLOADED YET */
                            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#B45309' }}>Upload Payment Proof File:</span>
                              <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Payment Stage</label>
                                <select
                                  value={paymentStageType}
                                  onChange={(e) => setPaymentStageType(e.target.value)}
                                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', color: '#0F172A', outline: 'none' }}
                                >
                                  {uploadPaymentModal.paymentType === '50% Advance + 50% Dispatch' ? (
                                    <>
                                      <option value="50% Advance">Stage 1: 50% Advance Payment</option>
                                      <option value="50% Dispatch">Stage 2: 50% Dispatch Payment</option>
                                    </>
                                  ) : uploadPaymentModal.paymentType === 'Net 30 Days' ? (
                                    <option value="Net 30 Days">Net 30 Days Credit Payment</option>
                                  ) : (
                                    <option value="100% Advance">100% Full Advance Payment</option>
                                  )}
                                </select>
                              </div>

                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => {
                                  const f = e.target.files && e.target.files[0];
                                  if (f) {
                                    const reader = new FileReader();
                                    reader.onload = (loadEvt) => {
                                      setPaymentProofFile({
                                        name: f.name,
                                        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
                                        dataUrl: loadEvt.target.result,
                                        uploadedAt: new Date().toISOString()
                                      });
                                    };
                                    reader.readAsDataURL(f);
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
                      {!(uploadPaymentModal.paymentProofDoc || uploadPaymentModal.payments?.proofDocObj || uploadPaymentModal.payments?.proofDoc) ? (
                        <>
                          <button
                            onClick={() => setUploadPaymentModal(null)}
                            style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
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
                              alert(`✅ Payment details for (${paymentStageType}) uploaded and recorded successfully!`);
                            }}
                            style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Record Payment
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setUploadPaymentModal(null)}
                          style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Close Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── UPDATE PAYMENT MODAL (Only for Partial Payment & Credit Payment - One-Time Lock) ─── */}
              {updatePaymentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: "'DM Sans', sans-serif" }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', maxWidth: '520px', width: '92%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CreditCard style={{ width: '20px', height: '20px' }} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Update Payment Details</h3>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{updatePaymentModal.bomCode} — {updatePaymentModal.paymentType}</span>
                        </div>
                      </div>
                      <button onClick={() => setUpdatePaymentModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}><X style={{ width: '18px', height: '18px' }} /></button>
                    </div>

                    <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#166534', lineHeight: '1.4' }}>
                      <div><strong>Customer:</strong> {updatePaymentModal.customerName}</div>
                      <div><strong>Order Total:</strong> ₹{parseFloat(updatePaymentModal.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      {updatePaymentModal.creditDays && (
                        <div style={{ marginTop: '4px', color: '#6D28D9' }}>
                          <strong>Credit Term:</strong> {updatePaymentModal.creditDays} Days (Due: {updatePaymentModal.creditDueDate || 'Within 7 Days'})
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Upload Payment Slip / Bank Receipt <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (f) {
                            compressAndSaveFile(f, (res) => {
                              if (res) {
                                if (res.name && res.dataUrl) saveMediaToCache(res.name, res.dataUrl);
                                setUpdatePaymentFile(res);
                              }
                            });
                          }
                        }}
                        style={{ width: '100%', padding: '10px', border: '1px dashed #CBD5E1', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                      {updatePaymentFile && (
                        <span style={{ fontSize: '11px', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                          <CheckCircle style={{ width: '12px', height: '12px' }} /> Selected: {updatePaymentFile.name} ({updatePaymentFile.size})
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Payment Reference / Notes</label>
                      <textarea
                        rows={2}
                        value={updatePaymentNotes}
                        onChange={(e) => setUpdatePaymentNotes(e.target.value)}
                        placeholder="Enter transaction UTR / receipt reference (optional)..."
                        style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '10px', fontSize: '12px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                      <span><strong>Permanent Lock:</strong> Once updated, payment details cannot be re-updated. The menu option will be locked permanently.</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                      <button
                        onClick={() => setUpdatePaymentModal(null)}
                        style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!updatePaymentFile) {
                            alert('Please select or upload payment slip file!');
                            return;
                          }
                          const updatedDoc = {
                            name: updatePaymentFile.name,
                            size: updatePaymentFile.size || `${(updatePaymentFile.size / (1024 * 1024)).toFixed(2)} MB`,
                            type: updatePaymentFile.type,
                            dataUrl: updatePaymentFile.dataUrl || null,
                            uploadedAt: new Date().toISOString(),
                            notes: updatePaymentNotes
                          };
                          if (updatedDoc.name && updatedDoc.dataUrl) {
                            saveMediaToCache(updatedDoc.name, updatedDoc.dataUrl);
                          }
                          setBomStore(prev => prev.map(b => b.bomCode === updatePaymentModal.bomCode ? {
                            ...b,
                            status: 'Payment Uploaded & Settled',
                            paymentUpdated: true,
                            paymentUpdatedDate: new Date().toISOString(),
                            paymentProofDoc: updatedDoc,
                            payments: {
                              ...b.payments,
                              proofDoc: updatePaymentFile.name,
                              proofDocObj: updatedDoc,
                              proofDocData: updatedDoc.dataUrl,
                              paymentUpdated: true
                            }
                          } : b));
                          setUpdatePaymentModal(null);
                          alert(`✅ Payment details for (${updatePaymentModal.bomCode}) successfully recorded and locked!`);
                        }}
                        style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 4px rgba(5,150,105,0.2)' }}
                      >
                        Record & Lock Payment Details
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── RE-UPLOAD ADDRESS PROOF MODAL ─── */}
              {reuploadAddressProofModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: "'DM Sans', sans-serif" }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', maxWidth: '520px', width: '92%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <RotateCcw style={{ width: '20px', height: '20px' }} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Re-upload Address Proof</h3>
                          <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: '700' }}>Invoice Desk Action Required</span>
                        </div>
                      </div>
                      <button onClick={() => setReuploadAddressProofModal(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}><X style={{ width: '18px', height: '18px' }} /></button>
                    </div>

                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#991B1B', lineHeight: '1.5' }}>
                      <div><strong>BOM Reference:</strong> {reuploadAddressProofModal.bomCode}</div>
                      <div><strong>Customer:</strong> {reuploadAddressProofModal.customerName}</div>
                      <div><strong>Delivery Destination:</strong> {reuploadAddressProofModal.deliveryAddress}</div>
                      {reuploadAddressProofModal.reuploadRequestedAt && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: '#DC2626', fontWeight: '800' }}>
                          Requested on: {new Date(reuploadAddressProofModal.reuploadRequestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Select Verified Address Proof File (PDF / Image) <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (f) {
                            compressAndSaveFile(f, (res) => {
                              if (res) {
                                setReuploadProofFile(res);
                              }
                            });
                          }
                        }}
                        style={{ width: '100%', padding: '10px', border: '1px dashed #CBD5E1', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                      {reuploadProofFile && (
                        <span style={{ fontSize: '11px', color: '#166534', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                          <CheckCircle style={{ width: '12px', height: '12px' }} /> Selected: {reuploadProofFile.name} ({reuploadProofFile.size})
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                      <button
                        onClick={() => setReuploadAddressProofModal(null)}
                        style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!reuploadProofFile) {
                            alert('Please select or upload the verified address proof file!');
                            return;
                          }
                          const targetCode = reuploadAddressProofModal.bomCode;
                          const reuploadedTime = new Date().toISOString();
                          const newDoc = {
                            name: reuploadProofFile.name,
                            size: reuploadProofFile.size,
                            type: reuploadProofFile.type,
                            dataUrl: reuploadProofFile.dataUrl,
                            uploadedAt: reuploadedTime
                          };
                          if (newDoc.name && newDoc.dataUrl) {
                            saveMediaToCache(newDoc.name, newDoc.dataUrl);
                          }

                          setBomStore(prev => prev.map(b => (b.bomCode === targetCode || b.code === targetCode) ? {
                            ...b,
                            status: 'Pending Verification for Invoice',
                            addressProofStatus: 'Pending Verification for Invoice',
                            deliveryAddressProofDoc: {
                              ...newDoc,
                              history: [...((b.deliveryAddressProofDoc?.history) || (b.deliveryAddressProofDoc ? [b.deliveryAddressProofDoc] : [])), newDoc]
                            },
                            addressProofReuploadRequested: false,
                            addressProofReuploaded: true,
                            addressProofReuploadedAt: reuploadedTime
                          } : b));

                          setInvoiceList(prev => prev.map(i => (i.poNo === targetCode || i.invNo === targetCode || i.code === targetCode) ? {
                            ...i,
                            status: 'Pending Address Proof',
                            addressProofStatus: 'Pending Verification for Invoice',
                            deliveryAddressProofDoc: {
                              ...newDoc,
                              history: [...((i.deliveryAddressProofDoc?.history) || (i.deliveryAddressProofDoc ? [i.deliveryAddressProofDoc] : [])), newDoc]
                            },
                            addressProofReuploadRequested: false,
                            addressProofReuploadedAt: reuploadedTime
                          } : i));

                          setReuploadAddressProofModal(null);
                          alert(`✅ Verified address proof attached for BOM (${targetCode}) and synced with Invoice Desk!`);
                        }}
                        style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}
                      >
                        Submit Verified Address Proof
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        } catch (err) {
          console.error('Render error in section 14:', err);
          return (
            <div style={{ padding: '24px', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FCA5A5', color: '#991B1B' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Error rendering view: {activeTab}</h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px' }}>{err?.message || 'An unexpected rendering error occurred.'}</p>
            </div>
          );
        }
      })()}



      {/* Delete GRN Confirmation Modal Popup */}
      {grnToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '90%',
            maxWidth: '440px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertCircle style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Delete Goods Receipt Note</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  Are you sure you want to permanently delete <strong style={{ color: '#0F172A' }}>{grnToDelete}</strong>?
                </p>
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              fontSize: '12px',
              color: '#B45309',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>This action cannot be undone. Cumulative received quantities on the associated Purchase Order will be restored.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setGrnToDelete(null)}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteGRN}
                style={{
                  height: '38px',
                  padding: '0 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MANDATORY VALIDATION MODAL */}
      {grnValidationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', width: '460px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>{grnValidationModal.title || 'Mandatory Fields Required'}</h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>Please complete all required fields to move forward.</p>
              </div>
            </div>
            {grnValidationModal.fields ? (
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>You did not fill out the following mandatory box(es):</span>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#DC2626', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {grnValidationModal.fields.map((field, idx) => (
                    <li key={idx}><strong>{field}</strong></li>
                  ))}
                </ul>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 16px', fontSize: '13px', color: '#DC2626', fontWeight: '500' }}>
                {grnValidationModal.message}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                onClick={() => setGrnValidationModal(null)}
                style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}
              >
                OK, I'll fill it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CLOSE INVOICE REASON MODAL */}
      {closeInvoiceReasonModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', width: '520px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Close Invoice Without Full Delivery</h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                  Invoice: <strong style={{ color: '#0F172A' }}>{closeInvoiceReasonModal.invNo || closeInvoiceReasonModal.code}</strong>
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>You are closing this invoice without delivering the pending/missing products. A mandatory justification reason is required to close this invoice.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                Why are you closing this invoice without sending the product? <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                value={closeReasonText}
                onChange={(e) => setCloseReasonText(e.target.value)}
                placeholder="Specify reason (e.g., Customer cancelled missing items / Short supply agreed / Refund issued)..."
                rows={4}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setCloseInvoiceReasonModal(null);
                  setCloseReasonText('');
                }}
                style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!closeReasonText.trim()}
                onClick={() => {
                  if (!closeReasonText.trim()) return;
                  setInvoiceList(prev => prev.map(invItem => (invItem.invNo === closeInvoiceReasonModal.invNo || invItem.code === closeInvoiceReasonModal.code) ? {
                    ...invItem,
                    status: 'CLOSED',
                    closeReason: closeReasonText,
                    pay: 'Closed (No Pending)'
                  } : invItem));
                  alert(`✅ Invoice ${closeInvoiceReasonModal.invNo || closeInvoiceReasonModal.code} successfully CLOSED with reason recorded.`);
                  setCloseInvoiceReasonModal(null);
                  setCloseReasonText('');
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: closeReasonText.trim() ? '#DC2626' : '#94A3B8',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: closeReasonText.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: closeReasonText.trim() ? '0 2px 4px rgba(220,38,38,0.25)' : 'none'
                }}
              >
                Confirm Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN CREATE DC FOR PENDING VIEW */}
      {pendingDcModal && (() => {
        const inv = pendingDcModal;
        const invNoText = inv.invNo || inv.code || 'INV-2026-102';
        const bomRefText = inv.poNo || inv.c3 || 'BOM-102';
        const customerText = inv.vendor || inv.c2 || 'Customer';

        // Look up matching BOM
        const matchingBom = bomStore.find(b =>
          b.bomCode === inv.poNo ||
          b.bomCode === inv.code ||
          b.bomCode === inv.c3 ||
          (b.salesOrderNo && (b.salesOrderNo === inv.poNo || b.salesOrderNo === inv.c3))
        );

        // Derive unpacked items from invoice items or matchingBom
        const rawItems = (inv.items && inv.items.length > 0)
          ? inv.items
          : (matchingBom && matchingBom.items && matchingBom.items.length > 0)
            ? matchingBom.items
            : [
              { code: 'PRD-002', name: 'Mini Rail 100 mm', desc: 'Aluminum Mounting Rail', uom: 'Nos', qty: 12, rate: 250, selected: false }
            ];

        // Filter unpacked items (selected === false or packed === false)
        const unpackedItemsList = rawItems.filter((it, idx) => {
          if (it.selected === false) return true;
          if (matchingBom && matchingBom.dispatchPacking && matchingBom.dispatchPacking[idx]) {
            return matchingBom.dispatchPacking[idx].packed === false;
          }
          return false;
        });

        const itemsListToRender = unpackedItemsList.length > 0 ? unpackedItemsList : rawItems;

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#F8FAFC', zIndex: 99999, overflowY: 'auto', padding: '24px', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Bar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={() => setPendingDcModal(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                >
                  <ChevronLeft style={{ width: '16px', height: '16px' }} /> Back to Invoices
                </button>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Create Delivery Challan (DC) for Pending Items
                  </h1>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                    Invoice Ref: <strong style={{ color: '#2563EB' }}>{invNoText}</strong> | BOM Ref: <strong style={{ color: '#4F46E5' }}>{bomRefText}</strong> | Customer: <strong>{customerText}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setPendingDcModal(null)}
                  style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', height: '40px', padding: '0 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    // Update invoice items state to marked as included in DC & close invoice
                    setInvoiceList(prev => prev.map(invItem => (invItem.invNo === inv.invNo || invItem.code === inv.code) ? {
                      ...invItem,
                      status: 'CLOSED',
                      pay: 'Fully Dispatched & Closed',
                      items: (invItem.items || []).map(it => ({ ...it, selected: true }))
                    } : invItem));

                    // Update corresponding BOM status to 'Closed' in bomStore and mark dispatchPacking items packed
                    const targetPoNo = inv.poNo || inv.invNo || inv.code;
                    const targetPoNum = targetPoNo ? targetPoNo.replace(/[^0-9]/g, '') : '';

                    setBomStore(prev => prev.map(b => {
                      const bNum = b.bomCode ? b.bomCode.replace(/[^0-9]/g, '') : '';
                      const isMatch = b.bomCode === targetPoNo ||
                        b.bomCode === inv.invNo ||
                        b.bomCode === inv.poNo ||
                        b.bomCode === inv.code ||
                        (b.salesOrderNo && (b.salesOrderNo === inv.poNo || b.salesOrderNo === inv.c3)) ||
                        (targetPoNum && bNum && bNum === targetPoNum);

                      if (isMatch) {
                        const updatedDispatch = (b.dispatchPacking && b.dispatchPacking.length > 0)
                          ? b.dispatchPacking.map(p => ({ ...p, packed: true }))
                          : (b.items || []).map(it => ({ name: it.name || it.c2 || 'Item', bomQty: it.qty || 1, packed: true }));

                        return {
                          ...b,
                          status: 'Closed',
                          dispatchPacking: updatedDispatch
                        };
                      }
                      return b;
                    }));

                    alert(`🚚 Delivery Challan (DC) Generated successfully! Pending items dispatched for ${invNoText}. Dispatch status updated to CLOSED.`);
                    setPendingDcModal(null);
                  }}
                  style={{ border: 'none', backgroundColor: '#4F46E5', color: '#FFFFFF', height: '40px', padding: '0 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 4px rgba(79,70,229,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Truck style={{ width: '16px', height: '16px' }} />
                  Generate DC & Complete Dispatch
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Pending Items Count</span>
                <div style={{ fontSize: '18px', color: '#DC2626', marginTop: '6px', fontWeight: '800' }}>{itemsListToRender.length} Items Pending</div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Delivery Location</span>
                <div style={{ fontSize: '13px', color: '#0F172A', marginTop: '6px', fontWeight: '600' }}>{inv.deliveryAddress || 'Factory Site - Plot 14, Phase II'}</div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>DC Dispatch Status</span>
                <div style={{ fontSize: '13px', color: '#4F46E5', marginTop: '6px', fontWeight: '800' }}>Subsequent Partial Delivery DC</div>
              </div>
            </div>

            {/* Professional Delivery Challan (DC) Document Template & Form */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #4F46E5', paddingBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#4F46E5', letterSpacing: '-0.5px' }}>DELIVERY CHALLAN</div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>Subsequent Partial Goods Dispatch Document</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Issued under Rule 55 of CGST Rules, 2017</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>DC No: <span style={{ color: '#4F46E5' }}>DC-{invNoText.replace('INV-', '')}</span></div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Date: <strong>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Invoice Ref: <strong>{invNoText}</strong> | Sales BOM: <strong>{bomRefText}</strong></div>
                </div>
              </div>

              {/* Consignor & Consignee Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                {/* Consignor (From) */}
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CONSIGNOR (DISPATCH FROM)</span>
                  <h4 style={{ margin: '4px 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>ControlRoom Industrial Corp Ltd</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                    Plot 14, Phase II, Industrial Complex<br />
                    Nagappa Estate, Puzhal, Chennai - 600066<br />
                    <strong>GSTIN:</strong> 33AAAAA0000A1Z5 | <strong>State Code:</strong> 33
                  </p>
                </div>

                {/* Consignee (Ship To) */}
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CONSIGNEE (DELIVER TO)</span>
                  <h4 style={{ margin: '4px 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#2563EB' }}>{customerText}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                    {inv.deliveryAddress || 'No 1427, GNT Road, Nagappa Industrial Estate, Puzhal, Chennai'}<br />
                    <strong>GSTIN:</strong> {inv.gstin || '33BBBBB1111B1Z2'} | <strong>State Code:</strong> 33
                  </p>
                </div>
              </div>

              {/* Transporter & Shipping Info Input Form */}
              <div style={{ backgroundColor: '#EEF2FF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #C7D2FE' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Truck style={{ width: '14px', height: '14px' }} /> Transport & Movement Information (DC Shipping Details)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Transporter Name</label>
                    <input
                      type="text"
                      defaultValue="VRL Logistics Ltd."
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', backgroundColor: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Vehicle Number</label>
                    <input
                      type="text"
                      defaultValue="TN-09-CB-4890"
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', backgroundColor: 'white', fontWeight: '700', textTransform: 'uppercase' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Lorry Receipt (LR) No.</label>
                    <input
                      type="text"
                      defaultValue="LR-2026-9812"
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', backgroundColor: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>Mode of Transport</label>
                    <select style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', backgroundColor: 'white' }}>
                      <option>Road Transport</option>
                      <option>Rail Freight</option>
                      <option>Air Express</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pending Items Table Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Challan Goods Description (Pending Items to Dispatch)</h3>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Select items included in this Delivery Challan shipment.</span>
                  </div>

                  <button
                    onClick={() => window.print()}
                    style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#334155', height: '34px', padding: '0 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer style={{ width: '14px', height: '14px', color: '#475569' }} /> Print DC Template
                  </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', color: '#475569', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>Include</th>
                        <th style={{ padding: '12px' }}>Product Code</th>
                        <th style={{ padding: '12px' }}>Goods Description</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>HSN Code</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>UOM</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Challan Qty</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Rate (₹)</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Taxable Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsListToRender.map((it, idx) => {
                        const qty = it.qty || it.bomQty || 12;
                        const rate = it.rate || 250;
                        const val = qty * rate;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                defaultChecked={true}
                                style={{ accentColor: '#4F46E5', width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#475569' }}>{it.code || `PRD-00${idx + 2}`}</td>
                            <td style={{ padding: '12px', fontWeight: '700', color: '#0F172A' }}>{it.name}</td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#64748B' }}>76109090</td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#64748B' }}>{it.uom || 'Nos'}</td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '800', color: '#4F46E5' }}>{qty} Nos</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>₹ {parseFloat(rate).toFixed(2)}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: '#0F172A' }}>
                              ₹ {val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ backgroundColor: '#F8FAFC', fontWeight: '800' }}>
                        <td colSpan={7} style={{ padding: '12px', textAlign: 'right', color: '#0F172A' }}>Total Goods Value for DC</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#4F46E5', fontSize: '14px' }}>
                          ₹ {itemsListToRender.reduce((acc, it) => acc + ((it.qty || it.bomQty || 12) * (it.rate || 250)), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Declaration & Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '16px', fontSize: '11px', color: '#64748B' }}>
                <div>
                  <strong>Declaration:</strong>
                  <p style={{ margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    We declare that this Delivery Challan is issued for subsequent transportation of goods not by way of supply. The goods described above are being transported under Rule 55 of CGST Rules, 2017.
                  </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '60px' }}>
                  <strong>For ControlRoom Industrial Corp Ltd</strong>
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>Authorised Signatory</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── CONFIRM INVOICE SUCCESS MODAL WITH STOCK DEDUCTION NOTICE ─── */}
      {confirmInvoiceSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', width: '560px', maxWidth: '95%', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534', flexShrink: 0, boxShadow: '0 4px 10px rgba(22,101,52,0.15)' }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Invoice Confirmed & Stock Reduced!</h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
                  Invoice: <strong style={{ color: '#2563EB' }}>{typeof confirmInvoiceSuccessModal === 'object' ? confirmInvoiceSuccessModal.invNo : confirmInvoiceSuccessModal}</strong> • BOM: <strong style={{ color: '#4F46E5' }}>{typeof confirmInvoiceSuccessModal === 'object' ? confirmInvoiceSuccessModal.bomCode : 'BOM'}</strong>
                </p>
              </div>
            </div>

            {/* Stock Reduction Banner */}
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', color: '#166534' }}>
                <Package size={16} /> Inventory Stock Reduced for Packed Items Alone
              </div>
              <div style={{ fontSize: '12px', color: '#15803D', lineHeight: '1.5' }}>
                {typeof confirmInvoiceSuccessModal === 'object' && confirmInvoiceSuccessModal.packedCount !== undefined ? (
                  <>Stock count has been automatically decremented in the inventory registry for <strong>{confirmInvoiceSuccessModal.packedCount} packed item(s)</strong>. Any unpacked items remain untouched.</>
                ) : (
                  <>Stock count has been decremented for packed items in the stock inventory registry.</>
                )}
              </div>
            </div>

            {/* Next Route Banner */}
            <div style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', color: '#4338CA' }}>
                <Truck size={16} /> Next Stage: Despatch Team Vehicle Loading
              </div>
              <div style={{ fontSize: '12px', color: '#4F46E5', lineHeight: '1.5' }}>
                Order is forwarded to the <strong>Despatch Team</strong>. The dispatch crew must record vehicle/driver details and capture <strong>loading photos and videos</strong> before the BOM flow is marked 100% completed.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setConfirmInvoiceSuccessModal(null)}
                style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#2563EB', color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}
              >
                Great, Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── VEHICLE LOADING & FINAL DISPATCH VERIFICATION MODAL ─── */}
      {vehicleLoadingModal && (() => {
        const bom = vehicleLoadingModal;
        const bCode = bom.bomCode || bom.code || 'BOM-2026';
        const invNo = bom.invoiceNo || (bom.invoiceConfirmed ? `INV-${bCode.replace('BOM-', '')}` : 'INV-2026-FINAL');
        const custName = bom.customerName || bom.companyName || bom.customer || 'Customer';
        const delAddr = bom.deliveryAddress || 'Client Delivery Site';
        const isReadOnly = Boolean(bom.isReadOnly || bom.status === 'Completed' || bom.status === 'Fully Dispatched & BOM Flow Completed' || bom.status === 'Fully Dispatched & Delivered');

        // Existing vehicle loading data if already saved
        const existingLoading = bom.vehicleLoading || {};
        const vNo = vehicleLoadingData.vehicleNo || existingLoading.vehicleNo || '';
        const dName = vehicleLoadingData.driverName || existingLoading.driverName || '';
        const dPhone = vehicleLoadingData.driverPhone || existingLoading.driverPhone || '';
        const transp = vehicleLoadingData.transporter || existingLoading.transporter || 'VRL Logistics Direct Fleet';
        const lr = vehicleLoadingData.lrNo || existingLoading.lrNo || 'LR-881204';
        const seal = vehicleLoadingData.sealNo || existingLoading.sealNo || 'SL-884920';

        const currentPhotos = loadingPhotos.length > 0 ? loadingPhotos : (existingLoading.photos || []);
        const currentVideos = loadingVideos.length > 0 ? loadingVideos : (existingLoading.videos || []);

        const packedItems = (bom.dispatchPacking && Array.isArray(bom.dispatchPacking) && bom.dispatchPacking.length > 0)
          ? bom.dispatchPacking.filter(p => Boolean(p.packed))
          : (bom.items || []).filter(i => i.selected !== false);

        const handleAddPhotoFiles = (files) => {
          if (!files || files.length === 0) return;
          Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              const newPhoto = {
                id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: file.name,
                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                dataUrl: loadEvt.target.result,
                capturedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              };
              setLoadingPhotos(prev => [...prev, newPhoto]);
            };
            reader.readAsDataURL(file);
          });
        };

        const handleAddVideoFiles = (files) => {
          if (!files || files.length === 0) return;
          Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              const newVideo = {
                id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: file.name,
                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                dataUrl: loadEvt.target.result,
                recordedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              };
              setLoadingVideos(prev => [...prev, newVideo]);
            };
            reader.readAsDataURL(file);
          });
        };

        const handleAddSamplePhoto = () => {
          // Generate an illustrative canvas snapshot for truck loading
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');

          // Background truck interior
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(0, 0, 640, 400);

          // Staged pallets & solar rails
          ctx.fillStyle = '#334155';
          ctx.fillRect(60, 160, 520, 180);
          ctx.fillStyle = '#64748B';
          ctx.fillRect(100, 100, 440, 100);

          // Straps
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(140, 80);
          ctx.lineTo(140, 340);
          ctx.moveTo(320, 80);
          ctx.lineTo(320, 340);
          ctx.moveTo(500, 80);
          ctx.lineTo(500, 340);
          ctx.stroke();

          // Header banner overlay
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, 0, 640, 60);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(`TRUCK LOADING VERIFICATION: ${bCode}`, 20, 36);
          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#86EFAC';
          ctx.fillText(`VEHICLE: ${vNo || 'TN-09-CB-4821'} • TIME: ${new Date().toLocaleTimeString()}`, 380, 36);

          const dataUrl = canvas.toDataURL('image/jpeg');
          const samplePhoto = {
            id: `photo_sample_${Date.now()}`,
            name: `Truck_Loading_LivePhoto_${Date.now().toString().slice(-4)}.jpg`,
            size: '1.4 MB',
            dataUrl: dataUrl,
            capturedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          };
          setLoadingPhotos(prev => [...prev, samplePhoto]);
        };

        const handleFinalizeVehicleLoading = () => {
          if (!isReadOnly) {
            if (!vNo) {
              alert('⚠️ Please enter the Vehicle / Lorry Registration Number before completing dispatch!');
              return;
            }
            if (currentPhotos.length === 0 && currentVideos.length === 0) {
              alert('⚠️ Verification Photo/Video Mandatory!\n\nPlease capture or upload at least one loading photo or video of the vehicle before finalizing.');
              return;
            }
          }

          const loadingPayload = {
            vehicleNo: vNo || 'TN-09-CB-4821',
            driverName: dName || 'K. Murugan',
            driverPhone: dPhone || '+91 98765 43210',
            transporter: transp,
            lrNo: lr,
            sealNo: seal,
            photos: currentPhotos,
            videos: currentVideos,
            loadedAt: new Date().toISOString(),
            loadedTimeStr: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          };

          // Update BOM status to Fully Completed & persist
          setBomStore(prev => {
            const updated = prev.map(b => (b.bomCode === bCode || b.code === bCode) ? {
              ...b,
              status: 'Completed',
              fullyCompleted: true,
              vehicleLoading: loadingPayload,
              completedAt: new Date().toISOString()
            } : b);
            try {
              saveCloudStore('bom_store', updated);
            } catch (e) { }
            return updated;
          });

          // Update Invoice status to Fully Dispatched & Delivered & persist
          setInvoiceList(prev => {
            const updatedInvoices = prev.map(i => (i.poNo === bCode || i.code === bCode || i.invNo === invNo) ? {
              ...i,
              status: 'Fully Dispatched & Delivered',
              pay: 'Completed & Delivered',
              vehicleLoading: loadingPayload
            } : i);
            try {
              saveCloudStore('invoice_store', updatedInvoices);
            } catch (e) { }
            return updatedInvoices;
          });

          const completedSummary = {
            bomCode: bCode,
            invoiceNo: invNo,
            customer: custName,
            salesPerson: (bom.salesPerson || localStorage.getItem('controlroom_logged_user_name') || 'Mohith JV').replace(/\s*\([^)]*\)/g, '').trim(),
            deliveryAddress: delAddr,
            packedCount: packedItems.length,
            vehicleLoading: loadingPayload
          };

          setVehicleLoadingModal(null);
          setLoadingPhotos([]);
          setLoadingVideos([]);
          setCompletedBomSummaryModal(completedSummary);
        };

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', backgroundColor: '#F8FAFC', zIndex: 999999, fontFamily: "'DM Sans', sans-serif", overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>

              {/* Modal Header Banner */}
              <div style={{
                padding: '20px 28px',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#4F46E5', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79,70,229,0.4)' }}>
                    <Truck size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
                        {isReadOnly ? 'Vehicle Loading & Dispatch Verification (Completed)' : 'Despatch Vehicle Loading Verification'}
                      </h2>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFFFFF', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                        {bCode}
                      </span>
                      <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' }}>
                        {invNo}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: '3px 0 0 0' }}>
                      Customer: <strong style={{ color: '#FFFFFF' }}>{custName}</strong> • Sales Creator: <strong style={{ color: '#38BDF8' }}>👤 {(bom.salesPerson || localStorage.getItem('controlroom_logged_user_name') || 'Mohith JV').replace(/\s*\([^)]*\)/g, '').trim()}</strong> • Destination: <span>{delAddr}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setVehicleLoadingModal(null);
                    setLoadingPhotos([]);
                    setLoadingVideos([]);
                  }}
                  style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '22px', backgroundColor: '#F8FAFC' }}>

                {/* 1. Fulfillment & Stock Deduction Strip */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={16} style={{ color: '#059669' }} />
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                        Packed Items Verified & Stock Deducted ({packedItems.length} Items)
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '3px 10px', borderRadius: '12px' }}>
                      ✓ Stock Decremented in Inventory
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                    {packedItems.map((item, pIdx) => (
                      <div key={pIdx} style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#166534' }}>{item.name}</div>
                          <div style={{ fontSize: '11px', color: '#15803D' }}>Qty: {item.qty || item.bomQty || 1} {item.uom || 'Nos'}</div>
                        </div>
                        <CheckCircle size={16} style={{ color: '#16A34A' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Vehicle, Driver & Logistics Details Form */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                    <Truck size={18} style={{ color: '#4F46E5' }} />
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                      Vehicle & Driver Logistics Information
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        Vehicle / Lorry Number <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={vNo}
                        onChange={(e) => setVehicleLoadingData({ ...vehicleLoadingData, vehicleNo: e.target.value })}
                        placeholder="e.g. TN-09-CB-4821"
                        style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', fontWeight: '700', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        Driver Full Name
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={dName}
                        onChange={(e) => setVehicleLoadingData({ ...vehicleLoadingData, driverName: e.target.value })}
                        placeholder="e.g. K. Murugan"
                        style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        Driver Phone Number
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={dPhone}
                        onChange={(e) => setVehicleLoadingData({ ...vehicleLoadingData, driverPhone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        Logistics / Fleet Carrier
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={transp}
                        onChange={(e) => setVehicleLoadingData({ ...vehicleLoadingData, transporter: e.target.value })}
                        placeholder="e.g. VRL Logistics / Company Fleet"
                        style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        LR / Bilty / Docket No
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={lr}
                        onChange={(e) => setVehicleLoadingData({ ...vehicleLoadingData, lrNo: e.target.value })}
                        placeholder="e.g. LR-2026-8812"
                        style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        Container / Seal Number
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={seal}
                        onChange={(e) => setVehicleLoadingData({ ...vehicleLoadingData, sealNo: e.target.value })}
                        placeholder="e.g. SEAL-99201"
                        style={{ width: '100%', height: '40px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', color: '#0F172A', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Vehicle Loading Proof Media (Photos & Videos Verification - CRITICAL) */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={18} style={{ color: '#4F46E5' }} />
                        <span style={{ fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>
                          Vehicle Loading Proof Media (Photos & Videos)
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                        Capture or upload live media of packed items placed inside vehicle.
                      </p>
                    </div>

                    {/* Mode selector */}
                    <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setLoadingMediaMode('photo')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: 'none',
                          backgroundColor: loadingMediaMode === 'photo' ? '#FFFFFF' : 'transparent',
                          color: loadingMediaMode === 'photo' ? '#4F46E5' : '#64748B',
                          fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                          boxShadow: loadingMediaMode === 'photo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        <Image size={14} /> Photos ({currentPhotos.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoadingMediaMode('video')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: 'none',
                          backgroundColor: loadingMediaMode === 'video' ? '#FFFFFF' : 'transparent',
                          color: loadingMediaMode === 'video' ? '#4F46E5' : '#64748B',
                          fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                          boxShadow: loadingMediaMode === 'video' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        <Video size={14} /> Videos ({currentVideos.length})
                      </button>
                    </div>
                  </div>

                  {/* PHOTOS PANE */}
                  {loadingMediaMode === 'photo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {!isReadOnly && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            backgroundColor: '#4F46E5', color: '#FFFFFF',
                            padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '800',
                            cursor: 'pointer', boxShadow: '0 2px 6px rgba(79,70,229,0.3)'
                          }}>
                            <UploadCloud size={16} /> Upload Loading Photos
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleAddPhotoFiles(e.target.files)}
                            />
                          </label>

                          <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0',
                            padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '800',
                            cursor: 'pointer', boxShadow: '0 2px 6px rgba(22,101,52,0.15)'
                          }}>
                            <Camera size={16} /> 📸 Capture Live Camera Photo
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              style={{ display: 'none' }}
                              onChange={(e) => handleAddPhotoFiles(e.target.files)}
                            />
                          </label>
                        </div>
                      )}

                      {/* Photo Grid Gallery */}
                      {currentPhotos.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                          {currentPhotos.map((p, pIdx) => (
                            <div key={p.id || pIdx} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                              <div
                                onClick={() => setActiveMediaPreviewModal({ type: 'image', url: p.dataUrl, name: p.name })}
                                style={{ height: '120px', width: '100%', backgroundColor: '#0F172A', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <img src={p.dataUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                  <div style={{ fontSize: '10px', color: '#64748B' }}>{p.size || '1.2 MB'} • {p.capturedAt || 'Verified'}</div>
                                </div>
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => setLoadingPhotos(prev => prev.filter((_, idx) => idx !== pIdx))}
                                    style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '2px' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ border: '2px dashed #CBD5E1', borderRadius: '14px', padding: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', backgroundColor: '#FAFAFA' }}>
                          <Camera size={32} style={{ color: '#94A3B8' }} />
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>No vehicle loading photos uploaded yet</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Take or upload photos of packed boxes and mounting rails inside the lorry.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VIDEOS PANE */}
                  {loadingMediaMode === 'video' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {!isReadOnly && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            backgroundColor: '#0284C7', color: '#FFFFFF',
                            padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '800',
                            cursor: 'pointer', boxShadow: '0 2px 6px rgba(2,132,199,0.3)'
                          }}>
                            <UploadCloud size={16} /> Upload Loading Video
                            <input
                              type="file"
                              accept="video/*,.mp4,.webm,.mov"
                              style={{ display: 'none' }}
                              onChange={(e) => handleAddVideoFiles(e.target.files)}
                            />
                          </label>

                          <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE',
                            padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '800',
                            cursor: 'pointer'
                          }}>
                            <Video size={16} /> 🎥 Record Live Camera Video
                            <input
                              type="file"
                              accept="video/*"
                              capture="environment"
                              style={{ display: 'none' }}
                              onChange={(e) => handleAddVideoFiles(e.target.files)}
                            />
                          </label>
                        </div>
                      )}

                      {/* Video Player Gallery */}
                      {currentVideos.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                          {currentVideos.map((vid, vIdx) => (
                            <div key={vid.id || vIdx} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
                              <video
                                controls
                                src={vid.dataUrl}
                                style={{ width: '100%', height: '180px', backgroundColor: '#0F172A', objectFit: 'contain' }}
                              />
                              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>{vid.name}</div>
                                  <div style={{ fontSize: '10px', color: '#64748B' }}>{vid.size || '3.5 MB'} • Recorded {vid.recordedAt}</div>
                                </div>
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => setLoadingVideos(prev => prev.filter((_, idx) => idx !== vIdx))}
                                    style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ border: '2px dashed #CBD5E1', borderRadius: '14px', padding: '28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', backgroundColor: '#FAFAFA' }}>
                          <Film size={32} style={{ color: '#94A3B8' }} />
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>No loading video recorded yet</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Record video of the vehicle loading process for physical dispatch audit.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 28px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {isReadOnly ? (
                    <span style={{ color: '#166534', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={16} /> Entire BOM Flow & Vehicle Dispatch 100% Completed
                    </span>
                  ) : (
                    <span>Submitting will finalize vehicle loading & complete the entire BOM cycle.</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleLoadingModal(null);
                      setLoadingPhotos([]);
                      setLoadingVideos([]);
                    }}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Close
                  </button>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleFinalizeVehicleLoading}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 3px 10px rgba(22,163,74,0.3)'
                      }}
                    >
                      <CheckCircle size={16} /> Complete Vehicle Loading & Finalize BOM
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── FULL BOM LIFECYCLE COMPLETION SUMMARY MODAL ─── */}
      {completedBomSummaryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100001, fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', width: '620px', maxWidth: '95%', padding: '32px', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: '22px', textAlign: 'center' }}>

            <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 8px 20px rgba(22,101,52,0.2)' }}>
              <CheckCircle size={40} />
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🎉 BOM FULFILLMENT 100% COMPLETE
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', margin: '4px 0 0 0' }}>
                Order & BOM Flow Successfully Completed!
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 0 0' }}>
                BOM Reference: <strong style={{ color: '#2563EB' }}>{completedBomSummaryModal.bomCode}</strong> • Sales Creator: <strong style={{ color: '#0E7490' }}>👤 {(completedBomSummaryModal.salesPerson || localStorage.getItem('controlroom_logged_user_name') || 'Mohith JV').replace(/\s*\([^)]*\)/g, '').trim()}</strong> • Customer: <strong>{completedBomSummaryModal.customer}</strong>
              </p>
            </div>

            {/* Lifecycle Stages Passed */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>Completed Journey Stages</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
                  <CheckCircle size={15} /> 1. Sales BOM Created & Address Proof Attached
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
                  <CheckCircle size={15} /> 2. Dispatch Items Packed & Verified ({completedBomSummaryModal.packedCount} items)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
                  <CheckCircle size={15} /> 3. Accounts Verification & Payment Slip Approved
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
                  <CheckCircle size={15} /> 4. Tax Invoice Confirmed & Inventory Stock Decremented
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
                  <CheckCircle size={15} /> 5. Vehicle Loading Verified with Photos & Videos ({completedBomSummaryModal.vehicleLoading?.vehicleNo})
                </div>
              </div>
            </div>

            {/* Media Storage & Location Info Panel */}
            <div style={{ backgroundColor: '#F1F5F9', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '14px 18px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0E7490', textTransform: 'uppercase' }}>
                  📁 Media Storage & Audit Information
                </div>
                <span style={{ fontSize: '10px', color: '#166534', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '8px', fontWeight: '800' }}>
                  Synced & Quota-Protected
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.4' }}>
                • <strong>Storage Target:</strong> LocalStorage + Cache API (<code style={{ color: '#0E7490', backgroundColor: '#E0F2FE', padding: '1px 4px', borderRadius: '4px' }}>controlroom_media_cache</code>)<br />
                • <strong>Loading Photos:</strong> {completedBomSummaryModal.vehicleLoading?.photos?.length || 0} files captured<br />
                • <strong>Loading Videos:</strong> {completedBomSummaryModal.vehicleLoading?.videos?.length || 0} files captured<br />
                • <strong>Timestamp:</strong> {completedBomSummaryModal.vehicleLoading?.loadedTimeStr || new Date().toLocaleString()}
              </div>
            </div>

            {/* Customer Sharing Actions (WhatsApp / Email) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#475569' }}>
                Send Dispatch Details, Photos & Videos to Customer:
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const cust = completedBomSummaryModal.customer || 'Valued Customer';
                    const bNum = completedBomSummaryModal.bomCode || 'BOM';
                    const inv = completedBomSummaryModal.invoiceNo || 'INV';
                    const vNum = completedBomSummaryModal.vehicleLoading?.vehicleNo || 'TN-09-CB-4821';
                    const drv = completedBomSummaryModal.vehicleLoading?.driverName || 'Driver';
                    const dPhone = completedBomSummaryModal.vehicleLoading?.driverPhone || '';
                    const lr = completedBomSummaryModal.vehicleLoading?.lrNo || 'LR-881204';
                    const phCount = completedBomSummaryModal.vehicleLoading?.photos?.length || 0;
                    const vdCount = completedBomSummaryModal.vehicleLoading?.videos?.length || 0;

                    const msg = `📦 *DISPATCH NOTIFICATION - CONTROL ROOM*\n\nDear ${cust},\nYour order has been fully packed, inspected, and loaded into the delivery vehicle.\n\n• *BOM Reference:* ${bNum}\n• *Invoice No:* ${inv}\n• *Vehicle Number:* ${vNum}\n• *Driver:* ${drv} (${dPhone})\n• *LR Number:* ${lr}\n• *Loading Media:* ${phCount} Photo(s), ${vdCount} Video(s) verified on dock.\n\nThank you for choosing us!`;
                    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                    window.open(waUrl, '_blank');
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
                  }}
                >
                  <span>💬 Send to Customer via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cust = completedBomSummaryModal.customer || 'Valued Customer';
                    const bNum = completedBomSummaryModal.bomCode || 'BOM';
                    const inv = completedBomSummaryModal.invoiceNo || 'INV';
                    const vNum = completedBomSummaryModal.vehicleLoading?.vehicleNo || 'TN-09-CB-4821';
                    const drv = completedBomSummaryModal.vehicleLoading?.driverName || 'Driver';
                    const lr = completedBomSummaryModal.vehicleLoading?.lrNo || 'LR-881204';
                    const phCount = completedBomSummaryModal.vehicleLoading?.photos?.length || 0;
                    const vdCount = completedBomSummaryModal.vehicleLoading?.videos?.length || 0;

                    const subject = `Dispatch & Loading Confirmation: ${bNum} (${inv})`;
                    const body = `Dear ${cust},\n\nWe are pleased to inform you that your shipment is dispatched.\n\nOrder Details:\n• BOM Number: ${bNum}\n• Tax Invoice: ${inv}\n• Vehicle Registration: ${vNum}\n• Driver Name: ${drv}\n• LR Consignment Number: ${lr}\n• Verification Media: ${phCount} loading photos and ${vdCount} videos captured.\n\nBest Regards,\nLogistics & Dispatch Operations Team`;
                    const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.location.href = mailUrl;
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>✉️ Send via Email</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCompletedBomSummaryModal(null)}
                style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.25)' }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FULL MEDIA LIGHTBOX PREVIEW MODAL ─── */}
      {activeMediaPreviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100005 }}>
          <div style={{ maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '700' }}>{activeMediaPreviewModal.name || 'Media Preview'}</span>
              <button
                type="button"
                onClick={() => setActiveMediaPreviewModal(null)}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#FFFFFF', padding: '6px 14px', cursor: 'pointer', fontWeight: '700' }}
              >
                Close ✕
              </button>
            </div>
            {activeMediaPreviewModal.type === 'video' ? (
              <video controls autoPlay src={activeMediaPreviewModal.url} style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px' }} />
            ) : (
              <img src={activeMediaPreviewModal.url} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '12px' }} />
            )}
          </div>
        </div>
      )}

      {/* DELIVERY ADDRESS PROOF DOCUMENT VIEWER MODAL */}
      {previewAddressProofModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', width: '900px', maxWidth: '95vw', maxHeight: '94vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Delivery Address Proof Attachment</h3>
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span>Uploaded by: <strong style={{ color: '#0F172A' }}>{(previewAddressProofModal.uploadedBy || localStorage.getItem('controlroom_logged_user_name') || 'Mohith JV').replace(/\s*\([^)]*\)/g, '').trim()}</strong></span>
                    <span>•</span>
                    <span>BOM: <strong style={{ color: '#2563EB' }}>{previewAddressProofModal.bomRef || 'BOM Reference'}</strong></span>
                    <span>•</span>
                    <span>File: <strong style={{ color: '#475569' }}>{previewAddressProofModal.name || 'Document.png'}</strong> ({previewAddressProofModal.size || 'Image'})</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAddressProofModal(null)}
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - 100% Focused on the Image */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#0B0F19', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              {previewAddressProofModal.dataUrl ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  <img
                    src={previewAddressProofModal.dataUrl}
                    alt="Delivery Address Proof"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '74vh',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                    }}
                  />
                </div>
              ) : (
                <div style={{ color: '#94A3B8', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <FileText size={48} style={{ color: '#64748B' }} />
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#F1F5F9' }}>{previewAddressProofModal.name || 'Attachment Document'}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Uploaded by {(previewAddressProofModal.uploadedBy || localStorage.getItem('controlroom_logged_user_name') || 'Mohith JV').replace(/\s*\([^)]*\)/g, '').trim()} • {previewAddressProofModal.size || '0.13 MB'}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#166534', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle size={14} /> Official Address Proof
                </span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Uploaded by <strong>{(previewAddressProofModal.uploadedBy || localStorage.getItem('controlroom_logged_user_name') || 'Mohith JV').replace(/\s*\([^)]*\)/g, '').trim()}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (previewAddressProofModal.dataUrl) {
                      const a = document.createElement('a');
                      a.href = previewAddressProofModal.dataUrl;
                      a.download = previewAddressProofModal.name || 'Address_Proof.png';
                      a.click();
                    } else {
                      alert(`Downloading ${previewAddressProofModal.name || 'Document'}...`);
                    }
                  }}
                  style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={15} /> Download Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (previewAddressProofModal?.dataUrl) {
                      const win = window.open();
                      if (win) {
                        win.document.write(`<html style="background:#0B0F19;margin:0;height:100%;display:flex;justify-content:center;align-items:center;"><head><title>Address Proof — ${previewAddressProofModal.name || "Document"}</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${previewAddressProofModal.dataUrl}" style="max-width:96vw;max-height:96vh;object-fit:contain;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.6);"/></body></html>`);
                      }
                    }
                  }}
                  style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid #4F46E5', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Open in New Window ↗
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAddressProofModal(null)}
                  style={{ padding: '9px 22px', borderRadius: '10px', border: 'none', backgroundColor: '#2563EB', color: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DISPATCH PACKING CHECKLIST PREVIEW MODAL ─── */}
      {dispatchChecklistPreviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100003, fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', width: '740px', maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(5,150,105,0.35)' }}>
                  <CheckSquare size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                      Dispatch Goods Packing Checklist
                    </h3>
                    <span style={{ backgroundColor: '#10B981', color: '#FFFFFF', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                      {dispatchChecklistPreviewModal.packedCount} / {dispatchChecklistPreviewModal.allCount} Packed
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                    BOM Order: <strong style={{ color: '#38BDF8' }}>{dispatchChecklistPreviewModal.bomCode}</strong> • Customer: <strong style={{ color: '#FFFFFF' }}>{dispatchChecklistPreviewModal.customerName}</strong> • Verified by: <strong style={{ color: '#A7F3D0' }}>{dispatchChecklistPreviewModal.packedBy}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchChecklistPreviewModal(null)}
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Checklist Table */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px', textAlign: 'center', width: '70px' }}>Packed</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Product Code</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Description & Spec</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>BOM Qty</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(dispatchChecklistPreviewModal.packedItems || []).map((item, idx) => {
                    const isPacked = item.packed !== false;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isPacked ? '#F0FDF4' : '#FFF7ED' }}>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '6px', margin: '0 auto',
                            backgroundColor: isPacked ? '#166534' : '#FED7AA',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF'
                          }}>
                            {isPacked ? <Check size={14} /> : <span style={{ fontSize: '11px', color: '#C2410C', fontWeight: '800' }}>✕</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#2563EB' }}>
                          {item.code || `PRD-00${idx + 1}`}
                        </td>
                        <td style={{ padding: '12px', fontWeight: '700', color: isPacked ? '#166534' : '#1E293B' }}>
                          {item.name || item.description || 'Hardware / Mounting Component'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '800', color: '#475569' }}>
                          {item.bomQty || item.qty || 1} <span style={{ fontSize: '11px', color: '#94A3B8' }}>Nos</span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800',
                            backgroundColor: isPacked ? '#DCFCE7' : '#FFEDD5',
                            color: isPacked ? '#166534' : '#C2410C',
                            border: `1px solid ${isPacked ? '#BBF7D0' : '#FDBA74'}`
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isPacked ? '#22C55E' : '#EA580C' }} />
                            {isPacked ? 'Verified & Packed' : 'Pending Packing'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Physical warehouse inspection verified by <strong>{dispatchChecklistPreviewModal.packedBy}</strong>
              </span>
              <button
                type="button"
                onClick={() => setDispatchChecklistPreviewModal(null)}
                style={{ padding: '9px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RECORDED PAYMENT PROOF DOCUMENT VIEWER MODAL (ROOT LEVEL) ─── */}
      {viewingProofDocModal && (() => {
        const bRef = viewingProofDocModal.bomCode || viewingProofDocModal.code || viewingProofDocModal.poNo;
        const matchedBom = bomStore.find(b => b.bomCode === bRef || b.code === bRef || (b.salesOrderNo && b.salesOrderNo === bRef));
        const rawProof = viewingProofDocModal.paymentProofDoc || matchedBom?.paymentProofDoc || viewingProofDocModal.payments?.proofDocObj || viewingProofDocModal.payments?.proofDoc || viewingProofDocModal.proofDoc || viewingProofDocModal.salesPoDetails?.proofDocObj;
        const docName = typeof rawProof === 'string' ? rawProof : rawProof?.name || viewingProofDocModal.paymentProofDocName || 'Payment_Proof_Receipt.jpg';
        const salesPaymentProof = viewingProofDocModal.paymentProofDoc || matchedBom?.paymentProofDoc || viewingProofDocModal.payments?.proofDocObj || viewingProofDocModal.salesPoDetails?.proofDocObj;
        let pDocDataUrl = (typeof salesPaymentProof === 'string' && salesPaymentProof.startsWith('data:'))
          ? salesPaymentProof
          : (salesPaymentProof?.dataUrl || salesPaymentProof?.fileData || salesPaymentProof?.url || (typeof rawProof === 'string' && rawProof.startsWith('data:') ? rawProof : null) || rawProof?.dataUrl || rawProof?.fileData || rawProof?.url);
        if (!pDocDataUrl && docName) {
          pDocDataUrl = getMediaFromCache(docName);
        }
        const bCode = viewingProofDocModal.bomCode || viewingProofDocModal.code || viewingProofDocModal.poNo || 'BOM-2026';
        const cName = viewingProofDocModal.customerName || viewingProofDocModal.companyName || viewingProofDocModal.vendor || 'Customer';
        const amtVal = parseFloat(viewingProofDocModal.grandTotal || viewingProofDocModal.invAmt || 0);
        const pType = viewingProofDocModal.paymentType || '100% Advance';

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100000,
            padding: '20px',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid #F1F5F9',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
                color: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                  }}>
                    <Receipt style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: '#FFFFFF' }}>
                      Recorded Payment Proof Document
                    </h2>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                      {docName} • {bCode} • {cName}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => window.print()}
                    title="Print Receipt"
                    style={{
                      background: 'rgba(255,255,255,0.12)', border: 'none',
                      color: '#FFFFFF', width: '34px', height: '34px', borderRadius: '8px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <Printer style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button
                    onClick={() => setViewingProofDocModal(null)}
                    style={{
                      background: 'rgba(255,255,255,0.12)', border: 'none',
                      color: '#FFFFFF', width: '34px', height: '34px', borderRadius: '8px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <X style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC' }}>
                {pDocDataUrl ? (
                  <div style={{
                    borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF', padding: '16px', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                  }}>
                    <img
                      src={pDocDataUrl}
                      alt="Payment Proof Attachment"
                      style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{docName}</span>
                  </div>
                ) : (
                  <div style={{
                    borderRadius: '14px', border: '1.5px dashed #CBD5E1',
                    backgroundColor: '#FFFFFF', padding: '40px 20px', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                  }}>
                    <FileText style={{ width: '44px', height: '44px', color: '#94A3B8' }} />
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#334155' }}>No File Attachment Found</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>Document name recorded: {docName}</div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Digitally verified payment transaction proof
                </span>
                <button
                  onClick={() => setViewingProofDocModal(null)}
                  style={{
                    border: 'none',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    height: '38px',
                    padding: '0 22px',
                    borderRadius: '9px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── CUSTOM TOAST NOTIFICATION POPUP (MATCHES DESIGN SYSTEM) ─── */}
      {customAlert && (
        <NotificationToast
          alert={customAlert}
          onClose={() => setCustomAlert(null)}
        />
      )}

      {/* ─── ROOT LEVEL FLOATING OVERLAY PORTAL FOR BOM 3-DOT MENU ─── */}
      {(activeTab === "BOM" || activeTab === "BOM / Routing") && bomActionMenuIdx !== null && bomStore[bomActionMenuIdx] && (() => {
        const row = bomStore[bomActionMenuIdx];
        const isDraftOrPending = ["Draft", "Pending Confirmation", "Edited / Pending Confirmation", "Cancelled & Reissued to Dispatch", "ACTIVE", "Active", "Pending Verification", "Pending"].includes(row.status);
        const isAccountsDoneOrVerified = Boolean(
          row.accountsVerification?.verified ||
          row.status === "Accounts Verified & Passed to Invoice" ||
          row.status === "ACCOUNTS VERIFIED" ||
          row.status === "Invoice Confirmed" ||
          row.status === "Completed" ||
          row.status === "Confirmed" ||
          row.status === "Payment Uploaded"
        );
        const isPaymentPending = !isAccountsDoneOrVerified && !isDraftOrPending && (
          (row.paymentType === "100% Advance" && !row.payments?.advance100Uploaded && !row.payments?.proofDoc) ||
          (row.paymentType === "50% Advance + 50% Dispatch" && (!row.payments?.advance50Uploaded || !row.payments?.dispatch50Uploaded)) ||
          (row.paymentType === "Net 30 Days" && !row.payments?.net30Uploaded)
        );

        return (
          <>
            <div
              onClick={() => setBomActionMenuIdx(null)}
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, backgroundColor: "transparent" }}
            />
            <div
              style={{
                position: "fixed",
                top: (bomActionMenuPos.top || 100) + "px",
                left: (bomActionMenuPos.left || 100) + "px",
                backgroundColor: "#FFFFFF",
                border: "1.5px solid #94A3B8",
                borderRadius: "12px",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.2)",
                zIndex: 9999999,
                minWidth: "210px",
                overflow: "hidden",
                padding: "6px"
              }}
            >
              {/* 1. View / Confirm BOM */}
              <button
                onClick={() => {
                  setConfirmingBomModal({ ...row, isEditMode: false });
                  setBomActionMenuIdx(null);
                }}
                style={{ width: "100%", padding: "9px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#2563EB", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderRadius: "6px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EFF6FF"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <Eye style={{ width: "14px", height: "14px", color: "#2563EB" }} /> View BOM Details
              </button>

              <button
                onClick={() => {
                  setConfirmingBomModal({ ...row, isEditMode: true });
                  setBomActionMenuIdx(null);
                }}
                style={{ width: "100%", padding: "9px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#4F46E5", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderRadius: "6px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#EEF2FF"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <Edit3 style={{ width: "14px", height: "14px", color: "#4F46E5" }} /> Edit / Confirm BOM
              </button>

              {/* 2. Re-upload Address Proof */}
              {(row.addressProofReuploadRequested || row.status === 'Wrong Proof' || row.addressProofStatus === 'Wrong Proof') && (
                <button
                  onClick={() => {
                    setReuploadAddressProofModal(row);
                    setReuploadProofFile(null);
                    setBomActionMenuIdx(null);
                  }}
                  style={{ width: "100%", padding: "9px 12px", border: "none", backgroundColor: "#FEF2F2", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderRadius: "6px" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FEE2E2"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FEF2F2"}
                >
                  <RotateCcw style={{ width: "14px", height: "14px", color: "#DC2626" }} /> Re-upload Address Proof
                </button>
              )}

              {/* 3. Update Payment */}
              {(row.paymentType === "Partial Payment" || row.paymentType === "Credit Payment") && !row.paymentUpdated && (
                <button
                  onClick={() => {
                    setUpdatePaymentModal(row);
                    setUpdatePaymentFile(null);
                    setUpdatePaymentNotes("");
                    setBomActionMenuIdx(null);
                  }}
                  style={{ width: "100%", padding: "9px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#059669", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderRadius: "6px" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ECFDF5"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <CreditCard style={{ width: "14px", height: "14px", color: "#059669" }} /> Update Payment
                </button>
              )}

              {/* 4. View Payment Uploads vs Upload Payment Details */}
              {(() => {
                const bRef = row.bomCode || row.code || row.poNo;
                const matched = (bomStore || []).find(b => b.bomCode === bRef || b.code === bRef);
                const hasProof = Boolean(
                  row.paymentProofDoc ||
                  row.payments?.proofDoc ||
                  row.payments?.proofDocObj ||
                  row.salesPoDetails?.proofDocObj ||
                  row.paymentUpdated ||
                  row.payments?.advance100Uploaded ||
                  row.proofDoc ||
                  row.proofDocData ||
                  matched?.paymentProofDoc ||
                  matched?.payments?.proofDoc ||
                  matched?.payments?.proofDocObj ||
                  matched?.paymentUpdated ||
                  matched?.payments?.advance100Uploaded
                );
                return hasProof ? (
                  <button
                    onClick={() => {
                      setViewingProofDocModal(matched || row);
                      setBomActionMenuIdx(null);
                    }}
                    style={{ width: "100%", padding: "9px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#0284C7", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderRadius: "6px" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F0F9FF"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <FileText style={{ width: "14px", height: "14px", color: "#0284C7" }} /> View Payment Uploads
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setUploadPaymentModal(row);
                      setPaymentStageType(row.paymentType || "100% Paid");
                      setBomActionMenuIdx(null);
                    }}
                    style={{ width: "100%", padding: "9px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#059669", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderRadius: "6px" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ECFDF5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Upload style={{ width: "14px", height: "14px", color: "#059669" }} /> Upload Payment Details
                  </button>
                );
              })()}

              <div style={{ height: "1px", backgroundColor: "#E2E8F0", margin: "4px 0" }} />

              {/* Delete BOM */}
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete BOM (${row.code})?`)) {
                    setBomStore(prev => {
                      const updated = prev.filter(b => (b.bomCode || b.code) !== (row.bomCode || row.code));
                      try {
                        saveCloudStore("bom_store", updated);
                      } catch (err) { }
                      return updated;
                    });
                  }
                  setBomActionMenuIdx(null);
                }}
                style={{ width: "100%", padding: "9px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderRadius: "6px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FEF2F2"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <Trash2 style={{ width: "14px", height: "14px", color: "#DC2626" }} /> Delete BOM
              </button>
            </div>
          </>
        );
      })()}

      

      {/* VRM TAX INVOICE PRINT MODAL TEMPLATE */}
      {printTaxInvoiceModal && (
        <VRMTaxInvoicePrintTemplate
          invoiceData={printTaxInvoiceModal}
          onClose={() => setPrintTaxInvoiceModal(null)}
        />
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDocModal && <DocPreviewModal previewDocModal={previewDocModal} onClose={() => setPreviewDocModal(null)} />}

      {/* BOM CANCELLATION REASON PROMPT MODAL */}
      {bomCancelPromptModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AlertTriangle style={{ width: '22px', height: '22px', color: '#FFFFFF' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
                    Cancel BOM & Restore Stock
                  </h3>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                    BOM: <strong>{bomCancelPromptModal.bomCode || bomCancelPromptModal.code}</strong> • Customer: {bomCancelPromptModal.customerName || bomCancelPromptModal.clientName || 'Customer'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setBomCancelPromptModal(null);
                  setCancellationReasonInput('');
                }}
                style={{
                  background: 'none', border: 'none', color: '#FFFFFF',
                  cursor: 'pointer', padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#991B1B',
                lineHeight: 1.5
              }}>
                <strong>⚠️ Why are you cancelling this BOM?</strong>
                <br />
                The Sales Person (<strong>{(bomCancelPromptModal.salesPerson || localStorage.getItem('controlroom_logged_user_name') || 'Sales Executive').replace(/\s*\([^)]*\)/g, '').trim()}</strong>) who raised this order will be immediately notified with your reason, and reserved stock will be returned to raw inventory.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Quick Select Reason
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    'Customer requested order cancellation',
                    'Specification / Drawing changed by client',
                    'Payment term non-compliance',
                    'Wrong profile / cut length selected in BOM',
                    'Duplicate BOM entry created',
                    'Material grade / thickness unavailable'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCancellationReasonInput(preset)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: cancellationReasonInput === preset ? '1.5px solid #DC2626' : '1px solid #CBD5E1',
                        backgroundColor: cancellationReasonInput === preset ? '#FEF2F2' : '#F8FAFC',
                        color: cancellationReasonInput === preset ? '#DC2626' : '#475569',
                        fontSize: '11px',
                        fontWeight: cancellationReasonInput === preset ? '700' : '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cancellation Reason <span style={{ color: '#DC2626' }}>* (Required)</span>
                </label>
                <textarea
                  value={cancellationReasonInput}
                  onChange={(e) => setCancellationReasonInput(e.target.value)}
                  placeholder="Explain why this BOM is being cancelled (e.g. Customer cancelled the project, drawing mismatch...)"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#DC2626'}
                  onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setBomCancelPromptModal(null);
                  setCancellationReasonInput('');
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Keep BOM Active
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!cancellationReasonInput.trim()) {
                    alert('Please enter or select a reason for cancelling this BOM.');
                    return;
                  }
                  executeCancelBom(bomCancelPromptModal, cancellationReasonInput.trim());
                }}
                disabled={!cancellationReasonInput.trim()}
                style={{
                  padding: '9px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: cancellationReasonInput.trim() ? '#DC2626' : '#FCA5A5',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: cancellationReasonInput.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: cancellationReasonInput.trim() ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none'
                }}
              >
                <XCircle size={15} /> Confirm & Cancel BOM
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
