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

  // Trend data: Apr - Oct (Actual vs Target)
  const [hoveredTrendMonth, setHoveredTrendMonth] = useState(null);
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

      {/* ROW 1: SELECTED PERIOD PERFORMANCE CARDS (REFERENCE DESIGN) */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', width: '100%' }}>
          {/* Card 1: Conversion */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversion</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>41.4%</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={13} strokeWidth={2.5} /> 4.2% vs Last Month
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: '100%', boxSizing: 'border-box' }}>
              Value based
            </div>
          </div>

          {/* Card 2: Proforma Invoice */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proforma Invoice</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>₹ 82.0 L</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={13} strokeWidth={2.5} /> 12.6% vs Last Month
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: '100%', boxSizing: 'border-box' }}>
              18 proforma invoices
            </div>
          </div>

          {/* Card 3: Invoiced */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoiced</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>₹ 68.5 L</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={13} strokeWidth={2.5} /> 14.8% vs Last Month
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: '100%', boxSizing: 'border-box' }}>
              16 invoices
            </div>
          </div>

          {/* Card 4: Collections */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collections</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>₹ 54.2 L</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                79.1% realised
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: '100%', boxSizing: 'border-box' }}>
              This Month
            </div>
          </div>

          {/* Card 5: Calls Completed */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Calls Completed</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>186</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={13} strokeWidth={2.5} /> 18 vs Last Month
              </span>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: '#64748B', fontWeight: '600', width: '100%', boxSizing: 'border-box' }}>
              Out: 142 • In: 44
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: MONTH TARGET RUN RATE & SALES FUNNEL */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '12px', width: '100%', alignItems: 'stretch' }}>
        {/* Card A: Target Progress & Run Rate */}
        <div className="section-card" style={{ padding: '14px 18px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Month Target Progress and Required Run Rate
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '8px 6px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600', display: 'block' }}>Monthly Target</span>
                <strong style={{ fontSize: '16px', color: '#0F172A', fontWeight: '900' }}>₹ 75.0 L</strong>
              </div>
              <div style={{ backgroundColor: '#F0FDF4', padding: '8px 6px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: '10.5px', color: '#166534', fontWeight: '600', display: 'block' }}>Achieved</span>
                <strong style={{ fontSize: '16px', color: '#16A34A', fontWeight: '900' }}>₹ 72.0 L</strong>
              </div>
              <div style={{ backgroundColor: '#FFFBEB', padding: '8px 6px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: '10.5px', color: '#92400E', fontWeight: '600', display: 'block' }}>Balance</span>
                <strong style={{ fontSize: '16px', color: '#D97706', fontWeight: '900' }}>₹ 3.0 L</strong>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ width: '100%', height: '20px', backgroundColor: '#E2E8F0', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: '96%',
                height: '100%',
                backgroundColor: '#16A34A',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '10.5px',
                fontWeight: '800',
                letterSpacing: '0.5px'
              }}>
                96% achieved
              </div>
            </div>
          </div>

          <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} style={{ color: '#0E7490' }} />
            <span>Required daily sales: <strong style={{ color: '#0E7490' }}>₹ 1.0 L</strong> for the remaining 3 working days</span>
          </div>
        </div>

        {/* Card B: 3D Layered Sales Funnel matching User Reference */}
        <div className="section-card" style={{ padding: '14px 18px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', justifyContent: 'space-between', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                My Sales Funnel — This Month
              </div>
              <span style={{ fontSize: '10.5px', color: '#0E7490', fontWeight: '700', backgroundColor: '#ECFEFF', border: '1px solid #CFFAFE', padding: '2px 8px', borderRadius: '12px' }}>
                Conversion: 44.4%
              </span>
            </div>

            {/* Clean Flat 2D Sales Funnel matching Control Room Design System */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
              {[
                {
                  label: 'OFFERS',
                  count: '36 Deals',
                  value: '₹ 1.74 Cr',
                  pct: '100%',
                  bgColor: '#EDE9FE',
                  barColor: '#8B5CF6',
                  textColor: '#5B21B6',
                  width: '100%'
                },
                {
                  label: 'QUALIFIED',
                  count: '25 Deals',
                  value: '₹ 1.24 Cr',
                  pct: '69.4%',
                  bgColor: '#FCE7F3',
                  barColor: '#EC4899',
                  textColor: '#9D174D',
                  width: '88%'
                },
                {
                  label: 'PROFORMA INVOICES',
                  count: '18 Deals',
                  value: '₹ 82.0 L',
                  pct: '50.0%',
                  bgColor: '#E0F2FE',
                  barColor: '#0284C7',
                  textColor: '#0369A1',
                  width: '74%'
                },
                {
                  label: 'INVOICED',
                  count: '16 Deals',
                  value: '₹ 68.5 L',
                  pct: '44.4%',
                  bgColor: '#DCFCE7',
                  barColor: '#16A34A',
                  textColor: '#15803D',
                  width: '60%'
                }
              ].map((tier, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div
                    style={{
                      width: tier.width,
                      backgroundColor: tier.barColor,
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.01)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>
                        {tier.label}
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: '10px' }}>
                        {tier.count}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>
                        {tier.value}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '11px',
            color: '#334155',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            <span>Offer-to-Invoice conversion: <strong style={{ color: '#0E7490' }}>44.4%</strong></span>
            <span>•</span>
            <span>Average invoice value: <strong style={{ color: '#0E7490' }}>₹ 4.28 L</strong></span>
          </div>
        </div>
      </div>

      {/* ROW 3: SALES TREND, PRODUCT PERFORMANCE, TOP 10 CUSTOMERS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', width: '100%', alignItems: 'stretch' }}>
        {/* Card A: Actual vs Target Trend Chart */}
        <div className="section-card" style={{ padding: '14px 18px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              MY SALES TREND
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0284C7', fontSize: '11px', fontWeight: '700' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#0284C7', borderRadius: '2px' }}></span> Actual sales
              </span>
            </div>
          </div>

          {/* Chart Canvas with Y-Axis, Rounded Stadium Bars, and Hover-only Tooltip */}
          <div style={{ display: 'flex', position: 'relative' }}>
            {/* Y-Axis Labels (0, 20L, 40L, 60L, 80L) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingRight: '10px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#94A3B8',
              height: '160px',
              userSelect: 'none',
              textAlign: 'right',
              minWidth: '28px'
            }}>
              <span>80 L</span>
              <span>60 L</span>
              <span>40 L</span>
              <span>20 L</span>
              <span>0 L</span>
            </div>

            {/* Bars Area with Background Dashed Gridlines */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Horizontal Gridlines */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ width: '100%', borderBottom: '1px dashed #E2E8F0' }}></div>
                ))}
              </div>

              {/* Bar Columns Container */}
              <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', position: 'relative', zIndex: 4, padding: '0 4px' }}>
                {trendData.map((d) => {
                  const heightPct = (d.actual / 80) * 100;
                  const isHovered = hoveredTrendMonth === d.month;

                  return (
                    <div
                      key={d.month}
                      onMouseEnter={() => setHoveredTrendMonth(d.month)}
                      onMouseLeave={() => setHoveredTrendMonth(null)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Tooltip visible ONLY on hover */}
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          bottom: `${heightPct + 10}%`,
                          zIndex: 20,
                          backgroundColor: '#0F172A',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          <span style={{ color: '#FFFFFF' }}>₹ {d.actual} L</span>
                          {/* Tooltip triangle beak */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid #0F172A'
                          }} />
                        </div>
                      )}

                      {/* Smooth Stadium-Rounded Bar */}
                      <div
                        style={{
                          width: '28px',
                          maxWidth: '75%',
                          height: `${heightPct}%`,
                          backgroundColor: isHovered ? '#0284C7' : '#0284C7',
                          backgroundImage: isHovered
                            ? 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)'
                            : 'linear-gradient(180deg, #0284C7 0%, #0369A1 100%)',
                          borderRadius: '14px',
                          transition: 'all 0.2s ease',
                          boxShadow: isHovered
                            ? '0 6px 14px rgba(2, 132, 199, 0.4)'
                            : '0 1px 3px rgba(0,0,0,0.06)',
                          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Bottom Baseline */}
              <div style={{ width: '100%', height: '2px', backgroundColor: '#E2E8F0', marginTop: '4px' }}></div>

              {/* Month X-Axis Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', paddingLeft: '4px', paddingRight: '4px', fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                {trendData.map(d => {
                  const isHovered = hoveredTrendMonth === d.month;
                  return (
                    <span
                      key={d.month}
                      onMouseEnter={() => setHoveredTrendMonth(d.month)}
                      onMouseLeave={() => setHoveredTrendMonth(null)}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                        color: isHovered ? '#0284C7' : '#64748B',
                        fontWeight: isHovered ? '800' : '600',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {d.month}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Product Sale Comparison (matching user reference design) */}
        <div className="section-card" style={{ padding: '14px 18px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', position: 'relative', height: '100%', justifyContent: 'space-between', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          {/* Header without icon */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              PRODUCT SALE COMPARISON
            </span>
          </div>

          {/* Background vertical subtle gridlines */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: '100%', borderRight: '1px dashed #F1F5F9' }}></div>
              ))}
            </div>

            {/* SVG Pattern Definition for striped/hatched bars */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#94A3B8" strokeWidth="2.5" strokeOpacity="0.55" />
                </pattern>
              </defs>
            </svg>

            {/* List of Products */}
            {productPerformance.map((p, idx) => {
              const maxVal = 35.0;
              const pct = (p.actual / maxVal) * 100;
              const isTop = idx === 0;

              return (
                <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Title & Sales Value */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1E293B' }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#94A3B8' }}>
                      {p.actualStr}
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div style={{ width: '100%', height: '8px', position: 'relative' }}>
                    {isTop ? (
                      /* Top item: Same Vibrant Blue Gradient Bar as MY SALES TREND */
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '8px',
                          borderRadius: '4px',
                          background: 'linear-gradient(90deg, #38BDF8 0%, #0284C7 60%, #0369A1 100%)',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    ) : (
                      /* Other items: Diagonal Patterned Hatched Bar */
                      <svg width={`${pct}%`} height="8" style={{ display: 'block', overflow: 'hidden', borderRadius: '4px' }}>
                        <rect
                          width="100%"
                          height="8"
                          rx="4"
                          ry="4"
                          fill="url(#diagonalHatch)"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card C: Top 10 Customers Month Sales Contribution (Styled like RECEIVABLE AGEING SUMMARY reference) */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          {/* Card Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOP 10 CUSTOMERS — MONTH SALES
            </span>
          </div>

          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr',
            paddingBottom: '6px',
            borderBottom: '1px solid #E2E8F0',
            fontSize: '10.5px',
            fontWeight: '700',
            color: '#64748B'
          }}>
            <div>Customer</div>
            <div style={{ textAlign: 'right' }}>Sales Value</div>
            <div style={{ textAlign: 'right' }}>% Share</div>
          </div>

          {/* Table Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '205px', overflowY: 'auto' }}>
            {topCustomers.map((c, idx) => {
              const dotColors = [
                '#16A34A', // green
                '#65A30D', // lime green
                '#84CC16', // light olive
                '#CA8A04', // amber
                '#EA580C', // orange
                '#DC2626', // red
                '#EF4444', // red
                '#EC4899', // pink
                '#8B5CF6', // violet
                '#6366F1'  // indigo
              ];
              const dotColor = dotColors[idx] || '#64748B';

              return (
                <div
                  key={c.rank}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr 1fr',
                    alignItems: 'center',
                    padding: '7px 0',
                    borderBottom: '1px solid #F8FAFC',
                    fontSize: '11px',
                    lineHeight: '1.3'
                  }}
                >
                  {/* Customer with Dot Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, paddingRight: '4px' }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      flexShrink: 0
                    }} />
                    <span style={{ fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </span>
                  </div>

                  {/* Value */}
                  <div style={{ textAlign: 'right', fontWeight: '600', color: '#1E293B' }}>
                    {c.value}
                  </div>

                  {/* % Share */}
                  <div style={{ textAlign: 'right', color: '#64748B' }}>
                    {c.share}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Total Row matching reference */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr',
            alignItems: 'center',
            paddingTop: '8px',
            marginTop: '6px',
            borderTop: '2px solid #E2E8F0',
            fontSize: '11.5px',
            fontWeight: '800',
            color: '#1E3A8A'
          }}>
            <div>Total (Top 10)</div>
            <div style={{ textAlign: 'right', color: '#1E3A8A' }}>₹ 59.8 L</div>
            <div style={{ textAlign: 'right', color: '#1E3A8A' }}>83.1%</div>
          </div>
        </div>
      </div>

      {/* ROW 4: FOLLOW-UP AND OPPORTUNITIES TABLE + ACTIVITY SUMMARY & EXPIRY ALERTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '16px', width: '100%', alignItems: 'start' }}>
        {/* Table: Follow-up and Opportunity List (Styled like OVERDUE PAYMENT INVOICES reference) */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          {/* Card Header matching OVERDUE PAYMENT INVOICES style */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Follow-up and Opportunity List — Selected Period
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #DBEAFE'
            }}>
              {followupsData.length} LIVE OPPORTUNITIES
            </span>
          </div>

          {/* Table Container with rounded border matching reference */}
          <div style={{ border: '1px solid #F1F5F9', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ width: '36px', padding: '10px 14px', textAlign: 'center' }}>
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
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Customer / Opportunity <ArrowUpDown size={11} style={{ opacity: 0.6 }} />
                      </div>
                    </th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px' }}>Offer Value</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px' }}>Next Follow-up</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px' }}>Stage</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px' }}>Age</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px' }}>Priority</th>
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
                          padding: '10px 14px',
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
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: '#1E293B' }}>{row.customer}</td>
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: '#1E293B' }}>{row.offerValue}</td>
                        <td style={{ padding: '10px 14px', color: '#475569', fontWeight: '500' }}>{row.nextFollowup}</td>
                        <td style={{ padding: '10px 14px', color: '#64748B', fontWeight: '600' }}>{row.stage}</td>
                        <td style={{ padding: '10px 14px', color: '#64748B' }}>{row.age}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '14px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: row.priority === 'HIGH' ? '#FEF2F2' : '#FFFBEB',
                            border: `1px solid ${row.priority === 'HIGH' ? '#FEE2E2' : '#FEF3C7'}`,
                            color: row.priority === 'HIGH' ? '#DC2626' : '#D97706'
                          }}>
                            {row.priority === 'HIGH' && <Clock size={11} />}
                            {row.priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Standard Pagination Footer Layout (AGENTS.md strict rules) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', backgroundColor: '#FFFFFF', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Showing per page</span>
              <select
                value={followupRowsPerPage}
                onChange={(e) => { setFollowupRowsPerPage(parseInt(e.target.value)); setFollowupPage(1); }}
                style={{ height: '30px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '12px', fontWeight: '600', color: '#334155' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                Showing {(followupPage - 1) * followupRowsPerPage + 1} to {Math.min(followupPage * followupRowsPerPage, followupsData.length)} of {followupsData.length} entries
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
                    cursor: 'pointer',
                    fontSize: '11px'
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
          {/* Card: Activity Summary (Styled like RECEIVABLE AGEING SUMMARY reference) */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ACTIVITY SUMMARY — SELECTED PERIOD
              </span>
            </div>

            {/* Sub-header matching reference table */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              paddingBottom: '6px',
              borderBottom: '1px solid #E2E8F0',
              fontSize: '10.5px',
              fontWeight: '700',
              color: '#64748B'
            }}>
              <div>Activity</div>
              <div style={{ textAlign: 'right' }}>Achieved / Metric</div>
            </div>

            {/* Rows with Dot indicators matching RECEIVABLE AGEING SUMMARY */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Calls completed', count: '186', sub: 'Out 142 / In 44', color: '#0284C7' },
                { label: 'Customer meetings', count: '28', sub: 'Target 20', color: '#0D9488' },
                { label: 'Offers sent', count: '36', sub: 'Target 32', color: '#8B5CF6' },
                { label: 'Follow-ups completed', count: '142', sub: '91% on time', color: '#16A34A' },
                { label: 'Proforma invoices', count: '18', sub: '₹ 82.0 L', color: '#0E7490' },
                { label: 'Invoices', count: '16', sub: '₹ 68.5 L', color: '#EA580C' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid #F8FAFC',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                    <span style={{ color: '#1E293B', fontWeight: '600' }}>{item.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: '#1E293B', fontSize: '12px' }}>{item.count}</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748B', marginLeft: '6px' }}>{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Row matching reference */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              alignItems: 'center',
              paddingTop: '8px',
              marginTop: '4px',
              borderTop: '2px solid #E2E8F0',
              fontSize: '11.5px',
              fontWeight: '800',
              color: '#1E3A8A'
            }}>
              <div>Total Engagement Actions</div>
              <div style={{ textAlign: 'right', color: '#1E3A8A' }}>426 Interactions</div>
            </div>
          </div>

          {/* Card: Opportunity Risk & Expiry Alerts (Styled like OVERDUE PAYMENT INVOICES reference) */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Opportunity Risk and Expiry Alerts
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                letterSpacing: '0.5px',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FEE2E2'
              }}>
                ATTENTION
              </span>
            </div>

            {/* Inactive Alert Sub-block with pill badges matching reference */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Inactive Above 15 Days
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'ABC Solar', val: '₹ 12.4 L', delay: '18 Days Inactive' },
                  { name: 'Green Infra', val: '₹ 9.8 L', delay: '16 Days Inactive' },
                  { name: 'Kaveri Energy', val: '₹ 4.6 L', delay: '21 Days Inactive' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '11.5px' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '11.5px' }}>{item.val}</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FEE2E2',
                        color: '#DC2626',
                        fontSize: '10.5px',
                        fontWeight: '700'
                      }}>
                        <Clock size={10} /> {item.delay}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expiring Alert Sub-block with pill badges */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Offers Expiring This Week
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'Bright Energy', val: '₹ 8.2 L', date: '02 Sep Expiry' },
                  { name: 'Sun Power EPC', val: '₹ 6.7 L', date: '04 Sep Expiry' },
                  { name: 'Nova Energy', val: '₹ 3.1 L', date: '05 Sep Expiry' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '11.5px' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '11.5px' }}>{item.val}</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FEF3C7',
                        color: '#D97706',
                        fontSize: '10.5px',
                        fontWeight: '700'
                      }}>
                        <Clock size={10} /> {item.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 5: CUSTOMER OUTSTANDING & CREDIT + LOST / CANCELLED OPPORTUNITIES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', width: '100%', alignItems: 'start' }}>
        {/* Table: Customer Outstanding and Credit Status (Styled like OVERDUE PAYMENT INVOICES reference) */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Customer Outstanding and Credit Status — Selected Period
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#1E40AF',
              border: '1px solid #DBEAFE'
            }}>
              CREDIT STATUS
            </span>
          </div>

          <div style={{ border: '1px solid #F1F5F9', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Customer <ArrowUpDown size={11} style={{ opacity: 0.6 }} /></div>
                    </th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'right' }}>Invoiced</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'right' }}>Outstanding</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'right' }}>Overdue</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'right' }}>Credit Limit</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'center' }}>Credit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingData.map(c => (
                    <tr key={c.id} className="table-row-hover" style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#1E293B' }}>{c.customer}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{c.invoiced}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#1E293B' }}>{c.outstanding}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: c.overdue !== '—' ? '#DC2626' : '#64748B' }}>{c.overdue}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B' }}>{c.creditLimit}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '14px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: c.creditStatus === 'Within limit' ? '#ECFDF5' : c.creditStatus === '72% used' ? '#FFFBEB' : '#FEF2F2',
                          border: `1px solid ${c.creditStatus === 'Within limit' ? '#D1FAE5' : c.creditStatus === '72% used' ? '#FEF3C7' : '#FEE2E2'}`,
                          color: c.creditStatus === 'Within limit' ? '#059669' : c.creditStatus === '72% used' ? '#D97706' : '#DC2626'
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
        </div>

        {/* Table: Lost and Cancelled Opportunities (Styled like OVERDUE PAYMENT INVOICES reference) */}
        <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #EAEFEF', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Lost and Cancelled Opportunities — Selected Period
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FEE2E2'
            }}>
              ANALYSIS
            </span>
          </div>

          <div style={{ border: '1px solid #F1F5F9', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Opportunity <ArrowUpDown size={11} style={{ opacity: 0.6 }} /></div>
                    </th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'right' }}>Value</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'left' }}>Reason</th>
                    <th style={{ padding: '10px 14px', fontWeight: '700', color: '#64748B', fontSize: '11px', textAlign: 'right' }}>Closed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {lostCancelledData.map(l => (
                    <tr key={l.id} className="table-row-hover" style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#1E293B' }}>{l.opportunity}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#1E293B' }}>{l.value}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '14px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: l.status === 'Lost' ? '#FEF2F2' : '#F1F5F9',
                          border: `1px solid ${l.status === 'Lost' ? '#FEE2E2' : '#E2E8F0'}`,
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
            <div style={{ padding: '10px 14px', backgroundColor: '#F8FAFC', borderTop: '1px solid #F1F5F9', textAlign: 'right', fontSize: '11px', color: '#DC2626', fontWeight: '700' }}>
              Total lost / cancelled value: ₹ 14.7 L
            </div>
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
