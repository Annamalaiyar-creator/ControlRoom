import React, { useState } from 'react';
import { 
  Calendar, 
  Trash2, 
  Plus, 
  UploadCloud, 
  Save, 
  Send, 
  CheckCircle2, 
  Clock, 
  Info, 
  Sparkles, 
  Layers, 
  User, 
  Tag, 
  ArrowUpRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { prodInventoryStore } from '../utils/productionInventoryStore';

export default function CreateWorkOrderPage({ onBack, onWorkOrderCreated }) {
  // 1. BASIC INFORMATION STATE (BLANK FOR NEW CREATION)
  const [woNumber, setWoNumber] = useState(`WO-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [woDate, setWoDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [customerProject, setCustomerProject] = useState('');
  const [salesOrderNo, setSalesOrderNo] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [productionLine, setProductionLine] = useState('');
  const [workOrderType, setWorkOrderType] = useState('Manufacturing');
  const [assignedTo, setAssignedTo] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [tagsReference, setTagsReference] = useState('');

  // 2. PRODUCT & PRODUCTION SETUP STATE
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productionMethod, setProductionMethod] = useState('Manual Production (No BOM)');
  const [plannedQty, setPlannedQty] = useState('');
  const [uom, setUom] = useState('Nos (Units)');
  const [revisionVersion, setRevisionVersion] = useState('');
  const [productDescription, setProductDescription] = useState('');

  // 3. MATERIALS / COMPONENTS STATE (EMPTY ARRAY)
  const [materialSourceMode, setMaterialSourceMode] = useState('manual');
  const [materials, setMaterials] = useState([]);

  // 4. ROUTING / OPERATIONS STATE (EMPTY ARRAY)
  const [routingMode, setRoutingMode] = useState('manual');
  const [routingSteps, setRoutingSteps] = useState([]);

  // 5. ADDITIONAL INFORMATION STATE
  const [paymentTerms, setPaymentTerms] = useState('');
  const [shipmentPreference, setShipmentPreference] = useState('');
  const [targetStockDate, setTargetStockDate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Handlers for Materials table
  const handleAddMaterial = () => {
    const newMat = {
      id: Date.now(),
      name: 'New Component Component',
      specification: 'Standard Spec',
      uom: 'Nos',
      requiredQty: '100',
      source: 'Buy',
      remarks: 'Buy'
    };
    setMaterials(prev => [...prev, newMat]);
  };

  const handleRemoveMaterial = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleMaterialChange = (id, field, val) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  // Handlers for Operations table
  const handleAddOperation = () => {
    const nextSeq = (routingSteps.length + 1) * 10;
    const newOp = {
      id: Date.now(),
      seq: nextSeq.toString(),
      operation: 'New Operation',
      machine: 'Workstation 01',
      operator: 'Operator',
      plannedTime: '00:30',
      setupTime: '00:10',
      runTime: '00:05'
    };
    setRoutingSteps(prev => [...prev, newOp]);
  };

  const handleRemoveOperation = (id) => {
    setRoutingSteps(prev => prev.filter(o => o.id !== id));
  };

  const handleOperationChange = (id, field, val) => {
    setRoutingSteps(prev => prev.map(o => o.id === id ? { ...o, [field]: val } : o));
  };

  // Form Submit Handlers
  const handleSubmit = (statusLabel) => {
    const newWO = {
      id: woNumber,
      productName: selectedProduct,
      customerProject,
      productionLine,
      plannedQty: `${plannedQty} ${uom.split(' ')[0]}`,
      plannedDate: plannedStartDate,
      dueDate,
      status: statusLabel,
      priority,
      assignedTo,
      progress: 0,
      materials,
      routingSteps,
      specialInstructions
    };

    prodInventoryStore.createWorkOrder(newWO);
    alert(`✅ Work Order ${woNumber} (${statusLabel}) created successfully!`);

    if (onWorkOrderCreated) {
      onWorkOrderCreated(newWO);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", color: '#0f172a' }}>
      
      {/* ----------------- TOP TITLE BAR & MAIN ACTIONS ----------------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>Create Work Order</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Create a new work order with or without BOM. You can manually define materials and operations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {onBack && (
            <button 
              onClick={onBack}
              style={{ border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}

          <button 
            onClick={() => handleSubmit('Draft')}
            style={{ border: 'none', backgroundColor: '#1d4ed8', color: '#ffffff', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(29,78,216,0.2)' }}
          >
            <Save style={{ width: '15px', height: '15px' }} />
            Save as Draft
          </button>

          <button 
            onClick={() => handleSubmit('Submitted / Pending Approval')}
            style={{ border: 'none', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '8px', padding: '9px 22px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(37,99,235,0.25)' }}
          >
            <Send style={{ width: '15px', height: '15px' }} />
            Submit for Approval
          </button>
        </div>
      </div>

      {/* ----------------- MAIN FORM CONTAINER (FULL WIDTH) ----------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* ================= MAIN FORM SECTIONS ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="section-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '12px', fontWeight: 'bold' }}>1</div>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Basic Information</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '14px' }}>
              
              {/* Work Order No */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Work Order No. *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="text" 
                    value={woNumber} 
                    onChange={(e) => setWoNumber(e.target.value)}
                    style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 8px', borderRadius: '6px' }}>
                    Auto
                  </span>
                </div>
              </div>

              {/* Work Order Date */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Work Order Date *
                </label>
                <input 
                  type="date" 
                  value={woDate} 
                  onChange={(e) => setWoDate(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Planned Start Date */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Planned Start Date *
                </label>
                <input 
                  type="date" 
                  value={plannedStartDate} 
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Due Date */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Due Date *
                </label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '14px' }}>
              
              {/* Customer / Project */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Customer / Project *
                </label>
                <select 
                  value={customerProject} 
                  onChange={(e) => setCustomerProject(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="">Select Customer / Project...</option>
                  <option value="VRM Solar Project">VRM Solar Project</option>
                  <option value="ABC Solar Pvt Ltd">ABC Solar Pvt Ltd</option>
                  <option value="XYZ Solar">XYZ Solar</option>
                  <option value="SunRay Energy">SunRay Energy</option>
                </select>
              </div>

              {/* Sales Order No */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Sales Order No.
                </label>
                <select 
                  value={salesOrderNo} 
                  onChange={(e) => setSalesOrderNo(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="">Select Sales Order...</option>
                  <option value="SO-2026-018">SO-2026-018</option>
                  <option value="SO-2026-019">SO-2026-019</option>
                  <option value="SO-2026-020">SO-2026-020</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Priority *
                </label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', fontWeight: 'bold', color: priority === 'High' ? '#dc2626' : '#1e293b', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">🚩 High</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Production Line */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Production Line *
                </label>
                <select 
                  value={productionLine} 
                  onChange={(e) => setProductionLine(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="">Select Line...</option>
                  <option value="Structure Line 1">Structure Line 1</option>
                  <option value="Rail Line 1">Rail Line 1</option>
                  <option value="Rail Line 2">Rail Line 2</option>
                  <option value="FRP Line">FRP Line</option>
                </select>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              
              {/* Work Order Type */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Work Order Type *
                </label>
                <select 
                  value={workOrderType} 
                  onChange={(e) => setWorkOrderType(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Subcontracting">Subcontracting</option>
                  <option value="Rework">Rework</option>
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Assigned To *
                </label>
                <select 
                  value={assignedTo} 
                  onChange={(e) => setAssignedTo(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="">Select User...</option>
                  <option value="Arun Kumar">👤 Arun Kumar</option>
                  <option value="Kumaravel">👤 Kumaravel</option>
                  <option value="Suresh B">👤 Suresh B</option>
                  <option value="Ramesh P">👤 Ramesh P</option>
                </select>
              </div>

              {/* Estimated Completion */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Estimated Completion
                </label>
                <input 
                  type="date" 
                  value={estimatedCompletion} 
                  onChange={(e) => setEstimatedCompletion(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Tags / Reference */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Tags / Reference
                </label>
                <input 
                  type="text" 
                  placeholder="Enter tags or reference (optional)"
                  value={tagsReference} 
                  onChange={(e) => setTagsReference(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
              </div>

            </div>
          </div>

          {/* SECTION 2: PRODUCT & PRODUCTION SETUP */}
          <div className="section-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '12px', fontWeight: 'bold' }}>2</div>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Product & Production Setup</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr', gap: '16px', alignItems: 'start', marginBottom: '14px' }}>
              
              {/* Product */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Product *
                </label>
                <select 
                  value={selectedProduct} 
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="">Select Product...</option>
                  <option value="Triangle Structure">Triangle Structure</option>
                  <option value="Mini Rail 100mm">Mini Rail 100mm</option>
                  <option value="Long Rail">Long Rail</option>
                  <option value="Carport Structure">Carport Structure</option>
                </select>
              </div>

              {/* Production Method */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Production Method *
                </label>
                <select 
                  value={productionMethod} 
                  onChange={(e) => setProductionMethod(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="Manual Production (No BOM)">Manual Production (No BOM)</option>
                  <option value="Explode Standard BOM">Explode Standard BOM</option>
                </select>
              </div>

              {/* Banner Info Box */}
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Info style={{ width: '18px', height: '18px', color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', margin: '0 0 2px 0' }}>No BOM Selected</h4>
                  <p style={{ fontSize: '11px', color: '#3b82f6', margin: 0, lineHeight: '1.4' }}>
                    Materials and operations will be added manually for this work order.
                  </p>
                </div>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 3fr', gap: '16px' }}>
              
              {/* Quantity Planned */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Quantity (Planned) *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="number" 
                    value={plannedQty} 
                    onChange={(e) => setPlannedQty(e.target.value)}
                    style={{ width: '60%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <select 
                    value={uom} 
                    onChange={(e) => setUom(e.target.value)}
                    style={{ width: '40%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '12px', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="Nos (Units)">Nos (Units)</option>
                    <option value="Kg">Kg</option>
                    <option value="Mtr">Mtr</option>
                  </select>
                </div>
              </div>

              {/* Revision / Version */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Revision / Version
                </label>
                <input 
                  type="text" 
                  value={revisionVersion} 
                  onChange={(e) => setRevisionVersion(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Description
                </label>
                <input 
                  type="text" 
                  value={productDescription} 
                  onChange={(e) => setProductDescription(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
                <span style={{ fontSize: '10px', color: '#94a3b8', float: 'right', marginTop: '2px' }}>58 / 250</span>
              </div>

            </div>
          </div>

          {/* TWO COLUMN GRID FOR MATERIALS & ROUTING */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
            
            {/* SECTION 3: MATERIALS / COMPONENTS */}
            <div className="section-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', minWidth: 0, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '11px', fontWeight: 'bold' }}>3</div>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Materials / Components</h3>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#64748b' }}>
                    <input 
                      type="radio" 
                      name="matSource" 
                      checked={materialSourceMode === 'bom'} 
                      onChange={() => setMaterialSourceMode('bom')} 
                    />
                    Import from BOM
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#2563eb' }}>
                    <input 
                      type="radio" 
                      name="matSource" 
                      checked={materialSourceMode === 'manual'} 
                      onChange={() => setMaterialSourceMode('manual')} 
                    />
                    Add Materials Manually
                  </label>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '11px', fontWeight: 'bold' }}>
                      <th style={{ padding: '8px 10px', width: '20px' }}>#</th>
                      <th style={{ padding: '8px 10px' }}>Material *</th>
                      <th style={{ padding: '8px 10px' }}>Specification</th>
                      <th style={{ padding: '8px 10px' }}>UOM</th>
                      <th style={{ padding: '8px 10px' }}>Required Qty *</th>
                      <th style={{ padding: '8px 10px' }}>Source</th>
                      <th style={{ padding: '8px 10px' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, idx) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: '600', color: '#1e293b' }}>{m.name}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{m.specification}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{m.uom}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#0f172a' }}>{m.requiredQty}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ backgroundColor: m.source === 'Make' ? '#f1f5f9' : '#eff6ff', color: m.source === 'Make' ? '#475569' : '#2563eb', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                            {m.source}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{m.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                <span>Total Unique Materials: <strong>{materials.length}</strong></span>
              </div>
            </div>

            {/* SECTION 4: ROUTING / OPERATIONS */}
            <div className="section-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', minWidth: 0, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '11px', fontWeight: 'bold' }}>4</div>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Routing / Operations</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>
                    <input 
                      type="radio" 
                      name="routeSource" 
                      checked={routingMode === 'standard'} 
                      onChange={() => setRoutingMode('standard')} 
                    />
                    Use Standard Routing
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: '#2563eb' }}>
                    <input 
                      type="radio" 
                      name="routeSource" 
                      checked={routingMode === 'manual'} 
                      onChange={() => setRoutingMode('manual')} 
                    />
                    Create Routing Manually
                  </label>

                  <button 
                    onClick={handleAddMaterial}
                    style={{ border: 'none', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus style={{ width: '12px', height: '12px' }} />
                    Add Material
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '11px', fontWeight: 'bold' }}>
                      <th style={{ padding: '8px 10px' }}>Seq.</th>
                      <th style={{ padding: '8px 10px' }}>Operation *</th>
                      <th style={{ padding: '8px 10px' }}>Work Center / Machine</th>
                      <th style={{ padding: '8px 10px' }}>Operator</th>
                      <th style={{ padding: '8px 10px' }}>Planned Time</th>
                      <th style={{ padding: '8px 10px' }}>Setup Time</th>
                      <th style={{ padding: '8px 10px' }}>Run Time (Per Unit)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routingSteps.map((o) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#2563eb' }}>{o.seq}</td>
                        <td style={{ padding: '8px 10px', fontWeight: '600', color: '#1e293b' }}>{o.operation}</td>
                        <td style={{ padding: '8px 10px', color: '#475569' }}>{o.machine}</td>
                        <td style={{ padding: '8px 10px', color: '#475569' }}>{o.operator}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#0f172a' }}>{o.plannedTime}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{o.setupTime}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{o.runTime}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleRemoveOperation(o.id)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                <span>Total Operations: <strong>{routingSteps.length}</strong></span>
              </div>
            </div>

          </div>

          {/* SECTION 5: ADDITIONAL INFORMATION */}
          <div className="section-card" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '12px', fontWeight: 'bold' }}>5</div>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Additional Information</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 3.5fr', gap: '16px' }}>
              
              {/* Payment Terms */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Payment Terms
                </label>
                <select 
                  value={paymentTerms} 
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="30 Days">30 Days</option>
                  <option value="45 Days">45 Days</option>
                  <option value="Immediate">Immediate</option>
                </select>
              </div>

              {/* Shipment Preference */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Shipment Preference
                </label>
                <input 
                  type="text" 
                  value={shipmentPreference} 
                  onChange={(e) => setShipmentPreference(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Target Stock Date */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Target Stock Date
                </label>
                <input 
                  type="date" 
                  value={targetStockDate} 
                  onChange={(e) => setTargetStockDate(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Special Instructions
                </label>
                <input 
                  type="text" 
                  value={specialInstructions} 
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                />
                <span style={{ fontSize: '10px', color: '#94a3b8', float: 'right', marginTop: '2px' }}>46 / 250</span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
