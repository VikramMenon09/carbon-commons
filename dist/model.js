/**
 * Carbon Commons: a deliberately small, synthetic accounting model.
 * Money is illustrative annual USD; emissions are tonnes CO2e per year.
 * See docs/METHODOLOGY.md before interpreting its results.
 */
import { APP_VERSION } from "./version.js";
export const DEFAULTS = Object.freeze({
  carbonPrice: 50,
  rebateShare: 75,
  response: 10,
  householdSize: 2.5,
});

export const HOUSEHOLDS = Object.freeze(
  [
    {
      id: "q1",
      label: "Lowest income",
      income: 25000,
      baselineTonnes: 6,
      color: "#2c785a",
    },
    {
      id: "q2",
      label: "Lower middle",
      income: 50000,
      baselineTonnes: 10,
      color: "#438c68",
    },
    {
      id: "q3",
      label: "Middle income",
      income: 80000,
      baselineTonnes: 14,
      color: "#72a582",
    },
    {
      id: "q4",
      label: "Upper middle",
      income: 130000,
      baselineTonnes: 20,
      color: "#a1ba94",
    },
    {
      id: "q5",
      label: "Highest income",
      income: 240000,
      baselineTonnes: 30,
      color: "#d0cfaa",
    },
  ].map(Object.freeze),
);

const LIMITS = Object.freeze({
  carbonPrice: [0, 200],
  rebateShare: [0, 100],
  response: [0, 40],
  householdSize: [1, 6],
});

function normalizeInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Scenario inputs must be an object.");
  }
  return Object.fromEntries(
    Object.entries(LIMITS).map(([key, [min, max]]) => {
      const value = Object.hasOwn(input, key) ? input[key] : DEFAULTS[key];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`${key} must be a finite number.`);
      }
      if (value < min || value > max) {
        throw new RangeError(`${key} must be between ${min} and ${max}.`);
      }
      return [key, value];
    }),
  );
}

/**
 * Calculate annual outcomes for five equally weighted representative households.
 * response is an assumed percent reduction at $100/t, not an estimated elasticity.
 * All top-level emissions/currency amounts are averages per household, except totals.
 */
export function calculateScenario(input = {}) {
  const normalized = normalizeInput(input);
  const { carbonPrice, rebateShare, response, householdSize } = normalized;
  const scale = householdSize / DEFAULTS.householdSize;
  const reductionRate = Math.min(0.8, (response / 100) * (carbonPrice / 100));
  const baselineTonnes =
    HOUSEHOLDS.reduce((sum, h) => sum + h.baselineTonnes * scale, 0) /
    HOUSEHOLDS.length;
  const afterTonnes = baselineTonnes * (1 - reductionRate);
  // Keep a small, representable reduction even when subtracting it from the
  // baseline would round the displayed total back to the baseline.
  const avoidedTonnes = baselineTonnes * reductionRate;
  const averageTax = afterTonnes * carbonPrice;
  const dividend = averageTax * (rebateShare / 100);
  const publicFundsPerHousehold = averageTax - dividend;
  const households = HOUSEHOLDS.map((h) => {
    const baseline = h.baselineTonnes * scale;
    const after = baseline * (1 - reductionRate);
    const tax = after * carbonPrice;
    const rawNet = dividend - tax;
    // Normalize only arithmetic noise at a tie, relative to the two cash flows.
    // There is no fixed dollar floor that could erase real small transfers.
    const tieTolerance =
      8 * Number.EPSILON * Math.max(Math.abs(dividend), Math.abs(tax));
    const net = Math.abs(rawNet) <= tieTolerance ? 0 : rawNet;
    return {
      ...h,
      baselineTonnes: baseline,
      afterTonnes: after,
      avoidedTonnes: baseline * reductionRate,
      tax,
      dividend,
      net,
      netShareIncome: (net / h.income) * 100,
    };
  });
  const sum = (key) => households.reduce((total, h) => total + h[key], 0);
  const totalTax = sum("tax");
  const totalDividends = sum("dividend");
  const totalPublicFunds = publicFundsPerHousehold * households.length;
  return {
    input: normalized,
    reductionRate,
    baselineTonnes,
    afterTonnes,
    avoidedTonnes,
    averageTax,
    dividend,
    publicFundsPerHousehold,
    winners: carbonPrice > 0 ? households.filter((h) => h.net >= 0).length : 0,
    households,
    totals: {
      householdCount: households.length,
      baselineTonnes: sum("baselineTonnes"),
      afterTonnes: sum("afterTonnes"),
      avoidedTonnes: sum("avoidedTonnes"),
      tax: totalTax,
      dividends: totalDividends,
      publicFunds: totalPublicFunds,
      netHouseholds: sum("net"),
      budgetBalance: totalTax - totalDividends - totalPublicFunds,
    },
  };
}

/** Export a reproducible scenario with explicit units and only fixed text labels. */
export function scenarioToCSV(result) {
  if (!result || typeof result !== "object" || !result.input) {
    throw new TypeError(
      "Pass the result of calculateScenario to scenarioToCSV.",
    );
  }
  // Recompute validated inputs rather than trusting caller-provided output strings.
  const scenario = calculateScenario(result.input);
  const number = (value) => String(value);
  const lines = [
    "Carbon Commons educational scenario",
    `App version,${APP_VERSION}`,
    "Data type,Synthetic illustrative households; not observed data or a forecast",
    "Period,One year; no calendar-year calibration",
    "Currency,Illustrative USD; no inflation or exchange-rate adjustment",
    `Carbon price (USD per tonne CO2e),${number(scenario.input.carbonPrice)}`,
    `Revenue returned to households (percent),${number(scenario.input.rebateShare)}`,
    `Assumed reduction at USD 100 per tonne (percent),${number(scenario.input.response)}`,
    `Household size (people),${number(scenario.input.householdSize)}`,
    `Scenario reduction (percent),${number(scenario.reductionRate * 100)}`,
    `Average annual public funds (USD per household),${number(scenario.publicFundsPerHousehold)}`,
    "",
    "Household group,Annual income (USD),Baseline emissions (tonnes CO2e/year),Scenario emissions (tonnes CO2e/year),Annual carbon charge (USD),Annual dividend (USD),Annual net transfer (USD),Net transfer (percent of income)",
    ...scenario.households.map((h) =>
      [
        h.label,
        h.income,
        h.baselineTonnes,
        h.afterTonnes,
        h.tax,
        h.dividend,
        h.net,
        h.netShareIncome,
      ]
        .map((v) => (typeof v === "number" ? number(v) : v))
        .join(","),
    ),
  ];
  return `${lines.join("\r\n")}\r\n`;
}
