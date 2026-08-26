import React from 'react';
import { Wallet, Package, FileCheck, Truck, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function KPIGrid({ purchaseOrders = [], items = [], isLoading = false }) {
  const cleanAmount = (amountStr) => {
    if (!amountStr) return 0;
    const cleaned = String(amountStr).replace(/[^0-9.]/g, '');
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

  const kpis = [
    {
      title: 'TOTAL PO VALUE',
      value: hasRealData ? `₹${realTotalValue.toLocaleString('en-IN')}` : '₹ 4.28 Cr',
      trend: '16.2%',
      trendUp: true,
      icon: Wallet,
      iconColor: '#F97316',
      iconBg: '#FFF7ED',
      bottomPrefix: 'This month, generated extra ',
      bottomHighlight: '₹ 4.2 Lakhs'
    },
    {
      title: 'TOTAL PO QTY (MT/NOS)',
      value: '1,256',
      trend: '12.8%',
      trendUp: true,
      icon: Package,
      iconColor: '#0284C7',
      iconBg: '#F0F9FF',
      bottomPrefix: 'This month, dispatched ',
      bottomHighlight: '+142 MT'
    },
    {
      title: 'POS RAISED (THIS MONTH)',
      value: hasRealData ? `${realIssued}` : '86',
      trend: '10.3%',
      trendUp: true,
      icon: FileCheck,
      iconColor: '#0E7490',
      iconBg: '#ECFEFF',
      bottomPrefix: 'This month, issued ',
      bottomHighlight: '86 new POs'
    },
    {
      title: 'POS RECEIVED (THIS MONTH)',
      value: hasRealData ? `${realCompleted}` : '72',
      trend: '14.1%',
      trendUp: true,
      icon: Truck,
      iconColor: '#16A34A',
      iconBg: '#F0FDF4',
      bottomPrefix: 'This month, completed ',
      bottomHighlight: '72 orders'
    },
    {
      title: 'OVERDUE POS',
      value: hasRealData ? `${realPending}` : '14',
      trend: '3',
      trendUp: false,
      icon: AlertTriangle,
      iconColor: '#DC2626',
      iconBg: '#FEF2F2',
      bottomPrefix: 'Requires attention, ',
      bottomHighlight: '14 pending POs'
    }
  ];

  return (
    <div className="kpi-grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      {kpis.map((kpi, idx) => {
        const IconComponent = kpi.icon;

        if (isLoading) {
          return (
            <div 
              key={idx} 
              style={{ 
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #EAEFEF',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '60%' }}>
                  <div className="skeleton-shimmer skeleton-text" style={{ width: '70%', height: '10px' }} />
                  <div className="skeleton-shimmer skeleton-text" style={{ width: '90%', height: '24px' }} />
                </div>
                <div className="skeleton-shimmer" style={{ width: '44px', height: '44px', borderRadius: '14px' }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: '100%', height: '36px', borderRadius: '12px' }} />
            </div>
          );
        }

        return (
          <div 
            key={idx} 
            style={{ 
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #EAEFEF',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)',
              transition: 'all 0.2s ease',
              fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
            }}
          >
            {/* Top Main Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
              <span 
                style={{ 
                  fontSize: '11.5px', 
                  fontWeight: '800', 
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                {kpi.title}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
                  {kpi.value}
                </span>
                
                {/* Green / Red Trend Pill Badge right next to metric */}
                <span 
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    color: kpi.trendUp ? '#059669' : '#DC2626',
                    backgroundColor: kpi.trendUp ? '#ECFDF5' : '#FEF2F2',
                    border: kpi.trendUp ? '1px solid #A7F3D0' : '1px solid #FECACA',
                    padding: '2px 7.5px',
                    borderRadius: '8px',
                    lineHeight: '1.2'
                  }}
                >
                  {kpi.trendUp ? (
                    <ArrowUpRight style={{ width: '13px', height: '13px' }} />
                  ) : (
                    <ArrowDownRight style={{ width: '13px', height: '13px' }} />
                  )}
                  {kpi.trend}
                </span>
              </div>
            </div>

            {/* Bottom Sub-Card Box / Footer Section matching reference image */}
            <div 
              style={{ 
                backgroundColor: '#F8FAFC',
                border: '1px solid #F1F5F9',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#64748B',
                lineHeight: '1.4',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{kpi.bottomPrefix}</span>
              <span style={{ color: kpi.trendUp ? '#059669' : '#DC2626', fontWeight: '800' }}>
                {kpi.bottomHighlight}
              </span>
            </div>

          </div>
        );
      })}
    </div>
  );
}
