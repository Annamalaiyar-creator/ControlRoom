import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Hourglass, Edit3, Trash2, Eye, FileText, X, UploadCloud, CheckCircle, Search, AlertTriangle, ArrowLeft, MoreVertical, Edit, Truck, Info, Mail, Calendar, Filter, ChevronLeft, ChevronRight, RotateCcw, ChevronDown, AlertCircle, Copy } from 'lucide-react';

const PRESET_MATERIALS = [
  { name: 'GI Steel Coil 2mm', account: 'Raw Material', unit: 'MT', rate: 45000, tax: 18 },
  { name: 'GI Steel Coil 1.6mm', account: 'Raw Material', unit: 'MT', rate: 43000, tax: 18 },
  { name: 'CRC Sheet 1.2mm', account: 'Raw Material', unit: 'MT', rate: 52000, tax: 18 },
  { name: 'Self Drilling Screw', account: 'Consumables', unit: 'NOS', rate: 3.5, tax: 16 },
  { name: 'Hex Bolt M10', account: 'Fasteners', unit: 'NOS', rate: 6.2, tax: 18 },
  { name: 'Structural Steel I-Beam', account: 'Raw Material', unit: 'MT', rate: 48000, tax: 18 },
  { name: 'Electrical Copper Cable 4sqmm', account: 'Consumables', unit: 'MTR', rate: 120, tax: 18 },
  { name: 'Cement Bag 50kg', account: 'Raw Material', unit: 'NOS', rate: 410, tax: 12 },
  { name: 'Industrial Fan 5KW', account: 'Raw Material', unit: 'KW', rate: 18500, tax: 18 }
];

export default function PurchaseOrdersView({ targetPoNo, clearTargetPo }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create' | 'edit' | 'view'
  const [poDetailLoading, setPoDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Confirmation and edit states
  const [deleteIdx, setDeleteIdx] = useState(null); // Row index to delete
  const [showSaveConfirm, setShowSaveConfirm] = useState(false); // Save confirmation
  const [showCancelConfirm, setShowCancelConfirm] = useState(false); // Cancel confirmation
  const [editIdx, setEditIdx] = useState(null); // Row index to edit
  const [activeDropdownIdx, setActiveDropdownIdx] = useState(null); // Active 3-dot dropdown index
  const [openPresetIdx, setOpenPresetIdx] = useState(null); // Selected item row index opening preset materials dropdown

  const [selectedPOs, setSelectedPOs] = useState([]);

  const handleSelectAll = (e, items) => {
    if (e.target.checked) {
      setSelectedPOs(items.map(po => po.poNo));
    } else {
      setSelectedPOs([]);
    }
  };

  const handleSelectRow = (poNo) => {
    if (selectedPOs.includes(poNo)) {
      setSelectedPOs(selectedPOs.filter(item => item !== poNo));
    } else {
      setSelectedPOs([...selectedPOs, poNo]);
    }
  };

  const [statusFilter, setStatusFilter] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [poTab, setPoTab] = useState('All');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setFilterDate('');
    setPoTab('All');
    setCurrentPage(1);
  };

  const [poList, setPoList] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [zohoVendors, setZohoVendors] = useState([]);
  const [zohoItems, setZohoItems] = useState([]);

  const fetchZohoPOs = async () => {
    setTableLoading(true);
    try {
      const response = await fetch('/api/zoho/purchaseorders');
      if (response.ok) {
        const zohoPOs = await response.json();
        if (Array.isArray(zohoPOs)) {
          setPoList(prev => {
            const merged = [...zohoPOs];
            prev.forEach(p => {
              const pNo = String(p.poNo || p.id || '').toLowerCase();
              const pZohoId = String(p.zohoId || '').toLowerCase();
              const matchIdx = merged.findIndex(m => {
                const mNo = String(m.poNo || m.id || '').toLowerCase();
                const mZohoId = String(m.zohoId || '').toLowerCase();
                return (pNo && (mNo === pNo || mNo.includes(pNo) || pNo.includes(mNo))) || (pZohoId && mZohoId === pZohoId);
              });
              if (matchIdx !== -1) {
                if (p.gstNo && p.gstNo !== '—' && (!merged[matchIdx].gstNo || merged[matchIdx].gstNo === '—')) {
                  merged[matchIdx].gstNo = p.gstNo;
                }
              } else {
                merged.unshift(p);
              }
            });
            return merged;
          });
        }
      }
    } catch (err) {
      console.error("Error fetching Zoho POs:", err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    const fetchZohoDropdowns = async () => {
      try {
        const vRes = await fetch('/api/zoho/vendors');
        if (vRes.ok) {
          const vData = await vRes.json();
          setZohoVendors(vData || []);
        }
        const iRes = await fetch('/api/zoho/items');
        if (iRes.ok) {
          const iData = await iRes.json();
          setZohoItems(iData || []);
        }
      } catch (err) {
        console.error("Failed to fetch dropdown resources from Zoho:", err);
      }
    };
    fetchZohoPOs();
    fetchZohoDropdowns();
  }, []);

  useEffect(() => {
    if (targetPoNo && poList.length > 0) {
      const normalize = (str) => String(str || '').replace(/[/_\-\s]/g, '').toLowerCase();
      const targetClean = normalize(targetPoNo);

      // Exact match after normalization
      const found = poList.find(p => {
        const pNoClean = normalize(p.poNo);
        const pIdClean = normalize(p.id);
        return pNoClean === targetClean || pIdClean === targetClean;
      });

      if (found) {
        handleStartView(found);
      } else {
        setSearchQuery(targetPoNo);
      }

      if (clearTargetPo) clearTargetPo();
    }
  }, [targetPoNo, poList, clearTargetPo]);

  // Form Fields State (Start Fresh / Empty)
  const [vendorName, setVendorName] = useState('');
  const [branch, setBranch] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [deliveryType, setDeliveryType] = useState('Organization'); // 'Organization' | 'Customer'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [sameAsDelivery, setSameAsDelivery] = useState(true);

  // PO details
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [purchaser, setPurchaser] = useState('Arun');
  const [purchaserMode, setPurchaserMode] = useState('dropdown'); // 'dropdown' or 'type'
  const [shipmentPref, setShipmentPref] = useState('Transport');
  const [currency, setCurrency] = useState('INR - Indian Rupee');
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState('High');
  const [scope, setScope] = useState('Vendor Scope');
  const [transportName, setTransportName] = useState('');
  const [viewingPoStatus, setViewingPoStatus] = useState('');

  // Items State (Dynamic array - start fresh empty)
  const [items, setItems] = useState([]);

  // Pricing Charges
  const [shippingCharges, setShippingCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);

  // Attachments files list
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Notes & T&C
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(`1. Material should be as per the agreed specification and quality.
2. Delivery should be made on or before the delivery date.
3. Payment will be released as per the agreed payment terms.
4. Any delay in delivery may attract penalty as per company policy.
5. All disputes are subject to the jurisdiction of Nellore courts.`);
  const [useDefaultTerms, setUseDefaultTerms] = useState(true);

  // Approval
  const [approvalRequired, setApprovalRequired] = useState('Yes');
  const [approver, setApprover] = useState('Velmurugan Rathinam (CEO)');
  const [approvalPriority, setApprovalPriority] = useState('High');

  // PDF Uploader State (Mock)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const uploadTimerRef = useRef(null);
  const [validationErrorModal, setValidationErrorModal] = useState(null);

  const startMockUpload = (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    let prog = 0;
    uploadTimerRef.current = setInterval(() => {
      prog += 20;
      if (prog >= 100) {
        prog = 100;
        clearInterval(uploadTimerRef.current);
        setIsUploading(false);
        setAttachedFiles([...attachedFiles, { name: file.name, size: (file.size / 1024).toFixed(0) + ' KB' }]);
      }
      setUploadProgress(prog);
    }, 150);
  };

  // Recalculations
  const getSubTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.rate || 0)), 0);
  };
  const getDiscount = () => {
    return getSubTotal() * (Number(discountPct || 0) / 100);
  };
  const getTaxableAmount = () => {
    return getSubTotal() - getDiscount();
  };
  const getCGST = () => {
    const factor = (100 - Number(discountPct || 0)) / 100;
    const totalTax = items.reduce((sum, item) => {
      const itemTaxable = (Number(item.qty || 0) * Number(item.rate || 0)) * factor;
      const itemTaxPct = Number(item.tax !== undefined && item.tax !== '' ? item.tax : 18);
      return sum + (itemTaxable * (itemTaxPct / 100));
    }, 0);
    return totalTax / 2;
  };
  const getSGST = () => {
    return getCGST();
  };
  const getGrandTotal = () => {
    return getTaxableAmount() + getCGST() + getSGST() + Number(shippingCharges || 0) + Number(otherCharges || 0);
  };
  const getEffectiveCGSTPct = () => {
    const taxable = getTaxableAmount();
    if (taxable <= 0) return 9;
    return ((getCGST() / taxable) * 100);
  };
  const getEffectiveSGSTPct = () => {
    const taxable = getTaxableAmount();
    if (taxable <= 0) return 9;
    return ((getSGST() / taxable) * 100);
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', account: 'Raw Material', qty: 1, unit: 'MT', rate: 0, tax: 18 }]);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    setItems(updated);
  };

  const [formErrors, setFormErrors] = useState({});
  const [rejectingPo, setRejectingPo] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [approvingPo, setApprovingPo] = useState(null);
  const [approvalRemarksInput, setApprovalRemarksInput] = useState('');

  const triggerSaveConfirm = (e) => {
    if (e) e.preventDefault();
    const isAppReq = String(approvalRequired).toUpperCase() === 'YES';
    executeCreatePO(e, isAppReq ? 'Draft / Pending Approval' : 'OPEN');
  };

  const executeCreatePO = (e, targetStatus = 'Draft / Pending Approval') => {
    if (e && e.preventDefault) e.preventDefault();

    const statusToSave = typeof targetStatus === 'string' ? targetStatus : 'Draft / Pending Approval';
    const isDraft = statusToSave === 'Draft' || statusToSave === 'DRAFT';

    // Validate mandatory fields marked with red asterisk *
    const missingFields = [];
    if (!vendorName || String(vendorName).trim() === '') missingFields.push('Vendor Name');
    if (!deliveryAddress || String(deliveryAddress).trim() === '') missingFields.push('Delivery Address');
    if (!poDate || String(poDate).trim() === '') missingFields.push('PO Date');
    if (!deliveryDate || String(deliveryDate).trim() === '') missingFields.push('Expected Delivery Date');
    if (!paymentTerms || String(paymentTerms).trim() === '') missingFields.push('Payment Terms');
    if (!purchaser || String(purchaser).trim() === '') missingFields.push('PO Issued By');
    if (!shipmentPref || String(shipmentPref).trim() === '') missingFields.push('Shipment Preference');
    if (!currency || String(currency).trim() === '') missingFields.push('Currency');
    if (!priority || String(priority).trim() === '') missingFields.push('Priority');

    const validItems = (items || []).filter(it => it && String(it.name || '').trim() !== '' && Number(it.qty) > 0);
    if (validItems.length === 0) {
      missingFields.push('Line Items (Must add at least 1 valid item with Name and Quantity)');
    }

    if (missingFields.length > 0) {
      setValidationErrorModal({ fields: missingFields });
      return;
    }

    let effectiveItems = validItems.map(it => ({
      name: it.name,
      account: it.account || 'Raw Material',
      qty: Number(it.qty),
      unit: it.unit || 'NOS',
      rate: Number(it.rate) > 0 ? Number(it.rate) : 1000,
      tax: (it.tax !== undefined && it.tax !== '' && !isNaN(Number(it.tax))) ? Number(it.tax) : 18
    }));

    setFormErrors({});
    const statusTypeToSave = isDraft ? 'draft' : (statusToSave === 'WAITING FOR APPROVAL' ? 'pending' : 'approved');

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const formatDelivery = deliveryDate ? new Date(deliveryDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'Immediate';

    const safePoNo = poNumber ? String(poNumber).toUpperCase() : '';
    const safeGstNo = gstNo ? String(gstNo).toUpperCase() : 'N/A';

    const newPO = {
      poNo: safePoNo || ('PO-' + String(poList.length + 1).padStart(5, '0')),
      vendor: vendorName || 'Fresh Vendor',
      branch: branch || '',
      contactPerson: contactPerson || '',
      contactNo: contactNo || '',
      email: email || '',
      gstNo: safeGstNo,
      deliveryType: deliveryType,
      deliveryAddress: deliveryAddress || '',
      billingAddress: billingAddress || '',
      poDate: editIdx !== null ? poList[editIdx].poDate : formattedDate,
      deliveryDate: formatDelivery,
      paymentTerms: paymentTerms,
      purchaser: purchaser,
      shipmentPref: shipmentPref,
      currency: currency,
      project: project,
      priority: priority,
      scope: scope,
      transportName: shipmentPref === 'Transport' ? transportName : '',
      items: [...items],
      shippingCharges: shippingCharges,
      otherCharges: otherCharges,
      discountPct: discountPct,
      notes: notes,
      terms: terms,
      approvalRequired: approvalRequired,
      approver: approver,
      approvalPriority: approvalPriority,
      amount: '₹' + getGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      status: statusToSave,
      statusType: statusTypeToSave,
      pdfName: attachedFiles[0] ? attachedFiles[0].name : 'purchase_order.pdf'
    };

    if (editIdx !== null) {
      const updated = [...poList];
      updated[editIdx] = newPO;
      setPoList(updated);
      setEditIdx(null);

      fetch('/api/zoho/purchaseorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPO)
      }).then(res => res.json()).then(data => {
        if (data.success && data.po) {
          setPoList(prev => prev.map(p => (p.poNo === newPO.poNo || p.id === newPO.id) ? { ...p, ...data.po } : p));
        }
        fetchZohoPOs();
      }).catch(err => {
        console.error('Failed to sync PO update:', err);
        fetchZohoPOs();
      });
    } else {
      setPoList(prev => [newPO, ...prev]);

      fetch('/api/zoho/purchaseorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPO)
      }).then(res => res.json()).then(data => {
        if (data.success && data.po) {
          setPoList(prev => prev.map(p => (p.poNo === newPO.poNo || p.id === newPO.id) ? { ...p, ...data.po } : p));
        }
        fetchZohoPOs();
      }).catch(err => {
        console.error('Failed to sync PO:', err);
        fetchZohoPOs();
      });
    }

    setShowSaveConfirm(false);
    resetForm();
    setPoTab('All');
    setStatusFilter('All');
    setCurrentPage(1);
    setViewMode('list');
  };

  const handleApprovePoSubmit = (poTarget) => {
    if (!poTarget) return;
    const poId = poTarget.poNo || poTarget.id;
    
    fetch(`/api/zoho/purchaseorders/${encodeURIComponent(poId)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remarks: approvalRemarksInput || 'Approved by CEO',
        approver: 'CEO / Operations Manager'
      })
    })
      .then(res => res.json())
      .then(() => {
        setApprovingPo(null);
        setApprovalRemarksInput('');
        fetchZohoPOs();
      })
      .catch(() => {
        setApprovingPo(null);
        fetchZohoPOs();
      });
  };

  const handleRejectPoSubmit = (poTarget) => {
    if (!poTarget) return;
    if (!rejectionReasonInput || String(rejectionReasonInput).trim() === '') {
      alert('Rejection reason is mandatory when rejecting a Purchase Order.');
      return;
    }
    const poId = poTarget.poNo || poTarget.id;

    fetch(`/api/zoho/purchaseorders/${encodeURIComponent(poId)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: rejectionReasonInput,
        rejectedBy: 'CEO / Operations Manager'
      })
    })
      .then(res => res.json())
      .then(() => {
        setRejectingPo(null);
        setRejectionReasonInput('');
        fetchZohoPOs();
      })
      .catch(() => {
        setRejectingPo(null);
        fetchZohoPOs();
      });
  };

  const resetForm = () => {
    setPoTab('All');
    setSearchQuery('');
    setStatusFilter('All');
    setCurrentPage(1);
    setViewMode('list');
  };

  const populateFormStates = (po) => {
    setPoNumber(po.poNo);
    setVendorName(po.vendor || '');
    setBranch(po.branch || '');
    setContactPerson(po.contactPerson || '');
    setContactNo(po.contactNo || '');
    setEmail(po.email || '');
    setGstNo(po.gstNo || '');
    setDeliveryType(po.deliveryType || 'Organization');
    setDeliveryAddress(po.deliveryAddress || '');
    setBillingAddress(po.billingAddress || '');
    setSameAsDelivery(po.deliveryAddress === po.billingAddress);

    const parseDateToInputFormat = (dateStr) => {
      if (!dateStr || dateStr === 'Draft' || dateStr === 'Immediate') return '';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
      } catch (err) {
        return '';
      }
    };

    setPoDate(parseDateToInputFormat(po.poDate));
    setDeliveryDate(parseDateToInputFormat(po.deliveryDate));
    setPaymentTerms(po.paymentTerms || 'Net 30 Days');
    setPurchaser(po.purchaser || 'Arun');
    setShipmentPref(po.shipmentPref || 'Transport');
    setCurrency(po.currency || 'INR - Indian Rupee');
    setProject(po.project || '');
    setPriority(po.priority || 'High');
    setScope(po.scope || 'Vendor Scope');
    setTransportName(po.transportName || '');
    setViewingPoStatus(po.status || 'OPEN');
    const sanitizedItems = (po.items || []).map(it => ({
      ...it,
      tax: (it.tax !== undefined && it.tax !== '' && !isNaN(Number(it.tax))) ? Number(it.tax) : 18
    }));
    setItems(sanitizedItems);
    setShippingCharges(po.shippingCharges || 0);
    setOtherCharges(po.otherCharges || 0);
    setDiscountPct(po.discountPct !== undefined ? po.discountPct : 0);
    setNotes(po.notes || '');
    setTerms(po.terms || `1. Material should be as per the agreed specification and quality.
2. Delivery should be made on or before the delivery date.
3. Payment will be released as per the agreed payment terms.
4. Any delay in delivery may attract penalty as per company policy.
5. All disputes are subject to the jurisdiction of Nellore courts.`);
    setAttachedFiles(po.pdfName ? [{ name: po.pdfName, size: 'Original Attachment' }] : []);
  };

  const handleStartEdit = async (po, idx) => {
    setEditIdx(idx);
    populateFormStates(po);
    setViewMode('edit');
    setActiveDropdownIdx(null);
    if (po.id) {
      setPoDetailLoading(true);
      try {
        const res = await fetch(`/api/zoho/purchaseorders/${po.id}`);
        if (res.ok) {
          const detail = await res.json();
          populateFormStates(detail);
        }
      } catch (err) {
        console.error("Failed to load PO details from Zoho", err);
      } finally {
        setPoDetailLoading(false);
      }
    }
  };

  const handleStartView = async (po) => {
    populateFormStates(po);
    setViewMode('view');
    setActiveDropdownIdx(null);
    if (po.id) {
      setPoDetailLoading(true);
      try {
        const res = await fetch(`/api/zoho/purchaseorders/${po.id}`);
        if (res.ok) {
          const detail = await res.json();
          populateFormStates(detail);
        }
      } catch (err) {
        console.error("Failed to load PO details from Zoho", err);
      } finally {
        setPoDetailLoading(false);
      }
    }
  };

  const handleStartClone = async (po) => {
    setActiveDropdownIdx(null);
    setEditIdx(null);
    populateFormStates(po);

    const todayStr = new Date().toISOString().split('T')[0];
    setPoDate(todayStr);

    try {
      const res = await fetch('/api/zoho/next-po-number');
      if (res.ok) {
        const data = await res.json();
        if (data.nextPoNumber) {
          setPoNumber(data.nextPoNumber);
        }
      }
    } catch (e) {
      setPoNumber('PO-' + String(poList.length + 1).padStart(5, '0'));
    }

    setViewMode('create');

    if (po.id) {
      setPoDetailLoading(true);
      try {
        const res = await fetch(`/api/zoho/purchaseorders/${po.id}`);
        if (res.ok) {
          const detail = await res.json();
          populateFormStates(detail);
          setPoDate(todayStr);
          const nextRes = await fetch('/api/zoho/next-po-number');
          if (nextRes.ok) {
            const nextData = await nextRes.json();
            if (nextData.nextPoNumber) {
              setPoNumber(nextData.nextPoNumber);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load PO details for cloning from Zoho", err);
      } finally {
        setPoDetailLoading(false);
      }
    }
  };

  // Helper to calculate next PO number matching Zoho Books format (PO-000XX)
  const getNextPoNumber = (list) => {
    let maxNum = 43;
    (list || []).forEach(p => {
      const str = String(p.poNo || p.id || '');
      const match = str.match(/^PO-(\d+)/i);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum && val < 2000) {
          maxNum = val;
        }
      }
    });
    return 'PO-' + String(maxNum + 1).padStart(5, '0');
  };

  // Triggers fresh form initialization
  const handleStartFreshPO = () => {
    setEditIdx(null);
    setPoNumber(getNextPoNumber(poList));
    fetch('/api/zoho/next-po-number')
      .then(res => res.json())
      .then(data => {
        if (data && data.nextPoNo) {
          setPoNumber(data.nextPoNo);
        }
      })
      .catch(() => {});
    setVendorName('');
    setBranch('');
    setContactPerson('');
    setContactNo('');
    setEmail('');
    setGstNo('');
    setDeliveryType('Organization');
    setDeliveryAddress('');
    setBillingAddress('');
    setSameAsDelivery(true);
    setPoDate(new Date().toISOString().split('T')[0]);
    setDeliveryDate('');
    setPaymentTerms('Net 30 Days');
    setPurchaser('Arun');
    setShipmentPref('Transport');
    setCurrency('INR - Indian Rupee');
    setProject('');
    setPriority('High');
    setScope('Vendor Scope');
    setTransportName('');
    setItems([]);
    setShippingCharges(0);
    setOtherCharges(0);
    setDiscountPct(0);
    setAttachedFiles([]);
    setNotes('');
    setTerms(`1. Material should be as per the agreed specification and quality.
2. Delivery should be made on or before the delivery date.
3. Payment will be released as per the agreed payment terms.
4. Any delay in delay may attract penalty as per company policy.
5. All disputes are subject to the jurisdiction of Nellore courts.`);
    setUseDefaultTerms(true);
    setApprovalRequired('Yes');
    setApprover('Velmurugan Rathinam (CEO)');
    setApprovalPriority('High');
    setViewMode('create');
  };

  const executeDeletePO = () => {
    if (deleteIdx !== null && poList[deleteIdx]) {
      const targetPO = poList[deleteIdx];
      const targetId = targetPO.id || targetPO.poNo || targetPO.zohoId;
      
      setPoList(prev => prev.filter((_, i) => i !== deleteIdx));
      setDeleteIdx(null);

      if (targetId) {
        fetch(`/api/zoho/purchaseorders/${encodeURIComponent(targetId)}`, {
          method: 'DELETE'
        }).then(res => res.json()).then(data => {
          console.log('PO deleted from Zoho & Control Room:', data);
          fetchZohoPOs();
        }).catch(err => {
          console.error('Failed to delete PO in backend:', err);
          fetchZohoPOs();
        });
      }
    }
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownIdx(null);
      setOpenPresetIdx(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    };
  }, []);

  const renderStatusBadge = (type, label) => {
    let bg = '';
    let text = '';
    let border = '';
    let displayLabel = label || 'OPEN';

    if (type === 'closed' || (label && (label.includes('CLOSED') || label.includes('Received')))) {
      bg = '#dcfce7';
      text = '#15803d';
      border = '1px solid #86efac';
      displayLabel = label || 'CLOSED / FULLY RECEIVED';
    } else if (type === 'approved' || label === 'Approved' || label === 'OPEN' || label === 'Issued') {
      bg = '#f0fdf4';
      text = '#15803d';
      border = '1px solid #bbf7d0';
      displayLabel = 'OPEN';
    } else if (type === 'partially_received' || (label && label.includes('PARTIALLY'))) {
      bg = '#fef3c7';
      text = '#b45309';
      border = '1px solid #fde68a';
      displayLabel = 'OPEN / PARTIALLY RECEIVED';
    } else if (type === 'shipped' || label === 'Shipped') {
      bg = '#faf5ff';
      text = '#7e22ce';
      border = '1px solid #e9d5ff';
      displayLabel = 'Shipped';
    } else if (type === 'rejected' || label === 'REJECTED') {
      bg = '#fee2e2';
      text = '#dc2626';
      border = '1px solid #fca5a5';
      displayLabel = 'REJECTED';
    } else if (label === 'Draft / Pending Approval' || label === 'WAITING FOR APPROVAL' || label === 'Pending Approval' || type === 'pending') {
      bg = '#fff7ed';
      text = '#c2410c';
      border = '1px solid #fdba74';
      displayLabel = 'Draft / Pending Approval';
    } else if (label === 'Draft' || label === 'DRAFT' || type === 'draft') {
      bg = '#f1f5f9';
      text = '#475569';
      border = '1px solid #cbd5e1';
      displayLabel = 'Draft';
    } else {
      bg = '#f0fdf4';
      text = '#15803d';
      border = '1px solid #bbf7d0';
      displayLabel = 'OPEN';
    }

    return (
      <span 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '6px',
          backgroundColor: bg,
          color: text,
          border: border,
          fontSize: '11px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: text, display: 'inline-block' }} />
        {displayLabel}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
      
      {/* ==================== VIEW 1: MAIN PO LIST SCREEN ==================== */}
      {viewMode === 'list' && (() => {
        const allStatusOptions = [
          'All',
          'Draft',
          'Draft / Pending Approval',
          'OPEN',
          'OPEN / PARTIALLY RECEIVED',
          'CLOSED / FULLY RECEIVED',
          'REJECTED'
        ];

        const filteredPOList = poList.filter(po => {
          const matchesSearch = po.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            po.vendor.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesStatus = statusFilter === 'All' || 
            (statusFilter === 'Draft' && (po.status === 'Draft' || po.statusType === 'draft')) ||
            (statusFilter === 'Draft / Pending Approval' && (po.status === 'Draft / Pending Approval' || po.status === 'WAITING FOR APPROVAL' || po.status === 'Pending Approval' || po.statusType === 'pending')) ||
            (statusFilter === 'OPEN' && (po.status === 'OPEN' || po.statusType === 'approved')) ||
            (statusFilter === 'OPEN / PARTIALLY RECEIVED' && (po.status.includes('PARTIALLY') || po.statusType === 'partially_received')) ||
            (statusFilter === 'CLOSED / FULLY RECEIVED' && (po.status.includes('CLOSED') || po.status.includes('FULLY RECEIVED') || po.statusType === 'closed')) ||
            (statusFilter === 'REJECTED' && (po.status === 'REJECTED' || po.statusType === 'rejected')) ||
            po.status === statusFilter;

          const matchesTab = poTab === 'All' || 
            (poTab === 'Draft' && (po.status === 'Draft' || po.status === 'WAITING FOR APPROVAL' || po.status === 'Pending Approval' || po.statusType === 'draft' || po.statusType === 'pending')) ||
            (poTab === 'Approved' && ((po.status === 'OPEN' || po.status === 'Approved' || po.statusType === 'approved') && !String(po.status).includes('PARTIALLY'))) ||
            (poTab === 'PARTIALLY_RECEIVED' && (po.status === 'OPEN / PARTIALLY RECEIVED' || String(po.status).includes('PARTIALLY') || po.statusType === 'partially_received')) ||
            (poTab === 'CLOSED' && (po.status === 'CLOSED / FULLY RECEIVED' || po.status === 'CLOSED' || po.statusType === 'closed')) ||
            (poTab === 'REJECTED' && (po.status === 'REJECTED' || po.statusType === 'rejected')) ||
            po.status === poTab;

          let matchesDate = true;
          if (filterDate) {
            if (po.poDate) {
              const pD = new Date(po.poDate);
              const fD = new Date(filterDate);
              if (!isNaN(pD.getTime()) && !isNaN(fD.getTime())) {
                const pStr = pD.toISOString().split('T')[0];
                const fStr = fD.toISOString().split('T')[0];
                if (pStr !== fStr && !String(po.poDate).includes(filterDate)) {
                  matchesDate = false;
                }
              } else if (!String(po.poDate).includes(filterDate)) {
                matchesDate = false;
              }
            } else {
              matchesDate = false;
            }
          }

          return matchesSearch && matchesStatus && matchesTab && matchesDate;
        });

        const sortedPOList = [...filteredPOList].sort((a, b) => {
          const parseNum = (item) => {
            const str = String(item.poNo || item.id || '');
            const match = str.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          };
          return parseNum(b) - parseNum(a);
        });

        const indexOfLastRow = currentPage * rowsPerPage;
        const indexOfFirstRow = indexOfLastRow - rowsPerPage;
        const currentRows = sortedPOList.slice(indexOfFirstRow, indexOfLastRow);
        const totalPages = Math.ceil(sortedPOList.length / rowsPerPage);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)', minWidth: 0, width: '100%' }}>
          
          {/* Header section with Action Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-text-primary)', margin: 0 }}>
                Purchase Orders (PO)
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Generate, tracking and dispatch management of corporate Purchase Orders
              </span>
            </div>
            
            <button 
              onClick={handleStartFreshPO}
              className="btn" 
              style={{ 
                backgroundColor: '#2563eb', 
                border: 'none', 
                color: 'white', 
                height: '38px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              Create PO
            </button>
          </div>


          {/* 1. FILTERS & SEARCH ROW CARD */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', width: '100%', boxSizing: 'border-box', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#f8fafc', width: '340px' }}>
              <Search style={{ width: '15px', height: '15px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search Purchase Orders (PO No, Vendor Name)..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#334155' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: 'white' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#64748b' }} />
                <input
                  type="date"
                  value={filterDate}
                  title="Filter by Date"
                  onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
                  style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'transparent' }}
                />
              </div>

              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', color: '#334155', outline: 'none' }}>
                {allStatusOptions.map(s => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'Status: All' : s}
                  </option>
                ))}
              </select>

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

          {/* 2. STATUS TABS ROW */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '20px', padding: '4px 0', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[
              { id: 'All', label: 'All Orders', count: poList.length, bg: '#e2e8f0', fg: '#475569' },
              { id: 'Draft', label: 'Draft / Pending Approval', count: poList.filter(po => po.status === 'Draft' || po.status === 'WAITING FOR APPROVAL' || po.status === 'Pending Approval' || po.statusType === 'draft' || po.statusType === 'pending').length, bg: '#fff7ed', fg: '#c2410c' },
              { id: 'Approved', label: 'Approved (OPEN)', count: poList.filter(po => (po.status === 'OPEN' || po.status === 'Approved' || po.statusType === 'approved') && !String(po.status).includes('PARTIALLY')).length, bg: '#dcfce7', fg: '#166534' },
              { id: 'PARTIALLY_RECEIVED', label: 'Open / Partially Received', count: poList.filter(po => po.status === 'OPEN / PARTIALLY RECEIVED' || String(po.status).includes('PARTIALLY') || po.statusType === 'partially_received').length, bg: '#fef3c7', fg: '#b45309' },
              { id: 'CLOSED', label: 'Closed / Fully Received', count: poList.filter(po => po.status === 'CLOSED / FULLY RECEIVED' || po.status === 'CLOSED' || po.statusType === 'closed').length, bg: '#dcfce7', fg: '#15803d' },
              { id: 'REJECTED', label: 'Rejected', count: poList.filter(po => po.status === 'REJECTED' || po.statusType === 'rejected').length, bg: '#fee2e2', fg: '#dc2626' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setPoTab(tab.id); setCurrentPage(1); }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '10px 4px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: poTab === tab.id ? '#2563eb' : '#64748b',
                  borderBottom: poTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: tab.bg, color: tab.fg, padding: '1px 6px', borderRadius: '10px' }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* PO Table */}
          <div className="section-card" style={{ padding: 0, overflowX: 'auto', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
            <div className="table-responsive" style={{ border: 'none', borderRadius: 0, margin: 0, overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
              <table className="ds-table" style={{ fontSize: '13px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        onChange={(e) => handleSelectAll(e, filteredPOList)}
                        checked={filteredPOList.length > 0 && filteredPOList.every(po => selectedPOs.includes(po.poNo))}
                      />
                    </th>
                    <th>PO No.</th>
                    <th>Vendor Name</th>
                    <th>PO Date</th>
                    <th>Expected Delivery</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" defaultChecked={false} disabled />
                        </td>
                        {Array.from({ length: 6 }).map((_, cIdx) => (
                          <td key={cIdx}>
                            <div className="skeleton-shimmer skeleton-text" style={{ width: `${50 + (cIdx * 9) % 40}%`, height: '14px' }} />
                          </td>
                        ))}
                        <td style={{ textAlign: 'center' }}>
                          <div className="skeleton-shimmer" style={{ width: '28px', height: '28px', borderRadius: '6px', margin: '0 auto' }} />
                        </td>
                      </tr>
                    ))
                  ) : (() => {
                    return currentRows.map((po, idx) => {
                      const isChecked = selectedPOs.includes(po.poNo);
                      return (
                        <tr 
                          key={idx} 
                          style={{ 
                            borderBottom: idx === currentRows.length - 1 ? 'none' : '1px solid #f1f5f9',
                            transition: 'background-color 0.2s',
                            backgroundColor: isChecked ? '#f8fafc' : 'transparent'
                          }}
                          className="table-row-hover"
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleSelectRow(po.poNo)}
                            />
                          </td>
                          <td>
                            <a 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleStartView(po);
                              }}
                              style={{ fontWeight: '600', color: '#2563eb', textDecoration: 'none' }}
                            >
                              {po.poNo}
                            </a>
                          </td>
                          <td style={{ fontWeight: '500', color: '#1e293b' }}>{po.vendor}</td>
                          <td style={{ color: '#64748b' }}>{po.poDate}</td>
                          <td style={{ color: '#64748b' }}>{po.deliveryDate}</td>
                          <td style={{ fontWeight: '600', color: '#1e293b' }}>{po.amount}</td>
                          <td>
                            {renderStatusBadge(po.statusType, po.status)}
                          </td>
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownIdx(activeDropdownIdx === idx ? null : idx);
                              }}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '6px', borderRadius: '4px' }}
                            >
                              <MoreVertical style={{ width: '16px', height: '16px' }} />
                            </button>
                            
                            {activeDropdownIdx === idx && (
                              <div 
                                style={{
                                  position: 'absolute',
                                  right: '24px',
                                  top: '38px',
                                  backgroundColor: 'white',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                  zIndex: 50,
                                  minWidth: '100px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden'
                                }}
                              >
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartView(po);
                                  }}
                                  style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: '500', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <Eye style={{ width: '12px', height: '12px', color: '#3b82f6' }} />
                                  View
                                </button>
                                <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleStartClone(po);
                                   }}
                                   style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: '500', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #f1f5f9' }}
                                 >
                                   <Copy style={{ width: '12px', height: '12px', color: '#6366f1' }} />
                                   Clone PO
                                 </button>
                                {po.statusType !== 'approved' && po.statusType !== 'shipped' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEdit(po, idx);
                                    }}
                                    style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: '500', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #f1f5f9' }}
                                  >
                                    <Edit style={{ width: '12px', height: '12px', color: '#10b981' }} />
                                    Edit
                                  </button>
                                )}
                                {(po.status === 'WAITING FOR APPROVAL' || po.status === 'Pending Approval' || po.statusType === 'pending') && (
                                  <>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setApprovingPo(po);
                                        setActiveDropdownIdx(null);
                                      }}
                                      style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #f1f5f9' }}
                                    >
                                      <CheckCircle style={{ width: '12px', height: '12px', color: '#16a34a' }} />
                                      Approve PO
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRejectingPo(po);
                                        setActiveDropdownIdx(null);
                                      }}
                                      style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #f1f5f9' }}
                                    >
                                      <X style={{ width: '12px', height: '12px', color: '#dc2626' }} />
                                      Reject PO
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteIdx(idx);
                                    setActiveDropdownIdx(null);
                                  }}
                                  style={{ border: 'none', background: 'transparent', textAlign: 'left', padding: '8px 12px', fontSize: '12px', fontWeight: '500', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #f1f5f9' }}
                                >
                                  <Trash2 style={{ width: '12px', height: '12px', color: '#ef4444' }} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              {/* 4. PAGINATION FOOTER */}
              {filteredPOList.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredPOList.length)} of {filteredPOList.length} entries
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Rows per page:</span>
                      <select 
                        value={rowsPerPage} 
                        onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                        style={{ height: '30px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', padding: '0 4px', backgroundColor: 'white' }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        style={{ border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                      >
                        <ChevronLeft style={{ width: '14px', height: '14px' }} />
                      </button>
                      
                      {(() => {
                        let start = Math.max(1, currentPage - 1);
                        let end = start + 3;
                        if (end > totalPages) {
                          end = totalPages;
                          start = Math.max(1, end - 3);
                        }
                        const pages = [];
                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }
                        return pages;
                      })().map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            border: page === currentPage ? 'none' : '1px solid #cbd5e1',
                            background: page === currentPage ? '#2563eb' : 'white',
                            color: page === currentPage ? 'white' : '#475569',
                            cursor: 'pointer',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontWeight: page === currentPage ? 'bold' : 'normal'
                          }}
                        >
                          {page}
                        </button>
                      ))}

                      <button 
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        style={{ border: '1px solid #cbd5e1', background: (currentPage === totalPages || totalPages === 0) ? '#f1f5f9' : 'white', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                      >
                        <ChevronRight style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ==================== VIEW 2: DEDICATED FULL-PAGE CREATOR/EDITOR/VIEW SCREEN ==================== */}
      {(viewMode === 'create' || viewMode === 'edit' || viewMode === 'view') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#1e293b' }}>
          
          {/* Title Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                {viewMode === 'view' ? 'View Purchase Order' : viewMode === 'edit' ? 'Edit Purchase Order' : 'Create Purchase Order'}
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                {viewMode === 'view' ? `Details of purchase order ${poNumber}.` : 'Fill in the details below to create a new purchase order.'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {viewMode === 'view' ? (
                <>
                  <button 
                    type="button"
                    onClick={() => setViewMode('list')}
                    style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                  >
                    Back to List
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      const matchedPo = poList.find(p => p.poNo === poNumber || p.id === poNumber) || {
                        poNo: poNumber, vendor: vendorName, branch, contactPerson, contactNo, email, gstNo,
                        deliveryType, deliveryAddress, billingAddress, poDate, deliveryDate, paymentTerms,
                        purchaser, shipmentPref, currency, project, priority, items, shippingCharges, otherCharges,
                        discountPct, notes, terms, approvalRequired, approver
                      };
                      handleStartClone(matchedPo);
                    }}
                    style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', color: '#4338CA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Copy style={{ width: '14px', height: '14px', color: '#4338CA' }} /> Clone PO
                  </button>
                  <button 
                    type="button"
                    style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                  >
                    Generate PDF
                  </button>
                  <button 
                    type="button"
                    style={{ backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Mail style={{ width: '14px', height: '14px' }} /> Share as mail
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                  >
                    Generate PDF
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => executeCreatePO(e, 'Draft')}
                    style={{ backgroundColor: '#fff7ed', border: '1px solid #fdba74', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', color: '#c2410c', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FileText style={{ width: '15px', height: '15px' }} />
                    Save as Draft
                  </button>
                  <button 
                    type="button"
                    onClick={triggerSaveConfirm}
                    style={{ backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', padding: '8px 24px', fontSize: '13px', fontWeight: '600', color: 'white', cursor: 'pointer' }}
                  >
                    Send for Approval
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Form Content Cards */}

          {/* Skeleton loader — shown while Zoho PO detail is fetching */}
          {poDetailLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="section-card" style={{ padding: '30px', borderRadius: '16px', borderTop: '4px solid #2563EB', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '40%' }}>
                    <div className="skeleton-shimmer" style={{ height: '22px', width: '70%', borderRadius: '6px' }} />
                    <div className="skeleton-shimmer skeleton-text" style={{ height: '13px', width: '90%' }} />
                    <div className="skeleton-shimmer skeleton-text" style={{ height: '13px', width: '75%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', width: '30%' }}>
                    <div className="skeleton-shimmer" style={{ height: '20px', width: '80%', borderRadius: '6px' }} />
                    <div className="skeleton-shimmer skeleton-text" style={{ height: '14px', width: '60%' }} />
                    <div className="skeleton-shimmer skeleton-text" style={{ height: '14px', width: '50%' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="skeleton-shimmer skeleton-text" style={{ height: '11px', width: '40%' }} />
                      <div className="skeleton-shimmer skeleton-text" style={{ height: '14px', width: '70%' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="section-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="skeleton-shimmer" style={{ height: '18px', width: '180px', borderRadius: '6px' }} />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <div className="skeleton-shimmer skeleton-text" style={{ height: '13px', width: '80%' }} />
                    <div className="skeleton-shimmer skeleton-text" style={{ height: '13px', width: '60%' }} />
                    <div className="skeleton-shimmer skeleton-text" style={{ height: '13px', width: '50%' }} />
                    <div className="skeleton-shimmer skeleton-text" style={{ height: '13px', width: '60%' }} />
                    <div className="skeleton-shimmer skeleton-text" style={{ height: '13px', width: '70%' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span style={{ fontSize: '13px', color: '#1D4ED8', fontWeight: '600' }}>Loading PO details from Zoho Books…</span>
              </div>
            </div>
          )}

          {viewMode === 'view' && !poDetailLoading ? (
            /* ==================== PREMIUM READ-ONLY PO DOCUMENT LAYOUT ==================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              
              {/* Visual PO Workflow History Timeline */}
              <div className="section-card" style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PO Lifecycle & Workflow History</strong>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>PO Ref: {poNumber}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', padding: '10px 0' }}>
                  {(() => {
                    const st = String(viewingPoStatus || 'OPEN').trim();
                    const isClosed = st.includes('CLOSED') || st.includes('FULLY RECEIVED');
                    const isPartial = st.includes('PARTIALLY');
                    const isOpen = st === 'OPEN' || st === 'Approved' || st === 'Issued';
                    const isPending = st.includes('Pending') || st.includes('WAITING') || st === 'Draft / Pending Approval';
                    const isDraft = st === 'Draft' || st === 'DRAFT';

                    return [
                      { label: 'Created (Draft)', done: true, current: isDraft },
                      { label: 'Draft / Pending Approval', done: !isDraft, current: isPending },
                      { label: 'Approved (OPEN)', done: (isOpen || isPartial || isClosed), current: isOpen },
                      { label: 'GRN Progress', done: (isPartial || isClosed), current: isPartial },
                      { label: 'Closed / Fully Received', done: isClosed, current: isClosed }
                    ];
                  })().map((step, idx, arr) => (
                    <React.Fragment key={idx}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2, flex: 1 }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: step.current ? (step.label.includes('Closed') ? '#166534' : '#2563EB') : (step.done ? '#16A34A' : '#E2E8F0'),
                          color: (step.current || step.done) ? '#FFFFFF' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          boxShadow: step.current ? '0 0 0 4px #DBEAFE' : 'none'
                        }}>
                          {step.done ? '✓' : (idx + 1)}
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: step.current ? 'bold' : '600', color: step.current ? (step.label.includes('Closed') ? '#166534' : '#2563EB') : (step.done ? '#166534' : '#64748B'), textAlign: 'center' }}>
                          {step.label}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ height: '2px', backgroundColor: step.done ? '#16A34A' : '#E2E8F0', flex: 1, marginTop: '-16px' }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Official Purchase Order Header Card */}
              <div className="section-card" style={{ padding: '30px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', borderTop: '4px solid #2563EB', backgroundColor: '#FFFFFF', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: 0, letterSpacing: '-0.5px' }}>VRM STRUCTURES PVT LTD</h1>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '4px' }}>No.684, Podalakur Road, Nellore - 524002, Nellore, Nellore, Nellore, Nellore</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>GSTIN: 37AAACT2727Q1ZS | contact@vrmstructures.com</span>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', letterSpacing: '1px' }}>PURCHASE ORDER</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#2563EB' }}>{poNumber}</strong>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        backgroundColor: (priority === 'Critical' || priority === 'High') ? '#FEE2E2' : (priority === 'Medium' ? '#FEF3C7' : '#EFF6FF'),
                        color: (priority === 'Critical' || priority === 'High') ? '#EF4444' : (priority === 'Medium' ? '#D97706' : '#2563EB')
                      }}>{priority} Priority</span>
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: 0 }} />

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold' }}>PO Date</span>
                    <strong style={{ color: '#1E293B', display: 'block', marginTop: '2px' }}>{poDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold' }}>Expected Delivery Date</span>
                    <strong style={{ color: '#1E293B', display: 'block', marginTop: '2px' }}>{deliveryDate || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold' }}>Payment Terms</span>
                    <strong style={{ color: '#1E293B', display: 'block', marginTop: '2px' }}>{paymentTerms}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold' }}>PO Issued By</span>
                    <strong style={{ color: '#1E293B', display: 'block', marginTop: '2px' }}>{purchaser}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '11px' }}>
                  
                  {/* Vendor Details Card */}
                  <div style={{ border: '1px solid #F1F5F9', borderRadius: '8px', padding: '16px', backgroundColor: '#F8FAFC' }}>
                    <strong style={{ fontSize: '11px', color: '#2563EB', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Vendor Details</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>{vendorName}</strong>
                      {branch && <span style={{ color: '#475569' }}>Branch: {branch}</span>}
                      {contactPerson && <span style={{ color: '#475569' }}>Attn: {contactPerson}</span>}
                      {contactNo && <span style={{ color: '#475569' }}>Phone: {contactNo}</span>}
                      {email && <span style={{ color: '#475569' }}>Email: {email}</span>}
                      {gstNo && <span style={{ color: '#475569', fontWeight: 'bold' }}>GSTIN: {gstNo}</span>}
                    </div>
                  </div>

                  {/* Address Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ border: '1px solid #F1F5F9', borderRadius: '8px', padding: '12px', backgroundColor: '#FFFFFF' }}>
                      <strong style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Delivery Address</strong>
                      <span style={{ color: '#334155', lineHeight: '1.4' }}>{deliveryAddress || '—'}</span>
                    </div>
                    <div style={{ border: '1px solid #F1F5F9', borderRadius: '8px', padding: '12px', backgroundColor: '#FFFFFF' }}>
                      <strong style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Billing Address</strong>
                      <span style={{ color: '#334155', lineHeight: '1.4' }}>{billingAddress || '—'}</span>
                    </div>
                  </div>

                </div>

                {/* Line Items Table */}
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="custom-table detail-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '8px', textAlign: 'center', width: '40px' }}>#</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Item & Description</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Account</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Unit</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Rate (₹)</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>GST (%)</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const itemTax = (item.tax !== undefined && item.tax !== '' && !isNaN(Number(item.tax))) ? Number(item.tax) : 18;
                        const qtyNum = Number(item.qty) || 0;
                        const rateNum = Number(item.rate) || 0;
                        const total = qtyNum * rateNum;
                        const taxAmt = total * (itemTax / 100);
                        const finalAmt = total + taxAmt;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748B' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 8px', color: '#1E293B' }}>
                              <div style={{ fontWeight: '600' }}>{item.name}</div>
                              {item.description && (
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: '400', lineHeight: '1.3' }}>
                                  {item.description}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 8px', color: '#475569' }}>{item.account}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold' }}>{qtyNum}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748B' }}>{item.unit}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'right' }}>{rateNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748B' }}>{itemTax}%</td>
                            <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#0F172A' }}>{finalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>No items added.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Notes and Calculations */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '11px' }}>
                    {notes && (
                      <div>
                        <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>Notes & Remarks</strong>
                        <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid #F1F5F9', backgroundColor: '#F8FAFC', color: '#334155', whiteSpace: 'pre-wrap' }}>{notes}</div>
                      </div>
                    )}
                    {terms && (
                      <div>
                        <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>Terms & Conditions</strong>
                        <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid #F1F5F9', backgroundColor: '#F8FAFC', color: '#334155', whiteSpace: 'pre-wrap' }}>{terms}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Subtotal</span>
                      <strong style={{ color: '#1E293B' }}>₹ {items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    {discountPct > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}>
                        <span>Discount ({discountPct}%)</span>
                        <strong>- ₹ {(items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0) * (discountPct / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>CGST ({getEffectiveCGSTPct().toFixed(0)}%)</span>
                      <strong style={{ color: '#1E293B' }}>₹ {getCGST().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>SGST ({getEffectiveSGSTPct().toFixed(0)}%)</span>
                      <strong style={{ color: '#1E293B' }}>₹ {getSGST().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    {shippingCharges > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Shipping Charges</span>
                        <strong style={{ color: '#1E293B' }}>₹ {shippingCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    )}
                    {otherCharges > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Other Charges</span>
                        <strong style={{ color: '#1E293B' }}>₹ {otherCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                      </div>
                    )}
                    <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <strong style={{ color: '#0F172A' }}>Grand Total</strong>
                      <strong style={{ color: '#2563EB', fontSize: '14px' }}>₹ {getGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                </div>

                {/* Priority & Project information */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '16px', fontSize: '11px', color: '#475569' }}>
                  {approvalRequired === 'Yes' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                      <span>Approval required from <strong>{approver}</strong></span>
                    </div>
                  )}
                  {scope && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                      <span>Scope: <strong>{scope}</strong></span>
                    </div>
                  )}
                  {shipmentPref && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                      <span>Shipment Preference: <strong>{shipmentPref}</strong></span>
                    </div>
                  )}
                  {shipmentPref === 'Transport' && transportName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06B6D4' }} />
                      <span>Transport Name: <strong>{transportName}</strong></span>
                    </div>
                  )}
                  {project && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
                      <span>Project: <strong>{project}</strong></span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            /* ==================== CREATOR & EDITOR ACTIVE FIELDS LAYOUT ==================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 1. Vendor Information */}
              <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <strong style={{ fontSize: '14px', color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>1. Vendor Information</strong>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      Vendor Name <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <select 
                      value={vendorName} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setVendorName(val);
                        const found = zohoVendors.find(v => v.name === val);
                        if (found) {
                          setContactPerson(found.contact || '');
                          setContactNo(found.phone || found.mobile || '');
                          setEmail(found.email || '');
                          setGstNo(found.gstin || found.gstNo || '33ABCDE1234F1Z5');
                          const vAddr = found.billingAddress || found.address || found.registeredAddress || `${val}, Main Road, Industrial Estate, Tamil Nadu - 600028`;
                          setBillingAddress(vAddr);
                        }
                      }} 
                      required 
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', color: '#334155', width: '100%', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="" disabled>Select Zoho Vendor...</option>
                      {zohoVendors.map((v, idx) => (
                        <option key={idx} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Branch</label>
                    <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Vendor Contact Person</label>
                    <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Contact Number</label>
                    <input type="text" value={contactNo} onChange={(e) => setContactNo(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Email ID</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>GST Number</label>
                    <input type="text" value={gstNo} onChange={(e) => setGstNo(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', textTransform: 'uppercase' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Delivery To:</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '500', color: '#475569', fontSize: '12px' }}>
                    <input type="radio" name="deliveryType" value="Organization" checked={deliveryType === 'Organization'} onChange={() => setDeliveryType('Organization')} /> Organization
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '500', color: '#475569', fontSize: '12px' }}>
                    <input type="radio" name="deliveryType" value="Customer" checked={deliveryType === 'Customer'} onChange={() => setDeliveryType('Customer')} /> Customer
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      Delivery Address <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <textarea 
                      value={deliveryAddress} 
                      onChange={(e) => setDeliveryAddress(e.target.value)} 
                      rows="3" 
                      required 
                      placeholder="Enter destination delivery address..." 
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', resize: 'none' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Billing Address</label>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>Auto-populated from Vendor</span>
                    </div>
                    <textarea 
                      value={billingAddress} 
                      readOnly 
                      rows="3" 
                      placeholder="Select vendor to auto-populate billing address..." 
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', resize: 'none', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '500' }} 
                    />
                  </div>
                </div>

              </div>

              {/* 2. Purchase Order Information */}
              <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <strong style={{ fontSize: '14px', color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>2. Purchase Order Information</strong>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>PO Number</label>
                    <input type="text" value={poNumber} disabled style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: '#f8fafc', color: '#64748b' }} />
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>(Auto Generated)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      PO Date <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} required style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      Expected Delivery Date <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      Payment Terms <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }}>
                      <option>Net 30 Days</option>
                      <option>Net 45 Days</option>
                      <option>Net 60 Days</option>
                      <option>Immediate</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      PO Issued By <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      readOnly 
                      value="Arun" 
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: '#F8FAFC', color: '#334155', fontWeight: '600' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      Shipment Preference <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <select value={shipmentPref} onChange={(e) => setShipmentPref(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', color: '#334155' }}>
                      <option value="" disabled>Select Shipment Preference</option>
                      <option value="Transport">Transport</option>
                      <option value="Dedicated Vehicle">Dedicated Vehicle</option>
                      <option value="Own Vehicle">Own Vehicle</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: shipmentPref === 'Transport' ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      Scope <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <select value={scope} onChange={(e) => setScope(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', color: '#334155' }}>
                      <option value="Vendor Scope">Vendor Scope</option>
                      <option value="VRM Scope">VRM Scope</option>
                    </select>
                  </div>

                  {shipmentPref === 'Transport' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                        Transport Name / Carrier <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        value={transportName} 
                        onChange={(e) => setTransportName(e.target.value)} 
                        placeholder="e.g. A2B transport, Blackbird..." 
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', color: '#334155' }} 
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      Currency <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      readOnly 
                      value="INR - Indian Rupee" 
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: '#F8FAFC', color: '#334155', fontWeight: '600' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                      Priority <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                    </label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', color: '#334155' }}>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* 3. Items Table */}
              <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' }}>
                <strong style={{ fontSize: '14px', color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', margin: '0 20px' }}>3. Line Items</strong>
                
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Item & Description *</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', width: '150px' }}>Account</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '80px' }}>Qty *</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '80px' }}>Unit</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', width: '110px' }}>Rate (₹) *</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '90px' }}>GST (%)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', width: '110px' }}>Amount (₹)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const total = (item.qty || 0) * (item.rate || 0);
                        const taxAmt = total * ((item.tax || 0) / 100);
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <select 
                                  value={item.name} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const found = zohoItems.find(zi => zi.name === val);
                                    handleItemChange(idx, 'name', val);
                                    if (found) {
                                      handleItemChange(idx, 'rate', found.rate || 0);
                                      handleItemChange(idx, 'unit', (found.unit || 'NOS').toUpperCase());
                                      if (found.description && !item.description) {
                                        handleItemChange(idx, 'description', found.description);
                                      }
                                    }
                                  }} 
                                  required 
                                  style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px', backgroundColor: 'white', color: '#334155', cursor: 'pointer', outline: 'none' }}
                                >
                                  <option value="" disabled>Select Zoho Item...</option>
                                  {zohoItems.map((zi, zidx) => (
                                    <option key={zidx} value={zi.name}>{zi.name}</option>
                                  ))}
                                </select>
                                <input 
                                  type="text" 
                                  value={item.description || ''} 
                                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)} 
                                  placeholder="Enter item description / specifications..." 
                                  style={{ width: '100%', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '11px', backgroundColor: '#f8fafc', color: '#334155', outline: 'none' }} 
                                />
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <select value={item.account} onChange={(e) => handleItemChange(idx, 'account', e.target.value)} style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '12px' }}>
                                <option>Raw Material</option>
                                <option>Consumables</option>
                                <option>Fasteners</option>
                                <option>Tools</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value === '' ? '' : Number(e.target.value))} required style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 4px', fontSize: '12px', textAlign: 'center' }} />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <select value={item.unit} onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 4px', fontSize: '12px' }}>
                                <option>MT</option>
                                <option>NOS</option>
                                <option>KG</option>
                                <option>PCS</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input type="number" value={item.rate} onChange={(e) => handleItemChange(idx, 'rate', e.target.value === '' ? '' : Number(e.target.value))} required style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px', textAlign: 'right' }} />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <select 
                                value={item.tax !== undefined && item.tax !== '' ? Number(item.tax) : 18} 
                                onChange={(e) => handleItemChange(idx, 'tax', Number(e.target.value))} 
                                style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 4px', fontSize: '12px' }}
                              >
                                <option value={18}>18%</option>
                                <option value={16}>16%</option>
                                <option value={12}>12%</option>
                                <option value={5}>5%</option>
                                <option value={0}>0%</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>
                              ₹{(total + taxAmt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button type="button" onClick={() => handleRemoveItem(idx)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                <Trash2 style={{ width: '14px', height: '14px' }} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ margin: '0 20px' }}>
                  <button type="button" onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                    <Plus style={{ width: '14px', height: '14px' }} /> Add Line Item
                  </button>
                </div>

              </div>

              {/* 4. Calculations Summary & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                
                {/* Notes & Terms */}
                <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <strong style={{ fontSize: '14px', color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Notes & Terms</strong>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Notes & Remarks</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="Add remarks for internal reference..." style={{ borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', resize: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Terms & Conditions</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                        <input type="checkbox" checked={useDefaultTerms} onChange={(e) => {
                          setUseDefaultTerms(e.target.checked);
                          if (e.target.checked) setTerms(`1. Material should be as per the agreed specification and quality.
2. Delivery should be made on or before the delivery date.
3. Payment will be released as per the agreed payment terms.
4. Any delay in delay may attract penalty as per company policy.
5. All disputes are subject to the jurisdiction of Nellore courts.`);
                        }} /> Use Default
                      </label>
                    </div>
                    <textarea value={terms} onChange={(e) => setTerms(e.target.value)} disabled={useDefaultTerms} rows="4" style={{ borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', resize: 'none', backgroundColor: useDefaultTerms ? '#f8fafc' : 'white' }} />
                  </div>
                </div>

                {/* Calculations Summary */}
                <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc' }}>
                  <strong style={{ fontSize: '14px', color: '#2563eb', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Summary Details</strong>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Subtotal</span>
                    <strong style={{ color: '#334155' }}>₹ {items.reduce((acc, curr) => acc + ((curr.qty || 0) * (curr.rate || 0)), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Discount (%)</span>
                    <input type="number" value={discountPct} onChange={(e) => setDiscountPct(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '60px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', textAlign: 'right', fontSize: '12px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>CGST ({getEffectiveCGSTPct().toFixed(0)}%)</span>
                    <strong style={{ color: '#334155' }}>₹ {getCGST().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>SGST ({getEffectiveSGSTPct().toFixed(0)}%)</span>
                    <strong style={{ color: '#334155' }}>₹ {getSGST().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Shipping Charges (₹)</span>
                    <input type="number" value={shippingCharges} onChange={(e) => setShippingCharges(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', textAlign: 'right', fontSize: '12px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <span style={{ color: '#64748b' }}>Other Charges (₹)</span>
                    <input type="number" value={otherCharges} onChange={(e) => setOtherCharges(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', textAlign: 'right', fontSize: '12px' }} />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>Grand Total</strong>
                    <strong style={{ fontSize: '15px', color: '#2563eb' }}>
                      ₹{getGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>

                </div>

              </div>

              {/* 5. Approval Info */}
              <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <strong style={{ fontSize: '14px', color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>5. Approval Workflows</strong>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Requires CEO / Director Approval?</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '500', color: '#475569', fontSize: '12px' }}>
                    <input type="radio" name="approvalRequired" value="Yes" checked={approvalRequired === 'Yes'} onChange={() => setApprovalRequired('Yes')} /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '500', color: '#475569', fontSize: '12px' }}>
                    <input type="radio" name="approvalRequired" value="No" checked={approvalRequired === 'No'} onChange={() => setApprovalRequired('No')} /> No
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Designated Approver</label>
                    <input type="text" value={approver} disabled style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: '#f8fafc', color: '#64748b' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Approval Priority</label>
                    <select value={approvalPriority} onChange={(e) => setApprovalPriority(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }}>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION POPUP ==================== */}
      {deleteIdx !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', width: '420px', padding: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '12px', fontWeight: '800', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.15em' }}>
              URGENT
            </div>
            <div style={{ padding: '16px', border: '1.5px dashed #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Delete Purchase Order?</h3>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{poList[deleteIdx].poDate}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Are you sure you want to permanently delete Purchase Order <strong>{poList[deleteIdx].poNo}</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                <button onClick={() => setDeleteIdx(null)} style={{ border: 'none', backgroundColor: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button onClick={executeDeletePO} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Delete PO</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SAVE CONFIRMATION POPUP ==================== */}
      {showSaveConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', width: '420px', padding: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ backgroundColor: '#2563eb', color: 'white', fontSize: '12px', fontWeight: '800', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.15em' }}>
              CONFIRM
            </div>
            <div style={{ padding: '16px', border: '1.5px dashed #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Save Purchase Order?</h3>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Please confirm the details of purchase order <strong>{poNumber}</strong>:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#475569', paddingLeft: '8px', borderLeft: '3px solid #3b82f6' }}>
                <div><strong>Vendor:</strong> {vendorName || 'Fresh Vendor'}</div>
                <div><strong>Total Amount:</strong> ₹{getGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                <button onClick={() => setShowSaveConfirm(false)} style={{ border: 'none', backgroundColor: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Discard</button>
                <button onClick={executeCreatePO} style={{ backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Save PO</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CANCEL/DISCARD DETAILS CONFIRMATION POPUP ==================== */}
      {showCancelConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', width: '420px', padding: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ backgroundColor: '#f97316', color: 'white', fontSize: '12px', fontWeight: '800', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.15em' }}>
              DISCARD
            </div>
            <div style={{ padding: '16px', border: '1.5px dashed #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Discard Changes?</h3>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Are you sure you want to discard your changes? All unsaved details for this Purchase Order will be lost.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                <button onClick={() => setShowCancelConfirm(false)} style={{ border: 'none', backgroundColor: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>No, Go Back</button>
                <button onClick={() => {
                  setShowCancelConfirm(false);
                  setViewMode('list');
                }} style={{ backgroundColor: '#ffedd5', color: '#ea580c', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Discard Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CEO REJECTION MODAL */}
      {rejectingPo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', width: '450px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#dc2626', color: 'white', fontSize: '12px', fontWeight: '800', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.15em' }}>
              REJECT PURCHASE ORDER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Reject PO {rejectingPo.poNo}?</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Vendor: <strong>{rejectingPo.vendor}</strong> | Amount: <strong>{rejectingPo.amount}</strong></span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626' }}>Rejection Reason (Mandatory) *</label>
                <textarea 
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Enter detailed reason for rejecting this PO..."
                  style={{ height: '70px', borderRadius: '8px', border: '1.5px solid #fca5a5', padding: '8px 12px', fontSize: '12px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button onClick={() => { setRejectingPo(null); setRejectionReasonInput(''); }} style={{ border: 'none', backgroundColor: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => handleRejectPoSubmit(rejectingPo)} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Confirm Rejection</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CEO APPROVAL MODAL */}
      {approvingPo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', width: '450px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#16a34a', color: 'white', fontSize: '12px', fontWeight: '800', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.15em' }}>
              APPROVE PURCHASE ORDER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Approve PO {approvingPo.poNo}?</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Vendor: <strong>{approvingPo.vendor}</strong> | Amount: <strong>{approvingPo.amount}</strong></span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Approval Remarks (Optional)</label>
                <textarea 
                  value={approvalRemarksInput}
                  onChange={(e) => setApprovalRemarksInput(e.target.value)}
                  placeholder="Enter approval remarks or notes..."
                  style={{ height: '60px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '8px 12px', fontSize: '12px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button onClick={() => { setApprovingPo(null); setApprovalRemarksInput(''); }} style={{ border: 'none', backgroundColor: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => handleApprovePoSubmit(approvingPo)} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Approve & Issue PO</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MANDATORY VALIDATION MODAL */}
      {validationErrorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', width: '460px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Mandatory Fields Required</h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>Please complete all required fields to move forward.</p>
              </div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>You did not fill out the following mandatory box(es):</span>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#DC2626', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {validationErrorModal.fields.map((field, idx) => (
                  <li key={idx}><strong>{field}</strong></li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button 
                onClick={() => setValidationErrorModal(null)} 
                style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}
              >
                OK, I'll fill it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
