import React from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign, PieChart, Layers,
  CheckCircle2, ArrowUpRight, Award, Truck, Target
} from 'lucide-react';

export default function CrmReportsView({
  leads = [],
  opportunities = [],
  quotations = []
}) {
  const wonDeals = opportunities.filter(o => o.stage === 'Won');
  const lostDeals = opportunities.filter(o => o.stage === 'Lost');
  const totalWonValue = wonDeals.reduce((s, o) => s + (parseFloat(o.dealValue) || 0), 0);
  const totalPipelineValue = opportunities.reduce((s, o) => s + (parseFloat(o.dealValue) || 0), 0);

  // Group by salesperson
  const repStats = {};
  opportunities.forEach(o => {
    const rep = o.assignedSalesperson || 'Saravanan';
    if (!repStats[rep]) {
      repStats[rep] = { name: rep, deals: 0, wonCount: 0, wonValue: 0, totalValue: 0 };
    }
    repStats[rep].deals += 1;
    repStats[rep].totalValue += (parseFloat(o.dealValue) || 0);
    if (o.stage === 'Won') {
      repStats[rep].wonCount += 1;
      repStats[rep].wonValue += (parseFloat(o.dealValue) || 0);
    }
  });

  const repList = Object.values(repStats);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#0E7490',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Sales Analytics & Performance Reports
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              Conversion ratios, pipeline velocity, and revenue realization
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Total Pipeline Value</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
            ₹ {(totalPipelineValue / 100000).toFixed(1)} Lakhs
          </div>
          <span style={{ fontSize: '11px', color: '#0284C7' }}>{opportunities.length} Active Opportunities</span>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Won Deals Revenue</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#16A34A', marginTop: '4px' }}>
            ₹ {(totalWonValue / 100000).toFixed(1)} Lakhs
          </div>
          <span style={{ fontSize: '11px', color: '#16A34A' }}>{wonDeals.length} Confirmed Projects</span>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Lead Conversion Rate</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0E7490', marginTop: '4px' }}>
            {leads.length > 0 ? Math.round((wonDeals.length / leads.length) * 100) : 0}%
          </div>
          <span style={{ fontSize: '11px', color: '#64748B' }}>From Inquiry to Won</span>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Quotations Issued</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#7C3AED', marginTop: '4px' }}>
            {quotations.length}
          </div>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Commercial Bids</span>
        </div>
      </div>

      {/* Salesperson Performance Leaderboard */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: '0 0 16px' }}>
          Salesperson Realization Leaderboard
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Sales Representative</th>
              <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Active Deals</th>
              <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Won Deals</th>
              <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700' }}>Total Pipeline</th>
              <th style={{ padding: '10px 14px', color: '#475569', fontWeight: '700', textAlign: 'right' }}>Won Revenue</th>
            </tr>
          </thead>
          <tbody>
            {repList.map(r => (
              <tr key={r.name} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0F172A' }}>
                  {r.name}
                </td>
                <td style={{ padding: '12px 14px' }}>{r.deals}</td>
                <td style={{ padding: '12px 14px', color: '#16A34A', fontWeight: '700' }}>{r.wonCount}</td>
                <td style={{ padding: '12px 14px' }}>₹ {Number(r.totalValue).toLocaleString()}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', color: '#0E7490' }}>
                  ₹ {Number(r.wonValue).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
