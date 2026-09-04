import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Users, CheckCircle2, AlertTriangle, AlertCircle, Phone,
  FileText, Calendar, Filter, ChevronDown, ArrowUpRight, ArrowDownRight,
  Clock, ShieldAlert, Sparkles, RefreshCw, Layers, DollarSign, ChevronRight,
  ChevronLeft, Edit3, Trash2, X, MoreHorizontal, ExternalLink, ArrowRight,
  Check, Eye, Search, SlidersHorizontal, BarChart3, PieChart
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

  // Trend data
  const trendData = [
    { month: 'Apr', actual: 42, target: 45 },
    { month: 'May', actual: 48, target: 49 },
    { month: 'Jun', actual: 55, target: 54 },
    { month: 'Jul', actual: 61, target: 60 },
    { month: 'Aug', actual: 66, target: 65 },
    { month: 'Sep', actual: 70, target: 70 },
    { month: 'Oct', actual: 72, target: 75 }
  ];

  // Pagination for follow-up
  const totalFollowupPages = Math.ceil(followupsData.length / followupRowsPerPage) || 1;
  const currentFollowupRows = useMemo(() => {
    const start = (followupPage - 1) * followupRowsPerPage;
    return followupsData.slice(start, start + followupRowsPerPage);
  }, [followupPage, followupRowsPerPage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>



      {/* ROW 1: 8 SELECTED PERIOD PERFORMANCE CARDS */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px', width: '100%' }}>
          {/* Card 1: Target */}
          <div className="section-card" style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Target</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>₹ 75.0 L</div>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Selected period</span>
          </div>

          {/* Card 2: Achieved Sales */}
          <div className="section-card" style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Achieved Sales</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#16A34A' }}>₹ 72.0 L</div>
            <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: '700', backgroundColor: '#DCFCE7', padding: '1px 6px', borderRadius: '4px', width: 'fit-content' }}>
              96% achieved
            </span>
          </div>

          {/* Card 3: Offer Value */}
          <div className="section-card" style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Offer Value</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0284C7' }}>₹ 1.74 Cr</div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>36 quotations</span>
          </div>

          {/* Card 4: Conversion */}
          <div className="section-card" style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Conversion</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0E7490' }}>41.4%</div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Value based</span>
          </div>

          {/* Card 5: Proforma Invoice */}
          <div className="section-card" style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Proforma Invoice</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB' }}>₹ 82.0 L</div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>18 proforma invoices</span>
          </div>

          {/* Card 6: Invoiced */}
          <div className="section-card" style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Invoiced</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#EA580C' }}>₹ 68.5 L</div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>16 invoices</span>
          </div>

          {/* Card 7: Collections */}
          <div className="section-card" style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Collections</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>₹ 54.2 L</div>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>79.1% realised</span>
          </div>

          {/* Card 8: Calls Completed */}
          <div className="section-card" style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Calls Completed</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#8B5CF6' }}>186</div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Out: 142 • In: 44</span>
          </div>
        </div>
      </div>

      {/* ROW 2: MONTH TARGET RUN RATE & SALES FUNNEL */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '16px', width: '100%', alignItems: 'stretch' }}>
        {/* Card A: Target Progress & Run Rate */}
        <div className="section-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
              Month Target Progress and Required Run Rate
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '12px 8px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', display: 'block' }}>Monthly Target</span>
                <strong style={{ fontSize: '20px', color: '#0F172A', fontWeight: '800' }}>₹ 75.0 L</strong>
              </div>
              <div style={{ backgroundColor: '#F0FDF4', padding: '12px 8px', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600', display: 'block' }}>Achieved</span>
                <strong style={{ fontSize: '20px', color: '#16A34A', fontWeight: '800' }}>₹ 72.0 L</strong>
              </div>
              <div style={{ backgroundColor: '#FFFBEB', padding: '12px 8px', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: '11px', color: '#92400E', fontWeight: '600', display: 'block' }}>Balance</span>
                <strong style={{ fontSize: '20px', color: '#D97706', fontWeight: '800' }}>₹ 3.0 L</strong>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ width: '100%', height: '24px', backgroundColor: '#E2E8F0', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: '96%',
                height: '100%',
                backgroundColor: '#16A34A',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.5px'
              }}>
                96% achieved
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: '#0E7490' }} />
            <span>Required daily sales: <strong style={{ color: '#0E7490' }}>₹ 1.0 L</strong> for the remaining 3 working days</span>
          </div>
        </div>

        {/* Card B: Interactive Sales Funnel */}
        <div className="section-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
              My Sales Funnel — This Month
            </div>

            {/* 4 Pipeline Stage Blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {/* Stage 1: Offers */}
              <div style={{
                backgroundColor: '#0284C7',
                borderRadius: '12px',
                padding: '16px 12px',
                color: '#FFFFFF',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
              }}>
                <div style={{ fontSize: '26px', fontWeight: '900', lineHeight: '1' }}>36</div>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Offers</div>
                <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '2px 6px' }}>₹ 1.74 Cr</div>
              </div>

              {/* Stage 2: Qualified */}
              <div style={{
                backgroundColor: '#0E7490',
                borderRadius: '12px',
                padding: '16px 12px',
                color: '#FFFFFF',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(14, 116, 144, 0.2)'
              }}>
                <div style={{ fontSize: '26px', fontWeight: '900', lineHeight: '1' }}>25</div>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qualified</div>
                <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '2px 6px' }}>₹ 1.24 Cr</div>
              </div>

              {/* Stage 3: Proforma Invoice */}
              <div style={{
                backgroundColor: '#16A34A',
                borderRadius: '12px',
                padding: '16px 12px',
                color: '#FFFFFF',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
              }}>
                <div style={{ fontSize: '26px', fontWeight: '900', lineHeight: '1' }}>18</div>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proforma Invoice</div>
                <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '2px 6px' }}>₹ 82.0 L</div>
              </div>

              {/* Stage 4: Invoiced */}
              <div style={{
                backgroundColor: '#EA580C',
                borderRadius: '12px',
                padding: '16px 12px',
                color: '#FFFFFF',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)'
              }}>
                <div style={{ fontSize: '26px', fontWeight: '900', lineHeight: '1' }}>16</div>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoiced</div>
                <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '6px', padding: '2px 6px' }}>₹ 68.5 L</div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '12px',
            color: '#334155'
          }}>
            <span>Offer-to-Invoice conversion: <strong style={{ color: '#0E7490' }}>44.4%</strong></span>
            <span>•</span>
            <span>Average invoice value: <strong style={{ color: '#0E7490' }}>₹ 4.28 L</strong></span>
          </div>
        </div>
      </div>

      {/* ROW 3: SALES TREND, PRODUCT PERFORMANCE, TOP 10 CUSTOMERS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px', width: '100%', alignItems: 'stretch' }}>
        {/* Card A: Actual vs Target Trend Chart */}
        <div className="section-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              My Sales Trend — Actual vs Target
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontWeight: '700' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284C7' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#0284C7', borderRadius: '2px' }}></span> Actual sales
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
                <span style={{ width: '10px', height: '3px', backgroundColor: '#F59E0B', borderRadius: '1px' }}></span> Target
              </span>
            </div>
          </div>

          {/* Bar & Target Chart Graphic */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', minHeight: '180px', padding: '10px 10px 0 10px', borderBottom: '1px solid #E2E8F0', position: 'relative' }}>
            {trendData.map((d, idx) => {
              const heightPct = (d.actual / 80) * 100;
              const targetTop = 100 - (d.target / 80) * 100;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                  {/* Target Dot */}
                  <div style={{
                    position: 'absolute',
                    top: `${targetTop}%`,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#F59E0B',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 0 4px rgba(245, 158, 11, 0.6)',
                    zIndex: 3
                  }} />

                  {/* Value Above Bar */}
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
                    {d.actual}L
                  </span>

                  {/* Actual Sales Bar */}
                  <div style={{
                    width: '70%',
                    height: `${heightPct}%`,
                    backgroundColor: '#0284C7',
                    borderRadius: '6px 6px 0 0',
                    transition: 'all 0.2s ease'
                  }}></div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
            {trendData.map(d => <span key={d.month} style={{ flex: 1, textAlign: 'center' }}>{d.month}</span>)}
          </div>
        </div>

        {/* Card B: Product Performance — Value vs Target */}
        <div className="section-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Product Performance
              </span>
              <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600' }}>Value vs Target</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {productPerformance.map((p, idx) => {
                const maxVal = 40;
                const actPct = (p.actual / maxVal) * 100;
                const tgtPct = (p.target / maxVal) * 100;

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                      <span style={{ fontWeight: '700', color: '#334155' }}>{p.name}</span>
                      <span style={{ color: '#0E7490', fontWeight: '800' }}>{p.actualStr} / <span style={{ color: '#64748B', fontWeight: '500' }}>{p.targetStr}</span></span>
                    </div>
                    {/* Dual Progress Stack */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: `${tgtPct}%`, height: '100%', backgroundColor: '#FED7AA', position: 'absolute', top: 0, left: 0 }}></div>
                      <div style={{ width: `${actPct}%`, height: '100%', backgroundColor: '#0284C7', position: 'absolute', top: 0, left: 0, borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', fontSize: '10.5px', fontWeight: '700', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
            <span style={{ color: '#0284C7' }}>■ Actual value</span>
            <span style={{ color: '#F97316' }}>■ Target value</span>
          </div>
        </div>

        {/* Card C: Top 10 Customers Month Sales Contribution */}
        <div className="section-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Top 10 Customers — Month Sales
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '210px', overflowY: 'auto' }}>
              {topCustomers.map(c => (
                <div key={c.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', borderRadius: '6px', fontSize: '11.5px', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#94A3B8', fontSize: '10.5px' }}>{c.rank}</span>
                    <strong style={{ color: '#1E293B' }}>{c.name}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '700', color: '#0E7490' }}>{c.value}</span>
                    <span style={{ fontSize: '10.5px', color: '#64748B', width: '36px', textAlign: 'right' }}>{c.share}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', fontSize: '11px', color: '#16A34A', fontWeight: '700', textAlign: 'right' }}>
            Top 10 contribution: 83.1% of monthly sales
          </div>
        </div>
      </div>

      {/* ROW 4: FOLLOW-UP AND OPPORTUNITIES TABLE + ACTIVITY SUMMARY & EXPIRY ALERTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '16px', width: '100%', alignItems: 'start' }}>
        {/* Table: Follow-up and Opportunity List */}
        <div className="section-card" style={{ padding: '0', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
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
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
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
