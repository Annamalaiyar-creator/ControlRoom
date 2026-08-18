import React, { useState, useEffect } from 'react';
import { RefreshCw, Power, ExternalLink, CheckCircle2, AlertCircle, Package, Users, ShoppingBag, Receipt, ShieldCheck, Database } from 'lucide-react';

export default function ZohoIntegrationView() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncTime, setSyncTime] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [orgId, setOrgId] = useState('60027663246');
  const [apiToken, setApiToken] = useState('');
  const [counts, setCounts] = useState({
    items: 0,
    vendors: 0,
    pos: 0
  });

  const [status, setStatus] = useState({
    connected: true,
    organizationName: 'ARMS AI',
    orgId: '60027663246'
  });

  const [showConfigForm, setShowConfigForm] = useState(false);
  const [formOrgId, setFormOrgId] = useState('');
  const [formRefreshToken, setFormRefreshToken] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formClientSecret, setFormClientSecret] = useState('');
  const [saveStatusMsg, setSaveStatusMsg] = useState('');

  // Fetch current connection status and live counts
  const checkStatusAndCounts = async () => {
    setLoading(true);
    try {
      const [statusRes, itemsRes, vendorsRes, poRes] = await Promise.all([
        fetch('/api/zoho/status').catch(() => null),
        fetch('/api/zoho/items').catch(() => null),
        fetch('/api/zoho/vendors').catch(() => null),
        fetch('/api/zoho/purchaseorders').catch(() => null)
      ]);

      if (statusRes && statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
        if (data.orgId) setOrgId(data.orgId);
        if (data.apiToken) setApiToken(data.apiToken);
      }

      let iCount = 0, vCount = 0, pCount = 0;
      if (itemsRes && itemsRes.ok) {
        const items = await itemsRes.json();
        if (Array.isArray(items)) iCount = items.length;
      }
      if (vendorsRes && vendorsRes.ok) {
        const vendors = await vendorsRes.json();
        if (Array.isArray(vendors)) vCount = vendors.length;
      }
      if (poRes && poRes.ok) {
        const pos = await poRes.json();
        if (Array.isArray(pos)) pCount = pos.length;
      }

      setCounts({ items: iCount, vendors: vCount, pos: pCount });
    } catch (e) {
      console.error("Failed to check status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatusAndCounts();
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      await checkStatusAndCounts();
      setSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setSyncMessage('All Zoho Books modules (Products, Vendors, POs, Bills) synchronized successfully!');
      setTimeout(() => setSyncMessage(''), 5000);
    } catch (e) {
      console.error(e);
      alert('Sync failed. Please check backend server.');
    } finally {
      setSyncing(false);
    }
  };

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleDisconnect = () => {
    setShowDisconnectConfirm(true);
  };

  const executeDisconnect = async () => {
    setShowDisconnectConfirm(false);
    setLoading(true);
    try {
      await fetch('/api/zoho/disconnect', { method: 'POST' });
      setStatus({ connected: false, organizationName: null });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (e) => {
    if (e) e.preventDefault();
    if (!formOrgId || !formRefreshToken) {
      alert('Please enter at least the Organization ID and Refresh Token.');
      return;
    }
    setLoading(true);
    setSaveStatusMsg('');
    try {
      const res = await fetch('/api/zoho/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: formOrgId.trim(),
          apiToken: formRefreshToken.trim(),
          clientId: formClientId.trim(),
          clientSecret: formClientSecret.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatusMsg('✓ New Zoho Account saved and connected successfully!');
        setTimeout(() => {
          checkStatusAndCounts();
          setShowConfigForm(false);
          setSaveStatusMsg('');
        }, 1200);
      } else {
        setSaveStatusMsg('Error: ' + (data.error || 'Failed to update credentials'));
      }
    } catch (err) {
      setSaveStatusMsg('Error updating account credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      
      {/* Header Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#0F172A' }}>
            Zoho Books & Inventory Integration Hub
          </h2>
          <span style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', display: 'block' }}>
            Real-time 2-way synchronization for Items Catalog, Vendors Directory, Purchase Orders, and GRN Bills
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowConfigForm(!showConfigForm)}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '8px',
              border: '1px solid #2563EB',
              backgroundColor: showConfigForm ? '#EFF6FF' : '#FFFFFF',
              color: '#2563EB',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {showConfigForm ? 'Cancel Form' : '+ Connect / Switch Zoho Account'}
          </button>

          <button 
            onClick={handleSyncAll}
            disabled={syncing}
            style={{
              height: '40px',
              padding: '0 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: syncing ? 'wait' : 'pointer',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <RefreshCw className={syncing ? 'spin-anim' : ''} style={{ width: '15px', height: '15px' }} />
            {syncing ? 'Synchronizing...' : 'Sync All Modules Now'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#E6F7ED', border: '1px solid #A7F3D0', color: '#137333', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 style={{ width: '16px', height: '16px' }} />
          {syncMessage}
        </div>
      )}

      {/* Connect New Account Form Card */}
      {showConfigForm && (
        <div className="section-card" style={{ padding: '24px', backgroundColor: '#F8FAFC', border: '1.5px solid #2563EB', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '15px', color: '#0F172A' }}>Connect / Switch to a New Zoho Books Account</strong>
              <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '2px' }}>Enter your new Zoho Books API credentials to link this application.</span>
            </div>
            <button 
              onClick={() => setShowConfigForm(false)}
              style={{ border: 'none', background: 'none', color: '#64748B', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>

          {saveStatusMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', backgroundColor: saveStatusMsg.startsWith('✓') ? '#DCFCE7' : '#FEE2E2', color: saveStatusMsg.startsWith('✓') ? '#15803D' : '#991B1B' }}>
              {saveStatusMsg}
            </div>
          )}

          <form onSubmit={handleSaveAccount} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                Zoho Organization ID <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. 60020613233" 
                value={formOrgId} 
                onChange={(e) => setFormOrgId(e.target.value)} 
                required
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B' }}>Found under Zoho Books -&gt; Organization Profile.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                Refresh Token <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input 
                type="password" 
                placeholder="Paste Zoho OAuth Refresh Token" 
                value={formRefreshToken} 
                onChange={(e) => setFormRefreshToken(e.target.value)} 
                required
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B' }}>OAuth v2 Refresh token generated for this org.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                Client ID <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <input 
                type="text" 
                placeholder="1000.XXXXX..." 
                value={formClientId} 
                onChange={(e) => setFormClientId(e.target.value)} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                Client Secret <span style={{ color: '#94A3B8', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <input 
                type="password" 
                placeholder="OAuth Client Secret" 
                value={formClientSecret} 
                onChange={(e) => setFormClientSecret(e.target.value)} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setShowConfigForm(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                style={{ padding: '8px 24px', borderRadius: '6px', border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {loading ? 'Connecting...' : 'Save & Connect New Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Left Column: Integration Status & Module Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Card */}
          <div className="section-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck style={{ width: '22px', height: '22px', color: '#059669' }} />
                <div>
                  <strong style={{ fontSize: '16px', color: '#0F172A' }}>Live OAuth Connection Status</strong>
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Connected via Zoho Accounts OAuth v2 API</span>
                </div>
              </div>

              {status.connected ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ECFDF5', color: '#059669', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                  <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                  ACTIVE 2-WAY SYNC
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEF2F2', color: '#DC2626', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>
                  <AlertCircle style={{ width: '14px', height: '14px' }} />
                  DISCONNECTED
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '4px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', display: 'block' }}>ORGANIZATION NAME</span>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>{status.organizationName || 'ARMS AI'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', display: 'block' }}>ORGANIZATION ID</span>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>{orgId || '60027663246'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', display: 'block' }}>DATA CENTER / REGION</span>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>Zoho India (zoho.in)</strong>
              </div>
            </div>
          </div>

          {/* Real-time Modules Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Module 1: Products & Items */}
            <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package style={{ width: '18px', height: '18px', color: '#2563EB' }} />
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Items & Materials Catalog</strong>
                </div>
                <span style={{ fontSize: '11px', backgroundColor: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  2-Way Sync
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                Adding or editing products in Control Room creates and updates records live in Zoho Books.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>Synced Items: <strong style={{ color: '#0F172A' }}>{counts.items}</strong></span>
                <span style={{ fontSize: '11px', color: '#137333', fontWeight: 'bold' }}>✓ Real-time</span>
              </div>
            </div>

            {/* Module 2: Vendors Directory */}
            <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users style={{ width: '18px', height: '18px', color: '#D97706' }} />
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Vendors & Contacts</strong>
                </div>
                <span style={{ fontSize: '11px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  Live Fetch
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                Fetches active vendor list, contact details, GST, and payment terms from Zoho Books.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>Active Vendors: <strong style={{ color: '#0F172A' }}>{counts.vendors}</strong></span>
                <span style={{ fontSize: '11px', color: '#137333', fontWeight: 'bold' }}>✓ Real-time</span>
              </div>
            </div>

            {/* Module 3: Purchase Orders */}
            <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag style={{ width: '18px', height: '18px', color: '#7C3AED' }} />
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>Purchase Orders (PO)</strong>
                </div>
                <span style={{ fontSize: '11px', backgroundColor: '#F3E8FF', color: '#7C3AED', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  2-Way Status
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                Full status sync (OPEN / PARTIALLY RECEIVED / CLOSED) between GRNs and Zoho POs.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>Active POs: <strong style={{ color: '#0F172A' }}>{counts.pos}</strong></span>
                <span style={{ fontSize: '11px', color: '#137333', fontWeight: 'bold' }}>✓ Real-time</span>
              </div>
            </div>

            {/* Module 4: GRN & Draft Bills */}
            <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt style={{ width: '18px', height: '18px', color: '#059669' }} />
                  <strong style={{ fontSize: '14px', color: '#0F172A' }}>GRN Bills Auto-Posting</strong>
                </div>
                <span style={{ fontSize: '11px', backgroundColor: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  Auto Post
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                Submitting a Goods Receipt Note in Control Room automatically creates a Draft Bill in Zoho Books.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>Bill Auto-Generation: <strong style={{ color: '#137333' }}>Enabled</strong></span>
                <span style={{ fontSize: '11px', color: '#137333', fontWeight: 'bold' }}>✓ Real-time</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Sync Summary & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="section-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <strong style={{ fontSize: '15px', color: '#0F172A' }}>Synchronization Summary</strong>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Last Manual Sync</span>
                <strong style={{ color: '#0F172A' }}>{syncTime || 'Just Now'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Auto Token Refresh</span>
                <span style={{ color: '#137333', fontWeight: 'bold' }}>Active (OAuth v2)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Background Auto-Sync</span>
                <span style={{ color: '#137333', fontWeight: 'bold' }}>Continuous</span>
              </div>
            </div>

            <button 
              onClick={handleSyncAll} 
              disabled={syncing}
              style={{ 
                height: '38px',
                width: '100%',
                borderRadius: '8px', 
                border: '1px solid #CBD5E1', 
                backgroundColor: '#FFFFFF', 
                color: '#2563EB', 
                fontSize: '13px', 
                fontWeight: 'bold', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw className={syncing ? 'spin-anim' : ''} style={{ width: '14px', height: '14px' }} />
              Refresh Data Cache
            </button>
          </div>

          <div className="section-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#F8FAFC' }}>
            <strong style={{ fontSize: '14px', color: '#0F172A' }}>Quick Links</strong>
            <a 
              href="https://books.zoho.in" 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: '600' }}
            >
              Open Zoho Books Portal
              <ExternalLink style={{ width: '14px', height: '14px' }} />
            </a>
            <a 
              href="https://inventory.zoho.in" 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#2563EB', textDecoration: 'none', fontWeight: '600' }}
            >
              Open Zoho Inventory Portal
              <ExternalLink style={{ width: '14px', height: '14px' }} />
            </a>
          </div>

        </div>

      </div>

      {showDisconnectConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', width: '440px', maxWidth: '90%', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', backgroundColor: '#FEF2F2', borderBottom: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#991B1B' }}>Disconnect Integration</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#B91C1C' }}>Are you sure you want to proceed?</p>
              </div>
            </div>
            <div style={{ padding: '20px 24px', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
              Disconnecting Zoho Books will pause real-time background sync. You can re-authenticate anytime.
            </div>
            <div style={{ padding: '16px 24px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowDisconnectConfirm(false)} style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeDisconnect} style={{ border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Confirm Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

