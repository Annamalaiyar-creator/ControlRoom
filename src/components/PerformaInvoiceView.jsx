import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Check, Hourglass, Edit3, Trash2, Eye, FileText, X, UploadCloud, CheckCircle, Search, AlertTriangle, ArrowLeft, ArrowRight, MoreVertical, Edit, Info, Calendar, Filter, ChevronLeft, ChevronRight, RotateCcw, Layers, Tag, MoreHorizontal, Download, Building2, Truck, Boxes, User, Landmark, ShieldCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';
import SearchablePresetSelector from './SearchablePresetSelector';
import { VRM_HDG_PRESETS, getAllActivePresets } from '../vrmHdgProposalPresets';

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
    status: 'Approved',
    statusType: 'approved',
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
    status: 'Pending Approval',
    statusType: 'pending',
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
    status: 'Pending Approval',
    statusType: 'pending',
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
    status: 'Pending Approval',
    statusType: 'pending',
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
    status: 'Approved',
    statusType: 'approved',
    type: 'Procurement PI'
  }
];

export default function PerformaInvoiceView({ onConvertToBom, userRole = 'Procurement Head' }) {
  const isSalesRole = userRole === 'Sales Head' || userRole === 'Sales Executive';
  const storageKey = isSalesRole ? 'controlroom_sales_pi_store' : 'controlroom_procurement_pi_store';

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [selectedPi, setSelectedPi] = useState(null); // For viewing details popup overlay
  const [searchQuery, setSearchQuery] = useState('');
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);

  const [piList, setPiList] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // If procurement store is checked but sales has records, check if user has converted PIs
      if (!isSalesRole) {
        const salesSaved = localStorage.getItem('controlroom_sales_pi_store');
        if (salesSaved) {
          const salesParsed = JSON.parse(salesSaved);
          if (Array.isArray(salesParsed) && salesParsed.length > 0) {
            return [...salesParsed, ...defaultProcurementPIs];
          }
        }
      }
    } catch (e) {}
    return isSalesRole ? defaultSalesPIs : defaultProcurementPIs;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPiList(parsed);
          return;
        }
      }
      if (!isSalesRole) {
        const salesSaved = localStorage.getItem('controlroom_sales_pi_store');
        if (salesSaved) {
          const salesParsed = JSON.parse(salesSaved);
          if (Array.isArray(salesParsed) && salesParsed.length > 0) {
            setPiList([...salesParsed, ...defaultProcurementPIs]);
            return;
          }
        }
      }
    } catch (e) {}
    setPiList(isSalesRole ? defaultSalesPIs : defaultProcurementPIs);
  }, [storageKey, isSalesRole]);

  const updatePiList = (newList) => {
    setPiList(newList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newList));
    } catch (e) {}
  };

  const handleConvertToBom = (pi) => {
    if (!pi) return;
    const cleanAmount = parseFloat(String(pi.amount || '').replace(/[^0-9.]/g, '')) || 0;
    const qty = parseFloat(pi.quantity) || 1;
    const rate = pi.unitValue || (cleanAmount > 0 ? cleanAmount / qty : 1000);

    const conversionData = {
      sourcePiNo: pi.piNo,
      customerName: pi.vendor || '',
      gstNo: pi.gstNo || '',
      productName: pi.productName || 'Solar Mounting Rails & Accessories',
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

  // Preset Kits & Live Store
  const [activePresetsMap, setActivePresetsMap] = useState(() => getAllActivePresets());
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetSetCount, setPresetSetCount] = useState(1);
  const [presetKitPrice, setPresetKitPrice] = useState('');
  const [selectedItemIndexes, setSelectedItemIndexes] = useState([]);

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
      const stored = localStorage.getItem('controlroom_crm_customers');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { companyName: 'Vikram Solar Pvt Ltd', gst: '33AABCV1234F1Z5', contact: 'Rajesh Kannan', phone: '+91 98765 43210', email: 'rajesh@vikramsolar.com', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
      { companyName: 'Tata Power Solar Systems Ltd', gst: '27AAACT2345D1ZA', contact: 'Karthik Raja', phone: '+91 98450 12345', email: 'karthik@tatapower.com', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      { companyName: 'Waaree Energies Ltd', gst: '24AAACW5678B1Z2', contact: 'Dharmesh Patel', phone: '+91 97234 56789', email: 'dharmesh@waaree.com', city: 'Surat', state: 'Gujarat', pincode: '395001' }
    ];
  }, []);

  // Form Fields State
  const [pdfFile, setPdfFile] = useState(null);
  const [piNumber, setPiNumber] = useState('');
  const [piDate, setPiDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntilDate, setValidUntilDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNo, setGstNo] = useState('');

  // Addresses State
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPincode, setBillingPincode] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');

  // Structured Line Items State
  const [piItems, setPiItems] = useState([
    { name: 'Solar Mounting Structures & Fasteners', category: 'Structure Kit', uom: 'SET', qty: '1', rate: '25000', gstRate: '18%' }
  ]);

  // Legacy compatibility fields
  const [productName, setProductName] = useState('');
  const [productsList, setProductsList] = useState(['']);
  const [value, setValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [approvalRequired, setApprovalRequired] = useState('Yes');
  const [approver, setApprover] = useState('Velmurugan Rathinam (CEO)');
  const [approvalPriority, setApprovalPriority] = useState('High');
  const [paymentTerms, setPaymentTerms] = useState('50% Advance + 50% Before Dispatch');

  // Customer auto-suggest handler
  const handleSelectCustomer = (cName) => {
    setVendorName(cName);
    const found = customerList.find(c => (c.companyName || '').toLowerCase() === cName.toLowerCase());
    if (found) {
      if (found.gst) setGstNo(found.gst);
      if (found.contact) setContactPerson(found.contact);
      if (found.phone) setPhone(found.phone);
      if (found.email) setEmail(found.email);
      if (found.city) setBillingCity(found.city);
      if (found.state) setBillingState(found.state);
      if (found.pincode) setBillingPincode(found.pincode);
      if (sameAsBilling) {
        if (found.city) setDeliveryCity(found.city);
        if (found.state) setDeliveryState(found.state);
        if (found.pincode) setDeliveryPincode(found.pincode);
      }
    }
  };

  // Upload Progress States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const uploadTimerRef = useRef(null);

  const startMockUpload = (file) => {
    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);

    setPdfFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    let progress = 0;
    uploadTimerRef.current = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadTimerRef.current);
        setIsUploading(false);
      }
      setUploadProgress(progress);
    }, 200);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      startMockUpload(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    setPdfFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Triggers Save Confirmation instead of direct submit
  const triggerSaveConfirm = (e) => {
    if (e) e.preventDefault();
    if (!piNumber || !vendorName) {
      alert('Please enter PI Number and Customer Name.');
      return;
    }
    if (piItems.length === 0) {
      alert('Please add at least one line item or select a preset kit.');
      return;
    }
    setShowSaveConfirm(true);
  };

  // Submits the new or edited PI
  const executeCreatePI = () => {
    // Calculate total from items
    const subtotal = piItems.reduce((acc, it) => acc + ((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)), 0);
    const taxTotal = piItems.reduce((acc, it) => {
      const lineTaxable = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
      const gstPct = parseFloat(String(it.gstRate || '18%').replace('%', '')) || 18;
      return acc + (lineTaxable * (gstPct / 100));
    }, 0);
    const grandTotal = subtotal + taxTotal;
    const formattedAmount = '₹' + Math.round(grandTotal).toLocaleString('en-IN');

    const joinedProducts = piItems.map(it => it.name).filter(Boolean).join(', ') || 'Solar Structure & Accessories';

    const newPI = {
      piNo: piNumber.toUpperCase(),
      vendor: vendorName,
      contactPerson,
      phone,
      email,
      gstNo: (gstNo || '').toUpperCase(),
      productName: joinedProducts,
      items: piItems,
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
      unitValue: Math.round(subtotal),
      quantity: piItems.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0) || 1,
      subtotal,
      taxTotal,
      grandTotal,
      amount: formattedAmount,
      pdfName: pdfFile ? pdfFile.name : 'pi_document.pdf',
      piDate: piDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      expDate: validUntilDate || new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: editIdx !== null ? piList[editIdx].status : 'Pending Approval',
      statusType: editIdx !== null ? piList[editIdx].statusType : 'pending',
      approvalRequired: approvalRequired,
      approver: approver,
      approvalPriority: approvalPriority,
      paymentTerms
    };

    if (editIdx !== null) {
      const updated = [...piList];
      updated[editIdx] = newPI;
      updatePiList(updated);
      setEditIdx(null);
    } else {
      updatePiList([newPI, ...piList]);
    }

    // Reset Form
    setPdfFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setPiNumber('');
    setVendorName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setGstNo('');
    setBillingStreet('');
    setBillingCity('');
    setBillingState('');
    setBillingPincode('');
    setDeliveryStreet('');
    setDeliveryCity('');
    setDeliveryState('');
    setDeliveryPincode('');
    setPiItems([
      { name: 'Solar Mounting Structures & Fasteners', category: 'Structure Kit', uom: 'SET', qty: '1', rate: '25000', gstRate: '18%' }
    ]);
    setSelectedPreset('');
    setPresetSetCount(1);
    setPresetKitPrice('');
    setShowSaveConfirm(false);
    setViewMode('list');
  };

  // Pre-populates the modal fields to edit a Performa Invoice
  const handleStartEdit = (pi, idx) => {
    setEditIdx(idx);
    setPiNumber(pi.piNo || '');
    setVendorName(pi.vendor || '');
    setContactPerson(pi.contactPerson || '');
    setPhone(pi.phone || '');
    setEmail(pi.email || '');
    setGstNo(pi.gstNo || '');
    setPaymentTerms(pi.paymentTerms || '50% Advance + 50% Before Dispatch');
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
    setApprovalRequired(pi.approvalRequired || 'Yes');
    setApprover(pi.approver || 'Velmurugan Rathinam (CEO)');
    setApprovalPriority(pi.approvalPriority || 'High');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>

      {/* ==================== VIEW 1: LIST DASHBOARD SCREEN ==================== */}
      {viewMode === 'list' && (() => {
        const uniqueStatuses = ['All', ...new Set(piList.map(pi => pi.status))];
        const filteredPIList = (piList || []).filter(pi => {
          if (!pi) return false;
          const searchLower = (searchQuery || '').toLowerCase();
          const matchesSearch = (pi.piNo || '').toLowerCase().includes(searchLower) ||
            (pi.vendor || '').toLowerCase().includes(searchLower) ||
            (pi.gstNo || '').toLowerCase().includes(searchLower) ||
            (pi.productName || '').toLowerCase().includes(searchLower);
          const matchesStatus = statusFilter === 'All' || pi.status === statusFilter;
          const matchesTab = piTab === 'All' || pi.status === piTab;
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
                  Manage drafts and client approvals of Performa Invoices
                </span>
              </div>

              <button
                onClick={() => {
                  setEditIdx(null);
                  setPiNumber(`PI-${new Date().getFullYear()}-${String(piList.length + 101).padStart(3, '0')}`);
                  setPiDate(new Date().toISOString().split('T')[0]);
                  setValidUntilDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
                  setVendorName('');
                  setContactPerson('');
                  setPhone('');
                  setEmail('');
                  setGstNo('');
                  setBillingStreet('');
                  setBillingCity('');
                  setBillingState('');
                  setBillingPincode('');
                  setDeliveryStreet('');
                  setDeliveryCity('');
                  setDeliveryState('');
                  setDeliveryPincode('');
                  setPiItems([
                    { name: 'Solar Mounting Structures & Fasteners', category: 'Structure Kit', uom: 'SET', qty: '1', rate: '25000', gstRate: '18%' }
                  ]);
                  setSelectedPreset('');
                  setPresetSetCount(1);
                  setPresetKitPrice('');
                  setApprovalRequired('Yes');
                  setApprover('Velmurugan Rathinam (CEO)');
                  setApprovalPriority('High');
                  setPaymentTerms('50% Advance + 50% Before Dispatch');
                  setPdfFile(null);
                  setUploadProgress(0);
                  setViewMode('create');
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
                  { id: 'All', label: 'All Invoices (Total Sent)', count: piList.length },
                  { id: 'Converted to BOM', label: 'Converted to BOM', count: piList.filter(pi => pi.status === 'Converted to BOM').length },
                  { id: 'Pending Approval', label: 'Pending Approval', count: piList.filter(pi => pi.status === 'Pending Approval').length },
                  { id: 'Approved', label: 'Approved', count: piList.filter(pi => pi.status === 'Approved').length },
                  { id: 'Cancelled', label: 'Cancelled', count: piList.filter(pi => pi.status === 'Cancelled').length },
                  { id: 'Draft', label: 'Draft', count: piList.filter(pi => pi.status === 'Draft').length }
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
                      backgroundColor: tab.id === 'Converted to BOM' ? '#ecfdf5' : tab.id === 'Cancelled' ? '#fef2f2' : '#f1f5f9',
                      color: tab.id === 'Converted to BOM' ? '#059669' : tab.id === 'Cancelled' ? '#b91c1c' : '#475569',
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
                      <th style={{ width: '130px', minWidth: '130px', padding: '12px 14px', boxSizing: 'border-box' }}>PI No.</th>
                      <th style={{ width: '160px', minWidth: '160px', padding: '12px 14px', boxSizing: 'border-box' }}>Product</th>
                      <th style={{ minWidth: '180px', padding: '12px 14px', boxSizing: 'border-box' }}>Customer / Project</th>
                      <th style={{ width: '150px', minWidth: '150px', padding: '12px 14px', boxSizing: 'border-box' }}>GST No.</th>
                      <th style={{ width: '110px', minWidth: '110px', padding: '12px 14px', boxSizing: 'border-box' }}>PI Date</th>
                      <th style={{ width: '130px', minWidth: '130px', padding: '12px 14px', textAlign: 'right', boxSizing: 'border-box' }}>Total Amount</th>
                      <th style={{ width: '120px', minWidth: '120px', padding: '12px 14px', textAlign: 'center', boxSizing: 'border-box' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      return currentRows.map((pi, idx) => {
                        const isChecked = selectedPIs.includes(pi.piNo);

                        let statusBg = '#eff6ff';
                        let statusFg = '#2563eb';
                        if (pi.status === 'Approved') {
                          statusBg = '#f0fdf4';
                          statusFg = '#16a34a';
                        } else if (pi.status === 'Converted to BOM') {
                          statusBg = '#ecfdf5';
                          statusFg = '#059669';
                        } else if (pi.status === 'Pending Approval') {
                          statusBg = '#fffbebe6';
                          statusFg = '#d97706';
                        } else if (pi.status === 'Cancelled') {
                          statusBg = '#fef2f2';
                          statusFg = '#b91c1c';
                        } else if (pi.status === 'Draft' || pi.status === 'Overdue') {
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
                            <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#2563EB', cursor: 'pointer' }}>
                              {pi.piNo}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#1E293B' }}>
                              {pi.productName || 'Solar Mounting Structure'}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#475569' }}>
                              {pi.vendor}
                            </td>
                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#475569' }}>{pi.gstNo}</td>
                            <td style={{ padding: '12px 14px', color: '#64748B' }}>{pi.piDate}</td>
                            <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0F172A' }}>{pi.amount}</td>
                            
                            {/* Pill status badge with bullet dot */}
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ backgroundColor: statusBg, color: statusFg, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusFg }}></span>
                                {pi.status}
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
                          window.print();
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
                        <Download size={14} style={{ color: '#059669' }} /> Export / Print PDF
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
        const subtotalCalc = piItems.reduce((acc, it) => acc + ((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)), 0);
        const taxTotalCalc = piItems.reduce((acc, it) => {
          const taxable = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
          const gstPct = parseFloat(String(it.gstRate || '18%').replace('%', '')) || 18;
          return acc + (taxable * (gstPct / 100));
        }, 0);
        const grandTotalCalc = subtotalCalc + taxTotalCalc;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1240px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

            {/* Title Bar (Top Row) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748B'
                  }}
                  title="Back to Invoices"
                >
                  <ArrowLeft size={16} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>
                    {viewMode === 'edit' ? `Edit Proforma Invoice: ${piNumber}` : 'Create Proforma Invoice (PI)'}
                  </h2>
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Issue commercial proforma invoice, select preset kit structures, and configure billing details
                  </span>
                </div>
              </div>

              {/* Top Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={triggerSaveConfirm}
                  style={{
                    backgroundColor: '#0E7490',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 22px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(14, 116, 144, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} /> Save PI
                </button>
              </div>
            </div>

            {/* SECTION 1: PI DETAILS & CUSTOMER INFO */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
                  1
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    PI DETAILS & CUSTOMER INFORMATION
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Invoice identification, issuance date, validity, and customer profile
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    PI Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={piNumber}
                    onChange={(e) => setPiNumber(e.target.value.toUpperCase())}
                    placeholder="PI-2025-001"
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: '700', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    PI Date <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={piDate}
                    onChange={(e) => setPiDate(e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Payment Due / Valid Until
                  </label>
                  <input
                    type="date"
                    value={validUntilDate}
                    onChange={(e) => setValidUntilDate(e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Customer / Buyer Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      list="pi-customer-suggestions"
                      placeholder="Select or type Customer..."
                      value={vendorName}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }}
                    />
                    <datalist id="pi-customer-suggestions">
                      {customerList.map((c, idx) => (
                        <option key={idx} value={c.companyName} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Customer GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="33AAAAA0000A1Z5"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', textTransform: 'uppercase', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
                  />
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
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
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
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@solar.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: BILLING & DELIVERY ADDRESSES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 style={{ width: '16px', height: '16px', color: '#0E7490' }} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Billing Address</h4>
                </div>
                <input
                  type="text"
                  placeholder="Street Address / Plot / Industrial Area"
                  value={billingStreet}
                  onChange={(e) => setBillingStreet(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input type="text" placeholder="City" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }} />
                  <input type="text" placeholder="State" value={billingState} onChange={(e) => setBillingState(e.target.value)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }} />
                  <input type="text" placeholder="Pincode" value={billingPincode} onChange={(e) => setBillingPincode(e.target.value)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>

              <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck style={{ width: '16px', height: '16px', color: '#0E7490' }} />
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Site Delivery Address</h4>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#0E7490', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => {
                        setSameAsBilling(e.target.checked);
                        if (e.target.checked) {
                          setDeliveryStreet(billingStreet);
                          setDeliveryCity(billingCity);
                          setDeliveryState(billingState);
                          setDeliveryPincode(billingPincode);
                        }
                      }}
                      style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                    />
                    Same as Billing
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Delivery Site Address / Plant Location"
                  value={sameAsBilling ? billingStreet : deliveryStreet}
                  disabled={sameAsBilling}
                  onChange={(e) => setDeliveryStreet(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', backgroundColor: sameAsBilling ? '#F8FAFC' : 'white', boxSizing: 'border-box', outline: 'none' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input type="text" placeholder="City" value={sameAsBilling ? billingCity : deliveryCity} disabled={sameAsBilling} onChange={(e) => setDeliveryCity(e.target.value)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', backgroundColor: sameAsBilling ? '#F8FAFC' : 'white', boxSizing: 'border-box', outline: 'none' }} />
                  <input type="text" placeholder="State" value={sameAsBilling ? billingState : deliveryState} disabled={sameAsBilling} onChange={(e) => setDeliveryState(e.target.value)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', backgroundColor: sameAsBilling ? '#F8FAFC' : 'white', boxSizing: 'border-box', outline: 'none' }} />
                  <input type="text" placeholder="Pincode" value={sameAsBilling ? billingPincode : deliveryPincode} disabled={sameAsBilling} onChange={(e) => setDeliveryPincode(e.target.value)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', backgroundColor: sameAsBilling ? '#F8FAFC' : 'white', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>
            </div>

            {/* SECTION 3: ORDER ITEMS & PRESET KIT COMPILER */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
                    3
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      PROFORMA INVOICE SCOPE & PRESET KITS
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Pick engineering preset kits, customize line quantities, rates, and tax tiers
                    </span>
                  </div>
                </div>

                {/* Preset Selector with Multiple Sets and Append button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <SearchablePresetSelector
                    value={selectedPreset}
                    activePresetsMap={activePresetsMap}
                    accentColor="#0E7490"
                    width="320px"
                    placeholder="Type or pick Preset Kit..."
                    onChange={(val, targetPreset) => {
                      setSelectedPreset(val);
                      setSelectedItemIndexes([]);
                      if (targetPreset && targetPreset.items) {
                        const multiplier = parseInt(presetSetCount) || 1;
                        setPiItems(targetPreset.items.map(it => {
                          const baseQ = parseFloat(it.qty) || 1;
                          return {
                            name: it.name,
                            category: it.category || 'MMS Kit Scope',
                            uom: it.uom || 'NOS',
                            qty: String(Math.round(baseQ * multiplier)),
                            rate: String(it.rate || 0),
                            gstRate: it.gstRate || '18%'
                          };
                        }));
                      }
                    }}
                  />

                  {/* Append Additional Preset Button */}
                  {selectedPreset && piItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetPreset = activePresetsMap && activePresetsMap[selectedPreset] ? activePresetsMap[selectedPreset] : (VRM_HDG_PRESETS && VRM_HDG_PRESETS[selectedPreset]);
                        if (targetPreset && targetPreset.items) {
                          const multiplier = parseInt(presetSetCount) || 1;
                          const additional = targetPreset.items.map(it => {
                            const baseQ = parseFloat(it.qty) || 1;
                            return {
                              name: it.name,
                              category: it.category || 'MMS Kit Scope',
                              uom: it.uom || 'NOS',
                              qty: String(Math.round(baseQ * multiplier)),
                              rate: String(it.rate || 0),
                              gstRate: it.gstRate || '18%'
                            };
                          });
                          setPiItems(prev => [...prev, ...additional]);
                        }
                      }}
                      title="Add another set of this preset kit without replacing existing items"
                      style={{
                        backgroundColor: '#F0FDFA',
                        border: '1px solid #5EEAD4',
                        color: '#0E7490',
                        fontSize: '11px',
                        fontWeight: '800',
                        height: '36px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Plus size={13} /> + Add Another Preset
                    </button>
                  )}

                  {/* Multiplier input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0 8px', borderRadius: '8px', height: '36px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap' }}>Sets:</span>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={presetSetCount}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        const newCount = rawVal === '' ? '' : Math.max(1, parseInt(rawVal) || 1);
                        setPresetSetCount(newCount);
                        const multiplier = parseInt(rawVal) || 1;
                        if (selectedPreset && activePresetsMap && activePresetsMap[selectedPreset]) {
                          const baseItems = activePresetsMap[selectedPreset].items;
                          if (baseItems) {
                            setPiItems(baseItems.map(it => {
                              const baseQ = parseFloat(it.qty) || 1;
                              return {
                                name: it.name,
                                category: it.category || 'MMS Kit Scope',
                                uom: it.uom || 'NOS',
                                qty: String(Math.round(baseQ * multiplier)),
                                rate: String(it.rate || 0),
                                gstRate: it.gstRate || '18%'
                              };
                            }));
                          }
                        }
                      }}
                      style={{ width: '48px', height: '26px', borderRadius: '6px', border: '1px solid #94A3B8', padding: '0 4px', fontSize: '13px', fontWeight: '800', color: '#0E7490', textAlign: 'center', outline: 'none', backgroundColor: 'white' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedItemIndexes.length > 0) {
                        setPiItems(prev => prev.filter((_, idx) => !selectedItemIndexes.includes(idx)));
                        setSelectedItemIndexes([]);
                      } else {
                        setPiItems([]);
                        setSelectedPreset('');
                      }
                    }}
                    title={selectedItemIndexes.length > 0 ? `Remove ${selectedItemIndexes.length} selected item(s)` : 'Clear all items'}
                    style={{
                      border: selectedItemIndexes.length > 0 ? '1px solid #EF4444' : '1px solid #FCA5A5',
                      backgroundColor: selectedItemIndexes.length > 0 ? '#EF4444' : '#FEF2F2',
                      color: selectedItemIndexes.length > 0 ? 'white' : '#EF4444',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: '#475569', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 10px', width: '30px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={piItems.length > 0 && selectedItemIndexes.length === piItems.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedItemIndexes(piItems.map((_, idx) => idx));
                            else setSelectedItemIndexes([]);
                          }}
                          style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '38%' }}>Product / Item Description <span style={{ color: '#EF4444' }}>*</span></th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%' }}>UOM</th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '9%', textAlign: 'center' }}>Qty <span style={{ color: '#EF4444' }}>*</span></th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '12%', textAlign: 'right' }}>Unit Rate (₹)</th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '11%', textAlign: 'center' }}>GST Rate</th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '11%', textAlign: 'right' }}>Taxable (₹)</th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '11%', textAlign: 'right' }}>Total (₹)</th>
                      <th style={{ padding: '12px 10px', fontWeight: '700', width: '4%', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {piItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B', backgroundColor: '#FAFBFC' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                              <Boxes size={20} />
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>No items in this Proforma Invoice</div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>Click "+ Add Product Item" below or pick an engineering Preset Kit above.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      piItems.map((item, i) => {
                        const q = parseFloat(item.qty) || 0;
                        const r = parseFloat(item.rate) || 0;
                        const taxable = q * r;
                        const gstPct = parseFloat(String(item.gstRate || '18%').replace('%', '')) || 18;
                        const rowTot = taxable + (taxable * (gstPct / 100));
                        const isChecked = selectedItemIndexes.includes(i);

                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isChecked ? '#ECFEFF' : 'transparent' }}>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
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
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="text"
                                value={item.name}
                                placeholder="e.g. Solar Mounting Structures & Fasteners"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPiItems(prev => prev.map((it, idx) => idx === i ? { ...it, name: val } : it));
                                }}
                                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <select
                                value={item.uom || 'SET'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPiItems(prev => prev.map((it, idx) => idx === i ? { ...it, uom: val } : it));
                                }}
                                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 6px', fontSize: '12px', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: '600' }}
                              >
                                <option value="SET">SET</option>
                                <option value="NOS">NOS</option>
                                <option value="MTR">MTR</option>
                                <option value="KG">KG</option>
                                <option value="PCS">PCS</option>
                                <option value="PKT">PKT</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPiItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty: val } : it));
                                }}
                                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '13px', textAlign: 'center', boxSizing: 'border-box', outline: 'none' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPiItems(prev => prev.map((it, idx) => idx === i ? { ...it, rate: val } : it));
                                }}
                                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '13px', textAlign: 'right', boxSizing: 'border-box', outline: 'none' }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <select
                                value={item.gstRate || '18%'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPiItems(prev => prev.map((it, idx) => idx === i ? { ...it, gstRate: val } : it));
                                }}
                                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CCFBF1', padding: '0 6px', fontSize: '12px', fontWeight: '700', color: '#0E7490', backgroundColor: '#F0FDFA', outline: 'none', cursor: 'pointer', textAlign: 'center' }}
                              >
                                <option value="18%">18% GST</option>
                                <option value="12%">12% GST</option>
                                <option value="5%">5% GST</option>
                                <option value="0%">0% Exempt</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 10px', color: '#475569', textAlign: 'right', fontWeight: '600' }}>₹{taxable.toFixed(2)}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#0F172A', textAlign: 'right' }}>₹{rowTot.toFixed(2)}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setPiItems(prev => prev.filter((_, idx) => idx !== i))}
                                style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Trash2 size={13} />
                              </button>
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
                  onClick={() => setPiItems(prev => [...prev, { name: '', category: 'Custom Item', uom: 'NOS', qty: '1', rate: '0', gstRate: '18%' }])}
                  style={{ border: '1px solid #CCFBF1', background: '#F0FDFA', color: '#0E7490', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} /> Add Product Item
                </button>
              </div>
            </div>

            {/* SECTION 4: DOCUMENT UPLOAD, APPROVAL SETTINGS, PAYMENT TERMS & TOTALS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)', gap: '20px', alignItems: 'stretch' }}>
              
              {/* Left Column: PDF Upload & Approval Settings & Terms */}
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
                    4
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    DOCUMENT UPLOAD & APPROVAL SETTINGS
                  </h3>
                </div>

                {/* PDF File Upload (Optional / Drag and Drop) */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Attach Formal Signed PI PDF (Optional)
                  </label>
                  {pdfFile ? (
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText style={{ color: '#0E7490', width: '22px', height: '22px' }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>{pdfFile.name}</div>
                          <div style={{ fontSize: '10px', color: '#16A34A', fontWeight: '700' }}>✓ Attached Document ({uploadProgress}%)</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        style={{ border: 'none', background: '#FEE2E2', color: '#DC2626', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('modern-pi-pdf-input').click()}
                      style={{ border: '1.5px dashed #CBD5E1', borderRadius: '10px', padding: '18px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#FAFBFC' }}
                    >
                      <UploadCloud style={{ width: '24px', height: '24px', color: '#0E7490', margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Click to upload PI PDF (or drag and drop)</div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>Max file size 10MB</div>
                    </div>
                  )}
                  <input
                    id="modern-pi-pdf-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Payment Terms Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Payment Terms & Dispatch Conditions
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 50% Advance + 50% Before Dispatch"
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                {/* Approver & Priority */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Approval Required</label>
                    <select
                      value={approvalRequired}
                      onChange={(e) => setApprovalRequired(e.target.value)}
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '12px', backgroundColor: 'white', outline: 'none' }}
                    >
                      <option value="Yes">Yes (Requires CEO Approval)</option>
                      <option value="No">No (Auto-Release PI)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>Approver</label>
                    <input
                      type="text"
                      value={approver}
                      disabled
                      style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '12px', backgroundColor: '#F8FAFC', color: '#64748B', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Order Totals Summary Card */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Landmark style={{ width: '18px', height: '18px', color: '#0E7490' }} />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Commercials</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>Taxable Subtotal:</span>
                      <span style={{ fontWeight: '700', color: '#0F172A' }}>₹{subtotalCalc.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>Estimated GST (CGST+SGST / IGST):</span>
                      <span style={{ fontWeight: '700', color: '#0E7490' }}>+ ₹{taxTotalCalc.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#CBD5E1', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>Grand Total (INR):</span>
                      <span style={{ fontSize: '20px', fontWeight: '900', color: '#0E7490' }}>₹{grandTotalCalc.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action inside Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={triggerSaveConfirm}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: '#0E7490',
                      color: 'white',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(14, 116, 144, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Check size={18} /> Confirm & Save PI
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
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
              <button
                onClick={() => setSelectedPi(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
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
                        onClick={(e) => e.preventDefault()}
                        style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', textDecoration: 'none' }}
                      >
                        Download PDF
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

      {/* ==================== SAVE CONFIRMATION POPUP ==================== */}
      {showSaveConfirm && (
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
            {/* Embedded Blue Header Pill Band: CONFIRM */}
            <div
              style={{
                backgroundColor: '#2563eb',
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
              CONFIRM
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
                  Save Performa Invoice?
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Please confirm the details of invoice <strong style={{ color: '#0f172a' }}>{piNumber.toUpperCase()}</strong>:
              </p>

              {/* Data Summary List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#475569', paddingLeft: '8px', borderLeft: '3px solid #0E7490' }}>
                <div><strong>Customer:</strong> {vendorName}</div>
                <div><strong>Scope / Products:</strong> {piItems.map(it => it.name).filter(Boolean).join(', ') || 'Solar Structure & Accessories'}</div>
                <div><strong>GST No:</strong> {gstNo ? gstNo.toUpperCase() : 'N/A'}</div>
                <div><strong>Total Amount (incl. GST):</strong> ₹{Math.round(
                  piItems.reduce((acc, it) => {
                    const taxable = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
                    const gstPct = parseFloat(String(it.gstRate || '18%').replace('%', '')) || 18;
                    return acc + taxable + (taxable * (gstPct / 100));
                  }, 0)
                ).toLocaleString('en-IN')}</div>
              </div>

              {/* Bottom line inside dashed area: Discard on same line as Save Invoice */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                <button
                  onClick={() => setShowSaveConfirm(false)}
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
                  Discard
                </button>
                <button
                  onClick={executeCreatePI}
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Save Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CANCEL/DISCARD DETAILS CONFIRMATION POPUP ==================== */}
      {showCancelConfirm && (
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
            {/* Embedded Orange/Yellow Header Pill Band: DISCARD */}
            <div
              style={{
                backgroundColor: '#f97316',
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
              DISCARD
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
                  Discard Changes?
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Are you sure you want to discard your changes? All unsaved details for this Performa Invoice will be lost.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                <button
                  onClick={() => setShowCancelConfirm(false)}
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
                  No, Go Back
                </button>
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setViewMode('list');
                    handleRemoveFile();
                  }}
                  style={{
                    backgroundColor: '#ffedd5',
                    color: '#ea580c',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
