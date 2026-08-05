import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPIGrid({ purchaseOrders = [], items = [], isLoading = false }) {
  const cleanAmount = (amountStr) => {
    if (!amountStr) return 0;
    const cleaned = amountStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const hasRealData = purchaseOrders.length > 0;

  // Real calculations
  const realTotalValue = purchaseOrders.reduce((sum, po) => sum + cleanAmount(po.amount), 0);
  const realIssued = purchaseOrders.length;
  const realPending = purchaseOrders.filter(po => {
    const st = (po.statusText || '').toLowerCase();
    return st.includes('pending') || st.includes('draft');
  }).length;
  const realCompleted = purchaseOrders.filter(po => {
    const st = (po.statusText || '').toLowerCase();
    return st.includes('shipped') || st.includes('billed') || st.includes('received') || st.includes('open') || st.includes('approved');
  }).length;
  const realPayments = purchaseOrders
    .filter(po => {
      const st = (po.statusText || '').toLowerCase();
      return st.includes('shipped') || st.includes('billed') || st.includes('received');
    })
    .reduce((sum, po) => sum + cleanAmount(po.amount), 0);

  const kpis = [
    {
      title: 'TOTAL PO VALUE (THIS MONTH)',
      value: hasRealData ? `₹${realTotalValue.toLocaleString('en-IN')}` : '₹ 4.28 Cr',
      trend: '16.2%',
      trendUp: true,
      bottomText: hasRealData ? 'Total value of all synced Zoho POs' : 'vs Last Month',
      bottomHighlight: ''
    },
    {
      title: 'TOTAL PO QTY (MT/NOS)',
      value: '1,256',
      trend: '12.8%',
      trendUp: true,
      bottomText: 'vs Last Month',
      bottomHighlight: ''
    },
    {
      title: 'POS RAISED (THIS MONTH)',
      value: hasRealData ? `${realIssued}` : '86',
      trend: '10.3%',
      trendUp: true,
      bottomText: 'vs Last Month',
      bottomHighlight: ''
    },
    {
      title: 'POS RECEIVED (THIS MONTH)',
      value: hasRealData ? `${realCompleted}` : '72',
      trend: '14.1%',
      trendUp: true,
      bottomText: 'vs Last Month',
      bottomHighlight: ''
    },
    {
      title: 'OVERDUE POS',
      value: hasRealData ? `${realPending}` : '14',
      trend: '3',
      trendUp: false,
      bottomText: 'vs Last Month',
      bottomHighlight: ''
    }
  ];

  return (
    <div className="kpi-grid-5">
      {kpis.map((kpi, idx) => {
        if (isLoading) {
          return (
            <div 
              key={idx} 
              className="kpi-card" 
              style={{ 
                boxShadow: 'var(--shadow-sm)',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                backgroundColor: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                height: '115px'
              }}
            >
              <div style={{ padding: 'var(--spacing-16) var(--spacing-16) var(--spacing-12) var(--spacing-16)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
                <div className="skeleton-shimmer skeleton-text" style={{ width: '50%', height: '10px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)' }}>
                  <div className="skeleton-shimmer skeleton-text" style={{ width: '60%', height: '22px' }} />
                  <div className="skeleton-shimmer skeleton-text" style={{ width: '25%', height: '16px', borderRadius: '12px' }} />
                </div>
              </div>
              <div 
                style={{ 
                  padding: '10px var(--spacing-16)', 
                  borderTop: '1px solid var(--color-border)',
                  backgroundColor: '#fafbfc'
                }}
              >
                <div className="skeleton-shimmer skeleton-text" style={{ width: '80%', height: '8px' }} />
              </div>
            </div>
          );
        }

        return (
          <div 
            key={idx} 
            className="kpi-card" 
            style={{ 
              boxShadow: 'var(--shadow-sm)',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)'
            }}
          >
            {/* Top Main Section */}
            <div style={{ padding: 'var(--spacing-16) var(--spacing-16) var(--spacing-12) var(--spacing-16)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                <span 
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: 'var(--color-text-secondary)',
                    letterSpacing: '0.05em'
                  }}
                >
                  {kpi.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-8)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                    {kpi.value}
                  </span>
                  
                  {/* Trend Pill */}
                  <span 
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: kpi.trendUp ? '#16a34a' : '#dc2626',
                      backgroundColor: kpi.trendUp ? '#f0fdf4' : '#fef2f2',
                      border: kpi.trendUp ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      padding: '2px 6px',
                      borderRadius: '12px'
                    }}
                  >
                    {kpi.trendUp ? (
                      <TrendingUp style={{ width: '12px', height: '12px' }} />
                    ) : (
                      <TrendingDown style={{ width: '12px', height: '12px' }} />
                    )}
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Separator & Sub-text box */}
            <div 
              style={{ 
                padding: '10px var(--spacing-16)', 
                borderTop: '1px solid var(--color-border)',
                backgroundColor: '#fafbfc',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.4'
              }}
            >
              {kpi.bottomText}
              {kpi.bottomHighlight && (
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                  {kpi.bottomHighlight}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
