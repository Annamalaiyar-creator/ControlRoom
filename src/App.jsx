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

import { useEffect } from 'react';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
            <DashboardFullReference />
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
