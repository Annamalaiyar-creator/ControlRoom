import React, { useState, useEffect } from 'react';
import { 
  Plus, Check, Trash2, Eye, FileText, Search, PlusCircle, AlertCircle, 
  TrendingUp, Users, CheckCircle, Clock, ShieldAlert, Award, 
  MapPin, Phone, Mail, FileCheck, CheckSquare, XCircle, ArrowRight, ArrowLeft,
  TrendingDown, DollarSign, Calendar, Edit3, SlidersHorizontal, Filter,
  ChevronLeft, ChevronRight, MoreVertical, RotateCcw, UploadCloud, ChevronDown, ExternalLink,
  Truck, Shield, Package, Star, Download, HelpCircle, Info, ShoppingCart, Upload, Printer, Maximize2
} from 'lucide-react';

export default function OtherViews({ activeTab, onChangeTab }) {
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

  const [grnReceivedBy, setGrnReceivedBy] = useState('');
  const [grnInspectorName, setGrnInspectorName] = useState('');
  const [grnInspectionRemarks, setGrnInspectionRemarks] = useState('');

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
            inspectionRemarks: g.inspectionRemarks || ''
          }));
          setGrnList(formattedList);
        }
      })
      .catch(err => console.error('Error fetching stored GRNs:', err));
  }, []);

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
      fetch(`/api/zoho/purchaseorders/${encodeURIComponent(targetId)}`).then(res => res.json()),
      fetch(`/api/po-receiving-history/${encodeURIComponent(poRef)}`).then(res => res.json())
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
    if (!grnInspectorName || String(grnInspectorName).trim() === '') missing.push('Inspector Name');
    if (!grnDocs || grnDocs.length === 0) missing.push('Attached Document (DC / Invoice / Delivery Note)');

    if (missing.length > 0) {
      setGrnValidationModal({ title: 'Mandatory Document & Fields Required', fields: missing, message: 'You must upload/attach at least one document (DC, Invoice, or Delivery Note) and complete all required fields to proceed.' });
      return;
    }

    const invalidItem = grnItems.find(it => {
      const remaining = Math.max(0, (it.ordered || 0) - (it.prev || 0));
      return (it.now || 0) > remaining;
    });

    if (invalidItem) {
      const remaining = Math.max(0, (invalidItem.ordered || 0) - (invalidItem.prev || 0));
      setGrnValidationModal({ 
        title: 'Validation Error', 
        message: `Received quantity (${invalidItem.now}) for "${invalidItem.name}" cannot exceed the pending quantity of ${remaining}.` 
      });
      return;
    }

    const totalNow = grnItems.reduce((acc, it) => acc + Number(it.now || 0), 0);
    const totalAccepted = grnItems.reduce((acc, it) => acc + Number(it.accepted || 0), 0);
    const totalRejected = grnItems.reduce((acc, it) => acc + Number(it.rejected || 0), 0);

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
      items: grnItems
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
            id: data.grn.grnNo,
            poRef: data.grn.poRef,
            vendor: data.grn.vendor,
            date: data.grn.date,
            received: `${totalNow} Units`,
            status: data.grn.status,
            val: `₹ ${totalNow * 1250}`
          };
          // Refresh GRN list from server
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
                  val: `₹ ${(g.receivedQty || 0) * 1250}`
                })));
              }
            });

          // Refresh live POs list to trigger status update across UI
          fetch('/api/zoho/purchaseorders')
            .then(res => res.json())
            .then(d => { if (Array.isArray(d)) setLivePOs(d); });
        }
        setShowCreateGRN(false);
        resetCreateGRNForm();
      })
      .catch(err => {
        console.error('Failed to post GRN:', err);
        setShowCreateGRN(false);
        resetCreateGRNForm();
      });
  };

  const handleFullyReceived = () => {
    if (!selectedGRNPo) {
      setGrnValidationModal({ title: 'Purchase Order Required', message: 'Please select a Purchase Order to mark as Fully Received.' });
      return;
    }

    if (!grnDocs || grnDocs.length === 0) {
      setGrnValidationModal({ 
        title: 'Mandatory Document Required', 
        message: 'You must upload / attach at least one Document (DC, Invoice, or Delivery Note) to proceed with receiving this GRN.' 
      });
      return;
    }

    // Mark items as fully accepted and completed
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
      status: 'CLOSED / FULLY RECEIVED',
      forceClosePO: true
    };

    fetch('/api/grns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
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
                val: `₹ ${(g.receivedQty || 0) * 1250}`
              })));
            }
          });

        fetch('/api/zoho/purchaseorders')
          .then(res => res.json())
          .then(d => { if (Array.isArray(d)) setLivePOs(d); });

        setShowCreateGRN(false);
        resetCreateGRNForm();
      })
      .catch(err => {
        console.error('Failed to mark as Fully Received:', err);
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
      const statusRes = await fetch('/api/zoho/status');
      const statusData = await statusRes.json();
      if (statusData.connected) {
        const res = await fetch('/api/zoho/vendors');
        const zohoVendors = await res.json();
        if (Array.isArray(zohoVendors) && zohoVendors.length > 0) {
          setVendorList(zohoVendors);
        } else {
          setVendorList([]);
        }
      } else {
        setVendorList([]);
      }
    } catch (e) {
      console.error("Failed to load Zoho vendors", e);
      setVendorList([]);
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
  const [itemsList, setItemsList] = useState([]);
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
    description: '',
    purchaseDescription: '',
    productType: 'goods'
  });
  const [itemsCurrentPage, setItemsCurrentPage] = useState(1);
  const [itemsRowsPerPage, setItemsRowsPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedItemWarehouse, setSelectedItemWarehouse] = useState('All Warehouses');
  const [selectedItemCategory, setSelectedItemCategory] = useState('All Categories');
  const [selectedItemStatus, setSelectedItemStatus] = useState('All Status');

  useEffect(() => {
    const fetchZohoItems = async () => {
      try {
        const response = await fetch('/api/zoho/items');
        if (response.ok) {
          const zohoItems = await response.json();
          if (Array.isArray(zohoItems) && zohoItems.length > 0) {
            setItemsList(zohoItems);
          }
        }
      } catch (err) {
        console.error("Error fetching Zoho Items:", err);
      }
    };
    fetchZohoItems();
  }, [activeTab]);

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

      const result = await res.json();
      const createdItem = result.item || {
        itemId: 'ITEM-' + Date.now(),
        ...payload
      };

      setItemsList(prev => [createdItem, ...prev]);
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
        status: 'Active'
      };
      setItemsList(prev => [fallback, ...prev]);
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
      
      const payload = {
        name: editingItem.name,
        rate: Number(editingItem.rate) || 0,
        sku: editingItem.sku || '',
        description: editingItem.description || '',
        unit: editingItem.unit || 'NOS',
        purchaseRate: Number(editingItem.purchaseRate) || 0,
        purchaseDescription: editingItem.purchaseDescription || '',
        status: editingItem.status || 'Active'
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

      setItemsList(prev => prev.map(it => it.itemId === editingItem.itemId ? { ...it, ...editingItem, ...payload } : it));
      
      setTimeout(() => {
        setEditingItem(null);
        setItemSaveStatus(null);
      }, 900);
    } catch (err) {
      console.error("Error updating item:", err);
      setItemsList(prev => prev.map(it => it.itemId === editingItem.itemId ? editingItem : it));
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

          setGstLookupStatus({ type: 'success', msg: `✓ Verified: Official Details Loaded for ${data.legalName}` });
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

  const [quotationsList, setQuotationsList] = useState([
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
  ]);

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
  const [invoiceList, setInvoiceList] = useState([]);

  // Payments State
  const [paymentList, setPaymentList] = useState([
    { id: 'PAY-48901', vendor: 'Tata Steel Ltd.', amount: '₹12,74,908.00', mode: 'RTGS', ref: 'RTGS-N887410B', date: '31 Jul 2026', status: 'Completed' },
    { id: 'PAY-48902', vendor: 'UltraTech Cement', amount: '₹9,00,000.00', mode: 'NEFT', ref: 'NEFT-T5420108', date: '28 Jul 2026', status: 'Scheduled' }
  ]);

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
  const [reorderAlerts, setReorderAlerts] = useState([
    { id: 1, name: 'Aluminium Rail 4.2m', sku: 'AL-RAIL-4.2', category: 'Rails', warehouse: 'Main Warehouse', stock: '120', percent: '12%', minLevel: '500', uom: 'Nos', leadTime: '7 Days', reorderQty: '880', val: '8,80,000', status: 'Critical', coverage: '2 Days', level: 12 },
    { id: 2, name: 'Mid Clamp', sku: 'MC-01', category: 'Clamps', warehouse: 'Main Warehouse', stock: '250', percent: '17%', minLevel: '1,500', uom: 'Nos', leadTime: '5 Days', reorderQty: '1,250', val: '3,12,500', status: 'Critical', coverage: '3 Days', level: 17 },
    { id: 3, name: 'End Clamp', sku: 'EC-01', category: 'Clamps', warehouse: 'Regional Warehouse', stock: '300', percent: '20%', minLevel: '1,500', uom: 'Nos', leadTime: '5 Days', reorderQty: '1,200', val: '2,40,000', status: 'Critical', coverage: '3 Days', level: 20 },
    { id: 4, name: 'GI Nut Bolt M8x25', sku: 'NB-M8-25', category: 'Fasteners', warehouse: 'Main Warehouse', stock: '2,450', percent: '25%', minLevel: '10,000', uom: 'Nos', leadTime: '4 Days', reorderQty: '7,550', val: '1,51,000', status: 'Low Stock', coverage: '4 Days', level: 25 },
    { id: 5, name: 'GI Nut Bolt M10x30', sku: 'NB-M10-30', category: 'Fasteners', warehouse: 'Regional Warehouse', stock: '1,800', percent: '30%', minLevel: '6,000', uom: 'Nos', leadTime: '4 Days', reorderQty: '4,200', val: '1,68,000', status: 'Low Stock', coverage: '4 Days', level: 30 },
    { id: 6, name: 'Spring Washer M8', sku: 'SW-M8', category: 'Fasteners', warehouse: 'Main Warehouse', stock: '950', percent: '32%', minLevel: '3,000', uom: 'Nos', leadTime: '3 Days', reorderQty: '2,050', val: '41,000', status: 'Low Stock', coverage: '5 Days', level: 32 },
    { id: 7, name: 'L-Foot', sku: 'LF-01', category: 'Accessories', warehouse: 'Main Warehouse', stock: '160', percent: '33%', minLevel: '480', uom: 'Nos', leadTime: '7 Days', reorderQty: '320', val: '64,000', status: 'Low Stock', coverage: '6 Days', level: 33 },
    { id: 8, name: 'Cable Clip', sku: 'CC-01', category: 'Accessories', warehouse: 'Regional Warehouse', stock: '3,200', percent: '35%', minLevel: '9,000', uom: 'Nos', leadTime: '3 Days', reorderQty: '5,800', val: '58,000', status: 'Low Stock', coverage: '6 Days', level: 35 },
    { id: 9, name: 'Earthing Lug', sku: 'EL-01', category: 'Electrical', warehouse: 'Main Warehouse', stock: '220', percent: '37%', minLevel: '600', uom: 'Nos', leadTime: '6 Days', reorderQty: '380', val: '45,600', status: 'Low Stock', coverage: '7 Days', level: 37 },
    { id: 10, name: 'UV Cable Tie 300mm', sku: 'CT-300', category: 'Accessories', warehouse: 'Regional Warehouse', stock: '1,400', percent: '38%', minLevel: '3,600', uom: 'Nos', leadTime: '3 Days', reorderQty: '2,200', val: '26,400', status: 'Low Stock', coverage: '8 Days', level: 38 }
  ]);

  // Stock status registry
  const [stockRegistry, setStockRegistry] = useState([
    { code: 'AL-001', item: 'Aluminium Rail 4.2m', category: 'Rails', location: 'Main Warehouse', stock: '120', allocated: '30', incoming: '500', minLevel: '500', val: '8,80,000', status: 'Low Stock' },
    { code: 'MC-001', item: 'Mid Clamp', category: 'Clamps', location: 'Main Warehouse', stock: '850', allocated: '100', incoming: '1,000', minLevel: '1,500', val: '3,12,500', status: 'Low Stock' },
    { code: 'EC-001', item: 'End Clamp', category: 'Clamps', location: 'Regional Warehouse', stock: '2,400', allocated: '200', incoming: '-', minLevel: '1,000', val: '2,40,000', status: 'In Stock' },
    { code: 'NB-025', item: 'GI Nut Bolt M8 x 25', category: 'Fasteners', location: 'Main Warehouse', stock: '0', allocated: '0', incoming: '500', minLevel: '500', val: '1,51,000', status: 'Out of Stock' },
    { code: 'NB-030', item: 'GI Nut Bolt M10 x 30', category: 'Fasteners', location: 'Regional Warehouse', stock: '1,800', allocated: '150', incoming: '-', minLevel: '2,000', val: '1,68,000', status: 'Low Stock' },
    { code: 'WS-008', item: 'Spring Washer M8', category: 'Fasteners', location: 'Main Warehouse', stock: '950', allocated: '50', incoming: '-', minLevel: '500', val: '41,000', status: 'In Stock' },
    { code: 'LF-001', item: 'L-Foot', category: 'Accessories', location: 'Main Warehouse', stock: '160', allocated: '20', incoming: '-', minLevel: '200', val: '64,000', status: 'Low Stock' },
    { code: 'CC-001', item: 'Cable Clip', category: 'Accessories', location: 'Regional Warehouse', stock: '3,200', allocated: '100', incoming: '-', minLevel: '1,000', val: '58,000', status: 'In Stock' }
  ]);

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
    } catch(err) {
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
      
      {/* ==================== 1. REQUESTS FOR PURCHASE SCREEN ==================== */}
      {activeTab === 'Requests for Purchase' && (() => {
        // Unique options for filters
        const uniqueDepts = ['All', ...new Set(rfpList.map(r => r.dept))];
        const uniqueRequesters = ['All', ...new Set(rfpList.map(r => r.requester))];
        const uniqueStatuses = ['All', ...new Set(rfpList.map(r => r.status))];
        const uniquePriorities = ['All', ...new Set(rfpList.map(r => r.priority))];

        // Filter logic
        const filteredRfpList = rfpList.filter(item => {
          const query = searchQuery.toLowerCase();
          const matchesSearch = !searchQuery || 
            item.id.toLowerCase().includes(query) ||
            item.requester.toLowerCase().includes(query) ||
            item.req.toLowerCase().includes(query) ||
            item.dept.toLowerCase().includes(query);

          const matchesTab = activeStatusTab === 'All' || item.status === activeStatusTab;
          const matchesDept = deptFilter === 'All' || item.dept === deptFilter;
          const matchesRequester = requestedByFilter === 'All' || item.requester === requestedByFilter;
          const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
          const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;

          return matchesSearch && matchesTab && matchesDept && matchesRequester && matchesStatus && matchesPriority;
        });

        // Tab count calculations
        const getCount = (status) => {
          if (status === 'All') return rfpList.length;
          return rfpList.filter(r => r.status === status).length;
        };

        const tabs = [
          { label: 'All Requests', status: 'All', count: getCount('All'), color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Pending Review', status: 'Pending Review', count: getCount('Pending Review'), color: '#f97316', bg: '#fff7ed' },
          { label: 'Pending Approval', status: 'Pending Approval', count: getCount('Pending Approval'), color: '#d97706', bg: '#fef3c7' },
          { label: 'Approved', status: 'Approved', count: getCount('Approved'), color: '#16a34a', bg: '#f0fdf4' },
          { label: 'In Procurement', status: 'In Procurement', count: getCount('In Procurement'), color: '#2563eb', bg: '#eff6ff' },
          { label: 'Partially Fulfilled', status: 'Partially Fulfilled', count: getCount('Partially Fulfilled'), color: '#ca8a04', bg: '#fef9c3' },
          { label: 'Completed', status: 'Completed', count: getCount('Completed'), color: '#0d9488', bg: '#ccfbf1' },
          { label: 'Rejected', status: 'Rejected', count: getCount('Rejected'), color: '#dc2626', bg: '#ffe4e6' }
        ];

        // Pagination calculations
        const indexOfLastRow = currentPage * rowsPerPage;
        const indexOfFirstRow = indexOfLastRow - rowsPerPage;
        const currentRows = filteredRfpList.slice(indexOfFirstRow, indexOfLastRow);
        const totalPages = Math.ceil(filteredRfpList.length / rowsPerPage);

        const handleSelectAll = (e) => {
          if (e.target.checked) {
            setSelectedPRs(currentRows.map(r => r.id));
          } else {
            setSelectedPRs([]);
          }
        };

        const handleSelectRow = (id) => {
          if (selectedPRs.includes(id)) {
            setSelectedPRs(selectedPRs.filter(item => item !== id));
          } else {
            setSelectedPRs([...selectedPRs, id]);
          }
        };

        const clearFilters = () => {
          setSearchQuery('');
          setDeptFilter('All');
          setRequestedByFilter('All');
          setStatusFilter('All');
          setPriorityFilter('All');
          setActiveStatusTab('All');
          setCurrentPage(1);
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            {!showForm && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Requests for Purchase (RFP)</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Submit and authorize purchase requisition sheets</span>
                </div>
                <button 
                  onClick={() => setShowForm(true)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                >
                  <PlusCircle style={{ width: '16px', height: '16px' }} />
                  Raise Request
                </button>
              </div>
            )}

            {showForm ? (
              <form onSubmit={handleCreateRFP} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                {/* Header Action Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 }}>New Purchase Request</h2>
                    <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Raise a request for materials, products or services required.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button type="button" onClick={() => setShowForm(false)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', padding: '0 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                      Save as Draft
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', padding: '0 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                      Cancel
                    </button>
                    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden' }}>
                      <button type="submit" style={{ height: '36px', border: 'none', backgroundColor: '#2563eb', color: 'white', padding: '0 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        Submit for Review
                      </button>
                      <button type="submit" style={{ height: '36px', border: 'none', backgroundColor: '#2563eb', color: 'white', padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                        ▼
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 1: Request Information */}
                <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>1. Request Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Request Number</label>
                      <input type="text" value={prNumber} disabled style={{ height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 12px', fontSize: '13px', backgroundColor: '#f8fafc', color: '#94a3b8' }} />
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>(Auto Generated)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Request Date *</label>
                      <input type="date" value={prDate} onChange={(e) => setPrDate(e.target.value)} required style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Requested By *</label>
                      {renderSelect(prRequestedBy, (e) => setPrRequestedBy(e.target.value), ['Ravi Kumar', 'Arun Prasad', 'Priya Sharma', 'Manoj Kumar', 'Suresh Patel', 'Karthik R', 'Anitha Devi', 'Vijay Kumar'])}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Department *</label>
                      {renderSelect(prDept, (e) => setPrDept(e.target.value), ['Production', 'Maintenance', 'Design', 'HR', 'Projects', 'Admin', 'Stores'])}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Required Date *</label>
                      <input type="date" value={prRequiredDate} onChange={(e) => setPrRequiredDate(e.target.value)} required style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Priority *</label>
                      {renderSelect(prPriority, (e) => setPrPriority(e.target.value), ['High', 'Normal', 'Low'])}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Project (Optional)</label>
                      {renderSelect(prProject, (e) => setPrProject(e.target.value), ['Solar Plant - 500MW', 'Wind Farm - 100MW', 'Factory Expansion', 'N/A'])}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Cost Center / Account *</label>
                      {renderSelect(prCostCenter, (e) => setPrCostCenter(e.target.value), ['PROD-1001 - Production', 'MAINT-2001 - Maintenance', 'DSGN-3001 - Design', 'PROJ-4001 - Projects'])}
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Purpose / Reason *</label>
                      <textarea value={prPurpose} onChange={(e) => setPrPurpose(e.target.value)} required placeholder="Describe the purpose of this requisition..." style={{ height: '90px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', backgroundColor: 'white', resize: 'none', fontFamily: 'inherit' }} />
                      <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>{prPurpose.length}/500</span>
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Attach Supporting Document (Optional)</label>
                      <div style={{ height: '90px', borderRadius: '8px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                        <UploadCloud style={{ width: '28px', height: '28px', color: '#2563eb', marginBottom: '4px' }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Drag and drop files here or <span style={{ color: '#2563eb', textDecoration: 'underline' }}>Browse Files</span></span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Max file size: 10MB (PDF, DOC, XLS, PNG, JPG)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Item Details */}
                <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0 0 0' }}>
                  <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>2. Item Details</h3>
                    <button type="button" onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', color: '#2563eb', backgroundColor: 'white', cursor: 'pointer' }}>
                      <span>+ Add Item</span>
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto', borderTop: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#fafbfc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ width: '40px', padding: '10px', textAlign: 'center', color: '#64748b' }}>#</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b' }}>Item / Product Name *</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b' }}>Description</th>
                          <th style={{ width: '100px', padding: '10px 16px', textAlign: 'left', color: '#64748b' }}>Unit *</th>
                          <th style={{ width: '100px', padding: '10px 16px', textAlign: 'left', color: '#64748b' }}>Quantity *</th>
                          <th style={{ width: '150px', padding: '10px 16px', textAlign: 'left', color: '#64748b' }}>Required By Date</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b' }}>Preferred Vendor (Optional)</th>
                          <th style={{ width: '60px', padding: '10px', textAlign: 'center', color: '#64748b' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prItems.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {renderTableSelect(item.name, (e) => handleItemChange(idx, 'name', e.target.value), ['GI Steel Coil 2mm', 'Aluminium Rail 120mm', 'Self Drilling Screw', 'Hex Bolt M10', 'Cement Bag 50kg', 'Industrial Fan 5KW'])}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input type="text" value={item.desc} onChange={(e) => handleItemChange(idx, 'desc', e.target.value)} placeholder="Item details..." style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '13px' }} />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {renderTableSelect(item.unit, (e) => handleItemChange(idx, 'unit', e.target.value), ['MT', 'Nos', 'KG', 'Mtr'])}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input type="number" step="any" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} placeholder="0" style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '13px' }} />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input type="date" value={item.date} onChange={(e) => handleItemChange(idx, 'date', e.target.value)} style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '13px' }} />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {renderTableSelect(item.vendor, (e) => handleItemChange(idx, 'vendor', e.target.value), ['Tata Steel Ltd.', 'JSW Aluminium', 'Havells India Ltd.', 'UltraTech Cement', 'N/A'])}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <button type="button" onClick={() => handleRemoveItem(idx)} style={{ border: 'none', background: 'transparent', cursor: prItems.length > 1 ? 'pointer' : 'not-allowed', color: prItems.length > 1 ? '#ef4444' : '#cbd5e1' }}>
                                <Trash2 style={{ width: '16px', height: '16px' }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Details & Terms Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Section 3: Additional Details */}
                  <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>3. Additional Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Estimated Budget (INR)</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: '12px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>₹</span>
                          <input type="text" value={prBudget} onChange={(e) => setPrBudget(e.target.value)} style={{ width: '100%', height: '38px', padding: '0 12px 0 24px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Preferred Brand (Optional)</label>
                        <input type="text" value={prBrand} onChange={(e) => setPrBrand(e.target.value)} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Notes (Visible to Approver)</label>
                      <textarea value={prNotes} onChange={(e) => setPrNotes(e.target.value)} style={{ height: '90px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', backgroundColor: 'white', resize: 'none', fontFamily: 'inherit' }} />
                      <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>{prNotes.length}/500</span>
                    </div>
                  </div>

                  {/* Section 4: Terms & Conditions */}
                  <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>4. Terms & Conditions</h3>

                    <div style={{ flex: 1, minHeight: '120px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#334155', backgroundColor: '#fafbfc', lineHeight: '1.6' }}>
                      1. The requested material will be used only for the purpose mentioned above.<br />
                      2. Approved materials must meet the required quality standards.<br />
                      3. Delivery must be completed on or before the required date.<br />
                      4. Any changes in the requirement must be informed to the procurement team.<br />
                      5. This request is subject to approval and availability of budget.
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: '#475569' }}>
                      <input type="checkbox" checked={prUseDefaultTerms} onChange={(e) => setPrUseDefaultTerms(e.target.checked)} />
                      <span>Use default terms & conditions</span>
                    </label>
                  </div>
                </div>

                {/* Section 5: Approval Flow */}
                <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>5. Approval Flow</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Review By *</label>
                      {renderSelect(prReviewBy, (e) => setPrReviewBy(e.target.value), ['Department Head', 'Project Manager', 'Finance Head'])}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                      <ArrowRight style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Approve By *</label>
                      {renderSelect(prApproveBy, (e) => setPrApproveBy(e.target.value), ['Procurement Head', 'CFO', 'CEO', 'Director'])}
                    </div>
                    <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', marginTop: '20px', cursor: 'pointer', backgroundColor: 'white', fontSize: '12px', fontWeight: 'bold', color: '#2563eb', whiteSpace: 'nowrap' }}>
                      <span>+ Add Another Approver</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                {/* 1. FILTERS & SEARCH ROW CARD */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', width: '100%', boxSizing: 'border-box', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#f8fafc', width: '380px' }}>
                    <Search style={{ width: '15px', height: '15px', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder="Search Request ID, employee, item, department..."
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
                  {tabs.map(tab => (
                    <button
                      key={tab.status}
                      onClick={() => { setActiveStatusTab(tab.status); setCurrentPage(1); }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '10px 4px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: activeStatusTab === tab.status ? '#2563eb' : '#64748b',
                        borderBottom: activeStatusTab === tab.status ? '2px solid #2563eb' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{tab.label}</span>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: tab.bg || '#f1f5f9', color: tab.color || '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 3. TABLE CARD */}
                <div className="section-card" style={{ padding: 0, overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
                  <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <input 
                            type="checkbox" 
                            onChange={handleSelectAll}
                            checked={currentRows.length > 0 && currentRows.every(r => selectedPRs.includes(r.id))}
                          />
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Request ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Requested By</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Item / Requirement</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Quantity</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Required By</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Priority</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Created Date</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: '#475569', fontWeight: '600', width: '100px', whiteSpace: 'nowrap' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ padding: '32px', textAlign: 'center', color: '#64748b', whiteSpace: 'nowrap' }}>
                            No requests found matching the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        currentRows.map((rfp, idx) => {
                          const isChecked = selectedPRs.includes(rfp.id);
                          
                          // Priority colors
                          let priColor = '#64748b';
                          let priBg = '#f1f5f9';
                          if (rfp.priority === 'High') {
                            priColor = '#ef4444';
                            priBg = '#fee2e2';
                          } else if (rfp.priority === 'Normal') {
                            priColor = '#2563eb';
                            priBg = '#dbeafe';
                          }

                          // Status colors
                          let statColor = '#475569';
                          let statBg = '#f1f5f9';
                          if (rfp.status === 'Pending Approval') {
                            statColor = '#d97706';
                            statBg = '#fef3c7';
                          } else if (rfp.status === 'Approved' || rfp.status === 'Completed') {
                            statColor = '#16a34a';
                            statBg = '#dcfce7';
                          } else if (rfp.status === 'In Procurement') {
                            statColor = '#2563eb';
                            statBg = '#dbeafe';
                          } else if (rfp.status === 'Pending Review') {
                            statColor = '#ea580c';
                            statBg = '#ffedd5';
                          } else if (rfp.status === 'Partially Fulfilled') {
                            statColor = '#ca8a04';
                            statBg = '#fef9c3';
                          } else if (rfp.status === 'Rejected') {
                            statColor = '#dc2626';
                            statBg = '#ffe4e6';
                          }

                          return (
                            <tr 
                              key={rfp.id} 
                              style={{ 
                                borderBottom: idx === currentRows.length - 1 ? 'none' : '1px solid #f1f5f9',
                                backgroundColor: isChecked ? '#f8fafc' : 'transparent',
                                transition: 'background-color 0.15s ease'
                              }}
                            >
                              <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => handleSelectRow(rfp.id)}
                                />
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#2563eb', whiteSpace: 'nowrap' }}>{rfp.id}</td>
                              <td style={{ padding: '14px 16px', fontWeight: '500', color: '#1e293b', whiteSpace: 'nowrap' }}>{rfp.requester}</td>
                              <td style={{ padding: '14px 16px', color: '#334155', fontWeight: '500', whiteSpace: 'nowrap' }}>{rfp.req}</td>
                              <td style={{ padding: '14px 16px', color: '#334155', whiteSpace: 'nowrap' }}>{rfp.qty}</td>
                              <td style={{ padding: '14px 16px', color: '#475569', whiteSpace: 'nowrap' }}>{rfp.requiredBy}</td>
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                {renderPriorityBadge(rfp.priority)}
                              </td>
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                {renderStatusBadge(rfp.status)}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{rfp.date}</td>
                              <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveRfpActionMenu(activeRfpActionMenu === rfp.id ? null : rfp.id);
                                  }}
                                  style={{ display: 'inline-flex', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  <MoreVertical style={{ width: '16px', height: '16px' }} />
                                </div>
                                {activeRfpActionMenu === rfp.id && (
                                  <>
                                    <div 
                                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                                      onClick={(e) => { e.stopPropagation(); setActiveRfpActionMenu(null); }}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      right: '16px',
                                      top: '36px',
                                      backgroundColor: '#FFFFFF',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                      zIndex: 999,
                                      width: '120px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      padding: '4px 0'
                                    }}>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewingRfp(rfp);
                                          setActiveRfpActionMenu(null);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#334155', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
                                      >
                                        View Details
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingRfp(rfp);
                                          setActiveRfpActionMenu(null);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#334155', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmRfp(rfp);
                                          setActiveRfpActionMenu(null);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#EF4444', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. PAGINATION FOOTER */}
                {filteredRfpList.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', fontSize: '13px', color: '#64748b' }}>
                    <div>
                      Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredRfpList.length)} of {filteredRfpList.length} entries
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
                          return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
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
                          ));
                        })()}

                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          style={{ border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                        >
                          <ChevronRight style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {/* View RFP Modal */}
            {viewingRfp && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>RFP Details — {viewingRfp.id}</h3>
                    <button onClick={() => setViewingRfp(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: '24px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Requester</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingRfp.requester}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Department</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingRfp.dept}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Item Requested</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingRfp.req}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Quantity</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingRfp.qty}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Required By</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingRfp.requiredBy}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Priority</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingRfp.priority}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Status</span>
                      <span style={{ display: 'inline-block', marginTop: '2px' }}>{renderStatusBadge(viewingRfp.status)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setViewingRfp(null)}
                      style={{ border: 'none', background: '#2563eb', color: 'white', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit RFP Modal */}
            {editingRfp && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Edit RFP — {editingRfp.id}</h3>
                    <button onClick={() => setEditingRfp(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Requester</label>
                      <input 
                        type="text" 
                        value={editingRfp.requester} 
                        onChange={(e) => setEditingRfp({ ...editingRfp, requester: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Item Requested</label>
                      <input 
                        type="text" 
                        value={editingRfp.req} 
                        onChange={(e) => setEditingRfp({ ...editingRfp, req: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Quantity</label>
                      <input 
                        type="text" 
                        value={editingRfp.qty} 
                        onChange={(e) => setEditingRfp({ ...editingRfp, qty: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      onClick={() => setEditingRfp(null)}
                      style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setRfpList(prev => prev.map(r => r.id === editingRfp.id ? editingRfp : r));
                        setEditingRfp(null);
                      }}
                      style={{ border: 'none', background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete RFP Modal */}
            {deleteConfirmRfp && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Delete RFP</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                    Are you sure you want to delete RFP request <strong>{deleteConfirmRfp.id}</strong>? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      onClick={() => setDeleteConfirmRfp(null)}
                      style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setRfpList(prev => prev.filter(r => r.id !== deleteConfirmRfp.id));
                        setDeleteConfirmRfp(null);
                      }}
                      style={{ border: 'none', background: '#EF4444', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== 2. VENDOR MANAGEMENT SCREEN ==================== */}
      {activeTab === 'Vendor Management' && (() => {
        // Calculate dynamic tab counts
        const countActive = vendorList.filter(v => v.status === 'Active').length;
        const countPreferred = vendorList.filter(v => v.status === 'Preferred').length;
        const countInactive = vendorList.filter(v => v.status === 'Inactive').length;
        const countBlacklisted = vendorList.filter(v => v.status === 'Blacklisted').length;

        // Apply filters
        const filteredVendors = vendorList.filter(vendor => {
          const query = vSearchQuery.toLowerCase();
          const matchesSearch = !query || 
            vendor.name.toLowerCase().includes(query) ||
            vendor.code.toLowerCase().includes(query) ||
            vendor.contact.toLowerCase().includes(query) ||
            vendor.phone.includes(query) ||
            vendor.cat.toLowerCase().includes(query);

          const matchesType = vTypeFilter === 'All' || vendor.type === vTypeFilter;
          const matchesStatus = vStatusFilter === 'All' || vendor.status === vStatusFilter;
          const matchesCat = vCatFilter === 'All' || vendor.cat === vCatFilter || vendor.cat === 'General Vendor' || !vendor.cat;

          let matchesRating = true;
          if (vRatingFilter !== 'All') {
            const num = parseFloat(vendor.rating);
            if (vRatingFilter === '4.0 & above') matchesRating = num >= 4.0;
            else if (vRatingFilter === '3.0 & above') matchesRating = num >= 3.0;
            else if (vRatingFilter === '2.0 & above') matchesRating = num >= 2.0;
          }

          const matchesTerms = vTermsFilter === 'All' || vendor.terms === vTermsFilter;

          let matchesTab = true;
          if (vActiveTab !== 'All Vendors') {
            matchesTab = vendor.status === vActiveTab;
          }

          return matchesSearch && matchesType && matchesStatus && matchesCat && matchesRating && matchesTerms && matchesTab;
        });

        // Pagination
        const totalVendorPages = Math.ceil(filteredVendors.length / vRowsPerPage) || 1;
        const currentVendorRows = filteredVendors.slice(
          (vCurrentPage - 1) * vRowsPerPage,
          vCurrentPage * vRowsPerPage
        );

        const handleSelectAllVendors = (e) => {
          if (e.target.checked) {
            setSelectedVendors(currentVendorRows.map(v => v.code));
          } else {
            setSelectedVendors([]);
          }
        };

        const handleSelectVendorRow = (code) => {
          if (selectedVendors.includes(code)) {
            setSelectedVendors(selectedVendors.filter(item => item !== code));
          } else {
            setSelectedVendors([...selectedVendors, code]);
          }
        };

        const clearVendorFilters = () => {
          setVSearchQuery('');
          setVTypeFilter('All');
          setVStatusFilter('All');
          setVCatFilter('All');
          setVRatingFilter('All');
          setVTermsFilter('All');
          setVActiveTab('All Vendors');
          setVCurrentPage(1);
        };

        const renderStars = (rating) => {
          const fullStars = Math.floor(rating);
          const stars = [];
          for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
              stars.push(<span key={i} style={{ color: '#eab308', marginRight: '1px' }}>★</span>);
            } else {
              stars.push(<span key={i} style={{ color: '#cbd5e1', marginRight: '1px' }}>★</span>);
            }
          }
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', fontSize: '12px' }}>{stars}</div>
              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px', fontWeight: 'bold' }}>{rating.toFixed(1)}</span>
            </div>
          );
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            {!viewingVendor && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Vendor Directory</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Manage procurement suppliers and contact ledgers</span>
                </div>
                {showForm ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => setVendorConfirmModal({
                        show: true,
                        action: 'draft',
                        title: 'Save Vendor as Draft?',
                        message: 'Are you sure you want to save this vendor information as a Draft?',
                        confirmLabel: 'Save Draft',
                        confirmBtnColor: '#475569'
                      })} 
                      style={{ height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', padding: '0 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Save as Draft
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setVendorConfirmModal({
                        show: true,
                        action: 'cancel',
                        title: 'Cancel Vendor Onboarding?',
                        message: 'Are you sure you want to cancel? Any entered vendor information will be cleared.',
                        confirmLabel: 'Discard Changes',
                        confirmBtnColor: '#EF4444'
                      })} 
                      style={{ height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', padding: '0 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Cancel
                    </button>
                    <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden' }}>
                      <button 
                        type="button" 
                        onClick={() => setVendorConfirmModal({
                          show: true,
                          action: 'submit',
                          title: 'Submit Vendor for Review?',
                          message: 'Are you sure you want to submit this vendor for onboarding approval & review?',
                          confirmLabel: 'Submit Vendor',
                          confirmBtnColor: '#2563eb'
                        })} 
                        style={{ height: '36px', border: 'none', backgroundColor: '#2563eb', color: 'white', padding: '0 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', borderRight: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        Submit for Review
                      </button>
                      <button type="button" style={{ height: '36px', border: 'none', backgroundColor: '#2563eb', color: 'white', padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                        ▼
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowForm(true)} 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    <PlusCircle style={{ width: '16px', height: '16px' }} />
                    Onboard Vendor
                  </button>
                )}
              </div>
            )}

            {showForm ? (
              <form onSubmit={handleCreateVendor} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
                {/* Left Column (Forms) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* 1. Basic Information */}
                  <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>1. Basic Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Vendor Name <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input type="text" value={vName} onChange={(e) => setVName(e.target.value)} required placeholder="Enter vendor name" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Vendor Type <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        {renderSelect(vType, (e) => setVType(e.target.value), ['Manufacturer', 'Supplier', 'Trader'], { height: '38px' })}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Vendor Code (Auto Generated)</label>
                        <input type="text" readOnly value="Will be generated" style={{ height: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 12px', fontSize: '13px', backgroundColor: '#f8fafc', color: '#94a3b8', outline: 'none' }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Company Registration Number <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input type="text" value={vCompanyReg} onChange={(e) => setVCompanyReg(e.target.value)} placeholder="Enter registration number" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                            GST Number <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                          </label>
                          <button 
                            type="button" 
                            onClick={() => handleGstFetch(vGST)}
                            disabled={isGstFetching || !vGST || vGST.trim().length < 2}
                            style={{ border: 'none', background: 'none', color: (isGstFetching || !vGST || vGST.trim().length < 2) ? '#94a3b8' : '#2563eb', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                          >
                            {isGstFetching ? '⏳ Fetching GST...' : '🔍 Auto-Fetch Details'}
                          </button>
                        </div>
                        <input 
                          type="text" 
                          value={vGST} 
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setVGST(val);
                            if (val.replace(/[^A-Z0-9]/gi, '').length >= 10) {
                              handleGstFetch(val);
                            }
                          }} 
                          maxLength={15}
                          placeholder="Enter 15-digit GSTIN (e.g. 37AAACT2727Q1ZS)" 
                          style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }} 
                        />
                        {gstLookupStatus && (
                          <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 'bold' }}>{gstLookupStatus.msg}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          PAN Number <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input type="text" value={vPAN} onChange={(e) => setVPAN(e.target.value)} placeholder="Enter PAN number" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Website</label>
                        <input type="text" value={vWebsite} onChange={(e) => setVWebsite(e.target.value)} placeholder="Enter website" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Email <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input type="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} placeholder="Enter email address" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Mobile Number <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select style={{ width: '80px', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '13px', backgroundColor: 'white', color: '#334155', outline: 'none' }}>
                            <option>+91</option>
                            <option>+1</option>
                            <option>option</option>
                          </select>
                          <input type="text" value={vPhone} onChange={(e) => setVPhone(e.target.value)} placeholder="Enter mobile number" style={{ flex: 1, height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Address Details */}
                  <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>2. Address Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {/* Registered Address */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <strong style={{ fontSize: '12px', color: '#334155' }}>
                          Registered Address <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <textarea value={vRegAddress} onChange={(e) => setVRegAddress(e.target.value)} placeholder="Enter registered address" style={{ height: '70px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '8px 12px', fontSize: '13px', outline: 'none', resize: 'none' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                              City <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                            </label>
                            <input type="text" value={vCity} onChange={(e) => setVCity(e.target.value)} placeholder="Enter city" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                              State <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                            </label>
                            {renderSelect(vState, (e) => setVState(e.target.value), ['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Maharashtra'], { height: '38px' })}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                              Country <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                            </label>
                            {renderSelect(vCountry, (e) => setVCountry(e.target.value), ['India', 'United States', 'Singapore'], { height: '38px' })}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                              PIN Code <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                            </label>
                            <input type="text" value={vPinCode} onChange={(e) => setVPinCode(e.target.value)} placeholder="Enter PIN code" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                          </div>
                        </div>
                      </div>

                      {/* Billing Address */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '12px', color: '#334155' }}>
                            Billing Address (If Different) <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                          </strong>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                            <input type="checkbox" checked={vSameAsRegistered} onChange={(e) => {
                              setVSameAsRegistered(e.target.checked);
                              if (e.target.checked) {
                                setVBillingAddress(vRegAddress);
                                setVBillingCity(vCity);
                                setVBillingState(vState);
                                setVBillingCountry(vCountry);
                                setVBillingPinCode(vPinCode);
                              }
                            }} style={{ cursor: 'pointer' }} />
                            Same as Registered Address
                          </label>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <textarea disabled={vSameAsRegistered} value={vSameAsRegistered ? vRegAddress : vBillingAddress} onChange={(e) => setVBillingAddress(e.target.value)} placeholder="Enter billing address" style={{ height: '70px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '8px 12px', fontSize: '13px', outline: 'none', resize: 'none', backgroundColor: vSameAsRegistered ? '#f8fafc' : 'white', color: vSameAsRegistered ? '#64748b' : '#334155' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                              City <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                            </label>
                            <input disabled={vSameAsRegistered} type="text" value={vSameAsRegistered ? vCity : vBillingCity} onChange={(e) => setVBillingCity(e.target.value)} placeholder="Enter city" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none', backgroundColor: vSameAsRegistered ? '#f8fafc' : 'white' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                              State <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                            </label>
                            {renderSelect(vSameAsRegistered ? vState : vBillingState, (e) => setVBillingState(e.target.value), ['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Maharashtra'], { height: '38px', backgroundColor: vSameAsRegistered ? '#f8fafc' : 'white', disabled: vSameAsRegistered })}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                              Country <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                            </label>
                            {renderSelect(vSameAsRegistered ? vCountry : vBillingCountry, (e) => setVBillingCountry(e.target.value), ['India', 'United States', 'Singapore'], { height: '38px', backgroundColor: vSameAsRegistered ? '#f8fafc' : 'white', disabled: vSameAsRegistered })}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                              PIN Code <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                            </label>
                            <input disabled={vSameAsRegistered} type="text" value={vSameAsRegistered ? vPinCode : vBillingPinCode} onChange={(e) => setVBillingPinCode(e.target.value)} placeholder="Enter PIN code" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none', backgroundColor: vSameAsRegistered ? '#f8fafc' : 'white' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Contact Details */}
                  <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>3. Contact Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Primary Contact Person <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input type="text" value={vContact} onChange={(e) => setVContact(e.target.value)} placeholder="Enter contact person" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Designation</label>
                        <input type="text" value={vDesignation} onChange={(e) => setVDesignation(e.target.value)} placeholder="Enter designation" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Phone <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input type="text" value={vPhone} onChange={(e) => setVPhone(e.target.value)} placeholder="Enter phone number" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Email <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input type="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} placeholder="Enter email address" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Alternate Phone</label>
                        <input type="text" value={vAltPhone} onChange={(e) => setVAltPhone(e.target.value)} placeholder="Enter alternate phone" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Preferred Communication</label>
                        {renderSelect(vPrefComm, (e) => setVPrefComm(e.target.value), ['Email', 'Phone', 'WhatsApp', 'SMS'], { height: '38px' })}
                      </div>
                    </div>
                  </div>

                  {/* 4. Other Details */}
                  <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>4. Other Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Payment Terms <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        {renderSelect(vPaymentTerms, (e) => setVPaymentTerms(e.target.value), ['Net 15 Days', 'Net 30 Days', 'Net 45 Days', 'Net 60 Days'], { height: '38px' })}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Currency <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        {renderSelect(vCurrency, (e) => setVCurrency(e.target.value), ['INR - Indian Rupee', 'USD - US Dollar', 'EUR - Euro'], { height: '38px' })}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                          Vendor Category <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        {renderSelect(vCat, (e) => setVCat(e.target.value), ['Steel & Metals', 'Aluminium', 'Electrical', 'Fasteners', 'Packaging', 'Raw Materials', 'Components'], { height: '38px' })}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 3' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Notes</label>
                        <input type="text" value={vTags} onChange={(e) => setVTags(e.target.value)} placeholder="Enter any additional notes" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (Sidebar cards) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* 5. Documents */}
                  <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>5. Documents</h3>
                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', backgroundColor: '#fafbfc' }}>
                      <UploadCloud style={{ width: '28px', height: '28px', color: '#2563eb' }} />
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>Drag and drop files here or</span>
                      <button type="button" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Browse Files</button>
                      <span style={{ fontSize: '9px', color: '#94a3b8', lineHeight: '1.4' }}>Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 10MB)</span>
                    </div>
                  </div>

                  {/* 6. Compliance & Settings */}
                  <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>6. Compliance & Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                        <input type="checkbox" checked={vActiveVendor} onChange={(e) => setVActiveVendor(e.target.checked)} style={{ cursor: 'pointer' }} />
                        Active Vendor
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                        <input type="checkbox" checked={vPreferredVendor} onChange={(e) => setVPreferredVendor(e.target.checked)} style={{ cursor: 'pointer' }} />
                        Preferred Vendor
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                        <input type="checkbox" checked={vBlacklistedVendor} onChange={(e) => setVBlacklistedVendor(e.target.checked)} style={{ cursor: 'pointer' }} />
                        Blacklisted Vendor
                      </label>
                    </div>
                  </div>

                  {/* 7. Tags */}
                  <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>7. Tags</h3>
                    <select style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '13px', backgroundColor: 'white', color: '#334155', outline: 'none' }}>
                      <option>Select or type to add tags</option>
                      <option>Reliable</option>
                      <option>Fast Delivery</option>
                      <option>Bulk Supplier</option>
                    </select>
                  </div>

                  {/* 8. Notes (Internal) */}
                  <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>8. Notes (Internal)</h3>
                    <textarea value={vInternalNotes} onChange={(e) => setVInternalNotes(e.target.value)} placeholder="Add internal notes about this vendor" style={{ width: '100%', height: '90px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '8px 12px', fontSize: '13px', outline: 'none', resize: 'none' }} />
                    <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>{vInternalNotes.length} / 500</span>
                  </div>

                  {/* 9. Quick Summary */}
                  <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fafbfc' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>9. Quick Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Vendor Type</span>
                        <strong style={{ color: '#334155' }}>{vType === 'Select vendor type' ? '--' : vType}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Status</span>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', backgroundColor: vBlacklistedVendor ? '#fee2e2' : '#dcfce7', color: vBlacklistedVendor ? '#991b1b' : '#166534' }}>
                          {vBlacklistedVendor ? 'Blacklisted' : vActiveVendor ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Created By</span>
                        <strong style={{ color: '#334155' }}>Arun</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Created Date</span>
                        <strong style={{ color: '#334155' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            ) : viewingVendor ? (
              /* Vendor Management View Mode: Full-Page Detail */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                {/* Header Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '16px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{viewingVendor.companyName || viewingVendor.name}</h2>
                        {renderStatusBadge(viewingVendor.status)}
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                        Zoho Contact ID: <strong style={{ color: '#2563EB' }}>{viewingVendor.code || viewingVendor.id}</strong> | Currency: <strong>{viewingVendor.currency || 'INR'}</strong>
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => setViewingVendor(null)}
                      style={{ border: 'none', backgroundColor: '#2563EB', color: 'white', fontWeight: 'bold', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Close View
                    </button>
                  </div>
                </div>

                {vendorModalLoading ? (
                  <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '60px 0', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span style={{ fontSize: '14px', color: '#2563EB', fontWeight: '600' }}>Fetching live contact details & addresses from Zoho Books…</span>
                  </div>
                ) : (
                  <>
                    {/* Top Key Metrics Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="section-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #DC2626' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Outstanding Payable</span>
                        <strong style={{ fontSize: '20px', color: '#DC2626', fontWeight: '800' }}>{viewingVendor.payable || viewingVendor.spend || '₹0.00'}</strong>
                      </div>
                      <div className="section-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #16A34A' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Unused Credits</span>
                        <strong style={{ fontSize: '20px', color: '#16A34A', fontWeight: '800' }}>{viewingVendor.unusedCredits || '₹0.00'}</strong>
                      </div>
                      <div className="section-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #2563EB' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Payment Terms</span>
                        <strong style={{ fontSize: '18px', color: '#1E293B', fontWeight: '700' }}>{viewingVendor.terms || 'Net 30 Days'}</strong>
                      </div>
                      <div className="section-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #9333EA' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>GSTIN / Tax ID</span>
                        <strong style={{ fontSize: '16px', color: '#1E293B', fontWeight: '700' }}>{viewingVendor.gstin || viewingVendor.gstTreatment || '—'}</strong>
                      </div>
                    </div>

                    {/* Section 1: Overview & Primary Contact Info */}
                    <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E3A8A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>1. General & Contact Profile</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Vendor Legal Name</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingVendor.companyName || viewingVendor.name}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Primary Contact Person</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingVendor.contact || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Vendor Type</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingVendor.type || 'Supplier'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Email Address</span>
                          <strong style={{ fontSize: '14px', color: '#2563EB' }}>{viewingVendor.email || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Phone Number</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingVendor.phone || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Mobile Phone</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingVendor.mobile || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Website</span>
                          <strong style={{ fontSize: '14px', color: '#2563EB' }}>{viewingVendor.website || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>PAN Number</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingVendor.pan || '—'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Addresses (Billing & Shipping) */}
                    <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E3A8A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>Address</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <strong style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Billing Address</strong>
                          {(() => {
                            const b = viewingVendor.billingAddressObj || {};
                            const street = b.address || b.street || b.address_1;
                            const street2 = b.street2 || b.address_2;
                            const cityStatePin = [b.city, b.state || b.province, b.zip || b.zipcode || b.postal_code || b.pincode].filter(Boolean).join(', ');
                            const hasStructured = street || street2 || cityStatePin || b.country;

                            if (hasStructured) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                                  {b.attention && <div><strong>Attention:</strong> {b.attention}</div>}
                                  {street && <div>{street}</div>}
                                  {street2 && <div>{street2}</div>}
                                  {cityStatePin && <div>{cityStatePin}</div>}
                                  {b.country && <div>{b.country || b.country_name}</div>}
                                  {b.phone && <div style={{ marginTop: '4px', color: '#64748B', fontSize: '12px' }}>Phone: {b.phone}</div>}
                                </div>
                              );
                            }
                            return <span style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>{viewingVendor.billingAddress && viewingVendor.billingAddress !== '—' ? viewingVendor.billingAddress : '—'}</span>;
                          })()}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <strong style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shipping Address</strong>
                          {(() => {
                            const s = viewingVendor.shippingAddressObj || {};
                            const street = s.address || s.street || s.address_1;
                            const street2 = s.street2 || s.address_2;
                            const cityStatePin = [s.city, s.state || s.province, s.zip || s.zipcode || s.postal_code || s.pincode].filter(Boolean).join(', ');
                            const hasStructured = street || street2 || cityStatePin || s.country;

                            if (hasStructured) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                                  {s.attention && <div><strong>Attention:</strong> {s.attention}</div>}
                                  {street && <div>{street}</div>}
                                  {street2 && <div>{street2}</div>}
                                  {cityStatePin && <div>{cityStatePin}</div>}
                                  {s.country && <div>{s.country || s.country_name}</div>}
                                  {s.phone && <div style={{ marginTop: '4px', color: '#64748B', fontSize: '12px' }}>Phone: {s.phone}</div>}
                                </div>
                              );
                            }
                            return <span style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>{viewingVendor.shippingAddress && viewingVendor.shippingAddress !== '—' ? viewingVendor.shippingAddress : '—'}</span>;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Other Details (Tax & GST Information from Zoho) */}
                    <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E3A8A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>Other Details</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px 20px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Default Currency</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingVendor.currency || 'INR'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>GST Treatment</span>
                          <strong style={{ fontSize: '13px', color: '#1E293B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                            {viewingVendor.gstTreatment && viewingVendor.gstTreatment !== '—' ? viewingVendor.gstTreatment : 'Registered Business - Regular'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>GSTIN</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B', letterSpacing: '0.5px' }}>{viewingVendor.gstin || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Source of Supply</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingVendor.sourceOfSupply || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>PAN</span>
                          <strong style={{ fontSize: '14px', color: '#1E293B', letterSpacing: '0.5px' }}>{viewingVendor.pan || '—'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Associated Contact Persons */}
                    {Array.isArray(viewingVendor.contactPersons) && viewingVendor.contactPersons.length > 0 && (
                      <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E3A8A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                          Associated Contact Persons ({viewingVendor.contactPersons.length})
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                          {viewingVendor.contactPersons.map((cp, cIdx) => (
                            <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                              <strong style={{ fontSize: '13px', color: '#0F172A' }}>{cp.name || 'Contact Person'}</strong>
                              {cp.designation && cp.designation !== '—' && <span style={{ fontSize: '11px', color: '#64748B' }}>{cp.designation}</span>}
                              <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <span>📧 {cp.email || '—'}</span>
                                <span>📞 {cp.phone || '—'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {/* 1. FILTERS & SEARCH ROW CARD */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', width: '100%', boxSizing: 'border-box', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#f8fafc', width: '380px' }}>
                    <Search style={{ width: '15px', height: '15px', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder="Search vendors (Vendor Name, Contact Person, Mobile, Email)..."
                      value={vSearchQuery}
                      onChange={(e) => { setVSearchQuery(e.target.value); setVCurrentPage(1); }}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: '#334155' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
                    <select 
                      value={vStatusFilter} 
                      onChange={(e) => { setVStatusFilter(e.target.value); setVCurrentPage(1); }} 
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', color: '#334155', outline: 'none' }}
                    >
                      <option value="All">Status: All</option>
                      <option value="Active">Active</option>
                      <option value="Preferred">Preferred</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blacklisted">Blacklisted</option>
                    </select>

                    <button 
                      onClick={clearVendorFilters} 
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
                    { id: 'All Vendors', label: 'All Vendors', count: vendorList.length, bg: '#e2e8f0', fg: '#475569' },
                    { id: 'Active', label: 'Active', count: countActive, bg: '#dcfce7', fg: '#166534' },
                    { id: 'Preferred', label: 'Preferred', count: countPreferred, bg: '#ffedd5', fg: '#c2410c' },
                    { id: 'Inactive', label: 'Inactive', count: countInactive, bg: '#f1f5f9', fg: '#475569' },
                    { id: 'Blacklisted', label: 'Blacklisted', count: countBlacklisted, bg: '#fee2e2', fg: '#991b1b' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setVActiveTab(tab.id); setVCurrentPage(1); }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '10px 4px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: vActiveTab === tab.id ? '#2563eb' : '#64748b',
                        borderBottom: vActiveTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
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

                {/* 3. TABLE CARD */}
                <div className="section-card" style={{ padding: 0, overflowX: 'auto', width: '100%' }}>
                  <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fafbfc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ width: '40px', padding: '12px 16px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            onChange={handleSelectAllVendors}
                            checked={currentVendorRows.length > 0 && currentVendorRows.every(row => selectedVendors.includes(row.code))}
                            style={{ cursor: 'pointer' }}
                          />
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 'bold' }}>Vendor Name</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 'bold' }}>Contact Person</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 'bold' }}>Mobile / Email</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 'bold' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: 'bold' }}>Payment Terms</th>
                        <th style={{ width: '60px', padding: '12px 16px', textAlign: 'center', color: '#475569', fontWeight: 'bold' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorLoading ? (
                        Array.from({ length: 6 }).map((_, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <input type="checkbox" defaultChecked={false} disabled />
                            </td>
                            {Array.from({ length: 5 }).map((_, cIdx) => (
                              <td key={cIdx} style={{ padding: '12px 16px' }}>
                                <div className="skeleton-shimmer skeleton-text" style={{ width: `${60 + (cIdx * 7) % 30}%`, height: '13px' }} />
                              </td>
                            ))}
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <div className="skeleton-shimmer" style={{ width: '28px', height: '28px', borderRadius: '6px', margin: '0 auto' }} />
                            </td>
                          </tr>
                        ))
                      ) : currentVendorRows.length > 0 ? (
                        currentVendorRows.map((vendor, idx) => {
                          const isChecked = selectedVendors.includes(vendor.code);
                          let statusBg = '#f1f5f9';
                          let statusColor = '#475569';
                          if (vendor.status === 'Active') {
                            statusBg = '#dcfce7';
                            statusColor = '#166534';
                          } else if (vendor.status === 'Preferred') {
                            statusBg = '#ffedd5';
                            statusColor = '#c2410c';
                          } else if (vendor.status === 'Blacklisted') {
                            statusBg = '#fee2e2';
                            statusColor = '#991b1b';
                          }

                          return (
                            <tr 
                              key={vendor.code} 
                              style={{ 
                                borderBottom: idx === currentVendorRows.length - 1 ? 'none' : '1px solid #f1f5f9',
                                backgroundColor: isChecked ? '#f8fafc' : 'transparent',
                                transition: 'background-color 0.2s'
                              }}
                            >
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => handleSelectVendorRow(vendor.code)}
                                  style={{ cursor: 'pointer' }}
                                />
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>{vendor.name}</td>
                              <td style={{ padding: '12px 16px', color: '#475569' }}>{vendor.contact}</td>
                              <td style={{ padding: '12px 16px', color: '#475569' }}>{vendor.phone}</td>
                              <td style={{ padding: '12px 16px' }}>
                                {renderStatusBadge(vendor.status)}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#475569' }}>{vendor.terms}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', cursor: 'pointer', position: 'relative' }}>
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveVendorActionMenu(activeVendorActionMenu === vendor.code ? null : vendor.code);
                                  }}
                                  style={{ display: 'inline-flex', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  <MoreVertical style={{ width: '16px', height: '16px' }} />
                                </div>
                                {activeVendorActionMenu === vendor.code && (
                                  <>
                                    <div 
                                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                                      onClick={(e) => { e.stopPropagation(); setActiveVendorActionMenu(null); }}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      right: '16px',
                                      top: '36px',
                                      backgroundColor: '#FFFFFF',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                      zIndex: 999,
                                      width: '120px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      padding: '4px 0'
                                    }}>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenVendorDetails(vendor);
                                          setActiveVendorActionMenu(null);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#334155', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
                                      >
                                        View Details
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingVendor(vendor);
                                          setActiveVendorActionMenu(null);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#334155', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
                                      >
                                        Edit Vendor
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmVendor(vendor);
                                          setActiveVendorActionMenu(null);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#EF4444', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                            No vendors match the active filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* 4. PAGINATION FOOTER */}
                  {totalVendorPages > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
                      <span>
                        Showing {(vCurrentPage - 1) * vRowsPerPage + 1} to {Math.min(vCurrentPage * vRowsPerPage, filteredVendors.length)} of {filteredVendors.length} entries
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Rows per page:</span>
                          {renderSelect(vRowsPerPage, (e) => { setVRowsPerPage(parseInt(e.target.value)); setVCurrentPage(1); }, [5, 10, 20, 50], { height: '32px', width: '70px' })}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            disabled={vCurrentPage === 1}
                            onClick={() => setVCurrentPage(prev => Math.max(prev - 1, 1))}
                            style={{ border: '1px solid #cbd5e1', background: vCurrentPage === 1 ? '#f1f5f9' : 'white', cursor: vCurrentPage === 1 ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                          >
                            <ChevronLeft style={{ width: '14px', height: '14px' }} />
                          </button>
                          
                          {(() => {
                            let start = Math.max(1, vCurrentPage - 1);
                            let end = start + 3;
                            if (end > totalVendorPages) {
                              end = totalVendorPages;
                              start = Math.max(1, end - 3);
                            }
                            return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                              <button
                                key={page}
                                onClick={() => setVCurrentPage(page)}
                                style={{
                                  border: '1px solid #cbd5e1',
                                  background: page === vCurrentPage ? '#2563eb' : 'white',
                                  color: page === vCurrentPage ? 'white' : '#475569',
                                  cursor: 'pointer',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontWeight: page === vCurrentPage ? 'bold' : 'normal'
                                }}
                              >
                                {page}
                              </button>
                            ));
                          })()}

                          <button 
                            disabled={vCurrentPage === totalVendorPages}
                            onClick={() => setVCurrentPage(prev => Math.min(prev + 1, totalVendorPages))}
                            style={{ border: '1px solid #cbd5e1', background: vCurrentPage === totalVendorPages ? '#f1f5f9' : 'white', cursor: vCurrentPage === totalVendorPages ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                          >
                            <ChevronRight style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Edit Vendor Modal */}
            {editingVendor && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Edit Vendor Profile</h3>
                    <button onClick={() => setEditingVendor(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Vendor Name</label>
                      <input 
                        type="text" 
                        value={editingVendor.name} 
                        onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Primary Contact</label>
                      <input 
                        type="text" 
                        value={editingVendor.contact} 
                        onChange={(e) => setEditingVendor({ ...editingVendor, contact: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Phone Number</label>
                      <input 
                        type="text" 
                        value={editingVendor.phone} 
                        onChange={(e) => setEditingVendor({ ...editingVendor, phone: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Payment Terms</label>
                      <input 
                        type="text" 
                        value={editingVendor.terms} 
                        onChange={(e) => setEditingVendor({ ...editingVendor, terms: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      onClick={() => setEditingVendor(null)}
                      style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setVendorList(prev => prev.map(v => v.code === editingVendor.code ? editingVendor : v));
                        setEditingVendor(null);
                      }}
                      style={{ border: 'none', background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmVendor && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Delete Vendor</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                    Are you sure you want to delete vendor <strong>{deleteConfirmVendor.name}</strong> ({deleteConfirmVendor.code})? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      onClick={() => setDeleteConfirmVendor(null)}
                      style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        const targetId = deleteConfirmVendor.id || deleteConfirmVendor.code || deleteConfirmVendor.name;
                        setVendorList(prev => prev.filter(v => v.code !== deleteConfirmVendor.code && v.id !== deleteConfirmVendor.id));
                        setDeleteConfirmVendor(null);
                        
                        if (targetId) {
                          fetch(`/api/zoho/vendors/${encodeURIComponent(targetId)}`, { method: 'DELETE' })
                            .then(res => res.json())
                            .then(data => {
                              console.log('Vendor deleted from Zoho & Control Room:', data);
                              fetchVendors();
                            })
                            .catch(err => console.error('Failed to delete vendor in backend:', err));
                        }
                      }}
                      style={{ border: 'none', background: '#EF4444', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Modal matching standard Control Room popups */}
            {vendorConfirmModal.show && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>{vendorConfirmModal.title}</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                    {vendorConfirmModal.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      type="button"
                      onClick={() => setVendorConfirmModal({ ...vendorConfirmModal, show: false })}
                      style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const act = vendorConfirmModal.action;
                        setVendorConfirmModal({ ...vendorConfirmModal, show: false });
                        if (act === 'cancel') {
                          setShowForm(false);
                        } else if (act === 'draft' || act === 'submit') {
                          handleCreateVendor();
                        }
                      }}
                      style={{ border: 'none', background: vendorConfirmModal.confirmBtnColor || '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      {vendorConfirmModal.confirmLabel}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== 3. QUOTATIONS SCREEN ==================== */}
      {activeTab === 'Quotations' && (() => {
        // Filter logic
        const filteredList = quotationsList.filter(item => {
          const query = quotationSearchQuery.toLowerCase();
          const matchesSearch = !quotationSearchQuery ||
            item.id.toLowerCase().includes(query) ||
            item.customer.toLowerCase().includes(query) ||
            item.project.toLowerCase().includes(query);

          const matchesTab = quotationActiveTab === 'All' || item.status === quotationActiveTab;
          const matchesCustomer = quotationCustomerFilter === 'All' || item.customer === quotationCustomerFilter;
          const matchesProject = quotationProjectFilter === 'All' || item.project === quotationProjectFilter;
          const matchesSalesPerson = quotationSalesPersonFilter === 'All' || item.salesPerson === quotationSalesPersonFilter;

          return matchesSearch && matchesTab && matchesCustomer && matchesProject && matchesSalesPerson;
        });

        // Unique values for dropdowns
        const uniqueCustomers = ['All', ...new Set(quotationsList.map(q => q.customer))];
        const uniqueProjects = ['All', ...new Set(quotationsList.map(q => q.project))];
        const uniqueSalesPersons = ['All', ...new Set(quotationsList.map(q => q.salesPerson))];

        const clearQuotationFilters = () => {
          setQuotationSearchQuery('');
          setQuotationCustomerFilter('All');
          setQuotationProjectFilter('All');
          setQuotationSalesPersonFilter('All');
          setQuotationActiveTab('All');
          setQuotationCurrentPage(1);
        };

        // Pagination calculations
        const indexOfLastRow = quotationCurrentPage * quotationRowsPerPage;
        const indexOfFirstRow = indexOfLastRow - quotationRowsPerPage;
        const currentRows = filteredList.slice(indexOfFirstRow, indexOfLastRow);
        const totalPages = Math.ceil(filteredList.length / quotationRowsPerPage) || 1;

        const handleSelectAll = (e) => {
          if (e.target.checked) {
            setSelectedQuotations(currentRows.map(r => r.id));
          } else {
            setSelectedQuotations([]);
          }
        };

        const handleSelectRow = (id) => {
          if (selectedQuotations.includes(id)) {
            setSelectedQuotations(selectedQuotations.filter(item => item !== id));
          } else {
            setSelectedQuotations([...selectedQuotations, id]);
          }
        };

        const getCount = (status) => {
          if (status === 'All') return 126;
          if (status === 'Draft') return 18;
          if (status === 'Sent') return 42;
          if (status === 'Viewed') return 25;
          if (status === 'Accepted') return 21;
          if (status === 'Expired') return 12;
          if (status === 'Rejected') return 8;
          return quotationsList.filter(q => q.status === status).length;
        };

        const getStatusColor = (status) => {
          switch (status) {
            case 'Sent': return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
            case 'Viewed': return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
            case 'Accepted': return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
            case 'Draft': return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
            case 'Expired': return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
            case 'Rejected': return { bg: '#fff5f5', color: '#e53e3e', border: '#fed7d7' };
            default: return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
          }
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Quotation Comparisons</h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Select and compare multiple vendor quotations</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', width: '100%', boxSizing: 'border-box', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#f8fafc', width: '380px' }}>
                <Search style={{ width: '15px', height: '15px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search by Quotation No, Customer, Project..."
                  value={quotationSearchQuery}
                  onChange={(e) => { setQuotationSearchQuery(e.target.value); setQuotationCurrentPage(1); }}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#334155' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', cursor: 'pointer', backgroundColor: 'white', fontSize: '13px', color: '#475569' }}>
                  <span>Date Range</span>
                  <Calendar style={{ width: '14px', height: '14px', color: '#64748b' }} />
                </div>

                <select value={quotationStatusFilter} onChange={(e) => { setQuotationStatusFilter(e.target.value); setQuotationActiveTab(e.target.value); setQuotationCurrentPage(1); }} style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 24px 0 10px', fontSize: '13px', backgroundColor: 'white', color: '#334155', minWidth: '130px', outline: 'none' }}>
                  {['All', 'Draft', 'Sent', 'Viewed', 'Accepted', 'Expired', 'Rejected'].map(s => (
                    <option key={s} value={s}>
                      {s === 'All' ? 'Status: All' : s}
                    </option>
                  ))}
                </select>

                {renderSelect(quotationSalesPersonFilter, (e) => { setQuotationSalesPersonFilter(e.target.value); setQuotationCurrentPage(1); }, uniqueSalesPersons, { height: '38px', width: '140px' })}

                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 16px', height: '38px', cursor: 'pointer', backgroundColor: 'white', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                  <Filter style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                  <span>Filters</span>
                </button>

                <button 
                  onClick={clearQuotationFilters} 
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

            {/* 2. STATUS TABS ROW (RFP Style) */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '20px', padding: '4px 0', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              {[
                { label: 'All Quotations', status: 'All', color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Draft', status: 'Draft', color: '#c2410c', bg: '#fff7ed' },
                { label: 'Sent', status: 'Sent', color: '#1d4ed8', bg: '#eff6ff' },
                { label: 'Viewed', status: 'Viewed', color: '#7e22ce', bg: '#faf5ff' },
                { label: 'Accepted', status: 'Accepted', color: '#15803d', bg: '#f0fdf4' },
                { label: 'Expired', status: 'Expired', color: '#b91c1c', bg: '#fef2f2' },
                { label: 'Rejected', status: 'Rejected', color: '#e53e3e', bg: '#fff5f5' }
              ].map(tab => (
                <button
                  key={tab.status}
                  onClick={() => { setQuotationActiveTab(tab.status); setQuotationStatusFilter(tab.status); setQuotationCurrentPage(1); }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '10px 4px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: quotationActiveTab === tab.status ? '#2563eb' : '#64748b',
                    borderBottom: quotationActiveTab === tab.status ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: tab.bg || '#f1f5f9', color: tab.color || '#475569', padding: '1px 6px', borderRadius: '10px' }}>
                    {getCount(tab.status)}
                  </span>
                </button>
              ))}
            </div>

            {/* 3. TABLE CARD */}
            <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Table */}
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <th style={{ width: '40px', padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={currentRows.length > 0 && currentRows.every(r => selectedQuotations.includes(r.id))}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Quotation No</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Valid Until</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Amount (₹)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '700' }}>Sales Person</th>
                      <th style={{ width: '60px', padding: '12px 16px', textAlign: 'center', color: '#475569', fontWeight: '700' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.length > 0 ? (
                      currentRows.map((row, idx) => {
                        const isChecked = selectedQuotations.includes(row.id);
                        const colors = getStatusColor(row.status);
                        return (
                          <tr
                            key={row.id}
                            style={{
                              borderBottom: idx === currentRows.length - 1 ? 'none' : '1px solid #f1f5f9',
                              backgroundColor: isChecked ? '#f8fafc' : 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleSelectRow(row.id)}
                          >
                            <td style={{ textAlign: 'center', padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSelectRow(row.id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '14px 16px', color: '#2563eb', fontWeight: 'bold' }}>{row.id}</td>
                            <td style={{ padding: '14px 16px', color: '#475569' }}>{row.date}</td>
                            <td style={{ padding: '14px 16px', color: '#64748b' }}>{row.validUntil}</td>
                            <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: '600' }}>{row.amount}</td>
                            <td style={{ padding: '14px 16px' }}>
                              {renderStatusBadge(row.status)}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#475569' }}>{row.salesPerson}</td>
                            <td style={{ textAlign: 'center', padding: '14px 16px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveQuotationActionMenu(activeQuotationActionMenu === row.id ? null : row.id);
                                }}
                                style={{ display: 'inline-flex', padding: '6px', borderRadius: '4px' }}
                              >
                                <MoreVertical style={{ width: '16px', height: '16px', margin: '0 auto' }} />
                              </div>
                              {activeQuotationActionMenu === row.id && (
                                <>
                                  <div 
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                                    onClick={(e) => { e.stopPropagation(); setActiveQuotationActionMenu(null); }}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '36px',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                    zIndex: 999,
                                    width: '120px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '4px 0'
                                  }}>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingQuotation(row);
                                        setActiveQuotationActionMenu(null);
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#334155', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
                                    >
                                      View Details
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingQuotation(row);
                                        setActiveQuotationActionMenu(null);
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#334155', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmQuotation(row);
                                        setActiveQuotationActionMenu(null);
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#EF4444', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                          No quotations found matching the filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table pagination footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fafbfc' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredList.length)} of {filteredList.length} entries
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Pagination Controls */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      disabled={quotationCurrentPage === 1}
                      onClick={() => setQuotationCurrentPage(quotationCurrentPage - 1)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white', cursor: quotationCurrentPage === 1 ? 'not-allowed' : 'pointer', color: quotationCurrentPage === 1 ? '#cbd5e1' : '#475569' }}
                    >
                      <ChevronLeft style={{ width: '16px', height: '16px' }} />
                    </button>
                    {(() => {
                      let start = Math.max(1, quotationCurrentPage - 1);
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
                    })().map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setQuotationCurrentPage(pageNum)}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: pageNum === quotationCurrentPage ? 'none' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          backgroundColor: pageNum === quotationCurrentPage ? '#2563eb' : 'white',
                          color: pageNum === quotationCurrentPage ? 'white' : '#475569',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      disabled={quotationCurrentPage === totalPages || totalPages === 0}
                      onClick={() => setQuotationCurrentPage(quotationCurrentPage + 1)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white', cursor: quotationCurrentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', color: quotationCurrentPage === totalPages || totalPages === 0 ? '#cbd5e1' : '#475569' }}
                    >
                      <ChevronRight style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>

                  {/* Rows per page selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={quotationRowsPerPage}
                      onChange={(e) => { setQuotationRowsPerPage(parseInt(e.target.value)); setQuotationCurrentPage(1); }}
                      style={{ height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px', backgroundColor: 'white' }}
                    >
                      <option value={5}>5 / page</option>
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* View Quotation Modal */}
            {viewingQuotation && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Quotation Details — {viewingQuotation.id}</h3>
                    <button onClick={() => setViewingQuotation(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: '24px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Customer</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingQuotation.customer}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Project</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingQuotation.project}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Date</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingQuotation.date}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Valid Until</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingQuotation.validUntil}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Amount</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingQuotation.amount}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Sales Person</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingQuotation.salesPerson}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Status</span>
                      <span style={{ display: 'inline-block', marginTop: '2px' }}>{renderStatusBadge(viewingQuotation.status)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setViewingQuotation(null)}
                      style={{ border: 'none', background: '#2563eb', color: 'white', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Quotation Modal */}
            {editingQuotation && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Edit Quotation — {editingQuotation.id}</h3>
                    <button onClick={() => setEditingQuotation(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Customer</label>
                      <input 
                        type="text" 
                        value={editingQuotation.customer} 
                        onChange={(e) => setEditingQuotation({ ...editingQuotation, customer: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Project</label>
                      <input 
                        type="text" 
                        value={editingQuotation.project} 
                        onChange={(e) => setEditingQuotation({ ...editingQuotation, project: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Amount</label>
                      <input 
                        type="text" 
                        value={editingQuotation.amount} 
                        onChange={(e) => setEditingQuotation({ ...editingQuotation, amount: e.target.value })}
                        style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      onClick={() => setEditingQuotation(null)}
                      style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setQuotationsList(prev => prev.map(q => q.id === editingQuotation.id ? editingQuotation : q));
                        setEditingQuotation(null);
                      }}
                      style={{ border: 'none', background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Quotation Modal */}
            {deleteConfirmQuotation && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Delete Quotation</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                    Are you sure you want to delete quotation <strong>{deleteConfirmQuotation.id}</strong>? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      onClick={() => setDeleteConfirmQuotation(null)}
                      style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setQuotationsList(prev => prev.filter(q => q.id !== deleteConfirmQuotation.id));
                        setDeleteConfirmQuotation(null);
                      }}
                      style={{ border: 'none', background: '#EF4444', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== 4. GOODS RECEIPT NOTE (GRN) SCREEN ==================== */}
      {activeTab === 'Goods Receipt Note' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {!showCreateGRN ? (
            <>
              {/* List View Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0F172A' }}>Goods Receipt Note (GRN)</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Record goods received against Purchase Order</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      setSelectedGRNPo('');
                      setSelectedGRNVendor('');
                      setGrnChallanNo('');
                      setGrnItems([]);
                      setShowCreateGRN(true);
                    }}
                    style={{
                      height: '38px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Create New GRN
                  </button>
                </div>
              </div>
              
              {/* Search / Filter GRN Card */}
              <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <strong style={{ fontSize: '15px', color: '#0F172A' }}>Search / Filter GRN</strong>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>GRN No.</label>
                    <input type="text" placeholder="Enter GRN No." style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>PO No.</label>
                    <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                      <option>Select PO No.</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Vendor</label>
                    <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                      <option>Select Vendor</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>GRN Date</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type="text" placeholder="01/05/2025 - 31/05/2025" style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 36px 0 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                      <Calendar style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '12px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Item / Material</label>
                    <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                      <option>Select Item</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Warehouse</label>
                    <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                      <option>Select Warehouse</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>GRN Status</label>
                    <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                      <option>Select Status</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button style={{
                      height: '38px',
                      padding: '0 24px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      color: '#2563EB',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>Reset</button>
                    <button style={{
                      height: '38px',
                      padding: '0 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}>
                      <Search style={{ width: '14px', height: '14px' }} />
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent GRNs Card */}
              <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>Recent GRNs</strong>
                  <button style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>View All</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                        <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>GRN No.</th>
                        <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>PO No.</th>
                        <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Vendor Name</th>
                        <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>GRN Date</th>
                        <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Total Value</th>
                        <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grnList.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                            No Goods Receipt Notes found. Click "Create New GRN" to log a new receipt.
                          </td>
                        </tr>
                      ) : [...grnList].sort((a, b) => {
                        const parseNum = (item) => {
                          const str = String(item.id || item.grnNo || item.poRef || '');
                          const match = str.match(/\d+/);
                          return match ? parseInt(match[0], 10) : 0;
                        };
                        return parseNum(b) - parseNum(a);
                      }).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                          <td style={{ padding: '12px 4px', fontWeight: '700', color: '#0F172A' }}>{row.id}</td>
                          <td style={{ padding: '12px 4px', color: '#475569' }}>{row.poRef}</td>
                          <td style={{ padding: '12px 4px', color: '#475569' }}>{row.vendor}</td>
                          <td style={{ padding: '12px 4px', color: '#64748B' }}>{row.date}</td>
                          <td style={{ padding: '12px 4px', fontWeight: '600', color: '#0F172A' }}>{row.val || '₹ 2,48,500'}</td>
                          <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px', 
                              fontWeight: 'bold', 
                              backgroundColor: (row.status === 'Approved' || row.status === 'Fully Accepted' || row.status === 'CLOSED / FULLY RECEIVED') ? '#E6F7ED' : '#FEF3D6', 
                              color: (row.status === 'Approved' || row.status === 'Fully Accepted' || row.status === 'CLOSED / FULLY RECEIVED') ? '#137333' : '#B06000' 
                            }}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                title="View GRN Full Details"
                                onClick={() => {
                                  resetCreateGRNForm();
                                  loadPOItems(row.poRef);
                                  if (row.challanNo) setGrnChallanNo(row.challanNo);
                                  if (row.receivedBy) setGrnReceivedBy(row.receivedBy);
                                  if (row.inspectorName) setGrnInspectorName(row.inspectorName);
                                  if (row.inspectionRemarks) setGrnInspectionRemarks(row.inspectionRemarks);
                                  setIsViewOnlyMode(true);
                                  setShowCreateGRN(true);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#2563EB' }}
                              >
                                <Eye style={{ width: '15px', height: '15px' }} />
                              </button>
                              {row.status !== 'CLOSED / FULLY RECEIVED' && row.status !== 'Approved' && row.status !== 'Fully Accepted' && (
                                <button
                                  type="button"
                                  title="Edit Draft GRN"
                                  onClick={() => {
                                    resetCreateGRNForm();
                                    loadPOItems(row.poRef);
                                    if (row.challanNo) setGrnChallanNo(row.challanNo);
                                    if (row.receivedBy) setGrnReceivedBy(row.receivedBy);
                                    if (row.inspectorName) setGrnInspectorName(row.inspectorName);
                                    if (row.inspectionRemarks) setGrnInspectionRemarks(row.inspectionRemarks);
                                    setEditingGrnId(row.id);
                                    setIsViewOnlyMode(false);
                                    setShowCreateGRN(true);
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#D97706' }}
                                >
                                  <Edit3 style={{ width: '15px', height: '15px' }} />
                                </button>
                              )}
                              {row.status !== 'CLOSED / FULLY RECEIVED' && row.status !== 'Approved' && row.status !== 'Fully Accepted' && row.status !== 'Closed' && row.status !== 'CLOSED' && (
                                <button
                                  type="button"
                                  title="Delete GRN"
                                  onClick={() => handleDeleteGRN(row.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#EF4444' }}
                                >
                                  <Trash2 style={{ width: '15px', height: '15px' }} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (() => {
            // Calculation of Totals
            const totalOrdered = grnItems.reduce((acc, it) => acc + it.ordered, 0);
            const totalPrev = grnItems.reduce((acc, it) => acc + it.prev, 0);
            const totalNow = grnItems.reduce((acc, it) => acc + Number(it.now || 0), 0);
            const totalAccepted = grnItems.reduce((acc, it) => acc + Number(it.accepted || 0), 0);
            const totalRejected = grnItems.reduce((acc, it) => acc + Number(it.rejected || 0), 0);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Form Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0F172A' }}>
                      {isViewOnlyMode ? 'View Goods Receipt Note (GRN)' : (editingGrnId ? `Edit Draft (${editingGrnId})` : 'New Goods Receipt Note (GRN)')}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {isViewOnlyMode ? 'Viewing recorded goods receipt details (Read Only)' : 'Record goods received against a Purchase Order'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => {
                        setShowCreateGRN(false);
                        resetCreateGRNForm();
                      }}
                      style={{
                        height: '38px',
                        padding: '0 20px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#334155',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {isViewOnlyMode ? 'Back to List' : 'Cancel'}
                    </button>
                    {!isViewOnlyMode && (
                      <>
                        <button 
                          onClick={handleSaveAndReceive}
                          style={{
                            height: '38px',
                            padding: '0 16px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Save & Receive
                        </button>
                        <button 
                          onClick={handleFullyReceived}
                          title="Mark all items as received, close GRN, and close PO in Zoho Books"
                          style={{
                            height: '38px',
                            padding: '0 18px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#16a34a',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                          }}
                        >
                          <CheckCircle style={{ width: '16px', height: '16px' }} />
                          Fully Received
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Form Body layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
                  
                  {/* Card 1: 1. GRN Information (Span 8) */}
                  <div className="section-card" style={{ gridColumn: 'span 8', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#2563EB' }}>1. GRN Information</strong>
                      <HelpCircle style={{ width: '14px', height: '14px', color: '#94A3B8' }} />
                    </div>
                    
                    {/* Row 1: GRN No, Receipt Date, Purchase Order */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>GRN No.</label>
                        <input type="text" value="GRN-2026-000124" disabled style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#F8FAFC', color: '#64748B' }} />
                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>Auto-generated</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                          Receipt Date <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input type="date" defaultValue={new Date().toISOString().split('T')[0]} style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#334155' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                          Purchase Order <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <select 
                          value={selectedGRNPo} 
                          disabled={isViewOnlyMode}
                          onChange={(e) => {
                            const poNo = e.target.value;
                            loadPOItems(poNo);
                          }}
                          style={{ height: '38px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '12px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF', color: '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                        >
                          {(() => {
                            const eligiblePOs = livePOs.filter(po => {
                              const isSelected = po.poNo === selectedGRNPo || po.id === selectedGRNPo;
                              const s = String(po.status || '').toUpperCase();
                              const sType = String(po.statusType || '').toLowerCase();
                              
                              const isOpen = s === 'OPEN' || s === 'APPROVED' || sType === 'approved';
                              const isPartiallyReceived = s.includes('PARTIALLY') || sType === 'partially_received';

                              return isSelected || isOpen || isPartiallyReceived;
                            });

                            return (
                              <>
                                <option value="" disabled>Select Purchase Order ({eligiblePOs.length} Open / Partial POs)</option>
                                {eligiblePOs.map((po) => (
                                  <option key={po.id || po.poNo} value={po.poNo || po.id}>
                                    {po.poNo} — {po.vendor.length > 20 ? po.vendor.substring(0, 20) + '...' : po.vendor} ({po.status})
                                  </option>
                                ))}
                              </>
                            );
                          })()}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Vendor, Warehouse / Location */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                          Vendor <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          readOnly 
                          value={selectedGRNVendor || ''} 
                          placeholder="Auto-populated from PO" 
                          style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#F8FAFC', color: '#334155', fontWeight: '600' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                          Warehouse / Location <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <select disabled={isViewOnlyMode} defaultValue="ARMS AI Main Facility" style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF', color: '#334155' }}>
                          <option value="" disabled>Select Warehouse / Location</option>
                          <option value="ARMS AI Main Facility">ARMS AI Main Facility</option>
                          <option value="Stock Area">Stock Area</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Delivery Challan No, Challan Date, Received By */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                          DC NO / Invoice No. <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="Enter DC NO / Invoice No." 
                          value={grnChallanNo}
                          disabled={isViewOnlyMode}
                          onChange={(e) => setGrnChallanNo(e.target.value)}
                          style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF', color: '#334155' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Challan Date</label>
                        <input type="date" disabled={isViewOnlyMode} defaultValue={new Date().toISOString().split('T')[0]} style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF', color: '#334155' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                          Received By <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                        </label>
                        <input 
                          type="text" 
                          value={grnReceivedBy}
                          disabled={isViewOnlyMode} 
                          placeholder="Enter receiver name" 
                          onChange={(e) => setGrnReceivedBy(e.target.value)}
                          style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF', color: '#334155' }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: 2. Purchase Order Summary & Receiving History (Span 4) */}
                  <div className="section-card" style={{ gridColumn: 'span 4', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px', color: '#2563EB' }}>2. Purchase Order Summary</strong>
                      {selectedGRNPo && (
                        <button 
                          type="button"
                          onClick={() => onChangeTab('Purchase Orders', selectedGRNPo)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            color: '#2563EB',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          View PO
                          <ExternalLink style={{ width: '10px', height: '10px' }} />
                        </button>
                      )}
                    </div>

                    {!selectedGRNPo ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                        Select a Purchase Order to load order details and line items.
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const totOrd = grnItems.reduce((acc, curr) => acc + (curr.ordered || 0), 0);
                          const totPrev = grnItems.reduce((acc, curr) => acc + (curr.prev || 0), 0);
                          const totNow = grnItems.reduce((acc, curr) => acc + (curr.now || 0), 0);
                          const totRemaining = Math.max(0, totOrd - totPrev - totNow);
                          const pct = totOrd > 0 ? (((totPrev + totNow) / totOrd) * 100).toFixed(1) : 0;

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <strong style={{ fontSize: '16px', color: '#0F172A' }}>{selectedGRNPo}</strong>
                                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{selectedGRNVendor || 'Vendor'}</div>
                                </div>
                                <span style={{ 
                                  padding: '4px 10px', 
                                  borderRadius: '20px', 
                                  fontSize: '10px', 
                                  fontWeight: '800',
                                  backgroundColor: totPrev + totNow >= totOrd && totOrd > 0 ? '#E6F7ED' : '#FEF3C7',
                                  color: totPrev + totNow >= totOrd && totOrd > 0 ? '#137333' : '#D97706'
                                }}>
                                  {totPrev + totNow >= totOrd && totOrd > 0 ? 'CLOSED / FULLY RECEIVED' : (totPrev > 0 ? 'OPEN / PARTIALLY RECEIVED' : 'OPEN')}
                                </span>
                              </div>

                              {/* Receiving Progress Bar */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}>
                                  <span style={{ color: '#475569' }}>Receiving Progress</span>
                                  <span style={{ color: '#2563EB' }}>{totPrev + totNow} / {totOrd} Received ({pct}%)</span>
                                </div>
                                <div style={{ height: '6px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: '#2563EB', transition: 'width 0.3s' }}></div>
                                </div>
                              </div>

                              {/* Quantitative Summary */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                                <div style={{ backgroundColor: '#F1F5F9', padding: '6px 4px', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '9px', color: '#64748B', display: 'block', fontWeight: 'bold' }}>Ordered</span>
                                  <strong style={{ fontSize: '12px', color: '#0F172A' }}>{totOrd}</strong>
                                </div>
                                <div style={{ backgroundColor: '#F1F5F9', padding: '6px 4px', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '9px', color: '#64748B', display: 'block', fontWeight: 'bold' }}>Previous</span>
                                  <strong style={{ fontSize: '12px', color: '#64748B' }}>{totPrev}</strong>
                                </div>
                                <div style={{ backgroundColor: '#EFF6FF', padding: '6px 4px', borderRadius: '6px', border: '1px solid #DBEAFE' }}>
                                  <span style={{ fontSize: '9px', color: '#2563EB', display: 'block', fontWeight: 'bold' }}>This GRN</span>
                                  <strong style={{ fontSize: '12px', color: '#2563EB' }}>+{totNow}</strong>
                                </div>
                                <div style={{ backgroundColor: totRemaining === 0 ? '#E6F7ED' : '#FEF2F2', padding: '6px 4px', borderRadius: '6px' }}>
                                  <span style={{ fontSize: '9px', color: totRemaining === 0 ? '#137333' : '#DC2626', display: 'block', fontWeight: 'bold' }}>Remaining</span>
                                  <strong style={{ fontSize: '12px', color: totRemaining === 0 ? '#137333' : '#DC2626' }}>{totRemaining}</strong>
                                </div>
                              </div>

                              {/* Previous GRN History List */}
                              {poReceivingHistory.length > 0 && (
                                <div style={{ marginTop: '4px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>
                                    Previous GRN History ({poReceivingHistory.length})
                                  </span>
                                  <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {poReceivingHistory.map((g, idx) => (
                                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', padding: '4px 8px', backgroundColor: '#F8FAFC', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                                        <span style={{ fontWeight: 'bold', color: '#2563EB' }}>{g.grnNo}</span>
                                        <span style={{ color: '#64748B' }}>{g.date}</span>
                                        <span style={{ fontWeight: 'bold', color: '#137333' }}>+{g.receivedQty || 0} Qty</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {/* Card 3: 3. Received Items (Span 8) */}
                  <div className="section-card" style={{ gridColumn: 'span 8', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#2563EB' }}>3. Received Items</strong>
                      <HelpCircle style={{ width: '14px', height: '14px', color: '#94A3B8' }} />
                    </div>

                    <div style={{ overflowX: 'auto', flex: 1 }}>
                      <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                            <th style={{ padding: '8px 2px', color: '#64748B' }}>#</th>
                            <th style={{ padding: '8px 4px', color: '#64748B', width: '320px' }}>Item / Material & Description</th>
                            <th style={{ padding: '8px 4px', color: '#64748B', textAlign: 'center' }}>UOM</th>
                            <th style={{ padding: '8px 4px', color: '#64748B', textAlign: 'center' }}>Ordered Qty</th>
                            <th style={{ padding: '8px 4px', color: '#64748B', textAlign: 'center' }}>Previously Received</th>
                            <th style={{ padding: '8px 4px', color: '#64748B', textAlign: 'center' }}>Receiving Now *</th>
                            <th style={{ padding: '8px 4px', color: '#64748B', textAlign: 'center' }}>Accepted Qty</th>
                            <th style={{ padding: '8px 4px', color: '#64748B', textAlign: 'center' }}>Rejected Qty</th>
                            <th style={{ padding: '8px 4px', color: '#64748B' }}>Reason for Rejection</th>
                            <th style={{ padding: '8px 2px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {grnItems.length === 0 ? (
                            <tr>
                              <td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                                No items loaded. Select a Purchase Order to display its line items for receipt entry.
                              </td>
                            </tr>
                          ) : (
                            grnItems.map((item, idx) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                              <td style={{ padding: '10px 4px', color: '#94A3B8', verticalAlign: 'top', paddingTop: '16px' }}>{idx + 1}</td>
                              <td style={{ padding: '10px 4px', fontWeight: '600', color: '#0F172A', minWidth: '280px', verticalAlign: 'top' }}>
                                <input 
                                  type="text" 
                                  value={item.name} 
                                  disabled={isViewOnlyMode}
                                  placeholder="Enter Material / Item Name..."
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = grnItems.map(it => it.id === item.id ? { ...it, name: val } : it);
                                    setGrnItems(updated);
                                  }}
                                  style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 10px', fontSize: '12px', fontWeight: '700', color: '#0F172A', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF' }} 
                                />
                                <div style={{ marginTop: '6px' }}>
                                  <textarea 
                                    value={item.desc || ''} 
                                    disabled={isViewOnlyMode}
                                    placeholder="Enter Item / Material Description..."
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const updated = grnItems.map(it => it.id === item.id ? { ...it, desc: val } : it);
                                      setGrnItems(updated);
                                    }}
                                    style={{ 
                                      width: '100%', 
                                      minHeight: '54px', 
                                      border: '1px solid #CBD5E1', 
                                      borderRadius: '6px', 
                                      padding: '6px 10px', 
                                      fontSize: '11px', 
                                      color: '#334155', 
                                      resize: 'vertical',
                                      boxSizing: 'border-box',
                                      backgroundColor: '#F8FAFC',
                                      lineHeight: '1.4'
                                    }} 
                                  />
                                </div>
                              </td>
                               <td style={{ padding: '10px 4px', textAlign: 'center', verticalAlign: 'top' }}>
                                 <input 
                                   type="text" 
                                   value={item.uom} 
                                   disabled={isViewOnlyMode}
                                   onChange={(e) => {
                                     const val = e.target.value;
                                     const updated = grnItems.map(it => it.id === item.id ? { ...it, uom: val } : it);
                                     setGrnItems(updated);
                                   }}
                                   style={{ width: '50px', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '11px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF' }} 
                                 />
                               </td>
                               <td style={{ padding: '10px 4px', textAlign: 'center', verticalAlign: 'top' }}>
                                 <input 
                                   type="number" 
                                   value={item.ordered} 
                                   disabled={isViewOnlyMode}
                                   onChange={(e) => {
                                     const val = Number(e.target.value);
                                     const updated = grnItems.map(it => it.id === item.id ? { ...it, ordered: val } : it);
                                     setGrnItems(updated);
                                   }}
                                   style={{ width: '55px', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: '600', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF' }} 
                                 />
                               </td>
                               <td style={{ padding: '10px 4px', textAlign: 'center', verticalAlign: 'top' }}>
                                 <input 
                                   type="number" 
                                   value={item.prev} 
                                   disabled={isViewOnlyMode}
                                   onChange={(e) => {
                                     const val = Number(e.target.value);
                                     const updated = grnItems.map(it => it.id === item.id ? { ...it, prev: val } : it);
                                     setGrnItems(updated);
                                   }}
                                   style={{ width: '55px', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '11px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF' }} 
                                 />
                               </td>
                              <td style={{ padding: '10px 4px', textAlign: 'center', verticalAlign: 'top' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <input 
                                    type="number" 
                                    value={item.now} 
                                    disabled={isViewOnlyMode}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const maxAllowed = Math.max(0, item.ordered - item.prev);
                                      const hasErr = val > maxAllowed;
                                      const updated = grnItems.map(it => it.id === item.id ? { 
                                        ...it, 
                                        now: val, 
                                        accepted: val - (it.rejected || 0),
                                        error: hasErr ? `Exceeds remaining PO quantity of ${maxAllowed}` : null
                                      } : it);
                                      setGrnItems(updated);
                                    }}
                                    style={{ 
                                      width: '65px', 
                                      height: '34px', 
                                      border: item.error ? '1.5px solid #DC2626' : '1px solid #CBD5E1', 
                                      borderRadius: '6px', 
                                      textAlign: 'center', 
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      backgroundColor: item.error ? '#FEF2F2' : (isViewOnlyMode ? '#F8FAFC' : '#FFFFFF'),
                                      color: item.error ? '#DC2626' : '#0F172A'
                                    }} 
                                  />
                                  {item.error && (
                                    <span style={{ fontSize: '8px', color: '#DC2626', fontWeight: 'bold', marginTop: '2px', lineHeight: '1' }}>
                                      Max {item.ordered - item.prev}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '10px 4px', textAlign: 'center', verticalAlign: 'top' }}>
                                <input 
                                  type="number" 
                                  value={item.accepted} 
                                  disabled={isViewOnlyMode}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const updated = grnItems.map(it => it.id === item.id ? { ...it, accepted: val, rejected: it.now - val } : it);
                                    setGrnItems(updated);
                                  }}
                                  style={{ width: '55px', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '11px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF' }} 
                                />
                              </td>
                              <td style={{ padding: '10px 4px', textAlign: 'center', verticalAlign: 'top' }}>
                                <input 
                                  type="number" 
                                  value={item.rejected} 
                                  disabled={isViewOnlyMode}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const updated = grnItems.map(it => it.id === item.id ? { ...it, rejected: val, accepted: it.now - val } : it);
                                    setGrnItems(updated);
                                  }}
                                  style={{ width: '55px', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '11px', color: item.rejected > 0 ? '#C5221F' : '#334155', fontWeight: item.rejected > 0 ? 'bold' : 'normal', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF' }} 
                                />
                              </td>
                              <td style={{ padding: '10px 4px', verticalAlign: 'top' }}>
                                <select 
                                  value={item.reason} 
                                  disabled={isViewOnlyMode}
                                  onChange={(e) => {
                                    const updated = grnItems.map(it => it.id === item.id ? { ...it, reason: e.target.value } : it);
                                    setGrnItems(updated);
                                  }}
                                  style={{ height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '11px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF', padding: '0 6px' }}
                                >
                                  <option>—</option>
                                  <option>Damaged</option>
                                  <option>Thread Issue</option>
                                  <option>Wrong Specs</option>
                                </select>
                              </td>
                              <td style={{ padding: '10px 4px', verticalAlign: 'top' }}>
                                <input 
                                  type="text" 
                                  value={item.batch} 
                                  disabled={isViewOnlyMode}
                                  onChange={(e) => {
                                    const updated = grnItems.map(it => it.id === item.id ? { ...it, batch: e.target.value } : it);
                                    setGrnItems(updated);
                                  }}
                                  style={{ width: '90px', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '11px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF' }} 
                                />
                              </td>
                              <td style={{ padding: '10px 2px', textAlign: 'center', verticalAlign: 'top', paddingTop: '14px' }}>
                                {!isViewOnlyMode && (
                                  <button
                                    type="button"
                                    title="Delete Item"
                                    onClick={() => {
                                      setGrnItems(grnItems.filter(it => it.id !== item.id));
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#EF4444',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    <Trash2 style={{ width: '15px', height: '15px' }} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )))}
                          
                        </tbody>
                      </table>
                    </div>

                    {/* Anchored Footer Section with Total Row & Add Button */}
                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <tbody>
                            <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 'bold' }}>
                              <td colSpan="3" style={{ padding: '10px 4px', fontSize: '12px' }}>Total</td>
                              <td style={{ padding: '10px 4px', textAlign: 'center' }}>{totalOrdered}</td>
                              <td style={{ padding: '10px 4px', textAlign: 'center', color: '#64748B' }}>{totalPrev}</td>
                              <td style={{ padding: '10px 4px', textAlign: 'center' }}>{totalNow}</td>
                              <td style={{ padding: '10px 4px', textAlign: 'center', color: '#137333' }}>{totalAccepted}</td>
                              <td style={{ padding: '10px 4px', textAlign: 'center', color: '#C5221F' }}>{totalRejected}</td>
                              <td colSpan="3"></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {!isViewOnlyMode && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              const newItem = {
                                id: `NEW-ITEM-${Date.now()}`,
                                name: 'Additional Material / Item',
                                desc: 'Custom ad-hoc line item',
                                sku: 'SKU-NEW',
                                uom: 'NOS',
                                ordered: 0,
                                prev: 0,
                                now: 1,
                                accepted: 1,
                                rejected: 0,
                                reason: '—',
                                batch: 'LOT-NEW'
                              };
                              setGrnItems([...grnItems, newItem]);
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#2563EB',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            + Add Additional Item
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 4: 4. Quality Inspection (Span 4) */}
                  <div className="section-card" style={{ gridColumn: 'span 4', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <strong style={{ fontSize: '14px', color: '#2563EB' }}>4. Quality Inspection</strong>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Inspection Status *</label>
                      <select defaultValue="" style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B', fontWeight: 'bold' }}>
                        <option value="" disabled>Select Quality Inspection Status</option>
                        <option value="Pending">Pending Inspection</option>
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>

                    {/* Inspection Checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                      {[
                        { label: 'Material Condition', status: 'Pending' },
                        { label: 'Quantity Verification', status: 'Pending' },
                        { label: 'Dimension / Specification Check', status: 'Pending' },
                        { label: 'Coating / Quality Check', status: 'Pending' }
                      ].map((chk, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#475569' }}>{chk.label}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569', fontSize: '10px', fontWeight: 'bold' }}>
                            {chk.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Inspector Name</label>
                      <input 
                        type="text" 
                        value={grnInspectorName}
                        disabled={isViewOnlyMode}
                        placeholder="Enter Inspector Name..." 
                        onChange={(e) => setGrnInspectorName(e.target.value)}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF', color: '#0F172A', fontWeight: '600' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Inspection Remarks</label>
                      <textarea 
                        value={grnInspectionRemarks}
                        disabled={isViewOnlyMode}
                        placeholder="Enter inspection remarks" 
                        onChange={(e) => setGrnInspectionRemarks(e.target.value)}
                        style={{ height: '60px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '8px 12px', fontSize: '12px', resize: 'none', backgroundColor: isViewOnlyMode ? '#F8FAFC' : '#FFFFFF', color: '#334155' }} 
                      />
                    </div>
                  </div>

                  {/* Card 5: 5. Documents (Span 8) */}
                  <div className="section-card" style={{ gridColumn: 'span 8', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#2563EB' }}>
                        5. Documents <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>
                      </strong>
                      <HelpCircle style={{ width: '14px', height: '14px', color: '#94A3B8' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                      {grnDocs.map((doc, idx) => (
                        <div key={idx} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#FFFFFF' }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748B' }}>{doc.title}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText style={{ width: '24px', height: '24px', color: '#10B981' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</span>
                              <span style={{ fontSize: '9px', color: '#94A3B8' }}>{doc.size}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', borderTop: '1px solid #F1F5F9', paddingTop: '6px', justifyContent: 'flex-end' }}>
                            <Eye style={{ width: '14px', height: '14px', color: '#94A3B8', cursor: 'pointer' }} />
                            <Trash2 
                              onClick={() => setGrnDocs(grnDocs.filter((_, i) => i !== idx))}
                              style={{ width: '14px', height: '14px', color: '#94A3B8', cursor: 'pointer' }} 
                            />
                          </div>
                        </div>
                      ))}

                      {/* Upload Box */}
                      <label 
                        style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', backgroundColor: '#F8FAFC', cursor: 'pointer', transition: 'border-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563EB'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
                      >
                        <input 
                          type="file" 
                          multiple 
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              const newDocs = files.map((file, i) => {
                                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                                const names = ['Delivery Challan *', 'Invoice', 'Inspection Report', 'Additional Document'];
                                const title = names[grnDocs.length + i] || `Attachment ${grnDocs.length + i + 1}`;
                                return {
                                  title,
                                  filename: file.name,
                                  size: `${sizeMB} MB`
                                };
                              });
                              setGrnDocs(prev => [...prev, ...newDocs]);
                            }
                          }}
                        />
                        <UploadCloud style={{ width: '20px', height: '20px', color: '#2563EB' }} />
                        <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 'bold' }}>+ Upload File</span>
                        <span style={{ fontSize: '8px', color: '#94A3B8', textAlign: 'center' }}>PDF, JPG, PNG (Max 10MB)</span>
                      </label>
                    </div>
                  </div>

                  {/* Card 6: 6. GRN Summary (Span 4) */}
                  <div className="section-card" style={{ gridColumn: 'span 4', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <strong style={{ fontSize: '14px', color: '#2563EB' }}>6. GRN Summary</strong>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', height: '100%' }}>
                      
                      {/* Summary list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#64748B' }}>Total Items</span>
                          <strong style={{ color: '#334155' }}>{grnItems.length}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#64748B' }}>Total Ordered Qty</span>
                          <strong style={{ color: '#334155' }}>{totalOrdered}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#64748B' }}>Total Received Qty</span>
                          <strong style={{ color: '#334155' }}>{totalNow}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#64748B' }}>Total Accepted Qty</span>
                          <strong style={{ color: '#137333' }}>{totalAccepted}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#64748B' }}>Total Rejected Qty</span>
                          <strong style={{ color: '#C5221F' }}>{totalRejected}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#64748B' }}>Pending Qty</span>
                          <strong style={{ color: '#334155' }}>0</strong>
                        </div>
                      </div>

                      {/* Ready to Receive Panel */}
                      <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#F8FAFC' }}>
                        <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 'bold' }}>GRN Status</span>
                        <strong style={{ fontSize: '12px', color: '#137333' }}>Ready to Receive</strong>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#137333', fontWeight: 'bold' }}>
                            <Check style={{ width: '10px', height: '10px' }} />
                            Items Verified
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#137333', fontWeight: 'bold' }}>
                            <Check style={{ width: '10px', height: '10px' }} />
                            Inspection Completed
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#137333', fontWeight: 'bold' }}>
                            <Check style={{ width: '10px', height: '10px' }} />
                            Documents Uploaded
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            );
          })()}
        </div>
      )}

      {/* ==================== 5. INVOICE MANAGEMENT SCREEN ==================== */}
      {activeTab === 'Invoice Management' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Invoice Ledger (3-Way Matching)</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Match invoices with Purchase Orders and GRNs to ensure accuracy before payment.</span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  defaultValue="01 Jul 2026 – 03 Aug 2026" 
                  style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 36px 0 12px', fontSize: '13px', width: '180px', boxSizing: 'border-box', backgroundColor: '#FFFFFF' }} 
                />
                <Calendar style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '12px' }} />
              </div>
              
              <button 
                onClick={() => onChangeTab('Upload Invoice')}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid #DBEAFE',
                  backgroundColor: '#FFFFFF',
                  color: '#2563EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <UploadCloud style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                Upload Invoice
              </button>
              
              <button style={{
                height: '38px',
                padding: '0 16px',
                borderRadius: '8px',
                border: '1px solid #D1FAE5',
                backgroundColor: '#FFFFFF',
                color: '#065F46',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <FileText style={{ width: '16px', height: '16px', color: '#10B981' }} />
                Export Excel
              </button>
            </div>
          </div>

          {(() => {
            const countAll = invoiceList.length;
            const countReady = invoiceList.filter(i => i.status === 'Ready for Payment').length;
            const countHold = invoiceList.filter(i => i.status === 'On Hold').length;

            const displayList = invoiceList.filter(i => {
              const query = invSearchQuery.toLowerCase();
              const matchesSearch = !invSearchQuery || 
                i.invNo.toLowerCase().includes(query) ||
                i.poNo.toLowerCase().includes(query) ||
                i.vendor.toLowerCase().includes(query) ||
                i.matchStatus.toLowerCase().includes(query);
              const matchesStatus = invStatusFilter === 'All' || i.status === invStatusFilter;
              const matchesTab = invoiceTab === 'All' || i.status === invoiceTab;
              return matchesSearch && matchesStatus && matchesTab;
            });

            return (
              <>
                {/* 1. FILTERS & SEARCH ROW CARD */}
                <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  {/* First row: Search bar + Filters button + Reset */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
                      <input 
                        type="text" 
                        placeholder="Search invoice / vendor / PO / GRN..." 
                        value={invSearchQuery}
                        onChange={(e) => setInvSearchQuery(e.target.value)}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 36px 0 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} 
                      />
                      <Search style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '12px' }} />
                    </div>
                    
                    <button style={{
                      height: '38px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}>
                      <Filter style={{ width: '14px', height: '14px' }} />
                      Filters
                    </button>
                    
                    <button 
                      onClick={() => {
                        setInvSearchQuery('');
                        setInvStatusFilter('All');
                        setInvoiceTab('All');
                      }}
                      style={{
                        height: '38px',
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Reset
                    </button>
                  </div>

                  {/* Dropdown Filters Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                    {[
                      { label: 'Vendor', options: ['All Vendors', 'ABC Metals Pvt Ltd', 'XYZ Solar Pvt Ltd', 'Steel Authority Ltd'] },
                      { label: 'PO Reference', options: ['All POs', 'PO-2451', 'PO-2455', 'PO-2460'] },
                      { label: 'GRN Reference', options: ['All GRNs', 'GRN-1820', 'GRN-1824', 'GRN-1829'] },
                      { label: 'Match Status', options: ['All Statuses', 'Matched', 'Review', 'Mismatch'] },
                      { label: 'Payment Status', options: ['All Payments', 'Ready', 'Hold', 'Blocked'] },
                      { label: 'Amount Range', options: ['All Amounts', 'Under ₹1L', '₹1L - ₹5L', 'Above ₹5L'] }
                    ].map((filter, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>{filter.label}</label>
                        <select style={{ height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '11px', backgroundColor: '#FFFFFF', color: '#475569' }}>
                          {filter.options.map((opt, oIdx) => <option key={oIdx}>{opt}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. STATUS TABS ROW */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '20px', padding: '4px 0', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {[
                    { id: 'All', label: 'All Invoices', count: countAll, bg: '#e2e8f0', fg: '#475569' },
                    { id: 'Ready for Payment', label: 'Ready for Payment', count: countReady, bg: '#dcfce7', fg: '#166534' },
                    { id: 'On Hold', label: 'On Hold', count: countHold, bg: '#fee2e2', fg: '#991b1b' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setInvoiceTab(tab.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: '10px 4px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: invoiceTab === tab.id ? '#2563eb' : '#64748b',
                        borderBottom: invoiceTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
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

                    {/* 2. MAIN LAYOUT: FULL-WIDTH TABLE & DRAWER PANEL */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                      
                      {/* Invoice Ledger List Card (Full Width) */}
                      <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <strong style={{ fontSize: '14px', color: '#0F172A' }}>Invoice Ledger List (248)</strong>
                        
                        <div style={{ overflowX: 'auto' }}>
                          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '950px !important' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ padding: '8px 6px', textAlign: 'left' }}>Invoice No.</th>
                                <th style={{ padding: '8px 6px', textAlign: 'left' }}>Invoice Date</th>
                                <th style={{ padding: '8px 6px', textAlign: 'left' }}>Vendor</th>
                                <th style={{ padding: '8px 6px', textAlign: 'left' }}>PO No.</th>
                                <th style={{ padding: '8px 6px', textAlign: 'left' }}>GRN No.</th>
                                <th style={{ padding: '8px 6px', textAlign: 'right' }}>Invoice Amount (₹)</th>
                                <th style={{ padding: '8px 6px', textAlign: 'right' }}>PO Value (₹)</th>
                                <th style={{ padding: '8px 6px', textAlign: 'right' }}>GRN Value (₹)</th>
                                <th style={{ padding: '8px 6px', textAlign: 'right' }}>Difference (₹)</th>
                                <th style={{ padding: '8px 6px', textAlign: 'center' }}>Match Status</th>
                                <th style={{ padding: '8px 6px', textAlign: 'center' }}>Payment Status</th>
                                <th style={{ padding: '8px 6px', textAlign: 'center', width: '80px' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoicesList.map((row) => {
                                const isSelected = selectedInvoice === row.invNo;
                                return (
                                  <tr 
                                    key={row.invNo} 
                                    onClick={() => { setSelectedInvoice(row.invNo); setShowDrawer(true); }}
                                    style={{ 
                                      borderBottom: '1px solid #F1F5F9',
                                      cursor: 'pointer',
                                      backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                      transition: 'background-color 0.15s ease'
                                    }}
                                  >
                                    <td style={{ padding: '10px 6px', fontWeight: 'bold', color: '#2563EB' }}>{row.invNo}</td>
                                    <td style={{ padding: '10px 6px', color: '#475569' }}>{row.date}</td>
                                    <td style={{ padding: '10px 6px', fontWeight: '600', color: '#1E293B' }}>{row.vendor}</td>
                                    <td style={{ padding: '10px 6px', color: '#2563EB', fontWeight: '600' }}>{row.poNo}</td>
                                    <td style={{ padding: '10px 6px', color: '#475569' }}>{row.grnNo}</td>
                                    <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: '600', color: '#1E293B' }}>{row.invAmt}</td>
                                    <td style={{ padding: '10px 6px', textAlign: 'right', color: '#475569' }}>{row.poVal}</td>
                                    <td style={{ padding: '10px 6px', textAlign: 'right', color: '#475569' }}>{row.grnVal}</td>
                                    <td style={{ 
                                      padding: '10px 6px', 
                                      textAlign: 'right', 
                                      fontWeight: 'bold',
                                      color: row.diff === '0.00' ? '#64748B' : (row.match === 'Review' ? '#D97706' : '#EF4444')
                                    }}>{row.diff}</td>
                                    <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                      <span style={{
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        backgroundColor: row.match === 'Matched' ? '#DCFCE7' : (row.match === 'Review' ? '#FEF3C7' : '#FEE2E2'),
                                        color: row.match === 'Matched' ? '#166534' : (row.match === 'Review' ? '#B45309' : '#991B1B')
                                      }}>{row.match}</span>
                                    </td>
                                    <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                      <span style={{
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        backgroundColor: row.pay === 'Ready' ? '#DCFCE7' : (row.pay === 'Hold' ? '#DBEAFE' : '#FEE2E2'),
                                        color: row.pay === 'Ready' ? '#166534' : (row.pay === 'Hold' ? '#1E40AF' : '#991B1B')
                                      }}>{row.pay}</span>
                                    </td>
                                    <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation();
                                            setSelectedInvoice(row.invNo); 
                                            setShowDrawer(true); 
                                          }}
                                          style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid #2563EB',
                                            backgroundColor: isSelected ? '#2563EB' : '#EFF6FF',
                                            color: isSelected ? '#FFFFFF' : '#2563EB',
                                            fontWeight: 'bold',
                                            fontSize: '10px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.15s ease'
                                          }}
                                        >
                                          <span>View</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination block */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>Showing 1 to 10 of 248 entries</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}>
                                <ChevronLeft style={{ width: '12px', height: '12px' }} />
                              </button>
                              {[1, 2, 3, 4].map((page, pIdx) => (
                                <button key={pIdx} style={{ 
                                  width: '28px', 
                                  height: '28px', 
                                  border: '1px solid #E2E8F0', 
                                  borderRadius: '6px', 
                                  backgroundColor: page === 1 ? '#2563EB' : '#FFFFFF', 
                                  color: page === 1 ? '#FFFFFF' : '#475569', 
                                  fontSize: '11px', 
                                  fontWeight: 'bold', 
                                  cursor: 'pointer' 
                                }}>
                                  {page}
                                </button>
                              ))}
                              <button style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}>
                                <ChevronRight style={{ width: '12px', height: '12px' }} />
                              </button>
                            </div>
                            <select style={{ height: '28px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 6px', fontSize: '11px', backgroundColor: '#FFFFFF', color: '#475569' }}>
                              <option>10 / page</option>
                            </select>
                          </div>
                        </div>

                      </div>

                      {/* Match Status Legend */}
                      <div className="section-card" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <strong style={{ fontSize: '12px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Match Status Legend</strong>
                        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', fontSize: '11px' }}>
                          {[
                            { color: '#16A34A', label: 'Matched', desc: 'PO, GRN & Invoice match' },
                            { color: '#D97706', label: 'Review', desc: 'Minor difference found' },
                            { color: '#EF4444', label: 'Mismatch', desc: 'Major difference found' },
                            { color: '#94A3B8', label: 'Incomplete', desc: 'Missing PO or GRN' }
                          ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                              <strong style={{ color: '#1E293B' }}>{item.label}</strong>
                              <span style={{ color: '#64748B' }}>{item.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* COLLAPSIBLE SLIDE-OVER DRAWER */}
                      {showDrawer && (() => {
                        const invoiceData = {
                          'INV-1042': {
                            vendor: 'ABC Metals Pvt Ltd',
                            date: '02 Aug 2026',
                            dueDate: '17 Aug 2026',
                            status: 'Ready for Payment',
                            statusColor: '#16A34A',
                            statusBg: '#DCFCE7',
                            poNo: 'PO-2451',
                            grnNo: 'GRN-1820',
                            poVal: '₹ 4,85,000.00',
                            grnVal: '₹ 4,85,000.00',
                            invVal: '₹ 4,85,000.00',
                            diff: '₹ 0.00',
                            bannerText: '3-WAY MATCH PASSED',
                            bannerBg: '#F0FDF4',
                            bannerBorder: '#DCFCE7',
                            bannerColor: '#16A34A',
                            bannerDesc: 'PO, GRN & Invoice match perfectly.',
                            hasCheck1: true,
                            hasCheck2: true,
                            hasCheck3: true,
                            poItems: [
                              { name: 'Aluminium Rail 4.2m', qty: '500 Nos', rate: '800.00', amt: '4,00,000.00' },
                              { name: 'Mid Clamp', qty: '500 Nos', rate: '170.00', amt: '85,000.00' }
                            ],
                            grnItems: [
                              { name: 'Aluminium Rail 4.2m', qty: '500 Nos', accepted: '500 Nos', rate: '800.00', amt: '4,00,000.00' },
                              { name: 'Mid Clamp', qty: '500 Nos', accepted: '500 Nos', rate: '170.00', amt: '85,000.00' }
                            ],
                            invItems: [
                              { name: 'Aluminium Rail 4.2m', qty: '500 Nos', rate: '800.00', amt: '4,00,000.00' },
                              { name: 'Mid Clamp', qty: '500 Nos', rate: '170.00', amt: '85,000.00' }
                            ]
                          },
                          'INV-1043': {
                            vendor: 'XYZ Solar Pvt Ltd',
                            date: '02 Aug 2026',
                            dueDate: '17 Aug 2026',
                            status: 'On Hold (Review)',
                            statusColor: '#D97706',
                            statusBg: '#FEF3C7',
                            poNo: 'PO-2455',
                            grnNo: 'GRN-1824',
                            poVal: '₹ 2,30,000.00',
                            grnVal: '₹ 2,30,000.00',
                            invVal: '₹ 2,40,000.00',
                            diff: '₹ 10,000.00',
                            bannerText: 'QUANTITY VARIANCE FOUND (HOLD)',
                            bannerBg: '#FFFBEB',
                            bannerBorder: '#FEF3C7',
                            bannerColor: '#D97706',
                            bannerDesc: 'Invoice quantity is higher than ordered/received quantity.',
                            hasCheck1: true,
                            hasCheck2: true,
                            hasCheck3: false,
                            poItems: [
                              { name: 'Aluminium Rail 4.2m', qty: '200 Nos', rate: '800.00', amt: '1,60,000.00' },
                              { name: 'Mid Clamp', qty: '411 Nos', rate: '170.00', amt: '70,000.00' }
                            ],
                            grnItems: [
                              { name: 'Aluminium Rail 4.2m', qty: '200 Nos', accepted: '200 Nos', rate: '800.00', amt: '1,60,000.00' },
                              { name: 'Mid Clamp', qty: '411 Nos', accepted: '411 Nos', rate: '170.00', amt: '70,000.00' }
                            ],
                            invItems: [
                              { name: 'Aluminium Rail 4.2m', qty: '200 Nos', rate: '800.00', amt: '1,60,000.00' },
                              { name: 'Mid Clamp', qty: '470 Nos', rate: '170.00', amt: '80,000.00' }
                            ]
                          },
                          'INV-1044': {
                            vendor: 'Steel Authority Ltd',
                            date: '01 Aug 2026',
                            dueDate: '16 Aug 2026',
                            status: 'Blocked (Mismatch)',
                            statusColor: '#EF4444',
                            statusBg: '#FEE2E2',
                            poNo: 'PO-2460',
                            grnNo: 'GRN-1829',
                            poVal: '₹ 8,00,000.00',
                            grnVal: '₹ 7,50,000.00',
                            invVal: '₹ 8,20,000.00',
                            diff: '₹ 70,000.00',
                            bannerText: '3-WAY MATCH MISMATCH (BLOCKED)',
                            bannerBg: '#FEF2F2',
                            bannerBorder: '#FEE2E2',
                            bannerColor: '#EF4444',
                            bannerDesc: 'Price & quantity variance detected across PO, GRN, and Invoice.',
                            hasCheck1: true,
                            hasCheck2: false,
                            hasCheck3: false,
                            poItems: [
                              { name: 'Steel Rods 12mm', qty: '10 Tons', rate: '80,000.00', amt: '8,00,000.00' }
                            ],
                            grnItems: [
                              { name: 'Steel Rods 12mm', qty: '10 Tons', accepted: '9.38 Tons', rate: '80,000.00', amt: '7,50,000.00' }
                            ],
                            invItems: [
                              { name: 'Steel Rods 12mm', qty: '10.25 Tons', rate: '80,000.00', amt: '8,20,000.00' }
                            ]
                          }
                        };

                        const det = invoiceData[selectedInvoice] || invoiceData['INV-1042'];

                        return (
                          <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(15, 23, 42, 0.3)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9999,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            animation: 'fadeIn 0.2s ease-out'
                          }} onClick={() => setShowDrawer(false)}>
                            
                            {/* Drawer Panel */}
                            <div style={{
                              width: '580px',
                              height: '100%',
                              backgroundColor: '#FFFFFF',
                              boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.08)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '20px',
                              padding: '24px',
                              boxSizing: 'border-box',
                              overflowY: 'auto',
                              animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }} onClick={(e) => e.stopPropagation()}>
                              
                              {/* Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>Invoice Details</strong>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    backgroundColor: det.statusBg,
                                    color: det.statusColor
                                  }}>{det.status}</span>
                                </div>
                                <button 
                                  onClick={() => setShowDrawer(false)}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                                >
                                  <XCircle style={{ width: '22px', height: '22px', color: '#94A3B8' }} />
                                </button>
                              </div>

                              {/* Fields Grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', fontSize: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                                <div>
                                  <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Invoice No.</div>
                                  <strong style={{ color: '#0F172A' }}>{selectedInvoice}</strong>
                                </div>
                                <div>
                                  <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Invoice Amount</div>
                                  <strong style={{ color: '#0F172A', fontSize: '14px' }}>{det.invVal}</strong>
                                </div>
                                <div>
                                  <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Invoice Date</div>
                                  <strong style={{ color: '#475569' }}>{det.date}</strong>
                                </div>
                                <div>
                                  <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Due Date</div>
                                  <strong style={{ color: '#475569' }}>{det.dueDate}</strong>
                                </div>
                                <div>
                                  <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Vendor</div>
                                  <strong style={{ color: '#475569' }}>{det.vendor}</strong>
                                </div>
                                <div>
                                  <div style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Status</div>
                                  <strong style={{ color: det.statusColor }}>{det.status}</strong>
                                </div>
                              </div>

                              {/* Tabs */}
                              <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', gap: '16px', fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>
                                <span style={{ color: '#2563EB', borderBottom: '2px solid #2563EB', paddingBottom: '8px', cursor: 'pointer' }}>3-Way Matching</span>
                                <span style={{ paddingBottom: '8px', cursor: 'pointer' }}>Invoice Info</span>
                                <span style={{ paddingBottom: '8px', cursor: 'pointer' }}>Documents</span>
                                <span style={{ paddingBottom: '8px', cursor: 'pointer' }}>Notes</span>
                                <span style={{ paddingBottom: '8px', cursor: 'pointer' }}>History</span>
                              </div>

                              {/* Matching Cards with Connective Checkmarks */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                
                                {/* Connecting Line background */}
                                <div style={{ position: 'absolute', right: '14px', top: '20px', bottom: '20px', width: '2px', backgroundColor: '#E2E8F0', zIndex: 0 }} />

                                {/* Card 1: PO */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                                  <div className="section-card" style={{ flex: 1, padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                                      <span style={{ fontWeight: 'bold', color: '#2563EB' }}>1. Purchase Order ({det.poNo})</span>
                                      <strong style={{ color: '#475569' }}>PO Value: {det.poVal}</strong>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                      <thead>
                                        <tr style={{ color: '#64748B' }}>
                                          <th style={{ padding: '2px 0' }}>Item</th>
                                          <th style={{ padding: '2px 0', textAlign: 'center' }}>Ordered Qty</th>
                                          <th style={{ padding: '2px 0', textAlign: 'right' }}>Rate (₹)</th>
                                          <th style={{ padding: '2px 0', textAlign: 'right' }}>Amount (₹)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {det.poItems.map((item, idx) => (
                                          <tr key={idx}>
                                            <td style={{ padding: '2px 0', fontWeight: '500' }}>{item.name}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'center' }}>{item.qty}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.rate}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.amt}</td>
                                          </tr>
                                        ))}
                                        <tr style={{ borderTop: '1px solid #F1F5F9', fontWeight: 'bold' }}>
                                          <td style={{ padding: '4px 0' }}>Total</td>
                                          <td></td>
                                          <td></td>
                                          <td style={{ textAlign: 'right' }}>{det.poVal}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: det.hasCheck1 ? '#16A34A' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                                      {det.hasCheck1 ? <Check style={{ width: '12px', height: '12px' }} /> : <span style={{ fontSize: '10px', fontWeight: 'bold' }}>!</span>}
                                    </span>
                                  </div>
                                </div>

                                {/* Card 2: GRN */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                                  <div className="section-card" style={{ flex: 1, padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                                      <span style={{ fontWeight: 'bold', color: '#16A34A' }}>2. Goods Receipt Note ({det.grnNo})</span>
                                      <strong style={{ color: '#475569' }}>GRN Value: {det.grnVal}</strong>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                      <thead>
                                        <tr style={{ color: '#64748B' }}>
                                          <th style={{ padding: '2px 0' }}>Item</th>
                                          <th style={{ padding: '2px 0', textAlign: 'center' }}>Received Qty</th>
                                          <th style={{ padding: '2px 0', textAlign: 'center' }}>Accepted Qty</th>
                                          <th style={{ padding: '2px 0', textAlign: 'right' }}>Rate (₹)</th>
                                          <th style={{ padding: '2px 0', textAlign: 'right' }}>Value (₹)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {det.grnItems.map((item, idx) => (
                                          <tr key={idx}>
                                            <td style={{ padding: '2px 0', fontWeight: '500' }}>{item.name}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'center' }}>{item.qty}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'center' }}>{item.accepted}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.rate}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.amt}</td>
                                          </tr>
                                        ))}
                                        <tr style={{ borderTop: '1px solid #F1F5F9', fontWeight: 'bold' }}>
                                          <td style={{ padding: '4px 0' }}>Total</td>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                          <td style={{ textAlign: 'right' }}>{det.grnVal}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: det.hasCheck2 ? '#16A34A' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                                      {det.hasCheck2 ? <Check style={{ width: '12px', height: '12px' }} /> : <span style={{ fontSize: '10px', fontWeight: 'bold' }}>!</span>}
                                    </span>
                                  </div>
                                </div>

                                {/* Card 3: Invoice */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                                  <div className="section-card" style={{ flex: 1, padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                                      <span style={{ fontWeight: 'bold', color: '#6b21a8' }}>3. Vendor Invoice ({selectedInvoice})</span>
                                      <strong style={{ color: '#475569' }}>Invoice Value: {det.invVal}</strong>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                      <thead>
                                        <tr style={{ color: '#64748B' }}>
                                          <th style={{ padding: '2px 0' }}>Item</th>
                                          <th style={{ padding: '2px 0', textAlign: 'center' }}>Invoiced Qty</th>
                                          <th style={{ padding: '2px 0', textAlign: 'right' }}>Rate (₹)</th>
                                          <th style={{ padding: '2px 0', textAlign: 'right' }}>Amount (₹)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {det.invItems.map((item, idx) => (
                                          <tr key={idx}>
                                            <td style={{ padding: '2px 0', fontWeight: '500' }}>{item.name}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'center' }}>{item.qty}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.rate}</td>
                                            <td style={{ padding: '2px 0', textAlign: 'right' }}>{item.amt}</td>
                                          </tr>
                                        ))}
                                        <tr style={{ borderTop: '1px solid #F1F5F9', fontWeight: 'bold' }}>
                                          <td style={{ padding: '4px 0' }}>Total</td>
                                          <td></td>
                                          <td></td>
                                          <td style={{ textAlign: 'right' }}>{det.invVal}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: det.hasCheck3 ? '#16A34A' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                                      {det.hasCheck3 ? <Check style={{ width: '12px', height: '12px' }} /> : <span style={{ fontSize: '10px', fontWeight: 'bold' }}>!</span>}
                                    </span>
                                  </div>
                                </div>

                              </div>

                              {/* 3-Way Match Dynamic Card */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: det.bannerBg, borderRadius: '8px', padding: '12px', border: `1px solid ${det.bannerBorder}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: det.bannerColor, fontWeight: 'bold', fontSize: '11px' }}>
                                  {det.status === 'Ready for Payment' ? <CheckCircle style={{ width: '14px', height: '14px' }} /> : <XCircle style={{ width: '14px', height: '14px' }} />}
                                  <span>{det.bannerText}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px' }}>
                                  {det.bannerDesc}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '10px', color: det.bannerColor, flexWrap: 'wrap' }}>
                                  <div style={{ backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${det.bannerBorder}` }}>
                                    PO: <strong style={{ marginLeft: '4px' }}>{det.poVal}</strong>
                                  </div>
                                  <span>|</span>
                                  <div style={{ backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${det.bannerBorder}` }}>
                                    GRN: <strong style={{ marginLeft: '4px' }}>{det.grnVal}</strong>
                                  </div>
                                  <span>|</span>
                                  <div style={{ backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${det.bannerBorder}` }}>
                                    Invoice: <strong style={{ marginLeft: '4px' }}>{det.invVal}</strong>
                                  </div>
                                  <span style={{ margin: '0 4px' }}>|</span>
                                  <div style={{ backgroundColor: det.statusBg, padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                    Diff: <strong style={{ marginLeft: '4px' }}>{det.diff}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                <button style={{
                                  flex: 1,
                                  height: '38px',
                                  borderRadius: '8px',
                                  border: '1px solid #DBEAFE',
                                  backgroundColor: '#FFFFFF',
                                  color: '#2563EB',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}>
                                  View Documents
                                </button>
                                <button style={{
                                  flex: 1,
                                  height: '38px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  backgroundColor: '#2563EB',
                                  color: '#FFFFFF',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}>
                                  Send for Approval
                                </button>
                                {det.status === 'Ready for Payment' ? (
                                  <button style={{
                                    flex: 1,
                                    height: '38px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#16A34A',
                                    color: '#FFFFFF',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}>
                                    Approve Payment
                                  </button>
                                ) : (
                                  <button style={{
                                    flex: 1,
                                    height: '38px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#EF4444',
                                    color: '#FFFFFF',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}>
                                    Reject & Re-route
                                  </button>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })()}

                      </div>
                    </>
                  );
            })()}
          </div>
        )}

      {/* ==================== 6. PAYMENTS SCREEN ==================== */}

      {activeTab === 'Upload Invoice' && (
                          /* ==================== UPLOAD VENDOR INVOICE VIEW ==================== */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Header / Top bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Upload Vendor Invoice</h2>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Upload invoice and link with PO and GRN to perform 3-way matching</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={() => onChangeTab('Invoice Management')}
                          style={{
                            height: '38px',
                            padding: '0 20px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            color: '#475569',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => onChangeTab('Invoice Management')}
                          style={{
                            height: '38px',
                            padding: '0 20px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            color: '#2563EB',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Save Draft
                        </button>
                        <button 
                          onClick={() => {
                            onChangeTab('Invoice Management');
                            setSelectedInvoice('INV-1042');
                            setShowDrawer(true);
                          }}
                          style={{
                            height: '38px',
                            padding: '0 20px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Upload & Match
                        </button>
                      </div>
                    </div>

                    {/* Main content grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
                      
                      {/* Left Column (Forms & Details) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* Section 1: Upload Invoice */}
                        <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <strong style={{ fontSize: '12px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Upload Invoice</strong>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            
                            {/* Drag & Drop Box */}
                            <div style={{
                              border: '2px dashed #3B82F6',
                              borderRadius: '8px',
                              backgroundColor: '#EFF6FF',
                              padding: '24px',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px'
                            }}>
                              <UploadCloud style={{ width: '28px', height: '28px', color: '#3B82F6' }} />
                              <span style={{ fontSize: '12px', color: '#1E293B', fontWeight: '500' }}>Drag & Drop invoice here or</span>
                              <button style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#FFFFFF',
                                color: '#2563EB',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}>Browse Files</button>
                              <span style={{ fontSize: '10px', color: '#64748B' }}>PDF, JPG, PNG • Max 10 MB</span>
                            </div>

                            {/* Uploaded File Item */}
                            <div style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              backgroundColor: '#FFFFFF',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              gap: '12px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#16A34A', fontWeight: 'bold' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                                <span>Invoice uploaded</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
                                <FileText style={{ width: '20px', height: '20px', color: '#2563EB' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E293B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>ABC_Metals_Invoice_INV-1042.pdf</div>
                                  <div style={{ fontSize: '10px', color: '#64748B' }}>1.24 MB</div>
                                </div>
                                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
                                  <Trash2 style={{ width: '16px', height: '16px' }} />
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Section 2: Invoice Information */}
                        <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '12px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Information (Extracted by AI)</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                backgroundColor: '#DCFCE7',
                                color: '#166534',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>AI Extraction Complete</span>
                              </span>
                              <button style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#FFFFFF',
                                color: '#475569',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}>Re-extract</button>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Invoice Number *</label>
                              <input type="text" defaultValue="INV-1042" style={{ height: '36px', padding: '0 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Invoice Date *</label>
                              <input type="text" defaultValue="03 Aug 2026" style={{ height: '36px', padding: '0 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Vendor *</label>
                              <select style={{ height: '36px', padding: '0 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', backgroundColor: '#FFFFFF' }}>
                                <option>ABC Metals Pvt Ltd</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Invoice Amount *</label>
                              <input type="text" defaultValue="₹ 4,85,000.00" style={{ height: '36px', padding: '0 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>GSTIN</label>
                              <input type="text" defaultValue="37AABCA1234B1Z5" style={{ height: '36px', padding: '0 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Due Date</label>
                              <input type="text" defaultValue="17 Aug 2026" style={{ height: '36px', padding: '0 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Link Documents for Matching */}
                        <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <strong style={{ fontSize: '12px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Link Documents for Matching</strong>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'stretch' }}>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Purchase Order *</label>
                              <select style={{ height: '36px', padding: '0 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', backgroundColor: '#FFFFFF' }}>
                                <option>PO-2451</option>
                              </select>
                              <span style={{ fontSize: '10px', color: '#64748B' }}>PO Date: 28 Jul 2026 | PO Value: ₹ 4,85,000.00</span>
                              <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check style={{ width: '10px', height: '10px' }} /> PO found
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Goods Receipt Note *</label>
                              <select style={{ height: '36px', padding: '0 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', backgroundColor: '#FFFFFF' }}>
                                <option>GRN-1820</option>
                              </select>
                              <span style={{ fontSize: '10px', color: '#64748B' }}>GRN Date: 31 Jul 2026 | GRN Value: ₹ 4,85,000.00</span>
                              <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check style={{ width: '10px', height: '10px' }} /> GRN found
                              </span>
                            </div>

                            {/* How it works info box */}
                            <div style={{
                              backgroundColor: '#F8FAFC',
                              borderRadius: '8px',
                              border: '1px solid #E2E8F0',
                              padding: '12px',
                              fontSize: '11px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <strong style={{ color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Info style={{ width: '14px', height: '14px', color: '#2563EB' }} /> How it works
                              </strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#475569' }}>
                                <div>1. PO &rarr; What we ordered</div>
                                <div>2. GRN &rarr; What we received</div>
                                <div>3. Invoice &rarr; What vendor billed</div>
                              </div>
                              <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: 'bold', marginTop: '2px' }}>System will match all 3 for accuracy.</span>
                            </div>

                          </div>
                        </div>

                        {/* Section 4: Invoice Items Preview */}
                        <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <strong style={{ fontSize: '12px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Items Preview (Extracted)</strong>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', backgroundColor: '#F8FAFC' }}>
                                <th style={{ padding: '8px 10px' }}>#</th>
                                <th style={{ padding: '8px 10px' }}>Item Description</th>
                                <th style={{ padding: '8px 10px' }}>HSN / SAC</th>
                                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Unit</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (₹)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (₹)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'center' }}>GST (%)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>GST Amt (₹)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '8px 10px' }}>1</td>
                                <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>Aluminium Rail 4.2m</td>
                                <td style={{ padding: '8px 10px' }}>76109090</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>500</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>Nos</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>800.00</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>4,00,000.00</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>18%</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>72,000.00</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>4,72,000.00</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '8px 10px' }}>2</td>
                                <td style={{ padding: '8px 10px', fontWeight: 'bold' }}>Mid Clamp</td>
                                <td style={{ padding: '8px 10px' }}>73269099</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>500</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>Nos</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>170.00</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>85,000.00</td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>16%</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>15,300.00</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>1,00,300.00</td>
                              </tr>
                              <tr style={{ fontWeight: 'bold', backgroundColor: '#F8FAFC' }}>
                                <td colSpan="6" style={{ padding: '8px 10px', textAlign: 'right' }}>Total (Before Tax)</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>4,85,000.00</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>Total GST</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>87,300.00</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#2563EB' }}>₹ 5,72,300.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Notes & Attachments row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div className="section-card" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <strong style={{ fontSize: '11px', color: '#475569' }}>Notes</strong>
                            <textarea
                              defaultValue="Payment terms as per agreement."
                              style={{
                                height: '60px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                padding: '8px',
                                fontSize: '12px',
                                boxSizing: 'border-box',
                                resize: 'none'
                              }}
                            />
                          </div>
                          <div className="section-card" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <strong style={{ fontSize: '11px', color: '#475569' }}>Attachments (Optional)</strong>
                            <button style={{
                              height: '36px',
                              borderRadius: '6px',
                              border: '1px dashed #3B82F6',
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}>
                              <span>+ Add Attachment</span>
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Right Column (Live Document extracted preview & 3-Way Match Preview) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* INVOICE PREVIEW (Extracted Document Rendering) */}
                        <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '12px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Preview (Extracted)</strong>
                            <Maximize2 style={{ width: '14px', height: '14px', color: '#64748B', cursor: 'pointer' }} />
                          </div>

                          {/* Paper Mockup box */}
                          <div style={{
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            padding: '16px',
                            fontSize: '10px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <strong style={{ fontSize: '12px', color: '#0F172A' }}>ABC METALS PVT LTD</strong>
                                <div style={{ color: '#64748B', marginTop: '2px' }}>GSTIN: 37AABCA1234B1Z5</div>
                                <div style={{ color: '#64748B' }}>#12, Industrial Area, Coimbatore - 641 021</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <strong style={{ fontSize: '11px', color: '#0F172A' }}>TAX INVOICE</strong>
                                <div style={{ color: '#64748B', marginTop: '2px' }}>Invoice No: <strong>INV-1042</strong></div>
                                <div style={{ color: '#64748B' }}>Invoice Date: 03 Aug 2026</div>
                                <div style={{ color: '#64748B' }}>Due Date: 17 Aug 2026</div>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', padding: '8px 0' }}>
                              <div>
                                <div style={{ color: '#64748B', fontWeight: 'bold' }}>Bill To</div>
                                <strong style={{ color: '#1E293B', display: 'block', marginTop: '2px' }}>VRM Structures Pvt Ltd</strong>
                                <div style={{ color: '#64748B' }}>Nellore - 524002</div>
                                <div style={{ color: '#64748B' }}>GSTIN: 37AAFCV0146D1Z1</div>
                              </div>
                              <div style={{ backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                <div style={{ color: '#64748B', fontWeight: 'bold' }}>Total Amount</div>
                                <strong style={{ fontSize: '14px', color: '#2563EB', display: 'block', margin: '4px 0' }}>₹ 5,72,300.00</strong>
                                <span style={{ fontSize: '8px', color: '#64748B' }}>(Rupees Five Lakh Seventy Two Thousand Three Hundred Only)</span>
                              </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '9px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                                  <th style={{ padding: '4px 0' }}>#</th>
                                  <th style={{ padding: '4px 0' }}>Item Description</th>
                                  <th style={{ padding: '4px 0' }}>HSN/SAC</th>
                                  <th style={{ padding: '4px 0', textAlign: 'center' }}>Qty</th>
                                  <th style={{ padding: '4px 0', textAlign: 'right' }}>Rate (₹)</th>
                                  <th style={{ padding: '4px 0', textAlign: 'right' }}>Amount (₹)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '4px 0' }}>1</td>
                                  <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Aluminium Rail 4.2m</td>
                                  <td style={{ padding: '4px 0' }}>76109090</td>
                                  <td style={{ padding: '4px 0', textAlign: 'center' }}>500</td>
                                  <td style={{ padding: '4px 0', textAlign: 'right' }}>800.00</td>
                                  <td style={{ padding: '4px 0', textAlign: 'right' }}>4,00,000.00</td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '4px 0' }}>2</td>
                                  <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Mid Clamp</td>
                                  <td style={{ padding: '4px 0' }}>73269099</td>
                                  <td style={{ padding: '4px 0', textAlign: 'center' }}>500</td>
                                  <td style={{ padding: '4px 0', textAlign: 'right' }}>170.00</td>
                                  <td style={{ padding: '4px 0', textAlign: 'right' }}>85,000.00</td>
                                </tr>
                                <tr style={{ borderTop: '1px solid #F1F5F9' }}>
                                  <td colSpan="5" style={{ padding: '4px 0', textAlign: 'right' }}>Subtotal</td>
                                  <td style={{ padding: '4px 0', textAlign: 'right' }}>4,85,000.00</td>
                                </tr>
                                <tr>
                                  <td colSpan="5" style={{ padding: '4px 0', textAlign: 'right' }}>CGST (9%)</td>
                                  <td style={{ padding: '4px 0', textAlign: 'right' }}>43,650.00</td>
                                </tr>
                                <tr>
                                  <td colSpan="5" style={{ padding: '4px 0', textAlign: 'right' }}>SGST (9%)</td>
                                  <td style={{ padding: '4px 0', textAlign: 'right' }}>43,650.00</td>
                                </tr>
                                <tr style={{ fontWeight: 'bold', borderTop: '1px solid #E2E8F0' }}>
                                  <td colSpan="5" style={{ padding: '4px 0', textAlign: 'right' }}>Total Amount</td>
                                  <td style={{ padding: '4px 0', textAlign: 'right', color: '#2563EB' }}>₹ 5,72,300.00</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Preview controls */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px', fontSize: '11px', color: '#475569' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span>1 / 2</span>
                              <span style={{ cursor: 'pointer' }}>Zoom 100%</span>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Download style={{ width: '14px', height: '14px' }} /> Download
                              </span>
                              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Printer style={{ width: '14px', height: '14px' }} /> Print
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* 3-WAY MATCH PREVIEW */}
                        <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <strong style={{ fontSize: '12px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3-Way Match Preview</strong>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            
                            {/* PO Value box */}
                            <div style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '12px',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>PO (PO-2451)</span>
                              <span style={{ fontSize: '10px', color: '#475569' }}>PO Value</span>
                              <strong style={{ fontSize: '12px', color: '#2563EB' }}>₹ 4,85,000.00</strong>
                              <span style={{ margin: '4px auto 0 auto', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                            </div>

                            {/* GRN Value box */}
                            <div style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '12px',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: 'bold' }}>GRN (GRN-1820)</span>
                              <span style={{ fontSize: '10px', color: '#475569' }}>GRN Value</span>
                              <strong style={{ fontSize: '12px', color: '#16A34A' }}>₹ 4,85,000.00</strong>
                              <span style={{ margin: '4px auto 0 auto', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                            </div>

                            {/* Invoice Value box */}
                            <div style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '12px',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <span style={{ fontSize: '10px', color: '#6b21a8', fontWeight: 'bold' }}>Invoice (INV-1042)</span>
                              <span style={{ fontSize: '10px', color: '#475569' }}>Invoice Value</span>
                              <strong style={{ fontSize: '12px', color: '#6b21a8' }}>₹ 4,85,000.00</strong>
                              <span style={{ margin: '4px auto 0 auto', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                            </div>

                          </div>

                          {/* Match banner */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: '8px', padding: '12px', border: '1px solid #DCFCE7' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#16A34A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                              <div>
                                <strong style={{ fontSize: '11px', color: '#16A34A', display: 'block' }}>3-WAY MATCH PASSED</strong>
                                <span style={{ fontSize: '10px', color: '#15803D' }}>All values are matched</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '9px', color: '#15803D', display: 'block' }}>Difference</span>
                              <strong style={{ fontSize: '12px', color: '#16A34A' }}>₹ 0.00</strong>
                            </div>
                          </div>

                          {/* Payment status banner */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                            <div>
                              <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>Payment Status</span>
                              <strong style={{ fontSize: '12px', color: '#16A34A' }}>Ready for Approval</strong>
                            </div>
                            <button 
                              onClick={() => {
                                onChangeTab('Invoice Management');
                                setSelectedInvoice('INV-1042');
                                setShowDrawer(true);
                              }}
                              style={{
                                height: '34px',
                                padding: '0 16px',
                                borderRadius: '6px',
                                border: '1px solid #D97706',
                                backgroundColor: '#FFFFFF',
                                color: '#D97706',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Send for Approval
                            </button>
                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

      )}
      {activeTab === 'Payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Payment Disbursements</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Disbursement status and bank transaction references for paid invoices</span>
            </div>
          </div>

          {(() => {
            // Mapped mock data matching the image
            const paymentsData = {
              'PAY-0087': { date: '03 Aug 2026', vendor: 'ABC Metals Pvt Ltd', invoiceRef: 'INV-1042', amount: '₹ 4,85,000.00', amountPaid: '₹ 4,85,000.00', mode: 'NEFT', status: 'Paid', statusColor: '#16A34A', statusBg: '#DCFCE7', refNo: 'UTR1234567890', bank: 'HDFC Bank - 50200012345678', remarks: 'Payment for Aluminium Rails & Clamps', invDate: '02 Aug 2026', invAmt: '₹ 4,85,000.00', dueDate: '17 Aug 2026', approvedBy: 'Ramesh Kumar (Finance Head)', approvedOn: '03 Aug 2026, 10:15 AM', t1: '03 Aug 2026, 09:45 AM', t2: '03 Aug 2026, 10:15 AM', t3: '03 Aug 2026, 11:20 AM' },
              'PAY-0086': { date: '03 Aug 2026', vendor: 'XYZ Solar Pvt Ltd', invoiceRef: 'INV-1043', amount: '₹ 2,40,000.00', amountPaid: '₹ 2,40,000.00', mode: 'NEFT', status: 'Paid', statusColor: '#16A34A', statusBg: '#DCFCE7', refNo: 'UTR1234567889', bank: 'ICICI Bank - 000405001234', remarks: 'Payment for solar inverter spares', invDate: '02 Aug 2026', invAmt: '₹ 2,40,000.00', dueDate: '17 Aug 2026', approvedBy: 'Ramesh Kumar (Finance Head)', approvedOn: '03 Aug 2026, 11:00 AM', t1: '03 Aug 2026, 10:00 AM', t2: '03 Aug 2026, 11:00 AM', t3: '03 Aug 2026, 11:45 AM' },
              'PAY-0085': { date: '02 Aug 2026', vendor: 'Steel Authority Ltd', invoiceRef: 'INV-1044', amount: '₹ 8,20,000.00', amountPaid: '₹ 8,20,000.00', mode: 'RTGS', status: 'Paid', statusColor: '#16A34A', statusBg: '#DCFCE7', refNo: 'UTR1234567888', bank: 'SBI Bank - 31024501234', remarks: 'Payment for Structural steel beams', invDate: '01 Aug 2026', invAmt: '₹ 8,20,000.00', dueDate: '16 Aug 2026', approvedBy: 'Ramesh Kumar (Finance Head)', approvedOn: '02 Aug 2026, 04:30 PM', t1: '02 Aug 2026, 03:00 PM', t2: '02 Aug 2026, 04:30 PM', t3: '02 Aug 2026, 05:15 PM' },
              'PAY-0084': { date: '01 Aug 2026', vendor: 'Fasteners India Pvt Ltd', invoiceRef: 'INV-1045', amount: '₹ 1,15,000.00', amountPaid: '₹ 1,15,000.00', mode: 'NEFT', status: 'Paid', statusColor: '#16A34A', statusBg: '#DCFCE7', refNo: 'UTR1234567887', bank: 'HDFC Bank - 50200012345678', remarks: 'Payment for Hex nuts and bolts bulk order', invDate: '31 Jul 2026', invAmt: '₹ 1,15,000.00', dueDate: '15 Aug 2026', approvedBy: 'Ramesh Kumar (Finance Head)', approvedOn: '01 Aug 2026, 11:30 AM', t1: '01 Aug 2026, 10:15 AM', t2: '01 Aug 2026, 11:30 AM', t3: '01 Aug 2026, 12:10 PM' },
              'PAY-0083': { date: '01 Aug 2026', vendor: 'ABC Metals Pvt Ltd', invoiceRef: 'INV-1046', amount: '₹ 3,60,000.00', amountPaid: '₹ 0.00', mode: 'NEFT', status: 'Pending', statusColor: '#D97706', statusBg: '#FEF3C7', refNo: '-', bank: 'HDFC Bank - 50200012345678', remarks: 'Pending processing for Aluminium clamp profiles', invDate: '31 Jul 2026', invAmt: '₹ 3,60,000.00', dueDate: '15 Aug 2026', approvedBy: 'Ramesh Kumar (Finance Head)', approvedOn: '01 Aug 2026, 02:00 PM', t1: '01 Aug 2026, 01:30 PM', t2: '01 Aug 2026, 02:00 PM', t3: '—' },
              'PAY-0082': { date: '31 Jul 2026', vendor: 'Polyplast Ltd', invoiceRef: 'INV-1047', amount: '₹ 85,000.00', amountPaid: '₹ 0.00', mode: 'NEFT', status: 'Pending', statusColor: '#D97706', statusBg: '#FEF3C7', refNo: '-', bank: 'Axis Bank - 912010045123', remarks: 'Under finance review', invDate: '30 Jul 2026', invAmt: '₹ 85,000.00', dueDate: '14 Aug 2026', approvedBy: '—', approvedOn: '—', t1: '31 Jul 2026, 09:00 AM', t2: '—', t3: '—' },
              'PAY-0081': { date: '30 Jul 2026', vendor: 'XYZ Solar Pvt Ltd', invoiceRef: 'INV-1048', amount: '₹ 1,20,000.00', amountPaid: '₹ 1,20,000.00', mode: 'RTGS', status: 'Paid', statusColor: '#16A34A', statusBg: '#DCFCE7', refNo: 'UTR1234567886', bank: 'ICICI Bank - 000405001234', remarks: 'Payment for junction boxes', invDate: '30 Jul 2026', invAmt: '₹ 1,20,000.00', dueDate: '14 Aug 2026', approvedBy: 'Ramesh Kumar (Finance Head)', approvedOn: '30 Jul 2026, 04:00 PM', t1: '30 Jul 2026, 02:30 PM', t2: '30 Jul 2026, 04:00 PM', t3: '30 Jul 2026, 04:45 PM' },
              'PAY-0080': { date: '30 Jul 2026', vendor: 'Sunrise Metals Pvt Ltd', invoiceRef: 'INV-1049', amount: '₹ 2,75,000.00', amountPaid: '₹ 0.00', mode: 'NEFT', status: 'Overdue', statusColor: '#EF4444', statusBg: '#FEE2E2', refNo: '-', bank: 'SBI Bank - 31024501234', remarks: 'Payment overdue due to invoice audit mismatch hold', invDate: '29 Jul 2026', invAmt: '₹ 2,75,000.00', dueDate: '13 Aug 2026', approvedBy: '—', approvedOn: '—', t1: '30 Jul 2026, 10:00 AM', t2: '—', t3: '—' },
              'PAY-0079': { date: '29 Jul 2026', vendor: 'Bright Industrial Pvt Ltd', invoiceRef: 'INV-1050', amount: '₹ 1,98,000.00', amountPaid: '₹ 1,98,000.00', mode: 'NEFT', status: 'Paid', statusColor: '#16A34A', statusBg: '#DCFCE7', refNo: 'UTR1234567885', bank: 'HDFC Bank - 50200012345678', remarks: 'Payment for copper wires', invDate: '28 Jul 2026', invAmt: '₹ 1,98,000.00', dueDate: '12 Aug 2026', approvedBy: 'Ramesh Kumar (Finance Head)', approvedOn: '29 Jul 2026, 11:15 AM', t1: '29 Jul 2026, 09:30 AM', t2: '29 Jul 2026, 11:15 AM', t3: '29 Jul 2026, 11:50 AM' },
              'PAY-0078': { date: '28 Jul 2026', vendor: 'ABC Metals Pvt Ltd', invoiceRef: 'INV-1051', amount: '₹ 56,000.00', amountPaid: '₹ 0.00', mode: 'NEFT', status: 'Pending', statusColor: '#D97706', statusBg: '#FEF3C7', refNo: '-', bank: 'HDFC Bank - 50200012345678', remarks: 'Awaiting finance release clearance', invDate: '28 Jul 2026', invAmt: '₹ 56,000.00', dueDate: '12 Aug 2026', approvedBy: '—', approvedOn: '—', t1: '28 Jul 2026, 04:00 PM', t2: '—', t3: '—' }
            };

            const selected = paymentsData[selectedPayment] || paymentsData['PAY-0087'];

            return (
              <div style={{ display: 'grid', gridTemplateColumns: showPaymentPanel ? '1fr 380px' : '1fr', gap: '20px', alignItems: 'start', width: '100%' }}>
                
                {/* Left Side: Search, List Table, Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
                  
                  {/* Summary Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 1fr', gap: '20px' }}>
                    
                    {/* Payment Mode Summary */}
                    <div className="section-card" style={{ padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                      <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>Payment Mode Summary</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { mode: 'NEFT', val: '₹ 1.28 Cr', count: '32 Payments', pct: 52, color: '#2563EB' },
                          { mode: 'RTGS', val: '₹ 92.15 L', count: '14 Payments', pct: 37, color: '#4F46E5' },
                          { mode: 'IMPS/Other', val: '₹ 28.20 L', count: '10 Payments', pct: 11, color: '#06B6D4' }
                        ].map((m, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11px' }}>
                              <span style={{ fontWeight: '600', color: '#475569' }}>{m.mode} <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 'normal' }}>({m.count})</span></span>
                              <strong style={{ color: '#1E293B' }}>{m.val}</strong>
                            </div>
                            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#F1F5F9', width: '100%', overflow: 'hidden' }}>
                              <div style={{ height: '100%', backgroundColor: m.color, width: `${m.pct}%`, borderRadius: '3px', transition: 'width 0.5s ease-in-out' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Vendors by Payment */}
                    <div className="section-card" style={{ padding: '18px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                      <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>Top Vendors by Payment</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { rank: 1, name: 'ABC Metals Pvt Ltd', val: '₹ 52.75 L', color: '#EFF6FF', textColor: '#2563EB' },
                          { rank: 2, name: 'Steel Authority Ltd', val: '₹ 28.40 L', color: '#EEF2F6', textColor: '#475569' },
                          { rank: 3, name: 'XYZ Solar Pvt Ltd', val: '₹ 24.60 L', color: '#FFF7ED', textColor: '#EA580C' }
                        ].map((v, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: v.color,
                                color: v.textColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: '800'
                              }}>{v.rank}</div>
                              <span style={{ color: '#334155', fontWeight: '500' }}>{v.name}</span>
                            </div>
                            <strong style={{ color: '#0F172A' }}>{v.val}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Status Distribution (Donut SVG Chart) */}
                    <div className="section-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', display: 'flex', flexDirection: 'column', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                      <div style={{ padding: '16px 20px 0 20px' }}>
                        <strong style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>Payment Status Distribution</strong>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px', position: 'relative' }}>
                        {/* SVG Donut */}
                        <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                          <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4"></circle>
                            {/* Paid (Green): 60% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="60 40" strokeDashoffset="0"></circle>
                            {/* Pending (Orange): 30% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="-60"></circle>
                            {/* Overdue (Red): 10% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EF4444" strokeWidth="4" strokeDasharray="10 90" strokeDashoffset="-90"></circle>
                          </svg>
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                          }}>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F172A', fontFamily: 'Inter, system-ui' }}>56</span>
                            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '500', marginTop: '1px' }}>Total Payments</span>
                          </div>
                        </div>
                      </div>

                      {/* Divided Bottom section: Breakdown */}
                      <div style={{ borderTop: '1px solid #E2E8F0', padding: '12px 20px', backgroundColor: '#f8fafc', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1E293B', display: 'block', marginBottom: '8px' }}>
                          Status Breakdown
                        </span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            { name: 'Paid', count: '33 Bills', percentage: '59.0%', color: '#10B981', amount: '₹ 1.76 Cr' },
                            { name: 'Pending', count: '18 Bills', percentage: '32.1%', color: '#F59E0B', amount: '₹ 60.35 L' },
                            { name: 'Overdue', count: '5 Bills', percentage: '8.9%', color: '#EF4444', amount: '₹ 12.45 L' }
                          ].map((legend, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#334155' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: legend.color, borderRadius: '50%', flexShrink: 0 }}></span>
                                <span style={{ fontWeight: '500' }}>{legend.name}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ color: '#64748B', fontSize: '10px' }}>{legend.count}</span>
                                <strong style={{ color: '#1E293B' }}>{legend.amount}</strong>
                                <span style={{ color: '#94A3B8', fontSize: '10px', minWidth: '35px', textAlign: 'right' }}>{legend.percentage}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Filters Card */}
                  <div className="section-card" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#FFFFFF', flex: 1, minWidth: '220px' }}>
                      <Search style={{ width: '14px', height: '14px', color: '#64748b' }} />
                      <input
                        placeholder="Search by vendor / payment no / ref no..."
                        value={paySearchQuery}
                        onChange={(e) => setPaySearchQuery(e.target.value)}
                        style={{ border: 'none', background: 'none', outline: 'none', fontSize: '12px', width: '100%', color: '#334155' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#475569', minWidth: '120px' }}>
                        <option>All Status</option>
                        <option>Paid</option>
                        <option>Pending</option>
                        <option>Overdue</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#475569', minWidth: '120px' }}>
                        <option>All Modes</option>
                        <option>NEFT</option>
                        <option>RTGS</option>
                        <option>IMPS</option>
                        <option>Cheque</option>
                        <option>UPI</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#475569', minWidth: '120px' }}>
                        <option>All Vendors</option>
                        <option>ABC Metals Pvt Ltd</option>
                        <option>XYZ Solar Pvt Ltd</option>
                        <option>Steel Authority Ltd</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', cursor: 'pointer', backgroundColor: 'white', fontSize: '12px', color: '#475569' }}>
                      <span>Select Date</span>
                      <Calendar style={{ width: '14px', height: '14px', color: '#64748b' }} />
                    </div>

                    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 16px', height: '38px', cursor: 'pointer', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                      <Filter style={{ width: '12px', height: '12px' }} />
                      Filters
                    </button>

                    <button 
                      onClick={() => { setPaySearchQuery(''); }} 
                      style={{ height: '38px', padding: '0 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#2563EB', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Reset
                    </button>
                  </div>

                  {/* Payments List Card */}
                  <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <strong style={{ fontSize: '14px', color: '#0F172A' }}>Payments List (56)</strong>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Payment No.</th>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Payment Date</th>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Vendor</th>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Invoice Ref.</th>
                            <th style={{ padding: '10px 8px', textAlign: 'right' }}>Amount (₹)</th>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Payment Mode</th>
                            <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Reference No.</th>
                            <th style={{ padding: '10px 8px', textAlign: 'center', width: '60px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(paymentsData).map((key) => {
                            const row = paymentsData[key];
                            const isSelected = selectedPayment === key;
                            return (
                              <tr 
                                key={key}
                                onClick={() => { setSelectedPayment(key); setShowPaymentPanel(true); }}
                                style={{ 
                                  borderBottom: '1px solid #F1F5F9',
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                  transition: 'background-color 0.15s ease'
                                }}
                              >
                                <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#2563EB' }}>{key}</td>
                                <td style={{ padding: '12px 8px', color: '#475569' }}>{row.date}</td>
                                <td style={{ padding: '12px 8px', fontWeight: '600', color: '#1E293B' }}>{row.vendor}</td>
                                <td style={{ padding: '12px 8px', color: '#2563EB', fontWeight: '600' }}>{row.invoiceRef}</td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1E293B' }}>{row.amount.replace('₹ ', '')}</td>
                                <td style={{ padding: '12px 8px', color: '#475569' }}>{row.mode}</td>
                                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    backgroundColor: row.statusBg,
                                    color: row.statusColor
                                  }}>{row.status}</span>
                                </td>
                                <td style={{ padding: '12px 8px', color: '#64748B', fontFamily: 'monospace' }}>{row.refNo}</td>
                                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={() => { setSelectedPayment(key); setShowPaymentPanel(true); }}
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#2563EB', padding: 0 }}
                                    >
                                      <Eye style={{ width: '14px', height: '14px' }} />
                                    </button>
                                    <span style={{ color: '#94A3B8', fontSize: '14px', cursor: 'pointer' }}>⋮</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Showing 1 to 10 of 56 entries</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button style={{ width: '28px', height: '28px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronLeft style={{ width: '12px', height: '12px' }} />
                          </button>
                          {[1, 2, 3, 4].map(page => (
                            <button key={page} style={{
                              width: '28px',
                              height: '28px',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              backgroundColor: page === 1 ? '#2563EB' : '#FFFFFF',
                              color: page === 1 ? '#FFFFFF' : '#475569',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}>{page}</button>
                          ))}
                          <button style={{ width: '28px', height: '28px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronRight style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                        <select style={{ height: '28px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 6px', fontSize: '11px', backgroundColor: '#FFFFFF', color: '#475569' }}>
                          <option>10 / page</option>
                        </select>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Side: Payment Details side-panel */}
                {showPaymentPanel && (
                  <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '0', animation: 'fadeIn 0.2s ease-out' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>Payment Details</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          backgroundColor: selected.statusBg,
                          color: selected.statusColor
                        }}>{selected.status}</span>
                        <button 
                          onClick={() => setShowPaymentPanel(false)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 0 }}
                        >
                          <XCircle style={{ width: '18px', height: '18px' }} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{selectedPayment}</strong>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>{selected.mode} Payment</span>
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                      {[
                        { label: 'Payment Date', val: selected.date },
                        { label: 'Vendor', val: selected.vendor },
                        { label: 'Invoice Reference', val: selected.invoiceRef },
                        { label: 'Total Amount', val: selected.amount, isBold: true },
                        { label: 'Paid Amount', val: selected.amountPaid },
                        { label: 'Bank Account', val: selected.bank },
                        { label: 'Reference No.', val: selected.refNo, isMono: true },
                        { label: 'Payment Mode', val: selected.mode },
                        { label: 'Remarks', val: selected.remarks }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '8px' }}>
                          <span style={{ color: '#64748B' }}>{item.label}</span>
                          <strong style={{ 
                            color: '#1E293B', 
                            fontFamily: item.isMono ? 'monospace' : 'inherit',
                            fontSize: item.isBold ? '12px' : '11px'
                          }}>{item.val}</strong>
                        </div>
                      ))}
                    </div>

                    {/* Linked Invoice Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                      <strong style={{ fontSize: '11px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Linked Invoice Details</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                        {[
                          { label: 'Invoice No.', val: selected.invoiceRef, isBold: true },
                          { label: 'Invoice Date', val: selected.invDate },
                          { label: 'Invoice Amount', val: selected.invAmt },
                          { label: 'Due Date', val: selected.dueDate }
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '8px' }}>
                            <span style={{ color: '#64748B' }}>{item.label}</span>
                            <strong style={{ color: '#1E293B' }}>{item.val}</strong>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => onChangeTab('Invoice Management')}
                        style={{
                          marginTop: '4px',
                          height: '32px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          backgroundColor: '#FFFFFF',
                          color: '#2563EB',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        View Invoice
                      </button>
                    </div>

                    {/* Approval Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '11px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Approval Details</strong>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', backgroundColor: selected.status === 'Paid' ? '#DCFCE7' : '#F3F4F6', color: selected.status === 'Paid' ? '#166534' : '#475569' }}>
                          {selected.status === 'Paid' ? '✓ Approved' : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '8px' }}>
                          <span style={{ color: '#64748B' }}>Approved By</span>
                          <strong style={{ color: '#1E293B' }}>{selected.approvedBy}</strong>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '8px' }}>
                          <span style={{ color: '#64748B' }}>Approved On</span>
                          <strong style={{ color: '#1E293B' }}>{selected.approvedOn}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Payment Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <strong style={{ fontSize: '11px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Payment Timeline</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', paddingLeft: '4px' }}>
                        {[
                          { title: 'Payment Created', time: selected.t1, done: true },
                          { title: 'Payment Approved', time: selected.t2, done: selected.approvedOn !== '—' },
                          { title: 'Payment Processed', time: selected.t3, done: selected.status === 'Paid' }
                        ].map((t, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: t.done ? '#16A34A' : '#E2E8F0',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}>
                                {t.done ? '✓' : ''}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <strong style={{ color: t.done ? '#1E293B' : '#94A3B8' }}>{t.title}</strong>
                              <span style={{ fontSize: '9px', color: '#64748B' }}>{t.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '6px',
                        border: '1px solid #DBEAFE',
                        backgroundColor: '#FFFFFF',
                        color: '#2563EB',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}>
                        <Download style={{ width: '13px', height: '13px' }} />
                        Download Receipt
                      </button>
                      <button style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}>
                        <FileText style={{ width: '13px', height: '13px' }} />
                        View Audit Trail
                      </button>
                    </div>

                  </div>
                )}

              </div>
            );
          })()}
        </div>
      )}

      {/* ==================== 7. VENDOR PERFORMANCE SCREEN ==================== */}
      {activeTab === 'Vendor Performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0F172A' }}>Performance Summary</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Operational compliance scorecards detailing logistics delay metrics and product quality</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#2563EB',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                <Users style={{ width: '15px', height: '15px' }} />
                View All Vendors
              </button>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                <Download style={{ width: '15px', height: '15px' }} />
                Export
              </button>
            </div>
          </div>

          {/* Six Scorecards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            
            {/* Card 1: On-Time Delivery */}
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E6F4EA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#137333', flexShrink: 0 }}>
                  <Truck style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>On-Time Delivery</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <strong style={{ fontSize: '20px', color: '#0F172A' }}>92.6%</strong>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#E6F7ED', color: '#137333', fontWeight: 'bold' }}>Excellent</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', width: '100%', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#137333', width: '92.6%' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  vs Apr 2025: <span style={{ color: '#137333', fontWeight: '600' }}>↑ 4.2%</span>
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                Percentage of orders delivered as per committed delivery date.
              </p>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#137333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View Details &rarr;
                </span>
              </div>
            </div>

            {/* Card 2: Quality Performance */}
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A73E8', flexShrink: 0 }}>
                  <Shield style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Quality Performance</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <strong style={{ fontSize: '20px', color: '#0F172A' }}>4.32 <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 'normal' }}>/ 5</span></strong>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#E8F0FE', color: '#1A73E8', fontWeight: 'bold' }}>Very Good</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', width: '100%', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#1A73E8', width: '86.4%' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  vs Apr 2025: <span style={{ color: '#1A73E8', fontWeight: '600' }}>↑ 0.18</span>
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                Average quality score based on inspections, rejections & returns.
              </p>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#1A73E8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View Details &rarr;
                </span>
              </div>
            </div>

            {/* Card 3: Price Competitiveness */}
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEF3D6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B06000', flexShrink: 0 }}>
                  <DollarSign style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Price Competitiveness</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <strong style={{ fontSize: '20px', color: '#0F172A' }}>-2.35%</strong>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#FEF3D6', color: '#B06000', fontWeight: 'bold' }}>Good</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', width: '100%', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#B06000', width: '75%' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  vs Apr 2025: <span style={{ color: '#C5221F', fontWeight: '600' }}>↓ 0.42%</span>
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                Average price variance compared to quoted price/market benchmark.
              </p>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#B06000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View Details &rarr;
                </span>
              </div>
            </div>

            {/* Card 4: Order Fulfillment */}
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E22CE', flexShrink: 0 }}>
                  <Package style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Order Fulfillment</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <strong style={{ fontSize: '20px', color: '#0F172A' }}>95.4%</strong>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#F3E8FF', color: '#7E22CE', fontWeight: 'bold' }}>Excellent</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', width: '100%', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#7E22CE', width: '95.4%' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  vs Apr 2025: <span style={{ color: '#137333', fontWeight: '600' }}>↑ 3.6%</span>
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                Percentage of orders fulfilled in full as per PO quantity.
              </p>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#7E22CE', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View Details &rarr;
                </span>
              </div>
            </div>

            {/* Card 5: Response Time */}
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369A1', flexShrink: 0 }}>
                  <Clock style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Response Time</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <strong style={{ fontSize: '20px', color: '#0F172A' }}>18.6 Hrs</strong>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 'bold' }}>Good</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', width: '100%', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#0369A1', width: '70%' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  vs Apr 2025: <span style={{ color: '#137333', fontWeight: '600' }}>↓ 2.4 Hrs</span>
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                Average time taken to respond to RFQs, queries & requests.
              </p>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#0369A1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View Details &rarr;
                </span>
              </div>
            </div>

            {/* Card 6: Overall Performance */}
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C', flexShrink: 0 }}>
                  <Star style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Overall Performance</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <strong style={{ fontSize: '20px', color: '#0F172A' }}>4.21 <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 'normal' }}>/ 5</span></strong>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#B91C1C', fontWeight: 'bold' }}>Very Good</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', width: '100%', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: '#B91C1C', width: '84.2%' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  vs Apr 2025: <span style={{ color: '#137333', fontWeight: '600' }}>↑ 0.15</span>
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                Overall performance score based on weighted key metrics.
              </p>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: 'auto' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View Details &rarr;
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Tables Row (Two Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            
            {/* Top Performing Vendors */}
            <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp style={{ width: '18px', height: '18px', color: '#137333' }} />
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Top Performing Vendors</strong>
                </div>
                <button style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>View All</button>
              </div>

              <table className="custom-table widget-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600' }}></th>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600' }}>Vendor Name</th>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>On-Time Delivery</th>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Quality Score</th>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rank: 1, name: 'Sunrise Metal Industries', ot: '98.6%', q: '4.65 / 5', overall: '4.65 / 5' },
                    { rank: 2, name: 'ABC Steels Pvt Ltd', ot: '97.2%', q: '4.58 / 5', overall: '4.52 / 5' },
                    { rank: 3, name: 'Galaxy Components', ot: '96.1%', q: '4.42 / 5', overall: '4.38 / 5' }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '10px 4px', color: '#94A3B8', fontWeight: 'bold' }}>{row.rank}</td>
                      <td style={{ padding: '10px 4px', fontWeight: '600', color: '#0F172A' }}>{row.name}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', color: '#475569' }}>{row.ot}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', color: '#475569' }}>{row.q}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#E6F7ED', color: '#137333', fontWeight: 'bold' }}>
                          {row.overall}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Needs Improvement */}
            <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingDown style={{ width: '18px', height: '18px', color: '#C5221F' }} />
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Needs Improvement</strong>
                </div>
                <button style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>View All</button>
              </div>

              <table className="custom-table widget-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600' }}></th>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600' }}>Vendor Name</th>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>On-Time Delivery</th>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Quality Score</th>
                    <th style={{ padding: '8px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rank: 1, name: 'Shree Fabricators', ot: '68.3%', q: '2.85 / 5', overall: '2.91 / 5' },
                    { rank: 2, name: 'Powerline Traders', ot: '71.4%', q: '2.95 / 5', overall: '3.02 / 5' },
                    { rank: 3, name: 'National Fasteners', ot: '74.2%', q: '3.05 / 5', overall: '3.12 / 5' }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '10px 4px', color: '#94A3B8', fontWeight: 'bold' }}>{row.rank}</td>
                      <td style={{ padding: '10px 4px', fontWeight: '600', color: '#0F172A' }}>{row.name}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', color: '#475569' }}>{row.ot}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', color: '#475569' }}>{row.q}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FCE8E6', color: '#C5221F', fontWeight: 'bold' }}>
                          {row.overall}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ==================== 8. SPEND ANALYTICS SCREEN ==================== */}
      {activeTab === 'Spend Analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Spend Analytics Breakdown</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Analyze organizational procurement budgets and category cost patterns</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {spendCategories.map((item, idx) => (
              <div key={idx} className="section-card" style={{ borderLeft: `4px solid ${item.color}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>{item.cat}</span>
                <strong style={{ fontSize: '17px', color: '#0f172a', marginTop: '4px' }}>{item.value}</strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{item.count} Purchase Orders</span>
              </div>
            ))}
          </div>

          <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <strong style={{ fontSize: '14px' }}>Top Vendors by Spend Share</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Tata Steel Ltd.</span>
                  <strong>75% (₹45.5L)</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '75%', height: '100%', backgroundColor: '#3b82f6' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Havells India Ltd.</span>
                  <strong>18% (₹12.2L)</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '18%', height: '100%', backgroundColor: '#10b981' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 9. MATERIAL REORDER ALERTS SCREEN ==================== */}
      {activeTab === 'Material Reorder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0F172A' }}>Material Reorder Alerts</h2>
                <HelpCircle style={{ width: '16px', height: '16px', color: '#64748B', cursor: 'pointer' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Monitor low stock materials and take action before they run out.</span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                height: '38px',
                padding: '0 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <Download style={{ width: '16px', height: '16px', color: '#475569' }} />
                Export
              </button>
            </div>
          </div>
          
          {/* Search / Filter Card */}
          <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Search Material</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" placeholder="Search by Material / SKU / Code" style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px 0 36px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                  <Search style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', left: '12px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Warehouse</label>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>All Warehouses</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Category</label>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>All Categories</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Criticality</label>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>All</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Supplier</label>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>All Suppliers</option>
                </select>
              </div>
              <div>
                <button style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <SlidersHorizontal style={{ width: '14px', height: '14px' }} />
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Top Widget Row (Reorder Summary, Top Materials at Risk) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            
            {/* Reorder Summary Card (By Status) */}
            <div className="section-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 24px 0 24px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F172A' }}>Reorder Summary (By Status)</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 24px', position: 'relative' }}>
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                  <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4"></circle>
                    {/* Critical segment: 22% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EF4444" strokeWidth="4" strokeDasharray="22 78" strokeDashoffset="0"></circle>
                    {/* Low Stock segment: 44% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="44 56" strokeDashoffset="-22"></circle>
                    {/* Reorder Soon segment: 34% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EAB308" strokeWidth="4" strokeDasharray="34 66" strokeDashoffset="-66"></circle>
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#0F172A', fontFamily: 'Inter, system-ui' }}>81</span>
                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500', marginTop: '2px' }}>Total Items</span>
                  </div>
                </div>
              </div>

              {/* Divided Bottom section: Reorder Breakdown */}
              <div style={{ borderTop: '1px solid #E2E8F0', padding: '16px 24px', backgroundColor: '#f8fafc' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E293B', display: 'block', marginBottom: '12px' }}>
                  Reorder Summary Breakdown
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { name: 'Critical', count: '18 Items', percentage: '22.0%', color: '#EF4444' },
                    { name: 'Low Stock', count: '36 Items', percentage: '44.0%', color: '#F59E0B' },
                    { name: 'Reorder Soon', count: '27 Items', percentage: '34.0%', color: '#EAB308' }
                  ].map((legend, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: legend.color, borderRadius: '50%', flexShrink: 0 }}></span>
                        <span style={{ fontWeight: '500' }}>{legend.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>{legend.count}</span>
                        <strong style={{ color: '#1e293b', minWidth: '40px', textAlign: 'right' }}>{legend.percentage}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Materials at Risk Card */}
            <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Top Materials at Risk</strong>
                  <a href="#" style={{ fontSize: '11px', color: '#2563EB', fontWeight: 'bold', textDecoration: 'none' }}>View All</a>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', fontSize: '10px', color: '#64748B', fontWeight: 'bold', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                    <div style={{ flex: 1 }}>Material</div>
                    <div style={{ width: '90px', textAlign: 'center' }}>Current Stock</div>
                    <div style={{ width: '90px', textAlign: 'center' }}>Coverage Days</div>
                  </div>

                  {/* Body Rows */}
                  {reorderAlerts.slice(0, 8).map((item) => (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ flex: 1, fontSize: '11px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </span>
                        <span style={{ width: '90px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                          {item.stock}
                        </span>
                        <span style={{ width: '90px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: item.status === 'Critical' ? '#EF4444' : '#F59E0B' }}>
                          {item.coverage}
                        </span>
                      </div>
                      
                      {/* Meter bar */}
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${item.level}%`, 
                          height: '100%', 
                          backgroundColor: item.status === 'Critical' ? '#EF4444' : '#F59E0B',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Middle Row: Reorder Alerts List Table (Full Width) */}
          <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <strong style={{ fontSize: '15px', color: '#0F172A' }}>Reorder Alerts List (81 Items)</strong>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>#</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Material / SKU</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Warehouse</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Current Stock</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Reorder Level</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>UOM</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Lead Time</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Est. Reorder Qty</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'right' }}>Est. Value (₹)</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Action</th>
                    <th style={{ padding: '10px 4px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {reorderAlerts.map((row, idx) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '12px 4px', color: '#94A3B8' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 4px' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {row.name}
                          {row.status === 'Critical' && <span style={{ color: '#EF4444' }}>*</span>}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748B' }}>{row.sku}</div>
                      </td>
                      <td style={{ padding: '12px 4px', color: '#475569' }}>{row.category}</td>
                      <td style={{ padding: '12px 4px', color: '#475569' }}>{row.warehouse}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '700', color: row.status === 'Critical' ? '#EF4444' : '#F59E0B' }}>{row.stock}</div>
                        <div style={{ fontSize: '10px', color: row.status === 'Critical' ? '#EF4444' : '#F59E0B', fontWeight: '600' }}>{row.percent}</div>
                      </td>
                      <td style={{ padding: '12px 4px', textAlign: 'center', color: '#475569', fontWeight: '600' }}>{row.minLevel}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center', color: '#64748B' }}>{row.uom}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center', color: '#475569' }}>{row.leadTime}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          backgroundColor: '#EFF6FF', 
                          color: '#1E40AF' 
                        }}>
                          {row.reorderQty}
                        </span>
                      </td>
                      <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>{row.val}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                        {(() => {
                          let colors = { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
                          if (row.status === 'Critical') {
                            colors = { bg: '#fff5f5', color: '#e53e3e', border: '#fed7d7' };
                          } else {
                            colors = { bg: '#fffbeb', color: '#d97706', border: '#fef3c7' };
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
                              {row.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                        <button 
                          onClick={() => {
                            if (typeof onChangeTab === 'function') {
                              onChangeTab('Purchase Orders');
                            }
                          }}
                          style={{
                            height: '30px',
                            padding: '0 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          + Create PO
                        </button>
                      </td>
                      <td style={{ padding: '12px 4px', textAlign: 'center', color: '#64748B', cursor: 'pointer' }}>
                        <MoreVertical style={{ width: '14px', height: '14px' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Showing 1 to 10 of 81 items</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}>
                    <ChevronLeft style={{ width: '14px', height: '14px' }} />
                  </button>
                  {[1, 2, 3, 4].map((page) => (
                    <button key={page} style={{ 
                      width: '32px', 
                      height: '32px', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '6px', 
                      backgroundColor: page === 1 ? '#2563EB' : '#FFFFFF', 
                      color: page === 1 ? '#FFFFFF' : '#475569', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer' 
                    }}>
                      {page}
                    </button>
                  ))}
                  <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}>
                    <ChevronRight style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
                <select style={{ height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#475569' }}>
                  <option>10 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Actions Card (Full Width Row) */}
          <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <strong style={{ fontSize: '14px', color: '#0F172A' }}>Quick Actions</strong>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Create Purchase Request', icon: ShoppingCart, action: () => onChangeTab('requisitions') },
                { label: 'Create Indent', icon: FileText, action: () => onChangeTab('purchase-orders') },
                { label: 'Stock Report', icon: TrendingUp, action: () => window.print() }
              ].map((act, idx) => {
                const ActIcon = act.icon || FileText;
                return (
                  <button key={idx} 
                  onClick={act.action || null}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 6px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '75px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}>
                    <ActIcon style={{ width: '18px', height: '18px', color: '#2563EB' }} />
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#475569', textAlign: 'center', lineHeight: '1.2' }}>{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Info alerts bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '14px 20px', border: '1px solid #DBEAFE' }}>
            <Info style={{ width: '16px', height: '16px', color: '#2563EB', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Reorder alerts are based on current stock, reorder level and average consumption.
              <a href="#" style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
                Learn more
                <ExternalLink style={{ width: '12px', height: '12px' }} />
              </a>
            </span>
          </div>

        </div>
      )}

      {/* ==================== 10. STOCK STATUS SCREEN ==================== */}
      {activeTab === 'Stock Status' && !showAddStockForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Stock Status Inventory</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Real-time stock valuation ledger and warehouse storage registry</span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                height: '38px',
                padding: '0 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <Download style={{ width: '16px', height: '16px', color: '#475569' }} />
                Export
              </button>
              <button 
                onClick={() => setShowAddStockForm(true)}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                New Stock
              </button>
            </div>
          </div>


          {/* Search / Filter Card */}
          <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto auto', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" placeholder="Search by Material / SKU / Code..." style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px 0 36px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                  <Search style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', left: '12px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>All Warehouses</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>All Categories</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>All Status</option>
                </select>
              </div>
              <div>
                <button style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <SlidersHorizontal style={{ width: '14px', height: '14px' }} />
                  Filters
                </button>
              </div>
              <div>
                <button style={{
                  height: '38px',
                  padding: '0 8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#2563EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Top Widget Row (Stock Health, Top Low Stock Items) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            
            {/* Stock Health Card */}
            <div className="section-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 24px 0 24px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F172A' }}>Stock Health</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 24px', position: 'relative' }}>
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                  <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4"></circle>
                    {/* In Stock segment: 86% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="86 14" strokeDashoffset="0"></circle>
                    {/* Low Stock segment: 10% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="10 90" strokeDashoffset="-86"></circle>
                    {/* Out of Stock segment: 4% */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EF4444" strokeWidth="4" strokeDasharray="4 96" strokeDashoffset="-96"></circle>
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#0F172A', fontFamily: 'Inter, system-ui' }}>86%</span>
                    <span style={{ fontSize: '13px', color: '#10B981', fontWeight: '500', marginTop: '2px' }}>Healthy</span>
                  </div>
                </div>
              </div>

              {/* Divided Bottom section: Stock Health Breakdown */}
              <div style={{ borderTop: '1px solid #E2E8F0', padding: '16px 24px', backgroundColor: '#fafbfc' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E293B', display: 'block', marginBottom: '12px' }}>
                  Stock Health Breakdown
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { name: 'In Stock', count: '1,102 Items', percentage: '86.0%', color: '#10B981' },
                    { name: 'Low Stock', count: '126 Items', percentage: '10.0%', color: '#F59E0B' },
                    { name: 'Out of Stock', count: '56 Items', percentage: '4.0%', color: '#EF4444' }
                  ].map((legend, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: legend.color, borderRadius: '50%', flexShrink: 0 }}></span>
                        <span style={{ fontWeight: '500' }}>{legend.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>{legend.count}</span>
                        <strong style={{ color: '#1e293b', minWidth: '40px', textAlign: 'right' }}>{legend.percentage}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Low Stock Items Card */}
            <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Top Low Stock Items</strong>
                  <a href="#" style={{ fontSize: '11px', color: '#2563EB', fontWeight: 'bold', textDecoration: 'none' }}>View All</a>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { name: 'Aluminium Rail 4.2m', stock: '120', color: '#EF4444' },
                    { name: 'Mid Clamp', stock: '850', color: '#F59E0B' },
                    { name: 'GI Nut Bolt M8 x 25', stock: '0', color: '#EF4444' },
                    { name: 'L-Foot', stock: '160', color: '#F59E0B' },
                    { name: 'GI Nut Bolt M10 x 30', stock: '1,800', color: '#F59E0B' },
                    { name: 'UV Cable Tie 300mm', stock: '260', color: '#F59E0B' },
                    { name: 'Hex Bolt M10', stock: '150', color: '#F59E0B' },
                    { name: 'Self Drilling Screw', stock: '600', color: '#F59E0B' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx === 7 ? 'none' : '1px solid #F8FAFC', paddingBottom: idx === 7 ? 0 : '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>{item.name}</span>
                      <strong style={{ fontSize: '12px', color: item.color }}>{item.stock}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Row: Stock Status List Table (Full Width) */}
          <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <strong style={{ fontSize: '15px', color: '#0F172A' }}>Stock Status List (1,284 Items)</strong>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>#</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Material / SKU</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Warehouse</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Available Qty</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Reserved Qty</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Incoming Qty</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Reorder Level</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'right' }}>Stock Value (₹)</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRegistry.map((row, idx) => {
                    let qtyColor = '#10B981'; // Green
                    if (row.stock === '0' || row.stock === '120') {
                      qtyColor = '#EF4444'; // Red
                    } else if (row.stock === '850' || row.stock === '1,800' || row.stock === '160') {
                      qtyColor = '#F59E0B'; // Orange
                    }

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '12px 4px', color: '#94A3B8' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 4px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>{row.item}</div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>{row.code}</div>
                        </td>
                        <td style={{ padding: '12px 4px', color: '#475569' }}>{row.category}</td>
                        <td style={{ padding: '12px 4px', color: '#475569' }}>{row.location}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'center', fontWeight: '700', color: qtyColor }}>{row.stock}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'center', color: '#475569' }}>{row.allocated}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'center', color: '#475569' }}>{row.incoming}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'center', color: '#475569', fontWeight: '600' }}>{row.minLevel}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>{row.val}</td>
                        <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                          {(() => {
                            let colors = { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
                            if (row.status === 'In Stock') {
                              colors = { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
                            } else if (row.status === 'Low Stock') {
                              colors = { bg: '#fffbeb', color: '#d97706', border: '#fef3c7' };
                            } else if (row.status === 'Out of Stock') {
                              colors = { bg: '#fff5f5', color: '#e53e3e', border: '#fed7d7' };
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
                                {row.status}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '12px 4px', textAlign: 'center', color: '#64748B', cursor: 'pointer' }}>
                          <MoreVertical style={{ width: '14px', height: '14px', margin: '0 auto' }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Showing 1 to 8 of 1,284 items</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}>
                    <ChevronLeft style={{ width: '14px', height: '14px' }} />
                  </button>
                  {[1, 2, 3, 4].map((page) => (
                    <button key={page} style={{ 
                      width: '32px', 
                      height: '32px', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '6px', 
                      backgroundColor: page === 1 ? '#2563EB' : '#FFFFFF', 
                      color: page === 1 ? '#FFFFFF' : '#475569', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer' 
                    }}>
                      {page}
                    </button>
                  ))}
                  <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}>
                    <ChevronRight style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
                <select style={{ height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#475569' }}>
                  <option>10 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Actions Card (Full Width Row) */}
          <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <strong style={{ fontSize: '14px', color: '#0F172A' }}>Quick Actions</strong>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {[
                { 
                  label: 'Stock Adjustment', 
                  icon: Edit3, 
                  color: '#8B5CF6',
                  action: () => setShowAddStockForm(true)
                },
                { 
                  label: 'Stock Transfer', 
                  svg: (
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10B981' }}>
                      <polyline points="17 1 21 5 17 9"></polyline>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                      <polyline points="7 23 3 19 7 15"></polyline>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                  ),
                  action: () => setShowAddStockForm(true)
                },
                { label: 'Create Purchase Request', icon: ShoppingCart, action: () => onChangeTab('requisitions') },
                { label: 'Reorder Report', icon: FileCheck, action: () => window.print() },
                { label: 'Stock Movement', icon: TrendingUp, action: () => alert('Stock Movement Report generated for current warehouse.') },
                { label: 'Stock Valuation', icon: DollarSign, action: () => alert('Total Stock Valuation: ₹42,85,000 across all warehouses.') }
              ].map((act, idx) => {
                const ActIcon = act.icon || null;
                return (
                  <button key={idx} 
                  onClick={act.action || null}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 6px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '75px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}>
                    {ActIcon ? (
                      <ActIcon style={{ width: '18px', height: '18px', color: act.color || '#2563EB' }} />
                    ) : (
                      act.svg
                    )}
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#475569', textAlign: 'center', lineHeight: '1.2' }}>{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Info bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '14px 20px', border: '1px solid #DBEAFE' }}>
            <Info style={{ width: '16px', height: '16px', color: '#2563EB', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '600' }}>
              Stock status is updated in real-time. Last updated on 31 May 2025, 10:30 AM
            </span>
          </div>
        </div>
      )}

      {/* Add Stock Form View */}
      {activeTab === 'Stock Status' && showAddStockForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>New Stock</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Manually add inventory into a selected warehouse</span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowAddStockForm(false)}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddStockSubmit}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#2563EB',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Draft
              </button>
              <button 
                onClick={handleAddStockSubmit}
                style={{
                  height: '38px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                New Stock
              </button>
            </div>
          </div>

          {/* Form Columns */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            {/* Left Column (70%) */}
            <div style={{ flex: '1 1 70%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. STOCK ENTRY DETAILS */}
              <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PlusCircle style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                  <strong style={{ fontSize: '13px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Stock Entry Details</strong>
                  <Info style={{ width: '14px', height: '14px', color: '#94A3B8', cursor: 'pointer' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Entry Type <span style={{ color: '#EF4444' }}>*</span></label>
                    <select 
                      value={stockEntry.entryType}
                      onChange={(e) => setStockEntry({ ...stockEntry, entryType: e.target.value })}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                    >
                      <option>Stock Addition</option>
                      <option>Stock Adjustment</option>
                      <option>Manual Correction</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Warehouse <span style={{ color: '#EF4444' }}>*</span></label>
                    <select 
                      value={stockEntry.warehouse}
                      onChange={(e) => setStockEntry({ ...stockEntry, warehouse: e.target.value })}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                    >
                      <option>Main Warehouse</option>
                      <option>Regional Warehouse</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Entry Date <span style={{ color: '#EF4444' }}>*</span></label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={stockEntry.entryDate}
                        onChange={(e) => setStockEntry({ ...stockEntry, entryDate: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px 0 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} 
                      />
                      <Calendar style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '12px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Reason <span style={{ color: '#EF4444' }}>*</span></label>
                    <select 
                      value={stockEntry.reason}
                      onChange={(e) => setStockEntry({ ...stockEntry, reason: e.target.value })}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                    >
                      <option>Opening Stock</option>
                      <option>Discrepancy Correction</option>
                      <option>Found Stock</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Reference No.</label>
                    <input 
                      type="text" 
                      value={stockEntry.refNo}
                      onChange={(e) => setStockEntry({ ...stockEntry, refNo: e.target.value })}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Added By</label>
                    <input 
                      type="text" 
                      value={stockEntry.addedBy}
                      disabled
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#F8FAFC', color: '#64748B', width: '100%', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>
              </div>

              {/* 2. MATERIAL DETAILS */}
              <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                  <strong style={{ fontSize: '13px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Material Details</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
                    <input 
                      type="text" 
                      placeholder="Search Material / SKU / Barcode" 
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px 0 36px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} 
                    />
                    <Search style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', left: '12px' }} />
                  </div>
                  <button style={{
                    height: '38px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#2563EB',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}>
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Add Material
                  </button>
                </div>

                {/* Items Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '700px !important' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ width: '40px', padding: '10px', textAlign: 'center' }}>#</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Material / SKU</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Category</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Current Stock</th>
                        <th style={{ padding: '10px', textAlign: 'center', width: '100px' }}>Add Quantity</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Unit</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Rate (₹)</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Amount (₹)</th>
                        <th style={{ padding: '10px', textAlign: 'center', width: '60px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addStockItems.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ textAlign: 'center', padding: '12px 10px' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: '600', color: '#1E293B' }}>{item.name}</div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>{item.sku}</div>
                          </td>
                          <td style={{ padding: '12px 10px', color: '#475569' }}>{item.category}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <div style={{ fontWeight: '600', color: '#475569' }}>{item.currentStock.split(' ')[0]}</div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>{item.currentStock.split(' ')[1]}</div>
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <input 
                              type="number"
                              value={item.qty}
                              onChange={(e) => {
                                const newItems = [...addStockItems];
                                newItems[idx].qty = Number(e.target.value);
                                setAddStockItems(newItems);
                              }}
                              style={{ width: '80px', height: '32px', textAlign: 'center', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                            />
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', color: '#64748B' }}>{item.uom}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '500', color: '#475569' }}>{item.rate.toFixed(2)}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: '#0F172A' }}>
                            {(item.qty * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <button 
                              onClick={() => {
                                const newItems = addStockItems.filter(it => it.id !== item.id);
                                setAddStockItems(newItems);
                              }}
                              style={{ border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                            >
                              <Trash2 style={{ width: '16px', height: '16px' }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button 
                  onClick={() => {
                    const nextId = addStockItems.length > 0 ? Math.max(...addStockItems.map(i => i.id)) + 1 : 1;
                    setAddStockItems([...addStockItems, { id: nextId, name: 'New Material Item', sku: `SKU-${nextId}`, category: 'General', currentStock: '0 Nos', qty: 100, uom: 'Nos', rate: 10.00 }]);
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    height: '34px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  Add Another Item
                </button>
              </div>

              {/* 3. STOCK DETAILS (Optional) */}
              <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                  <strong style={{ fontSize: '13px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Stock Details (Optional)</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Batch / Lot No.</label>
                    <input 
                      type="text" 
                      value={stockDetails.batchNo}
                      onChange={(e) => setStockDetails({ ...stockDetails, batchNo: e.target.value })}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Supplier</label>
                    <input 
                      type="text" 
                      value={stockDetails.supplier}
                      onChange={(e) => setStockDetails({ ...stockDetails, supplier: e.target.value })}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Manufacturing Date</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={stockDetails.mfgDate}
                        onChange={(e) => setStockDetails({ ...stockDetails, mfgDate: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} 
                      />
                      <Calendar style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '12px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Expiry Date</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Select date"
                        value={stockDetails.expiryDate}
                        onChange={(e) => setStockDetails({ ...stockDetails, expiryDate: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} 
                      />
                      <Calendar style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', right: '12px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Storage Location</label>
                    <select 
                      value={stockDetails.storageLocation}
                      onChange={(e) => setStockDetails({ ...stockDetails, storageLocation: e.target.value })}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                    >
                      <option>Rack A-04</option>
                      <option>Rack B-12</option>
                      <option>Pallet Area 2</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Remarks / Notes</label>
                    <input 
                      type="text" 
                      value={stockDetails.remarks}
                      onChange={(e) => setStockDetails({ ...stockDetails, remarks: e.target.value })}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>
              </div>

              {/* 4. DOCUMENTS */}
              <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <strong style={{ fontSize: '13px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>4. Documents</strong>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', display: 'block', marginBottom: '8px' }}>Upload Document</label>
                    <div style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: '8px',
                      height: '80px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '4px',
                      cursor: 'pointer',
                      backgroundColor: '#F8FAFC'
                    }}>
                      <Upload style={{ width: '20px', height: '20px', color: '#2563EB' }} />
                      <span style={{ fontSize: '11px', color: '#475569' }}>
                        <strong style={{ color: '#2563EB' }}>Click to upload</strong> or drag and drop
                      </span>
                      <span style={{ fontSize: '9px', color: '#94A3B8' }}>PDF, JPG, PNG (Max. 10MB)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', display: 'block', marginBottom: '8px' }}>Uploaded Documents</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stockDocs.map((doc, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF'
                        }}>
                          <FileText style={{ width: '24px', height: '24px', color: '#EF4444' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {doc.name}
                            </div>
                            <div style={{ fontSize: '9px', color: '#94A3B8' }}>{doc.size}</div>
                          </div>
                          <Download style={{ width: '14px', height: '14px', color: '#64748B', cursor: 'pointer' }} />
                          <Trash2 
                            onClick={() => setStockDocs(stockDocs.filter(d => d.name !== doc.name))}
                            style={{ width: '14px', height: '14px', color: '#EF4444', cursor: 'pointer' }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (30%) */}
            <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>
              
              {/* STOCK ENTRY SUMMARY */}
              <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                  <strong style={{ fontSize: '13px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock Entry Summary</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  {[
                    { label: 'Entry Type', value: stockEntry.entryType },
                    { label: 'Reason', value: stockEntry.reason },
                    { label: 'Warehouse', value: stockEntry.warehouse },
                    { label: 'Entry Date', value: stockEntry.entryDate },
                    { label: 'Reference No.', value: stockEntry.refNo },
                    { label: 'Added By', value: stockEntry.addedBy }
                  ].map((row, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                      <span style={{ color: '#64748B' }}>{row.label}</span>
                      <strong style={{ color: '#0F172A' }}>{row.value || '—'}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* AMOUNT SUMMARY */}
              <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <strong style={{ fontSize: '13px', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Summary</strong>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Total Items</span>
                    <strong style={{ color: '#0F172A' }}>{addStockItems.length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Total Quantity</span>
                    <strong style={{ color: '#0F172A' }}>
                      {addStockItems.reduce((acc, it) => acc + Number(it.qty || 0), 0)} Nos
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                    <span style={{ color: '#64748B' }}>Total Stock Value</span>
                    <strong style={{ color: '#0F172A' }}>
                      ₹ {addStockItems.reduce((acc, it) => acc + (it.qty * it.rate), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '12px', border: '1px solid #F1F5F9', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Total Amount (₹)</span>
                    <strong style={{ fontSize: '20px', color: '#16A34A' }}>
                      {addStockItems.reduce((acc, it) => acc + (it.qty * it.rate), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div style={{ display: 'flex', gap: '10px', backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '16px', border: '1px solid #DBEAFE' }}>
                <Info style={{ width: '16px', height: '16px', color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{ fontSize: '12px', color: '#1E40AF' }}>Note</strong>
                  <span style={{ fontSize: '11px', color: '#1E40AF', lineHeight: '1.4' }}>
                    Use Add Stock for opening stock, stock adjustment, found stock or manual corrections only. For purchased goods, use GRN.
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==================== 11. PRICE COMPARISON SCREEN ==================== */}
      {activeTab === 'Price Comparison' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Historical Price Analysis</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Compare last PO prices with market averages to verify cost saving indexes</span>
          </div>

          {/* Search / Filter Card */}
          <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Material / SKU</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" placeholder="Search material / SKU / code" style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px 0 36px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                  <Search style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', left: '12px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Category</label>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>All Categories</option>
                  <option>Rails</option>
                  <option>Clamps</option>
                  <option>Fasteners</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Supplier</label>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>All Suppliers</option>
                  <option>ABC Metals Pvt Ltd</option>
                  <option>XYZ Solar Pvt Ltd</option>
                  <option>Steel Authority Ltd</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Date Range</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" defaultValue="01 Jul 2025 – 03 Aug 2026" style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px 0 36px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                  <Calendar style={{ width: '14px', height: '14px', color: '#64748B', position: 'absolute', left: '12px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B' }}>Compare With</label>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B' }}>
                  <option>Previous 30 Days</option>
                  <option>Previous Quarter</option>
                  <option>Previous Year</option>
                </select>
              </div>
              <button style={{
                height: '38px',
                padding: '0 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#2563EB',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Reset
              </button>
            </div>
          </div>

          {/* Price Summary Section */}
          <div>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E293B', display: 'block', marginBottom: '12px' }}>
              Price Summary (vs Previous 30 Days)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              
              {/* Card 1: PRICE INCREASED */}
              <div className="section-card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid #FEE2E2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <strong style={{ fontSize: '12px', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Increased (32)</strong>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #FEE2E2', textAlign: 'left', color: '#991B1B' }}>
                        <th style={{ padding: '6px 4px', fontWeight: '600' }}>Material</th>
                        <th style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>Current Avg (₹)</th>
                        <th style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>Change (₹)</th>
                        <th style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>Change (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'GI Steel Coil', avg: '72.40', change: '+11.40', percent: '+18.75%' },
                        { name: 'MS Pipe 50mm', avg: '58.20', change: '+6.30', percent: '+12.14%' },
                        { name: 'Zinc Coated Sheet', avg: '66.10', change: '+5.10', percent: '+8.37%' },
                        { name: 'Mid Clamp', avg: '24.60', change: '+0.80', percent: '+3.36%' },
                        { name: 'End Clamp', avg: '26.75', change: '+0.25', percent: '+0.94%' }
                      ].map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #FEF2F2' }}>
                          <td style={{ padding: '6px 4px', fontWeight: '500', color: '#334155' }}>{item.name}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', color: '#334155' }}>{item.avg}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '600', color: '#DC2626' }}>{item.change}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '600', color: '#DC2626' }}>{item.percent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <a href="#" style={{ fontSize: '11px', color: '#2563EB', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all 32 increased items &rarr;
                </a>
              </div>

              {/* Card 2: PRICE DECREASED */}
              <div className="section-card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid #DCFCE7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <strong style={{ fontSize: '12px', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Decreased (14)</strong>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #DCFCE7', textAlign: 'left', color: '#166534' }}>
                        <th style={{ padding: '6px 4px', fontWeight: '600' }}>Material</th>
                        <th style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>Current Avg (₹)</th>
                        <th style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>Change (₹)</th>
                        <th style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>Change (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Aluminium Rail 4.2m', avg: '105.80', change: '-8.15', percent: '-7.32%' },
                        { name: 'Aluminium Rail 3.6m', avg: '93.20', change: '-6.90', percent: '-6.90%' },
                        { name: 'DC Cable 4 Sqmm', avg: '42.50', change: '-2.40', percent: '-5.33%' },
                        { name: 'ACDB Box', avg: '18.60', change: '-0.80', percent: '-4.12%' },
                        { name: 'MC4 Connector', avg: '15.20', change: '-0.40', percent: '-2.56%' }
                      ].map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F0FDF4' }}>
                          <td style={{ padding: '6px 4px', fontWeight: '500', color: '#334155' }}>{item.name}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', color: '#334155' }}>{item.avg}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '600', color: '#16A34A' }}>{item.change}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '600', color: '#16A34A' }}>{item.percent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <a href="#" style={{ fontSize: '11px', color: '#16A34A', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all 14 decreased items &rarr;
                </a>
              </div>

              {/* Card 3: NO CHANGE */}
              <div className="section-card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid #FFEDD5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <strong style={{ fontSize: '12px', color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>No Change (9)</strong>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #FFEDD5', textAlign: 'left', color: '#9A3412' }}>
                        <th style={{ padding: '6px 4px', fontWeight: '600' }}>Material</th>
                        <th style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>Current Avg (₹)</th>
                        <th style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>Change (₹)</th>
                        <th style={{ padding: '6px 4px', fontWeight: '600', textAlign: 'right' }}>Change (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'L-Foot', avg: '64.00', change: '0.00', percent: '0.00%' },
                        { name: 'Spring Washer M8', avg: '41.00', change: '0.00', percent: '0.00%' },
                        { name: 'Plain Washer M8', avg: '18.00', change: '0.00', percent: '0.00%' },
                        { name: 'Nut M8', avg: '3.50', change: '0.00', percent: '0.00%' },
                        { name: 'Anchor Fastener', avg: '12.00', change: '0.00', percent: '0.00%' }
                      ].map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #FFF7ED' }}>
                          <td style={{ padding: '6px 4px', fontWeight: '500', color: '#334155' }}>{item.name}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', color: '#334155' }}>{item.avg}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', color: '#64748B' }}>{item.change}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', color: '#64748B' }}>{item.percent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <a href="#" style={{ fontSize: '11px', color: '#EA580C', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all 9 items &rarr;
                </a>
              </div>

            </div>
          </div>

          {/* Historical Price Details Section */}
          <div className="section-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>Historical Price Details</strong>
                <Info style={{ width: '14px', height: '14px', color: '#94A3B8' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Group by:</span>
                <select style={{ height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#475569' }}>
                  <option>Material</option>
                  <option>Supplier</option>
                  <option>Category</option>
                </select>
                <button style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <SlidersHorizontal style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', width: '40px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Material / SKU</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Unit</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600' }}>Supplier</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Current (01 Jul - 03 Aug 2026)</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Previous (01 Jun - 30 Jun 2026)</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'right' }}>Change (₹)</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'right' }}>Change (%)</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'right' }}>Highest Price (₹) (12 Months)</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'right' }}>Lowest Price (₹) (12 Months)</th>
                    <th style={{ padding: '10px 4px', color: '#64748B', fontWeight: '600', textAlign: 'center' }}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, name: 'Aluminium Rail 4.2m', sku: 'AL-RAIL-4.2', cat: 'Rails', unit: 'Nos', supplier: 'ABC Metals Pvt Ltd', curr: '105.80', prev: '113.95', diff: '-8.15', pct: '-7.32%', high: '124.60', low: '98.50', updated: '03 Aug 2026', positive: false },
                    { id: 2, name: 'Mid Clamp', sku: 'MC-001', cat: 'Clamps', unit: 'Nos', supplier: 'XYZ Solar Pvt Ltd', curr: '24.60', prev: '23.80', diff: '+0.80', pct: '+3.36%', high: '26.40', low: '21.10', updated: '03 Aug 2026', positive: true },
                    { id: 3, name: 'End Clamp', sku: 'EC-001', cat: 'Clamps', unit: 'Nos', supplier: 'XYZ Solar Pvt Ltd', curr: '26.75', prev: '26.50', diff: '+0.25', pct: '+0.94%', high: '28.30', low: '24.20', updated: '03 Aug 2026', positive: true },
                    { id: 4, name: 'GI Steel Coil', sku: 'GI-COIL', cat: 'Raw Material', unit: 'Kg', supplier: 'Steel Authority Ltd', curr: '72.40', prev: '61.00', diff: '+11.40', pct: '+18.75%', high: '78.50', low: '54.00', updated: '03 Aug 2026', positive: true },
                    { id: 5, name: 'GI Nut Bolt M8 x 25', sku: 'NB-M8-25', cat: 'Fasteners', unit: 'Nos', supplier: 'Fasteners India Pvt Ltd', curr: '4.10', prev: '4.00', diff: '+0.10', pct: '+2.50%', high: '4.50', low: '3.60', updated: '03 Aug 2026', positive: true },
                    { id: 6, name: 'GI Nut Bolt M10 x 30', sku: 'NB-M10-30', cat: 'Fasteners', unit: 'Nos', supplier: 'Fasteners India Pvt Ltd', curr: '6.25', prev: '6.30', diff: '-0.05', pct: '-0.79%', high: '7.20', low: '5.80', updated: '03 Aug 2026', positive: false }
                  ].map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ textAlign: 'center', padding: '12px 4px' }}>{row.id}</td>
                      <td style={{ padding: '12px 4px' }}>
                        <div style={{ fontWeight: '600', color: '#1E293B' }}>{row.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748B' }}>{row.sku}</div>
                      </td>
                      <td style={{ padding: '12px 4px', color: '#475569' }}>{row.cat}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center', color: '#64748B' }}>{row.unit}</td>
                      <td style={{ padding: '12px 4px', color: '#475569' }}>{row.supplier}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center', fontWeight: 'bold', color: '#1E293B' }}>{row.curr}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center', color: '#64748B' }}>{row.prev}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: 'bold', color: row.positive ? '#EF4444' : '#16A34A' }}>{row.diff}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: 'bold', color: row.positive ? '#EF4444' : '#16A34A' }}>{row.pct}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right', color: '#475569' }}>{row.high}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right', color: '#475569' }}>{row.low}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'center', color: '#64748B' }}>{row.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>Showing 1 to 6 of 55 items</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}>
                    <ChevronLeft style={{ width: '14px', height: '14px' }} />
                  </button>
                  {[1, 2, 3, 4].map((page) => (
                    <button key={page} style={{ 
                      width: '32px', 
                      height: '32px', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '6px', 
                      backgroundColor: page === 1 ? '#2563EB' : '#FFFFFF', 
                      color: page === 1 ? '#FFFFFF' : '#475569', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer' 
                    }}>
                      {page}
                    </button>
                  ))}
                  <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}>
                    <ChevronRight style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
                <select style={{ height: '32px', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#475569' }}>
                  <option>10 / page</option>
                </select>
              </div>
            </div>

          </div>

          {/* How it works info alert bar */}
          <div style={{ display: 'flex', gap: '10px', backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '16px', border: '1px solid #DBEAFE' }}>
            <Info style={{ width: '16px', height: '16px', color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong style={{ fontSize: '12px', color: '#1E40AF' }}>How it works?</strong>
              <span style={{ fontSize: '11px', color: '#1E40AF', lineHeight: '1.4' }}>
                Average price is calculated based on all GRN/Purchase transactions in the selected date range. Prices are compared with the previous period to identify changes.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ==================== 11.5. ITEMS DIRECTORY SCREEN ==================== */}
      {activeTab === 'Items Directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          
          {isCreatingItem ? (
            /* Dedicated Full-Screen Add New Product View Card */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0 }}>
              
              {/* Header Navigation & Actions Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: '600' }}>Items Catalog / Add New Product</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => { setIsCreatingItem(false); setCreateStatus(null); }}
                    style={{ border: '1px solid #cbd5e1', background: 'white', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProductInZoho}
                    disabled={isCreatingProduct}
                    style={{ border: 'none', background: '#2563eb', color: 'white', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: isCreatingProduct ? 0.7 : 1 }}
                  >
                    <Plus style={{ width: '15px', height: '15px' }} />
                    {isCreatingProduct ? 'Creating Product...' : 'Save Product & Sync to Zoho'}
                  </button>
                </div>
              </div>

              {/* Toast / Status banner */}
              {createStatus && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: createStatus.type === 'success' ? '#E6F7ED' : '#FEF3C7',
                  color: createStatus.type === 'success' ? '#137333' : '#92400E',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: `1px solid ${createStatus.type === 'success' ? '#A7F3D0' : '#FDE68A'}`
                }}>
                  {createStatus.text}
                </div>
              )}

              {/* Form Body Card */}
              <div className="section-card" style={{ padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Add New Product</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Enter new product details to add to Control Room and sync with Zoho Books.</span>
                </div>

                {/* Section 1: Basic Information */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>1. Basic Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Item / Product Name *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Solar Panel 540W Monocrystalline"
                        value={newItemData.name} 
                        onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>SKU / Item Code</label>
                      <input 
                        type="text" 
                        placeholder="e.g. SP-540W-MONO"
                        value={newItemData.sku} 
                        onChange={(e) => setNewItemData({ ...newItemData, sku: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Product Type</label>
                      <select
                        value={newItemData.productType}
                        onChange={(e) => setNewItemData({ ...newItemData, productType: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', outline: 'none' }}
                      >
                        <option value="goods">Goods (Physical Product)</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Catalog Status</label>
                      <select
                        value={newItemData.status}
                        onChange={(e) => setNewItemData({ ...newItemData, status: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', outline: 'none' }}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Pricing & Measurement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>2. Pricing & Measurement</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Sales Rate (₹) *</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 15000"
                        value={newItemData.rate} 
                        onChange={(e) => setNewItemData({ ...newItemData, rate: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Purchase Rate (₹)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 12000"
                        value={newItemData.purchaseRate} 
                        onChange={(e) => setNewItemData({ ...newItemData, purchaseRate: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Unit of Measurement</label>
                      <input 
                        type="text" 
                        placeholder="e.g. NOS, KG, MTR, SET"
                        value={newItemData.unit} 
                        onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Descriptions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>3. Descriptions & Remarks</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Sales Description</label>
                      <textarea 
                        value={newItemData.description} 
                        onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                        placeholder="Enter item description for sales..."
                        style={{ height: '90px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', resize: 'vertical', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Purchase Description</label>
                      <textarea 
                        value={newItemData.purchaseDescription} 
                        onChange={(e) => setNewItemData({ ...newItemData, purchaseDescription: e.target.value })}
                        placeholder="Enter item description for purchase..."
                        style={{ height: '90px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', resize: 'vertical', outline: 'none' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : editingItem ? (
            /* Dedicated Full-Screen Edit Item View Card */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0 }}>
              
              {/* Header Navigation & Actions Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: '600' }}>Items Catalog / Edit Item</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => setEditingItem(null)}
                    style={{ border: '1px solid #cbd5e1', background: 'white', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveItemToZoho}
                    disabled={isSavingItem}
                    style={{ border: 'none', background: '#2563eb', color: 'white', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSavingItem ? 0.7 : 1 }}
                  >
                    <RotateCcw style={{ width: '14px', height: '14px', animation: isSavingItem ? 'spin 1s linear infinite' : 'none' }} />
                    {isSavingItem ? 'Syncing to Zoho...' : 'Save & Sync with Zoho'}
                  </button>
                </div>
              </div>

              {/* Toast / Status banner */}
              {itemSaveStatus && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: itemSaveStatus.type === 'success' ? '#E6F7ED' : '#FEF3C7',
                  color: itemSaveStatus.type === 'success' ? '#137333' : '#92400E',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: `1px solid ${itemSaveStatus.type === 'success' ? '#A7F3D0' : '#FDE68A'}`
                }}>
                  {itemSaveStatus.text}
                </div>
              )}

              {/* Edit Form Body Card */}
              <div className="section-card" style={{ padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Edit Item — {editingItem.name || 'Material Item'}</h2>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Item ID: {editingItem.itemId || 'Local Item'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Status:</span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: editingItem.status === 'Active' ? '#E6F7ED' : '#FEE2E2',
                      color: editingItem.status === 'Active' ? '#137333' : '#EF4444'
                    }}>
                      {editingItem.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Section 1: Basic Information */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>1. Basic Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Item Name *</label>
                      <input 
                        type="text" 
                        value={editingItem.name || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>SKU / Item Code</label>
                      <input 
                        type="text" 
                        value={editingItem.sku || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Catalog Status</label>
                      <select
                        value={editingItem.status || 'Active'}
                        onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white', outline: 'none' }}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Pricing & Measurement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>2. Pricing & Measurement</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Sales Rate (₹) *</label>
                      <input 
                        type="number" 
                        value={editingItem.rate !== undefined ? editingItem.rate : ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, rate: Number(e.target.value) })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Purchase Rate (₹)</label>
                      <input 
                        type="number" 
                        value={editingItem.purchaseRate !== undefined ? editingItem.purchaseRate : ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, purchaseRate: Number(e.target.value) })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Unit of Measurement</label>
                      <input 
                        type="text" 
                        value={editingItem.unit || 'NOS'} 
                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                        style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', outline: 'none' }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Descriptions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>3. Descriptions & Remarks</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Sales Description</label>
                      <textarea 
                        value={editingItem.description || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        placeholder="Enter item description for sales orders..."
                        style={{ height: '90px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', resize: 'vertical', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Purchase Description</label>
                      <textarea 
                        value={editingItem.purchaseDescription || ''} 
                        onChange={(e) => setEditingItem({ ...editingItem, purchaseDescription: e.target.value })}
                        placeholder="Enter item description for purchase orders..."
                        style={{ height: '90px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px 12px', fontSize: '13px', resize: 'vertical', outline: 'none' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : viewingItem ? (
            /* Full Screen Item Detail View Card */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0 }}>
              
              {/* Navigation Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={() => setViewingItem(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Close
                </button>
                <div>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: viewingItem.status === 'Active' ? '#E6F7ED' : '#FEE2E2',
                    color: viewingItem.status === 'Active' ? '#137333' : '#EF4444'
                  }}>
                    {viewingItem.status}
                  </span>
                </div>
              </div>

              {/* Document Sheet Card */}
              <div className="section-card" style={{ padding: '32px', borderRadius: '16px', borderTop: '4px solid #2563EB', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* Header Information */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', margin: 0 }}>{viewingItem.name}</h3>
                    <span style={{ fontSize: '13px', color: '#64748B', display: 'block', marginTop: '6px' }}>SKU: <strong style={{ color: '#334155' }}>{viewingItem.sku}</strong></span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Product Type</span>
                    <strong style={{ fontSize: '14px', color: '#475569', textTransform: 'capitalize' }}>{viewingItem.productType}</strong>
                  </div>
                </div>

                {/* Properties Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px 24px' }}>
                  
                  {/* Column 1: Financials */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid #F1F5F9', paddingRight: '16px' }}>
                    <strong style={{ fontSize: '12px', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial Details</strong>
                    
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Sales Rate</span>
                      <strong style={{ fontSize: '15px', color: '#1E293B' }}>₹ {(viewingItem.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Purchase Rate</span>
                      <strong style={{ fontSize: '15px', color: '#1E293B' }}>₹ {(viewingItem.purchaseRate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Tax Preference</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingItem.taxName} ({viewingItem.taxPercentage}%)</strong>
                    </div>
                  </div>

                  {/* Column 2: Inventory & Stocks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid #F1F5F9', paddingRight: '16px' }}>
                    <strong style={{ fontSize: '12px', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inventory & Stock</strong>
                    
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Stock On Hand</span>
                      <strong style={{ fontSize: '15px', color: '#1E293B' }}>{viewingItem.stockOnHand}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Reorder Level</span>
                      <strong style={{ fontSize: '15px', color: '#1E293B' }}>{viewingItem.reorderLevel}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Inventory Unit</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingItem.unit}</strong>
                    </div>
                  </div>

                  {/* Column 3: Accounting Setup */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <strong style={{ fontSize: '12px', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Accounts Mapping</strong>
                    
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Sales Account</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingItem.salesAccount}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Purchase Account</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>{viewingItem.purchaseAccount}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '2px' }}>Item Class Type</span>
                      <strong style={{ fontSize: '14px', color: '#1E293B', textTransform: 'capitalize' }}>{viewingItem.itemType}</strong>
                    </div>
                  </div>

                </div>

                {/* Descriptions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', borderTop: '1px solid #F1F5F9', paddingTop: '24px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>Sales Description</span>
                    <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#334155', fontSize: '13px', lineHeight: '1.5', minHeight: '80px' }}>
                      {viewingItem.description || 'No sales description configured.'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 'bold' }}>Purchase Description</span>
                    <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#334155', fontSize: '13px', lineHeight: '1.5', minHeight: '80px' }}>
                      {viewingItem.purchaseDescription || 'No purchase description configured.'}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Standard Items List Page View */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Items & Materials Catalog</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Browse and manage your active item catalog synced with Zoho Books.</span>
                </div>
                <button
                  onClick={() => {
                    setIsCreatingItem(true);
                    setCreateStatus(null);
                  }}
                  style={{
                    height: '38px',
                    padding: '0 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Add New Product
                </button>
              </div>
              <div className="section-card" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap', alignItems: 'center' }}>
                  
                  {/* Search Input */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '260px' }}>
                    <Search style={{ width: '15px', height: '15px', color: '#94A3B8', position: 'absolute', left: '12px' }} />
                    <input 
                      type="text" 
                      placeholder="Search by Material / SKU / Code." 
                      value={itemSearchQuery}
                      onChange={(e) => { setItemSearchQuery(e.target.value); setItemsCurrentPage(1); }}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px 0 36px', fontSize: '13px', width: '100%', boxSizing: 'border-box', outline: 'none' }} 
                    />
                  </div>

                  {/* Warehouses Selector */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '160px', flexShrink: 0 }}>
                    <select 
                      value={selectedItemWarehouse}
                      onChange={(e) => { setSelectedItemWarehouse(e.target.value); setItemsCurrentPage(1); }}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B', width: '100%', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="All Warehouses">All Warehouses</option>
                      <option value="Main Warehouse">Main Warehouse</option>
                    </select>
                  </div>

                  {/* Categories Selector */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '160px', flexShrink: 0 }}>
                    <select 
                      value={selectedItemCategory}
                      onChange={(e) => { setSelectedItemCategory(e.target.value); setItemsCurrentPage(1); }}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B', width: '100%', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="All Categories">All Categories</option>
                      <option value="Goods">Goods</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>

                  {/* Status Selector */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '150px', flexShrink: 0 }}>
                    <select 
                      value={selectedItemStatus}
                      onChange={(e) => { setSelectedItemStatus(e.target.value); setItemsCurrentPage(1); }}
                      style={{ height: '38px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', fontSize: '13px', backgroundColor: '#FFFFFF', color: '#64748B', width: '100%', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="All Status">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Filters Button */}
                  <button style={{
                    height: '38px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <SlidersHorizontal style={{ width: '14px', height: '14px' }} />
                    Filters
                  </button>

                  {/* Reset Button */}
                  <span 
                    onClick={() => {
                      setItemSearchQuery('');
                      setSelectedItemWarehouse('All Warehouses');
                      setSelectedItemCategory('All Categories');
                      setSelectedItemStatus('All Status');
                      setItemsCurrentPage(1);
                    }}
                    style={{ fontSize: '13px', color: '#2563EB', fontWeight: '600', cursor: 'pointer', marginLeft: '8px', display: 'inline-flex', alignItems: 'center' }}
                  >
                    Reset
                  </span>

                </div>
              </div>

              {/* Items Table Card */}
              <div className="section-card" style={{ padding: 0, width: '100%', boxSizing: 'border-box' }}>
                <div className="table-responsive" style={{ border: 'none', borderRadius: 0, margin: 0, overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
                  <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 16px', textAlign: 'center', width: '40px' }}>
                          <input 
                            type="checkbox"
                            checked={(() => {
                              const query = itemSearchQuery.toLowerCase().trim();
                              const filtered = itemsList.filter(item => {
                                if (query) {
                                  const matchName = (item.name || '').toLowerCase().includes(query);
                                  const matchSku = (item.sku || '').toLowerCase().includes(query);
                                  const matchDesc = (item.description || '').toLowerCase().includes(query);
                                  if (!matchName && !matchSku && !matchDesc) return false;
                                }
                                if (selectedItemCategory !== 'All Categories') {
                                  const cat = selectedItemCategory.toLowerCase();
                                  if (cat === 'goods' && item.productType !== 'goods') return false;
                                  if (cat === 'services' && item.productType !== 'service' && item.productType !== 'services') return false;
                                }
                                if (selectedItemStatus !== 'All Status' && selectedItemStatus !== item.status) return false;
                                return true;
                              });
                              const indexOfLastItemRow = itemsCurrentPage * itemsRowsPerPage;
                              const indexOfFirstItemRow = indexOfLastItemRow - itemsRowsPerPage;
                              const currentItemRows = filtered.slice(indexOfFirstItemRow, indexOfLastItemRow);
                              return currentItemRows.length > 0 && currentItemRows.every(item => selectedItems.includes(item.itemId));
                            })()}
                            onChange={(e) => {
                              const query = itemSearchQuery.toLowerCase().trim();
                              const filtered = itemsList.filter(item => {
                                if (query) {
                                  const matchName = (item.name || '').toLowerCase().includes(query);
                                  const matchSku = (item.sku || '').toLowerCase().includes(query);
                                  const matchDesc = (item.description || '').toLowerCase().includes(query);
                                  if (!matchName && !matchSku && !matchDesc) return false;
                                }
                                if (selectedItemCategory !== 'All Categories') {
                                  const cat = selectedItemCategory.toLowerCase();
                                  if (cat === 'goods' && item.productType !== 'goods') return false;
                                  if (cat === 'services' && item.productType !== 'service' && item.productType !== 'services') return false;
                                }
                                if (selectedItemStatus !== 'All Status' && selectedItemStatus !== item.status) return false;
                                return true;
                              });
                              const indexOfLastItemRow = itemsCurrentPage * itemsRowsPerPage;
                              const indexOfFirstItemRow = indexOfLastItemRow - itemsRowsPerPage;
                              const currentItemRows = filtered.slice(indexOfFirstItemRow, indexOfLastItemRow);
                              if (e.target.checked) {
                                const newSelected = [...selectedItems];
                                currentItemRows.forEach(item => {
                                  if (!newSelected.includes(item.itemId)) {
                                    newSelected.push(item.itemId);
                                  }
                                });
                                setSelectedItems(newSelected);
                              } else {
                                setSelectedItems(selectedItems.filter(id => !currentItemRows.some(row => row.itemId === id)));
                              }
                            }}
                          />
                        </th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Item Name</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>SKU</th>
                        <th style={{ padding: '14px 16px', textAlign: 'right', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Rate (₹)</th>
                        <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Unit</th>
                        <th style={{ padding: '14px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Description</th>
                        <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569', fontWeight: '600', whiteSpace: 'nowrap' }}>Status</th>
                        <th style={{ padding: '14px 16px', textAlign: 'center', color: '#475569', fontWeight: '600', width: '100px', whiteSpace: 'nowrap' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const query = itemSearchQuery.toLowerCase().trim();
                        const filtered = itemsList.filter(item => {
                          if (query) {
                            const matchName = (item.name || '').toLowerCase().includes(query);
                            const matchSku = (item.sku || '').toLowerCase().includes(query);
                            const matchDesc = (item.description || '').toLowerCase().includes(query);
                            if (!matchName && !matchSku && !matchDesc) return false;
                          }
                          if (selectedItemCategory !== 'All Categories') {
                            const cat = selectedItemCategory.toLowerCase();
                            if (cat === 'goods' && item.productType !== 'goods') return false;
                            if (cat === 'services' && item.productType !== 'service' && item.productType !== 'services') return false;
                          }
                          if (selectedItemStatus !== 'All Status' && selectedItemStatus !== item.status) return false;
                          return true;
                        });
                        const indexOfLastItemRow = itemsCurrentPage * itemsRowsPerPage;
                        const indexOfFirstItemRow = indexOfLastItemRow - itemsRowsPerPage;
                        const currentItemRows = filtered.slice(indexOfFirstItemRow, indexOfLastItemRow);
                        
                        return currentItemRows.length > 0 ? (
                          currentItemRows.map((item, idx) => (
                            <tr key={item.itemId || idx} className="table-row-hover" style={{ borderBottom: idx === currentItemRows.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedItems.includes(item.itemId)}
                                  onChange={() => {
                                    if (selectedItems.includes(item.itemId)) {
                                      setSelectedItems(selectedItems.filter(id => id !== item.itemId));
                                    } else {
                                      setSelectedItems([...selectedItems, item.itemId]);
                                    }
                                  }}
                                />
                              </td>
                              <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: 'bold' }}>{item.name}</td>
                              <td style={{ padding: '14px 16px' }}>{item.sku}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500' }}>{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'center', color: '#64748b' }}>{item.unit}</td>
                              <td style={{ padding: '14px 16px' }}>
                                {item.description && item.description.length > 60 
                                  ? `${item.description.substring(0, 60)}...` 
                                  : (item.description || '')}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  backgroundColor: item.status === 'Active' ? '#E6F7ED' : '#FEE2E2',
                                  color: item.status === 'Active' ? '#137333' : '#EF4444'
                                }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveItemActionMenu(activeItemActionMenu === item.itemId ? null : item.itemId);
                                  }}
                                  style={{ display: 'inline-flex', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  <MoreVertical style={{ width: '16px', height: '16px', margin: '0 auto' }} />
                                </div>
                                {activeItemActionMenu === item.itemId && (
                                  <>
                                    <div 
                                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                                      onClick={(e) => { e.stopPropagation(); setActiveItemActionMenu(null); }}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      right: '16px',
                                      top: '36px',
                                      backgroundColor: '#FFFFFF',
                                      border: '1px solid #E2E8F0',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                      zIndex: 999,
                                      width: '120px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      padding: '4px 0'
                                    }}>
                                      <button 
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          setActiveItemActionMenu(null);
                                          try {
                                            const res = await fetch(`/api/zoho/items/${item.itemId}`);
                                            if (res.ok) {
                                              const detail = await res.json();
                                              setViewingItem(detail);
                                            } else {
                                              setViewingItem(item);
                                            }
                                          } catch (err) {
                                            console.error("Failed to load item detail from Zoho:", err);
                                            setViewingItem(item);
                                          }
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#334155', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
                                      >
                                        View Details
                                      </button>
                                      <button 
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          setActiveItemActionMenu(null);
                                          try {
                                            const res = await fetch(`/api/zoho/items/${item.itemId}`);
                                            if (res.ok) {
                                              const detail = await res.json();
                                              setEditingItem(detail);
                                            } else {
                                              setEditingItem(item);
                                            }
                                          } catch (err) {
                                            console.error("Failed to load item detail for editing:", err);
                                            setEditingItem(item);
                                          }
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#334155', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmItem(item);
                                          setActiveItemActionMenu(null);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none', background: 'none', padding: '8px 12px', fontSize: '13px', color: '#EF4444', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                              No items found in your Zoho Catalog.
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
 
                {/* Pagination footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #f1f5f9', backgroundColor: 'white' }}>
                  {(() => {
                    const query = itemSearchQuery.toLowerCase().trim();
                    const filtered = itemsList.filter(item => {
                      if (query) {
                        const matchName = (item.name || '').toLowerCase().includes(query);
                        const matchSku = (item.sku || '').toLowerCase().includes(query);
                        const matchDesc = (item.description || '').toLowerCase().includes(query);
                        if (!matchName && !matchSku && !matchDesc) return false;
                      }
                      if (selectedItemCategory !== 'All Categories') {
                        const cat = selectedItemCategory.toLowerCase();
                        if (cat === 'goods' && item.productType !== 'goods') return false;
                        if (cat === 'services' && item.productType !== 'service' && item.productType !== 'services') return false;
                      }
                      if (selectedItemStatus !== 'All Status' && selectedItemStatus !== item.status) return false;
                      return true;
                    });
                    
                    return (
                      <>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          Showing {filtered.length === 0 ? 0 : (itemsCurrentPage - 1) * itemsRowsPerPage + 1} to {Math.min(itemsCurrentPage * itemsRowsPerPage, filtered.length)} of {filtered.length} entries
                        </span>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>Rows per page:</span>
                            <select
                              value={itemsRowsPerPage}
                              onChange={(e) => { setItemsRowsPerPage(parseInt(e.target.value)); setItemsCurrentPage(1); }}
                              style={{ height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px', backgroundColor: 'white' }}
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              disabled={itemsCurrentPage === 1}
                              onClick={() => setItemsCurrentPage(itemsCurrentPage - 1)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white', cursor: itemsCurrentPage === 1 ? 'not-allowed' : 'pointer', color: itemsCurrentPage === 1 ? '#cbd5e1' : '#475569' }}
                            >
                              <ChevronLeft style={{ width: '16px', height: '16px' }} />
                            </button>
                            {(() => {
                              const totalPages = Math.ceil(filtered.length / itemsRowsPerPage);
                              let start = Math.max(1, itemsCurrentPage - 1);
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
                            })().map(pageNum => (
                              <button
                                key={pageNum}
                                onClick={() => setItemsCurrentPage(pageNum)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  border: pageNum === itemsCurrentPage ? 'none' : '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  backgroundColor: pageNum === itemsCurrentPage ? '#2563eb' : 'white',
                                  color: pageNum === itemsCurrentPage ? 'white' : '#475569',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                {pageNum}
                              </button>
                            ))}
                            <button
                              disabled={itemsCurrentPage === Math.ceil(filtered.length / itemsRowsPerPage) || Math.ceil(filtered.length / itemsRowsPerPage) === 0}
                              onClick={() => setItemsCurrentPage(itemsCurrentPage + 1)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white', cursor: itemsCurrentPage === Math.ceil(filtered.length / itemsRowsPerPage) || Math.ceil(filtered.length / itemsRowsPerPage) === 0 ? 'not-allowed' : 'pointer', color: itemsCurrentPage === Math.ceil(filtered.length / itemsRowsPerPage) || Math.ceil(filtered.length / itemsRowsPerPage) === 0 ? '#cbd5e1' : '#475569' }}
                            >
                              <ChevronRight style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}



          {/* Delete Item Confirmation Modal */}
          {deleteConfirmItem && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#0F172A' }}>Delete Item</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                  Are you sure you want to delete item <strong>{deleteConfirmItem.name}</strong>? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button 
                    onClick={() => setDeleteConfirmItem(null)}
                    style={{ border: '1px solid #cbd5e1', background: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const targetId = deleteConfirmItem.itemId || deleteConfirmItem.id || deleteConfirmItem.sku || deleteConfirmItem.name;
                      setItemsList(prev => prev.filter(it => it.itemId !== deleteConfirmItem.itemId));
                      setDeleteConfirmItem(null);

                      if (targetId) {
                        fetch(`/api/zoho/items/${encodeURIComponent(targetId)}`, { method: 'DELETE' })
                          .then(res => res.json())
                          .then(data => {
                            console.log('Item deleted from Zoho & Control Room:', data);
                            fetchItems();
                          })
                          .catch(err => console.error('Failed to delete item in backend:', err));
                      }
                    }}
                    style={{ border: 'none', background: '#EF4444', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 12. REPORTS SCREENS ==================== */}
      {(activeTab === 'Procurement Reports' || activeTab === 'Spend Reports' || activeTab === 'Supplier Reports') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{activeTab} Panel</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Filter, configure date benchmarks, and export ledger sheets to Excel or PDF format</span>
          </div>

          <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <strong style={{ fontSize: '14px' }}>Configure Export Parameters</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Start Date</label>
                <input type="date" defaultValue="2026-07-01" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>End Date</label>
                <input type="date" defaultValue="2026-07-31" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Export Format</label>
                <select style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', backgroundColor: 'white' }}>
                  <option>Excel Spreadsheet (.xlsx)</option>
                  <option>CSV Format (.csv)</option>
                  <option>Acrobat Document (.pdf)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                Compile & Export Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 13. SETTINGS SCREENS ==================== */}
      {(activeTab === 'Procurement Settings' || activeTab === 'Approval Workflows') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{activeTab} Management</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Setup corporate preferences and authority hierarchies</span>
          </div>

          {activeTab === 'Procurement Settings' ? (
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <strong style={{ fontSize: '14px' }}>System Preferences</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Corporate Entity Name</label>
                  <input type="text" defaultValue="ARMS AI Pvt Ltd" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>System Notification Email</label>
                  <input type="email" defaultValue="procurements@armsai.com" style={{ height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                  Save Preferences
                </button>
              </div>
            </div>
          ) : (
            <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <strong style={{ fontSize: '14px' }}>PO Authorization Hierarchy Workflows</strong>
              <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div>
                  <strong style={{ display: 'block', color: '#0f172a' }}>Rule 1: Lower Threshold POs</strong>
                  <span style={{ color: '#64748b' }}>Values &lt; ₹50,000.00: Auto-approved, notification dispatched to Purchaser.</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: '#0f172a' }}>Rule 2: Executive CEO Review</strong>
                  <span style={{ color: '#64748b' }}>Values &ge; ₹50,000.00: Assigned to **Velmurugan Rathinam (CEO)** for mandatory digital approval.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}



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
              fontSize: '11px',
              color: '#B45309',
              lineHeight: '1.4'
            }}>
              ⚠️ This action cannot be undone. Cumulative received quantities on the associated Purchase Order will be restored.
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
    </div>
  );
}
