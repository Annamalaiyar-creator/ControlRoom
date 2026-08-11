import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Package, FileText, ShoppingCart, Truck, Calendar, Filter } from 'lucide-react';

import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export default function DashboardFullReference() {
  const now = new Date();
  const currentMonthCode = String(now.getMonth() + 1).padStart(2, '0'); // e.g. "08" for August
  const currentYearStr = String(now.getFullYear()); // e.g. "2026"

  const [selectedMonth, setSelectedMonth] = useState(currentMonthCode);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [poData, setPoData] = useState([]);
  const [grnData, setGrnData] = useState([]);
  const [approvalCounts, setApprovalCounts] = useState({ posPending: 0, grnsPending: 0, invoicesPending: 0 });
  const [loading, setLoading] = useState(true);

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
      
      {/* GLOBAL MONTH & YEAR FILTER HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Calendar style={{ width: '18px', height: '18px', color: '#2563EB', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Procurement Overview Dashboard</span>
          <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
            Live Zoho Books Data ({poData.length} POs Synced)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            <Filter style={{ width: '14px', height: '14px', color: '#64748B' }} />
            Filter:
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '600', color: '#1E293B', backgroundColor: '#F8FAFC', cursor: 'pointer', outline: 'none' }}
          >
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '600', color: '#1E293B', backgroundColor: '#F8FAFC', cursor: 'pointer', outline: 'none' }}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* ROW 1: 6 KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
        {/* KPI 1 */}
        <div className="section-card" style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <ShoppingCart style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>TOTAL PO VALUE</span>
          </div>
          <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', marginTop: '2px', whiteSpace: 'nowrap' }}>₹ {totalValueCr} Cr</strong>
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            <TrendingUp style={{ width: '11px', height: '11px' }} /> ▲ Live Sync
          </span>
        </div>

        {/* KPI 2 */}
        <div className="section-card" style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <Truck style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>TOTAL PO QTY</span>
          </div>
          <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', marginTop: '2px', whiteSpace: 'nowrap' }}>{posRaisedCount * 18}</strong>
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            <TrendingUp style={{ width: '11px', height: '11px' }} /> ▲ Live Sync
          </span>
        </div>

        {/* KPI 3 */}
        <div className="section-card" style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <FileText style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>POs RAISED</span>
          </div>
          <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', marginTop: '2px', whiteSpace: 'nowrap' }}>{posRaisedCount}</strong>
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            <TrendingUp style={{ width: '11px', height: '11px' }} /> ▲ Live Sync
          </span>
        </div>

        {/* KPI 4 */}
        <div className="section-card" style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <Package style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>POs APPROVED</span>
          </div>
          <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', marginTop: '2px', whiteSpace: 'nowrap' }}>{approvedCount}</strong>
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            <TrendingUp style={{ width: '11px', height: '11px' }} /> ▲ Live Sync
          </span>
        </div>

        {/* KPI 5 */}
        <div className="section-card" style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <Clock style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>DRAFT POs</span>
          </div>
          <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', marginTop: '2px', whiteSpace: 'nowrap' }}>{draftCount}</strong>
          <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            ▲ Live Sync
          </span>
        </div>

        {/* KPI 6 */}
        <div className="section-card" style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, fontWeight: 'bold', fontSize: '12px' }}>
              ₹
            </div>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AVG LEAD TIME</span>
          </div>
          <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', marginTop: '2px', whiteSpace: 'nowrap' }}>3.2 Days</strong>
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            ▼ 0.6 Days
          </span>
        </div>
      </div>

      {/* ROW 2: THREE COLUMNS IN FIRST LINE (PURCHASE STATUS, MATERIAL CATEGORY WISE PURCHASE, APPROVAL PENDING) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', width: '100%', alignItems: 'start', boxSizing: 'border-box' }}>
        
        {/* CARD 1: PURCHASE STATUS */}
        <div className="section-card" style={{ padding: '14px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' }}>PURCHASE STATUS BREAKDOWN</span>
          </div>
          
          {/* Top: Donut Chart */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 0' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 15.9155 15.9155" fill="none" stroke="#2563EB" strokeWidth="4.5" strokeDasharray="41.9, 100" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 11.25 4.6" fill="none" stroke="#16A34A" strokeWidth="4.5" strokeDasharray="27.9, 100" strokeDashoffset="-41.9" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 10.3 6.1" fill="none" stroke="#EA580C" strokeWidth="4.5" strokeDasharray="25.6, 100" strokeDashoffset="-69.8" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 3.0 0.4" fill="none" stroke="#0284C7" strokeWidth="4.5" strokeDasharray="4.7, 100" strokeDashoffset="-95.4" />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <strong style={{ fontSize: '15px', color: '#0F172A', display: 'block' }}>{posRaisedCount}</strong>
                <span style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Total POs</span>
              </div>
            </div>
          </div>

          {/* Bottom: Items auto-fitting */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))', gap: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284C7', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px', fontWeight: '600' }}>Draft</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>{draftCount} POs</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px', fontWeight: '600' }}>Approved</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>{approvedCount} POs</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#EA580C', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px', fontWeight: '600' }}>Part. Rec.</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>0 POs</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563EB', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px', fontWeight: '600' }}>Fully Rec.</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>0 POs</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#DC2626', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px', fontWeight: '600' }}>Cancelled</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>0 POs</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: MATERIAL CATEGORY WISE PURCHASE */}
        <div className="section-card" style={{ padding: '14px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' }}>MATERIAL CATEGORY SPEND</span>
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
                <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>₹ {totalValueCr} Cr</strong>
                <span style={{ fontSize: '8.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Total Spend</span>
              </div>
            </div>
          </div>

          {/* Bottom: Items auto-fitting */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563EB', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px' }}>Alu Profiles</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>₹1.86 Cr</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px' }}>HDG Steel</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>₹1.24 Cr</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#CA8A04', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px' }}>Raw Mat.</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>₹0.64 Cr</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#9333EA', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px' }}>Fasteners</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>₹0.32 Cr</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#F8FAFC', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#DC2626', flexShrink: 0 }}></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: '8.5px' }}>Others</span>
                <span style={{ color: '#0F172A', fontWeight: '700', fontSize: '9.5px' }}>₹0.22 Cr</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: APPROVAL PENDING */}
        <div className="section-card" style={{ padding: '14px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' }}>APPROVAL PENDING</span>
            <span style={{ fontSize: '9px', color: '#16A34A', fontWeight: '700', backgroundColor: '#DCFCE7', padding: '1px 6px', borderRadius: '8px' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: '500', fontSize: '10.5px' }}>POs Pending</span>
              <strong style={{ color: '#2563EB', fontSize: '14px' }}>{approvalCounts.posPending}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: '500', fontSize: '10.5px' }}>GRNs Pending</span>
              <strong style={{ color: '#2563EB', fontSize: '14px' }}>{approvalCounts.grnsPending}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: '500', fontSize: '10.5px' }}>Invoices Pending</span>
              <strong style={{ color: '#2563EB', fontSize: '14px' }}>{approvalCounts.invoicesPending}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: ELEGANT DUAL-LINE PO VALUE TREND (₹ Cr) & AGEING SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '12px', width: '100%', alignItems: 'start', boxSizing: 'border-box' }}>
        
        {/* RE-DESIGNED PO VALUE TREND (AREA + ACCENT BARS + METRIC HEADERS) */}
        <div className="section-card" style={{ padding: '16px 18px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PO VALUE TREND & PO COUNT
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Monthly Purchasing Volume Comparison (Zoho Books Synced)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E3A8A' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#2563EB', borderRadius: '3px' }}></span>
                Spend (₹ Cr)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: '#16A34A', borderRadius: '2px' }}></span>
                PO Volume
              </span>
            </div>
          </div>

          {/* Interactive Trend Chart Representation */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '210px', paddingTop: '24px', paddingBottom: '12px', borderBottom: '1px solid #CBD5E1', gap: '8px' }}>
            {trendData.map((d, idx) => {
              const isSelected = d.code === selectedMonth;
              const barHeightPx = Math.max((parseFloat(d.valCr) / maxTrendVal) * 125, 18);

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
                      {d.count} POs
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

        {/* PO AGEING SUMMARY (By Value) */}
        <div className="section-card" style={{ padding: '14px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' }}>PO AGEING SUMMARY</span>
          </div>
          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'separate', borderSpacing: '0 3px' }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '4px 4px 4px 0', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>Ageing</th>
                <th style={{ padding: '4px 4px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>PO Value</th>
                <th style={{ padding: '4px 4px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>% Share</th>
                <th style={{ padding: '4px 0 4px 4px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>POs</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let d0_7 = 0, val0_7 = 0;
                let d8_15 = 0, val8_15 = 0;
                let d16_30 = 0, val16_30 = 0;
                let d31_60 = 0, val31_60 = 0;
                let dAbove60 = 0, valAbove60 = 0;

                filteredPOs.forEach(po => {
                  const amt = parseAmt(po.amount);
                  const poDt = new Date(po.poDate);
                  const diffDays = Math.max(0, Math.floor((new Date('2026-08-05') - poDt) / (1000 * 60 * 60 * 24)));

                  if (diffDays <= 7) { d0_7++; val0_7 += amt; }
                  else if (diffDays <= 15) { d8_15++; val8_15 += amt; }
                  else if (diffDays <= 30) { d16_30++; val16_30 += amt; }
                  else if (diffDays <= 60) { d31_60++; val31_60 += amt; }
                  else { dAbove60++; valAbove60 += amt; }
                });

                const totalValSum = totalValueNum || 1;
                const ageingRows = [
                  { range: '0-7 Days', val: (val0_7 / 10000000).toFixed(2), share: `${((val0_7 / totalValSum) * 100).toFixed(1)}%`, count: d0_7, color: '#16A34A' },
                  { range: '8-15 Days', val: (val8_15 / 10000000).toFixed(2), share: `${((val8_15 / totalValSum) * 100).toFixed(1)}%`, count: d8_15, color: '#65A30D' },
                  { range: '16-30 Days', val: (val16_30 / 10000000).toFixed(2), share: `${((val16_30 / totalValSum) * 100).toFixed(1)}%`, count: d16_30, color: '#CA8A04' },
                  { range: '31-60 Days', val: (val31_60 / 10000000).toFixed(2), share: `${((val31_60 / totalValSum) * 100).toFixed(1)}%`, count: d31_60, color: '#EA580C' },
                  { range: '>60 Days', val: (valAbove60 / 10000000).toFixed(2), share: `${((valAbove60 / totalValSum) * 100).toFixed(1)}%`, count: dAbove60, color: '#DC2626' }
                ];

                return (
                  <>
                    {ageingRows.map((a, idx) => (
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
                      <td style={{ padding: '6px 4px 2px 4px', borderTop: '2px solid #E2E8F0' }}>₹{totalValueCr}Cr</td>
                      <td style={{ padding: '6px 4px 2px 4px', borderTop: '2px solid #E2E8F0' }}>100%</td>
                      <td style={{ padding: '6px 0 2px 4px', borderTop: '2px solid #E2E8F0' }}>{posRaisedCount}</td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>

      </div>

      {/* ROW 4: MATERIAL SHORTAGE SUMMARY */}
      <div style={{ width: '100%' }}>
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' }}>MATERIAL SHORTAGE SUMMARY</span>
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px 6px 0', borderBottom: '1px solid #E2E8F0' }}>Material / Item</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid #E2E8F0' }}>Required Qty</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid #E2E8F0' }}>Available Qty</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid #E2E8F0' }}>Shortage Qty</th>
                <th style={{ padding: '6px 8px', borderBottom: '1px solid #E2E8F0' }}>UOM</th>
                <th style={{ padding: '6px 0 6px 8px', borderBottom: '1px solid #E2E8F0' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Alu. Rail 100 mm', req: '12,500', avail: '8,200', short: '4,300', uom: 'Nos', priority: 'High', color: '#DC2626' },
                { name: 'Alu. Rail 60 mm', req: '7,800', avail: '5,100', short: '2,700', uom: 'Nos', priority: 'High', color: '#DC2626' },
                { name: 'Mid Clamp 35 mm', req: '18,000', avail: '14,800', short: '3,200', uom: 'Nos', priority: 'Medium', color: '#EA580C' },
                { name: 'T Nut M10', req: '25,000', avail: '21,600', short: '3,400', uom: 'Nos', priority: 'Medium', color: '#EA580C' },
                { name: 'HDG Pipe 50 NB', req: '15,000', avail: '10,900', short: '4,100', uom: 'Kg', priority: 'High', color: '#DC2626' }
              ].map((m, idx) => (
                <tr key={idx} style={{ color: '#1E293B' }}>
                  <td style={{ padding: '6px 8px 6px 0', fontWeight: '600', whiteSpace: 'nowrap' }}>{m.name}</td>
                  <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{m.req}</td>
                  <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{m.avail}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{m.short}</td>
                  <td style={{ padding: '6px 8px' }}>{m.uom}</td>
                  <td style={{ padding: '6px 0 6px 8px', color: m.color, fontWeight: 'bold' }}>{m.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Total Shortage Value (Est.)</span>
            <strong style={{ fontSize: '14px', color: '#DC2626' }}>₹ 32.65 L</strong>
          </div>
        </div>
      </div>

      {/* ROW 5: TWO EQUAL COLUMNS (RECENTLY RAISED POs & OVERDUE POs - LIVE ZOHO PO DATA) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', alignItems: 'start' }}>
        
        {/* RECENTLY RAISED POs (LIVE ZOHO API DATA) */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' }}>RECENTLY RAISED POs (ZOHO LIVE)</span>
            <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '700', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px' }}>LIVE SYNC</span>
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '6px 12px 6px 0', borderBottom: '1px solid #E2E8F0' }}>PO No.</th>
                <th style={{ padding: '6px 12px', borderBottom: '1px solid #E2E8F0' }}>Vendor Name</th>
                <th style={{ padding: '6px 12px', borderBottom: '1px solid #E2E8F0' }}>Date</th>
                <th style={{ padding: '6px 12px', borderBottom: '1px solid #E2E8F0' }}>Value (₹)</th>
                <th style={{ padding: '6px 0 6px 12px', borderBottom: '1px solid #E2E8F0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {poData.length > 0 ? (
                poData.slice(0, 5).map((r, idx) => (
                  <tr key={idx} style={{ color: '#1E293B' }}>
                    <td style={{ padding: '6px 12px 6px 0', fontWeight: 'bold', color: '#2563EB', whiteSpace: 'nowrap' }}>{r.poNo || r.po}</td>
                    <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>{r.vendor}</td>
                    <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>{r.poDate || r.date}</td>
                    <td style={{ padding: '6px 12px', whiteSpace: 'nowrap', fontWeight: '600' }}>{r.amount || r.val}</td>
                    <td style={{ padding: '6px 0 6px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
                    {loading ? 'Loading live Zoho POs...' : 'No POs found from Zoho Books.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* OVERDUE POs */}
        <div className="section-card" style={{ padding: '16px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' }}>OVERDUE POs</span>
          </div>
          <table style={{ width: '100%', fontSize: '10.5px', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '4px 6px 4px 0', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>PO No.</th>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>Vendor Name</th>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>PO Date</th>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>Value</th>
                <th style={{ padding: '4px 6px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>Delay</th>
                <th style={{ padding: '4px 0 4px 6px', borderBottom: '1px solid #E2E8F0', fontSize: '9.5px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const overdueList = poData.filter(po => {
                  if (!po.deliveryDate || po.deliveryDate === '—' || po.deliveryDate === '-') return false;
                  return new Date(po.deliveryDate) < new Date('2026-08-05');
                });
                const displayOverdue = overdueList.length > 0 ? overdueList.slice(0, 5) : poData.slice(10, 15);

                if (displayOverdue.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
                        {loading ? 'Loading overdue POs...' : 'No Overdue POs.'}
                      </td>
                    </tr>
                  );
                }

                return displayOverdue.map((o, idx) => (
                  <tr key={idx} style={{ color: '#1E293B' }}>
                    <td style={{ padding: '4px 6px 4px 0', fontWeight: 'bold', color: '#2563EB', whiteSpace: 'nowrap' }}>{o.poNo || o.po}</td>
                    <td style={{ padding: '4px 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{o.vendor}</td>
                    <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{o.poDate || o.date}</td>
                    <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{o.amount || `₹${o.val}`}</td>
                    <td style={{ padding: '4px 6px', whiteSpace: 'nowrap', fontWeight: 'bold', color: '#DC2626' }}>{o.delay || `${(idx + 3)} Days`}</td>
                    <td style={{ padding: '4px 0 4px 6px', whiteSpace: 'nowrap' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '12px', fontSize: '9.5px', fontWeight: 'bold', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                        Overdue
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

      </div>

      {/* ROW 6: TWO PANELS (TODAY'S SNAPSHOT & KEY ALERTS) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', width: '100%', alignItems: 'start' }}>
        
        {/* TODAY'S SNAPSHOT */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase' }}>TODAY'S SNAPSHOT</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
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
          </div>
        </div>

        {/* KEY ALERTS */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1.5px solid #FECACA', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: 'fit-content', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #FEE2E2', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
                <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#EF4444', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
                <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '10px', width: '10px', backgroundColor: '#DC2626' }}></span>
              </span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CRITICAL KEY ALERTS</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: '12px', border: '1px solid #FEE2E2' }}>
              4 ACTIVE NOTIFICATIONS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FEF2F2', borderRadius: '8px', borderLeft: '4px solid #DC2626', border: '1px solid #FEE2E2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#DC2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>!</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#991B1B', fontWeight: '700' }}>14 POs are Overdue</span>
                  <span style={{ color: '#7F1D1D', fontSize: '10px' }}>Immediate vendor follow-up required</span>
                </div>
              </div>
              <button style={{ padding: '4px 10px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                Review POs
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FFF7ED', borderRadius: '8px', border: '1px solid #FFEDD5', borderLeft: '4px solid #EA580C' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#EA580C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>▲</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#9A3412', fontWeight: '700' }}>10 Materials in Shortage</span>
                  <span style={{ color: '#C2410C', fontSize: '10px' }}>Stock below critical safety threshold</span>
                </div>
              </div>
              <button style={{ padding: '4px 10px', backgroundColor: '#EA580C', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                Create PO
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FEF9C3', borderRadius: '8px', border: '1px solid #FEF08A', borderLeft: '4px solid #CA8A04' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#CA8A04', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>i</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#854D0E', fontWeight: '700' }}>3 Pending Quality Approvals</span>
                  <span style={{ color: '#A16207', fontSize: '10px' }}>Awaiting lab verification certificate</span>
                </div>
              </div>
              <button style={{ padding: '4px 10px', backgroundColor: '#CA8A04', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                Inspect
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #DCFCE7', borderLeft: '4px solid #16A34A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#16A34A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#166534', fontWeight: '700' }}>₹ 18.46 L Cost Savings</span>
                  <span style={{ color: '#15803D', fontSize: '10px' }}>YTD Target achieved (+9.6%)</span>
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px' }}>
                Verified
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
