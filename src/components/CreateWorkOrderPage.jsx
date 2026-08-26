import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Layers, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ArrowLeft,
  AlertTriangle,
  Info,
  CheckCircle,
  Package,
  Boxes,
  Cpu,
  RotateCcw
} from 'lucide-react';
import { prodModuleEngine } from '../utils/productionModuleEngine';
import NotificationToast from './NotificationToast';

export default function CreateWorkOrderPage({ onBack, onWorkOrderCreated }) {
  // 1. GENERAL & PRODUCTION STATE
  const [formStep, setFormStep] = useState(1); // 1 = General Details, 2 = Process Routing & Work Plan
  const [woNumber, setWoNumber] = useState(`WO-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [woDate, setWoDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [cutLength, setCutLength] = useState('');
  const [targetQty, setTargetQty] = useState('');
  const [assignedEmployee, setAssignedEmployee] = useState('');
  const [priority, setPriority] = useState('');
  const [productionLocation, setProductionLocation] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [remarks, setRemarks] = useState('');
  const [leftoverStrategy, setLeftoverStrategy] = useState('OVER_PRODUCE_FG');
  const [toastAlert, setToastAlert] = useState(null);

  // Operations & Process Work Plan State (Cutting, Punching, QC, Packing, etc.)
  const [processWorkPlan, setProcessWorkPlan] = useState([]);

  const handleAddWorkPlanStep = () => {
    setProcessWorkPlan(prev => [
      ...prev,
      {
        id: Date.now(),
        stepNo: prev.length + 1,
        opName: '',
        machine: 'CNC Cutting Machine',
        operator: 'Karthik',
        estTimeHours: '',
        estTimeMins: '',
        estTime: '',
        status: 'Pending'
      }
    ]);
  };

  const handleRemoveWorkPlanStep = (id) => {
    setProcessWorkPlan(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, stepNo: i + 1 })));
  };

  const handleUpdateWorkPlanStep = (id, field, value) => {
    setProcessWorkPlan(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Calculation state from recipe engine
  const [matCalc, setMatCalc] = useState(null);

  const recipes = prodModuleEngine.getRecipes();

  // Recalculate material requirements on product code, cut length, or target quantity change
  useEffect(() => {
    if (targetQty && Number(targetQty) > 0) {
      const calc = prodModuleEngine.calculateMaterialRequirement(selectedProductCode, Number(targetQty), cutLength);
      setMatCalc(calc);
    } else {
      setMatCalc(null);
    }
  }, [selectedProductCode, cutLength, targetQty]);

  // Handle Product Change
  const handleProductChange = (e) => {
    const code = e.target.value;
    setSelectedProductCode(code);
    const chosenRecipe = recipes.find(r => r.productCode === code);
    if (chosenRecipe) {
      setInstructions(`Produce ${targetQty || chosenRecipe.expectedOutputQty} ${chosenRecipe.outputUnit} of ${chosenRecipe.productName} using ${chosenRecipe.rawMaterialName}.`);
    }
  };

  // Submit Handler
  const handleCreateWorkOrder = (e) => {
    e.preventDefault();

    if (!targetQty || Number(targetQty) <= 0) {
      setToastAlert({
        type: 'error',
        title: 'Target Quantity Required',
        message: 'Please enter a valid target quantity (> 0).'
      });
      return;
    }

    if (!matCalc || matCalc.error) {
      setToastAlert({
        type: 'error',
        title: 'Material Calculation Error',
        message: 'Unable to calculate material requirement for selected product.'
      });
      return;
    }

    try {
      const newWO = prodModuleEngine.createWorkOrder({
        id: woNumber,
        date: woDate,
        productionHead: 'Senthil Kumar (Production Head)',
        finishedProductCode: selectedProductCode,
        targetQty: Number(targetQty),
        priority,
        productionLocation,
        assignedEmployee,
        expectedStartDate,
        expectedCompletionDate,
        instructions,
        remarks,
        processWorkPlan,
        leftoverStrategy,
        excessFgQty: matCalc ? matCalc.excessOutputPossible : 0,
        returnedOffcutMeters: matCalc ? Number(((2414 - (((Number(targetQty) || 0) % matCalc.piecesPerLength) * (matCalc.cutLenMm || 100))) / 1000).toFixed(2)) : 0
      });

      if (onWorkOrderCreated) {
        onWorkOrderCreated(newWO);
      } else if (onBack) {
        onBack();
      }
    } catch (err) {
      setToastAlert({
        type: 'error',
        title: 'Uh oh! Something went wrong',
        message: err.message || 'Error creating Work Order.'
      });
    }
  };

  const inputStyle = {
    width: '100%',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    padding: '0 12px',
    fontSize: '13px',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
    color: '#64748B'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minWidth: 0, fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* HEADER BANNER */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0F172A' }}>Create Work Order</h1>
          <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0 0' }}>
            Step {formStep} of 2: {formStep === 1 ? 'Product Recipe & Material Details' : 'Manufacturing Process Routing & Work Plan'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* STEP PROGRESS STEPPER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFFFFF', padding: '16px 24px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        
        {/* Step 1 Pill */}
        <div
          onClick={() => setFormStep(1)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: formStep === 1 ? '#0E7490' : '#E2E8F0',
            color: formStep === 1 ? '#FFFFFF' : '#64748B',
            fontWeight: '800',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            1
          </span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: formStep === 1 ? '#0F172A' : '#64748B' }}>
              Work Order & Material Details
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Product recipe, target output, dates
            </div>
          </div>
        </div>

        {/* Connector Line */}
        <div style={{ flex: 1, height: '2px', backgroundColor: formStep === 2 ? '#0E7490' : '#E2E8F0', margin: '0 8px' }} />

        {/* Step 2 Pill */}
        <div
          onClick={() => {
            if (!targetQty || Number(targetQty) <= 0) {
              alert('⚠️ Please enter a target quantity in Step 1 before proceeding.');
              return;
            }
            setFormStep(2);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: formStep === 2 ? '#0E7490' : '#E2E8F0',
            color: formStep === 2 ? '#FFFFFF' : '#64748B',
            fontWeight: '800',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            2
          </span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: formStep === 2 ? '#0F172A' : '#64748B' }}>
              Manufacturing Process Routing & Work Plan
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Cutting, Slot Punching, QC, Packing steps
            </div>
          </div>
        </div>

      </div>

      {formStep === 2 ? (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          
          {/* STEP 2 TITLE BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Manufacturing Process Routing & Work Plan
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                Define sequential shop-floor operations & assign machine workstations and operators.
              </p>
            </div>
          </div>

          {/* PROCESS STEPS TABLE */}
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700', fontSize: '12px' }}>
                  <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}>Step</th>
                  <th style={{ padding: '12px 14px' }}>Process Operation Description</th>
                  <th style={{ padding: '12px 14px' }}>Workstation / Machine</th>
                  <th style={{ padding: '12px 14px' }}>Assigned Floor Employee</th>
                  <th style={{ padding: '12px 14px', width: '130px' }}>Est. Cycle Time</th>
                  <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {processWorkPlan.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '28px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                      No process operations added yet. Click <strong style={{ color: '#0E7490' }}>+ Add Process Step</strong> below to add rows.
                    </td>
                  </tr>
                ) : (
                  processWorkPlan.map((step, idx) => (
                    <tr key={step.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: '#0E7490' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ECFEFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {step.stepNo}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <input
                          type="text"
                          value={step.opName}
                          placeholder="e.g. Uncoiling & Cut to Length"
                          onChange={(e) => handleUpdateWorkPlanStep(step.id, 'opName', e.target.value)}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 10px', fontSize: '13px', color: '#334155', fontWeight: '600', outline: 'none' }}
                        />
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <select
                          value={step.machine}
                          onChange={(e) => handleUpdateWorkPlanStep(step.id, 'machine', e.target.value)}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', color: '#475569', outline: 'none' }}
                        >
                          <option value="CNC Cutting Machine">CNC Cutting Machine</option>
                          <option value="Punching Machine #1">Punching Machine #1</option>
                          <option value="Punching Machine #2">Punching Machine #2</option>
                          <option value="QC Station #1">QC Station #1</option>
                          <option value="Packing Bench">Packing Bench</option>
                          <option value="FRP Line 03">FRP Line 03</option>
                        </select>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <select
                          value={step.operator}
                          onChange={(e) => handleUpdateWorkPlanStep(step.id, 'operator', e.target.value)}
                          style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', color: '#475569', outline: 'none' }}
                        >
                          <option value="Karthik" style={{ color: '#64748B' }}>Karthik</option>
                          <option value="Arul" style={{ color: '#64748B' }}>Arul</option>
                          <option value="Praveen" style={{ color: '#64748B' }}>Praveen</option>
                          <option value="Manoj" style={{ color: '#64748B' }}>Manoj</option>
                        </select>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={step.estTimeHours || ''}
                            onChange={(e) => {
                              const hVal = e.target.value;
                              const mVal = step.estTimeMins || '';
                              const hNum = Number(hVal) || 0;
                              const mNum = Number(mVal) || 0;
                              const formatted = (hNum > 0 && mNum > 0) ? `${hNum} hr ${mNum} mins` : hNum > 0 ? `${hNum} hr` : mNum > 0 ? `${mNum} mins` : '';
                              handleUpdateWorkPlanStep(step.id, 'estTimeHours', hVal);
                              handleUpdateWorkPlanStep(step.id, 'estTime', formatted);
                            }}
                            style={{ width: '48px', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '13px', textAlign: 'center', color: '#64748B', outline: 'none' }}
                          />
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>hr</span>

                          <input
                            type="number"
                            min="0"
                            max="59"
                            placeholder="15"
                            value={step.estTimeMins || ''}
                            onChange={(e) => {
                              const mVal = e.target.value;
                              const hVal = step.estTimeHours || '';
                              const hNum = Number(hVal) || 0;
                              const mNum = Number(mVal) || 0;
                              const formatted = (hNum > 0 && mNum > 0) ? `${hNum} hr ${mNum} mins` : hNum > 0 ? `${hNum} hr` : mNum > 0 ? `${mNum} mins` : '';
                              handleUpdateWorkPlanStep(step.id, 'estTimeMins', mVal);
                              handleUpdateWorkPlanStep(step.id, 'estTime', formatted);
                            }}
                            style={{ width: '48px', height: '36px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '13px', textAlign: 'center', color: '#64748B', outline: 'none' }}
                          />
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700' }}>min</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkPlanStep(step.id)}
                          style={{ border: 'none', backgroundColor: '#FEF2F2', color: '#EF4444', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Remove Operation Step"
                        >
                          <Trash2 style={{ width: '15px', height: '15px' }} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ACTIONS BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setFormStep(1)}
                style={{ border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft style={{ width: '15px', height: '15px' }} /> Back to Step 1
              </button>

              <button
                type="button"
                onClick={handleAddWorkPlanStep}
                style={{ border: '1px solid #0E7490', backgroundColor: '#ECFEFF', color: '#0E7490', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus style={{ width: '15px', height: '15px' }} /> Add Another Process Operation
              </button>
            </div>

            <button
              type="submit"
              onClick={handleCreateWorkOrder}
              style={{ border: 'none', backgroundColor: '#0E7490', color: '#FFFFFF', padding: '10px 24px', borderRadius: '8px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(14, 116, 144, 0.3)' }}
            >
              <Send style={{ width: '16px', height: '16px' }} /> Save & Issue WO with Work Plan
            </button>
          </div>

        </div>
      ) : (
        <form onSubmit={handleCreateWorkOrder} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
        
        {/* LEFT COLUMN: WORK ORDER FORM SECTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SECTION 1: WO METADATA */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <FileText style={{ width: '14px', height: '14px' }} />
              </div>
              <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: '#334155', margin: 0 }}>
                Work Order Details
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>WORK ORDER NUMBER</label>
                <input type="text" value={woNumber} onChange={(e) => setWoNumber(e.target.value)} style={{ ...inputStyle, backgroundColor: '#F8FAFC', fontWeight: '700', color: '#64748B' }} />
              </div>
              <div>
                <label style={labelStyle}>DATE</label>
                <input type="date" value={woDate} readOnly style={{ ...inputStyle, backgroundColor: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>CREATOR (PRODUCTION HEAD)</label>
                <input type="text" value="Senthil Kumar (Production Head)" readOnly style={{ ...inputStyle, backgroundColor: '#F8FAFC' }} />
              </div>
              <div>
                <label style={labelStyle}>PRIORITY</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ ...inputStyle, color: priority ? '#64748B' : '#94A3B8' }}>
                  <option value="" disabled style={{ color: '#94A3B8' }}>Select Priority</option>
                  <option value="High" style={{ color: '#64748B' }}>High Priority</option>
                  <option value="Normal" style={{ color: '#64748B' }}>Normal Priority</option>
                  <option value="Low" style={{ color: '#64748B' }}>Low Priority</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: PRODUCT SELECTION & TARGET */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <Package style={{ width: '14px', height: '14px' }} />
                </div>
                <h3 style={{ fontSize: '13.5px', fontWeight: '700', color: '#64748B', margin: 0 }}>
                  Product & Target Output
                </h3>
              </div>

              {(selectedProductCode || cutLength || targetQty) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductCode('');
                    setCutLength('');
                    setTargetQty('');
                    setMatCalc(null);
                  }}
                  style={{
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  <RotateCcw style={{ width: '12px', height: '12px' }} /> Clear Selection
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>FINISHED PRODUCT (RECIPE)</label>
                <select value={selectedProductCode} onChange={handleProductChange} style={{ ...inputStyle, fontWeight: '600', color: selectedProductCode ? '#64748B' : '#94A3B8' }}>
                  <option value="" disabled style={{ color: '#94A3B8' }}>Select Product</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.productCode} style={{ color: '#64748B' }}>
                      {r.productName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>CUT LENGTH (MM)</label>
                <input
                  type="text"
                  value={cutLength}
                  onChange={(e) => setCutLength(e.target.value)}
                  placeholder="Type the Cut Length"
                  style={{ ...inputStyle, fontSize: '13px', fontWeight: '600', color: cutLength ? '#64748B' : '#94A3B8' }}
                />
              </div>

              <div>
                <label style={labelStyle}>TARGET OUTPUT QTY (PIECES)</label>
                <input
                  type="number"
                  min="1"
                  value={targetQty}
                  onChange={(e) => setTargetQty(e.target.value)}
                  placeholder="Type Output Qty"
                  style={{ ...inputStyle, fontSize: '13px', fontWeight: '600', color: targetQty ? '#64748B' : '#94A3B8' }}
                />
              </div>
            </div>

            {/* RECIPE BADGE BANNER */}
            {matCalc && (
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: '#16A34A', flexShrink: 0 }} />
                <div style={{ fontSize: '12px', color: '#166534', lineHeight: '1.4' }}>
                  <strong>Cut Yield Rule:</strong> 1 Raw Bar (2414 mm) ÷ {matCalc.cutLenMm || 400} mm Cut Length = <strong>{matCalc.piecesPerLength} Pieces per Raw Bar</strong>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: ASSIGNMENT & TIMELINE */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                <Cpu style={{ width: '14px', height: '14px' }} />
              </div>
              <h3 style={{ fontSize: '13.5px', fontWeight: '700', color: '#64748B', margin: 0 }}>
                Production Schedule
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>START DATE</label>
                <input type="date" value={expectedStartDate} onChange={(e) => setExpectedStartDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>TARGET COMPLETION DATE</label>
                <input type="date" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RAW MATERIAL CALCULATION PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                AUTOMATIC MATERIAL REQUIREMENT
              </span>
              <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#F1F5F9', color: '#94A3B8', padding: '2px 7px', borderRadius: '5px' }}>
                RECIPE CALCULATED
              </span>
            </div>

            {matCalc ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* EXACT THEORETICAL MAT REQUIRED */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>THEORETICAL REQUIREMENT</span>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#334155' }}>
                    {matCalc.exactRequiredMatQty.toFixed(2)} {matCalc.recipe.rawMaterialUnit}s
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Raw Material: <strong style={{ color: '#475569' }}>{matCalc.recipe.rawMaterialName}</strong>
                  </span>
                </div>

                {/* PHYSICAL WHOLE UNIT CONSTRAINT BOX */}
                <div style={{
                  backgroundColor: matCalc.isWholeUnitConstraint ? '#FFF7ED' : '#F8FAFC',
                  border: `1px solid ${matCalc.isWholeUnitConstraint ? '#FFEDD5' : '#E2E8F0'}`,
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: matCalc.isWholeUnitConstraint ? '#C2410C' : '#64748B' }}>
                      PHYSICAL UNITS TO ISSUE
                    </span>
                    {matCalc.isWholeUnitConstraint && (
                      <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#C2410C', backgroundColor: '#FFEDD5', padding: '2px 5px', borderRadius: '4px' }}>
                        WHOLE UNIT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: matCalc.isWholeUnitConstraint ? '#C2410C' : '#475569' }}>
                    {matCalc.physicalMatToIssue} {matCalc.recipe.rawMaterialUnit}
                  </div>

                  {matCalc.isWholeUnitConstraint && (
                    <div style={{ fontSize: '11px', color: '#9A3412', lineHeight: '1.35', display: 'flex', gap: '6px', alignItems: 'flex-start', marginTop: '2px' }}>
                      <AlertTriangle style={{ width: '14px', height: '14px', color: '#C2410C', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        Raw material is stocked as whole physical units ({matCalc.recipe.rawMaterialUnit}).
                        <div style={{ marginTop: '2px', fontWeight: '700' }}>
                          Expected Output: {matCalc.expectedTheoreticalOutput} Pieces ({matCalc.excessOutputPossible} excess pieces possible).
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ESTIMATED WASTAGE & SCRAP BOX */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748B' }}>ESTIMATED SCRAP & WASTAGE</span>
                    <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                      {matCalc.wastagePercent}% SCRAP
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#475569' }}>
                    {matCalc.endOffcutScrapMmPerBar} mm <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>end scrap/bar ({matCalc.totalWastageMeters}m total)</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Formula: 2414mm - ({matCalc.piecesPerLength} pcs × {matCalc.cutLenMm || 100}mm)
                  </span>
                </div>

                {/* LEFTOVER MATERIAL HANDLING STRATEGY (OPTION 1 vs OPTION 2) */}
                {matCalc.isWholeUnitConstraint && matCalc.excessOutputPossible > 0 && (
                  <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        LEFTOVER MATERIAL HANDLING
                      </span>
                      <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#0369A1', backgroundColor: '#E0F2FE', padding: '2px 6px', borderRadius: '4px' }}>
                        2 METHODS
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Method 1 */}
                      <label style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '12px',
                        color: leftoverStrategy === 'OVER_PRODUCE_FG' ? '#0369A1' : '#475569',
                        cursor: 'pointer',
                        fontWeight: leftoverStrategy === 'OVER_PRODUCE_FG' ? '700' : '500',
                        backgroundColor: leftoverStrategy === 'OVER_PRODUCE_FG' ? '#FFFFFF' : 'transparent',
                        padding: '8px',
                        borderRadius: '6px',
                        border: `1px solid ${leftoverStrategy === 'OVER_PRODUCE_FG' ? '#38BDF8' : '#E2E8F0'}`
                      }}>
                        <input
                          type="radio"
                          name="leftoverStrat"
                          value="OVER_PRODUCE_FG"
                          checked={leftoverStrategy === 'OVER_PRODUCE_FG'}
                          onChange={() => setLeftoverStrategy('OVER_PRODUCE_FG')}
                          style={{ accentColor: '#0E7490', marginTop: '2px' }}
                        />
                        <div>
                          <div><strong>Method 1: Over-Produce to FG Store</strong></div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal', marginTop: '2px' }}>
                            Cut all {matCalc.expectedTheoreticalOutput} pieces. Credit <strong>+{matCalc.excessOutputPossible} extra pieces</strong> to FG Store for future orders.
                          </div>
                        </div>
                      </label>

                      {/* Method 2 */}
                      <label style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '12px',
                        color: leftoverStrategy === 'RETURN_OFFCUT_STOCK' ? '#0369A1' : '#475569',
                        cursor: 'pointer',
                        fontWeight: leftoverStrategy === 'RETURN_OFFCUT_STOCK' ? '700' : '500',
                        backgroundColor: leftoverStrategy === 'RETURN_OFFCUT_STOCK' ? '#FFFFFF' : 'transparent',
                        padding: '8px',
                        borderRadius: '6px',
                        border: `1px solid ${leftoverStrategy === 'RETURN_OFFCUT_STOCK' ? '#38BDF8' : '#E2E8F0'}`
                      }}>
                        <input
                          type="radio"
                          name="leftoverStrat"
                          value="RETURN_OFFCUT_STOCK"
                          checked={leftoverStrategy === 'RETURN_OFFCUT_STOCK'}
                          onChange={() => setLeftoverStrategy('RETURN_OFFCUT_STOCK')}
                          style={{ accentColor: '#0E7490', marginTop: '2px' }}
                        />
                        <div>
                          <div><strong>Method 2: Return Usable Offcut Bar</strong></div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal', marginTop: '2px' }}>
                            Cut target {matCalc.targetQty} pcs. Return remaining <strong>{matCalc.remainderOffcutMeters}m bar</strong> back to Raw Store as Usable Offcut.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* STOCK AVAILABILITY CHECK */}
                <div style={{
                  backgroundColor: matCalc.isSufficient ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${matCalc.isSufficient ? '#A7F3D0' : '#FECACA'}`,
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: matCalc.isSufficient ? '#047857' : '#B91C1C' }}>
                      STOCK AVAILABILITY
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: '900', color: matCalc.isSufficient ? '#047857' : '#B91C1C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {matCalc.isSufficient ? (
                        <>
                          <CheckCircle style={{ width: '13px', height: '13px', color: '#047857' }} /> AVAILABLE
                        </>
                      ) : (
                        <>
                          <AlertTriangle style={{ width: '13px', height: '13px', color: '#B91C1C' }} /> INSUFFICIENT
                        </>
                      )}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', marginTop: '2px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '10px' }}>AVAILABLE STOCK</span>
                      <strong style={{ fontSize: '14px', color: '#0F172A' }}>{matCalc.availableStock} {matCalc.recipe.rawMaterialUnit}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '10px' }}>SHORTAGE QTY</span>
                      <strong style={{ fontSize: '14px', color: matCalc.isSufficient ? '#047857' : '#DC2626' }}>
                        {matCalc.shortageQty} {matCalc.recipe.rawMaterialUnit}
                      </strong>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '12.5px' }}>
                Select product & enter target quantity to calculate raw material requirements.
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (!targetQty || Number(targetQty) <= 0) {
                  alert('⚠️ Please enter a valid target quantity (> 0).');
                  return;
                }
                setFormStep(2);
              }}
              style={{
                width: '100%',
                height: '42px',
                backgroundColor: '#0E7490',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(14, 116, 144, 0.35)',
                marginTop: '4px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#085D75'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0E7490'}
            >
              Next: Configure Process Routing Plan →
            </button>
          </div>

        </div>

      </form>
      )}
      {/* ─── CUSTOM TOAST NOTIFICATION ─── */}
      {toastAlert && (
        <NotificationToast
          alert={toastAlert}
          onClose={() => {
            const woToPass = toastAlert.pendingWO;
            setToastAlert(null);
            if (woToPass) {
              if (onWorkOrderCreated) onWorkOrderCreated(woToPass);
              else if (onBack) onBack();
            }
          }}
        />
      )}
    </div>
  );
}
