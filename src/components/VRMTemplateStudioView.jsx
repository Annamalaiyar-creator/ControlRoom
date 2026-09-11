import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  Save,
  RotateCcw,
  Palette,
  Layers,
  CreditCard,
  Building2,
  Image,
  Upload,
  Trash2,
  CheckCircle,
  ArrowLeft,
  FileText,
  Sparkles,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Plus,
  Star,
  Receipt,
  FileSpreadsheet,
  GitBranch,
  ShieldCheck,
  Undo2,
  ChevronRight,
  Eye,
  Settings2,
  Copy
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  VRMProformaInvoicePrintSheet,
  DEFAULT_PI_TEMPLATE_SETTINGS
} from './VRMProformaInvoicePrintTemplate';

// 12 Curated Preset Swatches
const COLOR_PRESETS = [
  { name: 'VRM Teal', hex: '#0E7490' },
  { name: 'Royal Navy', hex: '#1E3A8A' },
  { name: 'Tech Cobalt', hex: '#2563EB' },
  { name: 'Deep Emerald', hex: '#059669' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Charcoal Slate', hex: '#1E293B' },
  { name: 'Crimson Burgundy', hex: '#991B1B' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Modern Indigo', hex: '#4338CA' },
  { name: 'Amethyst Violet', hex: '#7C3AED' },
  { name: 'Dark Graphite', hex: '#334155' },
  { name: 'Steel Blue', hex: '#0284C7' }
];

// Initial Multi-Template Store: 3 Categories (PI, Quotation, BOM)
const DEFAULT_MULTI_TEMPLATES = {
  pi: [
    {
      id: 'pi_std',
      name: 'Standard GST Proforma',
      description: 'Official GST proforma invoice with HSN, Taxable Value, CGST/SGST/IGST breakdown, and Bank Details.',
      isDefault: true,
      lastModified: '11 Sep 2026',
      settings: {
        ...DEFAULT_PI_TEMPLATE_SETTINGS,
        documentTitle: 'PROFORMA INVOICE',
        accentColor: '#0E7490',
        logoHeight: 65,
        stampSize: 125,
        showHsn: true,
        showRateCol: true,
        showTaxableCol: true,
        showGstCol: true,
        showTotalCol: true,
        showBankDetails: true,
        showTerms: true
      }
    },
    {
      id: 'pi_no_amt',
      name: 'Commercial PI (Without Rates / Amounts)',
      description: 'Material specifications & delivery scope with Rate and Amount columns hidden for site logistics.',
      isDefault: false,
      lastModified: '10 Sep 2026',
      settings: {
        ...DEFAULT_PI_TEMPLATE_SETTINGS,
        documentTitle: 'PROFORMA INVOICE',
        accentColor: '#0E7490',
        logoHeight: 65,
        stampSize: 125,
        showRateCol: false,
        showTaxableCol: false,
        showGstCol: false,
        showTotalCol: false,
        showTotalInWords: false,
        showBankDetails: true
      }
    }
  ],
  quotation: [
    {
      id: 'quote_std',
      name: 'Standard Commercial Quotation',
      description: 'Formal commercial proposal with line-item rates, payment terms, and project validity period.',
      isDefault: true,
      lastModified: '11 Sep 2026',
      settings: {
        ...DEFAULT_PI_TEMPLATE_SETTINGS,
        documentTitle: 'COMMERCIAL QUOTATION',
        docNoLabel: 'Quote No:',
        dateLabel: 'Quote Date:',
        validUntilLabel: 'Proposal Validity:',
        accentColor: '#1E3A8A', // Royal Navy for Quotes
        logoHeight: 70,
        stampSize: 125,
        showPaymentTerms: true,
        showPlaceOfSupply: true,
        showSalesExecutive: true,
        showTerms: true
      }
    },
    {
      id: 'quote_lump',
      name: 'Technical Solar Quote (Lump Sum)',
      description: 'Engineering scope and bill of quantities with item rates hidden, presenting an all-inclusive project price.',
      isDefault: false,
      lastModified: '09 Sep 2026',
      settings: {
        ...DEFAULT_PI_TEMPLATE_SETTINGS,
        documentTitle: 'SOLAR PROJECT PROPOSAL',
        docNoLabel: 'Proposal Ref:',
        dateLabel: 'Date:',
        validUntilLabel: 'Offer Valid Till:',
        accentColor: '#0E7490',
        logoHeight: 65,
        stampSize: 125,
        showRateCol: false,
        showTaxableCol: false,
        showGstCol: false,
        showPaymentTerms: true
      }
    }
  ],
  bom: [
    {
      id: 'bom_eng',
      name: 'Detailed Engineering BOM',
      description: 'Structural fabrication bill of materials with member dimensions, zinc micron specs, and component costs.',
      isDefault: true,
      lastModified: '11 Sep 2026',
      settings: {
        ...DEFAULT_PI_TEMPLATE_SETTINGS,
        documentTitle: 'BILL OF MATERIALS (BOM)',
        docNoLabel: 'BOM No:',
        dateLabel: 'Release Date:',
        validUntilLabel: 'Rev Date:',
        accentColor: '#1E293B', // Charcoal Slate for Engineering
        logoHeight: 60,
        stampSize: 120,
        colHeaderDesc: 'Structural Component & Profile Specification',
        showHsn: true,
        showUom: true,
        showRateCol: true,
        showTotalCol: true
      }
    },
    {
      id: 'bom_client',
      name: 'Client Supply BOM (Without Rates)',
      description: 'Assembly schedule and quantities for site erection and client handoff without internal cost disclosure.',
      isDefault: false,
      lastModified: '08 Sep 2026',
      settings: {
        ...DEFAULT_PI_TEMPLATE_SETTINGS,
        documentTitle: 'MATERIAL SCHEDULE (BOM)',
        docNoLabel: 'Schedule No:',
        dateLabel: 'Release Date:',
        accentColor: '#059669', // Emerald Green
        logoHeight: 60,
        stampSize: 120,
        colHeaderDesc: 'Assembly Profile & Hardware Item',
        showHsn: true,
        showUom: true,
        showRateCol: false,
        showTaxableCol: false,
        showGstCol: false,
        showTotalCol: false,
        showTotalInWords: false
      }
    }
  ]
};

// Sample datasets for live previews
const SAMPLE_DATASETS = {
  pi: {
    piNo: 'SPI-2025-101',
    piDate: new Date().toISOString().split('T')[0],
    expDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    vendor: 'Apex Solar Infra Solutions Pvt Ltd',
    customerName: 'Apex Solar Infra Solutions Pvt Ltd',
    contactPerson: 'K. Rajesh Kumar (Project Head)',
    phone: '+91 98401 23456',
    email: 'procurement@apexsolar.in',
    gstNo: '33AAAAA9999A1Z9',
    billingStreet: 'Plot No 48, Guindy Industrial Estate',
    billingCity: 'Chennai',
    billingState: 'Tamil Nadu',
    billingPincode: '600032',
    sameAsBilling: true,
    deliveryStreet: 'Plot No 48, Guindy Industrial Estate',
    deliveryCity: 'Chennai',
    deliveryState: 'Tamil Nadu',
    deliveryPincode: '600032',
    paymentTerms: '50% Advance + 50% Before Dispatch',
    salesPerson: 'ManojRaj (VRM Sales)',
    transportMode: 'By Road (VRM Logistics)',
    vehicleNo: 'TN-05-AB-4890',
    items: [
      {
        sNo: 1,
        name: 'Solar On-Grid Mounting Structure (HDG 80 Micron)',
        description: 'Hot Dip Galvanized 2x3 Table 2000mm x 2500mm with C-Channels, Railless clamps, and SS-304 fasteners.',
        hsn: '73089090',
        qty: 12,
        uom: 'Sets',
        rate: 185000,
        discountPct: 0,
        gstRate: '18%'
      },
      {
        sNo: 2,
        name: 'Aluminium Rooftop Mounting Rails 4.2m',
        description: 'High tensile 6063-T6 architectural grade aluminium rails with anodized surface treatment.',
        hsn: '76109090',
        qty: 25,
        uom: 'Nos',
        rate: 28500,
        discountPct: 0,
        gstRate: '18%'
      },
      {
        sNo: 3,
        name: 'Mid & End Clamp Fastener Hardware Accessories Kit',
        description: 'SS-304 Allen bolts, EPDM rubber pads, and grounding earthing clips.',
        hsn: '73181500',
        qty: 1,
        uom: 'Kit',
        rate: 45000,
        discountPct: 0,
        gstRate: '18%'
      }
    ]
  },
  quotation: {
    piNo: 'VRM-QT-2025-442',
    piDate: new Date().toISOString().split('T')[0],
    expDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    vendor: 'SunGrid Renewable Energies Ltd',
    customerName: 'SunGrid Renewable Energies Ltd',
    contactPerson: 'Dr. Anand Ramanathan (VP Engineering)',
    phone: '+91 94440 98765',
    email: 'tenders@sungridrenewables.com',
    gstNo: '33AAACS1234F1Z8',
    billingStreet: 'Tech Park Blvd, OMR Corridor',
    billingCity: 'Chennai',
    billingState: 'Tamil Nadu',
    billingPincode: '600096',
    sameAsBilling: true,
    paymentTerms: '20% Mobilization Advance + 80% On Pro-rata Dispatch',
    salesPerson: 'Suresh Babu (Commercial Head)',
    transportMode: 'Trailer Transit (Door Delivery Included)',
    vehicleNo: 'TN-22-BY-8012',
    items: [
      {
        sNo: 1,
        name: 'Turnkey Ground Mount Solar Structure (500 kW Scope)',
        description: 'Engineered Galvalume C-Lips, Columns, Rafters, Bracings & Ground Screws designed for 160 km/h wind speed.',
        hsn: '73089090',
        qty: 1,
        uom: 'Lot',
        rate: 1450000,
        discountPct: 0,
        gstRate: '18%'
      },
      {
        sNo: 2,
        name: 'Structural Foundation Hardware & Anchor J-Bolts M16x400',
        description: 'High tensile Grade 8.8 hot dip galvanized foundation bolts with double nuts and heavy washers.',
        hsn: '73181500',
        qty: 320,
        uom: 'Nos',
        rate: 420,
        discountPct: 0,
        gstRate: '18%'
      }
    ]
  },
  bom: {
    piNo: 'BOM-ENG-2025-089',
    piDate: new Date().toISOString().split('T')[0],
    expDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    vendor: 'VRM Solar Structures — Factory Works',
    customerName: 'Sterling Solar EPC Services',
    contactPerson: 'M. Senthil Nathan (Plant Quality Lead)',
    phone: '+91 98402 11223',
    email: 'fabrication@vrmstructures.com',
    gstNo: '33AAGCV4262N1ZZ',
    billingStreet: '1427, GNT Road, Nagappa Industrial Estate, Puzhal',
    billingCity: 'Chennai',
    billingState: 'Tamil Nadu',
    billingPincode: '600066',
    sameAsBilling: true,
    paymentTerms: 'Internal Job Work Order / Stock Allocation',
    salesPerson: 'Engineering Design Center',
    transportMode: 'Internal Dispatch & Yard Staging',
    vehicleNo: 'Internal Stock Yard',
    items: [
      {
        sNo: 1,
        name: 'C-Channel 80 x 40 x 15 x 2.0 mm (HR Coil YST-250)',
        description: 'CNC Roll-formed channel member, length 4500mm, punched slot 14x25mm, Hot Dip Galvanized 80 micron.',
        hsn: '73089090',
        qty: 180,
        uom: 'Nos',
        rate: 1850,
        discountPct: 0,
        gstRate: '18%'
      },
      {
        sNo: 2,
        name: 'Purlin Profile Member 100 x 50 x 2.5 mm',
        description: 'Pre-galvanized high yield structural purlin with staggered slotted hole pattern.',
        hsn: '73089090',
        qty: 90,
        uom: 'Nos',
        rate: 2450,
        discountPct: 0,
        gstRate: '18%'
      },
      {
        sNo: 3,
        name: 'Base Plate 200 x 200 x 10 mm (MS Plate E250)',
        description: 'Plasma cut base plate with 4-hole foundation pattern, welded gusset stiffeners, HDG treated.',
        hsn: '73089090',
        qty: 45,
        uom: 'Nos',
        rate: 680,
        discountPct: 0,
        gstRate: '18%'
      }
    ]
  }
};

// Image compressor helper
const compressImageFile = (file, maxDim = 600, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width || 400;
          let height = img.height || 300;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const isPng = file.type === 'image/png';
          const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          resolve(e.target.result);
        }
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Main Template Studio View with:
 * 1. Card-Style Templates Hub (PI, Quotation, BOM)
 * 2. Dedicated Live Customizer with Photoshop-style Color Picker,
 *    300px Logo Sizing, Stamp Sizing, Section/Column Removal & Undo!
 */
export default function VRMTemplateStudioView({ onBackToPI }) {
  // Navigation Mode: 'hub' | 'editor'
  const [viewMode, setViewMode] = useState('hub');
  const [activeCategory, setActiveCategory] = useState('pi'); // 'pi' | 'quotation' | 'bom'
  const [activeTemplateId, setActiveTemplateId] = useState('pi_std');

  // Multi-Templates Store loaded from localStorage
  const [templatesStore, setTemplatesStore] = useState(() => {
    try {
      const saved = localStorage.getItem('vrm_multi_templates_v2');
      if (saved) {
        return { ...DEFAULT_MULTI_TEMPLATES, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_MULTI_TEMPLATES;
  });

  // Current working settings for the active template
  const [currentSettings, setCurrentSettings] = useState(() => {
    const list = templatesStore.pi || [];
    const def = list.find(t => t.isDefault) || list[0];
    return def ? def.settings : DEFAULT_PI_TEMPLATE_SETTINGS;
  });

  // Undo Notification Toast State
  const [undoToast, setUndoToast] = useState(null); // { message: string, key: string, label: string }
  const undoTimeoutRef = useRef(null);

  // Live editable datasets for template categories
  const [datasets, setDatasets] = useState(SAMPLE_DATASETS);

  const handleUpdatePiData = (patch) => {
    setDatasets(prev => ({
      ...prev,
      [activeCategory]: {
        ...(prev[activeCategory] || SAMPLE_DATASETS.pi),
        ...patch
      }
    }));
  };

  // Save Toast
  const [saveNotice, setSaveNotice] = useState(null);

  // Modal State: "Save as New Template"
  const [newTemplateModalOpen, setNewTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  // Editor Sidebar Drawer active tab
  const [editorMenu, setEditorMenu] = useState('color'); // 'color' | 'logo' | 'stamp' | 'columns' | 'sections'
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [fitToWidth, setFitToWidth] = useState(true);
  const previewContainerRef = useRef(null);

  // File Upload refs
  const logoInputRef = useRef(null);
  const stampInputRef = useRef(null);

  // Save store changes to localStorage
  const persistStore = (newStore) => {
    setTemplatesStore(newStore);
    try {
      localStorage.setItem('vrm_multi_templates_v2', JSON.stringify(newStore));
    } catch (e) {
      console.warn('Failed to save templates store to localStorage:', e);
    }
  };

  // Open a template in editor
  const handleOpenEditor = (categoryKey, templateId) => {
    const list = templatesStore[categoryKey] || [];
    const tmpl = list.find(t => t.id === templateId) || list[0];
    if (tmpl) {
      setActiveCategory(categoryKey);
      setActiveTemplateId(tmpl.id);
      setCurrentSettings({ ...tmpl.settings });
      setViewMode('editor');
    }
  };

  // Update setting in working draft
  const updateSetting = (updates) => {
    setCurrentSettings(prev => ({ ...prev, ...updates }));
  };

  // Triggered when a section or column is removed in the editor
  const handleElementRemoved = (key, label) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast({ key, label, message: `Removed "${label}"` });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 8000);
  };

  // Trigger Undo
  const handleUndo = () => {
    if (undoToast && undoToast.key) {
      updateSetting({ [undoToast.key]: true });
      setUndoToast(null);
    }
  };

  // Save Current Template as Default for its Category
  const handleSaveAsDefault = () => {
    const list = templatesStore[activeCategory] || [];
    const updatedList = list.map(t => ({
      ...t,
      isDefault: t.id === activeTemplateId,
      settings: t.id === activeTemplateId ? currentSettings : t.settings,
      lastModified: t.id === activeTemplateId ? new Date().toLocaleDateString('en-GB') : t.lastModified
    }));

    const newStore = { ...templatesStore, [activeCategory]: updatedList };
    persistStore(newStore);
    setSaveNotice('Template saved as active default!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Save changes to current template
  const handleSaveChanges = () => {
    const list = templatesStore[activeCategory] || [];
    const updatedList = list.map(t => {
      if (t.id === activeTemplateId) {
        return {
          ...t,
          settings: currentSettings,
          lastModified: new Date().toLocaleDateString('en-GB')
        };
      }
      return t;
    });
    const newStore = { ...templatesStore, [activeCategory]: updatedList };
    persistStore(newStore);
    setSaveNotice('Changes saved successfully!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  // Save as New Template Variant
  const handleConfirmSaveNew = () => {
    if (!newTemplateName.trim()) return;
    const newId = `${activeCategory}_${Date.now()}`;
    const newRecord = {
      id: newId,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom user-saved template variant',
      isDefault: false,
      lastModified: new Date().toLocaleDateString('en-GB'),
      settings: { ...currentSettings }
    };

    const currentList = templatesStore[activeCategory] || [];
    const updatedList = [...currentList, newRecord];
    const newStore = { ...templatesStore, [activeCategory]: updatedList };
    persistStore(newStore);
    setActiveTemplateId(newId);
    setNewTemplateModalOpen(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setSaveNotice(`Created new template: "${newRecord.name}"`);
    setTimeout(() => setSaveNotice(null), 3500);
  };

  // Delete a non-default template
  const handleDeleteTemplate = (categoryKey, templateId, e) => {
    e.stopPropagation();
    const list = templatesStore[categoryKey] || [];
    const target = list.find(t => t.id === templateId);
    if (!target) return;
    if (target.isDefault) {
      alert('The system default template cannot be deleted. Set another template as default first.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${target.name}"?`)) {
      const updatedList = list.filter(t => t.id !== templateId);
      const newStore = { ...templatesStore, [categoryKey]: updatedList };
      persistStore(newStore);
    }
  };

  // Export to PDF
  const handleDownloadPdf = async () => {
    const sheetEl = document.getElementById('studio-printable-sheet');
    if (!sheetEl) return;
    try {
      const prevZoom = zoomLevel;
      setZoomLevel(1);
      await new Promise(r => setTimeout(r, 200));

      const canvas = await html2canvas(sheetEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => element.classList?.contains('no-print')
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${currentSettings.documentTitle || 'VRM_Template'}_${activeTemplateId}.pdf`);
      setZoomLevel(prevZoom);
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message);
    }
  };

  // Calculate dynamic fit-to-width zoom
  useEffect(() => {
    if (viewMode !== 'editor' || !previewContainerRef.current) return;
    const calculateOptimalZoom = () => {
      if (!fitToWidth || !previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.clientWidth - 48;
      if (containerWidth > 0 && containerWidth < 880) {
        const calculated = Math.min(1, Math.max(0.55, containerWidth / 870));
        setZoomLevel(Math.round(calculated * 100) / 100);
      } else {
        setZoomLevel(1);
      }
    };
    calculateOptimalZoom();
    window.addEventListener('resize', calculateOptimalZoom);
    return () => window.removeEventListener('resize', calculateOptimalZoom);
  }, [viewMode, fitToWidth, isMenuCollapsed]);

  // Current active template object
  const activeTemplateObj = (templatesStore[activeCategory] || []).find(t => t.id === activeTemplateId) || { name: 'Template' };

  // ==========================================
  // VIEW 1: TEMPLATES HUB (CARD STYLE OVERVIEW)
  // ==========================================
  if (viewMode === 'hub') {
    const categories = [
      {
        key: 'pi',
        title: 'Proforma Invoice (PI)',
        badgeColor: '#0E7490',
        icon: Receipt,
        description: 'Customer GST proforma invoices, formal payment requests, advance billing, and dispatch advice.',
        templates: templatesStore.pi || []
      },
      {
        key: 'quotation',
        title: 'Quotation / Commercial Proposals',
        badgeColor: '#1E3A8A',
        icon: FileSpreadsheet,
        description: 'Commercial bids, solar engineering quotations, client tenders, and lump-sum estimates.',
        templates: templatesStore.quotation || []
      },
      {
        key: 'bom',
        title: 'Bill of Materials (BOM)',
        badgeColor: '#1E293B',
        icon: GitBranch,
        description: 'Fabrication specifications, zinc micron standards, member schedules, and assembly lists.',
        templates: templatesStore.bom || []
      }
    ];

    const totalCount = categories.reduce((sum, c) => sum + c.templates.length, 0);

    return (
      <div style={{
        backgroundColor: '#F8FAFC',
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
        padding: '24px 32px 80px 32px'
      }}>
        {/* Top Hub Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid #E2E8F0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#0E7490',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(14, 116, 144, 0.25)'
              }}>
                <Palette size={22} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.3px' }}>
                  Templates Studio
                </h1>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                  Manage, customize, and save executive print layouts for Proforma Invoices, Quotations, and Bill of Materials.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              backgroundColor: '#ECFEFF',
              color: '#0E7490',
              border: '1px solid #A5F3FC',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              {totalCount} Total Templates Active
            </span>
            {onBackToPI && (
              <button
                type="button"
                onClick={onBackToPI}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} />
                Back to Proforma Invoice
              </button>
            )}
          </div>
        </div>

        {/* 3 Main Category Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const defaultTmpl = cat.templates.find(t => t.isDefault) || cat.templates[0];

            return (
              <div
                key={cat.key}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Card Header Banner */}
                <div style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid #E2E8F0',
                  borderTop: `4px solid ${cat.badgeColor}`,
                  backgroundColor: '#FAFAFA'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: `${cat.badgeColor}15`,
                        color: cat.badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                          {cat.title}
                        </h2>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>
                          {cat.templates.length} {cat.templates.length === 1 ? 'Template Saved' : 'Templates Saved'}
                        </span>
                      </div>
                    </div>

                    <span style={{
                      backgroundColor: `${cat.badgeColor}15`,
                      color: cat.badgeColor,
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      {cat.key.toUpperCase()}
                    </span>
                  </div>

                  <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                    {cat.description}
                  </p>
                </div>

                {/* Templates List inside this Category Card */}
                <div style={{
                  padding: '16px 20px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  paddingRight: '6px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Available Templates in this Section:
                  </div>

                  {cat.templates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      onClick={() => handleOpenEditor(cat.key, tmpl.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: tmpl.isDefault ? `1.5px solid ${cat.badgeColor}` : '1px solid #E2E8F0',
                        backgroundColor: tmpl.isDefault ? `${cat.badgeColor}08` : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = cat.badgeColor;
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = tmpl.isDefault ? cat.badgeColor : '#E2E8F0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                            {tmpl.name}
                          </span>
                          {tmpl.isDefault && (
                            <span style={{
                              backgroundColor: cat.badgeColor,
                              color: '#FFFFFF',
                              fontSize: '9.5px',
                              fontWeight: '800',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <Star size={9} fill="#FFFFFF" />
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', lineHeight: '1.3' }}>
                          {tmpl.description}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                          Last modified: {tmpl.lastModified || 'Recent'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!tmpl.isDefault && (
                          <button
                            type="button"
                            title="Delete this template"
                            onClick={(e) => handleDeleteTemplate(cat.key, tmpl.id, e)}
                            style={{
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <ChevronRight size={16} color="#94A3B8" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Action Buttons Footer */}
                <div style={{
                  padding: '14px 20px',
                  backgroundColor: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEditor(cat.key, defaultTmpl.id)}
                    style={{
                      flex: 1,
                      backgroundColor: cat.badgeColor,
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: `0 2px 6px ${cat.badgeColor}30`
                    }}
                  >
                    <Sliders size={14} />
                    Customize {cat.title.split(' ')[0]}
                  </button>

                  <button
                    type="button"
                    title="Create new template variant"
                    onClick={() => {
                      setActiveCategory(cat.key);
                      setActiveTemplateId(defaultTmpl.id);
                      setCurrentSettings({ ...defaultTmpl.settings });
                      setNewTemplateName(`${cat.title.split(' ')[0]} Variant`);
                      setNewTemplateModalOpen(true);
                    }}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} />
                    New
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Footer Note */}
        <div style={{ marginTop: '36px', textAlign: 'center', fontSize: '11px', color: '#94A3B8' }}>
          VRM Structures India Private Limited • Chennai, Tamil Nadu, India
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: TEMPLATE LIVE CUSTOMIZER / EDITOR
  // ==========================================
  const activeDataset = datasets[activeCategory] || SAMPLE_DATASETS.pi;
  const activeAccent = currentSettings.accentColor || '#0E7490';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '100%',
      width: '100%',
      backgroundColor: '#F1F5F9',
      overflow: 'hidden',
      flex: 1,
      minHeight: 0
    }}>
      
      {/* 1. TOP EDITOR NAVIGATION & ACTION BAR */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        zIndex: 50,
        flexShrink: 0
      }}>
        {/* Left: Back to Hub + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setViewMode('hub')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F8FAFC',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} />
            Templates Hub
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: `${activeAccent}15`,
              color: activeAccent,
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              {activeCategory.toUpperCase()}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
              {activeTemplateObj.name}
            </span>
            {activeTemplateObj.isDefault && (
              <span style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                fontSize: '9.5px',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                ACTIVE DEFAULT
              </span>
            )}
          </div>
        </div>

        {/* Center: Zoom & View Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: '#F8FAFC',
          padding: '3px 8px',
          borderRadius: '6px',
          border: '1px solid #E2E8F0'
        }}>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => {
              setFitToWidth(false);
              setZoomLevel(prev => Math.max(0.4, Math.round((prev - 0.1) * 10) / 10));
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '4px',
              color: '#475569'
            }}
          >
            <ZoomOut size={14} />
          </button>
          
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', minWidth: '38px', textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            title="Zoom In"
            onClick={() => {
              setFitToWidth(false);
              setZoomLevel(prev => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '4px',
              color: '#475569'
            }}
          >
            <ZoomIn size={14} />
          </button>

          <button
            type="button"
            title={fitToWidth ? "Fit to Width Active" : "Fit to Width"}
            onClick={() => {
              if (fitToWidth) {
                setFitToWidth(false);
                setZoomLevel(1);
              } else {
                setFitToWidth(true);
              }
            }}
            style={{
              marginLeft: '4px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '4px',
              border: fitToWidth ? `1px solid ${activeAccent}` : '1px solid #CBD5E1',
              backgroundColor: fitToWidth ? `${activeAccent}15` : '#FFFFFF',
              color: fitToWidth ? activeAccent : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Maximize2 size={12} />
            Fit
          </button>
        </div>

        {/* Center/Right: Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSaveAsDefault}
            title="Make this template the active default for this section"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              color: activeAccent,
              border: `1.5px solid ${activeAccent}`,
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Star size={14} />
            Save as Default
          </button>

          <button
            type="button"
            onClick={() => {
              setNewTemplateName(`${activeTemplateObj.name} Copy`);
              setNewTemplateModalOpen(true);
            }}
            title="Save these settings as a new template variant"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
            Save as New
          </button>

          <button
            type="button"
            onClick={handleSaveChanges}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeAccent,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: `0 2px 6px ${activeAccent}35`
            }}
          >
            <Save size={14} />
            Save Changes
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Printer size={14} />
            Print
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1E293B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: LEFT CUSTOMIZER DRAWER + RIGHT LIVE PREVIEW */}
      <div style={{
        display: 'flex',
        flex: 1,
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* LEFT DRAWER: CUSTOMIZATION PANELS */}
        <div style={{
          width: isMenuCollapsed ? '48px' : '360px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          transition: 'width 0.2s ease',
          zIndex: 40,
          flexShrink: 0
        }}>
          {/* Drawer Category Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            overflowX: 'auto'
          }}>
            <button
              type="button"
              onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
              title={isMenuCollapsed ? 'Expand Controls' : 'Collapse Controls'}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: '10px 12px',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              {isMenuCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            {!isMenuCollapsed && (
              <div style={{ display: 'flex', overflowX: 'auto', flex: 1 }}>
                {[
                  { id: 'color', label: 'Color Picker', icon: Palette },
                  { id: 'logo', label: 'Logo Sizing', icon: Image },
                  { id: 'stamp', label: 'Stamp & Sign', icon: ShieldCheck },
                  { id: 'columns', label: 'Columns', icon: Layers },
                  { id: 'sections', label: 'Sections', icon: Settings2 }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = editorMenu === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEditorMenu(tab.id)}
                      style={{
                        padding: '10px 10px',
                        border: 'none',
                        borderBottom: isActive ? `2px solid ${activeAccent}` : '2px solid transparent',
                        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                        color: isActive ? activeAccent : '#64748B',
                        fontSize: '11px',
                        fontWeight: isActive ? '800' : '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Tab Content */}
          {!isMenuCollapsed && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              
              {/* TAB 1: PHOTOSHOP-STYLE COLOR PICKER */}
              {editorMenu === 'color' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '2px' }}>
                      Photoshop-Style Color Picker
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Set the primary accent color across tables, headers, and stamps.
                    </div>
                  </div>

                  {/* Hex & Live Spectrum Picker */}
                  <div style={{
                    padding: '14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Native HTML5 Color Spectrum Picker Button */}
                      <label style={{ position: 'relative', cursor: 'pointer' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          backgroundColor: activeAccent,
                          border: '2px solid #FFFFFF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Palette size={18} color="#FFFFFF" />
                        </div>
                        <input
                          type="color"
                          value={activeAccent}
                          onChange={(e) => updateSetting({ accentColor: e.target.value })}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            opacity: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer'
                          }}
                        />
                      </label>

                      {/* Hex Code Input */}
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                          Hex Color Code (#)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <input
                            type="text"
                            maxLength={7}
                            value={activeAccent}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (!v.startsWith('#')) v = '#' + v;
                              updateSetting({ accentColor: v.toUpperCase() });
                            }}
                            style={{
                              flex: 1,
                              padding: '7px 10px',
                              fontSize: '13px',
                              fontFamily: 'monospace',
                              fontWeight: '700',
                              color: '#0F172A',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Current Theme: <strong>{activeAccent}</strong></span>
                      <span>Click swatch or enter custom Hex</span>
                    </div>
                  </div>

                  {/* Preset Swatches Palette */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Curated Color Swatches
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px'
                    }}>
                      {COLOR_PRESETS.map((color) => {
                        const isSelected = activeAccent.toLowerCase() === color.hex.toLowerCase();
                        return (
                          <button
                            key={color.hex}
                            type="button"
                            onClick={() => updateSetting({ accentColor: color.hex })}
                            title={`${color.name} (${color.hex})`}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: isSelected ? `2px solid ${color.hex}` : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: isSelected ? `0 2px 8px ${color.hex}40` : 'none'
                            }}
                          >
                            <div style={{
                              width: '100%',
                              height: '24px',
                              borderRadius: '4px',
                              backgroundColor: color.hex
                            }} />
                            <span style={{ fontSize: '9.5px', fontWeight: '700', color: isSelected ? color.hex : '#64748B', textAlign: 'center' }}>
                              {color.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LOGO EDITING & 300PX SLIDER */}
              {editorMenu === 'logo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '2px' }}>
                      Company Logo Sizing & Upload
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Upload custom logo and scale size up to <strong>300 px</strong>.
                    </div>
                  </div>

                  {/* Logo Size Slider (Up to 300px) */}
                  <div style={{
                    padding: '14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                        Logo Height:
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: activeAccent }}>
                        {currentSettings.logoHeight || 52} px
                      </span>
                    </div>

                    <input
                      type="range"
                      min={30}
                      max={300}
                      step={5}
                      value={currentSettings.logoHeight || 52}
                      onChange={(e) => updateSetting({ logoHeight: parseInt(e.target.value, 10) })}
                      style={{ accentColor: activeAccent, width: '100%', cursor: 'pointer' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94A3B8' }}>
                      <span>Compact (30px)</span>
                      <span>Standard (65px)</span>
                      <span>Large (300px)</span>
                    </div>
                  </div>

                  {/* Upload Custom Logo Button */}
                  <div style={{
                    padding: '14px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px dashed #CBD5E1',
                    textAlign: 'center'
                  }}>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const compressed = await compressImageFile(file, 600, 0.9);
                        updateSetting({ customLogoUrl: compressed, showLogo: true });
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      style={{
                        backgroundColor: activeAccent,
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Upload size={14} />
                      Upload New Logo Image
                    </button>

                    {currentSettings.customLogoUrl && (
                      <div style={{ marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => updateSetting({ customLogoUrl: null })}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Reset to VRM Default Logo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: STAMP & SIGNATURE SIZING */}
              {editorMenu === 'stamp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '2px' }}>
                      Company Stamp & Seal Size
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Adjust stamp dimensions (up to 250px) or upload custom stamp.
                    </div>
                  </div>

                  {/* Stamp Size Slider (Up to 250px) */}
                  <div style={{
                    padding: '14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>
                        Stamp Size Width:
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: activeAccent }}>
                        {currentSettings.stampSize || 125} px
                      </span>
                    </div>

                    <input
                      type="range"
                      min={40}
                      max={250}
                      step={5}
                      value={currentSettings.stampSize || 125}
                      onChange={(e) => updateSetting({ stampSize: parseInt(e.target.value, 10) })}
                      style={{ accentColor: activeAccent, width: '100%', cursor: 'pointer' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94A3B8' }}>
                      <span>40px</span>
                      <span>Standard (125px)</span>
                      <span>Extra Large (250px)</span>
                    </div>
                  </div>

                  {/* Stamp Mode (Vector vs Custom Upload) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                      Stamp Render Mode
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => updateSetting({ stampMode: 'vector' })}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: currentSettings.stampMode === 'vector' ? `2px solid ${activeAccent}` : '1px solid #CBD5E1',
                          backgroundColor: currentSettings.stampMode === 'vector' ? `${activeAccent}10` : '#FFFFFF',
                          color: '#0F172A',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Vector Oval Seal
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSetting({ stampMode: 'custom' })}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: currentSettings.stampMode === 'custom' ? `2px solid ${activeAccent}` : '1px solid #CBD5E1',
                          backgroundColor: currentSettings.stampMode === 'custom' ? `${activeAccent}10` : '#FFFFFF',
                          color: '#0F172A',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Custom Image Stamp
                      </button>
                    </div>

                    {currentSettings.stampMode === 'custom' && (
                      <div style={{ marginTop: '8px' }}>
                        <input
                          ref={stampInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const compressed = await compressImageFile(file, 400, 0.9);
                            updateSetting({ customStampUrl: compressed });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => stampInputRef.current?.click()}
                          style={{
                            width: '100%',
                            backgroundColor: '#FFFFFF',
                            border: '1px dashed #CBD5E1',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: activeAccent,
                            cursor: 'pointer'
                          }}
                        >
                          Upload Stamp File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: TABLE COLUMNS (WITH INSTANT UNDO) */}
              {editorMenu === 'columns' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '2px' }}>
                      Table Columns Visibility
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Toggle any column on or off (e.g. hide Amount or Unit Rates). Undo anytime.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { key: 'showTotalCol', label: 'Total Amount Column' },
                      { key: 'showRateCol', label: 'Rate (₹) Column' },
                      { key: 'showTaxableCol', label: 'Taxable Value Column' },
                      { key: 'showGstCol', label: 'GST% Column' },
                      { key: 'showDiscountCol', label: 'Discount% Column' },
                      { key: 'showHsn', label: 'HSN / SAC Code Column' },
                      { key: 'showQty', label: 'Quantity Column' },
                      { key: 'showUom', label: 'UOM Column' },
                      { key: 'showSnoCol', label: 'S.No Column' },
                      { key: 'showItemDescription', label: 'Item Technical Specs Description' }
                    ].map(col => {
                      const isChecked = currentSettings[col.key] !== false;
                      return (
                        <label
                          key={col.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            backgroundColor: isChecked ? '#FFFFFF' : '#F1F5F9',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: isChecked ? '#0F172A' : '#94A3B8',
                            fontWeight: '700'
                          }}
                        >
                          <span>{col.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateSetting({ [col.key]: checked });
                              if (!checked) {
                                handleElementRemoved(col.key, col.label);
                              }
                            }}
                            style={{ accentColor: activeAccent, cursor: 'pointer' }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: SECTIONS TOGGLES (WITH INSTANT UNDO) */}
              {editorMenu === 'sections' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '2px' }}>
                      Document Sections Visibility
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Show or hide sections like Shipping, Banking, Terms, and Signatures.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { key: 'showShipTo', label: 'Ship To / Delivery Destination' },
                      { key: 'showTransportDetails', label: 'Transport Mode & LR / Vehicle No' },
                      { key: 'showBankDetails', label: 'Bank Details Box' },
                      { key: 'showTerms', label: 'Terms & Conditions' },
                      { key: 'showTotalInWords', label: 'Amount in Words' },
                      { key: 'showCustomerAcceptance', label: 'Customer Acceptance Sign Box' },
                      { key: 'showSignatoryStamp', label: 'Company Signatory & Stamp Box' },
                      { key: 'showPaymentTerms', label: 'Payment Terms in Meta Header' },
                      { key: 'showPlaceOfSupply', label: 'Place of Supply Meta' },
                      { key: 'showSalesExecutive', label: 'Sales Executive Name' }
                    ].map(sec => {
                      const isChecked = currentSettings[sec.key] !== false;
                      return (
                        <label
                          key={sec.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            backgroundColor: isChecked ? '#FFFFFF' : '#F1F5F9',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: isChecked ? '#0F172A' : '#94A3B8',
                            fontWeight: '700'
                          }}
                        >
                          <span>{sec.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateSetting({ [sec.key]: checked });
                              if (!checked) {
                                handleElementRemoved(sec.key, sec.label);
                              }
                            }}
                            style={{ accentColor: activeAccent, cursor: 'pointer' }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* RIGHT PANE: LIVE CLEAN DOCUMENT SHEET PREVIEW */}
        <div
          ref={previewContainerRef}
          className="template-studio-center-scroller"
          style={{
            flex: 1,
            height: '100%',
            minHeight: 0,
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            scrollBehavior: 'smooth',
            padding: '28px 24px 140px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#E2E8F0'
          }}
        >
          {/* Floating Save Notice */}
          {saveNotice && (
            <div style={{
              position: 'fixed',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              zIndex: 99,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle size={14} color="#10B981" />
              {saveNotice}
            </div>
          )}

          {/* Clean Sheet Scaler Container */}
          <div style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            minHeight: 'fit-content',
            marginBottom: zoomLevel > 1 ? `${Math.round((zoomLevel - 1) * 1600)}px` : '40px'
          }}>
            <VRMProformaInvoicePrintSheet
              id="studio-printable-sheet"
              piData={activeDataset}
              settings={currentSettings}
              isEditable={true}
              onUpdateSetting={updateSetting}
              onUpdatePiData={handleUpdatePiData}
              onElementRemoved={handleElementRemoved}
            />
          </div>
        </div>

      </div>

      {/* 3. FLOATING UNDO NOTIFICATION TOAST */}
      {undoToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '30px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          zIndex: 100,
          border: '1px solid rgba(255,255,255,0.15)',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <span style={{ fontSize: '12.5px', fontWeight: '600' }}>
            {undoToast.message}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            style={{
              backgroundColor: '#ECFEFF',
              color: '#0E7490',
              border: 'none',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Undo2 size={13} />
            Undo
          </button>
        </div>
      )}

      {/* 4. MODAL: SAVE AS NEW TEMPLATE */}
      {newTemplateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            width: '420px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
              Save as New Template
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748B' }}>
              Create a new template variant in <strong>{activeCategory.toUpperCase()}</strong> with current layout and settings.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Template Name</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Commercial PI (Zero Rates)"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="Short description of this template variant..."
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setNewTemplateModalOpen(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
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
                onClick={handleConfirmSaveNew}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeAccent,
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
