import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KPIGrid from './components/KPIGrid';
import POTrendChart from './components/POTrendChart';
import POStatusOverview from './components/POStatusOverview';
import RecentPurchaseOrders from './components/RecentPurchaseOrders';
import SidebarRightColumn from './components/SidebarRightColumn';
import MaterialReorderAlerts from './components/MaterialReorderAlerts';
import PerformaInvoiceView from './components/PerformaInvoiceView';
import PurchaseOrdersView from './components/PurchaseOrdersView';
import OtherViews from './components/OtherViews';
import ZohoIntegrationView from './components/ZohoIntegrationView';
import DashboardFullReference from './components/DashboardFullReference';
import MaterialCalculationEngine from './components/MaterialCalculationEngine';
import InventoryAutoConversion from './components/InventoryAutoConversion';
import CreateWorkOrderPage from './components/CreateWorkOrderPage';

import ProductionAdminView from './components/ProductionAdminView';
import SalesExecutiveDashboardView from './components/views/SalesExecutiveDashboardView';
import LoginScreen from './components/LoginScreen';
import DeveloperPortalView from './components/DeveloperPortalView';
import NotificationToast from './components/NotificationToast';
import { ShoppingCart, Factory, Shield, User, ArrowRight, Receipt, RefreshCw } from 'lucide-react';
import { useEffect, Component } from 'react';
import { heartbeatActiveSession, registerActiveSession, revokeSession } from './services/sessionService';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App render error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          color: '#0F172A',
          fontFamily: "'DM Sans', -apple-system, sans-serif",
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Dashboard Render Recovery</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: '1.5' }}>
              The dashboard encountered a temporary loading issue. Click below to refresh your dashboard session.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    this.setState({ hasError: false });
                    localStorage.removeItem('controlroom_active_tab');
                    window.location.reload();
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0E7490',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={14} /> Reset to Dashboard
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('controlroom_is_authenticated');
                    localStorage.removeItem('controlroom_user_role');
                    localStorage.removeItem('controlroom_active_tab');
                    window.location.reload();
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Sign In Again
                </button>
              </div>

              {this.state.error && (
                <details style={{ marginTop: '14px', textAlign: 'left', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px', color: '#64748B' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: '700', color: '#DC2626' }}>View Error Diagnostic Info</summary>
                  <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#991B1B' }}>
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Default sidebar collapsed to TRUE (closed/inside by default on loading)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [toastAlert, setToastAlert] = useState(null);

  const showCustomAlert = (msg, title, type = 'info') => {
    setToastAlert({ message: msg, title, type });
  };

  // Authentication & Role State (Strict authentication guard - defaults to FALSE unless logged in)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const val = localStorage.getItem('controlroom_is_authenticated');
    return val === 'true';
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('controlroom_user_role') || '';
  });

  // Active Tab State (Restores current active tab on page refresh)
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('controlroom_active_tab') || 'Dashboard';
  });

  const [targetPoNo, setTargetPoNo] = useState(null);
  const [convertingPiData, setConvertingPiData] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleRoleSwitch = (newRole) => {
    setUserRole(newRole);
    localStorage.setItem('controlroom_user_role', newRole);
    localStorage.setItem('controlroom_is_authenticated', 'true');
    setIsAuthenticated(true);
    const defaultTab = 'Dashboard';
    setActiveTab(defaultTab);
    localStorage.setItem('controlroom_active_tab', defaultTab);
  };

  const handleSignOut = () => {
    try {
      const sesId = localStorage.getItem('controlroom_device_session_id');
      if (sesId) {
        revokeSession(sesId);
      }
    } catch (e) {}
    localStorage.removeItem('controlroom_is_authenticated');
    localStorage.removeItem('controlroom_user_role');
    localStorage.removeItem('controlroom_logged_user');
    localStorage.removeItem('controlroom_logged_user_name');
    localStorage.removeItem('controlroom_logged_emp_id');
    localStorage.removeItem('controlroom_device_session_id');
    localStorage.removeItem('controlroom_session_start_time');
    localStorage.removeItem('controlroom_active_tab');
    setIsAuthenticated(false);
    setActiveTab('Dashboard');
    setShowLoginModal(false);
  };

  const handleTabChange = (tab, targetPo = null) => {
    if (targetPo) {
      setTargetPoNo(targetPo);
    }
    setActiveTab(tab);
    localStorage.setItem('controlroom_active_tab', tab);
  };

  const toggleSidebar = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem('controlroom_sidebar_collapsed', String(nextState));
  };

  // Heartbeat & session verification interval (checks every 25 seconds)
  useEffect(() => {
    if (isAuthenticated) {
      const email = localStorage.getItem('controlroom_logged_user');
      const empCode = localStorage.getItem('controlroom_logged_emp_id');
      const name = localStorage.getItem('controlroom_logged_user_name');
      const role = localStorage.getItem('controlroom_user_role');
      if (email) {
        registerActiveSession(email, empCode, name, role);
      }

      heartbeatActiveSession();
      const interval = setInterval(() => {
        heartbeatActiveSession();
      }, 25000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [poRes, itemsRes] = await Promise.all([
          fetch('/api/zoho/purchaseorders'),
          fetch('/api/zoho/items')
        ]);
        
        if (poRes.ok) {
          const poData = await poRes.json();
          setPurchaseOrders(poData || []);
        }
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setItemsList(itemsData || []);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (!isAuthenticated || !userRole) {
    return <LoginScreen onLoginSuccess={(role) => handleRoleSwitch(role)} />;
  }

  // Developer / Technical Admin Portal Dedicated Fullscreen Console
  const isDevRole = userRole === 'Technical Administrator' || userRole === 'Developer' || (userRole || '').startsWith('TA') || activeTab === 'Developer Console' || activeTab === 'Developer Portal';
  
  if (isDevRole) {
    return (
      <>
        <DeveloperPortalView 
          userRole={userRole} 
          onSignOut={handleSignOut} 
          showCustomAlert={showCustomAlert} 
        />
        {toastAlert && (
          <NotificationToast 
            alert={toastAlert} 
            onClose={() => setToastAlert(null)} 
          />
        )}
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
        activeTab={activeTab} 
        onChangeTab={handleTabChange}
        userRole={userRole} 
      />

      {/* Main View Wrapper */}
      <main className="main-wrapper">
        {/* Top Header Card */}
        <Header 
          activeTab={activeTab} 
          userRole={userRole}
          onSwitchRole={handleRoleSwitch}
          onOpenLoginModal={handleSignOut}
          onSelectTab={handleTabChange}
        />

        {/* Scrollable Center Content Pane */}
        <div className="content-pane procurement-layout">
          {(activeTab === 'Dashboard' || activeTab === 'Production Dashboard' || activeTab === 'Dispatch Dashboard' || activeTab === 'Supervisor Dashboard' || activeTab === 'Operator Workspace' || activeTab === 'Floor Employee') && (userRole.includes('Production') || userRole === 'Dispatch Head' || userRole === 'Floor Employee' || userRole === 'Machine Operator' || userRole === 'Production Head') ? (
            <ProductionAdminView activeTab={activeTab} userRole={userRole} />
          ) : (activeTab === 'Performa Invoice' || activeTab === 'Proforma Invoice') ? (
            <PerformaInvoiceView 
              userRole={userRole}
              onConvertToBom={(piData) => {
                setConvertingPiData(piData);
                handleTabChange('Sales BOM');
              }} 
            />
          ) : activeTab === 'Purchase Orders' ? (
            <PurchaseOrdersView userRole={userRole} targetPoNo={targetPoNo} clearTargetPo={() => setTargetPoNo(null)} />
          ) : activeTab === 'Zoho Integration' ? (
            <ZohoIntegrationView />
          ) : activeTab === 'Material Calculation Engine' ? (
            <MaterialCalculationEngine onBack={() => handleTabChange('BOM')} />
          ) : (activeTab === 'Inventory Stock Conversion' || activeTab === 'Enter Coil Purchase (in Ton)' || activeTab === 'Inventory - (Auto Conversion)') ? (
            <InventoryAutoConversion />
          ) : (activeTab !== 'Dashboard' && activeTab !== 'Executive Dashboard' && activeTab !== 'Procurement Dashboard' && activeTab !== 'Finance & Accounts' && activeTab !== 'Sales & CRM' && activeTab !== 'Design & BOM Center') ? (
            <OtherViews 
              activeTab={activeTab} 
              onChangeTab={handleTabChange} 
              userRole={userRole} 
              convertingPiData={convertingPiData}
              onClearConvertingPiData={() => setConvertingPiData(null)}
            />
          ) : (activeTab === 'Dashboard' && (userRole === 'Sales Executive' || userRole === 'Sales Head')) ? (
            <SalesExecutiveDashboardView userRole={userRole} onNavigateTab={handleTabChange} />
          ) : (
            <DashboardFullReference userRole={userRole} />
          )}
        </div>
      </main>

      {/* Role-Based Login Screen Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#F5F5FA',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '24px',
                zIndex: 1000000,
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: '900',
                color: '#64748B',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              title="Close Portal Switcher"
            >
              ✕
            </button>
            <LoginScreen 
              onLoginSuccess={(role) => {
                handleRoleSwitch(role);
                setShowLoginModal(false);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppRoot() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
