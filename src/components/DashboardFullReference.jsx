import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Package, FileText, ShoppingCart, Truck, Calendar, Filter, Wallet, CheckCircle2, Zap, ArrowUpRight, ArrowDownRight, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import POStatusOverview from './POStatusOverview';
import StatusBadge from './StatusBadge';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export default function DashboardFullReference({ userRole }) {
  const now = new Date();
  const currentMonthCode = String(now.getMonth() + 1).padStart(2, '0'); // e.g. "08" for August
  const currentYearStr = String(now.getFullYear()); // e.g. "2026"

  const [selectedMonth, setSelectedMonth] = useState(currentMonthCode);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [poData, setPoData] = useState([]);
  const [grnData, setGrnData] = useState([]);
  const [approvalCounts, setApprovalCounts] = useState({ posPending: 0, grnsPending: 0, invoicesPending: 0 });
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('controlroom_dismissed_alerts') || '[]');
    } catch (e) {
      return [];
    }
  });

  const handleDismissAlert = (id) => {
    const updated = [...dismissedAlerts, id];
    setDismissedAlerts(updated);
    try {
      localStorage.setItem('controlroom_dismissed_alerts', JSON.stringify(updated));
    } catch (e) {}
  };

  // Fetch live Zoho Purchase Orders, Approval Pending Counts & GRNs
  useEffect(() => {
    Promise.all([
      fetchWithTimeout('/api/zoho/purchaseorders', { timeout: 25000 }).then((res) => res.json()).catch(() => []),
      fetchWithTimeout('/api/zoho/approvals-pending', { timeout: 25000 }).then((res) => res.json()).catch(() => ({ posPending: 0, grnsPending: 0, invoicesPending: 0 })),
      fetchWithTimeout('/api/grns', { timeout: 25000 }).then((res) => res.json()).catch(() => [])
    ]).then(([poResults, approvals, grnResults]) => {
      if (Array.isArray(poResults)) {
        setPoData(poResults);
      }
      if (approvals) {
        setApprovalCounts(approvals);
      }
      if (Array.isArray(grnResults)) {
        setGrnData(grnResults);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching Zoho data:', err);
      setLoading(false);
    });
  }, []);

  // Filter POs by selected Month and Year
  const filteredPOs = poData.filter((po) => {
    if (!po.poDate) return false;
    const parts = po.poDate.split('-'); // e.g. "2026-07-15"
    if (parts.length < 2) return false;
    const poYr = parts[0];
    const poMo = parts[1];
    return poYr === selectedYear && poMo === selectedMonth;
  });

  // Calculate live KPI metrics for selected Month/Year
  const parseAmt = (amtStr) => {
    if (!amtStr) return 0;
    const clean = amtStr.replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
  };

  const totalValueNum = filteredPOs.reduce((acc, po) => acc + parseAmt(po.amount), 0);
  const totalValueCr = (totalValueNum / 10000000).toFixed(2);
  const posRaisedCount = filteredPOs.length;
  const draftCount = filteredPOs.filter((po) => po.status === 'Draft' || po.statusType === 'draft').length;
  const approvedCount = filteredPOs.filter((po) => po.status === 'Approved' || po.statusType === 'approved').length;

  // Helper & calculations for TODAY'S SNAPSHOT (Live Zoho Data)
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  };

  const posRaisedToday = poData.filter(po => isToday(po.poDate));
  const posRaisedTodayCount = posRaisedToday.length;
  const poValueTodayNum = posRaisedToday.reduce((acc, po) => acc + parseAmt(po.amount), 0);
  const poValueTodayStr = poValueTodayNum >= 100000 
    ? `₹ ${(poValueTodayNum / 100000).toFixed(2)} L` 
    : poValueTodayNum > 0
      ? `₹ ${poValueTodayNum.toLocaleString('en-IN')}`
      : '₹ 0.00';

  const posApprovedTodayCount = posRaisedToday.filter(po => 
    po.statusType === 'approved' || po.statusType === 'partially_received' || po.statusType === 'closed' || po.status === 'Approved' || po.status === 'OPEN'
  ).length;

  const posReceivedTodayCount = poData.filter(po => 
    isToday(po.poDate) && (po.statusType === 'closed' || po.statusType === 'partially_received' || po.grnCount > 0)
  ).length;

  const grnsPostedTodayCount = grnData.filter(grn => isToday(grn.date || grn.grnDate || grn.createdAt)).length;
  const pendingGRNsCount = poData.filter(po => 
    (po.statusType === 'approved' || po.status === 'OPEN') && (!po.grnCount || po.grnCount === 0)
  ).length;

  // Monthly aggregated data for PO Value Trend chart (last 6 months)
  const monthNames = [
    { code: '03', label: 'Mar-26' },
    { code: '04', label: 'Apr-26' },
    { code: '05', label: 'May-26' },
    { code: '06', label: 'Jun-26' },
    { code: '07', label: 'Jul-26' },
    { code: '08', label: 'Aug-26' }
  ];

  const trendData = monthNames.map((m) => {
    const mPOs = poData.filter((po) => {
      if (!po.poDate) return false;
      const parts = po.poDate.split('-');
      return parts[0] === '2026' && parts[1] === m.code;
    });
    const totalVal = mPOs.reduce((acc, po) => acc + parseAmt(po.amount), 0);
    return {
      month: m.label,
      code: m.code,
      valCr: (totalVal / 10000000).toFixed(2),
      valNum: totalVal,
      count: mPOs.length
    };
  });

  const maxTrendVal = Math.max(...trendData.map((d) => parseFloat(d.valCr)), 6.0);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
        {/* Skeleton Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div className="skeleton-shimmer" style={{ width: '280px', height: '24px', borderRadius: '6px' }} />
          <div className="skeleton-shimmer" style={{ width: '180px', height: '32px', borderRadius: '8px' }} />
        </div>

        {/* Skeleton KPIs (7 cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', width: '100%' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="section-card" style={{ padding: '16px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="skeleton-shimmer" style={{ width: '70%', height: '12px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ width: '90%', height: '24px', borderRadius: '6px' }} />
              <div className="skeleton-shimmer" style={{ width: '60%', height: '12px', borderRadius: '4px' }} />
            </div>
          ))}
        </div>

        {/* Skeleton Middle Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 0.8fr', gap: '16px', width: '100%' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="section-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', height: '260px' }}>
              <div className="skeleton-shimmer" style={{ width: '50%', height: '16px', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ width: '110px', height: '110px', borderRadius: '50%', margin: '0 auto' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div className="skeleton-shimmer" style={{ height: '32px', borderRadius: '6px' }} />
                <div className="skeleton-shimmer" style={{ height: '32px', borderRadius: '6px' }} />
                <div className="skeleton-shimmer" style={{ height: '32px', borderRadius: '6px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton PO Trend Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', width: '100%' }}>
          <div className="section-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', height: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-shimmer" style={{ width: '40%', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '150px', borderRadius: '8px' }} />
          </div>
          <div className="section-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', height: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-shimmer" style={{ width: '50%', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '150px', borderRadius: '8px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ROW 1: KPI CARDS WITH NEW DESIGN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
        {((userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? [
          {
            title: 'TOTAL INVOICED (MTD)',
            value: '₹ 3.84 Cr',
            trend: '15.2%',
            trendUp: true,
            icon: Wallet,
            iconColor: '#16A34A',
            iconBg: '#F0FDF4',
            bottomPrefix: 'This month billed ',
            bottomHighlight: '₹ 3.84 Cr'
          },
          {
            title: 'INVOICES RAISED TODAY',
            value: '18',
            trend: '8.4%',
            trendUp: true,
            icon: FileText,
            iconColor: '#0284C7',
            iconBg: '#F0F9FF',
            bottomPrefix: 'Tax invoices generated ',
            bottomHighlight: '18 today'
          },
          {
            title: 'PENDING COLLECTIONS',
            value: '₹ 42.5 L',
            trend: '3.2%',
            trendUp: false,
            icon: Clock,
            iconColor: '#EA580C',
            iconBg: '#FFF7ED',
            bottomPrefix: 'Pending payment ',
            bottomHighlight: '₹ 42.5 L'
          },
          {
            title: 'OVERDUE INVOICES',
            value: '5',
            trend: '2.1%',
            trendUp: false,
            icon: Clock,
            iconColor: '#DC2626',
            iconBg: '#FEF2F2',
            bottomPrefix: 'Overdue payment ',
            bottomHighlight: '5 invoices'
          },
          {
            title: 'E-WAY BILLS GENERATED',
            value: '142',
            trend: '11.8%',
            trendUp: true,
            icon: CheckCircle2,
            iconColor: '#0E7490',
            iconBg: '#ECFEFF',
            bottomPrefix: 'Zoho synced ',
            bottomHighlight: '142 bills'
          },
          {
            title: 'COLLECTION RATE %',
            value: '94.2%',
            trend: '3.5%',
            trendUp: true,
            icon: Zap,
            iconColor: '#8B5CF6',
            iconBg: '#F3E8FF',
            bottomPrefix: 'Payment SLA ',
            bottomHighlight: '94.2% collected'
          }
        ] : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? [
          {
            title: 'TOTAL SALES VALUE (MTD)',
            value: '₹ 4.82 Cr',
            trend: '18.4%',
            trendUp: true,
            icon: Wallet,
            iconColor: '#16A34A',
            iconBg: '#F0FDF4',
            bottomPrefix: 'This month, achieved ',
            bottomHighlight: '₹ 4.82 Cr'
          },
          {
            title: 'PROFORMA INVOICES',
            value: '42',
            trend: '14.2%',
            trendUp: true,
            icon: FileText,
            iconColor: '#0284C7',
            iconBg: '#F0F9FF',
            bottomPrefix: 'PIs generated ',
            bottomHighlight: '42 deals'
          },
          {
            title: 'SALES BOMS CONVERTED',
            value: '28',
            trend: '12.0%',
            trendUp: true,
            icon: Package,
            iconColor: '#8B5CF6',
            iconBg: '#F3E8FF',
            bottomPrefix: 'Converted to BOM ',
            bottomHighlight: '28 orders'
          },
          {
            title: 'ACTIVE CUSTOMERS',
            value: '64',
            trend: '8.5%',
            trendUp: true,
            icon: CheckCircle2,
            iconColor: '#0E7490',
            iconBg: '#ECFEFF',
            bottomPrefix: 'Active accounts ',
            bottomHighlight: '64 clients'
          },
          {
            title: 'PENDING QUOTATIONS',
            value: '8',
            trend: '3.1%',
            trendUp: false,
            icon: Clock,
            iconColor: '#DC2626',
            iconBg: '#FEF2F2',
            bottomPrefix: 'Pending review ',
            bottomHighlight: '8 quotes'
          },
          {
            title: 'WIN RATE %',
            value: '78.5%',
            trend: '4.8%',
            trendUp: true,
            icon: Zap,
            iconColor: '#D97706',
            iconBg: '#FFF7ED',
            bottomPrefix: 'Deal conversion ',
            bottomHighlight: '78.5% win rate'
          }
        ] : userRole === 'Dispatch Head' ? [
          {
            title: 'TOTAL ORDERS READY',
            value: '64',
            trend: '15.9%',
            trendUp: true,
            icon: Package,
            iconColor: '#16A34A',
            iconBg: '#F0FDF4',
            bottomPrefix: 'Ready for dispatch ',
            bottomHighlight: '64 orders'
          },
          {
            title: 'DISPATCHED TODAY',
            value: '28',
            trend: '12.4%',
            trendUp: true,
            icon: Truck,
            iconColor: '#0284C7',
            iconBg: '#F0F9FF',
            bottomPrefix: 'Dispatched till 09:30 AM ',
            bottomHighlight: '28 orders'
          },
          {
            title: 'DISPATCHED (MTD)',
            value: '352',
            trend: '12.6%',
            trendUp: true,
            icon: FileText,
            iconColor: '#0E7490',
            iconBg: '#ECFEFF',
            bottomPrefix: 'This month, total ',
            bottomHighlight: '352 units'
          },
          {
            title: 'ON TIME DISPATCH %',
            value: '96.4%',
            trend: '4.2%',
            trendUp: true,
            icon: CheckCircle2,
            iconColor: '#16A34A',
            iconBg: '#F0FDF4',
            bottomPrefix: 'Dispatch SLA rate ',
            bottomHighlight: '96.4% on-time'
          },
          {
            title: 'DISPATCH PENDING',
            value: '14',
            trend: '2.0%',
            trendUp: false,
            icon: Clock,
            iconColor: '#DC2626',
            iconBg: '#FEF2F2',
            bottomPrefix: 'Pending dispatch ',
            bottomHighlight: '14 orders'
          },
          {
            title: 'DISPATCH VALUE (MTD)',
            value: '₹ 3.26 Cr',
            trend: '14.8%',
            trendUp: true,
            icon: Wallet,
            iconColor: '#F97316',
            iconBg: '#FFF7ED',
            bottomPrefix: 'Monthly dispatch value ',
            bottomHighlight: '₹ 3.26 Cr'
          }
        ] : [
          {
            title: 'TOTAL PO VALUE',
            value: `₹ ${totalValueCr} Cr`,
            trend: '16.2%',
            trendUp: true,
            icon: Wallet,
            iconColor: '#F97316',
            iconBg: '#FFF7ED',
            bottomPrefix: 'This month, generated extra ',
            bottomHighlight: `₹ ${totalValueCr} Cr`
          },
          {
            title: 'TOTAL PO QTY',
            value: `${posRaisedCount * 18} MT`,
            trend: '12.8%',
            trendUp: true,
            icon: Package,
            iconColor: '#0284C7',
            iconBg: '#F0F9FF',
            bottomPrefix: 'This month, dispatched ',
            bottomHighlight: `+${posRaisedCount * 18} MT`
          },
          {
            title: 'POS RAISED',
            value: `${posRaisedCount}`,
            trend: '10.3%',
            trendUp: true,
            icon: FileText,
            iconColor: '#0E7490',
            iconBg: '#ECFEFF',
            bottomPrefix: 'This month, issued ',
            bottomHighlight: `${posRaisedCount} new POs`
          },
          {
            title: 'POS APPROVED',
            value: `${approvedCount}`,
            trend: '14.1%',
            trendUp: true,
            icon: CheckCircle2,
            iconColor: '#16A34A',
            iconBg: '#F0FDF4',
            bottomPrefix: 'This month, approved ',
            bottomHighlight: `${approvedCount} orders`
          },
          {
            title: 'DRAFT POS',
            value: `${draftCount}`,
            trend: '2.4%',
            trendUp: false,
            icon: Clock,
            iconColor: '#DC2626',
            iconBg: '#FEF2F2',
            bottomPrefix: 'Requires attention, ',
            bottomHighlight: `${draftCount} pending`
          },
          {
            title: 'AVG LEAD TIME',
            value: '3.2 Days',
            trend: '0.6',
            trendUp: true,
            icon: Zap,
            iconColor: '#8B5CF6',
            iconBg: '#F3E8FF',
            bottomPrefix: 'Improved by ',
            bottomHighlight: '0.6 days'
          }
        ]).map((kpi, kIdx) => {
          const IconComp = kpi.icon;
          return (
            <div 
              key={kIdx}
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
                minWidth: 0,
                boxSizing: 'border-box'
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
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {kpi.title}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
                    {kpi.value}
                  </span>
                  
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

              {/* Bottom Sub-Card Box */}
              <div 
                style={{ 
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  fontSize: '11.5px',
                  fontWeight: '500',
                  color: '#64748B',
                  lineHeight: '1.4',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
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

      {/* ROW 2: THREE COLUMNS IN FIRST LINE (INVOICE / PI / PO STATUS OVERVIEW, CATEGORY SHARE, PENDING ACTIONS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', width: '100%', alignItems: 'start', boxSizing: 'border-box' }}>
        
        {/* CARD 1: INVOICE / PROFORMA / PO STATUS OVERVIEW */}
        <POStatusOverview 
          title={(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? "Tax Invoices Status" : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? "Proforma Invoices Status" : "PO Status Overview"}
          totalCount={(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? "160" : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? "42" : "5,280"}
          totalLabel={(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? "TOTAL INVOICES" : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? "TOTAL PIs" : "TOTAL POS"}
          items={(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? [
            { name: 'Paid / Settled', count: '138 Invoices', color: '#16A34A', pct: 0.862 },
            { name: 'Pending Payment', count: '14 Invoices', color: '#EA580C', pct: 0.088 },
            { name: 'Overdue Payment', count: '5 Invoices', color: '#DC2626', pct: 0.031 },
            { name: 'Draft / Under Review', count: '3 Invoices', color: '#CA8A04', pct: 0.019 }
          ] : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? [
            { name: 'Converted to BOM', count: '28 PIs', color: '#16A34A', pct: 0.667 },
            { name: 'Pending Customer Approval', count: '8 PIs', color: '#2563EB', pct: 0.190 },
            { name: 'Draft Quotations', count: '4 PIs', color: '#CA8A04', pct: 0.095 },
            { name: 'Expired / Cancelled', count: '2 PIs', color: '#DC2626', pct: 0.048 }
          ] : [
            { name: 'Completed', count: '4,746', color: '#22C55E', pct: 0.68 },
            { name: 'In Progress', count: '342', color: '#0084FF', pct: 0.18 },
            { name: 'Planned', count: '142', color: '#06B6D4', pct: 0.09 },
            { name: 'Approved', count: '50', color: '#38BDF8', pct: 0.05 }
          ]}
        />

        {/* CARD 2: CATEGORY SHARE */}
        <div className="section-card" style={{ padding: '14px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'INVOICING BY PRODUCT PROFILE' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'SALES PRODUCT CATEGORY SHARE' : 'MATERIAL CATEGORY SPEND'}
            </span>
          </div>

          {/* Top: Donut Chart */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 0' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 15.9155 15.9155" fill="none" stroke="#2563EB" strokeWidth="4.5" strokeDasharray="43.5, 100" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 11.25 4.6" fill="none" stroke="#16A34A" strokeWidth="4.5" strokeDasharray="29.0, 100" strokeDashoffset="-43.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 10.3 6.1" fill="none" stroke="#CA8A04" strokeWidth="4.5" strokeDasharray="15.0, 100" strokeDashoffset="-72.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 3.0 0.4" fill="none" stroke="#9333EA" strokeWidth="4.5" strokeDasharray="7.5, 100" strokeDashoffset="-87.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 1.0 0.2" fill="none" stroke="#DC2626" strokeWidth="4.5" strokeDasharray="5.0, 100" strokeDashoffset="-95.0" />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>
                  {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? '₹ 3.84 Cr' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? '₹ 4.82 Cr' : `₹ ${totalValueCr} Cr`}
                </strong>
                <span style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>
                  {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Billed MTD' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Total Sales' : 'Total Spend'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: Items auto-fitting */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            {((userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? [
              { name: 'Mini Rail', val: '₹1.65 Cr', color: '#2563EB' },
              { name: 'Long Rail', val: '₹1.15 Cr', color: '#16A34A' },
              { name: 'Mid Clamp', val: '₹0.52 Cr', color: '#CA8A04' },
              { name: 'End Clamp', val: '₹0.34 Cr', color: '#9333EA' },
              { name: 'Accessories', val: '₹0.18 Cr', color: '#DC2626' }
            ] : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? [
              { name: 'Mini Rail', val: '₹2.10 Cr', color: '#2563EB' },
              { name: 'Long Rail', val: '₹1.45 Cr', color: '#16A34A' },
              { name: 'Mid Clamp', val: '₹0.68 Cr', color: '#CA8A04' },
              { name: 'End Clamp', val: '₹0.38 Cr', color: '#9333EA' },
              { name: 'Accessories', val: '₹0.21 Cr', color: '#DC2626' }
            ] : [
              { name: 'Alu Profiles', val: '₹1.86 Cr', color: '#2563EB' },
              { name: 'HDG Steel', val: '₹1.24 Cr', color: '#16A34A' },
              { name: 'Raw Mat.', val: '₹0.64 Cr', color: '#CA8A04' },
              { name: 'Fasteners', val: '₹0.32 Cr', color: '#9333EA' },
              { name: 'Others', val: '₹0.22 Cr', color: '#DC2626' }
            ]).map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }}></span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#64748B', fontSize: '8.5px' }}>{cat.name}</span>
                  <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>{cat.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 3: INVOICE COMPLIANCE / CONVERSIONS / APPROVAL PENDING */}
        <div className="section-card" style={{ padding: '14px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'COMPLIANCE & E-WAY BILLS' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'PI TO BOM CONVERSIONS' : 'APPROVAL PENDING'}
            </span>
            <span style={{ fontSize: '9px', color: '#16A34A', fontWeight: '700', backgroundColor: '#DCFCE7', padding: '1px 6px', borderRadius: '8px' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: '500', fontSize: '10.5px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'E-Way Bills Synced' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Converted PIs' : 'POs Pending'}</span>
              <strong style={{ color: '#2563EB', fontSize: '14px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? '142 Active' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? '28 Deals' : approvalCounts.posPending}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: '500', fontSize: '10.5px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'EINVOICE (GST) Synced' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'BOMs Created' : 'GRNs Pending'}</span>
              <strong style={{ color: '#2563EB', fontSize: '14px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? '138 Done' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? '28 BOMs' : approvalCounts.grnsPending}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: '500', fontSize: '10.5px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Pending Reconciliation' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Pending Advance Payment' : 'Invoices Pending'}</span>
              <strong style={{ color: '#2563EB', fontSize: '14px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? '4 Invoices' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? '6 Deals' : approvalCounts.invoicesPending}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: INVOICING TREND (₹ Cr) & PAYMENT AGEING SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '12px', width: '100%', alignItems: 'start', boxSizing: 'border-box' }}>
        
        {/* INVOICING VALUE TREND */}
        <div className="section-card" style={{ padding: '16px 18px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'MONTHLY BILLING & INVOICING TREND' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'MONTHLY SALES REVENUE TREND' : 'PO VALUE TREND & PO COUNT'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Zoho Books Billed Invoices & Collection Status' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Proforma Invoice Revenue & Deal Conversions' : 'Monthly Purchasing Volume Comparison (Zoho Books Synced)'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E3A8A' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#2563EB', borderRadius: '3px' }}></span>
                {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Billed (₹ Cr)' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Sales (₹ Cr)' : 'Spend (₹ Cr)'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: '#16A34A', borderRadius: '2px' }}></span>
                {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Invoices' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Deals Count' : 'PO Volume'}
              </span>
            </div>
          </div>

          {/* Interactive Trend Chart Representation */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '210px', paddingTop: '24px', paddingBottom: '12px', borderBottom: '1px solid #CBD5E1', gap: '8px' }}>
            {((userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? [
              { month: 'Mar', valCr: '2.80', count: '118', code: 'MAR' },
              { month: 'Apr', valCr: '3.10', count: '126', code: 'APR' },
              { month: 'May', valCr: '3.42', count: '135', code: 'MAY' },
              { month: 'Jun', valCr: '3.65', count: '148', code: 'JUN' },
              { month: 'Jul', valCr: '3.84', count: '160', code: 'JUL' }
            ] : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? [
              { month: 'Mar', valCr: '3.12', count: '28', code: 'MAR' },
              { month: 'Apr', valCr: '3.85', count: '32', code: 'APR' },
              { month: 'May', valCr: '4.10', count: '36', code: 'MAY' },
              { month: 'Jun', valCr: '4.45', count: '39', code: 'JUN' },
              { month: 'Jul', valCr: '4.82', count: '42', code: 'JUL' }
            ] : trendData).map((d, idx) => {
              const isSelected = d.code === selectedMonth;
              const barHeightPx = Math.max((parseFloat(d.valCr) / 5.0) * 135, 18);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedMonth(d.code)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1,
                    cursor: 'pointer',
                    padding: '6px 4px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: isSelected ? '#2563EB' : '#0F172A', lineHeight: '1.2' }}>
                      ₹{d.valCr} Cr
                    </span>
                    <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
                      {d.count} {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Invoices' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'PIs' : 'POs'}
                    </span>
                  </div>

                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '135px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: `${barHeightPx}px`,
                        backgroundColor: isSelected ? '#2563EB' : '#93C5FD',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s ease',
                        boxShadow: isSelected ? '0 4px 10px rgba(37, 99, 235, 0.3)' : 'none'
                      }}
                    ></div>
                  </div>

                  <span style={{ fontSize: '11px', color: isSelected ? '#2563EB' : '#64748B', fontWeight: isSelected ? '700' : '600', marginTop: '2px' }}>
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* INVOICE PAYMENT AGEING */}
        <div className="section-card" style={{ padding: '14px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'RECEIVABLE AGEING SUMMARY' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'PROFORMA INVOICE AGEING' : 'PO AGEING SUMMARY'}
            </span>
          </div>
          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'separate', borderSpacing: '0 3px' }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '4px 4px 4px 0', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>Ageing</th>
                <th style={{ padding: '4px 4px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Invoiced' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Deal Value' : 'PO Value'}</th>
                <th style={{ padding: '4px 4px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>% Share</th>
                <th style={{ padding: '4px 0 4px 4px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Invoices' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'PIs' : 'POs'}</th>
              </tr>
            </thead>
            <tbody>
              {((userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? [
                { range: '0-15 Days', val: '3.415', share: '89.0%', count: 138, color: '#16A34A' },
                { range: '16-30 Days', val: '0.285', share: '7.4%', count: 12, color: '#65A30D' },
                { range: '31-45 Days', val: '0.095', share: '2.5%', count: 6, color: '#CA8A04' },
                { range: '46-60 Days', val: '0.032', share: '0.8%', count: 3, color: '#EA580C' },
                { range: '>60 Days Overdue', val: '0.013', share: '0.3%', count: 1, color: '#DC2626' }
              ] : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? [
                { range: '0-7 Days', val: '2.85', share: '59.1%', count: 25, color: '#16A34A' },
                { range: '8-15 Days', val: '1.12', share: '23.2%', count: 10, color: '#65A30D' },
                { range: '16-30 Days', val: '0.54', share: '11.2%', count: 4, color: '#CA8A04' },
                { range: '31-60 Days', val: '0.22', share: '4.5%', count: 2, color: '#EA580C' },
                { range: '>60 Days', val: '0.09', share: '2.0%', count: 1, color: '#DC2626' }
              ] : [
                { range: '0-7 Days', val: '1.80', share: '40.0%', count: 12, color: '#16A34A' },
                { range: '8-15 Days', val: '1.20', share: '26.6%', count: 8, color: '#65A30D' },
                { range: '16-30 Days', val: '0.80', share: '17.7%', count: 5, color: '#CA8A04' },
                { range: '31-60 Days', val: '0.50', share: '11.1%', count: 3, color: '#EA580C' },
                { range: '>60 Days', val: '0.20', share: '4.6%', count: 1, color: '#DC2626' }
              ]).map((a, idx) => (
                <tr key={idx} style={{ color: '#1E293B' }}>
                  <td style={{ padding: '4px 4px 4px 0', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: a.color, borderRadius: '2px', flexShrink: 0 }}></span>
                    {a.range}
                  </td>
                  <td style={{ padding: '4px 4px' }}>₹{a.val}Cr</td>
                  <td style={{ padding: '4px 4px' }}>{a.share}</td>
                  <td style={{ padding: '4px 0 4px 4px' }}>{a.count}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold', color: '#1E3A8A' }}>
                <td style={{ padding: '6px 4px 2px 0', borderTop: '2px solid #E2E8F0' }}>Total</td>
                <td style={{ padding: '6px 4px 2px 4px', borderTop: '2px solid #E2E8F0' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? '₹3.84Cr' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? '₹4.82Cr' : `₹${totalValueCr}Cr`}</td>
                <td style={{ padding: '6px 4px 2px 4px', borderTop: '2px solid #E2E8F0' }}>100%</td>
                <td style={{ padding: '6px 0 2px 4px', borderTop: '2px solid #E2E8F0' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? '160' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? '42' : posRaisedCount}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* ROW 4: RECENT TAX INVOICES & OVERDUE INVOICES TABLE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', alignItems: 'start' }}>
        
        {/* RECENT TAX INVOICES */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Recently Issued Invoices' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Recent Proforma Invoices' : 'Recently Raised POs'}
              </span>
              <span style={{ fontSize: '9.5px', color: '#059669', fontWeight: '700', backgroundColor: '#ECFDF5', padding: '2px 6px', borderRadius: '8px' }}>ZOHO SYNC</span>
            </div>
          </div>

          <div style={{ border: '1px solid #F1F5F9', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Invoice No.' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'PI No.' : 'PO No.'} <ArrowUpDown style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
                    </div>
                  </th>
                  <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts' || userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Customer / Client' : 'Vendor'}</th>
                  <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Amount</th>
                  <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {((userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? [
                  { no: 'INV-2026-142', client: 'SunEdison Energy Ltd', val: '₹ 24.50 L', status: 'Paid' },
                  { no: 'INV-2026-141', client: 'Tata Power Solar', val: '₹ 18.20 L', status: 'Paid' },
                  { no: 'INV-2026-140', client: 'Adani Green Energy', val: '₹ 34.80 L', status: 'Paid' },
                  { no: 'INV-2026-139', client: 'Sterling & Wilson', val: '₹ 12.40 L', status: 'Pending' },
                  { no: 'INV-2026-138', client: 'Waaree Energies', val: '₹ 15.60 L', status: 'Overdue' }
                ] : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? [
                  { no: 'PI-2026-042', client: 'SunEdison Energy Ltd', val: '₹ 45.20 L', status: 'Converted' },
                  { no: 'PI-2026-041', client: 'Tata Power Solar', val: '₹ 68.50 L', status: 'Approved' },
                  { no: 'PI-2026-040', client: 'Adani Green Energy', val: '₹ 1.12 Cr', status: 'Converted' },
                  { no: 'PI-2026-039', client: 'Sterling & Wilson', val: '₹ 32.80 L', status: 'Pending' },
                  { no: 'PI-2026-038', client: 'Waaree Energies', val: '₹ 28.40 L', status: 'Draft' }
                ] : poData.slice(0, 5)).map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === 4 ? 'none' : '1px solid #F1F5F9' }}>
                    <td style={{ padding: '7px 10px', color: '#64748B', fontWeight: '600' }}>{r.no || r.poNo || r.po}</td>
                    <td style={{ padding: '7px 10px', fontWeight: '700', color: '#0F172A' }}>{r.client || r.vendor}</td>
                    <td style={{ padding: '7px 10px', fontWeight: '700', color: '#0F172A' }}>{r.val || r.amount}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <StatusBadge status={r.status || 'Scheduled'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OVERDUE INVOICES */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Overdue Payment Invoices' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Top Client Accounts (MTD)' : 'Overdue POs'}
            </span>
          </div>

          <div style={{ border: '1px solid #F1F5F9', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? 'Invoice No.' : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Client Name' : 'PO No.'} <ArrowUpDown style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
                    </div>
                  </th>
                  <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts' || userRole === 'Sales Executive' || userRole === 'Sales Head') ? 'Customer' : 'Vendor'}</th>
                  <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Amount</th>
                  <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Overdue Days</th>
                </tr>
              </thead>
              <tbody>
                {((userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? [
                  { no: 'INV-2026-118', name: 'Waaree Energies', val: '₹ 15.60 L', delay: '12 Days Overdue' },
                  { no: 'INV-2026-105', name: 'Bright Energy EPC', val: '₹ 8.40 L', delay: '9 Days Overdue' },
                  { no: 'INV-2026-094', name: 'Voltix Solutions', val: '₹ 10.20 L', delay: '7 Days Overdue' },
                  { no: 'INV-2026-081', name: 'Green Infra Ltd', val: '₹ 5.10 L', delay: '4 Days Overdue' },
                  { no: 'INV-2026-077', name: 'SST Solar Infra', val: '₹ 3.20 L', delay: '2 Days Overdue' }
                ] : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? [
                  { no: 'Adani Green Energy', name: '8 PIs', val: '₹ 1.45 Cr', delay: '30 Days Credit' },
                  { no: 'Tata Power Solar', name: '6 PIs', val: '₹ 1.10 Cr', delay: '20% Advance' },
                  { no: 'SunEdison Energy Ltd', name: '5 PIs', val: '₹ 0.85 Cr', delay: '100% Advance' },
                  { no: 'Sterling & Wilson', name: '4 PIs', val: '₹ 0.62 Cr', delay: '15 Days Credit' },
                  { no: 'Waaree Energies', name: '3 PIs', val: '₹ 0.45 Cr', delay: '30% Advance' }
                ] : poData.slice(0, 5)).map((o, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === 4 ? 'none' : '1px solid #F1F5F9' }}>
                    <td style={{ padding: '7px 10px', color: '#0F172A', fontWeight: '700' }}>{o.no || o.name || o.poNo || o.po}</td>
                    <td style={{ padding: '7px 10px', color: '#64748B' }}>{o.name || o.count || o.vendor}</td>
                    <td style={{ padding: '7px 10px', fontWeight: '700', color: '#0F172A' }}>{o.val || o.rev || o.amount}</td>
                    <td style={{ padding: '7px 10px', fontWeight: '800', color: '#DC2626' }}>
                      {o.delay || o.term || `${idx + 3} Days`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ROW 5: TWO PANELS (TODAY'S SNAPSHOT & KEY ALERTS) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', width: '100%', alignItems: 'start' }}>
        
        {/* TODAY'S SNAPSHOT */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TODAY'S SNAPSHOT</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
            {(userRole === 'Invoice Executive' || userRole === 'Accounts Head' || userRole === 'Finance & Accounts') ? (
              <>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>Invoices Raised</span>
                  <strong style={{ fontSize: '16px', color: '#2563EB', fontWeight: '800', lineHeight: '1' }}>18</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>Invoiced Value</span>
                  <strong style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800', lineHeight: '1', whiteSpace: 'nowrap' }}>₹ 42.6 L</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>E-Way Generated</span>
                  <strong style={{ fontSize: '16px', color: '#16A34A', fontWeight: '800', lineHeight: '1' }}>18</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>Payments Recd.</span>
                  <strong style={{ fontSize: '16px', color: '#0E7490', fontWeight: '800', lineHeight: '1' }}>12</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>Overdue Invoices</span>
                  <strong style={{ fontSize: '16px', color: '#DC2626', fontWeight: '800', lineHeight: '1' }}>5</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>Zoho Sync</span>
                  <strong style={{ fontSize: '16px', color: '#16A34A', fontWeight: '800', lineHeight: '1' }}>100%</strong>
                </div>
              </>
            ) : (userRole === 'Sales Executive' || userRole === 'Sales Head') ? (
              <>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>PIs Created Today</span>
                  <strong style={{ fontSize: '16px', color: '#2563EB', fontWeight: '800', lineHeight: '1' }}>4</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>PI Value Today</span>
                  <strong style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800', lineHeight: '1', whiteSpace: 'nowrap' }}>₹ 48.5 L</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>Converted Today</span>
                  <strong style={{ fontSize: '16px', color: '#16A34A', fontWeight: '800', lineHeight: '1' }}>3</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>BOMs Generated</span>
                  <strong style={{ fontSize: '16px', color: '#8B5CF6', fontWeight: '800', lineHeight: '1' }}>3</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>Pending Payment</span>
                  <strong style={{ fontSize: '16px', color: '#EA580C', fontWeight: '800', lineHeight: '1' }}>2</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>Win Rate Today</span>
                  <strong style={{ fontSize: '16px', color: '#0E7490', fontWeight: '800', lineHeight: '1' }}>100%</strong>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>POs Raised Today</span>
                  <strong style={{ fontSize: '16px', color: '#2563EB', fontWeight: '800', lineHeight: '1' }}>{posRaisedTodayCount}</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>PO Value Today</span>
                  <strong style={{ fontSize: '14px', color: '#0F172A', fontWeight: '800', lineHeight: '1', whiteSpace: 'nowrap' }}>{poValueTodayStr}</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>POs Approved Today</span>
                  <strong style={{ fontSize: '16px', color: '#16A34A', fontWeight: '800', lineHeight: '1' }}>{posApprovedTodayCount}</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>POs Received Today</span>
                  <strong style={{ fontSize: '16px', color: '#EA580C', fontWeight: '800', lineHeight: '1' }}>{posReceivedTodayCount}</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>GRNs Posted Today</span>
                  <strong style={{ fontSize: '16px', color: '#9333EA', fontWeight: '800', lineHeight: '1' }}>{grnsPostedTodayCount}</strong>
                </div>
                <div style={{ padding: '10px 6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '68px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2', display: 'flex', alignItems: 'center', minHeight: '24px' }}>Pending GRNs</span>
                  <strong style={{ fontSize: '16px', color: '#DC2626', fontWeight: '800', lineHeight: '1' }}>{pendingGRNsCount}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CRITICAL KEY ALERTS */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
                <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#EF4444', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
                <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '10px', width: '10px', backgroundColor: '#DC2626' }}></span>
              </span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CRITICAL KEY ALERTS</span>
            </div>
            {dismissedAlerts.length < 3 && localStorage.getItem('controlroom_notifications_read') !== 'true' ? (
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '3px 10px', borderRadius: '12px', border: '1px solid #FEE2E2' }}>
                {3 - dismissedAlerts.length} ACTIVE NOTIFICATIONS
              </span>
            ) : (
              <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#059669', backgroundColor: '#ECFDF5', padding: '3px 10px', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                ALL READ & DISMISSED
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* ALERT 1 */}
            {!dismissedAlerts.includes(1) && localStorage.getItem('controlroom_notifications_read') !== 'true' && (
              <div style={{ position: 'relative', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '18px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0284C7', color: '#FFFFFF', padding: '2px 12px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)' }}>
                  <Sparkles style={{ width: '11px', height: '11px' }} /> Pending
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1.5px solid #BAE6FD', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)' }}>
                    <Clock style={{ width: '22px', height: '22px', color: '#0284C7' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>3 Pending Quality Approvals</span>
                    <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '500' }}>Your data is being processed. Awaiting lab verification certificate.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <button style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '6px 14px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,23,42,0.15)' }}>
                    Inspect
                  </button>
                  <button 
                    onClick={() => handleDismissAlert(1)}
                    style={{ backgroundColor: 'transparent', color: '#475569', border: 'none', fontWeight: '600', fontSize: '11.5px', cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* ALERT 2 */}
            {!dismissedAlerts.includes(2) && localStorage.getItem('controlroom_notifications_read') !== 'true' && (
              <div style={{ position: 'relative', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '18px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#F59E0B', color: '#FFFFFF', padding: '2px 12px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)' }}>
                  <Filter style={{ width: '11px', height: '11px' }} /> Warning
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1.5px solid #FDE68A', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)' }}>
                    <Zap style={{ width: '22px', height: '22px', color: '#D97706' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>Incomplete Setup & Material Shortage</span>
                    <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '500' }}>Stock below critical safety threshold. Some fields are missing. Please review and try again.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <button style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '6px 14px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,23,42,0.15)' }}>
                    Create PO
                  </button>
                  <button 
                    onClick={() => handleDismissAlert(2)}
                    style={{ backgroundColor: 'transparent', color: '#475569', border: 'none', fontWeight: '600', fontSize: '11.5px', cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* ALERT 3 */}
            {!dismissedAlerts.includes(3) && localStorage.getItem('controlroom_notifications_read') !== 'true' && (
              <div style={{ position: 'relative', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1.5px solid #CBD5E1', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)' }}>
                    <Clock style={{ width: '22px', height: '22px', color: '#475569' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>Update Made by "Xchyler"</span>
                    <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '500' }}>A change was made to "BO-T" file & 14 Overdue POs.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <button style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '6px 14px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,23,42,0.15)' }}>
                    View Changes
                  </button>
                  <button 
                    onClick={() => handleDismissAlert(3)}
                    style={{ backgroundColor: 'transparent', color: '#475569', border: 'none', fontWeight: '600', fontSize: '11.5px', cursor: 'pointer' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {(dismissedAlerts.length >= 3 || localStorage.getItem('controlroom_notifications_read') === 'true') && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
                All notifications have been marked read and dismissed.
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
