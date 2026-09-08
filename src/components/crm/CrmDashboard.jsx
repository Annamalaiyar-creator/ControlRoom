import React from 'react';
import {
  TrendingUp, Users, CheckCircle2, AlertTriangle, AlertCircle, Phone,
  FileText, Calendar, Filter, ChevronDown, ArrowUpRight, ArrowDownRight,
  Clock, ShieldAlert, Sparkles, RefreshCw, Layers, DollarSign, ChevronRight,
  ChevronLeft, Edit3, Trash2, X, MoreHorizontal, ExternalLink, ArrowRight,
  Check, Eye, Search, SlidersHorizontal, BarChart3, PieChart, Tag, Plus, MessageSquare,
  Building2, Award, Truck, IndianRupee, Send
} from 'lucide-react';
import { STAGE_PROBABILITIES } from '../../services/crmStore';

export default function CrmDashboard({
  leads = [],
  opportunities = [],
  followups = [],
  quotations = [],
  onNavigateTab,
  onOpenOpportunity,
  onOpenLead,
  onUpdateOpportunityStage,
  onCreateLead,
  onCreateOpportunity
}) {
  // Compute Key Performance Indicators
  const totalLeadsCount = leads.length;
  const newLeadsCount = leads.filter(l => l.status === 'New Lead').length;
  const activeOpportunities = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost');
  const activeOpportunitiesCount = activeOpportunities.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const followupsToday = followups.filter(f => f.date === todayStr);
  const followupsTodayCount = followupsToday.length;

  const overdueFollowups = followups.filter(f => f.status === 'Overdue' || (f.date < todayStr && f.status !== 'Completed'));
  const overdueFollowupsCount = overdueFollowups.length;

  const quotationsSentCount = quotations.filter(q => q.status === 'Sent').length;
  const pendingConfirmationCount = opportunities.filter(o => o.stage === 'Confirmation Pending').length;

  const wonDeals = opportunities.filter(o => o.stage === 'Won');
  const wonDealsCount = wonDeals.length;
  const lostDealsCount = opportunities.filter(o => o.stage === 'Lost').length;

  const totalWonValue = wonDeals.reduce((sum, o) => sum + (parseFloat(o.dealValue) || 0), 0);
  const expectedSalesValue = activeOpportunities.reduce((sum, o) => {
    const prob = STAGE_PROBABILITIES[o.stage] || 50;
    return sum + ((parseFloat(o.dealValue) || 0) * (prob / 100));
  }, 0);

  // Pipeline stages configuration (10 Stages)
  const pipelineStages = [
    { id: 'New Lead', label: '1. New Lead', color: '#64748B', bg: '#F1F5F9' },
    { id: 'Contacted', label: '2. Contacted', color: '#0284C7', bg: '#E0F2FE' },
    { id: 'Qualified', label: '3. Qualified', color: '#2563EB', bg: '#DBEAFE' },
    { id: 'Requirement Received', label: '4. Requirement', color: '#7C3AED', bg: '#EDE9FE' },
    { id: 'BOM / Quotation', label: '5. BOM / Quote', color: '#D97706', bg: '#FEF3C7' },
    { id: 'Quotation Sent', label: '6. Quote Sent', color: '#EA580C', bg: '#FFEDD5' },
    { id: 'Negotiation', label: '7. Negotiation', color: '#C026D3', bg: '#FAE8FF' },
    { id: 'Confirmation Pending', label: '8. Confirmation', color: '#0D9488', bg: '#CCFBF1' },
    { id: 'Won', label: '9. Won 🎉', color: '#16A34A', bg: '#DCFCE7' },
    { id: 'Lost', label: '10. Lost', color: '#DC2626', bg: '#FEE2E2' }
  ];

  // Drag & drop handlers for Kanban pipeline
  const handleDragStart = (e, oppId) => {
    e.dataTransfer.setData('text/plain', oppId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain');
    if (oppId && onUpdateOpportunityStage) {
      onUpdateOpportunityStage(oppId, targetStage);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      {/* ─── 1. TOP HEADER & QUICK ACTION BAR ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
              Sales Command Center
            </h1>
            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#F0FDFA', color: '#0E7490', border: '1px solid #CCFBF1', padding: '3px 10px', borderRadius: '20px' }}>
              B2B Solar Mounting Systems
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Daily customer pipeline, live WhatsApp enquiries, quotation tracking & factory dispatch flow.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigateTab('WhatsApp')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#25D366', color: '#FFFFFF', border: 'none',
              padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '800',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,211,102,0.3)', transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={16} /> Open WhatsApp Inbox
          </button>

          <button
            onClick={onCreateLead}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#FFFFFF', color: '#0E7490', border: '1.5px solid #0E7490',
              padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '800',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} /> New Lead
          </button>

          <button
            onClick={onCreateOpportunity}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#0E7490', color: '#FFFFFF', border: 'none',
              padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '800',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,116,144,0.25)', transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} /> Create Opportunity
          </button>
        </div>
      </div>

      {/* ─── 2. 11 KPI CARDS GRID ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {/* Total Leads */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Total Leads</span>
            <Users size={16} color="#0284C7" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
            {totalLeadsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#0284C7', marginTop: '4px', fontWeight: '600' }}>
            {newLeadsCount} New Inquiries
          </div>
        </div>

        {/* Active Opportunities */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Active Deals</span>
            <TrendingUp size={16} color="#2563EB" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
            {activeOpportunitiesCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            In Active Negotiation
          </div>
        </div>

        {/* Follow-ups Today */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Follow-ups Today</span>
            <Calendar size={16} color="#0D9488" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0D9488', marginTop: '6px' }}>
            {followupsTodayCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            Scheduled for today
          </div>
        </div>

        {/* Overdue Follow-ups */}
        <div style={{ backgroundColor: overdueFollowupsCount > 0 ? '#FEF2F2' : '#FFFFFF', borderRadius: '14px', border: `1px solid ${overdueFollowupsCount > 0 ? '#FCA5A5' : '#E2E8F0'}`, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: overdueFollowupsCount > 0 ? '#DC2626' : '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Overdue Follow-ups</span>
            <AlertCircle size={16} color="#DC2626" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: overdueFollowupsCount > 0 ? '#DC2626' : '#0F172A', marginTop: '6px' }}>
            {overdueFollowupsCount}
          </div>
          <div style={{ fontSize: '11px', color: overdueFollowupsCount > 0 ? '#B91C1C' : '#64748B', marginTop: '4px', fontWeight: '600' }}>
            {overdueFollowupsCount > 0 ? 'Requires immediate call' : 'All cleared'}
          </div>
        </div>

        {/* Quotations Sent */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Quotes Sent</span>
            <FileText size={16} color="#EA580C" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
            {quotationsSentCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            Awaiting customer response
          </div>
        </div>

        {/* Pending Confirmation */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Confirmation Pending</span>
            <Clock size={16} color="#D97706" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#D97706', marginTop: '6px' }}>
            {pendingConfirmationCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            Close to closing
          </div>
        </div>

        {/* Won Deals */}
        <div style={{ backgroundColor: '#F0FDF4', borderRadius: '14px', border: '1px solid #BBF7D0', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#166534', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Won Deals</span>
            <CheckCircle2 size={16} color="#16A34A" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#166534', marginTop: '6px' }}>
            {wonDealsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#15803D', marginTop: '4px', fontWeight: '700' }}>
            Confirmed & Moving to BOM
          </div>
        </div>

        {/* Lost Deals */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Lost Deals</span>
            <X size={16} color="#94A3B8" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#64748B', marginTop: '6px' }}>
            {lostDealsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
            Closed Lost
          </div>
        </div>

        {/* Total Won Value */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Total Won Value</span>
            <IndianRupee size={16} color="#16A34A" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#166534', marginTop: '6px' }}>
            ₹ {(totalWonValue / 100000).toFixed(2)} L
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            Actual Billed / Confirmed
          </div>
        </div>

        {/* Expected Sales Value */}
        <div style={{ backgroundColor: '#F0FDFA', borderRadius: '14px', border: '1px solid #CCFBF1', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0E7490', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Weighted Pipeline</span>
            <Sparkles size={16} color="#0E7490" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#0E7490', marginTop: '6px' }}>
            ₹ {(expectedSalesValue / 100000).toFixed(2)} L
          </div>
          <div style={{ fontSize: '11px', color: '#0E7490', marginTop: '4px', fontWeight: '600' }}>
            Probability Weighted
          </div>
        </div>
      </div>

      {/* ─── 3. MORNING CHECKLIST / DAILY ACTION STRIP ─── */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0',
        padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              ☀️ Morning Priority Action Radar
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Immediate tasks to convert B2B solar structure inquiries today.
            </span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0E7490', backgroundColor: '#F0FDFA', padding: '4px 12px', borderRadius: '20px', border: '1px solid #CCFBF1' }}>
            {followupsTodayCount + overdueFollowupsCount} Urgent Touchpoints
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {/* Overdue alert */}
          {overdueFollowups.slice(0, 2).map((of, idx) => (
            <div key={idx} style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '9px', fontWeight: '900', padding: '1px 6px', borderRadius: '4px' }}>OVERDUE</span>
                  <strong style={{ fontSize: '12.5px', color: '#991B1B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{of.customerName}</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#7F1D1D', marginTop: '2px' }}>
                  {of.activityType}: {of.notes || 'Follow up required'}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('Follow-ups')}
                style={{ border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}
              >
                Call Now
              </button>
            </div>
          ))}

          {/* Today follow-up */}
          {followupsToday.slice(0, 2).map((tf, idx) => (
            <div key={idx} style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ backgroundColor: '#0D9488', color: '#FFFFFF', fontSize: '9px', fontWeight: '900', padding: '1px 6px', borderRadius: '4px' }}>TODAY {tf.time}</span>
                  <strong style={{ fontSize: '12.5px', color: '#0F766E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tf.customerName}</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#115E59', marginTop: '2px' }}>
                  {tf.activityType}: {tf.notes || 'Scheduled customer touchpoint'}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('WhatsApp')}
                style={{ border: 'none', backgroundColor: '#0E7490', color: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. KANBAN SALES PIPELINE (10 STAGES) ─── */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0',
        padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A', margin: 0 }}>
              Interactive Sales Pipeline (Drag & Drop)
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Drag deals across stages to automatically adjust win probabilities and trigger downstream BOM/Quotations.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
              Stage Probability Map:
            </span>
            <span style={{ fontSize: '10px', backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
              Quote 60% • Neg 75% • Confirmed 90%
            </span>
          </div>
        </div>

        {/* 10-Stage Horizontal Kanban Grid */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '14px' }}>
          {pipelineStages.map((stg) => {
            const stageOpps = opportunities.filter(o => o.stage === stg.id);
            const stageTotalVal = stageOpps.reduce((s, o) => s + (parseFloat(o.dealValue) || 0), 0);

            return (
              <div
                key={stg.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stg.id)}
                style={{
                  minWidth: '260px',
                  maxWidth: '280px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flexShrink: 0
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stg.color }}></span>
                    <strong style={{ fontSize: '12px', color: '#1E293B' }}>{stg.label}</strong>
                    <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: stg.bg, color: stg.color, padding: '1px 6px', borderRadius: '10px' }}>
                      {stageOpps.length}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                    ₹ {(stageTotalVal / 100000).toFixed(1)}L
                  </span>
                </div>

                {/* Cards in Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
                  {stageOpps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>
                      Drop deals here
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        onClick={() => onOpenOpportunity(opp)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          padding: '12px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong style={{ fontSize: '13px', color: '#0F172A', lineHeight: '1.3' }}>
                            {opp.customerName}
                          </strong>
                          <span style={{
                            fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
                            backgroundColor: opp.priority === 'HIGH' ? '#FEE2E2' : '#F1F5F9',
                            color: opp.priority === 'HIGH' ? '#DC2626' : '#64748B'
                          }}>
                            {opp.priority}
                          </span>
                        </div>

                        <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.3' }}>
                          {opp.title}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '900', color: '#0E7490' }}>
                            ₹ {parseFloat(opp.dealValue || 0).toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600' }}>
                            👤 {opp.salesperson}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94A3B8' }}>
                          <span>Close: {opp.expectedClosingDate || 'TBD'}</span>
                          {opp.bomCode && (
                            <span style={{ color: '#2563EB', fontWeight: '700', backgroundColor: '#EFF6FF', padding: '1px 5px', borderRadius: '4px' }}>
                              {opp.bomCode}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
