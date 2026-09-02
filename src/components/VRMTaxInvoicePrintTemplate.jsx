import React from 'react';
import { Printer, X } from 'lucide-react';

export default function VRMTaxInvoicePrintTemplate({ invoiceData, onClose }) {
  if (!invoiceData) return null;

  const inv = invoiceData;
  const items = Array.isArray(inv.items) && inv.items.length > 0 ? inv.items : [
    {
      sNo: 1,
      name: 'Solar On-Grid System',
      description: "Solar On-Grid System with panels and 3kw solar kit\nModule - ReNew 550 wp DCR Bifacial - 6 No's\nInverter - Polycab 3.6 kw 1 phase - 1 No's\nStructures - 2*3 Table - 2000mm * 2500mm - 1 set",
      hsn: '85414300',
      qty: '1.00',
      unit: 'Set',
      rate: 127500.00,
      cgstPct: '2.5%',
      sgstPct: '2.5%',
      amount: 127500.00
    }
  ];

  const subTotal = items.reduce((sum, item) => sum + (Number(item.amount || item.rate || 0)), 0) || 127500;
  const cgstAmt = (subTotal * 0.025);
  const sgstAmt = (subTotal * 0.025);
  const grandTotal = subTotal + cgstAmt + sgstAmt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      {/* TOP FLOATING CONTROLS (Hidden during print) */}
      <div className="no-print" style={{
        width: '100%',
        maxWidth: '850px',
        backgroundColor: '#0F172A',
        borderRadius: '12px 12px 0 0',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#FFFFFF'
      }}>
        <div style={{ fontWeight: '700', fontSize: '15px' }}>
          Exact Tax Invoice PDF Format ({inv.invNo || 'VRMS/26-27/2592'})
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handlePrint}
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={16} /> Print / Save PDF
          </button>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#475569',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* PRINTABLE CONTAINER (Pixel-Perfect Duplicate of Zoho Books / VRM Invoice Document) */}
      <div id="printable-tax-invoice" style={{
        width: '100%',
        maxWidth: '850px',
        backgroundColor: '#FFFFFF',
        color: '#000000',
        fontFamily: "Calibri, Arial, sans-serif",
        fontSize: '12px',
        lineHeight: '1.3',
        boxSizing: 'border-box',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        padding: '24px'
      }}>
        
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              .no-print { display: none !important; }
              #printable-tax-invoice, #printable-tax-invoice * { visibility: visible; }
              #printable-tax-invoice {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                max-width: 100% !important;
                box-shadow: none !important;
                padding: 0 !important;
              }
              .page-break { page-break-before: always; }
            }
          `}
        </style>

        {/* Outer Border Outer Table Layout matching Original PDF Document */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000' }}>
          <tbody>
            
            {/* ROW 1: HEADER (LOGO + COMPANY ADDRESS LEFT | TAX INVOICE RIGHT) */}
            <tr>
              <td colSpan={8} style={{ padding: '16px', borderBottom: '1px solid #000000', verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '55%', verticalAlign: 'top' }}>
                        {/* Official VRM Structures Logo Image */}
                        <div style={{ marginBottom: '8px' }}>
                          <img
                            src="/vrm_logo.png"
                            alt="VRM Structures Logo"
                            style={{ height: '55px', maxWidth: '240px', objectFit: 'contain' }}
                          />
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003366', marginTop: '4px' }}>
                          VRM Structures India Pvt Ltd.
                        </div>
                        <div style={{ fontSize: '11px', color: '#1E293B', marginTop: '2px' }}>
                          1427, GNT Road, Nagappa Industrial Estate,<br />
                          Puzhal,<br />
                          Chennai, Tamil Nadu 600066<br />
                          India<br />
                          GSTIN 33AAGCV4262N1ZZ<br />
                          9884720789
                        </div>
                      </td>
                      <td style={{ width: '45%', textAlign: 'right', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#002B49', letterSpacing: '1px', marginBottom: '12px' }}>
                          TAX INVOICE
                        </div>
                        <table style={{ width: '100%', fontSize: '11px', textAlign: 'left', float: 'right' }}>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 'bold', width: '110px' }}>Invoice No.</td>
                              <td>: {inv.invNo || 'VRMS/26-27/2592'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>Invoice Date</td>
                              <td>: {inv.date || '01-09-2026'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>Terms</td>
                              <td>: {inv.paymentTerms || 'Due on Receipt'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>E-Way Bill#</td>
                              <td>: {inv.ewayBill || '512064744119'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>Place Of Supply</td>
                              <td>: Tamil Nadu (33)</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold' }}>Sales person</td>
                              <td>: ManojRaj</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ROW 2: BILL TO / SHIP TO BAR */}
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #000000' }}>
              <td colSpan={4} style={{ width: '50%', padding: '6px 12px', fontWeight: 'bold', borderRight: '1px solid #000000', fontSize: '11px' }}>
                Bill To
              </td>
              <td colSpan={4} style={{ width: '50%', padding: '6px 12px', fontWeight: 'bold', fontSize: '11px' }}>
                Ship To
              </td>
            </tr>

            {/* ROW 3: BILL TO / SHIP TO ADDRESS CONTENT */}
            <tr style={{ borderBottom: '1px solid #000000' }}>
              <td colSpan={4} style={{ width: '50%', padding: '10px 12px', borderRight: '1px solid #000000', verticalAlign: 'top', fontSize: '11px' }}>
                <div style={{ fontWeight: 'bold', color: '#002B49', fontSize: '12px' }}>
                  {inv.vendor || inv.customerName || 'EXOTIC POWER SOLUTIONS PVT LTD'}
                </div>
                <div>Plot no 4A T.V.Nagar, mount poonamallee road,</div>
                <div>mugalivakkam</div>
                <div>Chennai 600125</div>
                <div>Tamil Nadu</div>
                <div>India</div>
                <div>{inv.gstNo || '33AABCE4135A1ZG'}</div>
                <div>{inv.phone || '7845670406'}</div>
              </td>
              <td colSpan={4} style={{ width: '50%', padding: '10px 12px', verticalAlign: 'top', fontSize: '11px' }}>
                <div>URD : Benjamin k v</div>
                <div>Aadhar No: 4550 4074 8477</div>
                <div>151, METTU STREET, EGUVARPALAYAM,</div>
                <div>Eguvarpalayam, PO: Iguvarpalayam</div>
                <div>Tiruvallur 601201</div>
                <div>Tamil Nadu</div>
                <div>India</div>
                <div>+91-9940319400</div>
              </td>
            </tr>

            {/* ROW 4: TABLE HEADER */}
            <tr style={{ borderBottom: '1px solid #000000', fontSize: '10.5px', fontWeight: 'bold', backgroundColor: '#F8FAFC' }}>
              <td style={{ padding: '6px', borderRight: '1px solid #000000', width: '30px', textAlign: 'center' }}>S.no</td>
              <td style={{ padding: '6px', borderRight: '1px solid #000000', textAlign: 'left' }}>Item & Description</td>
              <td style={{ padding: '6px', borderRight: '1px solid #000000', width: '70px', textAlign: 'center' }}>HSN</td>
              <td style={{ padding: '6px', borderRight: '1px solid #000000', width: '50px', textAlign: 'center' }}>Qty</td>
              <td style={{ padding: '6px', borderRight: '1px solid #000000', width: '80px', textAlign: 'right' }}>Rate</td>
              <td style={{ padding: '6px', borderRight: '1px solid #000000', width: '45px', textAlign: 'center' }}>CGST</td>
              <td style={{ padding: '6px', borderRight: '1px solid #000000', width: '45px', textAlign: 'center' }}>SGST</td>
              <td style={{ padding: '6px', width: '85px', textAlign: 'right' }}>Amount</td>
            </tr>

            {/* ROW 5: ITEM BODY */}
            {items.map((it, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #000000', minHeight: '180px' }}>
                <td style={{ padding: '10px 6px', borderRight: '1px solid #000000', textAlign: 'center', verticalAlign: 'top' }}>{idx + 1}</td>
                <td style={{ padding: '10px 6px', borderRight: '1px solid #000000', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold', color: '#000000' }}>{it.name}</div>
                  <div style={{ fontSize: '10px', color: '#333333', marginTop: '4px', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                    {it.description}
                  </div>
                </td>
                <td style={{ padding: '10px 6px', borderRight: '1px solid #000000', textAlign: 'center', verticalAlign: 'top' }}>{it.hsn || '85414300'}</td>
                <td style={{ padding: '10px 6px', borderRight: '1px solid #000000', textAlign: 'center', verticalAlign: 'top' }}>
                  {it.qty || '1.00'}<br />{it.unit || 'Set'}
                </td>
                <td style={{ padding: '10px 6px', borderRight: '1px solid #000000', textAlign: 'right', verticalAlign: 'top' }}>
                  {Number(it.rate || 127500).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '10px 6px', borderRight: '1px solid #000000', textAlign: 'center', verticalAlign: 'top' }}>2.5%</td>
                <td style={{ padding: '10px 6px', borderRight: '1px solid #000000', textAlign: 'center', verticalAlign: 'top' }}>2.5%</td>
                <td style={{ padding: '10px 6px', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
                  {Number(it.amount || it.rate || 127500).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}

            {/* ROW 6: FOOTER (WORDS & BANK LEFT | TOTALS & SIGNATURE RIGHT) */}
            <tr>
              <td colSpan={4} style={{ borderRight: '1px solid #000000', padding: '12px', verticalAlign: 'top' }}>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '10px', color: '#475569', fontWeight: 'bold' }}>Total In Words</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000', marginTop: '2px' }}>
                    Indian Rupee One Lakh Thirty-Three Thousand Eight Hundred Seventy-Five Only
                  </div>
                </div>

                <div style={{ fontSize: '10.5px', marginBottom: '14px', lineHeight: '1.4' }}>
                  <div style={{ fontWeight: 'bold', color: '#002B49' }}>Account Details:</div>
                  <div>Beneficiary: VRM Structures India Private Limited</div>
                  <div>A/c No: 50200031629272</div>
                  <div>Bank: HDFC Bank</div>
                  <div>Branch: Kodambakkam</div>
                  <div>IFSC: HDFC0000574</div>
                </div>

                <div style={{ fontSize: '10px', color: '#1E293B', lineHeight: '1.4' }}>
                  <div style={{ fontWeight: 'bold', color: '#002B49' }}>Terms & Conditions</div>
                  <ol style={{ margin: '2px 0 0 0', paddingLeft: '14px' }}>
                    <li>TAX: Included</li>
                    <li>Transport: At actuals</li>
                    <li>Payment: 100% along with the Purchase Order</li>
                    <li>Delivery: Immediate Dispatch</li>
                    <li>Validity: 3 days</li>
                  </ol>
                </div>
              </td>

              <td colSpan={4} style={{ padding: '0', verticalAlign: 'top' }}>
                {/* TOTALS SUB TABLE */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>Sub Total</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', width: '110px' }}>
                        {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>Total Taxable Amount</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold' }}>
                        {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '4px 12px', textAlign: 'right' }}>CGST2.5 (2.5%)</td>
                      <td style={{ padding: '4px 12px', textAlign: 'right' }}>
                        {cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '4px 12px', textAlign: 'right' }}>SGST2.5 (2.5%)</td>
                      <td style={{ padding: '4px 12px', textAlign: 'right' }}>
                        {sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold', fontSize: '12px' }}>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>Total</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                        ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold', fontSize: '12px' }}>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>Balance Due</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                        ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* AUTHORIZED SIGNATORY STAMP BOX */}
                <div style={{ padding: '16px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000' }}>
                    VRM Structures India Pvt Ltd
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                    <svg width="150" height="55" viewBox="0 0 150 55">
                      <circle cx="75" cy="27" r="24" stroke="#003366" strokeWidth="1.5" strokeDasharray="3 3"/>
                      <text x="75" y="20" textAnchor="middle" fill="#003366" fontSize="7.5" fontWeight="bold">VRM STRUCTURES INDIA</text>
                      <text x="75" y="36" textAnchor="middle" fill="#003366" fontSize="7.5">CHENNAI</text>
                      <path d="M 40 30 Q 65 10 110 25" stroke="#0047AB" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                  <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#000000' }}>
                    Authorized Signatory
                  </div>
                </div>

              </td>
            </tr>

          </tbody>
        </table>

        {/* PAGE 2 BREAK */}
        <div className="page-break" style={{ height: '24px' }} />

        {/* PAGE 2: GOVERNMENT E-INVOICING SECTION */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', marginTop: '20px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '16px', verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '140px', verticalAlign: 'top' }}>
                        <div style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>
                          <svg width="110" height="110" viewBox="0 0 100 100" fill="#000000">
                            <rect width="100" height="100" fill="#FFFFFF"/>
                            <rect x="10" y="10" width="25" height="25" fill="#000"/>
                            <rect x="15" y="15" width="15" height="15" fill="#FFF"/>
                            <rect x="18" y="18" width="9" height="9" fill="#000"/>
                            <rect x="65" y="10" width="25" height="25" fill="#000"/>
                            <rect x="70" y="15" width="15" height="15" fill="#FFF"/>
                            <rect x="73" y="18" width="9" height="9" fill="#000"/>
                            <rect x="10" y="65" width="25" height="25" fill="#000"/>
                            <rect x="15" y="70" width="15" height="15" fill="#FFF"/>
                            <rect x="18" y="73" width="9" height="9" fill="#000"/>
                            <rect x="40" y="40" width="20" height="20" fill="#000"/>
                            <rect x="65" y="65" width="10" height="10" fill="#000"/>
                            <rect x="80" y="75" width="10" height="10" fill="#000"/>
                            <rect x="45" y="75" width="15" height="10" fill="#000"/>
                            <rect x="75" y="45" width="10" height="15" fill="#000"/>
                          </svg>
                        </div>
                      </td>
                      <td style={{ paddingLeft: '16px', verticalAlign: 'top', fontSize: '11px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 'bold', width: '80px', padding: '4px 0' }}>IRN :</td>
                              <td style={{ fontWeight: 'bold', wordBreak: 'break-all', fontFamily: 'monospace', padding: '4px 0' }}>
                                {inv.irn || '03f6c55205f54aaf39fee470f7eccc161e7f3899f334d1ed19cdc27da1a24ea5'}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Ack No. :</td>
                              <td style={{ fontWeight: 'bold', padding: '4px 0' }}>
                                {inv.ackNo || '152627002029264'}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold', padding: '4px 0' }}>Ack Date :</td>
                              <td style={{ padding: '4px 0' }}>
                                {inv.ackDate || '2026-09-01 17:29:00'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ marginTop: '14px', fontSize: '10.5px', color: '#475569' }}>
                          e-Invoicing detail(s) generated from the Government's e-Invoicing system.
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}
