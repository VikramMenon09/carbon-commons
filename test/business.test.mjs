import test from 'node:test';
import assert from 'node:assert/strict';
import { BUSINESS_DEFAULTS, calculateBusiness, businessToCSV } from '../dist/business.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} should equal ${expected}`);

test('business default is an independently calculated annual cash-flow comparison', () => {
  const s = calculateBusiness();
  assert.deepEqual(s.input, BUSINESS_DEFAULTS);
  assert.equal(s.baselineCarbonCost, 12500);
  assert.equal(s.avoidedTonnes, 75);
  assert.equal(s.remainingTonnes, 175);
  assert.equal(s.futureCarbonCost, 8750);
  assert.equal(s.avoidedCarbonCost, 3750);
  assert.equal(s.baselineProfit, 187500);
  assert.equal(s.futureProfit, 203250);
  assert.equal(s.annualBenefit, 15750);
  assert.equal(s.yearOneNetBenefit, -34250);
  close(s.paybackYears, 50000 / 15750);
  assert.equal(s.baselineMargin, 18.75);
  close(s.futureMargin, 20.325);
});

test('incremental annual benefit equals the operating cash-surplus difference', () => {
  for (const carbonPrice of [0, 50, 200]) {
    for (const reductionPercent of [0, 30, 100]) {
      for (const annualSavings of [0, 12000, 100000]) {
        const s = calculateBusiness({ carbonPrice, reductionPercent, annualSavings });
        close(s.futureProfit - s.baselineProfit, s.annualBenefit);
        close(s.baselineCarbonCost - s.futureCarbonCost, s.avoidedCarbonCost);
        close(s.avoidedTonnes + s.remainingTonnes, s.input.annualTonnes);
        close(s.yearOneNetBenefit + s.input.investment, s.annualBenefit);
      }
    }
  }
});

test('zero benefit has no finite payback, including when no investment is made', () => {
  for (const investment of [0, 50000]) {
    const s = calculateBusiness({ carbonPrice: 0, annualSavings: 0, investment });
    assert.equal(s.annualBenefit, 0);
    assert.equal(s.paybackYears, null);
    close(s.yearOneNetBenefit, -investment);
  }
});

test('zero upfront investment with a positive annual benefit has immediate payback', () => {
  const s = calculateBusiness({ investment: 0 });
  assert.equal(s.paybackYears, 0);
  assert.equal(s.yearOneNetBenefit, s.annualBenefit);
});

test('zero revenue gives undefined margins and still represents negative cash flow', () => {
  const s = calculateBusiness({ revenue: 0 });
  assert.equal(s.baselineMargin, null);
  assert.equal(s.futureMargin, null);
  assert.equal(s.baselineProfit, -812500);
  assert.equal(s.futureProfit, -796750);
});

test('complete abatement removes the carbon charge; no abatement preserves it', () => {
  for (const annualTonnes of [0, Number.MIN_VALUE, 1e-300, 0.07, 0.3, 1, 250, 123456.789, 1e9]) {
    const complete = calculateBusiness({ annualTonnes, reductionPercent: 100 });
    assert.equal(complete.avoidedTonnes, annualTonnes);
    assert.equal(complete.remainingTonnes, 0);
    assert.equal(complete.futureCarbonCost, 0);
    assert.equal(complete.avoidedCarbonCost, complete.baselineCarbonCost);
    const unchanged = calculateBusiness({ annualTonnes, reductionPercent: 0 });
    assert.equal(unchanged.avoidedTonnes, 0);
    assert.equal(unchanged.remainingTonnes, annualTonnes);
    assert.equal(unchanged.futureCarbonCost, unchanged.baselineCarbonCost);
  }
  const all = calculateBusiness({ reductionPercent: 100 });
  assert.equal(all.remainingTonnes, 0);
  assert.equal(all.avoidedTonnes, all.input.annualTonnes);
  assert.equal(all.futureCarbonCost, 0);
  assert.equal(all.avoidedCarbonCost, all.baselineCarbonCost);
  const none = calculateBusiness({ reductionPercent: 0, annualSavings: 0 });
  assert.equal(none.futureCarbonCost, none.baselineCarbonCost);
  assert.equal(none.futureProfit, none.baselineProfit);
  assert.equal(none.paybackYears, null);
});

test('negative profit and negative margins are allowed and not clamped', () => {
  const s = calculateBusiness({ revenue: 100, operatingCost: 1000, annualSavings: 0 });
  assert.ok(s.baselineProfit < 0);
  assert.ok(s.futureProfit < 0);
  assert.ok(s.baselineMargin < 0);
  assert.ok(s.futureMargin < 0);
});

test('strict input validation rejects coercion, non-finite values and all out-of-range values', () => {
  for (const key of Object.keys(BUSINESS_DEFAULTS)) {
    for (const value of ['50', NaN, Infinity, -Infinity, null, undefined, false]) {
      assert.throws(() => calculateBusiness({ [key]: value }), TypeError);
    }
  }
  for (const input of [null, [], 'business', 1]) assert.throws(() => calculateBusiness(input), TypeError);
  for (const [key, upper] of [['revenue', 1e12], ['operatingCost', 1e12], ['annualTonnes', 1e9], ['carbonPrice', 200], ['reductionPercent', 100], ['investment', 1e12], ['annualSavings', 1e12]]) {
    assert.throws(() => calculateBusiness({ [key]: -1 }), RangeError);
    assert.throws(() => calculateBusiness({ [key]: upper + 1 }), RangeError);
    assert.doesNotThrow(() => calculateBusiness({ [key]: 0 }));
    assert.doesNotThrow(() => calculateBusiness({ [key]: upper }));
  }
});

test('input objects and defaults remain unchanged', () => {
  const input = Object.freeze({ revenue: 300000 });
  const s = calculateBusiness(input);
  s.input.revenue = 1;
  assert.equal(input.revenue, 300000);
  assert.equal(calculateBusiness().input.revenue, 1000000);
});

test('business CSV exports units and explicit undefined payback/margins', () => {
  const csv = businessToCSV(calculateBusiness({ revenue: 0, annualSavings: 0, carbonPrice: 0 }));
  assert.match(csv, /Baseline emissions \(tonnes CO2e\/year\),250/);
  assert.match(csv, /Annual operating savings excluding carbon charge \(USD\/year\),0/);
  assert.match(csv, /Simple payback \(years\),Not defined/);
  assert.match(csv, /Baseline operating cash margin \(percent\),Not defined/);
  assert.match(csv, /Upfront investment \(USD\),50000/);
  assert.ok(csv.endsWith('\r\n'));
  assert.doesNotMatch(csv, /NaN|Infinity/);
});

test('business CSV ignores edited result labels and rejects invalid input', () => {
  assert.throws(() => businessToCSV({}), TypeError);
  const result = calculateBusiness();
  result.baselineProfit = '=1+1';
  assert.doesNotMatch(businessToCSV(result), /=1\+1/);
  result.input.annualSavings = '=1+1';
  assert.throws(() => businessToCSV(result), TypeError);
});

test('positive denominators that overflow derived ratios return null and export no infinity', () => {
  const tinyBenefit = calculateBusiness({ carbonPrice: 0, annualSavings: Number.MIN_VALUE });
  assert.ok(tinyBenefit.annualBenefit > 0);
  assert.equal(tinyBenefit.paybackYears, null);
  const tinyRevenue = calculateBusiness({ revenue: Number.MIN_VALUE });
  assert.equal(tinyRevenue.baselineMargin, null);
  assert.equal(tinyRevenue.futureMargin, null);
  for (const result of [tinyBenefit, tinyRevenue]) {
    const csv = businessToCSV(result);
    assert.match(csv, /Not defined/);
    assert.doesNotMatch(csv, /NaN|Infinity/);
  }
});

test('business CSV faithfully retains small positive payback and large finite margins', () => {
  const s = calculateBusiness({ investment: 1, annualSavings: 1e12, revenue: 1e-12 });
  assert.ok(s.paybackYears > 0 && s.paybackYears < 1e-9);
  const csv = businessToCSV(s);
  const value = (label) => Number(csv.split('\r\n').find((row) => row.startsWith(`${label},`)).split(',')[1]);
  assert.equal(value('Simple payback (years)'), s.paybackYears);
  assert.equal(value('Baseline operating cash margin (percent)'), s.baselineMargin);
  assert.ok(Number.isFinite(s.baselineMargin));
});

test('nonzero ratios too small to represent are not reported as exact zero', () => {
  const s = calculateBusiness({ investment: Number.MIN_VALUE, annualSavings: 1e12 });
  assert.equal(s.paybackYears, null);
  const zero = calculateBusiness({ investment: 0, annualSavings: 1e12 });
  assert.equal(zero.paybackYears, 0);
});
