import React, { useState, useMemo } from 'react';
import {
  Search, Filter, Plus, Phone, MessageSquare, Calendar, ArrowRight,
  CheckCircle2, Clock, AlertCircle, Building2, User, Mail, ExternalLink,
  ChevronRight, RefreshCw, X, ShieldAlert, Sparkles, Tag, Eye, MoreHorizontal,
  FileText, Check, ChevronDown
} from 'lucide-react';

export default function CrmLeadsView({
  leads = [],
  customers = [],
  onSaveLead,
  onConvertLead,
  onNavigateTab,
  onOpenWhatsAppChat
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState({
    companyName: '',
    contactPerson: '',
    designation: '',
    phone: '',
    whatsapp: '',
    email: '',
    source: 'WhatsApp',
    category: 'Aluminium Mounting Structures',
    estimatedKw: '',
    notes: '',
    assignedSalesperson: localStorage.getItem('controlroom_logged_user_name') || 'Sales Representative'
  });

  const [dupWarning, setDupWarning] = useState(null);

  // Duplicate prevention check
  const handlePhoneOrEmailChange = (field, value) => {
    setNewLeadForm(prev => ({ ...prev, [field]: value }));
    const trimmed = String(value || '').trim().toLowerCase();
    if (!trimmed || trimmed.length < 5) {
      setDupWarning(null);
      return;
    }

    // Check against existing leads
    const dupLead = leads.find(l => 
      (field === 'phone' || field === 'whatsapp')
        ? (l.phone?.replace(/\D/g, '') === trimmed.replace(/\D/g, '') || l.whatsapp?.replace(/\D/g, '') === trimmed.replace(/\D/g, ''))
        : (l.email?.toLowerCase() === trimmed)
    );

    // Check against existing customers
    const dupCustomer = customers.find(c =>
      (field === 'phone' || field === 'whatsapp')
        ? (c.primaryContact?.phone?.replace(/\D/g, '') === trimmed.replace(/\D/g, '') || c.primaryContact?.whatsapp?.replace(/\D/g, '') === trimmed.replace(/\D/g, ''))
        : (c.primaryContact?.email?.toLowerCase() === trimmed)
    );

    if (dupLead) {
      setDupWarning(`Notice: A lead already exists for this contact: "${dupLead.companyName}" (${dupLead.leadNumber}) assigned to ${dupLead.assignedSalesperson}.`);
    } else if (dupCustomer) {
      setDupWarning(`Notice: This contact is already an existing Customer: "${dupCustomer.companyName}" (${dupCustomer.customerCode}).`);
    } else {
      setDupWarning(null);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm ||
        lead.companyName?.toLowerCase().includes(q) ||
        lead.contactPerson?.toLowerCase().includes(q) ||
        lead.leadNumber?.toLowerCase().includes(q) ||
        lead.phone?.includes(q) ||
        lead.email?.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchSource = sourceFilter === 'All' || lead.source === sourceFilter;
      return matchSearch && matchStatus && matchSource;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreateLeadSubmit = (e) => {
    e.preventDefault();
    if (!newLeadForm.companyName || !newLeadForm.contactPerson || !newLeadForm.phone) {
      alert('Please provide Company Name, Contact Person, and Phone Number.');
      return;
    }

    const nextNumber = `LEAD-${String(leads.length + 1).padStart(3, '0')}`;
    const newRecord = {
      id: `LEAD-2026-${String(Date.now()).slice(-4)}`,
      leadNumber: nextNumber,
      companyName: newLeadForm.companyName,
      contactPerson: newLeadForm.contactPerson,
      designation: newLeadForm.designation,
      phone: newLeadForm.phone,
      whatsapp: newLeadForm.whatsapp || newLeadForm.phone,
      email: newLeadForm.email,
      source: newLeadForm.source,
      status: 'New Lead',
      assignedSalesperson: newLeadForm.assignedSalesperson,
      estimatedKw: newLeadForm.estimatedKw ? parseFloat(newLeadForm.estimatedKw) : null,
      category: newLeadForm.category,
      notes: newLeadForm.notes,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          id: `TL-${Date.now()}`,
          type: 'lead_created',
          title: 'Lead Created',
          description: `Lead created manually via CRM by ${newLeadForm.assignedSalesperson}`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    onSaveLead(newRecord);
    setShowCreateModal(false);
    setNewLeadForm({
      companyName: '',
      contactPerson: '',
      designation: '',
      phone: '',
      whatsapp: '',
      email: '',
      source: 'WhatsApp',
      category: 'Aluminium Mounting Structures',
      estimatedKw: '',
      notes: '',
      assignedSalesperson: localStorage.getItem('controlroom_logged_user_name') || 'Sales Representative'
    });
    setDupWarning(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header Toolbar */}
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
            <Building2 size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Sales Leads Directory
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              Track prospective solar projects from first inquiry through qualification
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(14, 116, 144, 0.2)'
            }}
          >
            <Plus size={16} /> New Solar Lead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '12px 18px',
        borderRadius: '10px',
        border: '1px solid #E2E8F0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #CBD5E1',
          padding: '6px 12px',
          borderRadius: '8px',
          flex: '1',
          minWidth: '240px'
        }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search by company, contact person, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              width: '100%',
              color: '#0F172A'
            }}
          />
          {searchTerm && (
            <X size={14} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              fontWeight: '600',
              color: '#334155',
              backgroundColor: '#FFFFFF',
              outline: 'none'
            }}
          >
            <option value="All">All Statuses</option>
            <option value="New Lead">New Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Disqualified">Disqualified</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '12px',
              fontWeight: '600',
              color: '#334155',
              backgroundColor: '#FFFFFF',
              outline: 'none'
            }}
          >
            <option value="All">All Sources</option>
            <option value="WhatsApp">WhatsApp Inbound</option>
            <option value="Website">VRM Website</option>
            <option value="IndiaMART">IndiaMART</option>
            <option value="Referral">Referral</option>
            <option value="Exhibition">Renewable Expo</option>
          </select>
        </div>
      </div>

      {/* Leads Table matching VRM Standard Table Guidelines */}
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
                <th style={{ padding: '12px 16px', width: '40px' }}>
                  <input
                    type="checkbox"
                    style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                    checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Lead #</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Company & Contact</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Solar Requirement</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Source</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Salesperson</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                    <p style={{ margin: '0 0 6px', fontWeight: '700', fontSize: '15px' }}>No leads found</p>
                    <p style={{ margin: 0, fontSize: '12px' }}>Try adjusting your search criteria or create a new lead.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      style={{
                        backgroundColor: isSelected ? '#ECFEFF' : '#FFFFFF',
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      <td style={{
                        padding: '14px 16px',
                        borderLeft: isSelected ? '4px solid #0E7490' : '4px solid transparent'
                      }}>
                        <input
                          type="checkbox"
                          style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                          checked={isSelected}
                          onChange={() => handleSelectRow(lead.id)}
                        />
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0E7490' }}>
                        <span
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => setSelectedLead(lead)}
                        >
                          {lead.leadNumber}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{lead.companyName}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                          <span>{lead.contactPerson}</span>
                          <span>•</span>
                          <span>{lead.phone}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#334155' }}>
                          {lead.estimatedKw ? `${lead.estimatedKw} kW` : 'Custom Spec'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {lead.category || 'Aluminium Mounting Structures'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: lead.source === 'WhatsApp' ? '#DCFCE7' : lead.source === 'Website' ? '#E0F2FE' : '#F1F5F9',
                          color: lead.source === 'WhatsApp' ? '#15803D' : lead.source === 'Website' ? '#0369A1' : '#475569'
                        }}>
                          {lead.source}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155', fontWeight: '600' }}>
                        {lead.assignedSalesperson || 'Unassigned'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: lead.status === 'New Lead' ? '#FEF3C7' : lead.status === 'Qualified' ? '#EDE9FE' : '#F1F5F9',
                          color: lead.status === 'New Lead' ? '#B45309' : lead.status === 'Qualified' ? '#6D28D9' : '#334155'
                        }}>
                          {lead.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Quick Call */}
                          <a
                            href={`tel:${lead.phone}`}
                            title="Call Phone"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: '#FFFFFF',
                              color: '#0284C7',
                              display: 'inline-flex',
                              textDecoration: 'none'
                            }}
                          >
                            <Phone size={14} />
                          </a>

                          {/* Quick WhatsApp */}
                          <button
                            title="Open WhatsApp Chat"
                            onClick={() => onOpenWhatsAppChat ? onOpenWhatsAppChat(lead) : onNavigateTab('WhatsApp Inbox')}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: '#F0FDF4',
                              color: '#16A34A',
                              cursor: 'pointer',
                              display: 'inline-flex'
                            }}
                          >
                            <MessageSquare size={14} />
                          </button>

                          {/* Convert to Opportunity / Customer */}
                          {lead.status !== 'Converted' && (
                            <button
                              title="Convert to Customer & Opportunity"
                              onClick={() => onConvertLead(lead)}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                border: '1px solid #0E7490',
                                backgroundColor: '#0E7490',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <ArrowRight size={12} /> Convert
                            </button>
                          )}

                          {/* Detail Drawer */}
                          <button
                            onClick={() => setSelectedLead(lead)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: '#FFFFFF',
                              color: '#64748B',
                              cursor: 'pointer',
                              display: 'inline-flex'
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          fontSize: '12px',
          color: '#64748B'
        }}>
          <div>
            Showing 1 to {filteredLeads.length} of {leads.length} leads
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button disabled style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'not-allowed' }}>‹</button>
            <button style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #0E7490', backgroundColor: '#0E7490', color: '#FFFFFF', fontWeight: '700' }}>1</button>
            <button disabled style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'not-allowed' }}>›</button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar when 1 or more rows selected */}
      {selectedLeadIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '999px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          zIndex: 1000,
          fontSize: '13px',
          fontWeight: '700'
        }}>
          <span>{selectedLeadIds.length} Selected</span>
          <span style={{ color: '#475569' }}>|</span>
          <button
            onClick={() => alert(`Assigning ${selectedLeadIds.length} leads to salesperson...`)}
            style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px' }}
          >
            👤 Assign Salesperson
          </button>
          <span style={{ color: '#475569' }}>|</span>
          <button
            onClick={() => setSelectedLeadIds([])}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Create Lead Modal */}
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
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Create New Solar Project Lead
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  VRM Structures India Pvt Ltd • B2B Sales Management
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Duplicate Warning */}
              {dupWarning && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFBEB',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                  color: '#B45309',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={18} />
                  <span>{dupWarning}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Company / EPC Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Solar Ltd"
                    value={newLeadForm.companyName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, companyName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kannan"
                    value={newLeadForm.contactPerson}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactPerson: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={newLeadForm.phone}
                    onChange={(e) => handlePhoneOrEmailChange('phone', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    placeholder="Same as phone if blank"
                    value={newLeadForm.whatsapp}
                    onChange={(e) => handlePhoneOrEmailChange('whatsapp', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={newLeadForm.email}
                    onChange={(e) => handlePhoneOrEmailChange('email', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Lead Source
                  </label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="WhatsApp">WhatsApp Inbound</option>
                    <option value="Website">VRM Website</option>
                    <option value="IndiaMART">IndiaMART</option>
                    <option value="Referral">Referral</option>
                    <option value="Exhibition">Renewable Expo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Structure Category
                  </label>
                  <select
                    value={newLeadForm.category}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Aluminium Mounting Structures">Aluminium Rooftop Rails</option>
                    <option value="Tin Shed Clamping Systems">Tin Shed Mini Rails</option>
                    <option value="HDG Ground Mounting Structures">HDG Ground Purlins / Struts</option>
                    <option value="Walkways & Safety Handrails">Solar Walkways & Handrails</option>
                    <option value="Ballasted Rooftop Systems">Ballasted Non-Penetrative</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Estimated Capacity (kW)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={newLeadForm.estimatedKw}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedKw: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Project Details / Requirements Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter panel orientation, wind speed requirements, site location, delivery deadlines..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0E7490', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Save Lead Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail & Activity Timeline Drawer */}
      {selectedLead && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '520px',
          backgroundColor: '#FFFFFF',
          boxShadow: '-10px 0 25px -5px rgba(0,0,0,0.15)',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #E2E8F0'
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: '18px 20px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#0E7490', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Lead Details • {selectedLead.leadNumber}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '2px 0 0' }}>
                {selectedLead.companyName}
              </h3>
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Contact Card */}
            <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '8px' }}>
                Primary Contact Information
              </div>
              <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: '700' }}>
                {selectedLead.contactPerson} ({selectedLead.designation || 'Contact'})
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>📞 Phone: <strong>{selectedLead.phone}</strong></div>
                <div>💬 WhatsApp: <strong>{selectedLead.whatsapp || selectedLead.phone}</strong></div>
                <div>✉️ Email: <strong>{selectedLead.email || 'None specified'}</strong></div>
                <div>👤 Assigned to: <strong>{selectedLead.assignedSalesperson}</strong></div>
              </div>
            </div>

            {/* Solar Requirement Card */}
            <div style={{ padding: '14px', backgroundColor: '#F0FDFA', borderRadius: '10px', border: '1px solid #CCFBF1' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F766E', marginBottom: '6px' }}>
                Solar Project Specifications
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                {selectedLead.estimatedKw ? `${selectedLead.estimatedKw} kW Capacity` : 'Custom Scope'}
              </div>
              <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                Category: <strong>{selectedLead.category || 'Aluminium Mounting Structures'}</strong>
              </div>
              {selectedLead.notes && (
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', padding: '8px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  {selectedLead.notes}
                </div>
              )}
            </div>

            {/* Conversion CTA */}
            {selectedLead.status !== 'Converted' && (
              <div style={{
                padding: '16px',
                backgroundColor: '#EFF6FF',
                borderRadius: '10px',
                border: '1px solid #DBEAFE',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E40AF' }}>
                  Ready to quote this solar structure?
                </div>
                <p style={{ fontSize: '12px', color: '#3B82F6', margin: 0 }}>
                  Convert this lead into an active Customer and commercial Opportunity to generate BOM calculations and Quotations.
                </p>
                <button
                  onClick={() => {
                    const l = selectedLead;
                    setSelectedLead(null);
                    onConvertLead(l);
                  }}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowRight size={14} /> Convert to Customer & Opportunity
                </button>
              </div>
            )}

            {/* Chronological Activity Timeline */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
                Activity & Interaction Timeline
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '2px solid #E2E8F0', paddingLeft: '14px', marginLeft: '6px' }}>
                {(selectedLead.timeline || [
                  {
                    id: 'TL-1',
                    type: 'lead_created',
                    title: 'Inquiry Logged',
                    description: `Inquiry recorded from ${selectedLead.source}`,
                    timestamp: selectedLead.createdAt
                  }
                ]).map((item, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-21px',
                      top: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#0E7490',
                      border: '2px solid #FFFFFF'
                    }} />
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      {item.description}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
