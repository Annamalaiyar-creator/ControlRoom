import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText, Plus, Search, Eye, Share2, MessageSquare, Download, Check,
  Building2, Printer, X, DollarSign, Calendar, Tag, ChevronRight,
  RotateCcw, Edit3, Trash2, CheckCircle, Clock, AlertCircle, Layers,
  Truck, ArrowRight, Copy, RefreshCw, Send, Mail, Boxes, User, Landmark
} from 'lucide-react';
import { VRM_HDG_PRESETS, getAllActivePresets } from '../../vrmHdgProposalPresets';
import SearchablePresetSelector from '../SearchablePresetSelector';

const QUOTATION_TERMS_PRESETS = [
  {
    key: 'standard_mms',
    label: 'Standard Solar MMS',
    text: `1. Validity: This quotation is valid for 15 days from the proposal date. Raw material price escalation clause applies thereafter.
2. Payment Terms: 50% advance along with confirmed Purchase Order / PI approval, balance 50% prior to material dispatch from our manufacturing facility.
3. Delivery Timeline: Dispatch within 7 to 10 working days from receipt of advance payment and approved engineering drawings.
4. Taxes & Duties: GST 18% is applicable as per Govt. statutory norms and charged extra.
5. Structural Warranty: 10 Years limited warranty against manufacturing defects for Aluminium 6063 T6 anodized rails & SS304 hardware.
6. Freight & Transit: Freight charges on to-pay basis or as agreed. Transit insurance by consignee. Unloading at site is in customer's scope.`
  },
  {
    key: 'aluminium_rails',
    label: 'Aluminium Rooftop Rails',
    text: `1. Scope: Supply of high-strength Aluminium 6063 T6 anodized rails, end clamps, mid clamps, and SS304 fasteners as per quotation scope.
2. Price Validity: Offer valid for 15 days from quote date.
3. Payment Terms: 50% advance along with PO, 50% against proforma invoice before dispatch.
4. Delivery: Within 5 to 7 days from advance receipt.
5. Quality & Warranty: Anodized coating 15+ microns, 10 Years warranty against structural corrosion.
6. Freight: Ex-works Chennai / freight to-pay basis. Unloading and site storage in buyer's scope.`
  },
  {
    key: 'hdg_ground',
    label: 'HDG Ground Mounting',
    text: `1. Material Specification: Hot Dip Galvanized (HDG) steel structures with minimum 80 microns coating conforming to IS 4759.
2. Validity: 10 days validity due to steel raw material market fluctuations.
3. Payment: 40% advance with order, 50% against readiness of material before dispatch, 10% on delivery.
4. Fabrication & Delivery: 15 to 20 working days based on project schedule and approved structure drawings.
5. Inspection: Factory inspection allowed before dispatch with prior intimation.
6. Freight & Insurance: Transportation arranged to project site on agreed freight terms; transit insurance in buyer's scope.`
  },
  {
    key: 'tin_shed',
    label: 'Tin Shed Industrial Kits',
    text: `1. Solution: Non-penetrative / penetrative tin shed mini rails, EPDM rubber gaskets, self-drilling screws, and clamp accessories.
2. Price Validity: 15 days from date of issue.
3. Payment Terms: 100% advance payment prior to dispatch.
4. Delivery Period: 3 to 5 business days from payment confirmation.
5. Testing & Warranty: Wind speed tested up to 170 km/h, 10 Years performance warranty.
6. Transportation: Dispatch via local transport / courier; freight paid by customer.`
  },
  {
    key: 'credit_30',
    label: '30 Days Credit (Approved EPC)',
    text: `1. Payment Terms: 30 days credit from the date of site delivery and original invoice submission.
2. Quotation Validity: Valid for 30 days from proposal date.
3. Delivery: Guaranteed dispatch within 7 to 10 days of formal PO issuance.
4. Statutory Taxes: GST 18% applicable as extra.
5. Warranty & Replacement: 10 Years manufacturer structural warranty. Any transit damaged goods replaced free of cost within 7 days.
6. Site Unloading: Consignee / client scope.`
  }
];

const QUOTE_SENDING_TEMPLATES = [
  {
    key: 'official_intro',
    title: 'Official Commercial Proposal',
    channel: 'Both',
    subject: 'Commercial Quotation for Solar MMS — {{quoteNumber}} | VRM Structures',
    body: `Dear {{customerName}},

Greetings from VRM Structures India Pvt Ltd.

Thank you for your interest in our precision-engineered solar module mounting structures. We are pleased to present our official commercial proposal #{{quoteNumber}} dated {{quoteDate}} for your project requirement:

• Project / Scope: {{structureType}} ({{capacityKw}} kW)
• Quotation Total: {{formattedTotal}} (inclusive of taxes)
• Validity: {{validityDays}} days from proposal date
• Delivery Timeline: 7–10 working days from PO & advance payment

Attached / enclosed please find the itemized quotation along with our structural drawings and structural warranty certificate. 

Please review and feel free to revert if you require any technical adjustments or revisions. We look forward to partnering with your esteemed organization.

Warm regards,
{{salesRep}}
Sales & Engineering Division
VRM Structures India Pvt Ltd
Phone: +91 98400 12345 | sales@vrmstructures.com`
  },
  {
    key: 'quick_whatsapp',
    title: 'Quick WhatsApp Summary',
    channel: 'WhatsApp',
    subject: 'Quotation {{quoteNumber}} — VRM Structures',
    body: `Hi {{customerName}},

Greetings from VRM Structures.

Please find our commercial quotation *#{{quoteNumber}}* for your *{{structureType}}* requirement:

*Grand Total:* {{formattedTotal}}
*Scope:* {{itemCount}} line items ({{capacityKw}} kW capacity)
*Validity:* {{validityDays}} days
*Lead Time:* 7–10 days from drawing approval & advance

Detailed quotation PDF and drawing sheets are ready for your review. Would you like to schedule a quick 5-minute call today to go over any questions?

Best regards,
*{{salesRep}}* | VRM Structures`
  },
  {
    key: 'revision_update',
    title: 'Quotation Revision Notice',
    channel: 'Both',
    subject: 'Revised Quotation {{quoteNumber}} (Rev #{{revCount}}) — VRM Structures',
    body: `Dear {{customerName}},

Hope you are having a productive week.

As per your latest technical feedback and updated site requirements, we have revised commercial quotation #{{quoteNumber}} (Revision #{{revCount}}).

Key updates made:
• Revised Scope: {{structureType}}
• Revised Total: {{formattedTotal}}
• Payment Terms: {{paymentTerms}}

The updated quotation sheet has been generated for your final clearance. Please let us know if everything is in order to issue the Proforma Invoice (PI) and lock production slots.

Warm regards,
{{salesRep}}
VRM Structures India Pvt Ltd`
  },
  {
    key: 'urgent_approval',
    title: 'Price Validity & Fast-Track Lead',
    channel: 'Both',
    subject: 'Urgent: Quotation {{quoteNumber}} Price Lock Confirmation — VRM Structures',
    body: `Dear {{customerName}},

Regarding quotation #{{quoteNumber}} for {{structureType}} (Amount: {{formattedTotal}}), this is a friendly reminder that raw material price validity is active for this week.

To secure this pricing and ensure our priority manufacturing dispatch within 7 days, kindly confirm your approval so we can release the Proforma Invoice (PI) today.

Thank you for your continued trust in VRM Structures.

Best regards,
{{salesRep}}
VRM Structures India Pvt Ltd`
  }
];

export default function CrmQuotationsView({
  quotations = [],
  onSaveQuotation,
  onNavigateTab,
  onOpenWhatsAppChat,
  userRole = 'Sales Executive'
}) {
  // Search & Filter states matching BOM page
  const [searchQueryText, setSearchQueryText] = useState('');
  const [filterDateVal, setFilterDateVal] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('All');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & Forms
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showBOMQuoteForm, setShowBOMQuoteForm] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [revisionCount, setRevisionCount] = useState(0);

  // Quote Sending Template Modal State
  const [sendQuoteModalData, setSendQuoteModalData] = useState(null);
  const [sendChannel, setSendChannel] = useState('WhatsApp'); // 'WhatsApp' | 'Email'
  const [activeSendTemplateKey, setActiveSendTemplateKey] = useState('quick_whatsapp');
  const [editableEmailSubject, setEditableEmailSubject] = useState('');
  const [editableMessageBody, setEditableMessageBody] = useState('');
  const [recipientContact, setRecipientContact] = useState('');

  // Notification / Conversion toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Preset Selection in Quote Creation
  const [selectedPreset, setSelectedPreset] = useState('');
  const [activePresetsMap, setActivePresetsMap] = useState(() => getAllActivePresets());
  const [presetSetCount, setPresetSetCount] = useState(1);
  const [selectedItemIndexes, setSelectedItemIndexes] = useState([]);

  useEffect(() => {
    const handlePresetUpdate = (e) => {
      if (e.detail) setActivePresetsMap(e.detail);
    };
    window.addEventListener('vrm_presets_updated', handlePresetUpdate);
    return () => window.removeEventListener('vrm_presets_updated', handlePresetUpdate);
  }, []);

  // Resolve currently logged in account user's name dynamically (matching Header & auth state)
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

  // Full BOM-style Quote Form state
  const [quoteCode, setQuoteCode] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntilDate, setValidUntilDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
  const [salesPerson, setSalesPerson] = useState(getActiveUserName());

  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [structureType, setStructureType] = useState('Aluminium Rooftop Rails (6063 T6)');
  const [capacityKw, setCapacityKw] = useState('');

  // Addresses
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPincode, setBillingPincode] = useState('');

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');

  // Line items
  const [quoteItems, setQuoteItems] = useState([]);

  // Transport & Logistics
  const [transportMode, setTransportMode] = useState('');
  const [transporterName, setTransporterName] = useState('');

  // Terms & Conditions Preset & Custom State (Matching PO format)
  const [selectedTermsPreset, setSelectedTermsPreset] = useState('');
  const [terms, setTerms] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  // Normalizing quotations
  const normalizedQuotes = useMemo(() => {
    if (!Array.isArray(quotations)) return [];
    return quotations.filter(Boolean).map(q => {
      const code = q.quoteNumber || q.id || 'QT-UNKNOWN';
      const date = q.date || (q.createdAt ? q.createdAt.split('T')[0] : '2026-09-04');
      const customer = q.customerName || q.companyName || q.customer || 'Unknown Customer';
      const structure = q.structureType || (q.items && q.items[0]?.name) || (q.items && q.items[0]?.description) || 'Mounting System';
      const rep = (q.salesPerson || q.salesperson || q.salesRep || getActiveUserName()).toString().replace(/\s*\([^)]*\)/g, '').trim();
      const grandTotalVal = Number(q.totalAmount ?? q.grandTotal ?? 0) || 0;
      const status = q.status || 'Draft';
      const revCount = q.revisionCount || 0;

      let stBg = '#eff6ff';
      let stFg = '#1d4ed8';
      let stBorder = '1px solid #bfdbfe';

      if (status === 'Draft') {
        stBg = '#fff7ed';
        stFg = '#c2410c';
        stBorder = '1px solid #fed7aa';
      } else if (status === 'Sent') {
        stBg = '#dcfce7';
        stFg = '#166534';
        stBorder = '1px solid #bbf7d0';
      } else if (status === 'Accepted') {
        stBg = '#ecfdf5';
        stFg = '#059669';
        stBorder = '1px solid #a7f3d0';
      } else if (status === 'Revised') {
        stBg = '#fef3c7';
        stFg = '#b45309';
        stBorder = '1px solid #fde68a';
      } else if (status === 'Converted to PI' || status === 'PI Generated') {
        stBg = '#f0fdfa';
        stFg = '#0e7490';
        stBorder = '1px solid #a5f3fc';
      } else if (status === 'Cancelled' || status === 'Rejected') {
        stBg = '#fef2f2';
        stFg = '#b91c1c';
        stBorder = '1px solid #fca5a5';
      }

      return {
        ...q,
        code,
        date,
        customer,
        structure,
        salesRep: rep,
        numericTotal: grandTotalVal,
        formattedTotal: `₹ ${grandTotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        status,
        revCount,
        stBg,
        stFg,
        stBorder
      };
    });
  }, [quotations]);

  // Page config
  const pageConfig = useMemo(() => {
    return {
      title: 'Solar Structure Quotations',
      subtitle: 'Commercial proposals, structure scope estimations, and formal client quotations',
      actionText: 'New Quotation',
      searchPlaceholder: 'Search Quotations (Quote #, Customer Name, Structure Scope)...',
      tabs: [
        { id: 'All', label: 'All Quotations', count: normalizedQuotes.length, bg: '#e2e8f0', fg: '#475569' },
        { id: 'Draft', label: 'Draft', count: normalizedQuotes.filter(q => q.status === 'Draft').length, bg: '#fff7ed', fg: '#c2410c' },
        { id: 'Sent', label: 'Sent', count: normalizedQuotes.filter(q => q.status === 'Sent').length, bg: '#dcfce7', fg: '#166534' },
        { id: 'Revised', label: 'Revised', count: normalizedQuotes.filter(q => q.status === 'Revised').length, bg: '#fef3c7', fg: '#b45309' },
        { id: 'Converted to PI', label: 'Converted to PI', count: normalizedQuotes.filter(q => q.status === 'Converted to PI' || q.status === 'PI Generated').length, bg: '#f0fdfa', fg: '#0e7490' },
        { id: 'Accepted', label: 'Accepted', count: normalizedQuotes.filter(q => q.status === 'Accepted').length, bg: '#ecfdf5', fg: '#059669' }
      ]
    };
  }, [normalizedQuotes]);

  // Filtering
  const filteredRows = useMemo(() => {
    return normalizedQuotes.filter(r => {
      const qText = searchQueryText.toLowerCase().trim();
      const matchesSearch = !qText ||
        (r.code && r.code.toLowerCase().includes(qText)) ||
        (r.customer && r.customer.toLowerCase().includes(qText)) ||
        (r.structure && r.structure.toLowerCase().includes(qText)) ||
        (r.salesRep && r.salesRep.toLowerCase().includes(qText));

      const matchesDate = !filterDateVal || (r.date && r.date.startsWith(filterDateVal));

      const subTab = activeSubTab.toLowerCase();
      const rStatus = (r.status || '').toLowerCase();
      const matchesTab = subTab === 'all' || subTab === 'all quotations' || rStatus === subTab || (subTab === 'converted to pi' && (rStatus === 'converted to pi' || rStatus === 'pi generated'));

      return matchesSearch && matchesDate && matchesTab;
    });
  }, [normalizedQuotes, searchQueryText, filterDateVal, activeSubTab]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);

  // Row selection handler
  const handleSelectRow = (code) => {
    setSelectedRows(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredRows.map(r => r.code));
    } else {
      setSelectedRows([]);
    }
  };

  // Financial calculations
  const calculateTotals = () => {
    let sub = 0;
    let gstSum = 0;
    (quoteItems || []).forEach(item => {
      const q = parseFloat(item.qty) || 0;
      const r = parseFloat(item.rate) || 0;
      const lineTaxable = q * r;
      const gstPct = parseFloat(String(item.gstRate || '18%').replace('%', '')) || 18;
      const lineGst = lineTaxable * (gstPct / 100);
      sub += lineTaxable;
      gstSum += lineGst;
    });
    const grand = sub + gstSum;
    return {
      sub,
      gst: gstSum,
      cgst: gstSum / 2,
      sgst: gstSum / 2,
      grand
    };
  };

  const totals = calculateTotals();

  // Open Create BOM-style Quote
  const handleOpenCreateForm = () => {
    const nextCode = `QT-2026-${String(10 + quotations.length + 1)}`;
    setQuoteCode(nextCode);
    setQuoteDate(new Date().toISOString().split('T')[0]);
    setValidUntilDate(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
    setDeliveryDate(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
    setCustomerName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setGstNumber('');
    setStructureType('Aluminium Rooftop Rails (6063 T6)');
    setCapacityKw('');
    setBillingStreet('');
    setBillingCity('');
    setBillingState('');
    setBillingPincode('');
    setSameAsBilling(true);
    setDeliveryStreet('');
    setDeliveryCity('');
    setDeliveryState('');
    setDeliveryPincode('');
    setSelectedPreset('');
    setPresetSetCount(1);
    setSelectedItemIndexes([]);
    setQuoteItems([]);
    setTransportMode('');
    setTransporterName('');
    setPaymentTerms('');
    setSelectedTermsPreset('');
    setTerms('');
    setSalesPerson(getActiveUserName());
    setEditingQuoteId(null);
    setRevisionCount(0);
    setShowBOMQuoteForm(true);
  };

  // Open Edit / Revise Quote
  const handleStartEditQuote = (quote) => {
    setQuoteCode(quote.quoteNumber || quote.code || quote.id);
    setQuoteDate(quote.date || (quote.createdAt ? quote.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]));
    setValidUntilDate(quote.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
    setDeliveryDate(quote.deliveryDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
    setCustomerName(quote.customerName || quote.customer || quote.companyName || '');
    setContactPerson(quote.contactPerson || '');
    setPhone(quote.phone || '');
    setEmail(quote.email || '');
    setGstNumber(quote.gstNumber || quote.gstNo || '');
    setStructureType(quote.structureType || quote.structure || 'Aluminium Rooftop Rails (6063 T6)');
    setCapacityKw(quote.capacityKw || 100);
    setBillingStreet(quote.billingAddress || quote.address || '');
    setBillingCity(quote.city || 'Chennai');
    setBillingState(quote.state || 'Tamil Nadu');
    setBillingPincode(quote.pincode || '600001');
    setSameAsBilling(quote.sameAsBilling !== undefined ? quote.sameAsBilling : true);
    setDeliveryStreet(quote.deliveryAddress || quote.deliveryStreet || '');
    setDeliveryCity(quote.deliveryCity || 'Chennai');
    setDeliveryState(quote.deliveryState || 'Tamil Nadu');
    setDeliveryPincode(quote.deliveryPincode || '600001');
    setTransportMode(quote.transportMode || 'Transport');
    setTransporterName(quote.transporterName || 'VRL Logistics');
    setPaymentTerms(quote.paymentTerms || '50% Advance + 50% Before Dispatch');
    setTerms(quote.terms || quote.notes || QUOTATION_TERMS_PRESETS[0].text);
    setSelectedTermsPreset(quote.termsPresetKey || '');
    setSalesPerson(quote.salesPerson || quote.salesperson || quote.salesRep || getActiveUserName());
    setRevisionCount(Number(quote.revisionCount || quote.revCount || 0));

    if (Array.isArray(quote.items) && quote.items.length > 0) {
      setQuoteItems(quote.items.map(it => ({
        name: it.name || it.description || 'Solar Structure Component',
        category: it.category || 'MMS Parts',
        uom: it.uom || it.unit || 'NOS',
        qty: String(it.qty || 1),
        rate: String(it.rate || 0),
        gstRate: it.gstRate || '18%'
      })));
    } else {
      setQuoteItems([
        { name: 'Solar Mounting Structure Kit', category: 'Structure', uom: 'SET', qty: '1', rate: '25000', gstRate: '18%' }
      ]);
    }

    setEditingQuoteId(quote.id || quote.quoteNumber || quote.code);
    setShowBOMQuoteForm(true);
    setSelectedQuote(null);
  };

  // Submit / Save Quotation (with unlimited revision capability)
  const handleSaveQuotationRecord = (saveAsStatus = 'Sent') => {
    if (!customerName || !customerName.trim()) {
      alert('Please specify customer name.');
      return;
    }
    if (!quoteItems || quoteItems.length === 0) {
      alert('Please include at least one item in the quotation scope.');
      return;
    }

    const calculated = calculateTotals();
    const isEditing = Boolean(editingQuoteId);
    const newRevCount = isEditing ? revisionCount + 1 : 0;
    const finalStatus = isEditing && saveAsStatus !== 'Draft' ? 'Revised' : saveAsStatus;

    const record = {
      id: quoteCode,
      quoteNumber: quoteCode,
      code: quoteCode,
      date: quoteDate,
      validUntil: validUntilDate,
      deliveryDate,
      customerName: customerName.trim(),
      companyName: customerName.trim(),
      contactPerson,
      phone,
      email,
      gstNumber,
      gstNo: gstNumber,
      structureType,
      capacityKw,
      billingAddress: billingStreet,
      city: billingCity,
      state: billingState,
      pincode: billingPincode,
      sameAsBilling,
      deliveryAddress: sameAsBilling ? billingStreet : deliveryStreet,
      deliveryCity: sameAsBilling ? billingCity : deliveryCity,
      deliveryState: sameAsBilling ? billingState : deliveryState,
      deliveryPincode: sameAsBilling ? billingPincode : deliveryPincode,
      items: quoteItems.map(it => ({
        ...it,
        description: it.name,
        amount: (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0)
      })),
      salesperson: salesPerson,
      salesPerson: salesPerson,
      subtotal: calculated.sub,
      taxableAmount: calculated.sub,
      discountTotal: 0,
      gstTotal: calculated.gst,
      cgst: calculated.cgst,
      sgst: calculated.sgst,
      grandTotal: calculated.grand,
      totalAmount: calculated.grand,
      status: finalStatus,
      revisionCount: newRevCount,
      transportMode,
      transporterName,
      paymentTerms,
      terms,
      termsPresetKey: selectedTermsPreset,
      notes: terms,
      updatedAt: new Date().toISOString(),
      createdAt: isEditing ? (quotations.find(q => (q.quoteNumber || q.id) === editingQuoteId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    if (onSaveQuotation) {
      onSaveQuotation(record);
    } else {
      // Local fallback persistence
      const currentList = JSON.parse(localStorage.getItem('controlroom_crm_quotations') || '[]');
      const filtered = currentList.filter(q => (q.quoteNumber || q.id) !== record.id);
      const updated = [record, ...filtered];
      localStorage.setItem('controlroom_crm_quotations', JSON.stringify(updated));
    }

    showToast(isEditing ? `Quotation ${record.quoteNumber} revised successfully! (Rev #${newRevCount})` : `Quotation ${record.quoteNumber} created successfully!`);
    setShowBOMQuoteForm(false);
  };

  // Convert Quotation directly to Proforma Invoice (PI)
  const handleConvertToPI = (quote) => {
    if (!quote) return;

    // 1. Generate Next Sales PI Number
    const existingPIs = JSON.parse(localStorage.getItem('controlroom_sales_pi_store') || '[]');
    const nextPiIndex = existingPIs.length + 101;
    const piNumber = `SPI-2026-${nextPiIndex}`;

    // 2. Prepare items and amounts
    const cleanAmount = Number(quote.grandTotal || quote.totalAmount || quote.numericTotal || 0);
    const firstItem = (quote.items && quote.items[0]) || {};
    const totalQty = (quote.items || []).reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0) || 1;

    const newPI = {
      piNo: piNumber,
      sourceQuoteNo: quote.code || quote.quoteNumber,
      vendor: quote.customer || quote.customerName || quote.companyName || 'Customer Client',
      gstNo: quote.gstNumber || quote.gstNo || '33AAAAA0000A1Z5',
      productName: quote.structure || quote.structureType || firstItem.name || 'Solar Mounting Rails & Components',
      unitValue: cleanAmount > 0 && totalQty > 0 ? Math.round(cleanAmount / totalQty) : cleanAmount,
      quantity: totalQty,
      amount: `₹${cleanAmount.toLocaleString('en-IN')}`,
      pdfName: `sales_pi_${(quote.customer || 'client').toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      piDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      expDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Pending Approval',
      statusType: 'pending',
      type: 'Sales PI',
      items: (quote.items || []).map(it => ({
        name: it.name || it.description,
        category: it.category || 'MMS Scope',
        uom: it.uom || it.unit || 'NOS',
        qty: String(it.qty || 1),
        rate: String(it.rate || 0),
        gstRate: it.gstRate || '18%'
      })),
      notes: `Generated automatically from Quotation ${quote.code || quote.quoteNumber}. Unlimited revisions kept in quotation history.`
    };

    // 3. Save to sales PI store
    const updatedPIs = [newPI, ...existingPIs.filter(p => p.piNo !== piNumber)];
    localStorage.setItem('controlroom_sales_pi_store', JSON.stringify(updatedPIs));

    // 4. Mark quotation status as 'Converted to PI'
    const updatedQuote = {
      ...quote,
      status: 'Converted to PI',
      convertedPiNo: piNumber,
      convertedAt: new Date().toISOString()
    };
    if (onSaveQuotation) {
      onSaveQuotation(updatedQuote);
    } else {
      const currentList = JSON.parse(localStorage.getItem('controlroom_crm_quotations') || '[]');
      const updated = currentList.map(q => (q.quoteNumber || q.id) === (quote.quoteNumber || quote.id) ? updatedQuote : q);
      localStorage.setItem('controlroom_crm_quotations', JSON.stringify(updated));
    }

    // 5. Notify & offer navigation to Performa Invoice tab
    showToast(`Quotation ${quote.code || quote.quoteNumber} converted to Proforma Invoice (${piNumber})!`);
    if (selectedQuote) setSelectedQuote(null);

    // Provide immediate navigation prompt
    const goToPi = window.confirm(`Quotation successfully converted to PI (${piNumber})!\n\nWould you like to open the Performa Invoices page to view and track it now?`);
    if (goToPi && onNavigateTab) {
      onNavigateTab('Performa Invoice');
    }
  };

  // Prepare and open Send Quotation Template Modal
  const handleOpenSendQuoteModal = (quote, channel = 'WhatsApp') => {
    if (!quote) return;
    const defaultTemplateKey = channel === 'WhatsApp' ? 'quick_whatsapp' : 'official_intro';
    const tmpl = QUOTE_SENDING_TEMPLATES.find(t => t.key === defaultTemplateKey) || QUOTE_SENDING_TEMPLATES[0];

    // Compute template replacements
    const custName = quote.customer || quote.customerName || quote.companyName || 'Valued Customer';
    const qNum = quote.code || quote.quoteNumber || 'QT-2026';
    const qDate = quote.date || (quote.createdAt ? quote.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    const struct = quote.structure || quote.structureType || 'Solar MMS Rails & Clamps';
    const kw = quote.capacityKw || '100';
    const total = quote.formattedTotal || `₹ ${Number(quote.grandTotal || quote.totalAmount || 0).toLocaleString('en-IN')}`;
    const itemsCount = (quote.items && quote.items.length) || 1;
    const rep = quote.salesRep || quote.salesPerson || quote.salesperson || getActiveUserName();
    const payTerms = quote.paymentTerms || '50% Advance + 50% Before Dispatch';
    const rev = quote.revCount || quote.revisionCount || 0;

    const fillVars = (txt) => {
      return (txt || '')
        .replace(/\{\{customerName\}\}/g, custName)
        .replace(/\{\{quoteNumber\}\}/g, qNum)
        .replace(/\{\{quoteDate\}\}/g, qDate)
        .replace(/\{\{structureType\}\}/g, struct)
        .replace(/\{\{capacityKw\}\}/g, String(kw))
        .replace(/\{\{formattedTotal\}\}/g, total)
        .replace(/\{\{itemCount\}\}/g, String(itemsCount))
        .replace(/\{\{validityDays\}\}/g, '15')
        .replace(/\{\{salesRep\}\}/g, rep)
        .replace(/\{\{paymentTerms\}\}/g, payTerms)
        .replace(/\{\{revCount\}\}/g, String(rev));
    };

    setSendQuoteModalData(quote);
    setSendChannel(channel);
    setActiveSendTemplateKey(tmpl.key);
    setEditableEmailSubject(fillVars(tmpl.subject));
    setEditableMessageBody(fillVars(tmpl.body));
    setRecipientContact(channel === 'WhatsApp' ? (quote.phone || '+91 98765 43210') : (quote.email || 'procurement@client.com'));
  };

  // Switch template inside modal and re-fill placeholders
  const handleSelectSendTemplate = (tmplKey) => {
    setActiveSendTemplateKey(tmplKey);
    const tmpl = QUOTE_SENDING_TEMPLATES.find(t => t.key === tmplKey);
    if (!tmpl || !sendQuoteModalData) return;

    const quote = sendQuoteModalData;
    const custName = quote.customer || quote.customerName || quote.companyName || 'Valued Customer';
    const qNum = quote.code || quote.quoteNumber || 'QT-2026';
    const qDate = quote.date || (quote.createdAt ? quote.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    const struct = quote.structure || quote.structureType || 'Solar MMS Rails & Clamps';
    const kw = quote.capacityKw || '100';
    const total = quote.formattedTotal || `₹ ${Number(quote.grandTotal || quote.totalAmount || 0).toLocaleString('en-IN')}`;
    const itemsCount = (quote.items && quote.items.length) || 1;
    const rep = quote.salesRep || quote.salesPerson || quote.salesperson || getActiveUserName();
    const payTerms = quote.paymentTerms || '50% Advance + 50% Before Dispatch';
    const rev = quote.revCount || quote.revisionCount || 0;

    const fillVars = (txt) => {
      return (txt || '')
        .replace(/\{\{customerName\}\}/g, custName)
        .replace(/\{\{quoteNumber\}\}/g, qNum)
        .replace(/\{\{quoteDate\}\}/g, qDate)
        .replace(/\{\{structureType\}\}/g, struct)
        .replace(/\{\{capacityKw\}\}/g, String(kw))
        .replace(/\{\{formattedTotal\}\}/g, total)
        .replace(/\{\{itemCount\}\}/g, String(itemsCount))
        .replace(/\{\{validityDays\}\}/g, '15')
        .replace(/\{\{salesRep\}\}/g, rep)
        .replace(/\{\{paymentTerms\}\}/g, payTerms)
        .replace(/\{\{revCount\}\}/g, String(rev));
    };

    setEditableEmailSubject(fillVars(tmpl.subject));
    setEditableMessageBody(fillVars(tmpl.body));
  };

  // Handle Send Quote execution
  const handleExecuteSendQuote = () => {
    if (!sendQuoteModalData) return;
    const quote = sendQuoteModalData;

    if (sendChannel === 'WhatsApp') {
      const cleanPhone = (recipientContact || '').replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(editableMessageBody);
      const whatsappUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodedMsg}`
        : `https://wa.me/?text=${encodedMsg}`;

      // Open WhatsApp web / app
      window.open(whatsappUrl, '_blank');
      showToast(`Quotation ${quote.code || quote.quoteNumber} dispatched via WhatsApp!`);
    } else {
      // Email via mailto
      const mailtoUrl = `mailto:${recipientContact || ''}?subject=${encodeURIComponent(editableEmailSubject)}&body=${encodeURIComponent(editableMessageBody)}`;
      window.location.href = mailtoUrl;
      showToast(`Email client opened for ${recipientContact || 'customer'}!`);
    }

    // Update status to 'Sent' if it was draft
    if (quote.status === 'Draft') {
      const updatedQuote = { ...quote, status: 'Sent' };
      if (onSaveQuotation) {
        onSaveQuotation(updatedQuote);
      } else {
        const currentList = JSON.parse(localStorage.getItem('controlroom_crm_quotations') || '[]');
        const updated = currentList.map(q => (q.quoteNumber || q.id) === (quote.quoteNumber || quote.id) ? updatedQuote : q);
        localStorage.setItem('controlroom_crm_quotations', JSON.stringify(updated));
      }
    }

    setSendQuoteModalData(null);
  };

  // Add Item Row
  const handleAddItemRow = () => {
    setQuoteItems(prev => [
      ...prev,
      { name: '', category: 'Mounting Components', uom: 'NOS', qty: '1', rate: '0', gstRate: '18%' }
    ]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (idx) => {
    setQuoteItems(prev => prev.filter((_, i) => i !== idx));
  };

  // =========================================================================
  // VIEW 1: FULL BOM-STYLE QUOTATION CREATION / EDITING FORM
  // =========================================================================
  if (showBOMQuoteForm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '16px', boxSizing: 'border-box' }}>
        
        {/* Top Banner Matching BOM Page */}
        <div style={{
          background: 'linear-gradient(135deg, #0E7490 0%, #155E75 100%)',
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
              <FileText style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
                  {editingQuoteId ? 'Revise Commercial Quotation' : 'Create Solar Structure Quotation'}
                </h1>
                {revisionCount > 0 && (
                  <span style={{ backgroundColor: '#F59E0B', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>
                    Rev #{revisionCount}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: '#CFFAFE', margin: '4px 0 0 0' }}>
                Configure client scope, select preset structure kits, edit line items freely without counting limits, and generate official proposal
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={() => setShowBOMQuoteForm(false)}
              style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#FFFFFF', cursor: 'pointer', backdropFilter: 'blur(4px)', whiteSpace: 'nowrap' }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveQuotationRecord('Draft')}
              style={{ border: 'none', background: '#FFFFFF', color: '#0E7490', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}
            >
              <FileText style={{ width: '15px', height: '15px' }} />
              Save as Draft
            </button>
            <button
              onClick={() => handleSaveQuotationRecord('Sent')}
              style={{ border: 'none', background: '#10B981', color: 'white', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              <span>{editingQuoteId ? 'Save & Send Revision →' : 'Create Quotation →'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: QUOTATION & ORDER INFORMATION */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
              1
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              QUOTATION INFORMATION
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Quote Date</label>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#334155', backgroundColor: '#FFFFFF', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Valid Until <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                value={validUntilDate}
                onChange={(e) => setValidUntilDate(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0F172A', backgroundColor: 'white', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Quote Reference No.</label>
              <input
                type="text"
                value={quoteCode}
                readOnly
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', color: '#0E7490', backgroundColor: '#F0FDFA', fontWeight: '800', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                Sales Representative <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={salesPerson}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0 14px', fontSize: '13px', fontWeight: '700', color: '#475569', backgroundColor: '#F1F5F9', cursor: 'not-allowed', boxSizing: 'border-box', outline: 'none' }}
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
              CUSTOMER INFORMATION & SCOPE
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Customer / Company Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Vikram Solar Ltd / Apex Infra"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontWeight: '600' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Phone / WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Customer GST Number
              </label>
              <input
                type="text"
                placeholder="33AAAAA0000A1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '13px', textTransform: 'uppercase', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Plant Capacity (kW)
              </label>
              <input
                type="number"
                value={capacityKw}
                onChange={(e) => setCapacityKw(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '0 14px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          </div>

          {/* Billing & Delivery Address Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
            <div style={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 style={{ width: '16px', height: '16px', color: '#0E7490' }} />
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Billing Address</h4>
              </div>
              <input
                type="text"
                placeholder="Street Address, Industrial Estate"
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

            <div style={{ backgroundColor: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                placeholder="Solar Site Location / Project Address"
                value={sameAsBilling ? billingStreet : deliveryStreet}
                disabled={sameAsBilling}
                onChange={(e) => setDeliveryStreet(e.target.value)}
                style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '12px', boxSizing: 'border-box', outline: 'none', backgroundColor: sameAsBilling ? '#F1F5F9' : '#FFFFFF' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="City" value={sameAsBilling ? billingCity : deliveryCity} disabled={sameAsBilling} onChange={(e) => setDeliveryCity(e.target.value)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box', outline: 'none', backgroundColor: sameAsBilling ? '#F1F5F9' : '#FFFFFF' }} />
                <input type="text" placeholder="State" value={sameAsBilling ? billingState : deliveryState} disabled={sameAsBilling} onChange={(e) => setDeliveryState(e.target.value)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box', outline: 'none', backgroundColor: sameAsBilling ? '#F1F5F9' : '#FFFFFF' }} />
                <input type="text" placeholder="Pincode" value={sameAsBilling ? billingPincode : deliveryPincode} disabled={sameAsBilling} onChange={(e) => setDeliveryPincode(e.target.value)} style={{ height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', boxSizing: 'border-box', outline: 'none', backgroundColor: sameAsBilling ? '#F1F5F9' : '#FFFFFF' }} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: ITEMS & PRESET COMPILER (EXACT BOM PAGE DESIGN) */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
                3
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  QUOTATION SCOPE & LINE ITEMS
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Select an engineering kit preset or manually compile items. Revise as many times as the customer needs!
                </span>
              </div>
            </div>

            {/* Presets Kit Selector Matching BOM Page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SearchablePresetSelector
                value={selectedPreset}
                activePresetsMap={activePresetsMap}
                accentColor="#0E7490"
                width="340px"
                placeholder="Type or pick Preset Kit..."
                onChange={(val, targetPreset) => {
                  setSelectedPreset(val);
                  setSelectedItemIndexes([]);

                  if (targetPreset && targetPreset.items) {
                    const multiplier = parseInt(presetSetCount) || 1;
                    setQuoteItems(targetPreset.items.map(it => {
                      const baseQ = parseFloat(it.qty) || 1;
                      return {
                        name: it.name,
                        category: it.category || 'MMS Scope',
                        uom: it.uom || 'NOS',
                        qty: String(Math.round(baseQ * multiplier)),
                        rate: String(it.rate || 0),
                        gstRate: it.gstRate || '18%'
                      };
                    }));
                  }
                }}
              />

              {/* Set Count Multiplier */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0 8px', borderRadius: '8px', height: '38px' }}>
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
                    if (selectedPreset && VRM_HDG_PRESETS && VRM_HDG_PRESETS[selectedPreset]) {
                      const baseItems = VRM_HDG_PRESETS[selectedPreset].items;
                      setQuoteItems(baseItems.map(it => {
                        const baseQ = parseFloat(it.qty) || 1;
                        return {
                          name: it.name,
                          category: it.category || 'MMS Scope',
                          uom: it.uom || 'NOS',
                          qty: String(Math.round(baseQ * multiplier)),
                          rate: String(it.rate || 0),
                          gstRate: it.gstRate || '18%'
                        };
                      }));
                    }
                  }}
                  style={{ width: '50px', height: '28px', borderRadius: '6px', border: '1px solid #94A3B8', padding: '0 4px', fontSize: '13px', fontWeight: '800', color: '#0E7490', textAlign: 'center', outline: 'none', backgroundColor: 'white' }}
                />
              </div>

              <button
                onClick={() => {
                  if (selectedItemIndexes.length > 0) {
                    setQuoteItems(prev => prev.filter((_, idx) => !selectedItemIndexes.includes(idx)));
                    setSelectedItemIndexes([]);
                  } else {
                    setQuoteItems([]);
                    setSelectedPreset('');
                  }
                }}
                title={selectedItemIndexes.length > 0 ? `Remove ${selectedItemIndexes.length} selected item(s)` : 'Clear all items'}
                style={{
                  border: selectedItemIndexes.length > 0 ? '1px solid #EF4444' : '1px solid #FCA5A5',
                  backgroundColor: selectedItemIndexes.length > 0 ? '#EF4444' : '#FEF2F2',
                  color: selectedItemIndexes.length > 0 ? 'white' : '#EF4444',
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>

          {/* Items Table Matching BOM Page */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#475569', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 10px', width: '30px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={quoteItems.length > 0 && selectedItemIndexes.length === quoteItems.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItemIndexes(quoteItems.map((_, idx) => idx));
                        else setSelectedItemIndexes([]);
                      }}
                      style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '38%' }}>Product / Item Description <span style={{ color: '#EF4444' }}>*</span></th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%' }}>UOM</th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '8%', textAlign: 'center' }}>Qty <span style={{ color: '#EF4444' }}>*</span></th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '11%' }}>Price (₹)</th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%', textAlign: 'center' }}>GST Rate</th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%', textAlign: 'right' }}>Taxable (₹)</th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '10%', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ padding: '12px 10px', fontWeight: '700', width: '4%', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {quoteItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B', backgroundColor: '#FAFBFC' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                          <Boxes size={20} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>No items in this quotation yet</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>Click "+ Add Product / Scope Item" below or select an engineering kit preset to add line items.</div>
                      </div>
                    </td>
                  </tr>
                ) : quoteItems.map((item, i) => {
                  const q = parseFloat(item.qty) || 0;
                  const r = parseFloat(item.rate) || 0;
                  const taxable = q * r;
                  const gstPct = parseFloat(String(item.gstRate || '18%').replace('%', '')) || 18;
                  const rowTot = taxable + (taxable * (gstPct / 100));
                  const isChecked = selectedItemIndexes.includes(i);

                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: isChecked ? '#ECFEFF' : 'transparent' }}>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
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
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          value={item.name}
                          placeholder="e.g. Aluminium Mid Clamp 35mm"
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteItems(prev => prev.map((it, idx) => idx === i ? { ...it, name: val } : it));
                          }}
                          style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '12px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <select
                          value={item.uom || 'NOS'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteItems(prev => prev.map((it, idx) => idx === i ? { ...it, uom: val } : it));
                          }}
                          style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '12px', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: '600' }}
                        >
                          <option value="NOS">NOS</option>
                          <option value="SET">SET</option>
                          <option value="MTR">MTR</option>
                          <option value="KG">KG</option>
                          <option value="PCS">PCS</option>
                          <option value="PKT">PKT</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty: val } : it));
                          }}
                          style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '13px', textAlign: 'center', boxSizing: 'border-box', outline: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteItems(prev => prev.map((it, idx) => idx === i ? { ...it, rate: val } : it));
                          }}
                          style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 10px', fontSize: '13px', textAlign: 'right', boxSizing: 'border-box', outline: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <select
                          value={item.gstRate || '18%'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteItems(prev => prev.map((it, idx) => idx === i ? { ...it, gstRate: val } : it));
                          }}
                          style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #CCFBF1', padding: '0 6px', fontSize: '12px', fontWeight: '700', color: '#0E7490', backgroundColor: '#F0FDFA', outline: 'none', cursor: 'pointer', textAlign: 'center' }}
                        >
                          <option value="18%">18% GST</option>
                          <option value="12%">12% GST</option>
                          <option value="5%">5% GST</option>
                          <option value="0%">0% Exempt</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px', color: '#475569', textAlign: 'right', fontWeight: '600' }}>₹{taxable.toFixed(2)}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#0F172A', textAlign: 'right' }}>₹{rowTot.toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveItemRow(i)}
                          style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
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

          <div>
            <button
              onClick={handleAddItemRow}
              style={{ border: '1px solid #CCFBF1', background: '#F0FDFA', color: '#0E7490', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              Add Product / Scope Item
            </button>
          </div>
        </div>

        {/* ROW WITH SECTION 4 & SECTION 5 IN SEPARATE SIDE-BY-SIDE CONTAINERS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)', gap: '20px', alignItems: 'stretch' }}>
          {/* SECTION 4: TERMS & CONDITIONS (PO-STYLE PRESET SELECTOR & EDITABLE TEXTAREA) */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
                  4
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    TERMS AND CONDITIONS
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Select preset or type custom clauses
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '11px', color: '#0E7490', fontWeight: '700', backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1', padding: '4px 10px', borderRadius: '8px' }}>
                Preset: {QUOTATION_TERMS_PRESETS.find(p => p.key === selectedTermsPreset)?.label || 'Custom / Typed'}
              </span>
            </div>

            {/* Clean Preset Pill Buttons (Exact PO Style) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedTermsPreset('');
                  setTerms('');
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: selectedTermsPreset === '' ? '1.5px dashed #0E7490' : '1px solid #CBD5E1',
                  backgroundColor: selectedTermsPreset === '' ? '#F0FDFA' : '#FFFFFF',
                  color: selectedTermsPreset === '' ? '#0E7490' : '#475569',
                  fontSize: '11px',
                  fontWeight: selectedTermsPreset === '' ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Clear / Custom
              </button>

              {QUOTATION_TERMS_PRESETS.map((p) => {
                const isSelected = selectedTermsPreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setSelectedTermsPreset(p.key);
                      setTerms(p.text);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #0E7490' : '1px solid #CBD5E1',
                      backgroundColor: isSelected ? '#0E7490' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      fontSize: '11px',
                      fontWeight: isSelected ? '700' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 4px rgba(14, 116, 144, 0.2)' : 'none'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Large editable textarea where user can customize or write custom terms */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <textarea
                value={terms}
                onChange={(e) => {
                  setTerms(e.target.value);
                  if (selectedTermsPreset !== '') {
                    setSelectedTermsPreset(''); // switch to custom when user edits
                  }
                }}
                rows={9}
                placeholder="Select a preset above or freely type your custom quotation Terms & Conditions..."
                style={{
                  width: '100%',
                  flex: 1,
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  padding: '12px 14px',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  color: '#1E293B',
                  boxSizing: 'border-box',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '200px',
                  backgroundColor: '#FAFBFC'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '6px' }}>
                Note: Preset clauses can be edited or typed custom directly in the box.
              </span>
            </div>

            {/* Company Bank Account Details Card */}
            <div style={{
              backgroundColor: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={14} style={{ color: '#0284C7' }} /> Our Company Bank Account Details
                </span>
                <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: '6px' }}>
                  Official B2B Settlement Account
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '11px', color: '#0F172A', marginTop: '4px' }}>
                <div><strong>Beneficiary:</strong> VRM Structures India Private Limited</div>
                <div><strong>Bank Name:</strong> HDFC Bank</div>
                <div><strong>Account Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0369A1' }}>50200031629272</span></div>
                <div><strong>IFSC Code:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0369A1' }}>HDFC0000574</span></div>
                <div><strong>Branch:</strong> Kodambakkam, Chennai</div>
                <div><strong>Account Type:</strong> Current Account</div>
              </div>
            </div>
          </div>

          {/* SECTION 5: FINANCIAL SUMMARY CARD (IN SEPARATE CONTAINER IN SAME ROW) */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#0E7490', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800' }}>
                  5
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0E7490', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    QUOTATION TOTAL & TAX BREAKDOWN
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Real-time GST and commercial calculations
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                  <span>Taxable Subtotal:</span>
                  <strong style={{ color: '#0F172A' }}>₹{totals.sub.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                  <span>CGST (9%):</span>
                  <strong style={{ color: '#0F172A' }}>₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                  <span>SGST (9%):</span>
                  <strong style={{ color: '#0F172A' }}>₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', borderTop: '1px dashed #CBD5E1', paddingTop: '10px' }}>
                  <span>Total GST (18%):</span>
                  <strong style={{ color: '#0F172A' }}>₹{totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', color: '#0E7490', borderTop: '2px solid #0E7490', paddingTop: '12px', marginTop: '4px' }}>
                  <span>Grand Proposal Total:</span>
                  <span>₹{totals.grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={18} style={{ color: '#0E7490', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#0F766E', lineHeight: '1.4' }}>
                All line items and GST calculations conform with standard B2B invoicing rules and will transfer automatically when converted to Proforma Invoice (PI).
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM FORM ACTION BUTTONS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: '20px 24px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <button
            type="button"
            onClick={() => setShowBOMQuoteForm(false)}
            style={{ border: '1px solid #CBD5E1', background: '#FFFFFF', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSaveQuotationRecord('Draft')}
            style={{ border: '1px solid #0E7490', background: '#F0FDFA', color: '#0E7490', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText style={{ width: '15px', height: '15px' }} />
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveQuotationRecord('Sent')}
            style={{ border: 'none', background: '#10B981', color: 'white', padding: '10px 26px', borderRadius: '10px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>{editingQuoteId ? 'Save & Send Revision →' : 'Create Quotation →'}</span>
          </button>
        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: STANDARD QUOTATIONS TABLE (ACTIONS COLUMN REMOVED)
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: toastMessage.type === 'success' ? '#065F46' : '#991B1B',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
          fontSize: '13px',
          fontWeight: '700',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* 1. TOP HEADER WITH CREATE BUTTON MATCHING BOM PAGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            {pageConfig.title}
          </h2>
          <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            {pageConfig.subtitle}
          </span>
        </div>
        <button
          onClick={handleOpenCreateForm}
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
      </div>

      {/* 2. FILTERS & SEARCH ROW MATCHING BOM PAGE */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', width: '100%', boxSizing: 'border-box', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: '#f8fafc', width: '380px' }}>
          <Search style={{ width: '15px', height: '15px', color: '#64748b' }} />
          <input
            type="text"
            placeholder={pageConfig.searchPlaceholder}
            value={searchQueryText}
            onChange={(e) => { setSearchQueryText(e.target.value); setCurrentPage(1); }}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#334155' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', height: '38px', backgroundColor: 'white' }}>
            <Calendar style={{ width: '14px', height: '14px', color: '#64748b' }} />
            <input
              type="date"
              value={filterDateVal}
              onChange={(e) => { setFilterDateVal(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'transparent' }}
            />
          </div>

          <button
            onClick={() => { setSearchQueryText(''); setFilterDateVal(''); setActiveSubTab('All'); setCurrentPage(1); }}
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

      {/* 3. STATUS SUB-TABS ROW MATCHING BOM PAGE */}
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
              color: activeSubTab === tab.id ? '#0E7490' : '#64748b',
              borderBottom: activeSubTab === tab.id ? '2px solid #0E7490' : '2px solid transparent',
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

      {/* 4. MAIN DATA TABLE (ACTIONS COLUMN REMOVED PER SPECIFICATION) */}
      <div className="section-card" style={{ padding: '0', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#475569', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '12px', fontWeight: 'bold', height: '48px' }}>
                <th style={{ width: '48px', minWidth: '48px', maxWidth: '48px', padding: '12px 0', textAlign: 'center', verticalAlign: 'middle', boxSizing: 'border-box' }}>
                  <input
                    type="checkbox"
                    style={{ accentColor: '#0E7490', cursor: 'pointer', verticalAlign: 'middle', margin: 0 }}
                    checked={filteredRows.length > 0 && filteredRows.every(r => selectedRows.includes(r.code))}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={{ width: '140px', minWidth: '140px', padding: '12px 14px', fontWeight: 'bold' }}>Quote #</th>
                <th style={{ width: '120px', minWidth: '120px', padding: '12px 14px', fontWeight: 'bold' }}>Date</th>
                <th style={{ minWidth: '220px', padding: '12px 14px', fontWeight: 'bold' }}>Customer Name</th>
                <th style={{ minWidth: '180px', padding: '12px 14px', fontWeight: 'bold' }}>Structure Scope</th>
                <th style={{ width: '150px', minWidth: '150px', padding: '12px 14px', fontWeight: 'bold' }}>Sales Rep</th>
                <th style={{ width: '140px', minWidth: '140px', padding: '12px 14px', fontWeight: 'bold', textAlign: 'right' }}>Total (₹)</th>
                <th style={{ width: '140px', minWidth: '140px', padding: '12px 14px', fontWeight: 'bold', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                    No quotations found matching your criteria.
                  </td>
                </tr>
              ) : (
                currentRows.map((row, idx) => {
                  const isChecked = selectedRows.includes(row.code);
                  return (
                    <tr
                      key={row.code || idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'all 0.15s ease',
                        backgroundColor: isChecked ? '#ECFEFF' : 'transparent',
                        cursor: 'pointer'
                      }}
                      className={`table-row-hover ${isChecked ? 'selected-row' : ''}`}
                    >
                      <td 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '48px',
                          minWidth: '48px',
                          padding: '12px 0',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          boxSizing: 'border-box',
                          borderLeft: isChecked ? '4px solid #0E7490' : '4px solid transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          style={{ accentColor: '#0E7490', cursor: 'pointer', verticalAlign: 'middle', margin: 0 }}
                          checked={isChecked}
                          onChange={() => handleSelectRow(row.code)}
                        />
                      </td>
                      <td
                        onClick={() => setSelectedQuote(row)}
                        style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0E7490' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{row.code}</span>
                          {row.revCount > 0 && (
                            <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '10px', padding: '1px 6px', borderRadius: '8px', fontWeight: '800' }}>
                              R{row.revCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        onClick={() => setSelectedQuote(row)}
                        style={{ padding: '12px 14px', color: '#64748B' }}
                      >
                        {row.date}
                      </td>
                      <td 
                        onClick={() => setSelectedQuote(row)}
                        style={{ padding: '12px 14px', fontWeight: '700', color: '#0F172A' }}
                      >
                        {row.customer}
                      </td>
                      <td 
                        onClick={() => setSelectedQuote(row)}
                        style={{ padding: '12px 14px', color: '#334155' }}
                      >
                        {row.structure}
                      </td>
                      <td 
                        onClick={() => setSelectedQuote(row)}
                        style={{ padding: '12px 14px', color: '#0E7490', fontWeight: '700', fontSize: '12px' }}
                      >
                        <span style={{ backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <User size={13} style={{ color: '#0E7490' }} /> {row.salesRep}
                        </span>
                      </td>
                      <td 
                        onClick={() => setSelectedQuote(row)}
                        style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0F172A', textAlign: 'right' }}
                      >
                        {row.formattedTotal}
                      </td>
                      <td 
                        onClick={() => setSelectedQuote(row)}
                        style={{ padding: '12px 14px', textAlign: 'center' }}
                      >
                        <span style={{
                          backgroundColor: row.stBg,
                          color: row.stFg,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          border: row.stBorder
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: row.stFg }}></span>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION FOOTER EXACT RULES */}
        {filteredRows.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', fontSize: '13px', color: '#64748B', borderTop: '1px solid #F1F5F9', backgroundColor: '#FFFFFF' }}>
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
                  id="crm-quotations-goto-page-input"
                  style={{ width: '42px', height: '32px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}
                />
                <button
                  onClick={() => {
                    const val = parseInt(document.getElementById('crm-quotations-goto-page-input')?.value || '1', 10);
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

      {/* 6. FLOATING BOTTOM ACTION BAR FOR SELECTED ROWS WITH "CONVERT TO PI" */}
      {selectedRows.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10000,
          fontFamily: "'DM Sans', sans-serif"
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '4px', paddingRight: '6px' }}>
            <strong style={{ color: '#0F172A', fontSize: '14px' }}>{selectedRows.length}</strong> Selected
          </span>

          {/* View Details */}
          <button
            onClick={() => {
              if (selectedRows.length === 1) {
                const target = normalizedQuotes.find(q => q.code === selectedRows[0]);
                if (target) setSelectedQuote(target);
              } else {
                alert('Viewing multiple items is not supported. Please select a single quotation.');
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
              gap: '6px'
            }}
          >
            <Eye size={14} style={{ color: '#0E7490' }} /> View
          </button>

          {/* Edit / Revise Quote */}
          <button
            onClick={() => {
              if (selectedRows.length === 1) {
                const target = normalizedQuotes.find(q => q.code === selectedRows[0]);
                if (target) handleStartEditQuote(target);
              } else {
                alert('Editing multiple quotations at once is not supported.');
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
              gap: '6px'
            }}
          >
            <Edit3 size={14} style={{ color: '#2563EB' }} /> Edit / Revise
          </button>

          {/* Send Quote Template Button */}
          <button
            onClick={() => {
              if (selectedRows.length === 1) {
                const target = normalizedQuotes.find(q => q.code === selectedRows[0]);
                if (target) handleOpenSendQuoteModal(target, 'WhatsApp');
              } else {
                alert('Sending quote template is supported for one quotation at a time. Please select a single quotation.');
              }
            }}
            style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#16A34A',
              borderRadius: '10px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={14} style={{ color: '#16A34A' }} /> Send Quote
          </button>

          {/* Convert to PI Button */}
          <button
            onClick={() => {
              if (selectedRows.length === 1) {
                const target = normalizedQuotes.find(q => q.code === selectedRows[0]);
                if (target) handleConvertToPI(target);
              } else {
                alert('Converting multiple quotations to PI at once is not supported. Please select one quotation.');
              }
            }}
            style={{
              backgroundColor: '#0E7490',
              border: 'none',
              color: 'white',
              borderRadius: '10px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(14, 116, 144, 0.25)'
            }}
          >
            <ArrowRight size={14} /> Convert to PI
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${selectedRows.length} selected quotation(s)?`)) {
                const updatedQuotes = quotations.filter(q => !selectedRows.includes(q.quoteNumber || q.id));
                localStorage.setItem('controlroom_crm_quotations', JSON.stringify(updatedQuotes));
                window.location.reload();
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
              gap: '6px'
            }}
          >
            <Trash2 size={14} style={{ color: '#DC2626' }} /> Delete
          </button>

          <div style={{ height: '18px', width: '1px', backgroundColor: '#E2E8F0', margin: '0 2px' }} />

          <button
            onClick={() => setSelectedRows([])}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
            title="Deselect all"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 7. QUOTATION PREVIEW & DETAIL MODAL (WITH CONVERT TO PI BUTTON) */}
      {selectedQuote && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #E2E8F0'
          }}>
            {/* Header / Brand */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0E7490', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>
                  VRM STRUCTURES INDIA PVT LTD
                </h2>
                <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>
                  Solar Module Mounting Structures (MMS) Manufacturer
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0E7490' }}>
                  {selectedQuote.code || selectedQuote.quoteNumber}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Date: {selectedQuote.date || new Date().toLocaleDateString()}</div>
                {selectedQuote.revCount > 0 && (
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginTop: '2px' }}>
                    Revision #{selectedQuote.revCount}
                  </span>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div style={{ marginBottom: '20px', fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><strong>Prepared For:</strong> {selectedQuote.customer || selectedQuote.customerName}</div>
              <div><strong>Structure Scope:</strong> {selectedQuote.structure || selectedQuote.structureType}</div>
              <div><strong>Sales Representative:</strong> {selectedQuote.salesRep || selectedQuote.salesPerson}</div>
              {selectedQuote.phone && <div><strong>Contact:</strong> {selectedQuote.phone}</div>}
              {selectedQuote.paymentTerms && <div><strong>Payment Terms:</strong> {selectedQuote.paymentTerms}</div>}
              {selectedQuote.deliveryAddress && <div><strong>Delivery Address:</strong> {selectedQuote.deliveryAddress}</div>}
            </div>

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Item Description</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Qty</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Rate (₹)</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(selectedQuote.items || []).map((it, idx) => {
                  const itQty = Number(it.qty || 0);
                  const itRate = Number(it.rate || 0);
                  const itAmt = Number(it.amount || (itQty * itRate));
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px', color: '#0F172A', fontWeight: '600' }}>{it.name || it.description}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>{itQty} {it.unit || it.uom || 'NOS'}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>₹ {itRate.toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>₹ {itAmt.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '300px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748B' }}>
                  <span>Taxable Subtotal:</span>
                  <strong style={{ color: '#0F172A' }}>₹ {Number(selectedQuote.taxableAmount || selectedQuote.subtotal || selectedQuote.numericTotal).toLocaleString()}</strong>
                </div>
                {selectedQuote.gstTotal ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748B' }}>
                    <span>Applicable GST (18%):</span>
                    <strong style={{ color: '#0F172A' }}>₹ {Number(selectedQuote.gstTotal).toLocaleString()}</strong>
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #E2E8F0', marginTop: '6px' }}>
                  <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '15px' }}>Grand Total:</span>
                  <strong style={{ fontWeight: '800', color: '#0E7490', fontSize: '16px' }}>
                    {selectedQuote.formattedTotal || `₹ ${Number(selectedQuote.grandTotal || selectedQuote.totalAmount).toLocaleString()}`}
                  </strong>
                </div>
              </div>
            </div>

            {/* Terms and Conditions Preview (Dynamic PO Style) */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  TERMS AND CONDITIONS
                </h4>
                {selectedQuote.termsPresetKey && (
                  <span style={{ fontSize: '11px', color: '#0E7490', fontWeight: '700', backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1', padding: '2px 8px', borderRadius: '6px' }}>
                    Preset: {QUOTATION_TERMS_PRESETS.find(p => p.key === selectedQuote.termsPresetKey)?.label || 'Custom'}
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#334155',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 14px'
              }}>
                {selectedQuote.terms || selectedQuote.notes || (
                  `1. Validity: 15 days from quote date; prices subject to aluminium/steel index escalation thereafter.\n` +
                  `2. Payment: 50% advance with order / PI, balance 50% before material dispatch from plant.\n` +
                  `3. Delivery: 7–10 working days from advance & drawing approvals. Transit insurance by consignee.\n` +
                  `4. Taxes: GST 18% extra as applicable at time of invoicing.\n` +
                  `5. Warranty: 10 Years limited structural warranty for 6063 T6 anodized rails & SS304 hardware.\n` +
                  `6. Freight: On to-pay basis or as agreed. Unloading at site is in customer's scope.`
                )}
              </div>
              {selectedQuote.notes && selectedQuote.terms && selectedQuote.notes !== selectedQuote.terms && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #CBD5E1', fontSize: '11px', color: '#334155' }}>
                  <strong>Special Conditions / Remarks:</strong> {selectedQuote.notes}
                </div>
              )}
            </div>

            {/* Company Bank Account Details Card in Preview */}
            <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={14} style={{ color: '#0284C7' }} /> COMPANY BANK ACCOUNT DETAILS (FOR PAYMENTS & ADVANCE)
                </h4>
                <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: '6px' }}>
                  HDFC Bank RTGS/NEFT/IMPS
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '11px', color: '#0F172A' }}>
                <div><strong>Beneficiary:</strong> VRM Structures India Private Limited</div>
                <div><strong>Bank Name:</strong> HDFC Bank</div>
                <div><strong>Account Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0369A1' }}>50200031629272</span></div>
                <div><strong>IFSC Code:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0369A1' }}>HDFC0000574</span></div>
                <div><strong>Branch:</strong> Kodambakkam, Chennai</div>
                <div><strong>Account Type:</strong> Current Account</div>
              </div>
            </div>

            {/* Bottom Actions Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const q = selectedQuote;
                    setSelectedQuote(null);
                    handleStartEditQuote(q);
                  }}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#1E293B', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit3 size={14} style={{ color: '#2563EB' }} /> Edit / Revise Quote
                </button>
                <button
                  onClick={() => handleOpenSendQuoteModal(selectedQuote, 'WhatsApp')}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #16A34A', backgroundColor: '#F0FDF4', color: '#16A34A', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(22,163,74,0.1)' }}
                >
                  <Send size={14} style={{ color: '#16A34A' }} /> Send Quote Template
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={14} /> Print PDF
                </button>
                <button
                  onClick={() => handleConvertToPI(selectedQuote)}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#0E7490', color: '#FFFFFF', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowRight size={14} /> Convert to PI
                </button>
                <button
                  onClick={() => setSelectedQuote(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. EDITABLE QUOTATION SENDING TEMPLATE MODAL */}
      {sendQuoteModalData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            border: '1px solid #CBD5E1',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                    <Send size={18} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: 0 }}>
                    Send Quotation to Client
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 40px' }}>
                  Select an official template, review or edit the wording freely, and dispatch via WhatsApp or Email.
                </p>
              </div>
              <button
                onClick={() => setSendQuoteModalData(null)}
                style={{ border: 'none', background: '#F1F5F9', color: '#64748B', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quote Summary Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: '#64748B' }}>Quotation: </span>
                <strong style={{ color: '#0E7490', fontWeight: '800' }}>{sendQuoteModalData.code || sendQuoteModalData.quoteNumber}</strong>
                <span style={{ margin: '0 8px', color: '#CBD5E1' }}>|</span>
                <span style={{ color: '#64748B' }}>Client: </span>
                <strong style={{ color: '#0F172A' }}>{sendQuoteModalData.customer || sendQuoteModalData.customerName}</strong>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0E7490' }}>
                {sendQuoteModalData.formattedTotal || `₹ ${Number(sendQuoteModalData.grandTotal || 0).toLocaleString()}`}
              </div>
            </div>

            {/* Channel Switcher */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Choose Dispatch Channel
              </label>
              <div style={{ display: 'inline-flex', gap: '8px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSendChannel('WhatsApp');
                    setRecipientContact(sendQuoteModalData.phone || '+91 98765 43210');
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: sendChannel === 'WhatsApp' ? '#16A34A' : 'transparent',
                    color: sendChannel === 'WhatsApp' ? '#FFFFFF' : '#475569',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <MessageSquare size={14} /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendChannel('Email');
                    setRecipientContact(sendQuoteModalData.email || 'procurement@client.com');
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: sendChannel === 'Email' ? '#0E7490' : 'transparent',
                    color: sendChannel === 'Email' ? '#FFFFFF' : '#475569',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Mail size={14} /> Official Email
                </button>
              </div>
            </div>

            {/* Template Presets Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Select Message Template Preset
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {QUOTE_SENDING_TEMPLATES.map((tmpl) => {
                  const isSelected = activeSendTemplateKey === tmpl.key;
                  return (
                    <div
                      key={tmpl.key}
                      onClick={() => handleSelectSendTemplate(tmpl.key)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid #0E7490' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#F0FDFA' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(14,116,144,0.1)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: isSelected ? '800' : '600', color: isSelected ? '#0E7490' : '#1E293B' }}>
                          {tmpl.title}
                        </span>
                        {isSelected && <Check size={14} style={{ color: '#0E7490' }} />}
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginTop: '3px' }}>
                        Channel: {tmpl.channel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recipient Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                {sendChannel === 'WhatsApp' ? 'WhatsApp Phone Number' : 'Recipient Email Address'}
              </label>
              <input
                type="text"
                value={recipientContact}
                onChange={(e) => setRecipientContact(e.target.value)}
                placeholder={sendChannel === 'WhatsApp' ? '+91 98765 43210' : 'procurement@client.com'}
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1E293B',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* If Email, show editable Subject */}
            {sendChannel === 'Email' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={editableEmailSubject}
                  onChange={(e) => setEditableEmailSubject(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    padding: '0 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1E293B',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {/* Editable Template Message Body */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                  Message Content (Fully Editable)
                </label>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Feel free to edit or add custom remarks before sending
                </span>
              </div>
              <textarea
                rows={10}
                value={editableMessageBody}
                onChange={(e) => setEditableMessageBody(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  padding: '14px',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  color: '#1E293B',
                  boxSizing: 'border-box',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '180px',
                  backgroundColor: '#FAFBFC'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setSendQuoteModalData(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteSendQuote}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: sendChannel === 'WhatsApp' ? '#16A34A' : '#0E7490',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: sendChannel === 'WhatsApp' ? '0 4px 12px rgba(22,163,74,0.3)' : '0 4px 12px rgba(14,116,144,0.3)'
                }}
              >
                <Send size={15} />
                <span>{sendChannel === 'WhatsApp' ? 'Send via WhatsApp →' : 'Send via Email →'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
