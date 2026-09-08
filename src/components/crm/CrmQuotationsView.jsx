import React, { useState } from 'react';
import {
  FileText, Plus, Search, Eye, Share2, MessageSquare, Download, Check,
  Building2, Printer, X, DollarSign, Calendar, Tag, ChevronRight
} from 'lucide-react';

export default function CrmQuotationsView({
  quotations = [],
  onSaveQuotation,
  onNavigateTab,
  onOpenWhatsAppChat
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Quote Form
  const [newQuote, setNewQuote] = useState({
    customerName: '',
    contactPerson: '',
    phone: '',
    email: '',
    structureType: 'Aluminium Rooftop Rails (6063 T6)',
    capacityKw: 100,
    validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    items: [
      { description: 'VRM Standard Aluminium Rail 6063 T6 (3.2m)', qty: 400, unit: 'MTR', rate: 285, amount: 114000 },
      { description: 'Aluminium End Clamps with SS304 Fasteners', qty: 200, unit: 'NOS', rate: 45, amount: 9000 },
      { description: 'Aluminium Mid Clamps with SS304 Fasteners', qty: 600, unit: 'NOS', rate: 42, amount: 25200 }
    ],
    salesPerson: localStorage.getItem('controlroom_logged_user_name') || 'Saravanan'
  });

  const filteredQuotes = quotations.filter(q => {
    const term = searchTerm.toLowerCase();
    return !searchTerm ||
      q.quoteNumber?.toLowerCase().includes(term) ||
      q.customerName?.toLowerCase().includes(term);
  });

  const subtotal = newQuote.items.reduce((s, i) => s + (i.amount || 0), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newQuote.customerName) {
      alert('Please specify customer name.');
      return;
    }

    const nextNo = `QT-2026-${String(10 + quotations.length + 1)}`;
    const quoteRecord = {
      id: nextNo,
      quoteNumber: nextNo,
      ...newQuote,
      subtotal,
      gst,
      totalAmount: total,
      status: 'Draft',
      createdAt: new Date().toISOString()
    };

    onSaveQuotation(quoteRecord);
    setShowCreateModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#0E7490',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Solar Structure Quotations
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              Generate commercial quotations for aluminium & steel solar mounting systems
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0E7490',
            color: '#FFFFFF',
            border: 'none',
            padding: '9px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> New Quotation
        </button>
      </div>

      {/* Quotations List */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Quote #</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Customer Name</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Structure Scope</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Total (₹)</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Sales Rep</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0E7490' }}>
                    {q.quoteNumber}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0F172A' }}>
                    {q.customerName}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#334155' }}>
                    {q.structureType || 'Mounting System'}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '800', color: '#0F172A' }}>
                    ₹ {Number(q.totalAmount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: q.status === 'Sent' ? '#DCFCE7' : '#FEF3C7',
                      color: q.status === 'Sent' ? '#15803D' : '#B45309'
                    }}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    {q.salesPerson}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        onClick={() => setSelectedQuote(q)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => onOpenWhatsAppChat ? onOpenWhatsAppChat({ customerName: q.customerName, phone: q.phone }) : onNavigateTab('WhatsApp Inbox')}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #16A34A', backgroundColor: '#F0FDF4', color: '#16A34A', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <MessageSquare size={13} /> WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Preview Modal */}
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
            maxWidth: '780px',
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
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0E7490' }}>
                  {selectedQuote.quoteNumber}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Customer Details */}
            <div style={{ marginBottom: '20px', fontSize: '13px' }}>
              <div><strong>Prepared For:</strong> {selectedQuote.customerName}</div>
              <div><strong>Structure:</strong> {selectedQuote.structureType}</div>
              <div><strong>Sales Representative:</strong> {selectedQuote.salesPerson}</div>
            </div>

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Item Description</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Rate (₹)</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(selectedQuote.items || []).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px' }}>{it.description}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{it.qty} {it.unit}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹ {it.rate}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹ {Number(it.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <div style={{ width: '240px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Subtotal:</span>
                  <strong>₹ {Number(selectedQuote.subtotal || selectedQuote.totalAmount).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #E2E8F0', marginTop: '6px' }}>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>Grand Total:</span>
                  <strong style={{ fontWeight: '800', color: '#0E7490', fontSize: '15px' }}>
                    ₹ {Number(selectedQuote.totalAmount).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} /> Print / Save PDF
              </button>
              <button
                onClick={() => setSelectedQuote(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Quote Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
            maxWidth: '650px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Create Solar Quotation</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Solar Ltd"
                  value={newQuote.customerName}
                  onChange={(e) => setNewQuote({ ...newQuote, customerName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Structure Type</label>
                  <select
                    value={newQuote.structureType}
                    onChange={(e) => setNewQuote({ ...newQuote, structureType: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Aluminium Rooftop Rails (6063 T6)">Aluminium Rooftop Rails (6063 T6)</option>
                    <option value="Tin Shed Clamping Systems">Tin Shed Mini Rails</option>
                    <option value="HDG Ground Mounting Structures">HDG Ground Purlins / Struts</option>
                    <option value="Walkways & Handrails">Walkways & Handrails</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>Capacity (kW)</label>
                  <input
                    type="number"
                    value={newQuote.capacityKw}
                    onChange={(e) => setNewQuote({ ...newQuote, capacityKw: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#0E7490', color: '#FFFFFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Save Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
