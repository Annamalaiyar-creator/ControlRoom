import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  Save,
  RotateCcw,
  Palette,
  PenTool,
  Stamp,
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
  Sliders
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  VRMProformaInvoicePrintSheet,
  DEFAULT_PI_TEMPLATE_SETTINGS
} from './VRMProformaInvoicePrintTemplate';

const COLOR_PRESETS = [
  { name: 'VRM Teal', hex: '#0E7490' },
  { name: 'Royal Navy', hex: '#1E3A8A' },
  { name: 'Tech Cobalt', hex: '#2563EB' },
  { name: 'Emerald Forest', hex: '#059669' },
  { name: 'Charcoal Slate', hex: '#1E293B' },
  { name: 'Crimson Burgundy', hex: '#991B1B' }
];

const TITLE_PRESETS = ['PROFORMA INVOICE', 'QUOTATION', 'ESTIMATE', 'PROFORMA TAX INVOICE'];

// Sample PI Data for live preview
const SAMPLE_PREVIEW_PI = {
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
  transportScope: 'VRM Structures',
  items: [
    {
      sNo: 1,
      name: 'Solar On-Grid Mounting Structure (HDG 80 Micron)',
      description: 'Hot Dip Galvanized 2x3 Table 2000mm x 2500mm with C-Channels, Railless clamps, and SS-304 hardware fasteners.',
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
};

// Lightweight canvas image compressor
const compressImageFile = (file, maxDim = 450, quality = 0.85) => {
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

export default function VRMTemplateStudioView({ onBackToPI }) {
  // Active side menu category
  const [activeMenu, setActiveMenu] = useState('branding'); // branding | labels | stamp | signature | columns | addresses | banking | terms
  const [isDirectEditMode, setIsDirectEditMode] = useState(true);
  const [previewPi, setPreviewPi] = useState(SAMPLE_PREVIEW_PI);

  // Load saved preferences or fall back to defaults
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('vrm_pi_template_customization');
      if (saved) {
        return { ...DEFAULT_PI_TEMPLATE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_PI_TEMPLATE_SETTINGS;
  });

  const [saveToast, setSaveToast] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [fitToWidth, setFitToWidth] = useState(true);
  const previewContainerRef = useRef(null);

  // File upload refs
  const logoInputRef = useRef(null);
  const stampInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  // Auto-scale preview sheet dynamically based on available container width
  useEffect(() => {
    if (!previewContainerRef.current) return;
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
    const observer = new ResizeObserver(() => {
      calculateOptimalZoom();
    });
    observer.observe(previewContainerRef.current);
    window.addEventListener('resize', calculateOptimalZoom);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calculateOptimalZoom);
    };
  }, [fitToWidth, isMenuCollapsed]);

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const handleSaveDefaults = () => {
    try {
      localStorage.setItem('vrm_pi_template_customization', JSON.stringify(settings));
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } catch (e) {
      alert('Could not save template settings: ' + e.message);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all template customizations back to VRM factory defaults?')) {
      setSettings(DEFAULT_PI_TEMPLATE_SETTINGS);
      try {
        localStorage.removeItem('vrm_pi_template_customization');
      } catch (e) {}
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    const prevZoom = zoomLevel;
    setZoomLevel(1);
    try {
      const sheetEl = document.getElementById('studio-printable-sheet');
      if (!sheetEl) {
        alert('Could not locate printable sheet element.');
        setIsExporting(false);
        return;
      }
      await new Promise(res => setTimeout(res, 250));

      const canvas = await html2canvas(sheetEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, '', 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, '', 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`VRM_Proforma_Invoice_Template_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setZoomLevel(prevZoom);
      setIsExporting(false);
    }
  };

  // Image Upload Handlers
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 450, 0.85);
      updateSettings({ customLogoUrl: dataUrl, showLogo: true });
    } catch (err) {
      alert('Failed to upload logo: ' + err.message);
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleStampUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 350, 0.85);
      updateSettings({ customStampUrl: dataUrl, stampMode: 'custom', showSignatoryStamp: true });
    } catch (err) {
      alert('Failed to upload stamp: ' + err.message);
    } finally {
      if (stampInputRef.current) stampInputRef.current.value = '';
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 350, 0.85);
      updateSettings({ customSignatureUrl: dataUrl, signatureMode: 'custom', showSignatoryStamp: true });
    } catch (err) {
      alert('Failed to upload signature: ' + err.message);
    } finally {
      if (signatureInputRef.current) signatureInputRef.current.value = '';
    }
  };

  const SIDE_MENU_ITEMS = [
    { id: 'branding', label: 'Company & Branding', icon: Palette, desc: 'Name, address, GSTIN, CIN & logo' },
    { id: 'labels', label: 'Document Labels', icon: FileText, desc: 'Document title, PO/PI labels & dates' },
    { id: 'columns', label: 'Table Columns & Names', icon: Layers, desc: 'Show/hide & rename column headers' },
    { id: 'stamp', label: 'Company Stamp / Seal', icon: Stamp, desc: 'Upload rubber stamp or customize seal' },
    { id: 'signature', label: 'Authorized Signature', icon: PenTool, desc: 'Upload signature & signatory title' },
    { id: 'addresses', label: 'Addresses & Dispatch', icon: Building2, desc: 'Ship To, transporter & sales exec' },
    { id: 'banking', label: 'Bank Account Details', icon: CreditCard, desc: 'Beneficiary, account no & IFSC' },
    { id: 'terms', label: 'Terms & Footer', icon: Sparkles, desc: 'Commercial policy, acceptance & notes' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '850px', width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', backgroundColor: '#F1F5F9' }}>

      {/* TOP STUDIO HEADER BAR */}
      <div
        className="no-print"
        style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
          zIndex: 20,
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {onBackToPI && (
            <button
              onClick={onBackToPI}
              style={{
                backgroundColor: '#1E293B',
                color: '#94A3B8',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} /> Back to PIs
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.2px' }}>
                PDF & Print Template Studio
              </span>
              <span style={{
                fontSize: '10px',
                backgroundColor: settings.accentColor || '#0E7490',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '700'
              }}>
                Live Customizer
              </span>
              <button
                onClick={() => setIsMenuCollapsed(prev => !prev)}
                title={isMenuCollapsed ? 'Show Customization Controls' : 'Hide Customization Controls'}
                style={{
                  backgroundColor: isMenuCollapsed ? '#0E7490' : '#1E293B',
                  color: '#FFFFFF',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginLeft: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isMenuCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
                <span>{isMenuCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
              Changes apply across all Proforma Invoices, Quotations, and Print documents
            </div>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {saveToast && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#15803D',
              backgroundColor: '#DCFCE7',
              padding: '6px 14px',
              borderRadius: '8px'
            }}>
              <CheckCircle size={15} /> Saved as Default Template!
            </div>
          )}

          <button
            onClick={handleSaveDefaults}
            style={{
              backgroundColor: '#0E7490',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(14,116,144,0.4)'
            }}
          >
            <Save size={15} /> Save As Default
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            style={{
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: isExporting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={15} /> {isExporting ? 'Generating PDF...' : 'Sample PDF'}
          </button>

          <button
            onClick={handlePrint}
            style={{
              backgroundColor: '#334155',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={15} /> Print
          </button>

          <button
            onClick={handleResetDefaults}
            title="Reset to factory VRM defaults"
            style={{
              backgroundColor: 'transparent',
              color: '#94A3B8',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN STUDIO WORKSPACE */}
      <div style={{ display: 'flex', flex: 1, minWidth: 0, width: '100%', overflow: 'hidden' }}>

        {/* ==================== LEFT COLUMN: SEPARATE SIDE MENU ==================== */}
        <div
          className="no-print"
          style={{
            width: isMenuCollapsed ? '0px' : '330px',
            minWidth: isMenuCollapsed ? '0px' : '330px',
            maxWidth: isMenuCollapsed ? '0px' : '330px',
            flexShrink: 0,
            backgroundColor: '#FFFFFF',
            borderRight: isMenuCollapsed ? 'none' : '1px solid #CBD5E1',
            display: isMenuCollapsed ? 'none' : 'flex',
            flexDirection: 'column',
            overflowY: isMenuCollapsed ? 'hidden' : 'auto',
            overflowX: 'hidden',
            boxShadow: isMenuCollapsed ? 'none' : '4px 0 16px rgba(0,0,0,0.03)',
            zIndex: 10,
            transition: 'width 0.2s ease'
          }}
        >
          {/* SIDE MENU TABS STRIP */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
              Customization Menu
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {SIDE_MENU_ITEMS.map(item => {
                const Icon = item.icon;
                const isSelected = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #A5F3FC' : '1px solid transparent',
                      backgroundColor: isSelected ? '#ECFEFF' : 'transparent',
                      color: isSelected ? '#0E7490' : '#334155',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#0E7490' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={15} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: isSelected ? '800' : '600', fontSize: '12.5px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.desc}
                      </div>
                    </div>

                    {isSelected && <Check size={14} style={{ color: '#0E7490' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE CATEGORY SETTINGS FORM */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

            {/* 1. BRANDING & LOGO */}
            {activeMenu === 'branding' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Logo Upload Box */}
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Image size={15} style={{ color: '#0E7490' }} /> Company Logo
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.showLogo}
                        onChange={(e) => updateSettings({ showLogo: e.target.checked })}
                        style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                      />
                      <span>Show Logo</span>
                    </label>
                  </div>

                  {settings.showLogo && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{
                        padding: '10px 14px',
                        backgroundColor: '#FFFFFF',
                        border: '1px dashed #CBD5E1',
                        borderRadius: '8px',
                        textAlign: 'center',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={settings.customLogoUrl || '/vrm_logo.png'}
                          alt="Logo Preview"
                          style={{ maxHeight: `${settings.logoHeight || 52}px`, maxWidth: '200px', objectFit: 'contain' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleLogoUpload}
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            backgroundColor: '#0E7490',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Upload size={13} /> {settings.customLogoUrl ? 'Change Logo Image' : 'Upload Custom Logo'}
                        </button>

                        {settings.customLogoUrl && (
                          <button
                            onClick={() => updateSettings({ customLogoUrl: null })}
                            title="Reset to default VRM logo"
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={13} /> Reset
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                        <span>Logo Size ({settings.logoHeight || 52}px)</span>
                        <input
                          type="range"
                          min="35"
                          max="75"
                          value={settings.logoHeight || 52}
                          onChange={(e) => updateSettings({ logoHeight: Number(e.target.value) })}
                          style={{ width: '130px', accentColor: settings.accentColor, cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Accent Color Palettes */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                    Brand Accent Color
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {COLOR_PRESETS.map(preset => {
                      const isSelected = settings.accentColor === preset.hex;
                      return (
                        <button
                          key={preset.hex}
                          onClick={() => updateSettings({ accentColor: preset.hex })}
                          style={{
                            padding: '8px 10px',
                            border: isSelected ? `2px solid ${preset.hex}` : '1px solid #E2E8F0',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? `${preset.hex}12` : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '11px',
                            fontWeight: isSelected ? '700' : '500',
                            color: '#1E293B'
                          }}
                        >
                          <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: preset.hex, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Company Information Inputs */}
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Company Details (Header)</div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Company Name</label>
                    <input
                      type="text"
                      value={settings.companyName || ''}
                      onChange={(e) => updateSettings({ companyName: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Company Tagline / Subtitle</label>
                    <input
                      type="text"
                      value={settings.companyTagline || ''}
                      onChange={(e) => updateSettings({ companyTagline: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Address Line 1</label>
                    <input
                      type="text"
                      value={settings.companyAddressLine1 || ''}
                      onChange={(e) => updateSettings({ companyAddressLine1: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Address Line 2 (City, State, PIN)</label>
                    <input
                      type="text"
                      value={settings.companyAddressLine2 || ''}
                      onChange={(e) => updateSettings({ companyAddressLine2: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Company GSTIN</label>
                      <input
                        type="text"
                        value={settings.companyGstin || ''}
                        onChange={(e) => updateSettings({ companyGstin: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11px', fontFamily: 'monospace', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Company CIN</label>
                      <input
                        type="text"
                        value={settings.companyCin || ''}
                        onChange={(e) => updateSettings({ companyCin: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11px', fontFamily: 'monospace', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Phone / Support</label>
                      <input
                        type="text"
                        value={settings.companyPhone || ''}
                        onChange={(e) => updateSettings({ companyPhone: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Official Email</label>
                      <input
                        type="text"
                        value={settings.companyEmail || ''}
                        onChange={(e) => updateSettings({ companyEmail: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Website</label>
                    <input
                      type="text"
                      value={settings.companyWebsite || ''}
                      onChange={(e) => updateSettings({ companyWebsite: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Header Information Toggles */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Header Visibility Options</label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#334155' }}>
                    <span>Show GSTIN & CIN Registration</span>
                    <input
                      type="checkbox"
                      checked={settings.showCinGst}
                      onChange={(e) => updateSettings({ showCinGst: e.target.checked })}
                      style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#334155' }}>
                    <span>Show Factory Address & Contact Info</span>
                    <input
                      type="checkbox"
                      checked={settings.showContactInfo}
                      onChange={(e) => updateSettings({ showContactInfo: e.target.checked })}
                      style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 2. DOCUMENT LABELS */}
            {activeMenu === 'labels' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Document Title Selector */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Main Document Title
                  </label>
                  <input
                    type="text"
                    value={settings.documentTitle}
                    onChange={(e) => updateSettings({ documentTitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: '#0F172A',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {TITLE_PRESETS.map(preset => (
                      <button
                        key={preset}
                        onClick={() => updateSettings({ documentTitle: preset })}
                        style={{
                          fontSize: '10.5px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: settings.documentTitle === preset ? '#ECFEFF' : '#F8FAFC',
                          color: settings.documentTitle === preset ? '#0E7490' : '#475569',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customizable Field Labels */}
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Customize Field Labels</div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Document Number Label</label>
                    <input
                      type="text"
                      value={settings.docNoLabel || 'Document No:'}
                      onChange={(e) => updateSettings({ docNoLabel: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Date Label</label>
                      <input
                        type="text"
                        value={settings.dateLabel || 'Date:'}
                        onChange={(e) => updateSettings({ dateLabel: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Valid Until Label</label>
                      <input
                        type="text"
                        value={settings.validUntilLabel || 'Valid Until:'}
                        onChange={(e) => updateSettings({ validUntilLabel: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Payment Terms Label</label>
                    <input
                      type="text"
                      value={settings.paymentTermsLabel || 'Payment Terms:'}
                      onChange={(e) => updateSettings({ paymentTermsLabel: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Place Of Supply Label</label>
                    <input
                      type="text"
                      value={settings.placeOfSupplyLabel || 'Place Of Supply:'}
                      onChange={(e) => updateSettings({ placeOfSupplyLabel: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Sales Executive Label</label>
                    <input
                      type="text"
                      value={settings.salesExecutiveLabel || 'Sales Executive:'}
                      onChange={(e) => updateSettings({ salesExecutiveLabel: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Bill To Label</label>
                      <input
                        type="text"
                        value={settings.billToLabel || 'Bill To / Buyer:'}
                        onChange={(e) => updateSettings({ billToLabel: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Ship To Label</label>
                      <input
                        type="text"
                        value={settings.shipToLabel || 'Ship To / Delivery Destination:'}
                        onChange={(e) => updateSettings({ shipToLabel: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STAMP & SEAL */}
            {activeMenu === 'stamp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Official Stamp Format</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.showSignatoryStamp}
                        onChange={(e) => updateSettings({ showSignatoryStamp: e.target.checked })}
                        style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                      />
                      <span>Show Stamp</span>
                    </label>
                  </div>

                  {settings.showSignatoryStamp && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Stamp Style Modes */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                        {[
                          { id: 'vector', label: 'Vector Seal' },
                          { id: 'custom', label: 'Upload Stamp' },
                          { id: 'none', label: 'No Stamp' }
                        ].map(mode => {
                          const isSel = settings.stampMode === mode.id;
                          return (
                            <button
                              key={mode.id}
                              onClick={() => updateSettings({ stampMode: mode.id })}
                              style={{
                                padding: '8px 6px',
                                borderRadius: '6px',
                                border: isSel ? `2px solid ${settings.accentColor}` : '1px solid #CBD5E1',
                                backgroundColor: isSel ? '#FFFFFF' : '#F1F5F9',
                                color: isSel ? settings.accentColor : '#475569',
                                fontSize: '11px',
                                fontWeight: isSel ? '800' : '600',
                                cursor: 'pointer'
                              }}
                            >
                              {mode.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Vector Seal Custom Text */}
                      {settings.stampMode === 'vector' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>Seal Header Text</label>
                            <input
                              type="text"
                              value={settings.stampText}
                              onChange={(e) => updateSettings({ stampText: e.target.value })}
                              style={{ width: '100%', padding: '7px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>Seal Location Subtitle</label>
                            <input
                              type="text"
                              value={settings.stampLocation}
                              onChange={(e) => updateSettings({ stampLocation: e.target.value })}
                              style={{ width: '100%', padding: '7px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Custom Stamp Upload */}
                      {settings.stampMode === 'custom' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#FFFFFF',
                            border: '1px dashed #CBD5E1',
                            borderRadius: '8px',
                            textAlign: 'center',
                            minHeight: '65px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {settings.customStampUrl ? (
                              <img
                                src={settings.customStampUrl}
                                alt="Custom Stamp Preview"
                                style={{ maxHeight: '55px', maxWidth: '140px', objectFit: 'contain' }}
                              />
                            ) : (
                              <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>No stamp image uploaded yet</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              ref={stampInputRef}
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={handleStampUpload}
                            />
                            <button
                              onClick={() => stampInputRef.current?.click()}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                backgroundColor: '#0E7490',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <Upload size={13} /> {settings.customStampUrl ? 'Change Stamp Image' : 'Upload Rubber Stamp PNG'}
                            </button>

                            {settings.customStampUrl && (
                              <button
                                onClick={() => updateSettings({ customStampUrl: null, stampMode: 'vector' })}
                                title="Remove custom stamp"
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: '#FEE2E2',
                                  color: '#DC2626',
                                  border: '1px solid #FCA5A5',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                            💡 Tip: Uploading a transparent PNG of your official company seal gives the cleanest printed output.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. SIGNATURE */}
            {activeMenu === 'signature' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>
                    Authorized Signature Style
                  </div>

                  {/* Signature Mode Switcher */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                    {[
                      { id: 'vector', label: 'Digital Stroke' },
                      { id: 'custom', label: 'Upload Sign' },
                      { id: 'blank', label: 'Blank Line' }
                    ].map(mode => {
                      const isSel = settings.signatureMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => updateSettings({ signatureMode: mode.id })}
                          style={{
                            padding: '8px 6px',
                            borderRadius: '6px',
                            border: isSel ? `2px solid ${settings.accentColor}` : '1px solid #CBD5E1',
                            backgroundColor: isSel ? '#FFFFFF' : '#F1F5F9',
                            color: isSel ? settings.accentColor : '#475569',
                            fontSize: '11px',
                            fontWeight: isSel ? '800' : '600',
                            cursor: 'pointer'
                          }}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Signature Upload */}
                  {settings.signatureMode === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px dashed #CBD5E1',
                        borderRadius: '8px',
                        textAlign: 'center',
                        minHeight: '55px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {settings.customSignatureUrl ? (
                          <img
                            src={settings.customSignatureUrl}
                            alt="Custom Signature Preview"
                            style={{ maxHeight: '45px', maxWidth: '160px', objectFit: 'contain' }}
                          />
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>No signature image uploaded</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          ref={signatureInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleSignatureUpload}
                        />
                        <button
                          onClick={() => signatureInputRef.current?.click()}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            backgroundColor: '#0E7490',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Upload size={13} /> {settings.customSignatureUrl ? 'Change Signature' : 'Upload Handwritten Sign PNG'}
                        </button>

                        {settings.customSignatureUrl && (
                          <button
                            onClick={() => updateSettings({ customSignatureUrl: null, signatureMode: 'vector' })}
                            title="Remove custom signature"
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Signatory Text Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>Signatory Name (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. M. Annamalaiyar"
                        value={settings.signatoryName || ''}
                        onChange={(e) => updateSettings({ signatoryName: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>Designation Title</label>
                      <input
                        type="text"
                        value={settings.signatoryTitle || 'Authorized Signatory'}
                        onChange={(e) => updateSettings({ signatoryTitle: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Acceptance Box */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '700' }}>
                  <span>Show Customer Acceptance & Sign Box</span>
                  <input
                    type="checkbox"
                    checked={settings.showCustomerAcceptance}
                    onChange={(e) => updateSettings({ showCustomerAcceptance: e.target.checked })}
                    style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                  />
                </label>
              </div>
            )}

            {/* 4. ITEM TABLE COLUMNS */}
            {activeMenu === 'columns' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Toggle which columns and data elements appear in the line items table:
                </div>

                {[
                  { key: 'showHsn', label: 'HSN / SAC Code Column' },
                  { key: 'showUom', label: 'Unit of Measure (UOM) Column' },
                  { key: 'showItemDescription', label: 'Item Technical Description & Specs' },
                  { key: 'showDiscountCol', label: 'Discount % Column' },
                  { key: 'showGstCol', label: 'Line Item GST% Column' }
                ].map(col => (
                  <label
                    key={col.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#0F172A',
                      fontWeight: '700'
                    }}
                  >
                    <span>{col.label}</span>
                    <input
                      type="checkbox"
                      checked={settings[col.key]}
                      onChange={(e) => updateSettings({ [col.key]: e.target.checked })}
                      style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                    />
                  </label>
                ))}

                {/* Rename Column Headers */}
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Rename Column Headers</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>S.No Column</label>
                      <input
                        type="text"
                        value={settings.colHeaderSno || '#'}
                        onChange={(e) => updateSettings({ colHeaderSno: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Item / Description</label>
                      <input
                        type="text"
                        value={settings.colHeaderDesc || 'Item & Specification'}
                        onChange={(e) => updateSettings({ colHeaderDesc: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>HSN/SAC Column</label>
                      <input
                        type="text"
                        value={settings.colHeaderHsn || 'HSN/SAC'}
                        onChange={(e) => updateSettings({ colHeaderHsn: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Quantity Column</label>
                      <input
                        type="text"
                        value={settings.colHeaderQty || 'Qty'}
                        onChange={(e) => updateSettings({ colHeaderQty: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>UOM Column</label>
                      <input
                        type="text"
                        value={settings.colHeaderUom || 'UOM'}
                        onChange={(e) => updateSettings({ colHeaderUom: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Rate Column</label>
                      <input
                        type="text"
                        value={settings.colHeaderRate || 'Rate (₹)'}
                        onChange={(e) => updateSettings({ colHeaderRate: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Discount Column</label>
                      <input
                        type="text"
                        value={settings.colHeaderDiscount || 'Disc%'}
                        onChange={(e) => updateSettings({ colHeaderDiscount: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Taxable Column</label>
                      <input
                        type="text"
                        value={settings.colHeaderTaxable || 'Taxable (₹)'}
                        onChange={(e) => updateSettings({ colHeaderTaxable: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>GST% Column</label>
                      <input
                        type="text"
                        value={settings.colHeaderGst || 'GST%'}
                        onChange={(e) => updateSettings({ colHeaderGst: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Total Column</label>
                      <input
                        type="text"
                        value={settings.colHeaderAmount || 'Total (₹)'}
                        onChange={(e) => updateSettings({ colHeaderAmount: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ADDRESSES & LOGISTICS */}
            {activeMenu === 'addresses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'showShipTo', label: 'Show Ship To / Delivery Address' },
                  { key: 'showTransportDetails', label: 'Show Transport Mode & Vehicle / LR No.' },
                  { key: 'showPaymentTerms', label: 'Show Payment Terms in Header' },
                  { key: 'showPlaceOfSupply', label: 'Show Place Of Supply' },
                  { key: 'showSalesExecutive', label: 'Show Sales Executive Name' }
                ].map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#0F172A',
                      fontWeight: '700'
                    }}
                  >
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={settings[item.key]}
                      onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                      style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                    />
                  </label>
                ))}
              </div>
            )}

            {/* 6. BANKING DETAILS */}
            {activeMenu === 'banking' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '700' }}>
                  <span>Show Company Bank Account</span>
                  <input
                    type="checkbox"
                    checked={settings.showBankDetails}
                    onChange={(e) => updateSettings({ showBankDetails: e.target.checked })}
                    style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                  />
                </label>

                {settings.showBankDetails && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Beneficiary Name</label>
                      <input
                        type="text"
                        value={settings.bankBeneficiary}
                        onChange={(e) => updateSettings({ bankBeneficiary: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Bank Name</label>
                      <input
                        type="text"
                        value={settings.bankName}
                        onChange={(e) => updateSettings({ bankName: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Account No.</label>
                        <input
                          type="text"
                          value={settings.bankAccountNo}
                          onChange={(e) => updateSettings({ bankAccountNo: e.target.value })}
                          style={{ width: '100%', padding: '7px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>IFSC Code</label>
                        <input
                          type="text"
                          value={settings.bankIfsc}
                          onChange={(e) => updateSettings({ bankIfsc: e.target.value })}
                          style={{ width: '100%', padding: '7px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Branch</label>
                      <input
                        type="text"
                        value={settings.bankBranch}
                        onChange={(e) => updateSettings({ bankBranch: e.target.value })}
                        style={{ width: '100%', padding: '7px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. TERMS & CONDITIONS AND FOOTER */}
            {activeMenu === 'terms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '700' }}>
                  <span>Show Terms & Conditions</span>
                  <input
                    type="checkbox"
                    checked={settings.showTerms}
                    onChange={(e) => updateSettings({ showTerms: e.target.checked })}
                    style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                  />
                </label>

                {settings.showTerms && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                        Terms Section Heading
                      </label>
                      <input
                        type="text"
                        value={settings.termsHeading || 'Terms & Conditions:'}
                        onChange={(e) => updateSettings({ termsHeading: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                        Edit Terms Lines (1 numbered item per line)
                      </label>
                      <textarea
                        rows={8}
                        value={settings.termsText}
                        onChange={(e) => updateSettings({ termsText: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '11.5px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          lineHeight: '1.45',
                          boxSizing: 'border-box',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '700' }}>
                  <span>Show Total Amount In Words</span>
                  <input
                    type="checkbox"
                    checked={settings.showTotalInWords}
                    onChange={(e) => updateSettings({ showTotalInWords: e.target.checked })}
                    style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                  />
                </label>

                {/* Customer Acceptance Box Controls */}
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '700' }}>
                    <span>Customer Acceptance & Sign Box</span>
                    <input
                      type="checkbox"
                      checked={settings.showCustomerAcceptance}
                      onChange={(e) => updateSettings({ showCustomerAcceptance: e.target.checked })}
                      style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                    />
                  </label>

                  {settings.showCustomerAcceptance && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <div>
                        <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Box Heading</label>
                        <input
                          type="text"
                          value={settings.customerAcceptanceHeading || 'Customer Acceptance & Signature'}
                          onChange={(e) => updateSettings({ customerAcceptanceHeading: e.target.value })}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>Line Subtext</label>
                        <input
                          type="text"
                          value={settings.customerAcceptanceSubtext || 'Authorised Signature & Stamp'}
                          onChange={(e) => updateSettings({ customerAcceptanceSubtext: e.target.value })}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Footer Notice */}
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Bottom Footer Note</label>
                  <input
                    type="text"
                    value={settings.footerNote || ''}
                    onChange={(e) => updateSettings({ footerNote: e.target.value })}
                    placeholder="This is a Computer Generated Proforma Invoice..."
                    style={{ width: '100%', padding: '8px 10px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>Appears centered at the bottom of the printed page.</span>
                </div>
              </div>
            )}

          </div>

          {/* SIDE MENU BOTTOM STICKY BAR */}
          <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSaveDefaults}
              style={{
                flex: 1,
                padding: '10px 14px',
                backgroundColor: '#0E7490',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Save size={15} /> Save As Default
            </button>

            <button
              onClick={handleResetDefaults}
              title="Reset to factory defaults"
              style={{
                padding: '10px 14px',
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: LIVE INTERACTIVE A4 SHEET ==================== */}
        <div
          ref={previewContainerRef}
          style={{
            flex: 1,
            minWidth: 0,
            overflowX: 'auto',
            overflowY: 'auto',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#F1F5F9'
          }}
        >
          <div style={{ width: '100%', maxWidth: '870px', minWidth: 0 }}>
            {/* Live Sheet Banner Info with Zoom & Screen Fit Controls */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '8px 14px',
                marginBottom: '16px',
                fontSize: '11.5px',
                color: '#64748B',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isMenuCollapsed && (
                  <button
                    onClick={() => setIsMenuCollapsed(false)}
                    style={{
                      backgroundColor: '#0E7490',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sliders size={12} /> Open Customizer
                  </button>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#334155' }}>
                  <Sparkles size={14} style={{ color: settings.accentColor || '#0E7490' }} />
                  Live A4 Interactive Preview
                </span>
              </div>

              {/* Zoom & Screen-Fit Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: '6px', padding: '2px', border: '1px solid #E2E8F0' }}>
                  <button
                    onClick={() => {
                      setFitToWidth(false);
                      setZoomLevel(z => Math.max(0.5, Math.round((z - 0.05) * 100) / 100));
                    }}
                    title="Zoom Out"
                    style={{ backgroundColor: 'transparent', border: 'none', padding: '3px 7px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A', minWidth: '40px', textAlign: 'center', userSelect: 'none' }}>
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => {
                      setFitToWidth(false);
                      setZoomLevel(z => Math.min(1.4, Math.round((z + 0.05) * 100) / 100));
                    }}
                    title="Zoom In"
                    style={{ backgroundColor: 'transparent', border: 'none', padding: '3px 7px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
                  >
                    <ZoomIn size={13} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setFitToWidth(true);
                    if (previewContainerRef.current) {
                      const containerWidth = previewContainerRef.current.clientWidth - 48;
                      if (containerWidth > 0 && containerWidth < 880) {
                        setZoomLevel(Math.round(Math.min(1, Math.max(0.55, containerWidth / 870)) * 100) / 100);
                      } else {
                        setZoomLevel(1);
                      }
                    }
                  }}
                  style={{
                    backgroundColor: fitToWidth ? '#0E7490' : '#F1F5F9',
                    color: fitToWidth ? '#FFFFFF' : '#475569',
                    border: '1px solid ' + (fitToWidth ? '#0E7490' : '#CBD5E1'),
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Automatically scale to fit inside screen"
                >
                  <Maximize2 size={12} /> Fit Screen
                </button>

                <button
                  onClick={() => {
                    setFitToWidth(false);
                    setZoomLevel(1);
                  }}
                  style={{
                    backgroundColor: (!fitToWidth && zoomLevel === 1) ? '#0F172A' : '#F1F5F9',
                    color: (!fitToWidth && zoomLevel === 1) ? '#FFFFFF' : '#475569',
                    border: '1px solid ' + ((!fitToWidth && zoomLevel === 1) ? '#0F172A' : '#CBD5E1'),
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  title="100% native scale"
                >
                  100%
                </button>

                {/* DIRECT CLICK-TO-EDIT ON/OFF TOGGLE */}
                <button
                  onClick={() => setIsDirectEditMode(prev => !prev)}
                  style={{
                    backgroundColor: isDirectEditMode ? '#0E7490' : '#FFFFFF',
                    color: isDirectEditMode ? '#FFFFFF' : '#475569',
                    border: '1px solid ' + (isDirectEditMode ? '#0E7490' : '#CBD5E1'),
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: isDirectEditMode ? '0 2px 5px rgba(14,116,144,0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Toggle in-place click-to-edit directly on the invoice sheet"
                >
                  <PenTool size={12} />
                  <span>Click-to-Edit: {isDirectEditMode ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* IN-PLACE CLICK-TO-EDIT NOTIFICATION BANNER */}
            {isDirectEditMode && (
              <div
                className="no-print"
                style={{
                  backgroundColor: '#ECFEFF',
                  border: '1px solid #A5F3FC',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  color: '#0E7490',
                  fontWeight: '600'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={15} style={{ color: '#0E7490', flexShrink: 0 }} />
                  <span>
                    <strong>In-Place Direct Edit Active:</strong> Click directly on any text, company name, address, labels, item descriptions, rates, or bank details on the invoice sheet below to edit them!
                  </span>
                </div>
                <span style={{ fontSize: '10px', backgroundColor: '#0E7490', color: '#FFFFFF', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  Live Editable
                </span>
              </div>
            )}

            {/* LIVE PRINTABLE DOCUMENT SHEET WRAPPER */}
            <div
              style={{
                zoom: zoomLevel,
                transformOrigin: 'top center',
                width: '100%',
                maxWidth: '850px',
                margin: '0 auto',
                transition: 'zoom 0.15s ease',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <VRMProformaInvoicePrintSheet
                piData={previewPi}
                settings={settings}
                id="studio-printable-sheet"
                isEditable={isDirectEditMode}
                onUpdateSetting={updateSettings}
                onUpdatePiData={(up) => setPreviewPi(p => ({ ...p, ...up }))}
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
