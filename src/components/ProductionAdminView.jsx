import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, TrendingUp, Percent, CheckCircle2, XCircle, Clock, Cpu,
  Calendar, Filter, AlertTriangle, AlertCircle, Info, ShieldCheck, Factory,
  Users, Layers, Award, BarChart2, Package, ArrowUpRight, ArrowDownRight, Settings,
  MoreHorizontal, Plus, RefreshCw, Check, Maximize2, Sparkles, SlidersHorizontal, ArrowUpDown, Hourglass,
  Truck, FileText, IndianRupee
} from 'lucide-react';
import POStatusOverview from './POStatusOverview';
import DailyProductionTrendChart from './DailyProductionTrendChart';
import StatusBadge from './StatusBadge';
import { prodModuleEngine } from '../utils/productionModuleEngine';

export default function ProductionAdminView({ activeTab, userRole }) {
  const isDispatchView = userRole === 'Dispatch Head' || activeTab === 'Dispatch Dashboard';
  const isFloorView = userRole === 'Floor Employee' || userRole === 'Machine Operator' || activeTab === 'Floor Employee' || activeTab === 'Operator Workspace';
  const [selectedMonth, setSelectedMonth] = useState('07');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [trendFilter, setTrendFilter] = useState('Daily');
  const [activeTrendIndex, setActiveTrendIndex] = useState(6);

  // Live Zoho Inventory Work Orders State
  const [workOrders, setWorkOrders] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('controlroom_prod_dismissed_alerts') || '[]');
    } catch (e) {
      return [];
    }
  });

  const handleDismissAlert = (id) => {
    const updated = [...dismissedAlerts, id];
    setDismissedAlerts(updated);
    try {
      localStorage.setItem('controlroom_prod_dismissed_alerts', JSON.stringify(updated));
    } catch (e) { }
  };

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
      const res = await fetch('/api/workorders');
      let serverWOs = [];
      if (res.ok) {
        const data = await res.json();
        if (data.workOrders && Array.isArray(data.workOrders)) {
          serverWOs = data.workOrders;
        }
      }
      const engineWOs = prodModuleEngine.getWorkOrders() || [];
      const woMap = new Map();
      
      // Combine engine work orders first
      engineWOs.forEach(wo => {
        const key = wo.id || wo.workOrderNo;
        if (key) {
          woMap.set(key, {
            id: wo.id,
            workOrderNo: wo.id || wo.workOrderNo,
            productName: wo.finishedProductCode || wo.productName || 'Solar Mounting Rail',
            plannedQty: wo.targetQty || wo.plannedQty || 500,
            completedQty: wo.completedQty || 0,
            delayDays: wo.delayDays || 0,
            delayReason: wo.delayReason || 'Normal Production',
            status: wo.status || 'In Progress',
            statusColor: wo.statusColor || '#EA580C',
            rawMaterial: wo.rawMaterial || 'Raw Alu Coil',
            customer: wo.customer || 'Solar Client',
            targetDate: wo.targetDate || wo.date || new Date().toISOString().split('T')[0]
          });
        }
      });

      // Overlay server work orders
      serverWOs.forEach(wo => {
        const key = wo.workOrderNo || wo.id;
        if (key) {
          woMap.set(key, { ...woMap.get(key), ...wo });
        }
      });

      setWorkOrders(Array.from(woMap.values()));
    } catch (err) {
      console.error('Failed to fetch work orders:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const [, setEngineTick] = useState(0);

  useEffect(() => {
    fetchWorkOrders();
    const unsubscribe = prodModuleEngine.subscribe(() => {
      setEngineTick(t => t + 1);
      fetchWorkOrders();
    });
    return () => unsubscribe();
  }, []);

  const realEngineWOs = prodModuleEngine.getWorkOrders();

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/workorders', {
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

  // Helper for drawing rounded-corner annular sectors matching reference image
  const drawAnnularSector = (ctx, cx, cy, innerR, outerR, startAngle, endAngle, cornerRadius, color) => {
    const gap = 0.045; // Clean radial gap between sectors
    const a1 = startAngle + gap / 2;
    const a2 = endAngle - gap / 2;
    if (a2 <= a1 + 0.01) return;

    ctx.save();
    ctx.beginPath();
    // Outer arc
    ctx.arc(cx, cy, outerR, a1, a2, false);
    // Inner arc in reverse
    ctx.arc(cx, cy, innerR, a2, a1, true);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    // Round corner join effect matching reference image rounded sector corners
    ctx.lineWidth = cornerRadius;
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  };

  // 1. Production Status Donut Canvas (Exact Reference Donut System with Annular Sectors & Rounded Sector Corners)
  const drawStatusDonut = () => {
    const canvas = statusDonutRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 190;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const x = size / 2;
    const y = size / 2;
    const outerRadius = 82;
    const innerRadius = 58;
    const cornerRadius = 4;

    // Proportional percentages for Work Order status distribution
    const segments = [
      { color: '#22C55E', pct: 0.52 }, // Completed (#22C55E - Green)
      { color: '#0084FF', pct: 0.20 }, // In Progress (#0084FF - Blue)
      { color: '#06B6D4', pct: 0.12 }, // Planned (#06B6D4 - Cyan)
      { color: '#38BDF8', pct: 0.09 }, // Approved (#38BDF8 - Sky Blue)
      { color: '#F43F5E', pct: 0.07 }  // Delayed (#F43F5E - Red)
    ];

    let currentAngle = -Math.PI / 2;

    segments.forEach(seg => {
      if (seg.pct <= 0) return;

      const arcSpan = seg.pct * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + arcSpan;

      drawAnnularSector(ctx, x, y, innerRadius, outerRadius, startAngle, endAngle, cornerRadius, seg.color);

      currentAngle += arcSpan;
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

  // Display orders dynamically from real prodModuleEngine store
  const displayOrders = realEngineWOs.map(wo => {
    let stColor = '#2563EB';
    if (wo.status === 'COMPLETED_PENDING_VERIFICATION') stColor = '#0E7490';
    if (wo.status === 'APPROVED_CLOSED') stColor = '#16A34A';
    if (wo.status === 'PENDING_MATERIAL') stColor = '#D97706';
    return {
      workOrderNo: wo.id,
      productName: wo.finishedProductName,
      plannedQty: wo.targetQty,
      completedQty: wo.actualGoodOutput || 0,
      delayDays: 'On Time',
      delayReason: wo.instructions || 'Standard Production',
      status: (wo.status || 'PLANNED').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      statusColor: stColor
    };
  });

  return (
    <div ref={containerRef} style={{ fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', paddingTop: '4px' }}>



      {/* ROW 1: KPI SUMMARY CARDS (5 CARDS FOR DISPATCH / 6 CARDS FOR FLOOR & PRODUCTION) */}
      <div style={{ display: 'grid', gridTemplateColumns: isDispatchView ? 'repeat(5, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
        {(isFloorView ? [
          {
            title: 'SHIFT TARGET QTY',
            value: '1,200',
            trend: 'Target for Shift A',
            trendUp: true,
            icon: Factory,
            iconColor: '#FFFFFF',
            iconBg: '#0284C7',
            bottomPrefix: 'Shift A Target',
            bottomHighlight: ''
          },
          {
            title: 'UNITS COMPLETED TODAY',
            value: '942',
            trend: '78.5% of Shift Target',
            trendUp: true,
            icon: CheckCircle2,
            iconColor: '#FFFFFF',
            iconBg: '#15803D',
            bottomPrefix: 'Shift A Actual',
            bottomHighlight: ''
          },
          {
            title: 'SHIFT EFFICIENCY %',
            value: '94.2%',
            trend: '↑ 2.1% vs Yesterday',
            trendUp: true,
            icon: TrendingUp,
            iconColor: '#FFFFFF',
            iconBg: '#6B21A8',
            bottomPrefix: 'Operator OEE',
            bottomHighlight: ''
          },
          {
            title: 'CURRENT LINE SPEED',
            value: '42 m/min',
            trend: 'Optimal Speed',
            trendUp: true,
            icon: Cpu,
            iconColor: '#FFFFFF',
            iconBg: '#0E7490',
            bottomPrefix: 'CNC Line 1',
            bottomHighlight: ''
          },
          {
            title: 'REJECTED UNITS',
            value: '12',
            trend: '1.2% Rejection Rate',
            trendUp: false,
            icon: AlertCircle,
            iconColor: '#FFFFFF',
            iconBg: '#DC2626',
            bottomPrefix: 'Pass QA Check',
            bottomHighlight: ''
          },
          {
            title: 'ACTIVE MACHINE',
            value: 'CNC Line 01',
            trend: 'Running Smoothly',
            trendUp: true,
            icon: Settings,
            iconColor: '#FFFFFF',
            iconBg: '#D97706',
            bottomPrefix: 'Status: RUNNING',
            bottomHighlight: ''
          }
        ] : isDispatchView ? [
          {
            title: 'DISPATCHED TODAY',
            value: '28',
            trend: '12.4% vs Last Month',
            trendUp: true,
            icon: Truck,
            iconColor: '#FFFFFF',
            iconBg: '#0284C7',
            bottomPrefix: 'Till 09:30 AM',
            bottomHighlight: ''
          },
          {
            title: 'DISPATCHED (MTD)',
            value: '352',
            trend: '12.6% vs Last Month',
            trendUp: true,
            icon: Package,
            iconColor: '#FFFFFF',
            iconBg: '#6B21A8',
            bottomPrefix: 'This Month',
            bottomHighlight: ''
          },
          {
            title: 'ON TIME DISPATCH %',
            value: '96.4%',
            trend: '4.2% vs Last Month',
            trendUp: true,
            icon: CheckCircle2,
            iconColor: '#FFFFFF',
            iconBg: '#0D9488',
            bottomPrefix: 'This Month',
            bottomHighlight: ''
          },
          {
            title: 'DISPATCH PENDING',
            value: '14',
            trend: '2 vs Last Month',
            trendUp: false,
            icon: Clock,
            iconColor: '#FFFFFF',
            iconBg: '#EA580C',
            bottomPrefix: 'This Month',
            bottomHighlight: ''
          },
          {
            title: 'DISPATCH VALUE (MTD)',
            value: '₹ 3.26 Cr',
            trend: '14.8% vs Last Month',
            trendUp: true,
            icon: IndianRupee,
            iconColor: '#FFFFFF',
            iconBg: '#A21CAF',
            bottomPrefix: 'This Month',
            bottomHighlight: ''
          }
        ] : [
          {
            title: 'TOTAL PLAN (NOS)',
            value: '5,280',
            trend: '10.4%',
            trendUp: true,
            icon: ClipboardList,
            iconColor: '#16A34A',
            iconBg: '#F0FDF4',
            bottomPrefix: 'Monthly target set at ',
            bottomHighlight: '5,280 NOS'
          },
          {
            title: 'TOTAL PRODUCTION',
            value: '4,862',
            trend: '11.2%',
            trendUp: true,
            icon: TrendingUp,
            iconColor: '#0284C7',
            iconBg: '#F0F9FF',
            bottomPrefix: 'This month, completed ',
            bottomHighlight: '4,862 units'
          },
          {
            title: 'PLAN ACHIEVEMENT',
            value: '92.1%',
            trend: '2.3%',
            trendUp: true,
            icon: Percent,
            iconColor: '#8B5CF6',
            iconBg: '#F3E8FF',
            bottomPrefix: 'On track for target, ',
            bottomHighlight: '92.1% achieved'
          },
          {
            title: 'GOOD PRODUCTION',
            value: '4,746',
            trend: '10.8%',
            trendUp: true,
            icon: CheckCircle2,
            iconColor: '#059669',
            iconBg: '#ECFDF5',
            bottomPrefix: 'Quality yield rate ',
            bottomHighlight: '97.6% passed'
          },
          {
            title: 'REJECTION (NOS)',
            value: '116',
            trend: '1.6%',
            trendUp: true,
            icon: XCircle,
            iconColor: '#DC2626',
            iconBg: '#FEF2F2',
            bottomPrefix: 'Scrap reduction down by ',
            bottomHighlight: '1.6%'
          },
          {
            title: 'DOWNTIME (HRS)',
            value: '31.6 Hrs',
            trend: '8.5%',
            trendUp: true,
            icon: Clock,
            iconColor: '#D97706',
            iconBg: '#FFF7ED',
            bottomPrefix: 'Breakdown time reduced by ',
            bottomHighlight: '8.5%'
          }
        ]).map((kpi, kIdx) => {
          const IconComp = kpi.icon;
          return (
            <div
              key={kIdx}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #EAEFEF',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 4px 18px rgba(15, 23, 42, 0.03)',
                transition: 'all 0.2s ease',
                minWidth: 0,
                boxSizing: 'border-box'
              }}
            >
              {/* Top Main Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '800',
                    color: '#64748B',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {kpi.title}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
                    {kpi.value}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: kpi.trendUp ? '#059669' : '#DC2626',
                      backgroundColor: kpi.trendUp ? '#ECFDF5' : '#FEF2F2',
                      border: kpi.trendUp ? '1px solid #A7F3D0' : '1px solid #FECACA',
                      padding: '2px 7.5px',
                      borderRadius: '8px',
                      lineHeight: '1.2'
                    }}
                  >
                    {kpi.trendUp ? (
                      <ArrowUpRight style={{ width: '13px', height: '13px' }} />
                    ) : (
                      <ArrowDownRight style={{ width: '13px', height: '13px' }} />
                    )}
                    {kpi.trend}
                  </span>
                </div>
              </div>

              {/* Bottom Sub-Card Box */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  fontSize: '11.5px',
                  fontWeight: '500',
                  color: '#64748B',
                  lineHeight: '1.4',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                <span>{kpi.bottomPrefix}</span>
                <span style={{ color: kpi.trendUp ? '#059669' : '#DC2626', fontWeight: '800' }}>
                  {kpi.bottomHighlight}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2 CONTINUOUS FLEX COLUMNS LAYOUT (ORIGINAL SCRIPT DESIGN) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '16px', width: '100%', boxSizing: 'border-box', alignItems: 'start' }}>

        {/* ==================== LEFT CONTINUOUS FLEX COLUMN ==================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', minWidth: 0 }}>

          {/* 1. STATUS BREAKDOWN WITH MASTER PIE CHART COMPONENT */}
          <POStatusOverview
            title={isFloorView ? "My Assigned Work Orders" : isDispatchView ? "Dispatch Orders by Status" : "Work Orders by Status"}
            totalCount={String(realEngineWOs.length)}
            totalLabel={isFloorView ? "ASSIGNED WOs" : isDispatchView ? "TOTAL ORDERS" : "TOTAL ORDERS"}
            items={[
              {
                name: 'In Production',
                count: `${realEngineWOs.filter(w => w.status === 'IN_PROGRESS' || w.status === 'ACCEPTED').length} WOs`,
                color: '#0284C7',
                pct: realEngineWOs.length ? (realEngineWOs.filter(w => w.status === 'IN_PROGRESS' || w.status === 'ACCEPTED').length / realEngineWOs.length) : 0
              },
              {
                name: 'Completed & Approved',
                count: `${realEngineWOs.filter(w => w.status === 'APPROVED_CLOSED').length} WOs`,
                color: '#16A34A',
                pct: realEngineWOs.length ? (realEngineWOs.filter(w => w.status === 'APPROVED_CLOSED').length / realEngineWOs.length) : 0
              },
              {
                name: 'Pending Verification',
                count: `${realEngineWOs.filter(w => w.status === 'COMPLETED_PENDING_VERIFICATION').length} WOs`,
                color: '#0E7490',
                pct: realEngineWOs.length ? (realEngineWOs.filter(w => w.status === 'COMPLETED_PENDING_VERIFICATION').length / realEngineWOs.length) : 0
              },
              {
                name: 'Draft / Pending Material',
                count: `${realEngineWOs.filter(w => w.status === 'PENDING_MATERIAL' || w.status === 'DRAFT' || w.status === 'MATERIAL_RESERVED').length} WOs`,
                color: '#EA580C',
                pct: realEngineWOs.length ? (realEngineWOs.filter(w => w.status === 'PENDING_MATERIAL' || w.status === 'DRAFT' || w.status === 'MATERIAL_RESERVED').length / realEngineWOs.length) : 0
              }
            ]}
          />

          {/* 2. DAILY DISPATCH / PRODUCTION TREND WITH CORAL ORANGE BAR DESIGN */}
          <DailyProductionTrendChart
            title={isDispatchView ? "Daily Dispatch Volume & On-Time %" : "Workflow Runs Over Time"}
            mainValue={isDispatchView ? "352" : "6,324"}
          />

          {/* 3. DISPATCH / PRODUCTION / MY MACHINE PRODUCTION */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isFloorView ? 'My Machine Output (CNC Line 01)' : isDispatchView ? 'Dispatch by Product / Profile (MTD)' : 'Production by Product / Profile'}
              </span>
            </div>

            <div style={{ border: '1px solid #F1F5F9', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Product / Profile <ArrowUpDown style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
                      </div>
                    </th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{isFloorView ? 'Shift Target' : isDispatchView ? 'Orders' : 'Planned'}</th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{isFloorView ? 'Completed' : isDispatchView ? 'Dispatched Qty' : 'Actual'}</th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{isDispatchView ? 'On Time %' : 'Achievement %'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(isFloorView ? [
                    { name: 'Mini Rail 100 mm', plan: '600 Nos', act: '542 Nos', pct: 90.3 },
                    { name: 'Mini Rail 60 mm', plan: '400 Nos', act: '320 Nos', pct: 80.0 },
                    { name: 'Long Rail 3000 mm', plan: '200 Nos', act: '80 Nos', pct: 40.0 }
                  ] : isDispatchView ? [
                    { name: 'Mini Rail 100 mm', plan: '18', act: '12,450 Nos', pct: 97.2 },
                    { name: 'Mini Rail 60 mm', plan: '12', act: '8,300 Nos', pct: 96.1 },
                    { name: 'Long Rail 3000 mm', plan: '8', act: '5,200 Nos', pct: 95.0 },
                    { name: 'Mid Clamp 35 mm', plan: '11', act: '22,600 Nos', pct: 94.5 },
                    { name: 'End Clamp 35 mm', plan: '6', act: '8,900 Nos', pct: 100 },
                    { name: 'Other Accessories', plan: '9', act: '6,420 Nos', pct: 96.0 }
                  ] : [
                    { name: 'Mini Rail 100 mm', plan: '1,500', act: '1,402', pct: 93.5 },
                    { name: 'Mini Rail 60 mm', plan: '1,200', act: '1,102', pct: 91.8 },
                    { name: 'Long Rail 3000 mm', plan: '600', act: '538', pct: 89.7 },
                    { name: 'Mid Clamp 35 mm', plan: '1,300', act: '1,210', pct: 93.1 },
                    { name: 'End Clamp 35 mm', plan: '400', act: '362', pct: 90.5 },
                    { name: 'Other Accessories', plan: '280', act: '248', pct: 88.6 }
                  ]).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 10px', color: '#0F172A', fontWeight: '700' }}>{row.name}</td>
                      <td style={{ padding: '7px 10px', color: '#64748B' }}>{row.plan}</td>
                      <td style={{ padding: '7px 10px', color: '#0F172A', fontWeight: '700' }}>{row.act}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '60px', height: '5px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${row.pct}%`, height: '100%', backgroundColor: '#0284C7' }}></div>
                          </div>
                          <strong style={{ fontSize: '10.5px', color: '#0284C7', fontWeight: '800' }}>{row.pct}%</strong>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: '800', color: '#0F172A', borderTop: '1px solid #CBD5E1', backgroundColor: '#F8FAFC' }}>
                    <td style={{ padding: '7px 10px' }}>Total Shift Output</td>
                    <td style={{ padding: '7px 10px' }}>{isFloorView ? '1,200 Nos' : isDispatchView ? '64' : '5,280'}</td>
                    <td style={{ padding: '7px 10px' }}>{isFloorView ? '942 Nos' : isDispatchView ? '63,870' : '4,862'}</td>
                    <td style={{ padding: '7px 10px', color: '#0284C7' }}>{isFloorView ? '78.5%' : isDispatchView ? '96.4%' : '92.1%'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. DISPATCH DELAY REASONS / DOWNTIME ANALYSIS */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isFloorView ? 'My Shift Downtime Log' : isDispatchView ? 'Dispatch Delay Analysis' : 'Downtime Analysis'}
              </span>
            </div>

            <div style={{ border: '1px solid #F1F5F9', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Reason <ArrowUpDown style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
                      </div>
                    </th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{isFloorView ? 'Duration' : isDispatchView ? 'Delayed Orders' : 'Hours'}</th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>% of Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {(isFloorView ? [
                    { reason: 'Tool Change / Setup', hrs: '25 Mins', pct: 5.2 },
                    { reason: 'Material Coil Change', hrs: '15 Mins', pct: 3.1 },
                    { reason: 'Minor Jam / Sensor Check', hrs: '10 Mins', pct: 2.0 }
                  ] : isDispatchView ? [
                    { reason: 'Material Not Ready from Production', hrs: '6 Orders', pct: 42.8 },
                    { reason: 'Vehicle / Transporter Delay', hrs: '4 Orders', pct: 28.5 },
                    { reason: 'Packing / Labeling Pending', hrs: '2 Orders', pct: 14.3 },
                    { reason: 'Customer Payment / Hold', hrs: '1 Order', pct: 7.2 },
                    { reason: 'Documentation / E-Way Bill Hold', hrs: '1 Order', pct: 7.2 }
                  ] : [
                    { reason: 'Machine Breakdown', hrs: '12.6 hrs', pct: 39.9 },
                    { reason: 'Material Not Ready', hrs: '7.8 hrs', pct: 24.7 },
                    { reason: 'Tool Change / Setup', hrs: '5.4 hrs', pct: 17.1 },
                    { reason: 'Quality Check / Rejection', hrs: '3.2 hrs', pct: 10.1 },
                    { reason: 'Operator Absence', hrs: '2.6 hrs', pct: 8.2 }
                  ]).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === (isFloorView ? 2 : 4) ? 'none' : '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 10px', color: '#0F172A', fontWeight: '700' }}>{row.reason}</td>
                      <td style={{ padding: '7px 10px', color: '#DC2626', fontWeight: '800' }}>{row.hrs}</td>
                      <td style={{ padding: '7px 10px', color: '#64748B', fontWeight: '600' }}>{row.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. VEHICLE UTILIZATION / QUALITY REJECTION BREAKDOWN */}
          <POStatusOverview
            title={isDispatchView ? "Vehicle Fleet Status Breakdown" : "Quality Rejection Breakdown"}
            totalCount={isDispatchView ? "32" : "116"}
            totalLabel={isDispatchView ? "TOTAL VEHICLES" : "TOTAL REJECTS"}
            items={isDispatchView ? [
              { name: 'Loaded & Dispatched', count: '18 Vehicles', color: '#15803D', pct: 0.563 },
              { name: 'In Transit', count: '6 Vehicles', color: '#0284C7', pct: 0.187 },
              { name: 'Loading at Yard', count: '4 Vehicles', color: '#EAB308', pct: 0.125 },
              { name: 'Waiting for Loading', count: '4 Vehicles', color: '#EC4899', pct: 0.125 }
            ] : [
              { name: 'Dim. Out', count: '54 Nos', color: '#0284C7', pct: 0.465 },
              { name: 'Scratch', count: '28 Nos', color: '#16A34A', pct: 0.241 },
              { name: 'Bent', count: '18 Nos', color: '#EA580C', pct: 0.155 },
              { name: 'Offset', count: '10 Nos', color: '#2563EB', pct: 0.086 },
              { name: 'Others', count: '6 Nos', color: '#DC2626', pct: 0.053 }
            ]}
          />

        </div>

        {/* ==================== RIGHT CONTINUOUS FLEX COLUMN ==================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', minWidth: 0 }}>

          {/* 1. TOP 5 DELAYED PRODUCTION ORDERS / DISPATCH ORDERS */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isDispatchView ? 'Top 5 Delayed Dispatch Orders' : 'Top 5 Delayed Production Orders'}
                </span>
                <span style={{ fontSize: '9.5px', color: isDispatchView ? '#2563EB' : '#0E7490', fontWeight: '700', backgroundColor: isDispatchView ? '#EFF6FF' : '#ECFEFF', padding: '2px 8px', borderRadius: '8px' }}>
                  {isDispatchView ? 'Synced with Zoho' : 'Internal ControlRoom'}
                </span>
              </div>
            </div>

            <div style={{ border: '1px solid #F1F5F9', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Order No. <ArrowUpDown style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
                      </div>
                    </th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{isDispatchView ? 'Customer / Destination' : 'Product / Profile'}</th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{isDispatchView ? 'Dispatch Qty' : 'Planned'}</th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Delay</th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(isDispatchView ? [
                    { workOrderNo: 'VRM26/07/118', productName: 'ABC Solar Pvt Ltd', plannedQty: '500 Nos', delayDays: '2 Days', status: 'Overdue' },
                    { workOrderNo: 'VRM26/07/101', productName: 'Sun Power EPC', plannedQty: '200 Nos', delayDays: '2 Days', status: 'Overdue' },
                    { workOrderNo: 'VRM26/07/089', productName: 'Green Infra Ltd', plannedQty: '1500 Nos', delayDays: '1 Day', status: 'Pending' },
                    { workOrderNo: 'VRM26/07/074', productName: 'Bright Energy', plannedQty: '400 Nos', delayDays: '1 Day', status: 'Pending' },
                    { workOrderNo: 'VRM26/07/061', productName: 'Voltix Solutions', plannedQty: '300 Nos', delayDays: '1 Day', status: 'Pending' }
                  ] : displayOrders).map((ord, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === (isDispatchView ? 4 : displayOrders.length - 1) ? 'none' : '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 10px', color: '#64748B', fontWeight: '600' }}>{ord.workOrderNo}</td>
                      <td style={{ padding: '7px 10px', fontWeight: '700', color: '#0F172A' }}>{ord.productName}</td>
                      <td style={{ padding: '7px 10px', color: '#64748B' }}>{ord.plannedQty}</td>
                      <td style={{ padding: '7px 10px', fontWeight: '800', color: ord.status === 'Overdue' ? '#DC2626' : '#D97706' }}>{ord.delayDays || '1 Day'}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <StatusBadge status={ord.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. VEHICLES IN TRANSIT / MACHINE PERFORMANCE */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isDispatchView ? 'Vehicles in Transit' : 'Machine Performance'}
              </span>
            </div>

            <div style={{ border: '1px solid #F1F5F9', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {isDispatchView ? 'Vehicle / Transporter' : 'Machine / Line'} <ArrowUpDown style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
                      </div>
                    </th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{isDispatchView ? 'Order No' : 'Planned'}</th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{isDispatchView ? 'Dispatched' : 'Actual'}</th>
                    <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>{isDispatchView ? 'ETA' : 'Utilization'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(isDispatchView ? [
                    { name: 'TN 09 AB 1234 (SRS Logistics)', plan: 'VRM/26/07/101', act: '23-Jul-2026', util: 92, label: '24-Jul-2026' },
                    { name: 'TN 37 CD 5678 (VRM Transport)', plan: 'VRM/26/07/089', act: '23-Jul-2026', util: 88, label: '24-Jul-2026' },
                    { name: 'KA 01 EF 9012 (Safe Way)', plan: 'VRM/26/07/074', act: '23-Jul-2026', util: 95, label: '24-Jul-2026' },
                    { name: 'AP 39 GH 3456 (SST Transport)', plan: 'VRM/26/07/061', act: '23-Jul-2026', util: 84, label: '24-Jul-2026' },
                    { name: 'TN 88 U 7890 (Speed Cargo)', plan: 'VRM/26/07/090', act: '23-Jul-2026', util: 90, label: '25-Jul-2026' }
                  ] : [
                    { name: 'CNC Cutting Machine', plan: '1,200', act: '1,102', util: 82 },
                    { name: 'Punching Machine - 1', plan: '1,000', act: '912', util: 76 },
                    { name: 'Punching Machine - 2', plan: '800', act: '678', util: 74 },
                    { name: 'Drilling Machine', plan: '600', act: '546', util: 81 },
                    { name: 'Tapping Machine', plan: '400', act: '322', util: 70 },
                    { name: 'Roll Forming Line', plan: '1,280', act: '1,302', util: 79 }
                  ]).map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === (isDispatchView ? 4 : 5) ? 'none' : '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 10px', color: '#0F172A', fontWeight: '700' }}>{m.name}</td>
                      <td style={{ padding: '7px 10px', color: '#64748B' }}>{m.plan}</td>
                      <td style={{ padding: '7px 10px', fontWeight: '700', color: '#0F172A' }}>{m.act}</td>
                      <td style={{ padding: '7px 10px' }}>
                        {isDispatchView ? (
                          <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#0369A1', backgroundColor: '#E0F2FE', padding: '2px 6px', borderRadius: '4px' }}>
                            {m.label}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '60px', height: '5px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${m.util}%`, height: '100%', backgroundColor: '#2563EB' }}></div>
                            </div>
                            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0F172A' }}>{m.util}%</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. DOCUMENT CHECKLIST & INVOICES PENDING / MACHINE OPERATOR PERFORMANCE */}
          {isDispatchView ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Document Checklist (Today)
                </span>
              </div>

              <div style={{ border: '1px solid #F1F5F9', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                      <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Document Name</th>
                      <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Required</th>
                      <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Completed</th>
                      <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Tax Invoices', req: 28, comp: 27, pend: '1 Pending', color: '#DC2626' },
                      { name: 'E-Way Bills', req: 28, comp: 28, pend: 'Done', color: '#16A34A' },
                      { name: 'LR / Delivery Challans', req: 28, comp: 28, pend: 'Done', color: '#16A34A' },
                      { name: 'Packing Lists', req: 28, comp: 27, pend: '1 Pending', color: '#DC2626' },
                      { name: 'Test Certificates (TC)', req: 12, comp: 10, pend: '2 Pending', color: '#D97706' }
                    ].map((doc, idx) => (
                      <tr key={idx} style={{ borderBottom: idx === 4 ? 'none' : '1px solid #F1F5F9' }}>
                        <td style={{ padding: '7px 10px', fontWeight: '700', color: '#0F172A' }}>{doc.name}</td>
                        <td style={{ padding: '7px 10px', color: '#64748B' }}>{doc.req}</td>
                        <td style={{ padding: '7px 10px', fontWeight: '700', color: '#16A34A' }}>{doc.comp}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ color: doc.color, fontWeight: '800', fontSize: '10px' }}>
                            {doc.pend}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Machine Operator Performance
                </span>
              </div>

              <div style={{ border: '1px solid #F1F5F9', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                      <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          Operator <ArrowUpDown style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
                        </div>
                      </th>
                      <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Machine</th>
                      <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Efficiency</th>
                      <th style={{ padding: '7px 10px', color: '#94A3B8', fontWeight: '700', fontSize: '10.5px' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'R. Karthik', machine: 'CNC Cutting', eff: '94.1%', grade: 'A+', color: '#16A34A' },
                      { name: 'M. Arul', machine: 'Punching - 1', eff: '92.4%', grade: 'A', color: '#16A34A' },
                      { name: 'S. Praveen', machine: 'Punching - 2', eff: '88.0%', grade: 'B+', color: '#EAB308' },
                      { name: 'K. Manoj', machine: 'Drilling', eff: '94.0%', grade: 'A', color: '#16A34A' },
                      { name: 'P. Kumar', machine: 'Tapping', eff: '84.0%', grade: 'B', color: '#EAB308' },
                      { name: 'V. Senthil', machine: 'Roll Forming', eff: '95.6%', grade: 'A+', color: '#16A34A' }
                    ].map((op, idx) => (
                      <tr key={idx} style={{ borderBottom: idx === 5 ? 'none' : '1px solid #F1F5F9' }}>
                        <td style={{ padding: '7px 10px', fontWeight: '700', color: '#0F172A' }}>{op.name}</td>
                        <td style={{ padding: '7px 10px', color: '#64748B' }}>{op.machine}</td>
                        <td style={{ padding: '7px 10px', fontWeight: '700', color: '#0F172A' }}>{op.eff}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ backgroundColor: op.color, color: 'white', padding: '2px 7px', borderRadius: '8px', fontWeight: '800', fontSize: '10px' }}>
                            {op.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. FLEET SLA COMPLIANCE / OEE ANALYSIS */}
          {isDispatchView ? (
            <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0, boxSizing: 'border-box' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                DISPATCH PERFORMANCE METRICS <span style={{ color: '#64748B', fontWeight: '600', fontSize: '11px' }}>(THIS MONTH)</span>
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700' }}>Avg Loading</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={14} /></div>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>52 Mins</strong>
                  <span style={{ fontSize: '8px', color: '#16A34A', fontWeight: 'bold' }}>↓ 8 Mins</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700' }}>Avg Waiting</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hourglass size={14} /></div>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>41 Mins</strong>
                  <span style={{ fontSize: '8px', color: '#16A34A', fontWeight: 'bold' }}>↑ 10 Mins</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700' }}>Right First Time</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={14} /></div>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>99.0%</strong>
                  <span style={{ fontSize: '8px', color: '#16A34A', fontWeight: 'bold' }}>↑ 1.2%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700' }}>Documentation</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} /></div>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>98.5%</strong>
                  <span style={{ fontSize: '8px', color: '#16A34A', fontWeight: 'bold' }}>↑ 1.0%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700' }}>Complaints</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={14} /></div>
                  <strong style={{ fontSize: '15px', color: '#0F172A' }}>2</strong>
                  <span style={{ fontSize: '8px', color: '#16A34A', fontWeight: 'bold' }}>↓ 1</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: "'DM Sans', sans-serif" }}>
                <div><span style={{ color: '#64748B' }}>Total Dispatches:</span> <strong>352 Orders</strong></div>
                <div><span style={{ color: '#64748B' }}>On-Time Dispatches:</span> <strong style={{ color: '#16A34A' }}>339 Orders</strong></div>
                <div><span style={{ color: '#64748B' }}>Delayed Dispatches:</span> <strong style={{ color: '#DC2626' }}>13 Orders</strong></div>
              </div>
            </div>
          ) : (
            <div className="section-card" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0, boxSizing: 'border-box' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
          )}

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
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
                  <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#EF4444', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
                  <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '10px', width: '10px', backgroundColor: '#DC2626' }}></span>
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CRITICAL KEY ALERTS</span>
              </div>
              {dismissedAlerts.length < 3 && localStorage.getItem('controlroom_notifications_read') !== 'true' ? (
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '3px 10px', borderRadius: '12px', border: '1px solid #FEE2E2' }}>
                  {3 - dismissedAlerts.length} ACTIVE NOTIFICATIONS
                </span>
              ) : (
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#059669', backgroundColor: '#ECFDF5', padding: '3px 10px', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                  ALL READ & DISMISSED
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* ALERT 1 */}
              {!dismissedAlerts.includes(1) && localStorage.getItem('controlroom_notifications_read') !== 'true' && (
                <div style={{ position: 'relative', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '18px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0284C7', color: '#FFFFFF', padding: '2px 12px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)' }}>
                    <Hourglass style={{ width: '11px', height: '11px' }} /> Pending
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1.5px solid #BAE6FD', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)' }}>
                      <Hourglass style={{ width: '22px', height: '22px', color: '#0284C7' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>5 Quality Rejection Certificates Pending</span>
                      <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '500' }}>Your data is being processed. Awaiting QC lab verification certificate sign-off.</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <button style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '6px 14px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,23,42,0.15)' }}>
                      Inspect QC
                    </button>
                    <button
                      onClick={() => handleDismissAlert(1)}
                      style={{ backgroundColor: 'transparent', color: '#475569', border: 'none', fontWeight: '600', fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* ALERT 2 */}
              {!dismissedAlerts.includes(2) && localStorage.getItem('controlroom_notifications_read') !== 'true' && (
                <div style={{ position: 'relative', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '18px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#F59E0B', color: '#FFFFFF', padding: '2px 12px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)' }}>
                    <AlertTriangle style={{ width: '11px', height: '11px' }} /> Warning
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1.5px solid #FDE68A', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)' }}>
                      <AlertTriangle style={{ width: '22px', height: '22px', color: '#D97706' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>Incomplete Setup & Material Shortage</span>
                      <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '500' }}>Raw aluminum coil stock below critical safety threshold. Some fields are missing.</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <button style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '6px 14px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,23,42,0.15)' }}>
                      Issue Material
                    </button>
                    <button
                      onClick={() => handleDismissAlert(2)}
                      style={{ backgroundColor: 'transparent', color: '#475569', border: 'none', fontWeight: '600', fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* ALERT 3 */}
              {!dismissedAlerts.includes(3) && localStorage.getItem('controlroom_notifications_read') !== 'true' && (
                <div style={{ position: 'relative', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1.5px solid #CBD5E1', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)' }}>
                      <Clock style={{ width: '22px', height: '22px', color: '#475569' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>Update Made by "Xchyler"</span>
                      <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: '500' }}>A change was made to "BO-T" file & 18 Production Orders.</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <button style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '6px 14px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(15,23,42,0.15)' }}>
                      View Changes
                    </button>
                    <button
                      onClick={() => handleDismissAlert(3)}
                      style={{ backgroundColor: 'transparent', color: '#475569', border: 'none', fontWeight: '600', fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {(dismissedAlerts.length >= 3 || localStorage.getItem('controlroom_notifications_read') === 'true') && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
                  All notifications have been marked read and dismissed.
                </div>
              )}

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
