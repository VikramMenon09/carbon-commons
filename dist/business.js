/** Illustrative operating cash-flow comparison before income tax; see docs/METHODOLOGY.md. */
export const BUSINESS_DEFAULTS = Object.freeze({
  revenue: 1000000,
  operatingCost: 800000,
  annualTonnes: 250,
  carbonPrice: 50,
  reductionPercent: 30,
  investment: 50000,
  annualSavings: 12000,
});

const BUSINESS_LIMITS = Object.freeze({
  revenue: [0, 1e12],
  operatingCost: [0, 1e12],
  annualTonnes: [0, 1e9],
  carbonPrice: [0, 200],
  reductionPercent: [0, 100],
  investment: [0, 1e12],
  annualSavings: [0, 1e12],
});

function normalizeInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Business inputs must be an object.');
  }
  return Object.fromEntries(Object.entries(BUSINESS_LIMITS).map(([key, [min, max]]) => {
    const value = Object.hasOwn(input, key) ? input[key] : BUSINESS_DEFAULTS[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`${key} must be a finite number.`);
    }
    if (value < min || value > max) {
      throw new RangeError(`${key} must be between ${min} and ${max}.`);
    }
    return [key, value];
  }));
}

function finiteRatio(numerator, denominator, multiplier = 1) {
  if (denominator <= 0) return null;
  const ratio = (numerator * multiplier) / denominator;
  // Guard overflow and nonzero ratios too small for JavaScript to represent.
  return Number.isFinite(ratio) && (numerator === 0 || ratio !== 0) ? ratio : null;
}

export function calculateBusiness(input = {}) {
  const normalized = normalizeInput(input);
  const { revenue, operatingCost, annualTonnes, carbonPrice, reductionPercent, investment, annualSavings } = normalized;
  const avoidedTonnes = annualTonnes * (reductionPercent / 100);
  const remainingTonnes = annualTonnes - avoidedTonnes;
  const baselineCarbonCost = annualTonnes * carbonPrice;
  const futureCarbonCost = remainingTonnes * carbonPrice;
  const avoidedCarbonCost = baselineCarbonCost - futureCarbonCost;
  const baselineProfit = revenue - operatingCost - baselineCarbonCost;
  const futureProfit = revenue - operatingCost + annualSavings - futureCarbonCost;
  const annualBenefit = annualSavings + avoidedCarbonCost;
  return {
    input: normalized,
    baselineCarbonCost,
    remainingTonnes,
    avoidedTonnes,
    futureCarbonCost,
    avoidedCarbonCost,
    baselineProfit,
    futureProfit,
    annualBenefit,
    paybackYears: finiteRatio(investment, annualBenefit),
    yearOneNetBenefit: annualBenefit - investment,
    baselineMargin: finiteRatio(baselineProfit, revenue, 100),
    futureMargin: finiteRatio(futureProfit, revenue, 100),
  };
}

/** Recompute numeric inputs to keep CSV reproducible and free of caller labels. */
export function businessToCSV(result) {
  if (!result || typeof result !== 'object' || !result.input) {
    throw new TypeError('Pass the result of calculateBusiness to businessToCSV.');
  }
  const s = calculateBusiness(result.input);
  const number = (value) => value === null ? 'Not defined' : String(value);
  const rows = [
    ['Carbon Commons illustrative business scenario'],
    ['Scope', 'Operating cash flow before income tax; not a forecast or investment appraisal'],
    ['Period', 'One year at constant user-entered assumptions'],
    ['Currency', 'Illustrative USD; no calendar-year calibration'],
    ['Annual revenue (USD/year)', s.input.revenue],
    ['Annual operating cost before carbon charge (USD/year)', s.input.operatingCost],
    ['Baseline emissions (tonnes CO2e/year)', s.input.annualTonnes],
    ['Carbon price (USD/tonne CO2e)', s.input.carbonPrice],
    ['Assumed emissions reduction (percent)', s.input.reductionPercent],
    ['Upfront investment (USD)', s.input.investment],
    ['Annual operating savings excluding carbon charge (USD/year)', s.input.annualSavings],
    [],
    ['Metric', 'Value'],
    ['Baseline carbon charge (USD/year)', s.baselineCarbonCost],
    ['Scenario emissions (tonnes CO2e/year)', s.remainingTonnes],
    ['Avoided emissions (tonnes CO2e/year)', s.avoidedTonnes],
    ['Scenario carbon charge (USD/year)', s.futureCarbonCost],
    ['Avoided carbon charge (USD/year)', s.avoidedCarbonCost],
    ['Baseline operating cash surplus (USD/year)', s.baselineProfit],
    ['Scenario operating cash surplus (USD/year)', s.futureProfit],
    ['Annual cash benefit (USD/year)', s.annualBenefit],
    ['Simple payback (years)', s.paybackYears],
    ['Year-one incremental cash flow after investment (USD)', s.yearOneNetBenefit],
    ['Baseline operating cash margin (percent)', s.baselineMargin],
    ['Scenario operating cash margin (percent)', s.futureMargin],
  ];
  return `${rows.map((row) => row.map((value) => typeof value === 'number' || value === null ? number(value) : value).join(',')).join('\r\n')}\r\n`;
}
