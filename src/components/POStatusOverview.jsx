import React, { useEffect, useRef } from 'react';
import { Package, Sun, Zap, Settings } from 'lucide-react';

export default function POStatusOverview() {
  const canvasRef = useRef(null);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set display size
    const size = 150;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const x = size / 2;
    const y = size / 2;
    const radius = 64;
    const thickness = 16;
    const innerRadius = radius - thickness;

    // Percentages matching the blue monochromatic palette of the reference
    const segments = [
      { color: '#2563eb', value: 0.395 }, // Completed (Deep Blue)
      { color: '#3b82f6', value: 0.256 }, // In Progress (Blue)
      { color: '#60a5fa', value: 0.163 }, // Approved (Light Blue)
      { color: '#93c5fd', value: 0.116 }, // Pending (Soft Blue)
      { color: '#dbeafe', value: 0.070 }  // Cancelled (Very Light Blue)
    ];

    let startAngle = -Math.PI / 2;

    segments.forEach(seg => {
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
  }, []);

  const statusItems = [
    { name: 'Completed', percentage: '39.5%', count: '34 POs', color: '#2563eb' },
    { name: 'In Progress', percentage: '25.6%', count: '22 POs', color: '#3b82f6' },
    { name: 'Approved', percentage: '16.3%', count: '14 POs', color: '#60a5fa' },
    { name: 'Pending Approval', percentage: '11.6%', count: '10 POs', color: '#93c5fd' },
    { name: 'Cancelled', percentage: '7.0%', count: '6 POs', color: '#dbeafe' }
  ];

  return (
    <div 
      className="section-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0, 
        overflow: 'hidden' 
      }}
    >
      {/* Top Section: Title */}
      <div style={{ padding: 'var(--spacing-16) var(--spacing-24) 0 var(--spacing-24)' }}>
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
          PO Status Overview
        </span>
      </div>

      {/* Donut Chart Container */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: 'var(--spacing-16) var(--spacing-24)',
          position: 'relative'
        }}
      >
        {/* Donut Canvas */}
        <div style={{ position: 'relative', width: '150px', height: '150px' }}>
          <canvas ref={canvasRef}></canvas>
          {/* Centered label */}
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
            <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e293b', fontFamily: 'Inter, system-ui' }}>
              39.5%
            </span>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>
              Completed
            </span>
          </div>
        </div>
      </div>

      {/* Divided Bottom section: PO Status Breakdown */}
      <div 
        style={{ 
          borderTop: '1px solid var(--color-border)', 
          padding: '16px var(--spacing-24)', 
          backgroundColor: '#fafbfc' 
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', display: 'block', marginBottom: '12px' }}>
          PO Status Breakdown
        </span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {statusItems.map((item, idx) => {
            return (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  color: '#334155'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span 
                    style={{ 
                      display: 'inline-block', 
                      width: '10px', 
                      height: '10px', 
                      backgroundColor: item.color, 
                      borderRadius: '50%',
                      flexShrink: 0
                    }}
                  ></span>
                  <span style={{ fontWeight: '500' }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>{item.count}</span>
                  <strong style={{ color: '#1e293b', minWidth: '40px', textAlign: 'right' }}>{item.percentage}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
