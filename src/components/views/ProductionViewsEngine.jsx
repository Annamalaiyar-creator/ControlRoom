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
import WorkOrdersView from './WorkOrdersView';
import InvoiceDetailModal from './InvoiceDetailModal';
import ConfirmingBomModal from './ConfirmingBomModal';
import DispatchPackingModal from './DispatchPackingModal';
import AccountsVerificationModal from './AccountsVerificationModal';
import DocPreviewModal from './DocPreviewModal';
import CustomerProfileView from './CustomerProfileView';
import CustomerFormView from './CustomerFormView';
import CreateBomFormPage from './CreateBomFormPage';
import VehicleLoadingModal from './VehicleLoadingModal';
import DeliveryChallanModal from './DeliveryChallanModal';
import QuickPreviewDrawer from './QuickPreviewDrawer';
import { UploadPaymentModal, UpdatePaymentModal, ReuploadAddressProofModal } from './PaymentAndProofModals';
import { CompletedBomSummaryModal, ActiveMediaPreviewModal, PreviewAddressProofModal, DispatchChecklistPreviewModal, ViewingProofDocModal, BomCancelPromptModal } from './DispatchAndPreviewModals';
import { buildProductionConfigs } from './productionConfigs';
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

          const configs = buildProductionConfigs({ bomStore, invoiceList, customerList });

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
                <QuickPreviewDrawer
                  quickPreviewRecord={quickPreviewRecord}
                  onClose={() => setQuickPreviewRecord(null)}
                  activeTab={activeTab}
                  canCancelBom={canCancelBom}
                  handleCancelBomOrder={handleCancelBomOrder}
                  onViewFullDetails={(rec) => {
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
                />
              )}

              {uploadPaymentModal && (
                <UploadPaymentModal
                  uploadPaymentModal={uploadPaymentModal}
                  onClose={() => setUploadPaymentModal(null)}
                  setBomStore={setBomStore}
                />
              )}

              {/* ─── UPDATE PAYMENT MODAL (Only for Partial Payment & Credit Payment - One-Time Lock) ─── */}
              {updatePaymentModal && (
                <UpdatePaymentModal
                  updatePaymentModal={updatePaymentModal}
                  onClose={() => setUpdatePaymentModal(null)}
                  setBomStore={setBomStore}
                />
              )}

              {/* ─── RE-UPLOAD ADDRESS PROOF MODAL ─── */}
              {reuploadAddressProofModal && (
                <ReuploadAddressProofModal
                  reuploadAddressProofModal={reuploadAddressProofModal}
                  onClose={() => setReuploadAddressProofModal(null)}
                  setBomStore={setBomStore}
                  setInvoiceList={setInvoiceList}
                />
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
      {/* Pending Delivery Challan (DC) Modal */}
      {pendingDcModal && (
        <DeliveryChallanModal
          pendingDcModal={pendingDcModal}
          onClose={() => setPendingDcModal(null)}
          bomStore={bomStore}
          setBomStore={setBomStore}
        />
      )}

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
      {vehicleLoadingModal && (
        <VehicleLoadingModal
          vehicleLoadingModal={vehicleLoadingModal}
          onClose={() => setVehicleLoadingModal(null)}
          setBomStore={setBomStore}
        />
      )}

      {/* ─── FULL BOM LIFECYCLE COMPLETION SUMMARY MODAL ─── */}
      {/* ─── FULL BOM LIFECYCLE COMPLETION SUMMARY MODAL ─── */}
      {completedBomSummaryModal && (
        <CompletedBomSummaryModal
          completedBomSummaryModal={completedBomSummaryModal}
          onClose={() => setCompletedBomSummaryModal(null)}
        />
      )}

      {/* ─── FULL MEDIA LIGHTBOX PREVIEW MODAL ─── */}
      {activeMediaPreviewModal && (
        <ActiveMediaPreviewModal
          activeMediaPreviewModal={activeMediaPreviewModal}
          onClose={() => setActiveMediaPreviewModal(null)}
        />
      )}

      {/* DELIVERY ADDRESS PROOF DOCUMENT VIEWER MODAL */}
      {previewAddressProofModal && (
        <PreviewAddressProofModal
          previewAddressProofModal={previewAddressProofModal}
          onClose={() => setPreviewAddressProofModal(null)}
        />
      )}

      {/* ─── DISPATCH PACKING CHECKLIST PREVIEW MODAL ─── */}
      {dispatchChecklistPreviewModal && (
        <DispatchChecklistPreviewModal
          dispatchChecklistPreviewModal={dispatchChecklistPreviewModal}
          onClose={() => setDispatchChecklistPreviewModal(null)}
        />
      )}

      {/* ─── RECORDED PAYMENT PROOF DOCUMENT VIEWER MODAL (ROOT LEVEL) ─── */}
      {viewingProofDocModal && (
        <ViewingProofDocModal
          viewingProofDocModal={viewingProofDocModal}
          onClose={() => setViewingProofDocModal(null)}
          bomStore={bomStore}
        />
      )}

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
      {/* BOM CANCELLATION REASON PROMPT MODAL */}
      {bomCancelPromptModal && (
        <BomCancelPromptModal
          bomCancelPromptModal={bomCancelPromptModal}
          onClose={() => setBomCancelPromptModal(null)}
          onConfirmCancel={(bom, reason) => executeCancelBom(bom, reason)}
        />
      )}

    </div>
  );
}
