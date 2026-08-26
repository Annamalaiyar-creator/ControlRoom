import React, { useState } from 'react';
import { Maximize2, Sparkles } from 'lucide-react';

const defaultStatusItems = [
  { name: 'Completed', count: '4,746', color: '#22C55E', pct: 0.68 },
  { name: 'In Progress', count: '342', color: '#0084FF', pct: 0.18 },
  { name: 'Planned', count: '142', color: '#06B6D4', pct: 0.09 },
  { name: 'Approved', count: '50', color: '#38BDF8', pct: 0.05 }
];

export default function POStatusOverview({ 
  title = "Work Orders by Status",
  items = defaultStatusItems,
  totalCount = "5,280",
  totalLabel = "TOTAL ORDERS"
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, item: null });

  const statusItems = items;

  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 56;
  const gapRad = 0.08; // Exact equal gap angle between every single segment pair

  const numSegments = statusItems.length;
  const totalGaps = numSegments * gapRad;
  const availableAngle = (2 * Math.PI) - totalGaps;

  let currentAngle = -Math.PI / 2;

  const segmentPaths = statusItems.map((item, idx) => {
    const arcSpan = item.pct * availableAngle;
    const a1 = currentAngle + (gapRad / 2);
    const a2 = a1 + Math.max(0.04, arcSpan);

    currentAngle = a2 + (gapRad / 2);

    if (a2 <= a1) return null;

    const x1_out = cx + outerR * Math.cos(a1);
    const y1_out = cy + outerR * Math.sin(a1);
    const x2_out = cx + outerR * Math.cos(a2);
    const y2_out = cy + outerR * Math.sin(a2);

    const x1_in = cx + innerR * Math.cos(a1);
    const y1_in = cy + innerR * Math.sin(a1);
    const x2_in = cx + innerR * Math.cos(a2);
    const y2_in = cy + innerR * Math.sin(a2);

    const largeArc = (a2 - a1) > Math.PI ? 1 : 0;

    const pathData = `M ${x1_out} ${y1_out} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2_out} ${y2_out} L ${x2_in} ${y2_in} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1_in} ${y1_in} Z`;

    const isHovered = hoveredIdx === idx;

    return (
      <path
        key={idx}
        d={pathData}
        fill={item.color}
        stroke={item.color}
        strokeWidth="4"
        strokeLinejoin="round"
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: '100px 100px',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          opacity: hoveredIdx !== null && !isHovered ? 0.55 : 1,
          filter: isHovered ? `drop-shadow(0px 4px 8px ${item.color}66)` : 'none'
        }}
        onMouseEnter={(e) => {
          setHoveredIdx(idx);
          setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY - 40,
            item
          });
        }}
        onMouseMove={(e) => {
          setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY - 40 }));
        }}
        onMouseLeave={() => {
          setHoveredIdx(null);
          setTooltip(prev => ({ ...prev, visible: false }));
        }}
      />
    );
  });

  return (
    <div 
      className="section-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '24px', 
        backgroundColor: '#FFFFFF',
        border: '1px solid #EAEFEF',
        borderRadius: '24px',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative'
      }}
    >
      {/* Top Title matching Reference Image */}
      <div>
        <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </h3>
      </div>

      {/* Main Body Split: LEFT Pie Chart SVG + RIGHT Legend Items */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', gap: '20px' }}>
        
        {/* LEFT SIDE: Donut SVG with Center Numbers */}
        <div style={{ position: 'relative', width: '200px', height: '200px', flexShrink: 0 }}>
          <svg width="200" height="200" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
            {segmentPaths}
          </svg>

          {/* Center Numbers matching user request */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '26px', fontWeight: '900', color: hoveredIdx !== null ? statusItems[hoveredIdx].color : '#0F172A', lineHeight: '1.1' }}>
              {hoveredIdx !== null ? statusItems[hoveredIdx].count : totalCount}
            </span>
            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', letterSpacing: '0.4px', marginTop: '4px', textTransform: 'uppercase' }}>
              {hoveredIdx !== null ? statusItems[hoveredIdx].name : totalLabel}
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: Legend List (Completed, In Progress, Planned, Approved) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1, justifyContent: 'center' }}>
          {statusItems.map((item, idx) => (
            <div 
              key={idx} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                opacity: hoveredIdx !== null && hoveredIdx !== idx ? 0.45 : 1,
                padding: '6px 10px',
                borderRadius: '10px',
                backgroundColor: hoveredIdx === idx ? `${item.color}15` : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Color Circle Dot */}
                <span style={{ 
                  width: '9px', 
                  height: '9px', 
                  borderRadius: '50%', 
                  backgroundColor: item.color, 
                  flexShrink: 0 
                }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>
                  {item.name}
                </span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A' }}>
                {item.count}
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* Interactive Floating Tooltip when Hovering Pie Chart */}
      {tooltip.visible && tooltip.item && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '700',
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tooltip.item.color }} />
          <span>{tooltip.item.name}:</span>
          <span style={{ color: '#38BDF8', fontWeight: '900' }}>{tooltip.item.count}</span>
          <span style={{ color: '#94A3B8', fontSize: '11px' }}>({Math.round(tooltip.item.pct * 100)}%)</span>
        </div>
      )}

    </div>
  );
}
