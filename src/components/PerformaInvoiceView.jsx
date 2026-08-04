import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Hourglass, Edit3, Trash2, Eye, FileText, X, UploadCloud, CheckCircle, Search, AlertTriangle, ArrowLeft, MoreVertical, Edit, Info, Calendar, Filter, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export default function PerformaInvoiceView() {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [selectedPi, setSelectedPi] = useState(null); // For viewing details popup overlay
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const [piList, setPiList] = useState([
    {
      piNo: 'PI-2025-001',
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
      statusType: 'pending'
    },
    {
      piNo: 'PI-2025-002',
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
      statusType: 'pending'
    },
    {
      piNo: 'PI-2025-003',
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
      statusType: 'approved'
    }
  ]);

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
      setPiList(updated);
      setEditIdx(null);
    } else {
      setPiList([newPI, ...piList]);
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
      setPiList(piList.filter((_, i) => i !== deleteIdx));
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
    let bg = '';
    let text = '';
    let border = '';

    if (type === 'approved' || label === 'Approved') {
      bg = '#f0fdf4';
      text = '#15803d';
      border = '1px solid #bbf7d0';
    } else if (label === 'Draft') {
      bg = '#fff7ed';
      text = '#c2410c';
      border = '1px solid #fed7aa';
    } else { // pending approval
      bg = '#eff6ff';
      text = '#1d4ed8';
      border = '1px solid #bfdbfe';
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
        {label}
      </span>
    );
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
        const filteredPIList = piList.filter(pi => {
          const matchesSearch = pi.piNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pi.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pi.gstNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (pi.productName || '').toLowerCase().includes(searchQuery.toLowerCase());
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
              Create PI
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

          {/* 2. STATUS TABS ROW */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '20px', padding: '4px 0', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[
              { id: 'All', label: 'All Invoices', count: piList.length, bg: '#e2e8f0', fg: '#475569' },
              { id: 'Pending Approval', label: 'Pending Approval', count: piList.filter(pi => pi.status === 'Pending Approval').length, bg: '#fef3c7', fg: '#d97706' },
              { id: 'Approved', label: 'Approved', count: piList.filter(pi => pi.status === 'Approved').length, bg: '#dcfce7', fg: '#166534' },
              { id: 'Draft', label: 'Draft', count: piList.filter(pi => pi.status === 'Draft').length, bg: '#fee2e2', fg: '#991b1b' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setPiTab(tab.id); setCurrentPage(1); }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '10px 4px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: piTab === tab.id ? '#2563eb' : '#64748b',
                  borderBottom: piTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
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

          {/* Main Table Card */}
          <div className="section-card" style={{ padding: 0, overflowX: 'auto', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
            <div className="table-responsive" style={{ border: 'none', borderRadius: 0, margin: 0, overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
              <table className="ds-table" style={{ fontSize: '13px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        onChange={(e) => handleSelectAll(e, filteredPIList)}
                        checked={filteredPIList.length > 0 && filteredPIList.every(pi => selectedPIs.includes(pi.piNo))}
                      />
                    </th>
                    <th>PI No.</th>
                    <th>Customer Name</th>
                    <th>GST No.</th>
                    <th>PI Date</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    return currentRows.map((pi, idx) => {
                      const isChecked = selectedPIs.includes(pi.piNo);
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
                              onChange={() => handleSelectRow(pi.piNo)}
                            />
                          </td>
                          <td>
                            <a href="#" style={{ fontWeight: '600', color: '#2563eb', textDecoration: 'none' }}>
                              {pi.piNo}
                            </a>
                          </td>
                          <td style={{ fontWeight: '500', color: '#1e293b' }}>
                            <div>{pi.vendor}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>
                              {pi.productName || 'General Goods'}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', color: '#475569' }}>{pi.gstNo}</td>
                          <td style={{ color: '#64748b' }}>{pi.piDate}</td>
                          <td style={{ fontWeight: '600', color: '#1e293b' }}>{pi.amount}</td>
                          <td>
                            {renderStatusBadge(pi.statusType, pi.status)}
                          </td>
                          {/* Actions column using 3-dot dropdown menu */}
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent immediately triggering event close
                                setActiveDropdownIdx(activeDropdownIdx === idx ? null : idx);
                              }}
                              style={{ 
                                border: 'none', 
                                background: 'transparent', 
                                cursor: 'pointer', 
                                color: '#64748b',
                                padding: '6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.2s'
                              }}
                              className="three-dot-hover"
                            >
                              <MoreVertical style={{ width: '16px', height: '16px' }} />
                            </button>
                            
                            {/* Floating Dropdown Card overlay */}
                            {activeDropdownIdx === idx && (
                              <div 
                                style={{
                                  position: 'absolute',
                                  right: '24px',
                                  top: '38px',
                                  backgroundColor: 'white',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
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
                                    setSelectedPi(pi);
                                    setActiveDropdownIdx(null);
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: '#334155',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                  className="dropdown-item-hover"
                                >
                                  <Eye style={{ width: '12px', height: '12px', color: '#3b82f6' }} />
                                  View
                                </button>
                                {pi.statusType !== 'approved' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEdit(pi, idx);
                                    }}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      textAlign: 'left',
                                      padding: '8px 12px',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      color: '#334155',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      borderTop: '1px solid #f1f5f9'
                                    }}
                                    className="dropdown-item-hover"
                                  >
                                    <Edit style={{ width: '12px', height: '12px', color: '#10b981' }} />
                                    Edit
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteIdx(idx);
                                    setActiveDropdownIdx(null);
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    borderTop: '1px solid #f1f5f9'
                                  }}
                                  className="dropdown-item-hover"
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
              {filteredPIList.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredPIList.length)} of {filteredPIList.length} entries
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
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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

            <button 
              onClick={() => setSelectedPi(null)}
              style={{
                height: '38px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                color: '#475569',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '8px',
                width: '100%'
              }}
            >
              Close Details
            </button>
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
