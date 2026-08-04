import React, { useState, useEffect } from 'react';
import { RefreshCw, Power, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ZohoIntegrationView() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncTime, setSyncTime] = useState(null);
  const [orgId, setOrgId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [status, setStatus] = useState({
    connected: false,
    organizationName: null
  });

  // Fetch current status of connection
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/zoho/status');
      const data = await res.json();
      setStatus(data);
      if (data.orgId) setOrgId(data.orgId);
      if (data.apiToken) setApiToken(data.apiToken);
    } catch (e) {
      console.error("Failed to check status", e);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!orgId.trim() || !apiToken.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/zoho/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, apiToken })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ connected: true, organizationName: data.organizationName });
        alert('Zoho Integration configured successfully.');
      } else {
        alert(data.error || 'Configuration failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetch('/api/zoho/disconnect', { method: 'POST' });
      setStatus({ connected: false, organizationName: null });
      setOrgId('');
      setApiToken('');
      alert('Zoho Integration disconnected.');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/zoho/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncTime(new Date().toLocaleTimeString());
      } else {
        alert(data.error || 'Sync failed.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Zoho Books & Inventory Integration</h2>
        <span style={{ fontSize: '12px', color: '#64748b' }}>Configure authorization credentials and synchronize contacts, bills, and purchase orders</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Connection Panel */}
        <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '15px', color: '#1e293b' }}>Integration Status</strong>
            {status.connected ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                Active Connection
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                <AlertCircle style={{ width: '14px', height: '14px' }} />
                Disconnected
              </span>
            )}
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
            Link Zoho Books and Zoho Inventory using your Organization ID and API Token credentials to enable real-time updates.
          </p>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {status.connected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Linked Organization: <strong style={{ color: '#0f172a' }}>{status.organizationName}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Org ID: <strong style={{ color: '#0f172a' }}>{orgId}</strong>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={handleDisconnect} 
                    disabled={loading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <Power style={{ width: '14px', height: '14px' }} />
                    Disconnect Application
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '400px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Organization ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 60001234567" 
                    value={orgId} 
                    onChange={(e) => setOrgId(e.target.value)} 
                    style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>API Authtoken / Access Token</label>
                  <input 
                    type="password" 
                    placeholder="Enter your Zoho API key / token" 
                    value={apiToken} 
                    onChange={(e) => setApiToken(e.target.value)} 
                    style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px' }} 
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}
                >
                  <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                  {loading ? 'Saving...' : 'Save & Connect'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sync panel */}
        <div className="section-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <strong style={{ fontSize: '14px', color: '#1e293b' }}>Manual Synchronizer</strong>
          
          <button 
            onClick={handleSync} 
            disabled={!status.connected || syncing}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              backgroundColor: status.connected ? '#f1f5f9' : '#f8fafc', 
              color: status.connected ? '#2563eb' : '#94a3b8', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              padding: '10px', 
              fontSize: '13px', 
              fontWeight: 'bold', 
              cursor: status.connected ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            <RefreshCw className={syncing ? 'spin-anim' : ''} style={{ width: '14px', height: '14px' }} />
            {syncing ? 'Syncing...' : 'Sync Data Now'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Last Synced</span>
              <strong style={{ color: '#334155' }}>{syncTime || 'Never'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Automatic Sync</span>
              <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Enabled (hourly)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
