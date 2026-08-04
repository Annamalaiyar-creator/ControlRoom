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

import { useEffect } from 'react';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const poRes = await fetch('/api/zoho/purchaseorders');
        if (poRes.ok) {
          const poData = await poRes.json();
          setPurchaseOrders(poData || []);
        }
      } catch (err) {
        console.error("Failed to fetch POs for dashboard:", err);
      }

      try {
        const itemsRes = await fetch('/api/zoho/items');
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setItemsList(itemsData || []);
        }
      } catch (err) {
        console.error("Failed to fetch items for dashboard:", err);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
      />

      {/* Main View Wrapper */}
      <main className="main-wrapper">
        {/* Top Header Card */}
        <Header activeTab={activeTab} />

        {/* Scrollable Center Content Pane */}
        <div className="content-pane procurement-layout">
          {activeTab === 'Dashboard' ? (
            <>
              {/* Row 1: KPI Cards */}
              <KPIGrid purchaseOrders={purchaseOrders} items={itemsList} />

              {/* Row 2: Charts and Spend Categories */}
              <div className="dashboard-grid-3">
                <POTrendChart sidebarCollapsed={sidebarCollapsed} />
                <POStatusOverview />
              </div>

              {/* Row 3: PO Table and Side Stacks */}
              <div className="dashboard-grid-3">
                <RecentPurchaseOrders purchaseOrders={purchaseOrders} />
                <SidebarRightColumn />
              </div>

              {/* Row 4: Stock Alerts */}
              <MaterialReorderAlerts items={itemsList} />
            </>
          ) : (
            <div style={{ minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
              {(activeTab === 'Performa Invoice' || activeTab === 'Proforma Invoice') ? (
                <PerformaInvoiceView />
              ) : activeTab === 'Purchase Orders' ? (
                <PurchaseOrdersView />
              ) : activeTab === 'Zoho Integration' ? (
                <ZohoIntegrationView />
              ) : (
                <OtherViews activeTab={activeTab} onChangeTab={setActiveTab} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
