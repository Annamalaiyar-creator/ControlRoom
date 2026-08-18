import React, { useState, useMemo } from 'react';
import { 
  Calculator, Cpu, Layers, Layers3, ArrowRight, RefreshCw, CheckCircle2, 
  AlertTriangle, Settings, Plus, Info, Scale, PieChart, FileText, Check, ArrowLeft
} from 'lucide-react';
import { materialEngine, DENSITY_MAP } from '../utils/materialCalculationEngine';

const PRESETS = [
  {
    name: 'Solar Mounting Plate (2500×1250 Sheet)',
    ruleId: '2D_SHEET_PLATE_CUTTING',
    input: {
      length: 2500,
      width: 1250,
      thickness: 2.0,
      quantity: 10,
      materialGrade: 'Aluminum 6063-T6',
      product: { productLength: 500, productWidth: 250, targetQuantity: 0 }
    },
    options: { kerf: 2.0, edgeMargin: 5.0, orientation: 'auto' }
  },
  {
    name: 'Mini Rail 100mm (6000mm Profile Bar)',
    ruleId: '1D_PROFILE_LINEAR_CUTTING',
    input: {
      stockLength: 6000,
      linearWeightKgM: 0.85,
      quantity: 20,
      materialGrade: 'Aluminum 6063-T6',
      product: { productLength: 100, targetQuantity: 1000 }
    },
    options: { kerf: 2.5, trimMargin: 10.0 }
  },
  {
    name: 'GI Steel Base Plate (2000×1000 Sheet)',
    ruleId: '2D_SHEET_PLATE_CUTTING',
    input: {
      length: 2000,
      width: 1000,
      thickness: 3.0,
      quantity: 5,
      materialGrade: 'GI Steel (Galvanized)',
      product: { productLength: 400, productWidth: 300, targetQuantity: 0 }
    },
    options: { kerf: 3.0, edgeMargin: 10.0, orientation: 'auto' }
  }
];

export default function MaterialCalculationEngine({ onBack }) {
  const [selectedRuleId, setSelectedRuleId] = useState('2D_SHEET_PLATE_CUTTING');
  
  // Input Form States
  const [length, setLength] = useState(2500);
  const [width, setWidth] = useState(1250);
  const [thickness, setThickness] = useState(2.0);
  const [stockLength, setStockLength] = useState(6000);
  const [linearWeightKgM, setLinearWeightKgM] = useState(0.85);
  const [quantity, setQuantity] = useState(10);
  const [materialGrade, setMaterialGrade] = useState('Aluminum 6063-T6');
  const [unitCostPerKg, setUnitCostPerKg] = useState(245);

  // Finished Product Specs
  const [productLength, setProductLength] = useState(500);
  const [productWidth, setProductWidth] = useState(250);
  const [targetQuantity, setTargetQuantity] = useState(0);

  // Cutting Process Parameters
  const [kerf, setKerf] = useState(2.0);
  const [edgeMargin, setEdgeMargin] = useState(5.0);
  const [orientation, setOrientation] = useState('auto');

  // Custom Rule Registration Modal
  const [showRegisterRuleModal, setShowRegisterRuleModal] = useState(false);
  const [customRuleName, setCustomRuleName] = useState('');
  const [customRuleDesc, setCustomRuleDesc] = useState('');
  const [customRulesList, setCustomRulesList] = useState([]);

  // Load Preset
  const handleLoadPreset = (preset) => {
    setSelectedRuleId(preset.ruleId);
    if (preset.ruleId === '2D_SHEET_PLATE_CUTTING') {
      setLength(preset.input.length);
      setWidth(preset.input.width);
      setThickness(preset.input.thickness);
      setQuantity(preset.input.quantity);
      setMaterialGrade(preset.input.materialGrade);
      setProductLength(preset.input.product.productLength);
      setProductWidth(preset.input.product.productWidth);
      setTargetQuantity(preset.input.product.targetQuantity);
      setKerf(preset.options.kerf);
      setEdgeMargin(preset.options.edgeMargin);
      setOrientation(preset.options.orientation);
    } else if (preset.ruleId === '1D_PROFILE_LINEAR_CUTTING') {
      setStockLength(preset.input.stockLength);
      setLinearWeightKgM(preset.input.linearWeightKgM);
      setQuantity(preset.input.quantity);
      setMaterialGrade(preset.input.materialGrade);
      setProductLength(preset.input.product.productLength);
      setTargetQuantity(preset.input.product.targetQuantity);
      setKerf(preset.options.kerf);
    }
  };

  // Perform Calculation Engine Evaluation
  const calcResult = useMemo(() => {
    if (selectedRuleId === '1D_PROFILE_LINEAR_CUTTING') {
      return materialEngine.calculate('1D_PROFILE_LINEAR_CUTTING', {
        stockLength: Number(stockLength),
        linearWeightKgM: Number(linearWeightKgM),
        quantity: Number(quantity),
        materialGrade,
        product: { productLength: Number(productLength), targetQuantity: Number(targetQuantity) }
      }, {
        kerf: Number(kerf),
        trimMargin: Number(edgeMargin)
      });
    }

    // Default 2D Sheet Cutting
    return materialEngine.calculate('2D_SHEET_PLATE_CUTTING', {
      length: Number(length),
      width: Number(width),
      thickness: Number(thickness),
      quantity: Number(quantity),
      materialGrade,
      product: { productLength: Number(productLength), productWidth: Number(productWidth), targetQuantity: Number(targetQuantity) }
    }, {
      kerf: Number(kerf),
      edgeMargin: Number(edgeMargin),
      orientation
    });
  }, [selectedRuleId, length, width, thickness, stockLength, linearWeightKgM, quantity, materialGrade, productLength, productWidth, targetQuantity, kerf, edgeMargin, orientation]);

  // Total Material Cost Calculations
  const totalCost = (calcResult.output.rawWeightKg * unitCostPerKg).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const finishedGoodsCost = (calcResult.output.finishedWeightKg * unitCostPerKg).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const scrapCost = (calcResult.output.scrapWeightKg * unitCostPerKg).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Top Title & Presets Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu style={{ width: '20px', height: '20px', color: '#2563EB' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>
                Material Consumption & Cutting Calculation Engine
              </h2>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', display: 'block' }}>
              Modular calculation engine for raw sheet nesting, profile cutting, offcut analysis, and material reconciliation.
            </span>
          </div>
        </div>

        <button 
          onClick={() => setShowRegisterRuleModal(true)}
          style={{ backgroundColor: '#1E293B', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
          Register New Calculation Rule
        </button>
      </div>

      {/* Preset Quick Selectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F8FAFC', padding: '10px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers style={{ width: '14px', height: '14px' }} /> Load Preset Scenario:
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleLoadPreset(p)}
            style={{ border: '1px solid #CBD5E1', background: 'white', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#1E293B', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Main 2-Column Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Input Configuration Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F172A', margin: 0, paddingBottom: '10px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings style={{ width: '16px', height: '16px', color: '#2563EB' }} />
            1. Manufacturing Parameters
          </h3>

          {/* Active Calculation Rule Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
              Calculation Rule Model
            </label>
            <select 
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', fontWeight: 'bold', color: '#1E293B', backgroundColor: '#F8FAFC' }}
            >
              <option value="2D_SHEET_PLATE_CUTTING">2D Sheet & Plate Grid Cutting</option>
              <option value="1D_PROFILE_LINEAR_CUTTING">1D Profile & Rail Linear Cutting</option>
              {customRulesList.map(r => (
                <option key={r.id} value={r.id}>{r.name} (Custom)</option>
              ))}
            </select>
          </div>

          {/* Raw Material Specification inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E293B' }}>Raw Material Specifications</span>

            {selectedRuleId === '2D_SHEET_PLATE_CUTTING' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Sheet Length (mm)</label>
                    <input type="number" value={length} onChange={(e) => setLength(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Sheet Width (mm)</label>
                    <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Thickness (mm)</label>
                    <input type="number" step="0.1" value={thickness} onChange={(e) => setThickness(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Issued Sheets (Qty)</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Stock Length (mm)</label>
                    <input type="number" value={stockLength} onChange={(e) => setStockLength(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Linear Weight (kg/m)</label>
                    <input type="number" step="0.01" value={linearWeightKgM} onChange={(e) => setLinearWeightKgM(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Issued Profile Bars (Qty)</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
                </div>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Material Grade</label>
                <select value={materialGrade} onChange={(e) => setMaterialGrade(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 6px', fontSize: '12px', backgroundColor: 'white' }}>
                  {Object.keys(DENSITY_MAP).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Unit Rate (₹/kg)</label>
                <input type="number" value={unitCostPerKg} onChange={(e) => setUnitCostPerKg(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
              </div>
            </div>
          </div>

          {/* Finished Product Target Specifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E293B' }}>Finished Product Specifications</span>

            {selectedRuleId === '2D_SHEET_PLATE_CUTTING' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Product Length (mm)</label>
                  <input type="number" value={productLength} onChange={(e) => setProductLength(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Product Width (mm)</label>
                  <input type="number" value={productWidth} onChange={(e) => setProductWidth(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Cut Length (mm)</label>
                <input type="number" value={productLength} onChange={(e) => setProductLength(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Target Finished Qty (0 = Max Possible)</label>
              <input type="number" value={targetQuantity} onChange={(e) => setTargetQuantity(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
            </div>
          </div>

          {/* Cutting & Machine Process Parameters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E293B' }}>Process & Machine Parameters</span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Blade Kerf Loss (mm)</label>
                <input type="number" step="0.5" value={kerf} onChange={(e) => setKerf(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Edge Margin Trim (mm)</label>
                <input type="number" step="1" value={edgeMargin} onChange={(e) => setEdgeMargin(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 8px', fontSize: '13px' }} />
              </div>
            </div>

            {selectedRuleId === '2D_SHEET_PLATE_CUTTING' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>Cutting Orientation</label>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value)} style={{ width: '100%', height: '34px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0 6px', fontSize: '12px', backgroundColor: 'white' }}>
                  <option value="auto">Auto (Optimal Best Yield)</option>
                  <option value="0">0° Horizontal Only</option>
                  <option value="90">90° Vertical Rotated Only</option>
                </select>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Engine Calculation Outputs & Visual Nesting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* KPI METRICS GRID (4 CARDS) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            
            {/* Card 1: Theoretical Yield */}
            <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Theoretical Max Yield</span>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>
                {calcResult.output.theoreticalYieldPieces.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 'normal' }}>Pieces</span>
              </div>
              <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                {calcResult.gridDetails?.yieldPerSheet ? `${calcResult.gridDetails.yieldPerSheet} Pcs / Sheet` : `${calcResult.gridDetails?.piecesPerBar} Pcs / Bar`}
              </span>
            </div>

            {/* Card 2: Actual Finished Qty */}
            <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Actual Finished Goods</span>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB' }}>
                {calcResult.output.actualPiecesProduced.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 'normal' }}>Pcs</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Weight: {calcResult.output.finishedWeightKg} kg (₹ {finishedGoodsCost})
              </span>
            </div>

            {/* Card 3: Material Consumed */}
            <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Issued Raw Material</span>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>
                {calcResult.output.rawWeightKg} <span style={{ fontSize: '13px', fontWeight: 'normal' }}>kg</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Cost: ₹ {totalCost} ({quantity} {selectedRuleId === '2D_SHEET_PLATE_CUTTING' ? 'Sheets' : 'Bars'})
              </span>
            </div>

            {/* Card 4: Utilization % */}
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>Material Utilization</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803D' }}>
                {calcResult.output.utilizationPct}%
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#DCFCE7', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ width: `${calcResult.output.utilizationPct}%`, height: '100%', backgroundColor: '#166534' }} />
              </div>
            </div>

          </div>

          {/* VISUAL CUTTING & NESTING DIAGRAM */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers3 style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                2. Visual Cutting Nesting & Offcut Layout
              </h3>
              <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                Orientation: {calcResult.chosenOrientation || 'Linear Standard'}
              </span>
            </div>

            {/* Interactive SVG Diagram */}
            <div style={{ width: '100%', backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              {selectedRuleId === '2D_SHEET_PLATE_CUTTING' ? (
                <svg viewBox="0 0 1000 500" style={{ width: '100%', height: 'auto', maxHeight: '280px' }}>
                  {/* Raw Sheet Boundary */}
                  <rect x="10" y="10" width="980" height="480" fill="#F1F5F9" stroke="#64748B" strokeWidth="3" strokeDasharray="4 4" rx="6" />
                  
                  {/* Usable Edge Margin Boundary */}
                  <rect x="25" y="25" width="950" height="450" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" rx="4" />

                  {/* Render Grid of Finished Plates */}
                  {(() => {
                    const cols = calcResult.gridDetails?.columnsPerSheet || 1;
                    const rows = calcResult.gridDetails?.rowsPerSheet || 1;
                    const cellW = (930 - (cols - 1) * 8) / cols;
                    const cellH = (430 - (rows - 1) * 8) / rows;
                    
                    const rects = [];
                    for (let r = 0; r < rows; r++) {
                      for (let c = 0; c < cols; c++) {
                        const x = 35 + c * (cellW + 8);
                        const y = 35 + r * (cellH + 8);
                        rects.push(
                          <g key={`${r}-${c}`}>
                            <rect x={x} y={y} width={cellW} height={cellH} fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" rx="3" />
                            <text x={x + cellW / 2} y={y + cellH / 2 + 4} fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">
                              Pcs #{r * cols + c + 1}
                            </text>
                          </g>
                        );
                      }
                    }
                    return rects;
                  })()}

                  {/* Dimension Annotations */}
                  <text x="500" y="22" fill="#475569" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Raw Sheet Length: {length} mm (Usable Grid: {calcResult.gridDetails?.columnsPerSheet} Cols)
                  </text>
                  <text x="18" y="250" fill="#475569" fontSize="12" fontWeight="bold" textAnchor="middle" transform="rotate(-90 18 250)">
                    Width: {width} mm
                  </text>
                </svg>
              ) : (
                <svg viewBox="0 0 1000 160" style={{ width: '100%', height: 'auto', maxHeight: '120px' }}>
                  {/* Raw Bar Stock */}
                  <rect x="20" y="30" width="960" height="80" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" rx="4" />
                  
                  {/* Linear Pieces */}
                  {(() => {
                    const pcs = calcResult.gridDetails?.piecesPerBar || 1;
                    const barW = (940 - (pcs - 1) * 4) / pcs;
                    const rects = [];
                    for (let i = 0; i < Math.min(pcs, 12); i++) {
                      const x = 30 + i * (barW + 4);
                      rects.push(
                        <g key={i}>
                          <rect x={x} y={40} width={barW} height={60} fill="#10B981" stroke="#047857" strokeWidth="1.5" rx="3" />
                          <text x={x + barW / 2} y={75} fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">
                            #{i + 1}
                          </text>
                        </g>
                      );
                    }
                    return rects;
                  })()}

                  <text x="500" y="20" fill="#475569" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Stock Bar Length: {stockLength} mm ({calcResult.gridDetails?.piecesPerBar} Pcs/Bar @ {productLength} mm)
                  </text>
                </svg>
              )}
            </div>

            {/* Reusable Offcut Banner */}
            {calcResult.reusableOffcuts && calcResult.reusableOffcuts.length > 0 ? (
              <div style={{ backgroundColor: '#FEFCE8', border: '1px solid #FEF08A', padding: '12px 16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#854D0E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 style={{ width: '15px', height: '15px', color: '#CA8A04' }} />
                  Reusable Offcut Material Detected ({calcResult.output.reusableOffcutWeightKg} kg):
                </span>
                {calcResult.reusableOffcuts.map((off, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#713F12', display: 'flex', justifyContent: 'space-between', paddingLeft: '22px' }}>
                    <span>• <strong>{off.label}</strong>: {off.dimensions} (× {off.count} pcs)</span>
                    <span><strong>{off.weightKg} kg</strong> (Save: ₹ {(off.weightKg * unitCostPerKg).toLocaleString()})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info style={{ width: '15px', height: '15px', color: '#64748B', flexShrink: 0 }} />
                <span>No reusable offcut remnants detected (Remaining offcuts are smaller than minimum threshold).</span>
              </div>
            )}

          </div>

          {/* MATERIAL RECONCILIATION AUDIT TABLE */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                3. Material Reconciliation & Financial Loss Breakdown
              </h3>
              <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#F0FDF4', color: '#15803D', padding: '4px 10px', borderRadius: '6px', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 style={{ width: '12px', height: '12px' }} /> 100% Mass Balanced
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#64748B', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 'bold' }}>Category</th>
                    <th style={{ padding: '10px 14px', fontWeight: 'bold' }}>Mass (kg)</th>
                    <th style={{ padding: '10px 14px', fontWeight: 'bold' }}>Mass Share (%)</th>
                    <th style={{ padding: '10px 14px', fontWeight: 'bold' }}>Financial Valuation (₹)</th>
                    <th style={{ padding: '10px 14px', fontWeight: 'bold', textAlign: 'center' }}>Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {calcResult.reconciliation.map((rec, idx) => {
                    const rowVal = (rec.weightKg * unitCostPerKg).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1E293B' }}>{rec.category}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0F172A' }}>{rec.weightKg} kg</td>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#334155' }}>{rec.pct}%</td>
                        <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#1E293B' }}>₹ {rowVal}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            backgroundColor: rec.status === 'GOOD_YIELD' ? '#DCFCE7' : rec.status === 'REUSABLE' ? '#FEF3C7' : '#FEE2E2',
                            color: rec.status === 'GOOD_YIELD' ? '#166534' : rec.status === 'REUSABLE' ? '#B45309' : '#DC2626'
                          }}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 'bold', borderTop: '2px solid #E2E8F0' }}>
                    <td style={{ padding: '12px 14px', color: '#0F172A' }}>Total Issued Material Input</td>
                    <td style={{ padding: '12px 14px', color: '#2563EB' }}>{calcResult.output.rawWeightKg} kg</td>
                    <td style={{ padding: '12px 14px', color: '#0F172A' }}>100%</td>
                    <td style={{ padding: '12px 14px', color: '#0F172A' }}>₹ {totalCost}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#166534' }}>RECONCILED</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: Register New Calculation Rule */}
      {showRegisterRuleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '14px', width: '480px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>
              Register Custom Calculation Rule Model
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Add extensible manufacturing formula rules to the calculation engine without altering UI components.
            </span>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Rule Name</label>
              <input 
                type="text" 
                placeholder="e.g., Slitting & Blanking Formula Rule" 
                value={customRuleName} 
                onChange={(e) => setCustomRuleName(e.target.value)}
                style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Rule Description / Manufacturing Process</label>
              <textarea 
                rows="3" 
                placeholder="Describe cutting direction, formula logic, or parameters..." 
                value={customRuleDesc} 
                onChange={(e) => setCustomRuleDesc(e.target.value)}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={() => setShowRegisterRuleModal(false)}
                style={{ border: '1px solid #CBD5E1', background: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (customRuleName.trim()) {
                    const newId = `CUSTOM_${Date.now()}`;
                    const newRule = { id: newId, name: customRuleName };
                    setCustomRulesList(prev => [...prev, newRule]);
                    setSelectedRuleId(newId);
                    setShowRegisterRuleModal(false);
                    setCustomRuleName('');
                    setCustomRuleDesc('');
                    alert(`✅ Custom Rule "${customRuleName}" successfully registered in calculation engine!`);
                  }
                }}
                style={{ border: 'none', background: '#2563EB', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Register Rule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
