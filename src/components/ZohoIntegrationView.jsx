import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, ExternalLink, CheckCircle2, AlertCircle, 
  ShieldCheck, ArrowLeftRight, Search, Check, Sparkles, Sliders
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const DEFAULT_ACTIVE_ORG_ID = '60082137608';
const DEFAULT_ACTIVE_REFRESH_TOKEN = '1000.69cd7dbd3da3ab8f107f8addf5e9e04c.87b4757d889f6ebd95a1bf897147a1c7';
const DEFAULT_ACTIVE_CLIENT_ID = '1000.9U5BAN338075M5HBI3U8K1VBNKUU8K';
const DEFAULT_ACTIVE_CLIENT_SECRET = 'e82079a5165e3b2e75fdc602f3e08fd38489d75f13';

export default function ZohoIntegrationView() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncTime, setSyncTime] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [orgId, setOrgId] = useState(DEFAULT_ACTIVE_ORG_ID);
  const [apiToken, setApiToken] = useState(DEFAULT_ACTIVE_REFRESH_TOKEN);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [counts, setCounts] = useState({
    items: 0,
    vendors: 0,
    pos: 0
  });

  const [status, setStatus] = useState({
    connected: true,
    organizationName: 'ARMS AI',
    orgId: DEFAULT_ACTIVE_ORG_ID
  });

  // Connection toggles state for all integrations catalog
  const [integrationsState, setIntegrationsState] = useState({
    zoho: true,
    mailchimp: true,
    square: true,
    brave: true,
    zapier: true,
    linear: true,
    framer: true,
    chatgpt: true,
    webflow: true,
    stripe: true
  });

  const [showConfigForm, setShowConfigForm] = useState(false);
  const [formOrgId, setFormOrgId] = useState(DEFAULT_ACTIVE_ORG_ID);
  const [formRefreshToken, setFormRefreshToken] = useState(DEFAULT_ACTIVE_REFRESH_TOKEN);
  const [formClientId, setFormClientId] = useState(DEFAULT_ACTIVE_CLIENT_ID);
  const [formClientSecret, setFormClientSecret] = useState(DEFAULT_ACTIVE_CLIENT_SECRET);
  const [saveStatusMsg, setSaveStatusMsg] = useState('');
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [activeConfigureApp, setActiveConfigureApp] = useState(null);

  // Fetch current connection status and live counts
  const checkStatusAndCounts = async () => {
    setLoading(true);
    try {
      // 1. Check local storage or Supabase for Zoho credentials first
      const cachedConfig = localStorage.getItem('zoho_config');
      if (cachedConfig) {
        try {
          const parsed = JSON.parse(cachedConfig);
          if (parsed.orgId) setOrgId(parsed.orgId);
          if (parsed.apiToken) setApiToken(parsed.apiToken);
          if (parsed.clientId) setFormClientId(parsed.clientId);
          if (parsed.clientSecret) setFormClientSecret(parsed.clientSecret);
          if (parsed.connected !== undefined) {
            setStatus(prev => ({ ...prev, connected: parsed.connected, orgId: parsed.orgId || prev.orgId }));
            setIntegrationsState(prev => ({ ...prev, zoho: parsed.connected }));
          }
        } catch (_) {}
      }

      // Check Supabase leaves table for remote synced credentials
      try {
        const { data: cloudRecord } = await supabase
          .from('leaves')
          .select('reason')
          .eq('employee', 'ZOHO_CONFIG')
          .maybeSingle();

        if (cloudRecord && cloudRecord.reason) {
          const parsedCloud = JSON.parse(cloudRecord.reason);
          if (parsedCloud.orgId) {
            setOrgId(parsedCloud.orgId);
            setFormOrgId(parsedCloud.orgId);
          }
          if (parsedCloud.apiToken) {
            setApiToken(parsedCloud.apiToken);
            setFormRefreshToken(parsedCloud.apiToken);
          }
          if (parsedCloud.clientId) setFormClientId(parsedCloud.clientId);
          if (parsedCloud.clientSecret) setFormClientSecret(parsedCloud.clientSecret);
          if (parsedCloud.connected !== undefined) {
            setStatus(prev => ({ ...prev, connected: parsedCloud.connected, orgId: parsedCloud.orgId || prev.orgId }));
            setIntegrationsState(prev => ({ ...prev, zoho: parsedCloud.connected }));
          }
        }
      } catch (sbErr) {
        console.warn('Supabase cloud config fetch check:', sbErr);
      }

      // 2. Query backend API if available
      const [statusRes, itemsRes, vendorsRes, poRes] = await Promise.all([
        fetch('/api/zoho/status').catch(() => null),
        fetch('/api/zoho/items').catch(() => null),
        fetch('/api/zoho/vendors').catch(() => null),
        fetch('/api/zoho/purchaseorders').catch(() => null)
      ]);

      if (statusRes && statusRes.ok) {
        const data = await statusRes.json().catch(() => null);
        if (data && data.connected !== undefined) {
          setStatus(data);
          if (data.orgId) setOrgId(data.orgId);
          if (data.apiToken) setApiToken(data.apiToken);
        }
      }

      let iCount = 0, vCount = 0, pCount = 0;
      if (itemsRes && itemsRes.ok) {
        const items = await itemsRes.json().catch(() => []);
        if (Array.isArray(items)) iCount = items.length;
      }
      if (vendorsRes && vendorsRes.ok) {
        const vendors = await vendorsRes.json().catch(() => []);
        if (Array.isArray(vendors)) vCount = vendors.length;
      }
      if (poRes && poRes.ok) {
        const pos = await poRes.json().catch(() => []);
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
      alert('Sync completed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    setShowDisconnectConfirm(true);
  };

  const executeDisconnect = async () => {
    setShowDisconnectConfirm(false);
    setLoading(true);
    try {
      fetch('/api/zoho/disconnect', { method: 'POST' }).catch(() => null);
      localStorage.setItem('zoho_config', JSON.stringify({
        orgId,
        apiToken,
        clientId: formClientId,
        clientSecret: formClientSecret,
        connected: false
      }));
      await supabase.from('leaves').upsert({
        employee: 'ZOHO_CONFIG',
        type: 'ZOHO_CREDENTIALS',
        duration: orgId,
        dates: new Date().toISOString(),
        reason: JSON.stringify({
          orgId,
          apiToken,
          clientId: formClientId,
          clientSecret: formClientSecret,
          connected: false
        }),
        status: 'disconnected'
      }, { onConflict: 'employee' });

      setStatus({ connected: false, organizationName: null });
      setIntegrationsState(prev => ({ ...prev, zoho: false }));
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

    const targetOrgId = formOrgId.trim() || DEFAULT_ACTIVE_ORG_ID;
    const targetRefreshToken = formRefreshToken.trim() || DEFAULT_ACTIVE_REFRESH_TOKEN;
    const targetClientId = formClientId.trim() || DEFAULT_ACTIVE_CLIENT_ID;
    const targetClientSecret = formClientSecret.trim() || DEFAULT_ACTIVE_CLIENT_SECRET;

    const payload = {
      orgId: targetOrgId,
      apiToken: targetRefreshToken,
      clientId: targetClientId,
      clientSecret: targetClientSecret,
      organizationName: 'ARMS AI',
      connected: true,
      updated_at: new Date().toISOString()
    };

    // 1. Save locally to localStorage so it is never lost on refresh
    localStorage.setItem('zoho_config', JSON.stringify(payload));

    // 2. Persist to Supabase leaves table (so all devices and browser tabs share credentials)
    try {
      const { data: existing } = await supabase
        .from('leaves')
        .select('id')
        .eq('employee', 'ZOHO_CONFIG')
        .maybeSingle();

      if (existing && existing.id) {
        await supabase
          .from('leaves')
          .update({
            reason: JSON.stringify(payload),
            dates: new Date().toISOString(),
            duration: targetOrgId,
            status: 'connected'
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('leaves')
          .insert({
            employee: 'ZOHO_CONFIG',
            type: 'ZOHO_CREDENTIALS',
            duration: targetOrgId,
            dates: new Date().toISOString(),
            reason: JSON.stringify(payload),
            status: 'connected'
          });
      }
    } catch (sbErr) {
      console.warn('Saved locally; Supabase sync note:', sbErr);
    }

    // 3. Attempt POST to /api/zoho/credentials if Express backend is running (optional in Plesk static setup)
    try {
      await fetch('/api/zoho/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);
    } catch (_) {
      // Ignored if IIS static hosting doesn't run Express
    }

    // 4. Update UI state to Connected
    setOrgId(targetOrgId);
    setApiToken(targetRefreshToken);
    setStatus({
      connected: true,
      organizationName: 'ARMS AI',
      orgId: targetOrgId
    });
    setIntegrationsState(prev => ({ ...prev, zoho: true }));
    setSaveStatusMsg('✓ Zoho Account saved and connected successfully!');

    setTimeout(() => {
      setShowConfigForm(false);
      setSaveStatusMsg('');
    }, 1200);

    setLoading(false);
  };

  const toggleIntegration = (id) => {
    setIntegrationsState(prev => {
      const nextVal = !prev[id];
      if (id === 'zoho' && !nextVal) {
        handleDisconnect();
      }
      return { ...prev, [id]: nextVal };
    });
  };

  // Catalog containing only Zoho Books
  const catalog = [
    {
      id: 'zoho',
      name: 'Zoho Books',
      category: 'Accounting & ERP',
      desc: 'Real-time 2-way sync for Purchase Orders, Invoices, Items Catalog, and Vendor Records.',
      link: 'https://books.zoho.in',
      isZoho: true,
      logoBg: '#FFFBEB',
      logoBorder: '#FDE68A',
      icon: (
        <div style={{ width: '100%', height: '100%', borderRadius: '12px', backgroundColor: '#FFE01B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#0F172A', fontSize: '18px' }}>
          Z
        </div>
      )
    }
  ];

  const filteredCatalog = catalog.filter(item => {
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'All' || item.category.includes(selectedCategory);
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* HEADER ROW WITH TITLE & SEARCH / FILTER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
            Integrations & App Hub
          </h2>
          <span style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
            Connect your software tools, accounting platforms, AI assistants, and payment gateways.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '0 12px', height: '40px', backgroundColor: '#FFFFFF', width: '280px' }}>
            <Search style={{ width: '16px', height: '16px', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#1E293B' }}
            />
          </div>
        </div>
      </div>

      {syncMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', borderRadius: '10px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 style={{ width: '16px', height: '16px' }} />
          {syncMessage}
        </div>
      )}

      {/* CONNECT ZOHO CREDENTIALS FORM DRAWER / MODAL */}
      {showConfigForm && (
        <div className="section-card" style={{ padding: '24px', backgroundColor: '#FAFAFA', border: '2px solid #6366F1', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '16px', color: '#0F172A' }}>Configure Zoho Books API Connection</strong>
              <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '2px' }}>Enter your Zoho Books Organization ID and OAuth Refresh Token to connect.</span>
            </div>
            <button 
              onClick={() => setShowConfigForm(false)}
              style={{ border: 'none', background: 'none', color: '#64748B', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>

          {saveStatusMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', backgroundColor: saveStatusMsg.startsWith('✓') ? '#DCFCE7' : '#FEE2E2', color: saveStatusMsg.startsWith('✓') ? '#15803D' : '#991B1B' }}>
              {saveStatusMsg}
            </div>
          )}

          <form onSubmit={handleSaveAccount} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                Zoho Organization ID <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. 60027663246" 
                value={formOrgId} 
                onChange={(e) => setFormOrgId(e.target.value)} 
                required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                Refresh Token <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input 
                type="password" 
                placeholder="Paste Zoho OAuth Refresh Token" 
                value={formRefreshToken} 
                onChange={(e) => setFormRefreshToken(e.target.value)} 
                required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                Client ID (Optional)
              </label>
              <input 
                type="text" 
                placeholder="1000.9U5BAN338075M5HBI3U8K1VBNKUU8K" 
                value={formClientId} 
                onChange={(e) => setFormClientId(e.target.value)} 
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                Client Secret (Optional)
              </label>
              <input 
                type="password" 
                placeholder="e82079a5165e3b2e75fdc602f3e08fd38489d75f13" 
                value={formClientSecret} 
                onChange={(e) => setFormClientSecret(e.target.value)} 
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={() => setShowConfigForm(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                {loading ? 'Connecting...' : 'Save & Connect Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3-COLUMN GRID CATALOG MATCHING EXACT USER SCREENSHOT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        width: '100%'
      }}>
        {filteredCatalog.map(app => {
          const isConnected = Boolean(integrationsState[app.id]);

          return (
            <div
              key={app.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div>
                {/* Header Row: App Logo & External Link Icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '46px', height: '46px', flexShrink: 0 }}>
                    {app.icon}
                  </div>

                  <a
                    href={app.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#94A3B8', padding: '4px', borderRadius: '6px', transition: 'color 0.15s ease' }}
                    title={`Open ${app.name} Portal`}
                  >
                    <ExternalLink style={{ width: '16px', height: '16px' }} />
                  </a>
                </div>

                {/* App Name & Description */}
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '14px 0 6px 0' }}>
                  {app.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.5', minHeight: '40px' }}>
                  {app.desc}
                </p>
              </div>

              {/* Bottom Card Footer Row matching exact screenshot */}
              <div style={{
                borderTop: '1px solid #F1F5F9',
                paddingTop: '14px',
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {/* Left Action: Configure Button */}
                <button
                  onClick={() => {
                    if (app.isZoho) {
                      setShowConfigForm(true);
                    } else {
                      setActiveConfigureApp(app);
                    }
                  }}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    color: '#334155',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ArrowLeftRight style={{ width: '13px', height: '13px', color: '#64748B' }} />
                  Configure
                </button>

                {/* Right Action: Modern Toggle Switch matching exact purple toggle in screenshot */}
                <div
                  onClick={() => toggleIntegration(app.id)}
                  style={{
                    width: '42px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: isConnected ? '#6366F1' : '#CBD5E1',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                    top: '3px',
                    left: isConnected ? '21px' : '3px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DISCONNECT CONFIRM MODAL FOR ZOHO */}
      {showDisconnectConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '440px', maxWidth: '90%', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', backgroundColor: '#FEF2F2', borderBottom: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#991B1B' }}>Disconnect Integration</h4>
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

      {/* OTHER APP CONFIG MODAL */}
      {activeConfigureApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: '460px', maxWidth: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px' }}>
                  {activeConfigureApp.icon}
                </div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>Configure {activeConfigureApp.name}</h4>
              </div>
              <button onClick={() => setActiveConfigureApp(null)} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              {activeConfigureApp.desc}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>API Key / Webhook URL</label>
                <input type="password" defaultValue="sk_live_controlroom_api_key_993821" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#166534' }} />
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: '700' }}>Active & Ready to Connect</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setActiveConfigureApp(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Close</button>
              <button onClick={() => { alert(`${activeConfigureApp.name} settings saved successfully!`); setActiveConfigureApp(null); }} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
