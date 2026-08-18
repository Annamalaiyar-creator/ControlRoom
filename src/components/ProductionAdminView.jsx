import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, TrendingUp, Percent, CheckCircle2, XCircle, Clock, Cpu,
  Calendar, Filter, AlertTriangle, AlertCircle, Info, ShieldCheck, Factory,
  Users, Layers, Award, BarChart2, Package, ArrowUpRight, ArrowDownRight, Settings,
  MoreHorizontal, Plus, RefreshCw, Check
} from 'lucide-react';

export default function ProductionAdminView() {
  const [selectedMonth, setSelectedMonth] = useState('07');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [trendFilter, setTrendFilter] = useState('Daily');
  const [activeTrendIndex, setActiveTrendIndex] = useState(6);

  // Live Zoho Inventory Work Orders State
  const [workOrders, setWorkOrders] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New Work Order Form State
  const [newWO, setNewWO] = useState({
    productName: 'Mini Rail 100 mm',
    plannedQty: '500',
    rawMaterial: 'Raw Aluminum Coil 1.5mm',
    customer: 'Vikram Solar',
    targetDate: new Date().toISOString().split('T')[0],
    delayReason: 'Normal Production'
  });

  // Fetch Work Orders from Server
  const fetchWorkOrders = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/zoho/workorders');
      if (res.ok) {
        const data = await res.json();
        if (data.workOrders && data.workOrders.length > 0) {
          setWorkOrders(data.workOrders);
        }
      }
    } catch (err) {
      console.error('Failed to fetch work orders:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/zoho/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWO)
      });
      if (res.ok) {
        setShowCreateModal(false);
        fetchWorkOrders();
      }
    } catch (err) {
      console.error('Failed to create work order:', err);
    }
  };

  // Canvas Refs
  const statusDonutRef = useRef(null);
  const trendComboRef = useRef(null);
  const qualityDonutRef = useRef(null);
  const containerRef = useRef(null);

  // 1. Production Status Donut Canvas (Exact Procurement Donut Color Palette)
  const drawStatusDonut = () => {
    const canvas = statusDonutRef.current;
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
    const radius = 64;
    const thickness = 14;

    // Background track
    ctx.beginPath();
    ctx.arc(x, y, radius - (thickness / 2), 0, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = thickness;
    ctx.stroke();

    const segments = [
      { color: '#0284c7', value: 142 / 5280 },  // Planned (#0284c7 - Cyan)
      { color: '#16a34a', value: 32 / 5280 },   // Approved / On Hold (#16a34a - Green)
      { color: '#ea580c', value: 342 / 5280 },  // In Progress (#ea580c - Orange)
      { color: '#2563eb', value: 4746 / 5280 }, // Completed (#2563eb - Blue)
      { color: '#dc2626', value: 18 / 5280 }    // Delayed (#dc2626 - Red)
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

  // Trend Chart Data (Matches Procurement Area Line + Bar Trend System)
  const trendData = [
    { date: '18-Jul', planned: 720, actual: 654, pct: '90.8%' },
    { date: '19-Jul', planned: 690, actual: 612, pct: '88.7%' },
    { date: '20-Jul', planned: 760, actual: 724, pct: '95.3%' },
    { date: '21-Jul', planned: 780, actual: 702, pct: '90.0%' },
    { date: '22-Jul', planned: 770, actual: 736, pct: '95.6%' },
    { date: '23-Jul', planned: 750, actual: 690, pct: '92.0%' },
    { date: '24-Jul', planned: 810, actual: 744, pct: '91.9%' }
  ];

  const handleTrendMouseMove = (e) => {
    const canvas = trendComboRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const paddingLeft = 40;
    const paddingRight = 20;
    const graphWidth = rect.width - paddingLeft - paddingRight;
    const count = trendData.length;
    
    let idx = Math.round(((x - paddingLeft) / graphWidth) * (count - 1));
    if (idx < 0) idx = 0;
    if (idx > count - 1) idx = count - 1;
    
    if (idx !== activeTrendIndex) {
      setActiveTrendIndex(idx);
    }
  };

  // 2. Daily Production Trend Canvas (Strictly DM Sans Font)
  const drawTrendCombo = () => {
    const canvas = trendComboRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = 185;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 22;
    const paddingBottom = 28;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Y Grid Lines & Axis Labels
    const yLabels = ['1,000', '800', '600', '400', '200', '0'];
    const gridRows = 5;

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "DM Sans", sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridRows; i++) {
      const y = paddingTop + (graphHeight / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(yLabels[i], paddingLeft - 6, y + 3);
    }
    ctx.setLineDash([]);

    // X Axis Date Labels
    ctx.textAlign = 'center';
    trendData.forEach((d, i) => {
      const x = paddingLeft + (graphWidth / (trendData.length - 1)) * i;
      ctx.fillStyle = i === activeTrendIndex ? '#1e3a8a' : '#64748b';
      ctx.font = i === activeTrendIndex ? 'bold 10.5px "DM Sans", sans-serif' : '10px "DM Sans", sans-serif';
      ctx.fillText(d.date, x, height - 6);
    });

    const maxNos = 1000;
    const points = trendData.map((d, i) => ({
      x: paddingLeft + (graphWidth / (trendData.length - 1)) * i,
      y: paddingTop + graphHeight - (graphHeight * (d.actual / maxNos))
    }));

    // Active Column Highlight
    const activePoint = points[activeTrendIndex];
    const columnWidth = 30;
    ctx.fillStyle = 'rgba(37, 99, 235, 0.06)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(activePoint.x - (columnWidth / 2), paddingTop, columnWidth, graphHeight, 6);
    } else {
      ctx.rect(activePoint.x - (columnWidth / 2), paddingTop, columnWidth, graphHeight);
    }
    ctx.fill();

    // Smooth Bezier Spline Curve
    const drawSpline = (fill = false) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        
        const cpX1 = p0.x + (p1.x - p0.x) / 2;
        const cpY1 = p0.y;
        const cpX2 = p0.x + (p1.x - p0.x) / 2;
        const cpY2 = p1.y;

        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, p1.x, p1.y);
      }

      if (fill) {
        ctx.lineTo(points[points.length - 1].x, paddingTop + graphHeight);
        ctx.lineTo(points[0].x, paddingTop + graphHeight);
        ctx.closePath();
      }
    };

    // Linear Area Gradient
    const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + graphHeight);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.18)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)');
    ctx.fillStyle = gradient;
    drawSpline(true);
    ctx.fill();

    // Smooth Blue Stroke Line
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    drawSpline(false);
    ctx.stroke();

    // Dots on Points
    points.forEach((pt, i) => {
      const isActive = i === activeTrendIndex;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isActive ? 5 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = isActive ? '#2563EB' : '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.stroke();

      // Tooltip / Value Pill above active point
      if (isActive) {
        const valText = `${trendData[i].actual} Nos (${trendData[i].pct})`;
        ctx.font = 'bold 10px "DM Sans", sans-serif';
        const textWidth = ctx.measureText(valText).width;
        const pillW = textWidth + 14;
        const pillH = 20;
        const pillX = Math.max(paddingLeft, Math.min(width - paddingRight - pillW, pt.x - pillW / 2));
        const pillY = pt.y - 26;

        ctx.fillStyle = '#1E3A8A';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, 4);
        else ctx.rect(pillX, pillY, pillW, pillH);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(valText, pillX + pillW / 2, pillY + 14);
      }
    });
  };

  // 3. Quality Breakdown Donut Canvas
  const drawQualityDonut = () => {
    const canvas = qualityDonutRef.current;
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
    const radius = 64;
    const thickness = 14;

    // Background track
    ctx.beginPath();
    ctx.arc(x, y, radius - (thickness / 2), 0, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = thickness;
    ctx.stroke();

    const segments = [
      { color: '#0284c7', value: 54 / 116 }, // Dim. Out (Cyan - like Draft)
      { color: '#16a34a', value: 28 / 116 }, // Scratch (Green - like Approved)
      { color: '#ea580c', value: 18 / 116 }, // Bent (Orange - like Part. Rec)
      { color: '#2563eb', value: 10 / 116 }, // Offset (Blue - like Fully Rec)
      { color: '#dc2626', value: 6 / 116 }   // Others (Red - like Cancelled)
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
    const renderAllCharts = () => {
      drawStatusDonut();
      drawTrendCombo();
      drawQualityDonut();
    };

    renderAllCharts();

    window.addEventListener('resize', renderAllCharts);

    let observer = null;
    if (window.ResizeObserver && containerRef.current) {
      observer = new ResizeObserver(() => {
        renderAllCharts();
      });
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', renderAllCharts);
      if (observer) observer.disconnect();
    };
  }, [activeTrendIndex, trendFilter]);

  // Display orders from live fetch or fallback
  const displayOrders = workOrders.length > 0 ? workOrders.slice(0, 5) : [
    { workOrderNo: 'VRM26/07/118', productName: 'Mini Rail 100 mm', plannedQty: 500, completedQty: 360, delayDays: '2 Days', delayReason: 'Material Delay', status: 'Overdue', statusColor: '#DC2626' },
    { workOrderNo: 'VRM26/07/101', productName: 'Long Rail 3000 mm', plannedQty: 200, completedQty: 120, delayDays: '2 Days', delayReason: 'Machine Down', status: 'Overdue', statusColor: '#DC2626' },
    { workOrderNo: 'VRM26/07/089', productName: 'Mid Clamp 35 mm', plannedQty: 1500, completedQty: 1100, delayDays: '1 Day', delayReason: 'Operator Shortage', status: 'Pending', statusColor: '#D97706' },
    { workOrderNo: 'VRM26/07/074', productName: 'Alu. Bracket', plannedQty: 400, completedQty: 260, delayDays: '1 Day', delayReason: 'Tool Change', status: 'Pending', statusColor: '#D97706' },
    { workOrderNo: 'VRM26/07/061', productName: 'End Clamp 35 mm', plannedQty: 300, completedQty: 210, delayDays: '1 Day', delayReason: 'Inspection Hold', status: 'Pending', statusColor: '#D97706' }
  ];

  return (
    <div ref={containerRef} style={{ fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', paddingTop: '4px' }}>
      
      {/* HEADER FILTER & ZOHO PRODUCTION SYNC BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '12px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Calendar style={{ width: '16px', height: '16px', color: '#2563EB', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', fontFamily: "'DM Sans', sans-serif" }}>Production Control Room Dashboard</span>
          <span style={{ fontSize: '11px', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '3px 10px', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #BBF7D0', fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }}></span>
            Zoho Inventory Work Orders Synced
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
            }}
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            Create Work Order
          </button>

          <button
            onClick={fetchWorkOrders}
            style={{
              backgroundColor: '#F8FAFC',
              color: '#475569',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            <RefreshCw style={{ width: '13px', height: '13px', animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            Sync
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '600', color: '#1E293B', backgroundColor: '#F8FAFC', cursor: 'pointer', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
          >
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="06">June</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: '4px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '600', color: '#1E293B', backgroundColor: '#F8FAFC', cursor: 'pointer', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* ROW 1: 6 KPI SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* KPI 1: TOTAL PLAN */}
        <div className="section-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardList style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.3px', fontFamily: "'DM Sans', sans-serif" }}>TOTAL PLAN (NOS)</span>
          </div>
          <strong style={{ fontSize: '16px', color: '#0F172A', fontWeight: '800', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>5,280</strong>
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', fontFamily: "'DM Sans', sans-serif" }}>
            ▲ 10.4% <span style={{ color: '#94A3B8', fontWeight: '500' }}>vs Last Month</span>
          </span>
        </div>

        {/* KPI 2: TOTAL PRODUCTION */}
        <div className="section-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.3px', fontFamily: "'DM Sans', sans-serif" }}>TOTAL PRODUCTION</span>
          </div>
          <strong style={{ fontSize: '16px', color: '#0F172A', fontWeight: '800', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>4,862</strong>
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', fontFamily: "'DM Sans', sans-serif" }}>
            ▲ 11.2% <span style={{ color: '#94A3B8', fontWeight: '500' }}>vs Last Month</span>
          </span>
        </div>

        {/* KPI 3: PLAN ACHIEVEMENT */}
        <div className="section-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Percent style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.3px', fontFamily: "'DM Sans', sans-serif" }}>PLAN ACHIEVEMENT</span>
          </div>
          <strong style={{ fontSize: '16px', color: '#0F172A', fontWeight: '800', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>92.1%</strong>
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', fontFamily: "'DM Sans', sans-serif" }}>
            ▲ 2.3% <span style={{ color: '#94A3B8', fontWeight: '500' }}>vs Last Month</span>
          </span>
        </div>

        {/* KPI 4: GOOD PRODUCTION */}
        <div className="section-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#FFEDD5', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.3px', fontFamily: "'DM Sans', sans-serif" }}>GOOD PRODUCTION</span>
          </div>
          <strong style={{ fontSize: '16px', color: '#0F172A', fontWeight: '800', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>4,746</strong>
          <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', fontFamily: "'DM Sans', sans-serif" }}>
            ▲ 10.8% <span style={{ color: '#94A3B8', fontWeight: '500' }}>vs Last Month</span>
          </span>
        </div>

        {/* KPI 5: REJECTION */}
        <div className="section-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <XCircle style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.3px', fontFamily: "'DM Sans', sans-serif" }}>REJECTION (NOS)</span>
          </div>
          <strong style={{ fontSize: '16px', color: '#0F172A', fontWeight: '800', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>116</strong>
          <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', fontFamily: "'DM Sans', sans-serif" }}>
            ▼ 1.6% <span style={{ color: '#94A3B8', fontWeight: '500' }}>vs Last Month</span>
          </span>
        </div>

        {/* KPI 6: DOWNTIME */}
        <div className="section-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock style={{ width: '13px', height: '13px' }} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.3px', fontFamily: "'DM Sans', sans-serif" }}>DOWNTIME (HRS)</span>
          </div>
          <strong style={{ fontSize: '16px', color: '#0F172A', fontWeight: '800', marginTop: '2px', fontFamily: "'DM Sans', sans-serif" }}>31.6</strong>
          <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', fontFamily: "'DM Sans', sans-serif" }}>
            ▼ 8.5% <span style={{ color: '#94A3B8', fontWeight: '500' }}>vs Last Month</span>
          </span>
        </div>

      </div>

      {/* 2 CONTINUOUS FLEX COLUMNS LAYOUT (ORIGINAL SCRIPT DESIGN) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '16px', width: '100%', boxSizing: 'border-box', alignItems: 'start' }}>
        
        {/* ==================== LEFT CONTINUOUS FLEX COLUMN ==================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', minWidth: 0 }}>
          
          {/* 1. PRODUCTION STATUS BREAKDOWN */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>
                PRODUCTION STATUS BREAKDOWN
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0', position: 'relative' }}>
              <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <canvas ref={statusDonutRef}></canvas>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', lineHeight: '1', fontFamily: "'DM Sans', sans-serif" }}>5,280</span>
                  <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px', marginTop: '4px', textTransform: 'uppercase', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>TOTAL PLAN</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: '100%' }}>
              {[
                { name: 'Planned', count: '142', color: '#0284c7' },
                { name: 'Approved', count: '32', color: '#16a34a' },
                { name: 'In Progress', count: '342', color: '#ea580c' },
                { name: 'Completed', count: '4,746', color: '#2563eb' },
                { name: 'Delayed', count: '18', color: '#dc2626' }
              ].map((pill, idx) => (
                <div key={idx} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: pill.color, flexShrink: 0 }}></span>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'DM Sans', sans-serif" }}>{pill.name}</span>
                  </div>
                  <strong style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', fontFamily: "'DM Sans', sans-serif" }}>{pill.count} Nos</strong>
                </div>
              ))}
            </div>
          </div>

          {/* 2. DAILY PRODUCTION TREND */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', minWidth: 0, boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
                DAILY PRODUCTION TREND <span style={{ color: '#64748B', fontWeight: '600', fontSize: '11px' }}>(NOS)</span>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', padding: '2px', borderRadius: '6px' }}>
                {['Daily', 'Weekly', 'Monthly'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTrendFilter(f)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      fontFamily: "'DM Sans', sans-serif",
                      backgroundColor: trendFilter === f ? '#FFFFFF' : 'transparent',
                      color: trendFilter === f ? '#1E3A8A' : '#64748B',
                      boxShadow: trendFilter === f ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: '185px', width: '100%', position: 'relative' }}>
              <canvas 
                ref={trendComboRef} 
                onMouseMove={handleTrendMouseMove}
                onMouseLeave={() => setActiveTrendIndex(6)}
                style={{ cursor: 'pointer' }}
              ></canvas>
            </div>
          </div>

          {/* 3. PRODUCTION BY PRODUCT / PROFILE */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, boxSizing: 'border-box' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
              PRODUCTION BY PRODUCT / PROFILE <span style={{ color: '#64748B', fontWeight: '600', fontSize: '11px' }}>(THIS MONTH)</span>
            </span>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Product / Profile</th>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Planned</th>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Actual</th>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Achievement %</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Mini Rail 100 mm', plan: '1,500', act: '1,402', pct: 93.5 },
                  { name: 'Mini Rail 60 mm', plan: '1,200', act: '1,102', pct: 91.8 },
                  { name: 'Long Rail 3000 mm', plan: '600', act: '538', pct: 89.7 },
                  { name: 'Mid Clamp 35 mm', plan: '1,300', act: '1,210', pct: 93.1 },
                  { name: 'End Clamp 35 mm', plan: '400', act: '362', pct: 90.5 },
                  { name: 'Other Accessories', plan: '280', act: '248', pct: 88.6 }
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px', color: '#334155', fontWeight: '600', whiteSpace: 'nowrap' }}>{row.name}</td>
                    <td style={{ padding: '8px 10px', color: '#0F172A', whiteSpace: 'nowrap' }}>{row.plan}</td>
                    <td style={{ padding: '8px 10px', color: '#0F172A', fontWeight: '700', whiteSpace: 'nowrap' }}>{row.act}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${row.pct}%`, height: '100%', backgroundColor: '#2563eb' }}></div>
                        </div>
                        <strong style={{ fontSize: '11px', color: '#2563eb' }}>{row.pct}%</strong>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: '800', color: '#0F172A', borderTop: '1px solid #CBD5E1', backgroundColor: '#F8FAFC' }}>
                  <td style={{ padding: '8px 10px' }}>Total</td>
                  <td style={{ padding: '8px 10px' }}>5,280</td>
                  <td style={{ padding: '8px 10px' }}>4,862</td>
                  <td style={{ padding: '8px 10px', color: '#2563eb' }}>92.1%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. DOWNTIME ANALYSIS */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, boxSizing: 'border-box' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
              DOWNTIME ANALYSIS <span style={{ color: '#64748B', fontWeight: '600', fontSize: '11px' }}>(THIS MONTH)</span>
            </span>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Reason</th>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Hours</th>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { reason: 'Machine Breakdown', hrs: '12.6', pct: 39.9 },
                  { reason: 'Material Not Ready', hrs: '7.8', pct: 24.7 },
                  { reason: 'Tool Change / Setup', hrs: '5.4', pct: 17.1 },
                  { reason: 'Power Failure', hrs: '3.2', pct: 10.1 },
                  { reason: 'Other Reasons', hrs: '2.6', pct: 8.2 }
                ].map((dt, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px', color: '#334155', fontWeight: '600', whiteSpace: 'nowrap' }}>{dt.reason}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap' }}>{dt.hrs}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '90px', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${dt.pct}%`, height: '100%', backgroundColor: '#7e22ce' }}></div>
                        </div>
                        <strong style={{ color: '#7e22ce', fontSize: '11px' }}>{dt.pct}%</strong>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: '800', color: '#0F172A', borderTop: '1px solid #CBD5E1', backgroundColor: '#F8FAFC' }}>
                  <td style={{ padding: '8px 10px' }}>Total</td>
                  <td style={{ padding: '8px 10px' }}>31.6</td>
                  <td style={{ padding: '8px 10px', color: '#7e22ce' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. QUALITY REJECTION BREAKDOWN */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box' }}>
            <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>
                QUALITY REJECTION BREAKDOWN
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0', position: 'relative' }}>
              <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <canvas ref={qualityDonutRef}></canvas>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', lineHeight: '1', fontFamily: "'DM Sans', sans-serif" }}>116</span>
                  <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '800', letterSpacing: '0.5px', marginTop: '4px', textTransform: 'uppercase', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>TOTAL REJECTS</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: '100%' }}>
              {[
                { name: 'Dim. Out', count: '54', color: '#0284c7' },
                { name: 'Scratch', count: '28', color: '#16a34a' },
                { name: 'Bent', count: '18', color: '#ea580c' },
                { name: 'Offset', count: '10', color: '#2563eb' },
                { name: 'Others', count: '6', color: '#dc2626' }
              ].map((pill, idx) => (
                <div key={idx} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: pill.color, flexShrink: 0 }}></span>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'DM Sans', sans-serif" }}>{pill.name}</span>
                  </div>
                  <strong style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', fontFamily: "'DM Sans', sans-serif" }}>{pill.count} Nos</strong>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ==================== RIGHT CONTINUOUS FLEX COLUMN ==================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', minWidth: 0 }}>
          
          {/* 1. TOP 5 DELAYED PRODUCTION ORDERS */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
                TOP 5 DELAYED PRODUCTION ORDERS
              </span>
              <span style={{ fontSize: '10.5px', color: '#2563EB', fontWeight: '700', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '10px' }}>
                Synced with Zoho
              </span>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left', minWidth: '460px', fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <th style={{ padding: '7px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>Order No.</th>
                    <th style={{ padding: '7px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>Product / Profile</th>
                    <th style={{ padding: '7px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>Planned</th>
                    <th style={{ padding: '7px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>Completed</th>
                    <th style={{ padding: '7px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>Delay</th>
                    <th style={{ padding: '7px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>Reason</th>
                    <th style={{ padding: '7px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.map((ord, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 8px', fontWeight: '700', color: '#1E293B', whiteSpace: 'nowrap' }}>{ord.workOrderNo}</td>
                      <td style={{ padding: '7px 8px', color: '#334155', whiteSpace: 'nowrap' }}>{ord.productName}</td>
                      <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>{ord.plannedQty}</td>
                      <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>{ord.completedQty}</td>
                      <td style={{ padding: '7px 8px', fontWeight: '700', color: ord.status === 'Overdue' ? '#DC2626' : '#D97706', whiteSpace: 'nowrap' }}>{ord.delayDays || '1 Day'}</td>
                      <td style={{ padding: '7px 8px', color: '#475569', whiteSpace: 'nowrap' }}>{ord.delayReason}</td>
                      <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          backgroundColor: ord.status === 'Overdue' ? '#FEF2F2' : '#FEF3C7', 
                          color: ord.status === 'Overdue' ? '#DC2626' : '#D97706', 
                          padding: '3px 8px', 
                          borderRadius: '4px', 
                          fontWeight: '700', 
                          fontSize: '10px' 
                        }}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. MACHINE PERFORMANCE */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, boxSizing: 'border-box' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
              MACHINE PERFORMANCE <span style={{ color: '#64748B', fontWeight: '600', fontSize: '11px' }}>(THIS MONTH)</span>
            </span>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Machine / Line</th>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Planned</th>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Actual</th>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Utilization</th>
                  <th style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'CNC Cutting Machine', plan: '1,200', act: '1,102', util: 82, pct: '85.1%', dot: '#16a34a' },
                  { name: 'Punching Machine - 1', plan: '1,000', act: '912', util: 76, pct: '83.4%', dot: '#16a34a' },
                  { name: 'Punching Machine - 2', plan: '800', act: '678', util: 74, pct: '79.6%', dot: '#16a34a' },
                  { name: 'Drilling Machine', plan: '600', act: '546', util: 81, pct: '86.3%', dot: '#16a34a' },
                  { name: 'Tapping Machine', plan: '400', act: '322', util: 70, pct: '72.4%', dot: '#eab308' },
                  { name: 'Roll Forming Line', plan: '1,280', act: '1,302', util: 79, pct: '89.7%', dot: '#16a34a' }
                ].map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px', color: '#334155', fontWeight: '600', whiteSpace: 'nowrap' }}>{m.name}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{m.plan}</td>
                    <td style={{ padding: '8px 10px', fontWeight: '700', whiteSpace: 'nowrap' }}>{m.act}</td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '50px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${m.util}%`, height: '100%', backgroundColor: '#2563eb' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700' }}>{m.util}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#0F172A' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: m.dot }}></span>
                        {m.pct}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. MACHINE OPERATOR PERFORMANCE */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, boxSizing: 'border-box' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
              MACHINE OPERATOR PERFORMANCE <span style={{ color: '#64748B', fontWeight: '600', fontSize: '11px' }}>(THIS MONTH)</span>
            </span>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left', minWidth: '500px', fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <th style={{ padding: '7px 6px', fontWeight: '700', whiteSpace: 'nowrap' }}>Operator</th>
                    <th style={{ padding: '7px 6px', fontWeight: '700', whiteSpace: 'nowrap' }}>Machine</th>
                    <th style={{ padding: '7px 6px', fontWeight: '700', whiteSpace: 'nowrap' }}>Plan</th>
                    <th style={{ padding: '7px 6px', fontWeight: '700', whiteSpace: 'nowrap' }}>Act</th>
                    <th style={{ padding: '7px 6px', fontWeight: '700', whiteSpace: 'nowrap' }}>Eff.</th>
                    <th style={{ padding: '7px 6px', fontWeight: '700', whiteSpace: 'nowrap' }}>Qual.</th>
                    <th style={{ padding: '7px 6px', fontWeight: '700', whiteSpace: 'nowrap' }}>Att.</th>
                    <th style={{ padding: '7px 6px', fontWeight: '800', whiteSpace: 'nowrap' }}>Overall</th>
                    <th style={{ padding: '7px 6px', fontWeight: '700', whiteSpace: 'nowrap' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'R. Karthik', machine: 'CNC Cutting', plan: 580, act: 546, eff: '94.1%', qual: '98.2%', att: '96%', score: '95.2%', grade: 'A+', color: '#16a34a' },
                    { name: 'M. Arul', machine: 'Punching - 1', plan: 500, act: 462, eff: '92.4%', qual: '96.8%', att: '94%', score: '93.1%', grade: 'A', color: '#16a34a' },
                    { name: 'S. Praveen', machine: 'Punching - 2', plan: 400, act: 352, eff: '88.0%', qual: '95.0%', att: '93%', score: '89.3%', grade: 'B+', color: '#eab308' },
                    { name: 'K. Manoj', machine: 'Drilling', plan: 300, act: 282, eff: '94.0%', qual: '97.1%', att: '96%', score: '94.7%', grade: 'A', color: '#16a34a' },
                    { name: 'P. Kumar', machine: 'Tapping', plan: 200, act: 168, eff: '84.0%', qual: '94.2%', att: '92%', score: '86.2%', grade: 'B', color: '#eab308' },
                    { name: 'V. Senthil', machine: 'Roll Forming', plan: 640, act: 612, eff: '95.6%', qual: '97.8%', att: '97%', score: '96.8%', grade: 'A+', color: '#16a34a' }
                  ].map((op, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 6px', fontWeight: '700', color: '#1E293B', whiteSpace: 'nowrap' }}>{op.name}</td>
                      <td style={{ padding: '7px 6px', color: '#475569', whiteSpace: 'nowrap' }}>{op.machine}</td>
                      <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>{op.plan}</td>
                      <td style={{ padding: '7px 6px', fontWeight: '600', whiteSpace: 'nowrap' }}>{op.act}</td>
                      <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>{op.eff}</td>
                      <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>{op.qual}</td>
                      <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>{op.att}</td>
                      <td style={{ padding: '7px 6px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap' }}>{op.score}</td>
                      <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>
                        <span style={{ backgroundColor: op.color, color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: '800', fontSize: '10px' }}>
                          {op.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. OEE ANALYSIS */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0, boxSizing: 'border-box' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
              OEE ANALYSIS <span style={{ color: '#64748B', fontWeight: '600', fontSize: '11px' }}>(THIS MONTH)</span>
            </span>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '4px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', color: '#0F172A', fontFamily: "'DM Sans', sans-serif" }}>
                  90.2%
                </div>
                <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>AVAILABILITY</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '4px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', color: '#0F172A', fontFamily: "'DM Sans', sans-serif" }}>
                  88.7%
                </div>
                <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>PERFORMANCE</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '4px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', color: '#0F172A', fontFamily: "'DM Sans', sans-serif" }}>
                  90.1%
                </div>
                <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>QUALITY</span>
              </div>

              <span style={{ fontSize: '18px', fontWeight: '800', color: '#64748B' }}>=</span>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif" }}>
                  86.3%
                </div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#1e3a8a', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>OEE</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: "'DM Sans', sans-serif" }}>
              <div><span style={{ color: '#64748B' }}>Planned Time:</span> <strong>744.0 Hrs</strong></div>
              <div><span style={{ color: '#64748B' }}>Ideal Cycle Time:</span> <strong>744.0 Hrs</strong></div>
              <div><span style={{ color: '#64748B' }}>Total Output:</span> <strong>4,862 Nos</strong></div>

              <div><span style={{ color: '#64748B' }}>Run Time:</span> <strong>671.5 Hrs</strong></div>
              <div><span style={{ color: '#64748B' }}>Actual Cycle Time:</span> <strong>838.2 Hrs</strong></div>
              <div><span style={{ color: '#64748B' }}>Good Output:</span> <strong>4,746 Nos</strong></div>

              <div><span style={{ color: '#64748B' }}>Downtime:</span> <strong style={{ color: '#DC2626' }}>72.5 Hrs</strong></div>
              <div><span style={{ color: '#64748B' }}>Performance Loss:</span> <strong style={{ color: '#D97706' }}>94.2 Hrs</strong></div>
              <div><span style={{ color: '#64748B' }}>Rejects:</span> <strong style={{ color: '#DC2626' }}>116 Nos</strong></div>
            </div>
          </div>

          {/* 5. SHIFT WISE PRODUCTION */}
          <div className="section-card" style={{ padding: '14px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
              SHIFT WISE PRODUCTION
            </span>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '5px 6px', fontWeight: '700' }}>Shift</th>
                  <th style={{ padding: '5px 6px', fontWeight: '700' }}>Actual</th>
                  <th style={{ padding: '5px 6px', fontWeight: '700' }}>Achiev.%</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '6px 6px', color: '#334155', fontWeight: '600' }}>1st Shift (06:00-02:00)</td>
                  <td style={{ padding: '6px 6px', fontWeight: '700' }}>2,438</td>
                  <td style={{ padding: '6px 6px', color: '#16A34A', fontWeight: '800' }}>92.4%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '6px 6px', color: '#334155', fontWeight: '600' }}>2nd Shift (02:00-10:00)</td>
                  <td style={{ padding: '6px 6px', fontWeight: '700' }}>2,424</td>
                  <td style={{ padding: '6px 6px', color: '#16A34A', fontWeight: '800' }}>91.8%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. TODAY'S SNAPSHOT */}
          <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
              TODAY'S SNAPSHOT
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700', display: 'block', fontFamily: "'DM Sans', sans-serif" }}>Today's Plan</span>
                <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', fontFamily: "'DM Sans', sans-serif" }}>253</strong>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700', display: 'block', fontFamily: "'DM Sans', sans-serif" }}>Today's Prod.</span>
                <strong style={{ fontSize: '15px', color: '#16A34A', fontWeight: '800', fontFamily: "'DM Sans', sans-serif" }}>241</strong>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700', display: 'block', fontFamily: "'DM Sans', sans-serif" }}>Achiev. %</span>
                <strong style={{ fontSize: '15px', color: '#2563EB', fontWeight: '800', fontFamily: "'DM Sans', sans-serif" }}>95.3%</strong>
              </div>

              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '8px 6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: '#991B1B', fontWeight: '700', display: 'block', fontFamily: "'DM Sans', sans-serif" }}>Rejection</span>
                <strong style={{ fontSize: '15px', color: '#DC2626', fontWeight: '800', fontFamily: "'DM Sans', sans-serif" }}>5</strong>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700', display: 'block', fontFamily: "'DM Sans', sans-serif" }}>Operators</span>
                <strong style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800', fontFamily: "'DM Sans', sans-serif" }}>24</strong>
              </div>

              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '8px 6px', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: '#166534', fontWeight: '700', display: 'block', fontFamily: "'DM Sans', sans-serif" }}>Machines</span>
                <strong style={{ fontSize: '15px', color: '#16A34A', fontWeight: '800', fontFamily: "'DM Sans', sans-serif" }}>6/8</strong>
              </div>
            </div>
          </div>

          {/* 7. CRITICAL KEY ALERTS (PLACED AT THE VERY BOTTOM OF THE DASHBOARD!) */}
          <div className="section-card" style={{ padding: '18px 20px', backgroundColor: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, boxSizing: 'border-box' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FEE2E2', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#DC2626', display: 'inline-block' }}></span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif" }}>
                  CRITICAL KEY ALERTS
                </span>
              </div>
              <span style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}>
                4 ACTIVE NOTIFICATIONS
              </span>
            </div>

            {/* Alert List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Alert 1 */}
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DC2626', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                    !
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#991B1B', fontFamily: "'DM Sans', sans-serif" }}>18 Production Orders are Overdue</span>
                    <span style={{ fontSize: '11px', color: '#7F1D1D', fontFamily: "'DM Sans', sans-serif" }}>Immediate floor supervisor follow-up required</span>
                  </div>
                </div>
                <button style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '6px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Review Orders
                </button>
              </div>

              {/* Alert 2 */}
              <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', borderLeft: '4px solid #EA580C', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EA580C', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                    ▲
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#9A3412', fontFamily: "'DM Sans', sans-serif" }}>Material Shortage for Mini Rail 100mm</span>
                    <span style={{ fontSize: '11px', color: '#C2410C', fontFamily: "'DM Sans', sans-serif" }}>Raw aluminum coil stock below critical safety threshold</span>
                  </div>
                </div>
                <button style={{ backgroundColor: '#EA580C', color: '#FFFFFF', padding: '6px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Issue Material
                </button>
              </div>

              {/* Alert 3 */}
              <div style={{ backgroundColor: '#FEFCE8', border: '1px solid #FEF08A', borderLeft: '4px solid #D97706', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#D97706', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>
                    i
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#854D0E', fontFamily: "'DM Sans', sans-serif" }}>5 Quality Rejection Certificates Pending</span>
                    <span style={{ fontSize: '11px', color: '#A16207', fontFamily: "'DM Sans', sans-serif" }}>Awaiting QC lab verification certificate sign-off</span>
                  </div>
                </div>
                <button style={{ backgroundColor: '#D97706', color: '#FFFFFF', padding: '6px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Inspect QC
                </button>
              </div>

              {/* Alert 4 */}
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderLeft: '4px solid #16A34A', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#16A34A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                    ✓
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534', fontFamily: "'DM Sans', sans-serif" }}>OEE Target Exceeded (86.3%)</span>
                    <span style={{ fontSize: '11px', color: '#15803D', fontFamily: "'DM Sans', sans-serif" }}>Weekly plant efficiency target achieved (+3.4%)</span>
                  </div>
                </div>
                <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '6px 16px', borderRadius: '16px', fontWeight: '700', fontSize: '12px', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Verified
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* CREATE PRODUCTION WORK ORDER MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '460px',
            maxWidth: '90%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Factory style={{ width: '20px', height: '20px', color: '#2563EB' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Create Production Work Order</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}>×</button>
            </div>

            <form onSubmit={handleCreateWorkOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Product / Profile</label>
                <select
                  value={newWO.productName}
                  onChange={(e) => setNewWO({ ...newWO, productName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#0F172A', fontWeight: '600', backgroundColor: '#F8FAFC' }}
                >
                  <option value="Mini Rail 100 mm">Mini Rail 100 mm</option>
                  <option value="Long Rail 3000 mm">Long Rail 3000 mm</option>
                  <option value="Mid Clamp 35 mm">Mid Clamp 35 mm</option>
                  <option value="End Clamp 35 mm">End Clamp 35 mm</option>
                  <option value="Alu. Bracket">Alu. Bracket</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Planned Qty (Nos)</label>
                  <input
                    type="number"
                    value={newWO.plannedQty}
                    onChange={(e) => setNewWO({ ...newWO, plannedQty: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#0F172A', fontWeight: '600', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Target Date</label>
                  <input
                    type="date"
                    value={newWO.targetDate}
                    onChange={(e) => setNewWO({ ...newWO, targetDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#0F172A', fontWeight: '600', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Raw Material Requirement</label>
                <input
                  type="text"
                  value={newWO.rawMaterial}
                  onChange={(e) => setNewWO({ ...newWO, rawMaterial: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#0F172A', fontWeight: '600', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Customer / Client Name</label>
                <input
                  type="text"
                  value={newWO.customer}
                  onChange={(e) => setNewWO({ ...newWO, customer: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#0F172A', fontWeight: '600', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', fontSize: '13px', fontWeight: '700', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  Sync to Zoho Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
