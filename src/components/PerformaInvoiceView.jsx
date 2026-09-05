import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Hourglass, Edit3, Trash2, Eye, FileText, X, UploadCloud, CheckCircle, Search, AlertTriangle, ArrowLeft, ArrowRight, MoreVertical, Edit, Info, Calendar, Filter, ChevronLeft, ChevronRight, RotateCcw, Layers, Tag, MoreHorizontal, Download } from 'lucide-react';
import StatusBadge from './StatusBadge';

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
      items: [
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

  // Form Fields State
  const [pdfFile, setPdfFile] = useState(null);
  const [piNumber, setPiNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [productName, setProductName] = useState('');
  const [productsList, setProductsList] = useState(['']);
  const [value, setValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [approvalRequired, setApprovalRequired] = useState('Yes');
  const [approver, setApprover] = useState('Velmurugan Rathinam (CEO)');
  const [approvalPriority, setApprovalPriority] = useState('High');

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
    const joinedProducts = productsList.filter(p => p.trim() !== '').join(', ');
    if (!piNumber || !vendorName || !gstNo || !joinedProducts || !value || !quantity) return;
    setProductName(joinedProducts);
    setShowSaveConfirm(true);
  };

  // Submits the new or edited PI
  const executeCreatePI = () => {
    const unitValNum = Number(value);
    const qtyNum = Number(quantity);
    const totalAmount = unitValNum * qtyNum;
    const formattedAmount = '₹' + totalAmount.toLocaleString('en-IN');

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const exp = new Date();
    exp.setDate(today.getDate() + 30);
    const formattedExpDate = exp.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const joinedProducts = productsList.filter(p => p.trim() !== '').join(', ');

    const newPI = {
      piNo: piNumber.toUpperCase(),
      vendor: vendorName,
      gstNo: gstNo.toUpperCase(),
      productName: joinedProducts || productName,
      unitValue: unitValNum,
      quantity: qtyNum,
      amount: formattedAmount,
      pdfName: pdfFile ? pdfFile.name : 'uploaded_invoice.pdf',
      piDate: editIdx !== null ? piList[editIdx].piDate : formattedDate,
      expDate: editIdx !== null ? piList[editIdx].expDate : formattedExpDate,
      status: editIdx !== null ? piList[editIdx].status : 'Pending Approval',
      statusType: editIdx !== null ? piList[editIdx].statusType : 'pending',
      approvalRequired: approvalRequired,
      approver: approver,
      approvalPriority: approvalPriority
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
    setGstNo('');
    setProductName('');
    setProductsList(['']);
    setValue('');
    setQuantity('');
    setApprovalRequired('Yes');
    setApprover('Velmurugan Rathinam (CEO)');
    setApprovalPriority('High');
    setShowSaveConfirm(false);
    setViewMode('list');
  };

  // Pre-populates the modal fields to edit a Performa Invoice
  const handleStartEdit = (pi, idx) => {
    setEditIdx(idx);
    setPiNumber(pi.piNo);
    setVendorName(pi.vendor);
    setGstNo(pi.gstNo);
    setProductName(pi.productName || '');
    setProductsList(pi.productName ? pi.productName.split(', ') : ['']);
    setValue(pi.unitValue.toString());
    setQuantity(pi.quantity.toString());
    setApprovalRequired(pi.approvalRequired || 'Yes');
    setApprover(pi.approver || 'Velmurugan Rathinam (CEO)');
    setApprovalPriority(pi.approvalPriority || 'High');
    setPdfFile({ name: pi.pdfName, size: 3.2 * 1024 * 1024 }); // Mock file details
    setUploadProgress(100);
    setViewMode('edit');
    setActiveDropdownIdx(null); // close menu dropdown
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                  setPiNumber('');
                  setVendorName('');
                  setGstNo('');
                  setProductName('');
                  setProductsList(['']);
                  setValue('');
                  setQuantity('');
                  setApprovalRequired('Yes');
                  setApprover('Velmurugan Rathinam (CEO)');
                  setApprovalPriority('High');
                  setPdfFile(null);
                  setUploadProgress(0);
                  setViewMode('create');
                }}
                style={{
                  backgroundColor: '#0E7490',
                  border: 'none',
                  color: 'white',
                  height: '44px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '4px 6px 4px 22px',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(14, 116, 144, 0.25)',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <span>Create PI</span>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  color: '#0E7490',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <ArrowRight style={{ width: '18px', height: '18px', color: '#0E7490' }} />
                </div>
              </button>
            </div>



            {/* 1. FILTERS & SEARCH ROW CARD */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', width: '100%', boxSizing: 'border-box', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#f8fafc', width: '380px' }}>
                <Search style={{ width: '15px', height: '15px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search Performa Invoices (PI No, Customer Name, GST No)..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#334155' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                {[
                  { id: 'All', label: 'All Invoices', count: piList.length },
                  { id: 'Pending Approval', label: 'Pending Approval', count: piList.filter(pi => pi.status === 'Pending Approval').length },
                  { id: 'Approved', label: 'Approved', count: piList.filter(pi => pi.status === 'Approved').length },
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
                      color: piTab === tab.id ? '#2563eb' : '#64748b',
                      borderBottom: piTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', backgroundColor: 'white', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer', marginBottom: '8px' }}>
                <Download style={{ width: '14px', height: '14px' }} />
                Export
              </button>
            </div>

            {/* 3. MAIN DATA TABLE MATCHING EXACT REFERENCE DESIGN */}
            <div className="section-card" style={{ padding: 0, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="custom-table" style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: '#475569', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '12px', fontWeight: 'bold' }}>
                      <th style={{ width: '48px', minWidth: '48px', padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle', boxSizing: 'border-box' }}>
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAll(e, filteredPIList)}
                          checked={filteredPIList.length > 0 && filteredPIList.every(pi => selectedPIs.includes(pi.piNo))}
                          style={{ accentColor: '#0E7490', cursor: 'pointer', verticalAlign: 'middle', margin: 0 }}
                        />
                      </th>
                      <th style={{ padding: '12px 14px' }}>PI No.</th>
                      <th style={{ padding: '12px 14px' }}>Product</th>
                      <th style={{ padding: '12px 14px' }}>Customer / Project</th>
                      <th style={{ padding: '12px 14px' }}>GST No.</th>
                      <th style={{ padding: '12px 14px' }}>PI Date</th>
                      <th style={{ padding: '12px 14px' }}>Total Amount</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
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
                        } else if (pi.status === 'Pending Approval') {
                          statusBg = '#fffbebe6';
                          statusFg = '#d97706';
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
                            <td style={{ width: '48px', minWidth: '48px', padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle', boxSizing: 'border-box' }}>
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
                          <option value={15}>15</option>
                          <option value={20}>20</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
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
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Title Bar (Top Row) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                {viewMode === 'edit' ? 'Edit Proforma Invoice' : 'Upload Proforma Invoice'}
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Upload proforma invoice details to create a new record
              </span>
            </div>

            {/* Top Right Action Button Row */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={triggerSaveConfirm}
                style={{
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Save PI
              </button>
            </div>
          </div>

          {/* Form Card Container */}
          <div
            className="section-card"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '32px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '30px'
            }}
          >
            {/* Form Header inside card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eff6ff' }}>
                <FileText style={{ width: '16px', height: '16px', color: '#2563eb' }} />
              </div>
              <strong style={{ fontSize: '15px', color: '#1e293b' }}>Proforma Invoice Details</strong>
            </div>

            {/* Numbered Input Fields (Two Column Grid) */}
            <form onSubmit={triggerSaveConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px 40px' }}>

                {/* 1. Upload PI PDF First */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {renderNumberedLabel('1', 'Upload PI PDF First')}

                  {pdfFile ? (
                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        height: '146px'
                      }}
                    >
                      {renderPdfIcon()}
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pdfFile.name}
                          </span>
                          {uploadProgress === 100 ? (
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle style={{ width: '12px', height: '12px', fill: '#16a34a', color: 'white' }} /> Completed
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>{uploadProgress}%</span>
                          )}
                        </div>
                        <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${uploadProgress}%`,
                              height: '100%',
                              borderRadius: '3px',
                              backgroundColor: uploadProgress === 100 ? '#16a34a' : '#f97316',
                              transition: 'width 0.2s ease-out'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>
                          {((uploadProgress / 100) * (pdfFile.size / (1024 * 1024))).toFixed(1)} MB of {(pdfFile.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                        {uploadProgress === 100 && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => document.getElementById('pi-pdf-input-fullscreen').click()}
                              style={{ border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 'bold', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              style={{ border: 'none', backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        border: '1.5px dashed #bfdbfe',
                        borderRadius: '12px',
                        height: '146px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backgroundColor: 'white'
                      }}
                      onClick={() => document.getElementById('pi-pdf-input-fullscreen').click()}
                    >
                      <UploadCloud style={{ width: '28px', height: '28px', color: '#3b82f6' }} />
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                        Drag and drop PI PDF here
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>or</span>
                      <button
                        type="button"
                        style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '5px 16px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: 'white',
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        Choose PDF File
                      </button>
                    </div>
                  )}
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
                    Only PDF files are allowed. Max file size: 10MB
                  </span>

                  <input
                    id="pi-pdf-input-fullscreen"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* 2. PI Number */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  {renderNumberedLabel('2', 'PI Number')}
                  <input
                    type="text"
                    value={piNumber}
                    onChange={(e) => setPiNumber(e.target.value)}
                    placeholder="Enter PI Number"
                    required
                    style={{
                      height: '42px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      padding: '0 14px',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Enter the Proforma Invoice number provided by the vendor
                  </span>
                </div>

                {/* 3. Customer Name */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {renderNumberedLabel('3', 'Customer Name')}
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Enter Customer Name"
                    required
                    style={{
                      height: '42px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      padding: '0 14px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Enter the name of the customer / buyer
                  </span>
                </div>

                {/* 4. Receiving Product */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {renderNumberedLabel('4', 'Receiving Product')}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {productsList.map((prod, pIdx) => (
                      <div key={pIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={prod}
                          onChange={(e) => {
                            const updated = [...productsList];
                            updated[pIdx] = e.target.value;
                            setProductsList(updated);
                          }}
                          placeholder={`Enter product ${pIdx + 1} name`}
                          required
                          style={{
                            height: '42px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            padding: '0 14px',
                            fontSize: '13px',
                            outline: 'none',
                            flex: 1
                          }}
                        />
                        {productsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setProductsList(productsList.filter((_, idx) => idx !== pIdx));
                            }}
                            style={{
                              border: 'none',
                              background: '#fee2e2',
                              color: '#ef4444',
                              borderRadius: '8px',
                              width: '42px',
                              height: '42px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '16px'
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setProductsList([...productsList, ''])}
                      style={{
                        alignSelf: 'flex-start',
                        border: 'none',
                        background: 'transparent',
                        color: '#2563eb',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px'
                      }}
                    >
                      <Plus style={{ width: '14px', height: '14px' }} /> Add Product
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Specify the product(s) mentioned in the PI
                  </span>
                </div>

                {/* 5. GST No. */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {renderNumberedLabel('5', 'GST No.')}
                  <input
                    type="text"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value)}
                    placeholder="Enter GST Number"
                    required
                    style={{
                      height: '42px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      padding: '0 14px',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Enter the GST number of the supplier / vendor
                  </span>
                </div>

                {/* 6. Value of Product (INR) */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {renderNumberedLabel('6', 'Value of Product (INR)')}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      height: '42px'
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRight: '1px solid #cbd5e1',
                        padding: '0 16px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#64748b',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}
                    >
                      ₹
                    </div>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Enter total value in INR"
                      required
                      style={{
                        border: 'none',
                        outline: 'none',
                        flex: 1,
                        padding: '0 14px',
                        height: '100%',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                    Enter the total value of the product in INR
                  </span>
                </div>

              </div>

              {/* 7. Quantity */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {renderNumberedLabel('7', 'Quantity')}
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter Quantity"
                  required
                  style={{
                    height: '42px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    padding: '0 14px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  Enter the total quantity as mentioned in the PI
                </span>
              </div>

              {/* 8. Approval Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '10px' }}>
                {renderNumberedLabel('8', 'Approval Settings')}

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                  <span>Approval Required</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: viewMode === 'view' ? 'default' : 'pointer' }}>
                    <input type="radio" name="approval" value="Yes" checked={approvalRequired === 'Yes'} disabled={viewMode === 'view'} onChange={() => setApprovalRequired('Yes')} /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: viewMode === 'view' ? 'default' : 'pointer' }}>
                    <input type="radio" name="approval" value="No" checked={approvalRequired === 'No'} disabled={viewMode === 'view'} onChange={() => setApprovalRequired('No')} /> No
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Approver</label>
                    <input type="text" value={approver} disabled style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: '#f8fafc', color: '#64748b' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Approval Priority</label>
                    <select value={approvalPriority} onChange={(e) => setApprovalPriority(e.target.value)} disabled={viewMode === 'view'} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 40px 0 12px', fontSize: '13px', backgroundColor: viewMode === 'view' ? '#f8fafc' : 'white', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '14px' }}>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
              </div>

            </form>

            {/* Footer alert bar inside form card */}
            <div
              style={{
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '10px'
              }}
            >
              <Info style={{ width: '16px', height: '16px', color: '#2563eb', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500', lineHeight: '1.4' }}>
                Please ensure all the information is accurate before saving. You can preview the uploaded PDF in the next step.
              </span>
            </div>

          </div>
        </div>
      )}

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

              {/* Product Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Product Name</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{selectedPi.productName || 'General Goods'}</span>
              </div>

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
                    ₹{selectedPi.unitValue.toLocaleString('en-IN')}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#475569', paddingLeft: '8px', borderLeft: '3px solid #3b82f6' }}>
                <div><strong>Customer:</strong> {vendorName}</div>
                <div><strong>Product:</strong> {productName}</div>
                <div><strong>GST No:</strong> {gstNo.toUpperCase()}</div>
                <div><strong>Total:</strong> ₹{(Number(value) * Number(quantity)).toLocaleString('en-IN')}</div>
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
