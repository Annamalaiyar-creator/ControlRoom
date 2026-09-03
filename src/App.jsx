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
import LoginScreen from './components/LoginScreen';
import DeveloperPortalView from './components/DeveloperPortalView';
import NotificationToast from './components/NotificationToast';
import { ShoppingCart, Factory, Shield, User, ArrowRight, Receipt } from 'lucide-react';
import { useEffect } from 'react';
import { heartbeatActiveSession, registerActiveSession, revokeSession } from './services/sessionService';

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
            <PurchaseOrdersView targetPoNo={targetPoNo} clearTargetPo={() => setTargetPoNo(null)} />
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

export default App;
