import React from 'react';
import RfpView from './views/RfpView';
import VendorManagementView from './views/VendorManagementView';
import QuotationsView from './views/QuotationsView';
import GoodsReceiptNoteView from './views/GoodsReceiptNoteView';
import InvoiceUploadView from './views/InvoiceUploadView';
import PaymentsView from './views/PaymentsView';
import VendorPerformanceView from './views/VendorPerformanceView';
import SpendAnalyticsView from './views/SpendAnalyticsView';
import MaterialReorderView from './views/MaterialReorderView';
import StockStatusView from './views/StockStatusView';
import PriceComparisonView from './views/PriceComparisonView';
import ItemsDirectoryView from './views/ItemsDirectoryView';
import ProcurementReportsView from './views/ProcurementReportsView';
import DispatchDashboardView from './views/DispatchDashboardView';
import ProductionViewsEngine from './views/ProductionViewsEngine';

export default function OtherViews(props) {
  const { activeTab, userRole = 'Sales Executive' } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {activeTab === 'Requests for Purchase' && <RfpView {...props} />}
      {activeTab === 'Vendor Management' && <VendorManagementView {...props} />}
      {activeTab === 'Quotations' && <QuotationsView {...props} />}
      {(activeTab === 'Goods Receipt Note' || activeTab === 'Goods Receipt Note (GRN)') && <GoodsReceiptNoteView {...props} />}
      {activeTab === 'Upload Invoice' && <InvoiceUploadView {...props} />}
      {activeTab === 'Payments' && <PaymentsView {...props} />}
      {activeTab === 'Vendor Performance' && <VendorPerformanceView {...props} />}
      {activeTab === 'Spend Analytics' && <SpendAnalyticsView {...props} />}
      {activeTab === 'Material Reorder' && <MaterialReorderView {...props} />}
      {activeTab === 'Stock Status' && <StockStatusView {...props} />}
      {activeTab === 'Price Comparison' && <PriceComparisonView {...props} />}
      {activeTab === 'Items Directory' && <ItemsDirectoryView {...props} />}
      {(activeTab === 'Procurement Reports' || activeTab === 'Spend Reports' || activeTab === 'Supplier Reports') && <ProcurementReportsView {...props} />}
      {(activeTab === 'Dispatch Dashboard' || (userRole === 'Dispatch Head' && activeTab === 'Dashboard')) && <DispatchDashboardView {...props} />}

      {/* Production & BOM & Invoices & Customer Management engine */}
      {(![
        'Requests for Purchase', 'Vendor Management', 'Quotations',
        'Goods Receipt Note', 'Goods Receipt Note (GRN)', 'Upload Invoice', 'Payments',
        'Vendor Performance', 'Spend Analytics', 'Material Reorder',
        'Stock Status', 'Price Comparison', 'Items Directory',
        'Procurement Reports', 'Spend Reports', 'Supplier Reports',
        'Dispatch Dashboard'
      ].includes(activeTab) || ['Work Orders', 'Planning & Scheduling', 'Production Monitoring',
        'Quality Control', 'Machine Maintenance', 'Inventory', 'BOM / Routing', 'BOM', 'Customer Management',
        'Production Reports', 'Efficiency Reports', 'Downtime Analytics',
        'Add Work Order', 'Record Production', 'Report Downtime', 'Dispatch Orders', 'Accounts Verification', 'Invoice Management'
      ].includes(activeTab)) && activeTab !== 'Dispatch Dashboard' && (
        <ProductionViewsEngine {...props} />
      )}
    </div>
  );
}
