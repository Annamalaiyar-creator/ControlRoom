import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Users, CheckCircle2, AlertTriangle, AlertCircle, Phone,
  FileText, Calendar, Filter, ChevronDown, ArrowUpRight, ArrowDownRight,
  Clock, ShieldAlert, Sparkles, RefreshCw, Layers, DollarSign, ChevronRight,
  ChevronLeft, Edit3, Trash2, X, MoreHorizontal, ExternalLink, ArrowRight,
  Check, Eye, Search, SlidersHorizontal, BarChart3, PieChart, Tag, ArrowUpDown
} from 'lucide-react';

export default function SalesExecutiveDashboardView({ userRole = 'Sales Executive', onNavigateTab }) {
  // Filter States
  const [selectedExecutive, setSelectedExecutive] = useState('Manojraj');
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Table interactive selection states
  const [selectedFollowups, setSelectedFollowups] = useState([]);
  const [followupPage, setFollowupPage] = useState(1);
  const [followupRowsPerPage, setFollowupRowsPerPage] = useState(5);
  const [followupGoTo, setFollowupGoTo] = useState('');

  // Outstanding table pagination
  const [selectedOutstanding, setSelectedOutstanding] = useState([]);
  const [outstandingPage, setOutstandingPage] = useState(1);
  const [outstandingRowsPerPage, setOutstandingRowsPerPage] = useState(5);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Follow-up and opportunity list dataset
  const followupsData = [
    { id: 'FO-1', customer: 'ABC Solar Pvt Ltd', offerValue: '₹ 12.4 L', nextFollowup: 'Today, 11:00 AM', stage: 'Negotiation', age: '18 days', priority: 'HIGH' },
    { id: 'FO-2', customer: 'Green Infra Ltd', offerValue: '₹ 9.8 L', nextFollowup: 'Today, 2:30 PM', stage: 'Revised offer', age: '16 days', priority: 'HIGH' },
    { id: 'FO-3', customer: 'Bright Energy', offerValue: '₹ 8.2 L', nextFollowup: 'Today, 4:00 PM', stage: 'PI Issued', age: '3 days', priority: 'HIGH' },
    { id: 'FO-4', customer: 'Sun Power EPC', offerValue: '₹ 6.7 L', nextFollowup: 'Tomorrow', stage: 'Technical discussion', age: '11 days', priority: 'MEDIUM' },
    { id: 'FO-5', customer: 'Voltix Solutions', offerValue: '₹ 5.4 L', nextFollowup: '02 Sep 2026', stage: 'Qualification', age: '2 days', priority: 'MEDIUM' },
    { id: 'FO-6', customer: 'KPR Solar Tech', offerValue: '₹ 4.1 L', nextFollowup: '04 Sep 2026', stage: 'Quote Shared', age: '5 days', priority: 'MEDIUM' },
    { id: 'FO-7', customer: 'Sree Ganesh Renewables', offerValue: '₹ 3.8 L', nextFollowup: '05 Sep 2026', stage: 'Sampling Done', age: '8 days', priority: 'MEDIUM' }
  ];

  // Customer outstanding dataset
  const outstandingData = [
    { id: 'CO-1', customer: 'ABC Solar', invoiced: '₹ 12.4 L', outstanding: '₹ 4.2 L', overdue: '₹ 1.8 L', creditLimit: '₹ 10.0 L', creditStatus: 'Within limit' },
    { id: 'CO-2', customer: 'Green Infra', invoiced: '₹ 9.8 L', outstanding: '₹ 3.6 L', overdue: '₹ 1.2 L', creditLimit: '₹ 5.0 L', creditStatus: '72% used' },
    { id: 'CO-3', customer: 'Bright Energy', invoiced: '₹ 8.2 L', outstanding: '₹ 2.1 L', overdue: '—', creditLimit: '₹ 8.0 L', creditStatus: 'Within limit' },
    { id: 'CO-4', customer: 'Sun Power EPC', invoiced: '₹ 6.7 L', outstanding: '₹ 2.4 L', overdue: '₹ 1.1 L', creditLimit: '₹ 2.0 L', creditStatus: 'Limit exceeded' }
  ];

  // Lost and cancelled dataset
  const lostCancelledData = [
    { id: 'LC-1', opportunity: 'Aditya Solar', value: '₹ 5.6 L', status: 'Lost', reason: 'Price difference', closedDate: '12 Aug' },
    { id: 'LC-2', opportunity: 'Ray Power', value: '₹ 3.8 L', status: 'Cancelled', reason: 'Project postponed', closedDate: '18 Aug' },
    { id: 'LC-3', opportunity: 'Sree Ganesh', value: '₹ 2.9 L', status: 'Lost', reason: 'Competitor selected', closedDate: '22 Aug' },
    { id: 'LC-4', opportunity: 'KPR Solar', value: '₹ 2.4 L', status: 'Cancelled', reason: 'Customer no response', closedDate: '27 Aug' }
  ];

  // Top 10 Customers list
  const topCustomers = [
    { rank: '01', name: 'ABC Solar', value: '₹ 12.4 L', share: '17.2%' },
    { rank: '02', name: 'Green Infra', value: '₹ 9.8 L', share: '13.6%' },
    { rank: '03', name: 'Bright Energy', value: '₹ 8.2 L', share: '11.4%' },
    { rank: '04', name: 'Sun Power EPC', value: '₹ 6.7 L', share: '9.3%' },
    { rank: '05', name: 'Voltix Solutions', value: '₹ 5.4 L', share: '7.5%' },
    { rank: '06', name: 'KPR Solar', value: '₹ 4.1 L', share: '5.7%' },
    { rank: '07', name: 'Sree Ganesh', value: '₹ 3.8 L', share: '5.3%' },
    { rank: '08', name: 'Aditya Solar', value: '₹ 3.5 L', share: '4.9%' },
    { rank: '09', name: 'Nova Energy', value: '₹ 3.1 L', share: '4.3%' },
    { rank: '10', name: 'Ray Power', value: '₹ 2.8 L', share: '3.9%' }
  ];

  // Product performance dataset
  const productPerformance = [
    { name: 'Solar Structures', actual: 32.5, target: 35.0, actualStr: '₹ 32.5L', targetStr: '₹ 35.0L' },
    { name: 'Aluminium Profiles', actual: 21.0, target: 24.0, actualStr: '₹ 21.0L', targetStr: '₹ 24.0L' },
    { name: 'BOS Kits', actual: 11.5, target: 10.0, actualStr: '₹ 11.5L', targetStr: '₹ 10.0L' },
    { name: 'Walkway / Handrail', actual: 4.5, target: 4.0, actualStr: '₹ 4.5L', targetStr: '₹ 4.0L' },
    { name: 'Accessories', actual: 2.5, target: 2.0, actualStr: '₹ 2.5L', targetStr: '₹ 2.0L' }
  ];

  // Trend data: Jan - Sep matching reference
  const [selectedTrendMonth, setSelectedTrendMonth] = useState('Sep');
  const [hoveredTrendMonth, setHoveredTrendMonth] = useState(null);
  const trendMonths = [
    { month: 'Jan', val: 32, valStr: '₹ 32.0 L', count: 18, pct: 0.38 },
    { month: 'Feb', val: 38, valStr: '₹ 38.0 L', count: 21, pct: 0.45 },
    { month: 'Mar', val: 54, valStr: '₹ 54.0 L', count: 26, pct: 0.65 },
    { month: 'Apr', val: 68, valStr: '₹ 68.0 L', count: 32, pct: 0.82 },
    { month: 'May', val: 72, valStr: '₹ 72.0 L', count: 35, pct: 0.86 },
    { month: 'Jun', val: 62, valStr: '₹ 62.0 L', count: 29, pct: 0.74 },
    { month: 'Jul', val: 76, valStr: '₹ 76.0 L', count: 38, pct: 0.92 },
    { month: 'Aug', val: 71, valStr: '₹ 71.0 L', count: 34, pct: 0.85 },
    { month: 'Sep', val: 82, valStr: '₹ 82.0 L', count: 42, pct: 1.0 }
  ];

  // Receivable Ageing Summary dataset matching Image 2
  const ageingData = [
    { range: '0-15 Days', val: '₹3.415Cr', share: '89.0%', count: 138, color: '#16A34A' },
    { range: '16-30 Days', val: '₹0.285Cr', share: '7.4%', count: 12, color: '#65A30D' },
    { range: '31-45 Days', val: '₹0.095Cr', share: '2.5%', count: 6, color: '#CA8A04' },
    { range: '46-60 Days', val: '₹0.032Cr', share: '0.8%', count: 3, color: '#EA580C' },
    { range: '>60 Days Overdue', val: '₹0.013Cr', share: '0.3%', count: 1, color: '#DC2626' }
  ];

  // Recently Issued Invoices matching Image 2
  const recentlyIssuedInvoices = [
    { no: 'INV-2026-142', client: 'SunEdison Energy Ltd', amount: '₹ 24.50 L', status: 'Paid' },
    { no: 'INV-2026-141', client: 'Tata Power Solar', amount: '₹ 18.20 L', status: 'Paid' },
    { no: 'INV-2026-140', client: 'Adani Green Energy', amount: '₹ 34.80 L', status: 'Paid' },
    { no: 'INV-2026-139', client: 'Sterling & Wilson', amount: '₹ 12.40 L', status: 'Pending' },
    { no: 'INV-2026-138', client: 'Waaree Energies', amount: '₹ 15.60 L', status: 'Overdue' }
  ];

  // Overdue Payment Invoices matching Image 2
  const overduePaymentInvoices = [
    { no: 'INV-2026-118', customer: 'Waaree Energies', amount: '₹ 15.60 L', overdueDays: '12 Days Overdue' },
    { no: 'INV-2026-105', customer: 'Bright Energy EPC', amount: '₹ 8.40 L', overdueDays: '9 Days Overdue' },
    { no: 'INV-2026-094', customer: 'Voltix Solutions', amount: '₹ 10.20 L', overdueDays: '7 Days Overdue' },
    { no: 'INV-2026-081', customer: 'Green Infra Ltd', amount: '₹ 5.10 L', overdueDays: '4 Days Overdue' },
    { no: 'INV-2026-077', customer: 'SST Solar Infra', amount: '₹ 3.20 L', overdueDays: '2 Days Overdue' }
  ];

  // Today's Snapshot dataset matching Image 2
  const todaySnapshotData = [
    { label: 'Invoices Raised', value: '18', color: '#2563EB' },
    { label: 'Invoiced Value', value: '₹ 42.6 L', color: '#0F172A' },
    { label: 'E-Way Generated', value: '18', color: '#16A34A' },
    { label: 'Payments Recd.', value: '12', color: '#0E7490' },
    { label: 'Overdue Invoices', value: '5', color: '#DC2626' },
    { label: 'Zoho Sync', value: '100%', color: '#16A34A' }
  ];

  // Pagination for follow-up
  const totalFollowupPages = Math.ceil(followupsData.length / followupRowsPerPage) || 1;
  const currentFollowupRows = useMemo(() => {
    const start = (followupPage - 1) * followupRowsPerPage;
    return followupsData.slice(start, start + followupRowsPerPage);
  }, [followupPage, followupRowsPerPage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* PERSONALIZED WELCOME BANNER CARD */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              Welcome back, {userRole === 'Sales Head' ? 'Vijay' : (localStorage.getItem('controlroom_logged_user_name') || 'Mohith JV')}!
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0', fontWeight: '500' }}>
              Here is your sales performance, active quotations & revenue conversion metrics for today.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sales Target Pace</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }}></span>
              96% Target Achieved
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          right: '-20px',
          top: '-20px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 116, 144, 0.06) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* ROW 1: 5 PERFORMANCE KPI CARDS (MATCHING REFERENCE DESIGN) */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', width: '100%' }}>
          {/* Card 1: Conversion */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversion Rate</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>41.4%</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={13} /> 4.2% vs Last Month
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: 'fit-content' }}>
              Value based
            </div>
          </div>

          {/* Card 2: Proforma Invoice */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proforma Invoices</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>₹ 82.0 L</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={13} /> 12.6% vs Last Month
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: 'fit-content' }}>
              18 proforma invoices
            </div>
          </div>

          {/* Card 3: Invoiced */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoiced Value</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>₹ 68.5 L</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={13} /> 14.8% vs Last Month
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: 'fit-content' }}>
              16 invoices
            </div>
          </div>

          {/* Card 4: Collections */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collections</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>₹ 54.2 L</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                79.1% realised
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: 'fit-content' }}>
              This Month
            </div>
          </div>

          {/* Card 5: Calls Completed */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Calls Completed</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>186</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={13} /> 18 vs Last Month
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: 'fit-content' }}>
              Out: 142 • In: 44
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: MY SALES TREND & RECEIVABLE AGEING SUMMARY (EXACT REFERENCE DESIGN) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', width: '100%', alignItems: 'stretch' }}>
        {/* Panel 1: MY SALES TREND */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                MY SALES TREND
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select 
                  value={selectedTrendMonth}
                  onChange={(e) => setSelectedTrendMonth(e.target.value)}
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#475569',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="Jan">Jan</option>
                  <option value="Feb">Feb</option>
                  <option value="Mar">Mar</option>
                  <option value="Apr">Apr</option>
                  <option value="May">May</option>
                  <option value="Jun">Jun</option>
                  <option value="Jul">Jul</option>
                  <option value="Aug">Aug</option>
                  <option value="Sep">Sep</option>
                </select>
              </div>
            </div>

            {/* Chart Area with Y-Axis, Horizontal Gridlines, Stadium Rounded Bars */}
            <div style={{ display: 'flex', position: 'relative', marginTop: '10px' }}>
              {/* Y-Axis Labels */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                paddingRight: '12px',
                fontSize: '10px',
                fontWeight: '600',
                color: '#9CA3AF',
                height: '160px',
                userSelect: 'none',
                textAlign: 'right',
                minWidth: '32px'
              }}>
                <span>80 L</span>
                <span>60 L</span>
                <span>40 L</span>
                <span>20 L</span>
                <span>0 L</span>
              </div>

              {/* Bars Canvas with Dashed Lines */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Horizontal Dashed Gridlines */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ width: '100%', borderBottom: '1px dashed #E2E8F0' }}></div>
                  ))}
                </div>

                {/* Bars */}
                <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', position: 'relative', zIndex: 4, padding: '0 4px' }}>
                  {trendMonths.map((d, idx) => {
                    const isSelected = d.month === selectedTrendMonth;
                    const isHovered = hoveredTrendMonth === d.month;
                    const barHeightPct = Math.min(Math.max((d.val / 85) * 100, 15), 100);

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedTrendMonth(d.month)}
                        onMouseEnter={() => setHoveredTrendMonth(d.month)}
                        onMouseLeave={() => setHoveredTrendMonth(null)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          height: '100%',
                          flex: 1,
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        {/* Tooltip on Hover */}
                        {isHovered && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-36px',
                              backgroundColor: '#0F172A',
                              color: '#FFFFFF',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                              pointerEvents: 'none',
                              zIndex: 10,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '1px'
                            }}
                          >
                            <span>{d.valStr}</span>
                            <span style={{ fontSize: '8.5px', color: '#94A3B8', fontWeight: '600' }}>
                              {d.count} Sales Deals
                            </span>
                            <div 
                              style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '4px solid transparent',
                                borderRight: '4px solid transparent',
                                borderTop: '4px solid #0F172A'
                              }}
                            />
                          </div>
                        )}

                        {/* Stadium Rounded Bar */}
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '24px',
                            height: `${barHeightPct}%`,
                            backgroundColor: isHovered ? '#0284C7' : isSelected ? '#0070BA' : '#008CDD',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            transform: isHovered ? 'scaleY(1.04)' : 'scaleY(1)',
                            transformOrigin: 'bottom',
                            opacity: isHovered ? 1 : isSelected ? 0.95 : 0.85,
                            boxShadow: isHovered ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none'
                          }}
                        />

                        {/* X-Axis Month Label */}
                        <span 
                          style={{ 
                            position: 'absolute',
                            bottom: '-22px',
                            fontSize: '10.5px', 
                            color: isHovered ? '#0284C7' : isSelected ? '#0070BA' : '#9CA3AF', 
                            fontWeight: isHovered || isSelected ? '800' : '600'
                          }}
                        >
                          {d.month}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Horizontal Accent Line */}
                <div style={{ height: '3px', backgroundColor: '#EBF2F7', borderRadius: '3px', width: '100%', marginTop: '2px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: RECEIVABLE AGEING SUMMARY ("that table") */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                RECEIVABLE AGEING SUMMARY
              </span>
            </div>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <thead>
                <tr style={{ color: '#64748B', textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px 6px 0', borderBottom: '1px solid #E2E8F0', fontSize: '10.5px', fontWeight: '700' }}>Ageing</th>
                  <th style={{ padding: '6px 4px', borderBottom: '1px solid #E2E8F0', fontSize: '10.5px', fontWeight: '700', textAlign: 'right' }}>Invoiced</th>
                  <th style={{ padding: '6px 4px', borderBottom: '1px solid #E2E8F0', fontSize: '10.5px', fontWeight: '700', textAlign: 'right' }}>% Share</th>
                  <th style={{ padding: '6px 0 6px 4px', borderBottom: '1px solid #E2E8F0', fontSize: '10.5px', fontWeight: '700', textAlign: 'right' }}>Invoices</th>
                </tr>
              </thead>
              <tbody>
                {ageingData.map((a, idx) => (
                  <tr key={idx} style={{ color: '#1E293B' }}>
                    <td style={{ padding: '6px 4px 6px 0', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      <span style={{ width: '7px', height: '7px', backgroundColor: a.color, borderRadius: '50%', flexShrink: 0 }}></span>
                      {a.range}
                    </td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '600' }}>{a.val}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: '#64748B' }}>{a.share}</td>
                    <td style={{ padding: '6px 0 6px 4px', textAlign: 'right', fontWeight: '600' }}>{a.count}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: '800', color: '#1E3A8A' }}>
                  <td style={{ padding: '8px 4px 4px 0', borderTop: '2px solid #E2E8F0' }}>Total</td>
                  <td style={{ padding: '8px 4px 4px 4px', borderTop: '2px solid #E2E8F0', textAlign: 'right' }}>₹3.84Cr</td>
                  <td style={{ padding: '8px 4px 4px 4px', borderTop: '2px solid #E2E8F0', textAlign: 'right' }}>100%</td>
                  <td style={{ padding: '8px 0 4px 4px', borderTop: '2px solid #E2E8F0', textAlign: 'right' }}>160</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROW 3: RECENTLY ISSUED INVOICES & OVERDUE PAYMENT INVOICES (MATCHING REFERENCE DESIGN) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '14px', width: '100%', alignItems: 'stretch' }}>
        {/* Left Table: RECENTLY ISSUED INVOICES */}
        <div className="section-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                RECENTLY ISSUED INVOICES
              </span>
              <span style={{ fontSize: '9.5px', color: '#059669', fontWeight: '800', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '6px' }}>ZOHO SYNC</span>
            </div>
          </div>

          <div style={{ border: '1px solid #F1F5F9', borderRadius: '12px', overflowX: 'auto', backgroundColor: '#FFFFFF' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Invoice No. <ArrowUpDown style={{ width: '12px', height: '12px', color: '#94A3B8' }} />
                    </div>
                  </th>
                  <th style={{ padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px' }}>Customer / Client</th>
                  <th style={{ padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px' }}>Amount</th>
                  <th style={{ padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentlyIssuedInvoices.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === recentlyIssuedInvoices.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontWeight: '600' }}>{r.no}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0F172A' }}>{r.client}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0F172A' }}>{r.amount}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: r.status === 'Paid' ? '#DCFCE7' : r.status === 'Pending' ? '#FEF3C7' : '#FEE2E2',
                        color: r.status === 'Paid' ? '#166534' : r.status === 'Pending' ? '#92400E' : '#991B1B',
                        border: `1px solid ${r.status === 'Paid' ? '#BBF7D0' : r.status === 'Pending' ? '#FDE68A' : '#FECACA'}`
                      }}>
                        {r.status === 'Paid' && <Check size={12} />}
                        {r.status === 'Pending' && <AlertCircle size={12} />}
                        {r.status === 'Overdue' && <X size={12} />}
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table: OVERDUE PAYMENT INVOICES */}
        <div className="section-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                OVERDUE PAYMENT INVOICES
              </span>
              <span style={{ fontSize: '9.5px', color: '#DC2626', fontWeight: '800', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: '6px' }}>ATTENTION</span>
            </div>
          </div>

          <div style={{ border: '1px solid #F1F5F9', borderRadius: '12px', overflowX: 'auto', backgroundColor: '#FFFFFF' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Invoice No. <ArrowUpDown style={{ width: '12px', height: '12px', color: '#94A3B8' }} />
                    </div>
                  </th>
                  <th style={{ padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px' }}>Customer</th>
                  <th style={{ padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px' }}>Amount</th>
                  <th style={{ padding: '10px 14px', color: '#64748B', fontWeight: '700', fontSize: '11px' }}>Overdue Days</th>
                </tr>
              </thead>
              <tbody>
                {overduePaymentInvoices.map((o, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === overduePaymentInvoices.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontWeight: '600' }}>{o.no}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0F172A' }}>{o.customer}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0F172A' }}>{o.amount}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FEE2E2',
                          fontSize: '11px',
                          fontWeight: '700',
                          lineHeight: 1.2
                        }}
                      >
                        <Clock style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                        <span>{o.overdueDays}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROW 4: TODAY'S SNAPSHOT (MATCHING REFERENCE DESIGN) */}
      <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TODAY'S SNAPSHOT</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {todaySnapshotData.map((s, idx) => (
            <div key={idx} style={{ padding: '12px 10px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '74px', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textAlign: 'center', lineHeight: '1.2' }}>{s.label}</span>
              <strong style={{ fontSize: '18px', color: s.color, fontWeight: '900', lineHeight: '1', marginTop: '6px' }}>{s.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 4: FOLLOW-UP AND OPPORTUNITIES TABLE + ACTIVITY SUMMARY & EXPIRY ALERTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '16px', width: '100%', alignItems: 'start' }}>
        {/* Table: Follow-up and Opportunity List */}
        <div className="section-card" style={{ padding: '0', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Follow-up and Opportunity List — Selected Period
            </span>
            <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '700' }}>
              {followupsData.length} Live Opportunities
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '36px', padding: '12px 14px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={currentFollowupRows.length > 0 && currentFollowupRows.every(r => selectedFollowups.includes(r.id))}
                      onChange={() => {
                        if (currentFollowupRows.every(r => selectedFollowups.includes(r.id))) {
                          setSelectedFollowups([]);
                        } else {
                          setSelectedFollowups(currentFollowupRows.map(r => r.id));
                        }
                      }}
                      style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Customer / Opportunity</th>
                  <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Offer Value</th>
                  <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Next Follow-up</th>
                  <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Stage</th>
                  <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Age</th>
                  <th style={{ padding: '12px 14px', fontWeight: '800', color: '#475569' }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {currentFollowupRows.map((row) => {
                  const isSelected = selectedFollowups.includes(row.id);
                  return (
                    <tr
                      key={row.id}
                      className="table-row-hover"
                      style={{
                        backgroundColor: isSelected ? '#ECFEFF' : 'transparent',
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{
                        padding: '12px 14px',
                        textAlign: 'center',
                        borderLeft: isSelected ? '4px solid #0E7490' : '4px solid transparent'
                      }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) setSelectedFollowups(selectedFollowups.filter(i => i !== row.id));
                            else setSelectedFollowups([...selectedFollowups, row.id]);
                          }}
                          style={{ accentColor: '#0E7490', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1E293B' }}>{row.customer}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0E7490' }}>{row.offerValue}</td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>{row.nextFollowup}</td>
                      <td style={{ padding: '12px 14px', color: '#64748B', fontWeight: '600' }}>{row.stage}</td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>{row.age}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          backgroundColor: row.priority === 'HIGH' ? '#FEE2E2' : '#FEF3C7',
                          color: row.priority === 'HIGH' ? '#EF4444' : '#D97706'
                        }}>
                          {row.priority}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Standard Pagination Footer Layout (AGENTS.md strict rules) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Showing per page</span>
              <select
                value={followupRowsPerPage}
                onChange={(e) => { setFollowupRowsPerPage(parseInt(e.target.value)); setFollowupPage(1); }}
                style={{ height: '30px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '12px', fontWeight: '600', color: '#334155' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
              <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>
                Showing {(followupPage - 1) * followupRowsPerPage + 1} to {Math.min(followupPage * followupRowsPerPage, followupsData.length)} of {followupsData.length} entries
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={followupPage === 1}
                onClick={() => setFollowupPage(1)}
                style={{ width: '28px', height: '28px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF', cursor: followupPage === 1 ? 'not-allowed' : 'pointer', color: '#475569', fontWeight: 'bold', fontSize: '11px' }}
              >
                &lt;&lt;
              </button>
              <button
                disabled={followupPage === 1}
                onClick={() => setFollowupPage(p => p - 1)}
                style={{ width: '28px', height: '28px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF', cursor: followupPage === 1 ? 'not-allowed' : 'pointer', color: '#475569', fontWeight: 'bold', fontSize: '11px' }}
              >
                &lt;
              </button>
              {Array.from({ length: totalFollowupPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFollowupPage(idx + 1)}
                  style={{
                    width: '28px',
                    height: '28px',
                    border: followupPage === idx + 1 ? 'none' : '1px solid #CBD5E1',
                    borderRadius: '6px',
                    backgroundColor: followupPage === idx + 1 ? '#0E7490' : '#FFFFFF',
                    color: followupPage === idx + 1 ? '#FFFFFF' : '#475569',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={followupPage === totalFollowupPages}
                onClick={() => setFollowupPage(p => p + 1)}
                style={{ width: '28px', height: '28px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF', cursor: followupPage === totalFollowupPages ? 'not-allowed' : 'pointer', color: '#475569', fontWeight: 'bold', fontSize: '11px' }}
              >
                &gt;
              </button>
              <button
                disabled={followupPage === totalFollowupPages}
                onClick={() => setFollowupPage(totalFollowupPages)}
                style={{ width: '28px', height: '28px', border: '1px solid #CBD5E1', borderRadius: '6px', backgroundColor: '#FFFFFF', cursor: followupPage === totalFollowupPages ? 'not-allowed' : 'pointer', color: '#475569', fontWeight: 'bold', fontSize: '11px' }}
              >
                &gt;&gt;
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Go to page</span>
                <input
                  type="number"
                  value={followupGoTo}
                  onChange={(e) => setFollowupGoTo(e.target.value)}
                  placeholder="1"
                  style={{ width: '40px', height: '28px', border: '1px solid #CBD5E1', borderRadius: '6px', textAlign: 'center', fontSize: '12px' }}
                />
                <button
                  onClick={() => {
                    const p = parseInt(followupGoTo);
                    if (p >= 1 && p <= totalFollowupPages) setFollowupPage(p);
                  }}
                  style={{ height: '28px', padding: '0 8px', backgroundColor: '#0E7490', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Go ›
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stack: Activity Summary + Risk & Expiry Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card: Activity Summary */}
          <div className="section-card" style={{ padding: '18px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Activity Summary — Selected Period
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#475569' }}>Calls completed</span>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#0F172A', fontSize: '13px' }}>186</strong>
                  <span style={{ fontSize: '10.5px', color: '#94A3B8', marginLeft: '6px' }}>Out 142 / In 44</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#475569' }}>Customer meetings</span>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#0F172A', fontSize: '13px' }}>28</strong>
                  <span style={{ fontSize: '10.5px', color: '#94A3B8', marginLeft: '6px' }}>Target 20</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#475569' }}>Offers sent</span>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#0F172A', fontSize: '13px' }}>36</strong>
                  <span style={{ fontSize: '10.5px', color: '#94A3B8', marginLeft: '6px' }}>Target 32</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#475569' }}>Follow-ups completed</span>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#0F172A', fontSize: '13px' }}>142</strong>
                  <span style={{ fontSize: '10.5px', color: '#16A34A', marginLeft: '6px', fontWeight: '700' }}>91% on time</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#475569' }}>Proforma invoices</span>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#0F172A', fontSize: '13px' }}>18</strong>
                  <span style={{ fontSize: '10.5px', color: '#0E7490', marginLeft: '6px', fontWeight: '700' }}>₹ 82.0 L</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span style={{ color: '#475569' }}>Invoices</span>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#0F172A', fontSize: '13px' }}>16</strong>
                  <span style={{ fontSize: '10.5px', color: '#EA580C', marginLeft: '6px', fontWeight: '700' }}>₹ 68.5 L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Opportunity Risk & Expiry Alerts */}
          <div className="section-card" style={{ padding: '18px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Opportunity Risk and Expiry Alerts
            </div>

            {/* Inactive Alert Sub-block */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Inactive Above 15 Days
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>ABC Solar</span>
                  <span style={{ fontWeight: '700' }}>₹ 12.4 L <span style={{ color: '#DC2626' }}>(18 days)</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>Green Infra</span>
                  <span style={{ fontWeight: '700' }}>₹ 9.8 L <span style={{ color: '#DC2626' }}>(16 days)</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>Kaveri Energy</span>
                  <span style={{ fontWeight: '700' }}>₹ 4.6 L <span style={{ color: '#DC2626' }}>(21 days)</span></span>
                </div>
              </div>
            </div>

            {/* Expiring Alert Sub-block */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Offers Expiring This Week
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>Bright Energy</span>
                  <span style={{ fontWeight: '700' }}>₹ 8.2 L <span style={{ color: '#D97706' }}>(02 Sep)</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>Sun Power EPC</span>
                  <span style={{ fontWeight: '700' }}>₹ 6.7 L <span style={{ color: '#D97706' }}>(04 Sep)</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                  <span>Nova Energy</span>
                  <span style={{ fontWeight: '700' }}>₹ 3.1 L <span style={{ color: '#D97706' }}>(05 Sep)</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 5: CUSTOMER OUTSTANDING & CREDIT + LOST / CANCELLED OPPORTUNITIES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', width: '100%', alignItems: 'start' }}>
        {/* Table: Customer Outstanding and Credit Status */}
        <div className="section-card" style={{ padding: '0', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Customer Outstanding and Credit Status — Selected Period
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Invoiced</th>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Outstanding</th>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Overdue</th>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Credit Limit</th>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'center' }}>Credit Status</th>
                </tr>
              </thead>
              <tbody>
                {outstandingData.map(c => (
                  <tr key={c.id} className="table-row-hover" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#1E293B' }}>{c.customer}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{c.invoiced}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>{c.outstanding}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: c.overdue !== '—' ? '#DC2626' : '#64748B' }}>{c.overdue}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B' }}>{c.creditLimit}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: c.creditStatus === 'Within limit' ? '#DCFCE7' : c.creditStatus === '72% used' ? '#FEF3C7' : '#FEE2E2',
                        color: c.creditStatus === 'Within limit' ? '#166534' : c.creditStatus === '72% used' ? '#92400E' : '#991B1B'
                      }}>
                        {c.creditStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table: Lost and Cancelled Opportunities */}
        <div className="section-card" style={{ padding: '0', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', backgroundColor: '#0F172A', color: '#FFFFFF', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Lost and Cancelled Opportunities — Selected Period
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'left' }}>Opportunity</th>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Value</th>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'left' }}>Reason</th>
                  <th style={{ padding: '10px 14px', fontWeight: '800', color: '#475569', textAlign: 'right' }}>Closed Date</th>
                </tr>
              </thead>
              <tbody>
                {lostCancelledData.map(l => (
                  <tr key={l.id} className="table-row-hover" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#1E293B' }}>{l.opportunity}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>{l.value}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: l.status === 'Lost' ? '#FEE2E2' : '#F1F5F9',
                        color: l.status === 'Lost' ? '#DC2626' : '#64748B'
                      }}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{l.reason}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94A3B8' }}>{l.closedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '8px 14px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right', fontSize: '11px', color: '#DC2626', fontWeight: '700' }}>
            Total lost / cancelled value: ₹ 14.7 L
          </div>
        </div>
      </div>

      {/* ROW 6: SELECTED PERIOD QUICK SUMMARY FOOTER RIBBON */}
      <div style={{
        backgroundColor: '#0F172A',
        borderRadius: '14px',
        padding: '16px 20px',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Selected Period Quick Summary — {selectedPeriod}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', textAlign: 'center' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>New leads</span>
            <strong style={{ fontSize: '18px', color: '#FFFFFF' }}>34</strong>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>Outgoing calls</span>
            <strong style={{ fontSize: '18px', color: '#FFFFFF' }}>142</strong>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>Incoming calls</span>
            <strong style={{ fontSize: '18px', color: '#FFFFFF' }}>44</strong>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>Meetings</span>
            <strong style={{ fontSize: '18px', color: '#FFFFFF' }}>28</strong>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>Offers sent</span>
            <strong style={{ fontSize: '18px', color: '#FFFFFF' }}>36</strong>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>Proforma invoices</span>
            <strong style={{ fontSize: '18px', color: '#38BDF8' }}>18</strong>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>Invoice value</span>
            <strong style={{ fontSize: '18px', color: '#F59E0B' }}>₹ 68.5 L</strong>
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: '#94A3B8', display: 'block' }}>Collections</span>
            <strong style={{ fontSize: '18px', color: '#22C55E' }}>₹ 54.2 L</strong>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BAR FOR SELECTED FOLLOW-UPS */}
      {selectedFollowups.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10000
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>
            <strong style={{ color: '#0F172A', fontSize: '14px' }}>{selectedFollowups.length}</strong> Selected
          </span>

          <button
            onClick={() => alert(`Updating follow-up schedule for ${selectedFollowups.length} selected lead(s)`)}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              borderRadius: '10px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Edit3 size={14} style={{ color: '#0E7490' }} /> Reschedule Follow-up
          </button>

          <button
            onClick={() => {
              alert(`Marking ${selectedFollowups.length} follow-up(s) as completed`);
              setSelectedFollowups([]);
            }}
            style={{
              backgroundColor: '#0E7490',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={14} /> Mark Completed
          </button>

          <button
            onClick={() => setSelectedFollowups([])}
            title="Deselect all"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
