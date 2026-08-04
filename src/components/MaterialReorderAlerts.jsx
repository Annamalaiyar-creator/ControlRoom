import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MaterialReorderAlerts({ items = [] }) {
  const lowStockItems = items.filter(item => {
    const stock = Number(item.stockOnHand || 0);
    const reorder = Number(item.reorderLevel || 0);
    return reorder > 0 && stock <= reorder;
  });

  const defaultAlerts = [
    {
      id: 1,
      item: 'Solar Module 550Wp',
      code: 'Alert: #SM-550WP',
      currentStock: '120 nos',
      reorderLevel: '200 nos',
      eta: '1 Day (Urgent)',
      supplier: 'Sun Source Energy',
      etaColor: '#ef4444', // red
      tags: [
        { label: 'CRITICAL STOCK', color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' },
        { label: 'ENERGY EQUIP', color: '#0d9488', bg: '#f0fdfa', border: '#ccfbf1' }
      ]
    },
    {
      id: 2,
      item: 'Aluminium Rail 40mm',
      code: 'Alert: #AR-40MM',
      currentStock: '1,250 Mtr',
      reorderLevel: '2,000 Mtr',
      eta: '2 Days (High)',
      supplier: 'Jindal Aluminium',
      etaColor: '#eab308', // orange
      tags: [
        { label: 'HIGH RISK', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' },
        { label: 'RAW MATERIALS', color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' }
      ]
    },
    {
      id: 3,
      item: 'Hex Bolt M10',
      code: 'Alert: #HB-M10',
      currentStock: '8,500 nos',
      reorderLevel: '10,000 nos',
      eta: '5 Days (Normal)',
      supplier: 'Tata Steel Ltd.',
      etaColor: '#3b82f6', // blue
      tags: [
        { label: 'MEDIUM RISK', color: '#4f46e5', bg: '#f5f3ff', border: '#e0e7ff' },
        { label: 'FASTENERS', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }
      ]
    }
  ];

  const alerts = lowStockItems.length > 0 
    ? lowStockItems.map((item, idx) => ({
        id: idx + 1,
        item: item.name,
        code: `Alert: #${item.sku || item.itemId}`,
        currentStock: `${item.stockOnHand || 0} ${item.unit || 'nos'}`,
        reorderLevel: `${item.reorderLevel || 0} ${item.unit || 'nos'}`,
        eta: '3 Days (Medium)',
        supplier: 'Zoho Sync',
        etaColor: '#eab308',
        tags: [
          { label: 'LOW STOCK', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' },
          { label: (item.productType || 'Goods').toUpperCase(), color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' }
        ]
      }))
    : defaultAlerts;

  return (
    <div 
      className="section-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '24px', 
        backgroundColor: 'white', 
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Title Header inside the card */}
      <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '16px' }}>
        Material Reorder Alerts
      </span>

      {/* Grid container rendering separate child cards */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px' 
        }}
      >
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '20px', 
              backgroundColor: '#f8fafc', // soft off-white child card bg
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              margin: 0
            }}
          >
            {/* 1. Child Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              
              {/* Yellow Alert Logo */}
              <div 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  backgroundColor: '#facc15', // yellow
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <AlertTriangle style={{ width: '18px', height: '18px', color: '#1e293b' }} />
              </div>

              {/* Item details */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>{alert.item}</strong>
                <span style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{alert.code}</span>
              </div>

            </div>

            {/* 2. Key Metadata 2x2 Grid */}
            <div 
              style={{ 
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 12px',
                marginBottom: '14px',
                flex: 1
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Current Stock</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>{alert.currentStock}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Reorder Level</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>{alert.reorderLevel}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>ETA to Stock</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: alert.etaColor }}>{alert.eta}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Supplier</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>{alert.supplier}</span>
              </div>
            </div>

            {/* 3. Bottom Tags pill Row */}
            <div 
              style={{ 
                borderTop: '1px solid #e2e8f0', 
                paddingTop: '10px', 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '6px' 
              }}
            >
              {alert.tags.map((tag, idx) => (
                <span 
                  key={idx}
                  style={{
                    fontSize: '8px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: tag.color,
                    backgroundColor: tag.bg,
                    border: `1px solid ${tag.border}`
                  }}
                >
                  {tag.label}
                </span>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
