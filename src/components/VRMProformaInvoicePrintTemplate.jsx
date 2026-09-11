import React, { useState, useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle,
  FileText,
  CreditCard,
  Sliders,
  Palette,
  RotateCcw,
  Eye,
  Save,
  Layers,
  Upload,
  Image,
  Trash2,
  PenTool,
  Stamp
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Default Template Configuration Settings
export const DEFAULT_PI_TEMPLATE_SETTINGS = {
  // Theme & Identity
  accentColor: '#0E7490', // Default VRM Teal
  documentTitle: 'PROFORMA INVOICE',
  companyName: 'VRM Structures India Pvt Ltd',
  companyTagline: 'Engineered Solar Mounting Structures & Solutions',
  showLogo: true,
  customLogoUrl: null, // Custom uploaded logo base64
  logoHeight: 52,
  showCinGst: true,
  showContactInfo: true,

  // Address & Meta Options
  showShipTo: true,
  showTransportDetails: true,
  showSalesExecutive: true,
  showPaymentTerms: true,
  showPlaceOfSupply: true,

  // Table Columns
  showHsn: true,
  showUom: true,
  showItemDescription: true,
  showGstCol: true,
  showDiscountCol: false,

  // Footer & Banking
  showTotalInWords: true,
  showBankDetails: true,
  bankBeneficiary: 'VRM Structures India Private Limited',
  bankName: 'HDFC Bank Ltd.',
  bankAccountNo: '50200031629272',
  bankIfsc: 'HDFC0000574',
  bankBranch: 'Kodambakkam, Chennai',

  // Terms & Conditions
  showTerms: true,
  termsText:
    '1. Validity: This Proforma Invoice is valid for 15 calendar days from the date of issue.\n2. Payment Terms: 100% advance along with confirmed Purchase Order.\n3. Delivery Schedule: Ex-works Puzhal Chennai, dispatch within 7-10 working days upon advance.\n4. Taxes & Duties: GST as applicable at the time of final tax invoicing and dispatch.\n5. Disputes subject to Chennai jurisdiction only.',

  // Stamp / Seal Customization
  showSignatoryStamp: true,
  stampMode: 'vector', // 'vector' | 'custom' | 'none'
  customStampUrl: null, // Custom uploaded stamp image base64
  stampText: 'VRM STRUCTURES INDIA',
  stampLocation: 'CHENNAI - AUTHORIZED',

  // Signature Customization
  signatureMode: 'vector', // 'vector' | 'custom' | 'blank'
  customSignatureUrl: null, // Custom uploaded handwritten signature base64
  signatoryTitle: 'Authorized Signatory',
  signatoryName: '',

  // Customer Acceptance
  showCustomerAcceptance: false,
  footerNote: 'This is a system-generated Proforma Invoice by Control Room ERP. Registered under VRM Structures India Pvt Ltd.'
};

const COLOR_PRESETS = [
  { name: 'VRM Teal', hex: '#0E7490' },
  { name: 'Royal Navy', hex: '#1E3A8A' },
  { name: 'Tech Cobalt', hex: '#2563EB' },
  { name: 'Emerald Forest', hex: '#059669' },
  { name: 'Charcoal Slate', hex: '#1E293B' },
  { name: 'Crimson Burgundy', hex: '#991B1B' }
];

const TITLE_PRESETS = ['PROFORMA INVOICE', 'QUOTATION', 'ESTIMATE', 'PROFORMA TAX INVOICE'];

// Lightweight canvas image compressor to safely store in localStorage
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

// Helper to convert number to Indian Rupees in words
function numberToWordsINR(num) {
  if (num === null || num === undefined || isNaN(num) || num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  };

  const integerPart = Math.floor(Math.abs(num));
  const words = convert(integerPart);
  return `Indian Rupees ${words} Only`;
}

// Format date nicely
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Printable Sheet Component for Proforma Invoice
 */
export function VRMProformaInvoicePrintSheet({
  piData,
  settings = DEFAULT_PI_TEMPLATE_SETTINGS,
  id = 'printable-proforma-invoice'
}) {
  if (!piData) return null;

  const pi = piData;
  const cfg = { ...DEFAULT_PI_TEMPLATE_SETTINGS, ...settings };
  const accent = cfg.accentColor || '#0E7490';

  // Extract or synthesize items array
  const rawItems = Array.isArray(pi.items) && pi.items.length > 0 ? pi.items : [
    {
      name: pi.productName || 'Solar Mounting Structures & Fasteners',
      description: pi.productDescription || (pi.productName ? `Supply of ${pi.productName} as per technical specifications` : 'Standard VRM Solar Structure & Accessories Kit'),
      hsn: pi.hsn || '73089090',
      qty: pi.quantity || 1,
      uom: pi.uom || 'Nos',
      rate: Number(pi.unitValue || (typeof pi.amount === 'string' ? parseFloat(pi.amount.replace(/[^0-9.]/g, '')) : pi.amount) || 0),
      gstRate: pi.gstRate || '18%',
      discountPct: 0,
      amount: Number(pi.unitValue || (typeof pi.amount === 'string' ? parseFloat(pi.amount.replace(/[^0-9.]/g, '')) : pi.amount) || 0) * (Number(pi.quantity) || 1)
    }
  ];

  // Helper to extract clean string from address object or string
  const parseAddress = (addrObj, directStreet, directCity, directState, directPin) => {
    let street = '';
    let city = '';
    let state = '';
    let pincode = '';

    if (addrObj && typeof addrObj === 'object') {
      street = String(addrObj.street || addrObj.address || '').trim();
      city = String(addrObj.city || '').trim();
      state = String(addrObj.state || '').trim();
      pincode = String(addrObj.pincode || addrObj.pin || addrObj.zip || '').trim();
    } else if (typeof addrObj === 'string') {
      street = addrObj.trim();
    }

    if (directStreet && typeof directStreet === 'string') street = directStreet.trim();
    if (directCity && typeof directCity === 'string') city = directCity.trim();
    if (directState && typeof directState === 'string') state = directState.trim();
    if (directPin && (typeof directPin === 'string' || typeof directPin === 'number')) pincode = String(directPin).trim();

    return {
      street: street || 'Plot No 4A, Industrial Area',
      city: city || 'Chennai',
      state: state || 'Tamil Nadu',
      pincode: pincode || '600066'
    };
  };

  const billAddr = parseAddress(pi.billingAddress, pi.billingStreet, pi.billingCity, pi.billingState, pi.billingPincode);
  const sameAsBilling = pi.sameAsBilling !== false;
  const shipAddr = sameAsBilling
    ? billAddr
    : parseAddress(pi.deliveryAddress, pi.deliveryStreet, pi.deliveryCity, pi.deliveryState, pi.deliveryPincode);

  const bStreet = billAddr.street;
  const bCity = billAddr.city;
  const bState = billAddr.state;
  const bPincode = billAddr.pincode;

  const dStreet = shipAddr.street;
  const dCity = shipAddr.city;
  const dState = shipAddr.state;
  const dPincode = shipAddr.pincode;

  const customerName = typeof pi.vendor === 'string' ? pi.vendor : (typeof pi.customerName === 'string' ? pi.customerName : (typeof pi.vendorName === 'string' ? pi.vendorName : 'Customer Company Name'));

  // Detect Inter-state vs Intra-state GST based on customer state / GST
  const customerGst = typeof pi.gstNo === 'string' ? pi.gstNo.trim().toUpperCase() : '';
  const rawState = bState || '';
  const customerState = typeof rawState === 'string' ? rawState.trim().toLowerCase() : '';
  const isTamilNadu = customerGst.startsWith('33') || customerState.includes('tamil') || customerState.includes('tn');
  const isInterState = customerGst.length >= 2 && !customerGst.startsWith('33') && !isTamilNadu;

  // Compute item totals
  const items = rawItems.map((it, idx) => {
    const q = parseFloat(it.qty) || 1;
    const r = parseFloat(it.rate) || 0;
    const gross = q * r;
    const discPct = parseFloat(it.discountPct || it.discount) || 0;
    const discAmt = gross * (discPct / 100);
    const taxable = gross - discAmt;
    const gRate = parseFloat(String(it.gstRate || '18%').replace('%', '')) || 18;
    const gstAmt = taxable * (gRate / 100);
    const lineTotal = taxable + gstAmt;

    return {
      sNo: idx + 1,
      name: it.name || it.productName || 'Item',
      description: it.description || it.specifications || '',
      hsn: it.hsn || '73089090',
      qty: q,
      uom: it.uom || it.unit || 'Nos',
      rate: r,
      discPct,
      taxable,
      gRate,
      gstAmt,
      lineTotal
    };
  });

  const subTotal = items.reduce((sum, item) => sum + item.taxable, 0) || (Number(pi.unitValue) || 0);
  const totalGst = items.reduce((sum, item) => sum + item.gstAmt, 0) || (subTotal * 0.18);
  const grandTotal = subTotal + totalGst;

  // Terms array from text lines
  const termsLines = (cfg.termsText || '')
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean);

  return (
    <div
      id={id}
      style={{
        width: '100%',
        maxWidth: '850px',
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        fontSize: '11.5px',
        lineHeight: '1.4',
        boxSizing: 'border-box',
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        padding: '24px 28px',
        margin: '0 auto',
        borderRadius: '4px'
      }}
    >
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .no-print { display: none !important; }
            #${id}, #${id} * { visibility: visible; }
            #${id} {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              padding: 10mm 14mm !important;
              margin: 0 !important;
              border-radius: 0 !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            .page-break {
              page-break-before: always;
            }
          }
        `}
      </style>

      {/* OUTER BORDER CONTAINER */}
      <div style={{ border: `1.5px solid ${accent}`, borderRadius: '4px', overflow: 'hidden' }}>

        {/* 1. HEADER SECTION (LOGO + COMPANY DETAILS | PROFORMA INVOICE BADGE & META) */}
        <div style={{ padding: '16px 20px', borderBottom: `1.5px solid ${accent}`, backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
            {/* LEFT: COMPANY INFO */}
            <div style={{ flex: '1 1 55%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                {cfg.showLogo && (
                  <img
                    src={cfg.customLogoUrl || '/vrm_logo.png'}
                    alt={cfg.companyName}
                    style={{
                      height: `${cfg.logoHeight || 52}px`,
                      maxWidth: '220px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      if (cfg.customLogoUrl) {
                        e.currentTarget.src = '/vrm_logo.png';
                      } else {
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '16.5px', fontWeight: '800', color: accent, letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
                    {cfg.companyName}
                  </div>
                  {cfg.companyTagline && (
                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>
                      {cfg.companyTagline}
                    </div>
                  )}
                </div>
              </div>

              {cfg.showContactInfo && (
                <div style={{ fontSize: '10.5px', color: '#334155', lineHeight: '1.45', marginTop: '4px' }}>
                  <div>1427, GNT Road, Nagappa Industrial Estate, Puzhal,</div>
                  <div>Chennai, Tamil Nadu - 600066, India</div>
                  {cfg.showCinGst && (
                    <div style={{ marginTop: '3px' }}>
                      <strong style={{ color: '#0F172A' }}>GSTIN:</strong> 33AAGCV4262N1ZZ &nbsp;|&nbsp; <strong style={{ color: '#0F172A' }}>CIN:</strong> U28112TN2020PTC135489
                    </div>
                  )}
                  <div>
                    <strong style={{ color: '#0F172A' }}>Phone:</strong> +91 98847 20789 &nbsp;|&nbsp; <strong style={{ color: '#0F172A' }}>Email:</strong> sales@vrmstructures.com
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: DOCUMENT TITLE & ESSENTIAL METADATA */}
            <div style={{ flex: '1 1 45%', textAlign: 'right' }}>
              <div style={{
                display: 'inline-block',
                backgroundColor: accent,
                color: '#FFFFFF',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: '800',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '10px'
              }}>
                {cfg.documentTitle || 'PROFORMA INVOICE'}
              </div>

              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginTop: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px 6px', fontWeight: '700', color: '#475569', textAlign: 'right', width: '50%' }}>Document No:</td>
                    <td style={{ padding: '2px 6px', fontWeight: '800', color: accent, textAlign: 'right' }}>{pi.piNo || 'SPI-2025-001'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 6px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Date:</td>
                    <td style={{ padding: '2px 6px', fontWeight: '700', color: '#0F172A', textAlign: 'right' }}>{formatDate(pi.piDate)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 6px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Valid Until:</td>
                    <td style={{ padding: '2px 6px', fontWeight: '600', color: '#B91C1C', textAlign: 'right' }}>{formatDate(pi.expDate || pi.validUntilDate)}</td>
                  </tr>
                  {cfg.showPaymentTerms && (
                    <tr>
                      <td style={{ padding: '2px 6px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Payment Terms:</td>
                      <td style={{ padding: '2px 6px', fontWeight: '600', color: '#0F172A', textAlign: 'right' }}>{pi.paymentTerms || '50% Adv + 50% Before Dispatch'}</td>
                    </tr>
                  )}
                  {cfg.showPlaceOfSupply && (
                    <tr>
                      <td style={{ padding: '2px 6px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Place Of Supply:</td>
                      <td style={{ padding: '2px 6px', fontWeight: '600', color: '#0F172A', textAlign: 'right' }}>{isTamilNadu ? 'Tamil Nadu (33)' : (bState ? `${bState}` : 'Other State')}</td>
                    </tr>
                  )}
                  {cfg.showSalesExecutive && (
                    <tr>
                      <td style={{ padding: '2px 6px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Sales Executive:</td>
                      <td style={{ padding: '2px 6px', fontWeight: '600', color: '#0F172A', textAlign: 'right' }}>{pi.salesPerson || pi.salesperson || pi.createdBy || 'VRM Sales Team'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2. CUSTOMER DETAILS: BILL TO & SHIP TO */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: cfg.showShipTo ? '1fr 1fr' : '1fr',
          borderBottom: '1px solid #CBD5E1',
          backgroundColor: '#FFFFFF'
        }}>
          {/* BILL TO */}
          <div style={{ padding: '12px 18px', borderRight: cfg.showShipTo ? '1px solid #CBD5E1' : 'none' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Bill To / Buyer:
            </div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '3px' }}>
              {customerName}
            </div>
            <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
              <div>{bStreet}</div>
              <div>{bCity}, {bState} - {bPincode}</div>
              <div style={{ marginTop: '3px' }}>
                <strong style={{ color: '#0F172A' }}>GSTIN:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{pi.gstNo || 'Unregistered'}</span>
              </div>
              {pi.contactPerson && <div><strong style={{ color: '#0F172A' }}>Contact:</strong> {pi.contactPerson}</div>}
              {pi.phone && <div><strong style={{ color: '#0F172A' }}>Phone:</strong> {pi.phone}</div>}
              {pi.email && <div><strong style={{ color: '#0F172A' }}>Email:</strong> {pi.email}</div>}
            </div>
          </div>

          {/* SHIP TO (Optional) */}
          {cfg.showShipTo && (
            <div style={{ padding: '12px 18px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Ship To / Delivery Destination:
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '3px' }}>
                {customerName}
              </div>
              <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                <div>{dStreet}</div>
                <div>{dCity}, {dState} - {dPincode}</div>
                <div style={{ marginTop: '3px' }}>
                  <strong style={{ color: '#0F172A' }}>State Code:</strong> {isTamilNadu ? '33 (Tamil Nadu)' : (dState || '—')}
                </div>
                {cfg.showTransportDetails && (
                  <>
                    {pi.transportMode && <div><strong style={{ color: '#0F172A' }}>Dispatch Mode:</strong> {pi.transportMode} {pi.transportScope ? `(${pi.transportScope})` : ''}</div>}
                    {pi.vehicleNo && <div><strong style={{ color: '#0F172A' }}>Vehicle / LR No:</strong> {pi.vehicleNo}</div>}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. LINE ITEMS TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: accent, color: '#FFFFFF', fontWeight: '700', textAlign: 'center' }}>
                <th style={{ padding: '8px 6px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '32px' }}>#</th>
                <th style={{ padding: '8px 10px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'left' }}>Item & Specification</th>
                {cfg.showHsn && <th style={{ padding: '8px 6px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '70px' }}>HSN/SAC</th>}
                <th style={{ padding: '8px 6px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '50px' }}>Qty</th>
                {cfg.showUom && <th style={{ padding: '8px 6px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '45px' }}>UOM</th>}
                <th style={{ padding: '8px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'right', width: '80px' }}>Rate (₹)</th>
                {cfg.showDiscountCol && <th style={{ padding: '8px 6px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '50px' }}>Disc%</th>}
                <th style={{ padding: '8px 8px', borderRight: '1px solid rgba(255,255,255,0.2)', textAlign: 'right', width: '85px' }}>Taxable (₹)</th>
                {cfg.showGstCol && <th style={{ padding: '8px 6px', borderRight: '1px solid rgba(255,255,255,0.2)', width: '50px' }}>GST%</th>}
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '95px' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr
                  key={idx}
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    verticalAlign: 'top'
                  }}
                >
                  <td style={{ padding: '10px 6px', borderRight: '1px solid #E2E8F0', textAlign: 'center', fontWeight: '600', color: '#64748B' }}>
                    {it.sNo}
                  </td>
                  <td style={{ padding: '10px 10px', borderRight: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '11.5px' }}>
                      {it.name}
                    </div>
                    {cfg.showItemDescription && it.description && (
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px', whiteSpace: 'pre-line', lineHeight: '1.35' }}>
                        {it.description}
                      </div>
                    )}
                  </td>
                  {cfg.showHsn && (
                    <td style={{ padding: '10px 6px', borderRight: '1px solid #E2E8F0', textAlign: 'center', fontFamily: 'monospace', color: '#334155' }}>
                      {it.hsn}
                    </td>
                  )}
                  <td style={{ padding: '10px 6px', borderRight: '1px solid #E2E8F0', textAlign: 'center', fontWeight: '700', color: '#0F172A' }}>
                    {it.qty}
                  </td>
                  {cfg.showUom && (
                    <td style={{ padding: '10px 6px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: '#475569' }}>
                      {it.uom}
                    </td>
                  )}
                  <td style={{ padding: '10px 8px', borderRight: '1px solid #E2E8F0', textAlign: 'right', color: '#0F172A' }}>
                    {it.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {cfg.showDiscountCol && (
                    <td style={{ padding: '10px 6px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                      {it.discPct ? `${it.discPct}%` : '—'}
                    </td>
                  )}
                  <td style={{ padding: '10px 8px', borderRight: '1px solid #E2E8F0', textAlign: 'right', fontWeight: '600', color: '#0F172A' }}>
                    {it.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {cfg.showGstCol && (
                    <td style={{ padding: '10px 6px', borderRight: '1px solid #E2E8F0', textAlign: 'center', color: accent, fontWeight: '600' }}>
                      {it.gRate}%
                    </td>
                  )}
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '700', color: accent }}>
                    {it.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. TOTAL IN WORDS & CALCULATION SUMMARY */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', borderTop: `1.5px solid ${accent}`, backgroundColor: '#FFFFFF' }}>
          {/* LEFT: WORDS + BANK DETAILS + TERMS */}
          <div style={{ padding: '14px 18px', borderRight: '1px solid #CBD5E1' }}>
            {cfg.showTotalInWords && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Amount Chargeable (in words):</div>
                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A', marginTop: '2px', lineHeight: '1.3' }}>
                  {numberToWordsINR(grandTotal)}
                </div>
              </div>
            )}

            {/* BANK DETAILS */}
            {cfg.showBankDetails && (
              <div style={{ border: '1px solid #CBD5E1', borderRadius: '4px', padding: '8px 12px', backgroundColor: '#F8FAFC', marginBottom: '12px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: '800', color: accent, textTransform: 'uppercase', marginBottom: '4px' }}>
                  VRM Company Bank Details (NEFT / RTGS / IMPS)
                </div>
                <table style={{ width: '100%', fontSize: '10.5px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '90px', color: '#64748B', fontWeight: '600', padding: '1px 0' }}>Beneficiary:</td>
                      <td style={{ fontWeight: '700', color: '#0F172A' }}>{cfg.bankBeneficiary}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748B', fontWeight: '600', padding: '1px 0' }}>Bank Name:</td>
                      <td style={{ fontWeight: '600', color: '#0F172A' }}>{cfg.bankName}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748B', fontWeight: '600', padding: '1px 0' }}>Account No:</td>
                      <td style={{ fontWeight: '800', color: accent, fontFamily: 'monospace', fontSize: '11px' }}>{cfg.bankAccountNo}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748B', fontWeight: '600', padding: '1px 0' }}>IFSC Code:</td>
                      <td style={{ fontWeight: '700', color: '#0F172A', fontFamily: 'monospace' }}>{cfg.bankIfsc}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#64748B', fontWeight: '600', padding: '1px 0' }}>Branch:</td>
                      <td style={{ color: '#0F172A' }}>{cfg.bankBranch}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TERMS & CONDITIONS */}
            {cfg.showTerms && termsLines.length > 0 && (
              <div style={{ fontSize: '10px', color: '#475569', lineHeight: '1.4' }}>
                <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>Terms & Conditions:</div>
                <ol style={{ margin: 0, paddingLeft: '14px' }}>
                  {termsLines.map((line, lIdx) => (
                    <li key={lIdx}>{line.replace(/^[0-9]+[.)]\s*/, '')}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* RIGHT: BREAKDOWN TOTALS + SIGNATURE BOX */}
          <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            {/* TOTALS TABLE */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '6px 14px', color: '#475569', fontWeight: '600' }}>Sub Total (Taxable):</td>
                  <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                    ₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {isInterState ? (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '6px 14px', color: '#475569', fontWeight: '600' }}>IGST (18%):</td>
                    <td style={{ padding: '6px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                      ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '4px 14px', color: '#475569', fontWeight: '600' }}>CGST (9%):</td>
                      <td style={{ padding: '4px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                        ₹{(totalGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '4px 14px', color: '#475569', fontWeight: '600' }}>SGST (9%):</td>
                      <td style={{ padding: '4px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>
                        ₹{(totalGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </>
                )}

                <tr style={{ borderBottom: `1.5px solid ${accent}`, backgroundColor: `${accent}15` }}>
                  <td style={{ padding: '8px 14px', color: accent, fontWeight: '800', fontSize: '13px' }}>Grand Total:</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '800', color: accent, fontSize: '14px' }}>
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* SIGNATURE & STAMP BOX */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* CUSTOMER ACCEPTANCE (Optional) */}
              {cfg.showCustomerAcceptance && (
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px dashed #CBD5E1',
                  textAlign: 'center',
                  minHeight: '70px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>Customer Acceptance & Signature</div>
                  <div style={{ borderBottom: '1px solid #94A3B8', width: '80%', margin: '14px auto 4px auto' }} />
                  <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>Authorised Signature & Stamp</div>
                </div>
              )}

              {/* COMPANY SIGNATORY & STAMP */}
              {cfg.showSignatoryStamp && (
                <div style={{
                  flex: 1,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center',
                  minHeight: '135px',
                  backgroundColor: '#FAFAFA'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A' }}>
                    For {cfg.companyName}
                  </div>

                  {/* STAMP & SIGNATURE MEDIA CONTAINER */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    margin: '6px 0',
                    position: 'relative',
                    minHeight: '50px'
                  }}>
                    {/* STAMP DISPLAY */}
                    {cfg.stampMode === 'custom' && cfg.customStampUrl ? (
                      <img
                        src={cfg.customStampUrl}
                        alt="Company Stamp"
                        style={{
                          maxHeight: '52px',
                          maxWidth: '110px',
                          objectFit: 'contain'
                        }}
                      />
                    ) : cfg.stampMode === 'vector' ? (
                      <svg width="125" height="46" viewBox="0 0 125 46">
                        <ellipse cx="62" cy="23" rx="54" ry="19" stroke={accent} strokeWidth="1.2" strokeDasharray="3 2" fill="none"/>
                        <text x="62" y="19" textAnchor="middle" fill={accent} fontSize="6.5" fontWeight="bold">{cfg.stampText || 'VRM STRUCTURES INDIA'}</text>
                        <text x="62" y="30" textAnchor="middle" fill={accent} fontSize="5.5">{cfg.stampLocation || 'CHENNAI - AUTHORIZED'}</text>
                        <path d="M 38 24 Q 60 14 90 22" stroke={accent} strokeWidth="1.5" fill="none" />
                      </svg>
                    ) : null}

                    {/* SIGNATURE DISPLAY */}
                    {cfg.signatureMode === 'custom' && cfg.customSignatureUrl ? (
                      <img
                        src={cfg.customSignatureUrl}
                        alt="Authorized Signature"
                        style={{
                          maxHeight: '44px',
                          maxWidth: '120px',
                          objectFit: 'contain'
                        }}
                      />
                    ) : cfg.signatureMode === 'vector' ? (
                      <svg width="105" height="28" viewBox="0 0 105 28">
                        <path d="M 10 20 Q 30 5 55 18 T 95 12" stroke={accent} strokeWidth="1.8" fill="none" />
                      </svg>
                    ) : cfg.signatureMode === 'blank' ? (
                      <div style={{ width: '100px', borderBottom: '1px dashed #94A3B8', height: '24px' }} />
                    ) : null}
                  </div>

                  {/* SIGNATORY NAME & TITLE */}
                  <div>
                    {cfg.signatoryName && (
                      <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0F172A', marginBottom: '1px' }}>
                        {cfg.signatoryName}
                      </div>
                    )}
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#475569' }}>
                      {cfg.signatoryTitle || 'Authorized Signatory'}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* FOOTER NOTICE */}
      {cfg.footerNote && (
        <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '9.5px', color: '#64748B' }}>
          {cfg.footerNote}
        </div>
      )}
    </div>
  );
}

/**
 * Customizer Drawer Panel for Live Template Editing
 */
function TemplateCustomizerDrawer({
  settings,
  onUpdateSettings,
  onSaveAsDefault,
  onResetDefaults,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('branding'); // branding | stampSign | columns | sections | banking
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingStamp, setIsUploadingStamp] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const logoInputRef = useRef(null);
  const stampInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  const handleSave = () => {
    onSaveAsDefault();
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  // Upload handlers
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const dataUrl = await compressImageFile(file, 450, 0.85);
      onUpdateSettings({ customLogoUrl: dataUrl, showLogo: true });
    } catch (err) {
      alert('Failed to upload logo: ' + err.message);
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleStampUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingStamp(true);
      const dataUrl = await compressImageFile(file, 350, 0.85);
      onUpdateSettings({ customStampUrl: dataUrl, stampMode: 'custom', showSignatoryStamp: true });
    } catch (err) {
      alert('Failed to upload stamp: ' + err.message);
    } finally {
      setIsUploadingStamp(false);
      if (stampInputRef.current) stampInputRef.current.value = '';
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingSignature(true);
      const dataUrl = await compressImageFile(file, 350, 0.85);
      onUpdateSettings({ customSignatureUrl: dataUrl, signatureMode: 'custom', showSignatoryStamp: true });
    } catch (err) {
      alert('Failed to upload signature: ' + err.message);
    } finally {
      setIsUploadingSignature(false);
      if (signatureInputRef.current) signatureInputRef.current.value = '';
    }
  };

  return (
    <div
      className="no-print"
      style={{
        width: '390px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 20px 35px -5px rgba(0,0,0,0.25)',
        border: '1px solid #CBD5E1',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 90px)',
        maxHeight: '800px',
        position: 'sticky',
        top: '20px',
        overflow: 'hidden',
        zIndex: 10
      }}
    >
      {/* DRAWER HEADER */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={17} style={{ color: '#38BDF8' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '13.5px' }}>Customize Template</div>
            <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Custom Logo, Stamp, Signature & Layout</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        padding: '4px'
      }}>
        {[
          { id: 'branding', label: 'Logo & Colors', icon: Palette },
          { id: 'stampSign', label: 'Stamp & Sign', icon: PenTool },
          { id: 'columns', label: 'Columns', icon: Layers },
          { id: 'sections', label: 'Sections', icon: Eye },
          { id: 'banking', label: 'Banking', icon: CreditCard }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '7px 2px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#0E7490' : '#64748B',
                fontWeight: isActive ? '700' : '600',
                fontSize: '10.5px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Icon size={13} />
              <span style={{ fontSize: '9.5px', textAlign: 'center' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SCROLLABLE SETTINGS CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* TAB 1: BRANDING, LOGO & THEME */}
        {activeTab === 'branding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* COMPANY LOGO SECTION */}
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Image size={14} style={{ color: '#0E7490' }} /> Company Logo
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showLogo}
                    onChange={(e) => onUpdateSettings({ showLogo: e.target.checked })}
                    style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                  />
                  <span>Show</span>
                </label>
              </div>

              {settings.showLogo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Current Logo Preview */}
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '6px',
                    textAlign: 'center',
                    minHeight: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={settings.customLogoUrl || '/vrm_logo.png'}
                      alt="Logo Preview"
                      style={{ maxHeight: '48px', maxWidth: '180px', objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Logo Actions */}
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
                      disabled={isUploadingLogo}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        backgroundColor: '#0E7490',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Upload size={13} /> {isUploadingLogo ? 'Processing...' : (settings.customLogoUrl ? 'Change Logo' : 'Upload Logo')}
                    </button>

                    {settings.customLogoUrl && (
                      <button
                        onClick={() => onUpdateSettings({ customLogoUrl: null })}
                        title="Reset to default VRM logo"
                        style={{
                          padding: '6px 10px',
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
                        <Trash2 size={12} /> Reset
                      </button>
                    )}
                  </div>

                  {/* Logo Height Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B' }}>
                    <span>Size ({settings.logoHeight || 52}px)</span>
                    <input
                      type="range"
                      min="35"
                      max="75"
                      value={settings.logoHeight || 52}
                      onChange={(e) => onUpdateSettings({ logoHeight: Number(e.target.value) })}
                      style={{ width: '130px', accentColor: settings.accentColor, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ACCENT COLOR */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                Brand Accent Color
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {COLOR_PRESETS.map(preset => {
                  const isSelected = settings.accentColor === preset.hex;
                  return (
                    <button
                      key={preset.hex}
                      onClick={() => onUpdateSettings({ accentColor: preset.hex })}
                      style={{
                        padding: '6px 8px',
                        border: isSelected ? `2px solid ${preset.hex}` : '1px solid #E2E8F0',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? `${preset.hex}10` : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: isSelected ? '700' : '500',
                        color: '#1E293B'
                      }}
                    >
                      <span style={{ width: '13px', height: '13px', borderRadius: '50%', backgroundColor: preset.hex, display: 'inline-block' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DOCUMENT TITLE */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                Document Title
              </label>
              <input
                type="text"
                value={settings.documentTitle}
                onChange={(e) => onUpdateSettings({ documentTitle: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0F172A',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {TITLE_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => onUpdateSettings({ documentTitle: preset })}
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: settings.documentTitle === preset ? '#ECFEFF' : '#F8FAFC',
                      color: settings.documentTitle === preset ? '#0E7490' : '#475569',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* BRAND DETAILS TOGGLES */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A' }}>Header Display Options</label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '11.5px', color: '#334155' }}>
                <span>Show GSTIN & CIN Numbers</span>
                <input
                  type="checkbox"
                  checked={settings.showCinGst}
                  onChange={(e) => onUpdateSettings({ showCinGst: e.target.checked })}
                  style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '11.5px', color: '#334155' }}>
                <span>Show Company Address & Contact</span>
                <input
                  type="checkbox"
                  checked={settings.showContactInfo}
                  onChange={(e) => onUpdateSettings({ showContactInfo: e.target.checked })}
                  style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: STAMP & SIGNATURE (NEW HIGH-POWERED CUSTOMIZATION) */}
        {activeTab === 'stampSign' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* 1. OFFICIAL COMPANY STAMP SECTION */}
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Stamp size={15} style={{ color: '#0E7490' }} /> Company Stamp / Seal
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showSignatoryStamp}
                    onChange={(e) => onUpdateSettings({ showSignatoryStamp: e.target.checked })}
                    style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                  />
                  <span>Show</span>
                </label>
              </div>

              {settings.showSignatoryStamp && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Stamp Mode Switcher */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    {[
                      { id: 'vector', label: 'Vector Seal' },
                      { id: 'custom', label: 'Custom Stamp' },
                      { id: 'none', label: 'No Stamp' }
                    ].map(mode => {
                      const isSel = settings.stampMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => onUpdateSettings({ stampMode: mode.id })}
                          style={{
                            padding: '6px 4px',
                            borderRadius: '6px',
                            border: isSel ? `2px solid ${settings.accentColor}` : '1px solid #CBD5E1',
                            backgroundColor: isSel ? '#FFFFFF' : '#F1F5F9',
                            color: isSel ? settings.accentColor : '#475569',
                            fontSize: '10.5px',
                            fontWeight: isSel ? '700' : '600',
                            cursor: 'pointer'
                          }}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Stamp Mode A: Vector Seal Text Config */}
                  {settings.stampMode === 'vector' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Seal Header Text</label>
                        <input
                          type="text"
                          value={settings.stampText}
                          onChange={(e) => onUpdateSettings({ stampText: e.target.value })}
                          style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Seal Location Subtitle</label>
                        <input
                          type="text"
                          value={settings.stampLocation}
                          onChange={(e) => onUpdateSettings({ stampLocation: e.target.value })}
                          style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stamp Mode B: Custom Uploaded Stamp Image */}
                  {settings.stampMode === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <div style={{
                        padding: '8px',
                        backgroundColor: '#FFFFFF',
                        border: '1px dashed #CBD5E1',
                        borderRadius: '6px',
                        textAlign: 'center',
                        minHeight: '52px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {settings.customStampUrl ? (
                          <img
                            src={settings.customStampUrl}
                            alt="Custom Stamp Preview"
                            style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain' }}
                          />
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>No stamp image uploaded yet</span>
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
                          disabled={isUploadingStamp}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            backgroundColor: '#0E7490',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Upload size={12} /> {isUploadingStamp ? 'Uploading...' : (settings.customStampUrl ? 'Change Stamp Image' : 'Upload Stamp Image')}
                        </button>

                        {settings.customStampUrl && (
                          <button
                            onClick={() => onUpdateSettings({ customStampUrl: null, stampMode: 'vector' })}
                            title="Remove custom stamp"
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>
                        💡 Tip: Transparent PNG of rubber stamp gives the best official look.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. AUTHORIZED SIGNATURE SECTION */}
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PenTool size={14} style={{ color: '#0E7490' }} /> Authorized Signature
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Signature Mode Switcher */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {[
                    { id: 'vector', label: 'Digital Stroke' },
                    { id: 'custom', label: 'Upload Sign' },
                    { id: 'blank', label: 'Blank Line' }
                  ].map(mode => {
                    const isSel = settings.signatureMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => onUpdateSettings({ signatureMode: mode.id })}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '6px',
                          border: isSel ? `2px solid ${settings.accentColor}` : '1px solid #CBD5E1',
                          backgroundColor: isSel ? '#FFFFFF' : '#F1F5F9',
                          color: isSel ? settings.accentColor : '#475569',
                          fontSize: '10.5px',
                          fontWeight: isSel ? '700' : '600',
                          cursor: 'pointer'
                        }}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* Signature Custom Image Upload */}
                {settings.signatureMode === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <div style={{
                      padding: '8px',
                      backgroundColor: '#FFFFFF',
                      border: '1px dashed #CBD5E1',
                      borderRadius: '6px',
                      textAlign: 'center',
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {settings.customSignatureUrl ? (
                        <img
                          src={settings.customSignatureUrl}
                          alt="Custom Signature Preview"
                          style={{ maxHeight: '40px', maxWidth: '140px', objectFit: 'contain' }}
                        />
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>No signature image uploaded</span>
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
                        disabled={isUploadingSignature}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          backgroundColor: '#0E7490',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Upload size={12} /> {isUploadingSignature ? 'Uploading...' : (settings.customSignatureUrl ? 'Change Signature' : 'Upload Signature')}
                      </button>

                      {settings.customSignatureUrl && (
                        <button
                          onClick={() => onUpdateSettings({ customSignatureUrl: null, signatureMode: 'vector' })}
                          title="Remove custom signature"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Signatory Title and Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Signatory Name (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. M. Annamalaiyar"
                      value={settings.signatoryName || ''}
                      onChange={(e) => onUpdateSettings({ signatoryName: e.target.value })}
                      style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Designation Title</label>
                    <input
                      type="text"
                      value={settings.signatoryTitle || 'Authorized Signatory'}
                      onChange={(e) => onUpdateSettings({ signatoryTitle: e.target.value })}
                      style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. CUSTOMER ACCEPTANCE */}
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: '11.5px', color: '#0F172A', fontWeight: '700' }}>
              <span>Show Customer Acceptance & Signature Box</span>
              <input
                type="checkbox"
                checked={settings.showCustomerAcceptance}
                onChange={(e) => onUpdateSettings({ showCustomerAcceptance: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>

          </div>
        )}

        {/* TAB 3: TABLE COLUMNS */}
        {activeTab === 'columns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
              Select which columns and data fields appear in the itemized table:
            </div>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
              <span>HSN / SAC Code Column</span>
              <input
                type="checkbox"
                checked={settings.showHsn}
                onChange={(e) => onUpdateSettings({ showHsn: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
              <span>Unit of Measure (UOM) Column</span>
              <input
                type="checkbox"
                checked={settings.showUom}
                onChange={(e) => onUpdateSettings({ showUom: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
              <span>Item Technical Descriptions</span>
              <input
                type="checkbox"
                checked={settings.showItemDescription}
                onChange={(e) => onUpdateSettings({ showItemDescription: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
              <span>Discount Column</span>
              <input
                type="checkbox"
                checked={settings.showDiscountCol}
                onChange={(e) => onUpdateSettings({ showDiscountCol: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
              <span>Line Item GST% Column</span>
              <input
                type="checkbox"
                checked={settings.showGstCol}
                onChange={(e) => onUpdateSettings({ showGstCol: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>
          </div>
        )}

        {/* TAB 4: SECTIONS & ADDRESSES */}
        {activeTab === 'sections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A' }}>Address & Transport Blocks</label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
              <span>Show Ship To / Delivery Address</span>
              <input
                type="checkbox"
                checked={settings.showShipTo}
                onChange={(e) => onUpdateSettings({ showShipTo: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
              <span>Show Dispatch & Vehicle Details</span>
              <input
                type="checkbox"
                checked={settings.showTransportDetails}
                onChange={(e) => onUpdateSettings({ showTransportDetails: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
              <span>Show Sales Executive Name</span>
              <input
                type="checkbox"
                checked={settings.showSalesExecutive}
                onChange={(e) => onUpdateSettings({ showSalesExecutive: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>
          </div>
        )}

        {/* TAB 5: BANKING & TERMS */}
        {activeTab === 'banking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600' }}>
              <span>Show Company Bank Account</span>
              <input
                type="checkbox"
                checked={settings.showBankDetails}
                onChange={(e) => onUpdateSettings({ showBankDetails: e.target.checked })}
                style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
              />
            </label>

            {settings.showBankDetails && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748B' }}>Beneficiary Name</label>
                  <input
                    type="text"
                    value={settings.bankBeneficiary}
                    onChange={(e) => onUpdateSettings({ bankBeneficiary: e.target.value })}
                    style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748B' }}>Bank Name</label>
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={(e) => onUpdateSettings({ bankName: e.target.value })}
                    style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748B' }}>Account No.</label>
                    <input
                      type="text"
                      value={settings.bankAccountNo}
                      onChange={(e) => onUpdateSettings({ bankAccountNo: e.target.value })}
                      style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748B' }}>IFSC Code</label>
                    <input
                      type="text"
                      value={settings.bankIfsc}
                      onChange={(e) => onUpdateSettings({ bankIfsc: e.target.value })}
                      style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#0F172A', fontWeight: '600', marginBottom: '8px' }}>
                <span>Show Terms & Conditions</span>
                <input
                  type="checkbox"
                  checked={settings.showTerms}
                  onChange={(e) => onUpdateSettings({ showTerms: e.target.checked })}
                  style={{ accentColor: settings.accentColor, cursor: 'pointer' }}
                />
              </label>

              {settings.showTerms && (
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                    Edit Terms (1 per line)
                  </label>
                  <textarea
                    rows={6}
                    value={settings.termsText}
                    onChange={(e) => onUpdateSettings({ termsText: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      lineHeight: '1.4',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* DRAWER FOOTER: PERSISTENCE & ACTIONS */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {saveSuccessNotice && (
          <div style={{
            fontSize: '11.5px',
            color: '#15803D',
            backgroundColor: '#DCFCE7',
            padding: '6px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '700'
          }}>
            <CheckCircle size={14} /> Saved as your default template!
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#0E7490',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Save size={14} /> Save As Default
          </button>

          <button
            onClick={onResetDefaults}
            title="Reset to factory VRM defaults"
            style={{
              padding: '8px 12px',
              backgroundColor: '#FFFFFF',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
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
    </div>
  );
}

/**
 * Full Interactive Modal Dialog for Previewing, Printing, Customizing, and Exporting PDF
 */
export default function VRMProformaInvoicePrintTemplate({ piData, onClose }) {
  const [isExporting, setIsExporting] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Load saved preferences or fall back to defaults
  const [templateSettings, setTemplateSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('vrm_pi_template_customization');
      if (saved) {
        return { ...DEFAULT_PI_TEMPLATE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_PI_TEMPLATE_SETTINGS;
  });

  if (!piData) return null;

  const handleUpdateSettings = (updates) => {
    setTemplateSettings(prev => ({ ...prev, ...updates }));
  };

  const handleSaveAsDefault = () => {
    try {
      localStorage.setItem('vrm_pi_template_customization', JSON.stringify(templateSettings));
    } catch (e) {
      console.warn('Could not persist template settings:', e);
    }
  };

  const handleResetDefaults = () => {
    setTemplateSettings(DEFAULT_PI_TEMPLATE_SETTINGS);
    try {
      localStorage.removeItem('vrm_pi_template_customization');
    } catch (e) {}
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const sheetEl = document.getElementById('printable-proforma-invoice');
      if (!sheetEl) {
        alert('Could not locate printable invoice element.');
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

      const piNumberSafe = (piData.piNo || 'Proforma_Invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`${piNumberSafe}_document.pdf`);
    } catch (err) {
      console.error('Proforma Invoice PDF export failed:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      {/* TOP FLOATING ACTION TOOLBAR */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: showCustomizer ? '1260px' : '850px',
          backgroundColor: '#0F172A',
          borderRadius: '10px 10px 0 0',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          boxSizing: 'border-box',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'max-width 0.2s ease-in-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={18} style={{ color: '#38BDF8' }} />
          <span style={{ fontWeight: '800', fontSize: '14px' }}>
            {templateSettings.documentTitle} — {piData.piNo || 'SPI-2025'}
          </span>
          <span style={{
            fontSize: '11px',
            backgroundColor: templateSettings.accentColor || '#0E7490',
            color: '#FFFFFF',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: '700'
          }}>
            Official PDF
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* CUSTOMIZE TOGGLE BUTTON */}
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            style={{
              backgroundColor: showCustomizer ? '#334155' : 'transparent',
              color: '#FFFFFF',
              border: '1px solid #475569',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sliders size={14} style={{ color: '#38BDF8' }} />
            {showCustomizer ? 'Hide Customizer' : 'Customize Template'}
          </button>

          {/* DOWNLOAD PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            style={{
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 16px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: isExporting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isExporting ? 0.7 : 1
            }}
          >
            <Download size={14} /> {isExporting ? 'Generating PDF...' : 'Download PDF'}
          </button>

          {/* NATIVE PRINT */}
          <button
            onClick={handlePrint}
            style={{
              backgroundColor: templateSettings.accentColor || '#0E7490',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 16px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={14} /> Print
          </button>

          {/* CLOSE */}
          <button
            onClick={onClose}
            title="Close Preview"
            style={{
              backgroundColor: '#334155',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA: SHEET + OPTIONAL SIDE-BY-SIDE CUSTOMIZER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '24px',
          width: '100%',
          maxWidth: showCustomizer ? '1260px' : '850px',
          transition: 'max-width 0.2s ease-in-out'
        }}
      >
        {/* LIVE PRINTABLE DOCUMENT SHEET */}
        <div style={{ flex: 1, minWidth: '0' }}>
          <VRMProformaInvoicePrintSheet
            piData={piData}
            settings={templateSettings}
            id="printable-proforma-invoice"
          />
        </div>

        {/* CUSTOMIZATION DRAWER */}
        {showCustomizer && (
          <TemplateCustomizerDrawer
            settings={templateSettings}
            onUpdateSettings={handleUpdateSettings}
            onSaveAsDefault={handleSaveAsDefault}
            onResetDefaults={handleResetDefaults}
            onClose={() => setShowCustomizer(false)}
          />
        )}
      </div>
    </div>
  );
}
