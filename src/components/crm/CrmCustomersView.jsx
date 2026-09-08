import React, { useState, useMemo } from 'react';
import {
  Users, Search, Plus, Phone, MessageSquare, Mail, Building2, MapPin,
  CreditCard, FileText, CheckCircle2, ChevronRight, X, AlertTriangle,
  Layers, Truck, DollarSign, Calendar, Eye, Edit3, ShieldAlert
} from 'lucide-react';

export default function CrmCustomersView({
  customers = [],
  opportunities = [],
  quotations = [],
  onSaveCustomer,
  onOpenWhatsAppChat,
  onNavigateTab
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [profileTab, setProfileTab] = useState('Overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dupError, setDupError] = useState(null);

  // Form State
  const [newCust, setNewCust] = useState({
    companyName: '',
    customerType: 'EPC Contractor',
    industry: 'Solar Energy / Utility Scale',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    creditLimit: 2500000,
    creditDays: 30,
    paymentTerms: '50% Advance + 50% Dispatch',
    assignedSalesperson: localStorage.getItem('controlroom_logged_user_name') || 'Saravanan',
    source: 'Website',
    primaryContact: {
      name: '',
      designation: 'Procurement Head',
      phone: '',
      whatsapp: '',
      email: ''
    }
  });

  // Real-time duplicate validation
  const validateDuplicates = (field, value) => {
    const val = String(value || '').trim().toLowerCase();
    if (!val) {
      setDupError(null);
      return;
    }

    const dup = customers.find(c => {
      if (field === 'phone') {
        const p1 = c.primaryContact?.phone?.replace(/\D/g, '');
        const p2 = val.replace(/\D/g, '');
        return p1 && p2 && p1 === p2;
      }
      if (field === 'whatsapp') {
        const w1 = c.primaryContact?.whatsapp?.replace(/\D/g, '');
        const w2 = val.replace(/\D/g, '');
        return w1 && w2 && w1 === w2;
      }
      if (field === 'email') {
        return c.primaryContact?.email?.toLowerCase() === val;
      }
      if (field === 'gstNumber') {
        return c.gstNumber?.toLowerCase() === val;
      }
      if (field === 'companyName') {
        return c.companyName?.toLowerCase() === val;
      }
      return false;
    });

    if (dup) {
      setDupError(`Duplicate Alert: A customer already exists with this ${field}: "${dup.companyName}" (${dup.customerCode}).`);
    } else {
      setDupError(null);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchTerm.toLowerCase();
      return !searchTerm ||
        c.companyName?.toLowerCase().includes(q) ||
        c.customerCode?.toLowerCase().includes(q) ||
        c.primaryContact?.name?.toLowerCase().includes(q) ||
        c.primaryContact?.phone?.includes(q) ||
        c.gstNumber?.toLowerCase().includes(q);
    });
  }, [customers, searchTerm]);

  const handleCreateCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCust.companyName || !newCust.primaryContact.name || !newCust.primaryContact.phone) {
      alert('Company Name, Contact Person, and Phone Number are mandatory.');
      return;
    }

    const nextCode = `CUST-VRM-${String(100 + customers.length + 1)}`;
    const record = {
      id: nextCode,
      customerCode: nextCode,
      ...newCust,
      createdAt: new Date().toISOString()
    };

    onSaveCustomer(record);
    setShowCreateModal(false);
    setDupError(null);
  };

  // 11 Customer Profile Tabs
  const profileTabs = [
    'Overview',
    'Contacts',
    'Solar Requirements',
    'Opportunities',
    'Quotations',
    'BOM Orders',
    'Invoices',
    'Payment Terms & Ledger',
    'Documents & KYC',
    'WhatsApp Chats',
    'Activity Audit'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Header */}
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
            <Users size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Customer Directory (B2B Solar Accounts)
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              Centralized repository with 11-point 360° account intelligence & duplicate prevention
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
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(14, 116, 144, 0.2)'
          }}
        >
          <Plus size={16} /> New B2B Customer
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        padding: '10px 16px',
        borderRadius: '10px'
      }}>
        <Search size={16} color="#64748B" />
        <input
          type="text"
          placeholder="Search by Company Name, Code, GSTIN, Contact Person, Phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#0F172A' }}
        />
        {searchTerm && <X size={16} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />}
      </div>

      {/* Customers Table */}
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
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Customer Code</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Company Name</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Type & Industry</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Primary Contact</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>GST Number</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Payment Terms</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Assigned Rep</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>360° Profile</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0E7490' }}>
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setSelectedCustomer(cust)}
                      >
                        {cust.customerCode}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#0F172A' }}>{cust.companyName}</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>{cust.city}, {cust.state}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#334155' }}>{cust.customerType}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{cust.industry}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#0F172A' }}>{cust.primaryContact?.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>{cust.primaryContact?.phone}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '600', color: '#475569' }}>
                      {cust.gstNumber || 'Not Registered'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: '#FEF3C7', color: '#B45309' }}>
                        {cust.paymentTerms || 'Standard'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#334155' }}>
                      {cust.assignedSalesperson}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #0E7490',
                          backgroundColor: '#F0FDFA',
                          color: '#0E7490',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={13} /> View 360°
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 11-Tab Customer Profile Modal */}
      {selectedCustomer && (
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
            maxWidth: '1050px',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
                  {selectedCustomer.companyName.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                      {selectedCustomer.companyName}
                    </h3>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#334155', color: '#94A3B8' }}>
                      {selectedCustomer.customerCode}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0' }}>
                    {selectedCustomer.customerType} • {selectedCustomer.city}, {selectedCustomer.state} • Rep: {selectedCustomer.assignedSalesperson}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => onOpenWhatsAppChat ? onOpenWhatsAppChat(selectedCustomer) : onNavigateTab('WhatsApp Inbox')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={14} /> WhatsApp Chat
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Profile Navigation Tabs (11 Tabs) */}
            <div style={{
              display: 'flex',
              overflowX: 'auto',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              padding: '0 12px'
            }}>
              {profileTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(tab)}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    borderBottom: profileTab === tab ? '3px solid #0E7490' : '3px solid transparent',
                    color: profileTab === tab ? '#0E7490' : '#64748B',
                    fontWeight: profileTab === tab ? '800' : '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content Body */}
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              {profileTab === 'Overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: 0 }}>Company Information</h4>
                    <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div><strong>Full Name:</strong> {selectedCustomer.companyName}</div>
                      <div><strong>Customer Code:</strong> {selectedCustomer.customerCode}</div>
                      <div><strong>Type:</strong> {selectedCustomer.customerType}</div>
                      <div><strong>Industry:</strong> {selectedCustomer.industry}</div>
                      <div><strong>Address:</strong> {selectedCustomer.address}</div>
                      <div><strong>Location:</strong> {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}</div>
                    </div>
                  </div>

                  <div style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: 0 }}>Commercial & Financial Terms</h4>
                    <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div><strong>GSTIN:</strong> {selectedCustomer.gstNumber}</div>
                      <div><strong>PAN:</strong> {selectedCustomer.panNumber}</div>
                      <div><strong>Payment Terms:</strong> {selectedCustomer.paymentTerms}</div>
                      <div><strong>Credit Days:</strong> {selectedCustomer.creditDays} Days</div>
                      <div><strong>Credit Limit:</strong> ₹ {Number(selectedCustomer.creditLimit).toLocaleString()}</div>
                      <div><strong>Assigned Salesperson:</strong> {selectedCustomer.assignedSalesperson}</div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'Contacts' && (
                <div style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: 0 }}>Primary Authorized Contact</h4>
                  <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong>Name:</strong> {selectedCustomer.primaryContact?.name}</div>
                    <div><strong>Designation:</strong> {selectedCustomer.primaryContact?.designation}</div>
                    <div><strong>Phone:</strong> {selectedCustomer.primaryContact?.phone}</div>
                    <div><strong>WhatsApp:</strong> {selectedCustomer.primaryContact?.whatsapp}</div>
                    <div><strong>Email:</strong> {selectedCustomer.primaryContact?.email}</div>
                  </div>
                </div>
              )}

              {profileTab === 'Opportunities' && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: 0 }}>Linked Opportunities</h4>
                  {opportunities.filter(o => o.customerId === selectedCustomer.id || o.companyName === selectedCustomer.companyName).length === 0 ? (
                    <p style={{ color: '#64748B', fontSize: '13px' }}>No active opportunities recorded for this customer.</p>
                  ) : (
                    opportunities.filter(o => o.customerId === selectedCustomer.id || o.companyName === selectedCustomer.companyName).map(opp => (
                      <div key={opp.id} style={{ padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#0F172A' }}>{opp.title}</div>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>Stage: {opp.stage} • Value: ₹ {Number(opp.dealValue).toLocaleString()}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            onNavigateTab('Opportunities');
                          }}
                          style={{ padding: '6px 12px', backgroundColor: '#0E7490', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          View Pipeline
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {profileTab === 'BOM Orders' && (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: 0 }}>Connected Sales BOM Orders</h4>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>
                    View engineered structure Bills of Materials created for {selectedCustomer.companyName}.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      onNavigateTab('Sales BOM');
                    }}
                    style={{ padding: '8px 16px', backgroundColor: '#0E7490', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Open BOM Orders Center
                  </button>
                </div>
              )}

              {profileTab !== 'Overview' && profileTab !== 'Contacts' && profileTab !== 'Opportunities' && profileTab !== 'BOM Orders' && (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', color: '#334155' }}>{profileTab} Records</p>
                  <p style={{ fontSize: '13px' }}>Historical records, communications, and files for {selectedCustomer.companyName} are synchronized with VRM ERP database.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal with Duplicate Prevention */}
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
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Add New B2B Solar Customer
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  Includes automatic duplicate detection on Phone, WhatsApp, Email, and GSTIN
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {dupError && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '8px',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldAlert size={18} />
                  <span>{dupError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Solar Ltd"
                    value={newCust.companyName}
                    onChange={(e) => {
                      setNewCust({ ...newCust, companyName: e.target.value });
                      validateDuplicates('companyName', e.target.value);
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Customer Type
                  </label>
                  <select
                    value={newCust.customerType}
                    onChange={(e) => setNewCust({ ...newCust, customerType: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="EPC Contractor">EPC Contractor</option>
                    <option value="Independent Power Producer (IPP)">Independent Power Producer (IPP)</option>
                    <option value="Module & Structure Manufacturer">Module & Structure Manufacturer</option>
                    <option value="Rooftop Installer">Rooftop Solar Installer</option>
                    <option value="Distributor">Solar Distributor / Reseller</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    GST Number (15 digits)
                  </label>
                  <input
                    type="text"
                    placeholder="33AABCV1234F1Z5"
                    value={newCust.gstNumber}
                    onChange={(e) => {
                      setNewCust({ ...newCust, gstNumber: e.target.value });
                      validateDuplicates('gstNumber', e.target.value);
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Payment Terms
                  </label>
                  <select
                    value={newCust.paymentTerms}
                    onChange={(e) => setNewCust({ ...newCust, paymentTerms: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="100% Advance">100% Advance before dispatch</option>
                    <option value="50% Advance + 50% Dispatch">50% Advance + 50% Against Proforma</option>
                    <option value="Net 30 Days">Credit: Net 30 Days</option>
                    <option value="Net 45 Days">Credit: Net 45 Days</option>
                  </select>
                </div>
              </div>

              {/* Primary Contact Details */}
              <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>
                  Authorized Contact Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kannan"
                      value={newCust.primaryContact.name}
                      onChange={(e) => setNewCust({ ...newCust, primaryContact: { ...newCust.primaryContact, name: e.target.value } })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="Procurement Head"
                      value={newCust.primaryContact.designation}
                      onChange={(e) => setNewCust({ ...newCust, primaryContact: { ...newCust.primaryContact, designation: e.target.value } })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Phone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={newCust.primaryContact.phone}
                      onChange={(e) => {
                        setNewCust({ ...newCust, primaryContact: { ...newCust.primaryContact, phone: e.target.value } });
                        validateDuplicates('phone', e.target.value);
                      }}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="rajesh@company.com"
                      value={newCust.primaryContact.email}
                      onChange={(e) => {
                        setNewCust({ ...newCust, primaryContact: { ...newCust.primaryContact, email: e.target.value } });
                        validateDuplicates('email', e.target.value);
                      }}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
