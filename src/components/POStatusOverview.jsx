import React, { useEffect, useRef } from 'react';

export default function POStatusOverview() {
  const canvasRef = useRef(null);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const size = 160;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const x = size / 2;
    const y = size / 2;
    const radius = 66;
    const thickness = 18;

    // Background grey track
    ctx.beginPath();
    ctx.arc(x, y, radius - (thickness / 2), 0, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = thickness;
    ctx.stroke();

    // Segments: Draft (4), Approved (24), Partially Received (22), Fully Received (36), Cancelled (0) -> Total 86
    const segments = [
      { color: '#0284c7', value: 4 / 86 },   // Draft
      { color: '#16a34a', value: 24 / 86 },  // Approved
      { color: '#ea580c', value: 22 / 86 },  // Partially Received
      { color: '#2563eb', value: 36 / 86 },  // Fully Received
      { color: '#dc2626', value: 0 }         // Cancelled
    ];

    let startAngle = -Math.PI / 2;

    segments.forEach(seg => {
      if (seg.value <= 0) return;
      const angle = seg.value * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(x, y, radius - (thickness / 2), startAngle, startAngle + angle, false);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'butt';
      ctx.stroke();
      startAngle += angle;
    });
  };

  useEffect(() => {
    drawChart();
    window.addEventListener('resize', drawChart);
    return () => window.removeEventListener('resize', drawChart);
  }, []);

  const statusItems = [
    { name: 'Draft', count: '4 POs', color: '#0284c7' },
    { name: 'Approved', count: '24 POs', color: '#16a34a' },
    { name: 'Part. Rec.', count: '22 POs', color: '#ea580c' },
    { name: 'Fully Rec.', count: '36 POs', color: '#2563eb' },
    { name: 'Cancelled', count: '0 POs', color: '#dc2626' }
  ];

  return (
    <div 
      className="section-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '16px 20px', 
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        justify: 'space-between',
        height: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Title matching Screenshot */}
      <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          PURCHASE STATUS BREAKDOWN
        </span>
      </div>

      {/* Centered Donut Canvas with Text matching Screenshot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', position: 'relative' }}>
        <div style={{ position: 'relative', width: '160px', height: '160px' }}>
          <canvas ref={canvasRef}></canvas>
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
              pointerEvents: 'none'
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', lineHeight: '1.1' }}>
              86
            </span>
            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px', marginTop: '2px', textTransform: 'uppercase' }}>
              TOTAL POS
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Horizontal Pills Row matching Screenshot */}
      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: '100%' }}>
        {statusItems.map((item, idx) => (
          <div 
            key={idx} 
            style={{ 
              backgroundColor: '#F8FAFC', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              padding: '10px 8px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px',
              minWidth: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }}></span>
              <span style={{ fontSize: '10.5px', fontWeight: '600', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
            </div>
            <strong style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>{item.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
