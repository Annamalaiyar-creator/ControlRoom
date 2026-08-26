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
import { ShoppingCart, Factory, Shield, User, ArrowRight, Receipt } from 'lucide-react';
import { useEffect } from 'react';

function App() {
  // Default sidebar collapsed to TRUE (closed/inside by default on loading)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Authentication & Role State with localStorage Persistence Across Page Refresh
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('controlroom_is_authenticated') === 'true';
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('controlroom_user_role') || 'Procurement Admin';
  });

  // Active Tab State with localStorage Persistence (Stays on same page upon refresh)
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('controlroom_active_tab');
    if (savedTab) return savedTab;
    return 'Dashboard';
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
    localStorage.removeItem('controlroom_is_authenticated');
    localStorage.removeItem('controlroom_active_tab');
    setIsAuthenticated(false);
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

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={(role) => handleRoleSwitch(role)} />;
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
          ) : activeTab === 'Dashboard' || activeTab === 'Executive Dashboard' || activeTab === 'Procurement Dashboard' || activeTab === 'Finance & Accounts' || activeTab === 'Sales & CRM' || activeTab === 'Design & BOM Center' ? (
            <DashboardFullReference userRole={userRole} />
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
          ) : (
            <OtherViews 
              activeTab={activeTab} 
              onChangeTab={handleTabChange} 
              userRole={userRole} 
              convertingPiData={convertingPiData}
              onClearConvertingPiData={() => setConvertingPiData(null)}
            />
          )}
        </div>
      </main>

      {/* Role-Based Login Screen Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            width: '460px',
            maxWidth: '92%',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontWeight: 'bold',
                fontSize: '20px'
              }}>
                CR
              </div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#0F172A' }}>ControlRoom Portal Portal Login</h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                Select your administrative portal to sign in
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  handleRoleSwitch('Procurement Admin');
                  setShowLoginModal(false);
                }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: userRole === 'Procurement Admin' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: userRole === 'Procurement Admin' ? '#EFF6FF' : '#F8FAFC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#DBEAFE', color: '#2563EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <ShoppingCart style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>Procurement Admin Portal</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>POs, Vendors, GRN, Invoices & Zoho Books</div>
                </div>
                <ArrowRight style={{ width: '16px', height: '16px', color: '#2563EB' }} />
              </button>

              <button
                onClick={() => {
                  handleRoleSwitch('Sales Head');
                  setShowLoginModal(false);
                }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: userRole === 'Sales Head' ? '2px solid #059669' : '1px solid #E2E8F0',
                  backgroundColor: userRole === 'Sales Head' ? '#ECFDF5' : '#F8FAFC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#D1FAE5', color: '#059669',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Receipt style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>BOM & Sales Order Portal</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Create & Manage BOMs, Customer Management</div>
                </div>
                <ArrowRight style={{ width: '16px', height: '16px', color: '#059669' }} />
              </button>

              <button
                onClick={() => {
                  handleRoleSwitch('Accounts Head');
                  setShowLoginModal(false);
                }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: userRole === 'Accounts Head' ? '2px solid #D97706' : '1px solid #E2E8F0',
                  backgroundColor: userRole === 'Accounts Head' ? '#FFFBEB' : '#F8FAFC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Receipt style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>Accounts & Invoice Portal</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Invoice Ledger, Payments & Financial Reports</div>
                </div>
                <ArrowRight style={{ width: '16px', height: '16px', color: '#D97706' }} />
              </button>

              <button
                onClick={() => {
                  handleRoleSwitch('Production Admin');
                  setShowLoginModal(false);
                }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: userRole === 'Production Admin' ? '2px solid #9333EA' : '1px solid #E2E8F0',
                  backgroundColor: userRole === 'Production Admin' ? '#F3E8FF' : '#F8FAFC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F3E8FF', color: '#9333EA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Factory style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>Production Admin Portal</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Work Orders, Job Cards, MRNs & Line Output</div>
                </div>
                <ArrowRight style={{ width: '16px', height: '16px', color: '#9333EA' }} />
              </button>
            </div>

            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
