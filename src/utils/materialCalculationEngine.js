/**
 * ControlRoom Material Consumption & Cutting Calculation Engine Core
 * 
 * Modular, extensible architecture supporting:
 * - 2D Sheet/Plate Nesting & Cutting
 * - 1D Profile/Bar Linear Cutting
 * - Coil Slitting & Blanking
 * - Extensible Custom Rule Registration
 */

export const DENSITY_MAP = {
  'Aluminum 6063-T6': { density: 2.70, label: 'Aluminum 6063-T6 (2.70 g/cm³)' },
  'Aluminum 6061-T6': { density: 2.70, label: 'Aluminum 6061-T6 (2.70 g/cm³)' },
  'GI Steel (Galvanized)': { density: 7.85, label: 'GI Steel Galvanized (7.85 g/cm³)' },
  'Stainless Steel 304': { density: 8.00, label: 'Stainless Steel 304 (8.00 g/cm³)' },
  'Stainless Steel 316': { density: 8.00, label: 'Stainless Steel 316 (8.00 g/cm³)' },
  'Mild Steel (MS)': { density: 7.85, label: 'Mild Steel MS (7.85 g/cm³)' },
  'Copper': { density: 8.96, label: 'Copper (8.96 g/cm³)' }
};

/**
 * Rule 1: 2D Sheet & Plate Grid Cutting Calculation
 */
export function calculateSheetPlate2D(input, options = {}) {
  const {
    length: L_s = 2500,        // Raw Sheet Length (mm)
    width: W_s = 1250,         // Raw Sheet Width (mm)
    thickness: T_s = 2.0,      // Sheet Thickness (mm)
    quantity: N_s = 10,        // Issued Sheet Quantity
    materialGrade = 'Aluminum 6063-T6',
    customDensity = null
  } = input;

  const {
    productLength: L_p = 500,  // Finished Plate Length (mm)
    productWidth: W_p = 250,   // Finished Plate Width (mm)
    targetQuantity: N_target = 0 // Required finished count (0 for max possible)
  } = input.product || {};

  const {
    kerf = 2.0,                // Cutting blade width (mm)
    edgeMargin = 5.0,          // Edge margin trim (mm)
    orientation = 'auto',      // 'auto' | '0' | '90'
    minReusableOffcutArea = 10000 // Min area (mm²) to consider reusable (e.g. 100x100mm)
  } = options;

  const matDensity = customDensity || (DENSITY_MAP[materialGrade]?.density || 2.70); // g/cm³

  // Usable Dimensions after deducting edge margins
  const L_u = Math.max(0, L_s - 2 * edgeMargin);
  const W_u = Math.max(0, W_s - 2 * edgeMargin);

  // Orientation Option A: Normal (0°) -> Length along Length
  const colsA = Math.max(0, Math.floor((L_u + kerf) / (L_p + kerf)));
  const rowsA = Math.max(0, Math.floor((W_u + kerf) / (W_p + kerf)));
  const yieldA = colsA * rowsA;

  // Orientation Option B: Rotated (90°) -> Width along Length
  const colsB = Math.max(0, Math.floor((L_u + kerf) / (W_p + kerf)));
  const rowsB = Math.max(0, Math.floor((W_u + kerf) / (L_p + kerf)));
  const yieldB = colsB * rowsB;

  let chosenOrientation = '0°';
  let cols = colsA;
  let rows = rowsA;
  let yieldPerSheet = yieldA;
  let effectiveProdLength = L_p;
  let effectiveProdWidth = W_p;

  if (orientation === '90' || (orientation === 'auto' && yieldB > yieldA)) {
    chosenOrientation = '90° (Rotated)';
    cols = colsB;
    rows = rowsB;
    yieldPerSheet = yieldB;
    effectiveProdLength = W_p;
    effectiveProdWidth = L_p;
  }

  // Theoretical and Actual Output
  const maxPossibleTotalPieces = yieldPerSheet * N_s;
  const actualPiecesProduced = N_target > 0 ? Math.min(N_target, maxPossibleTotalPieces) : maxPossibleTotalPieces;
  const sheetsConsumedNeeded = yieldPerSheet > 0 ? Math.ceil(actualPiecesProduced / yieldPerSheet) : N_s;

  // Area & Weight Calculations
  const rawSheetAreaM2 = (L_s * W_s) / 1e6;
  const singleProductAreaM2 = (L_p * W_p) / 1e6;

  const rawSheetVolumeCm3 = (L_s * W_s * T_s) / 1000;
  const singleRawWeightKg = (rawSheetVolumeCm3 * matDensity) / 1000;

  const productVolumeCm3 = (L_p * W_p * T_s) / 1000;
  const singleProductWeightKg = (productVolumeCm3 * matDensity) / 1000;

  const totalIssuedRawWeightKg = singleRawWeightKg * N_s;
  const totalFinishedGoodsWeightKg = singleProductWeightKg * actualPiecesProduced;
  const totalFinishedAreaM2 = singleProductAreaM2 * actualPiecesProduced;
  const totalIssuedRawAreaM2 = rawSheetAreaM2 * N_s;

  // Used Grid Footprint per Sheet
  const usedLengthPerSheet = cols > 0 ? cols * effectiveProdLength + (cols - 1) * kerf + 2 * edgeMargin : 0;
  const usedWidthPerSheet = rows > 0 ? rows * effectiveProdWidth + (rows - 1) * kerf + 2 * edgeMargin : 0;

  // Offcuts & Remaining Reusable Material
  const endOffcutLength = Math.max(0, L_s - usedLengthPerSheet);
  const endOffcutWidth = W_s;
  const endOffcutAreaM2 = (endOffcutLength * endOffcutWidth * N_s) / 1e6;

  const sideOffcutLength = usedLengthPerSheet;
  const sideOffcutWidth = Math.max(0, W_s - usedWidthPerSheet);
  const sideOffcutAreaM2 = (sideOffcutLength * sideOffcutWidth * N_s) / 1e6;

  let reusableOffcuts = [];
  let reusableOffcutAreaM2 = 0;

  if (endOffcutLength * endOffcutWidth >= minReusableOffcutArea && endOffcutLength > 50) {
    const endKg = ((endOffcutLength * endOffcutWidth * T_s / 1000) * matDensity / 1000) * N_s;
    reusableOffcuts.push({
      label: 'End Remnant Sheet',
      dimensions: `${Math.round(endOffcutLength)} mm × ${Math.round(endOffcutWidth)} mm`,
      thickness: `${T_s} mm`,
      count: N_s,
      areaM2: Number(endOffcutAreaM2.toFixed(3)),
      weightKg: Number(endKg.toFixed(2))
    });
    reusableOffcutAreaM2 += endOffcutAreaM2;
  }

  if (sideOffcutLength * sideOffcutWidth >= minReusableOffcutArea && sideOffcutWidth > 50) {
    const sideKg = ((sideOffcutLength * sideOffcutWidth * T_s / 1000) * matDensity / 1000) * N_s;
    reusableOffcuts.push({
      label: 'Side Strip Remnant',
      dimensions: `${Math.round(sideOffcutLength)} mm × ${Math.round(sideOffcutWidth)} mm`,
      thickness: `${T_s} mm`,
      count: N_s,
      areaM2: Number(sideOffcutAreaM2.toFixed(3)),
      weightKg: Number(sideKg.toFixed(2))
    });
    reusableOffcutAreaM2 += sideOffcutAreaM2;
  }

  const reusableOffcutWeightKg = reusableOffcuts.reduce((sum, r) => sum + r.weightKg, 0);

  // Kerf & Blade Dust Loss Calculation
  const totalCutLengthPerSheet = (cols + 1) * W_s + (rows + 1) * L_s;
  const kerfVolumeCm3 = (totalCutLengthPerSheet * kerf * T_s * N_s) / 1000;
  const kerfLossWeightKg = (kerfVolumeCm3 * matDensity) / 1000;

  // Unusable Scrap Weight Calculation
  const scrapWeightKg = Math.max(0, totalIssuedRawWeightKg - totalFinishedGoodsWeightKg - reusableOffcutWeightKg - kerfLossWeightKg);
  const scrapAreaM2 = Math.max(0, totalIssuedRawAreaM2 - totalFinishedAreaM2 - reusableOffcutAreaM2);

  // Ratios & Percentages
  const materialUtilizationPct = totalIssuedRawAreaM2 > 0 ? (totalFinishedAreaM2 / totalIssuedRawAreaM2) * 100 : 0;
  const materialYieldPct = totalIssuedRawWeightKg > 0 ? (totalFinishedGoodsWeightKg / totalIssuedRawWeightKg) * 100 : 0;
  const scrapPct = totalIssuedRawWeightKg > 0 ? (scrapWeightKg / totalIssuedRawWeightKg) * 100 : 0;
  const reusablePct = totalIssuedRawWeightKg > 0 ? (reusableOffcutWeightKg / totalIssuedRawWeightKg) * 100 : 0;

  return {
    ruleId: '2D_SHEET_PLATE_CUTTING',
    ruleName: '2D Sheet & Plate Grid Cutting',
    chosenOrientation,
    gridDetails: {
      columnsPerSheet: cols,
      rowsPerSheet: rows,
      yieldPerSheet,
      sheetsConsumed: sheetsConsumedNeeded
    },
    output: {
      theoreticalYieldPieces: maxPossibleTotalPieces,
      actualPiecesProduced,
      rawAreaM2: Number(totalIssuedRawAreaM2.toFixed(3)),
      finishedAreaM2: Number(totalFinishedAreaM2.toFixed(3)),
      rawWeightKg: Number(totalIssuedRawWeightKg.toFixed(2)),
      finishedWeightKg: Number(totalFinishedGoodsWeightKg.toFixed(2)),
      reusableOffcutWeightKg: Number(reusableOffcutWeightKg.toFixed(2)),
      scrapWeightKg: Number(scrapWeightKg.toFixed(2)),
      kerfLossWeightKg: Number(kerfLossWeightKg.toFixed(2)),
      utilizationPct: Number(materialUtilizationPct.toFixed(1)),
      yieldPct: Number(materialYieldPct.toFixed(1)),
      scrapPct: Number(scrapPct.toFixed(1)),
      reusablePct: Number(reusablePct.toFixed(1))
    },
    reusableOffcuts,
    reconciliation: [
      { category: 'Finished Products (Good Output)', weightKg: Number(totalFinishedGoodsWeightKg.toFixed(2)), pct: Number(materialYieldPct.toFixed(1)), status: 'GOOD_YIELD' },
      { category: 'Reusable Remnant Offcuts', weightKg: Number(reusableOffcutWeightKg.toFixed(2)), pct: Number(reusablePct.toFixed(1)), status: 'REUSABLE' },
      { category: 'Unusable Edge Scrap', weightKg: Number(scrapWeightKg.toFixed(2)), pct: Number(scrapPct.toFixed(1)), status: 'SCRAP' },
      { category: 'Blade Kerf & Dust Loss', weightKg: Number(kerfLossWeightKg.toFixed(2)), pct: Number(((kerfLossWeightKg / totalIssuedRawWeightKg) * 100).toFixed(1)), status: 'LOSS' }
    ]
  };
}

/**
 * Rule 2: 1D Profile Linear Bar Cutting Calculation
 */
export function calculateProfile1D(input, options = {}) {
  const {
    stockLength: L_s = 6000,      // Stock Profile Length (mm)
    linearWeightKgM = 0.85,       // Linear Weight (kg/meter)
    quantity: N_s = 20,           // Number of Stock Profiles
    materialGrade = 'Aluminum 6063-T6'
  } = input;

  const {
    productLength: L_p = 100,     // Cut Profile Length (mm) e.g., Mini Rail 100mm
    targetQuantity: N_target = 0
  } = input.product || {};

  const {
    kerf = 2.0,                   // Blade Kerf (mm)
    trimMargin = 10.0             // End trim per stock bar (mm)
  } = options;

  const usableBarLength = Math.max(0, L_s - 2 * trimMargin);
  const piecesPerBar = Math.max(0, Math.floor((usableBarLength + kerf) / (L_p + kerf)));

  const maxTotalPieces = piecesPerBar * N_s;
  const actualPieces = N_target > 0 ? Math.min(N_target, maxTotalPieces) : maxTotalPieces;

  const totalRawMeters = (L_s * N_s) / 1000;
  const totalFinishedMeters = (L_p * actualPieces) / 1000;

  const totalRawWeightKg = totalRawMeters * linearWeightKgM;
  const totalFinishedWeightKg = totalFinishedMeters * linearWeightKgM;

  const remnantLengthPerBar = Math.max(0, L_s - (piecesPerBar * L_p + (piecesPerBar - 1) * kerf + 2 * trimMargin));
  const totalRemnantMeters = (remnantLengthPerBar * N_s) / 1000;
  const totalRemnantWeightKg = totalRemnantMeters * linearWeightKgM;

  const totalKerfMeters = (piecesPerBar * kerf * N_s) / 1000;
  const kerfLossWeightKg = totalKerfMeters * linearWeightKgM;

  const scrapWeightKg = Math.max(0, totalRawWeightKg - totalFinishedWeightKg - totalRemnantWeightKg - kerfLossWeightKg);

  const utilizationPct = totalRawMeters > 0 ? (totalFinishedMeters / totalRawMeters) * 100 : 0;
  const yieldPct = totalRawWeightKg > 0 ? (totalFinishedWeightKg / totalRawWeightKg) * 100 : 0;

  return {
    ruleId: '1D_PROFILE_LINEAR_CUTTING',
    ruleName: '1D Profile & Rail Linear Cutting',
    gridDetails: {
      piecesPerBar,
      remnantPerBarMm: Math.round(remnantLengthPerBar),
      barsConsumed: N_s
    },
    output: {
      theoreticalYieldPieces: maxTotalPieces,
      actualPiecesProduced: actualPieces,
      rawMeters: Number(totalRawMeters.toFixed(2)),
      finishedMeters: Number(totalFinishedMeters.toFixed(2)),
      rawWeightKg: Number(totalRawWeightKg.toFixed(2)),
      finishedWeightKg: Number(totalFinishedWeightKg.toFixed(2)),
      reusableOffcutWeightKg: Number(totalRemnantWeightKg.toFixed(2)),
      scrapWeightKg: Number(scrapWeightKg.toFixed(2)),
      kerfLossWeightKg: Number(kerfLossWeightKg.toFixed(2)),
      utilizationPct: Number(utilizationPct.toFixed(1)),
      yieldPct: Number(yieldPct.toFixed(1))
    },
    reusableOffcuts: remnantLengthPerBar >= 100 ? [{
      label: 'Linear Profile Offcut',
      dimensions: `${Math.round(remnantLengthPerBar)} mm Bar`,
      count: N_s,
      weightKg: Number(totalRemnantWeightKg.toFixed(2))
    }] : [],
    reconciliation: [
      { category: 'Finished Linear Rails', weightKg: Number(totalFinishedWeightKg.toFixed(2)), pct: Number(yieldPct.toFixed(1)), status: 'GOOD_YIELD' },
      { category: 'Reusable Profile Offcuts', weightKg: Number(totalRemnantWeightKg.toFixed(2)), pct: Number(((totalRemnantWeightKg/totalRawWeightKg)*100).toFixed(1)), status: 'REUSABLE' },
      { category: 'End Trim & Kerf Scrap', weightKg: Number((scrapWeightKg + kerfLossWeightKg).toFixed(2)), pct: Number((((scrapWeightKg + kerfLossWeightKg)/totalRawWeightKg)*100).toFixed(1)), status: 'SCRAP' }
    ]
  };
}

/**
 * Extensible Calculation Engine Registry Class
 */
class MaterialCalculationEngine {
  constructor() {
    this.rules = new Map();
    // Register default core manufacturing rules
    this.registerRule('2D_SHEET_PLATE_CUTTING', '2D Sheet & Plate Grid Cutting', calculateSheetPlate2D);
    this.registerRule('1D_PROFILE_LINEAR_CUTTING', '1D Profile & Rail Linear Cutting', calculateProfile1D);
  }

  registerRule(id, name, evaluatorFn) {
    this.rules.set(id, { id, name, evaluate: evaluatorFn });
  }

  listRules() {
    return Array.from(this.rules.values()).map(r => ({ id: r.id, name: r.name }));
  }

  calculate(ruleId, input, options) {
    const rule = this.rules.get(ruleId) || this.rules.get('2D_SHEET_PLATE_CUTTING');
    return rule.evaluate(input, options);
  }
}

export const materialEngine = new MaterialCalculationEngine();
