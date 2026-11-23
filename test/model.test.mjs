import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateScenario,
  scenarioToCSV,
  DEFAULTS,
  HOUSEHOLDS,
} from "../dist/model.js";

const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} should equal ${expected}`,
  );

test("default scenario has independently derived annual outcomes", () => {
  const s = calculateScenario();
  assert.deepEqual(s.input, DEFAULTS);
  close(s.baselineTonnes, 16);
  close(s.reductionRate, 0.05);
  close(s.afterTonnes, 15.2);
  close(s.avoidedTonnes, 0.8);
  close(s.averageTax, 760);
  close(s.dividend, 570);
  close(s.publicFundsPerHousehold, 190);
  close(s.households[0].tax, 285);
  close(s.households[0].net, 285);
  close(s.households[0].netShareIncome, 1.14);
  assert.equal(s.winners, 2);
});

test("carbon revenues balance across a grid of valid policy inputs", () => {
  for (const carbonPrice of [0, 15, 50, 100, 200]) {
    for (const rebateShare of [0, 33.3, 75, 100]) {
      for (const response of [0, 10, 40]) {
        for (const householdSize of [1, 2.5, 6]) {
          const s = calculateScenario({
            carbonPrice,
            rebateShare,
            response,
            householdSize,
          });
          close(s.totals.tax, s.totals.dividends + s.totals.publicFunds);
          close(s.totals.budgetBalance, 0);
          close(s.totals.netHouseholds, -s.totals.publicFunds);
          close(s.averageTax, s.totals.tax / 5);
          if (rebateShare === 100) assert.equal(s.publicFundsPerHousehold, 0);
          close(
            s.totals.baselineTonnes,
            s.totals.afterTonnes + s.totals.avoidedTonnes,
          );
          assert.ok(
            s.households.every((h) => h.tax >= 0 && h.afterTonnes >= 0),
          );
        }
      }
    }
  }
});

test("zero price leaves emissions unchanged and all transfers at zero", () => {
  const s = calculateScenario({
    carbonPrice: 0,
    response: 40,
    rebateShare: 100,
  });
  assert.equal(s.reductionRate, 0);
  assert.equal(s.afterTonnes, s.baselineTonnes);
  assert.equal(s.averageTax, 0);
  assert.equal(s.dividend, 0);
  assert.equal(s.winners, 0);
  assert.ok(s.households.every((h) => h.net === 0));
});

test("zero and full rebates allocate all revenue to the intended destination", () => {
  const none = calculateScenario({ rebateShare: 0 });
  assert.equal(none.dividend, 0);
  assert.equal(none.publicFundsPerHousehold, none.averageTax);
  assert.equal(none.winners, 0);
  const full = calculateScenario({ rebateShare: 100 });
  assert.equal(full.publicFundsPerHousehold, 0);
  close(full.totals.netHouseholds, 0);
  assert.equal(full.winners, 3);
});

test("a stronger assumed response reduces emissions and shrinks the tax base", () => {
  const noResponse = calculateScenario({ response: 0 });
  const response = calculateScenario({ response: 25 });
  assert.ok(response.afterTonnes < noResponse.afterTonnes);
  assert.ok(response.avoidedTonnes > noResponse.avoidedTonnes);
  assert.ok(response.averageTax < noResponse.averageTax);
  assert.ok(response.dividend < noResponse.dividend);
  const max = calculateScenario({ carbonPrice: 200, response: 40 });
  close(max.reductionRate, 0.8);
  close(max.afterTonnes, max.baselineTonnes * 0.2);
});

test("changing rebates does not change the model emissions response or tax", () => {
  const a = calculateScenario({ rebateShare: 0 });
  const b = calculateScenario({ rebateShare: 100 });
  assert.equal(a.afterTonnes, b.afterTonnes);
  assert.equal(a.averageTax, b.averageTax);
});

test("household size scales emissions and transfers while income stays fixed", () => {
  const base = calculateScenario();
  const doubled = calculateScenario({ householdSize: 5 });
  for (const field of [
    "baselineTonnes",
    "afterTonnes",
    "averageTax",
    "dividend",
    "publicFundsPerHousehold",
  ]) {
    close(doubled[field], base[field] * 2);
  }
  for (let i = 0; i < HOUSEHOLDS.length; i++) {
    assert.equal(doubled.households[i].income, base.households[i].income);
    close(
      doubled.households[i].netShareIncome,
      base.households[i].netShareIncome * 2,
    );
  }
});

test("inputs reject non-numbers, non-finite values and values outside every bound", () => {
  for (const key of Object.keys(DEFAULTS)) {
    for (const value of [
      "50",
      NaN,
      Infinity,
      -Infinity,
      null,
      undefined,
      false,
    ]) {
      assert.throws(() => calculateScenario({ [key]: value }), TypeError);
    }
  }
  for (const input of [null, [], 3, "scenario"])
    assert.throws(() => calculateScenario(input), TypeError);
  for (const [key, min, max] of [
    ["carbonPrice", 0, 200],
    ["rebateShare", 0, 100],
    ["response", 0, 40],
    ["householdSize", 1, 6],
  ]) {
    assert.throws(() => calculateScenario({ [key]: min - 0.001 }), RangeError);
    assert.throws(() => calculateScenario({ [key]: max + 0.001 }), RangeError);
    assert.doesNotThrow(() => calculateScenario({ [key]: min }));
    assert.doesNotThrow(() => calculateScenario({ [key]: max }));
  }
});

test("calculations do not mutate shared baseline data or caller inputs", () => {
  const before = JSON.stringify(HOUSEHOLDS);
  const input = Object.freeze({ carbonPrice: 20 });
  const result = calculateScenario(input);
  result.households[0].baselineTonnes = 999;
  assert.equal(JSON.stringify(HOUSEHOLDS), before);
  assert.equal(input.carbonPrice, 20);
  assert.equal(calculateScenario().households[0].baselineTonnes, 6);
});

test("CSV records assumptions, physical units and annual household results", () => {
  const s = calculateScenario();
  const csv = scenarioToCSV(s);
  assert.match(csv, /(?:^|\r\n)App version,1\.1\.0\r\n/);
  assert.match(
    csv,
    /Synthetic illustrative households; not observed data or a forecast/,
  );
  assert.match(csv, /Carbon price \(USD per tonne CO2e\),50/);
  assert.match(csv, /Household size \(people\),2.5/);
  assert.match(csv, /Baseline emissions \(tonnes CO2e\/year\)/);
  assert.match(csv, /Annual net transfer \(USD\)/);
  const exported = csv
    .split("\r\n")
    .find((row) => row.startsWith("Lowest income,"))
    .split(",")
    .slice(1)
    .map(Number);
  const h = s.households[0];
  assert.deepEqual(exported, [
    h.income,
    h.baselineTonnes,
    h.afterTonnes,
    h.tax,
    h.dividend,
    h.net,
    h.netShareIncome,
  ]);
  assert.equal(
    csv
      .split("\r\n")
      .filter((row) =>
        /^(Lowest income|Lower middle|Middle income|Upper middle|Highest income),/.test(
          row,
        ),
      ).length,
    5,
  );
  assert.ok(csv.endsWith("\r\n"));
});

test("CSV rejects malformed input and does not export untrusted labels", () => {
  assert.throws(() => scenarioToCSV(null), TypeError);
  assert.throws(() => scenarioToCSV({}), TypeError);
  const s = calculateScenario();
  s.households[0].label = '=HYPERLINK("https://example.org")';
  assert.doesNotMatch(scenarioToCSV(s), /HYPERLINK/);
  s.input.carbonPrice = "=1+1";
  assert.throws(() => scenarioToCSV(s), TypeError);
});

test("mathematically neutral households count consistently across floating-point paths", () => {
  for (const [rebateShare, expectedWinners] of [
    [37.5, 1],
    [62.5, 2],
    [87.5, 3],
  ]) {
    for (const carbonPrice of [0.3, 50, 199.9]) {
      for (const response of [0, 10, 40]) {
        for (const householdSize of [1, 2.5, 6]) {
          const s = calculateScenario({
            rebateShare,
            carbonPrice,
            response,
            householdSize,
          });
          assert.equal(s.winners, expectedWinners);
          assert.equal(s.households[expectedWinners - 1].net, 0);
        }
      }
    }
  }
  const full = calculateScenario({
    carbonPrice: 0.9,
    rebateShare: 100,
    response: 0,
    householdSize: 1,
  });
  assert.equal(full.publicFundsPerHousehold, 0);
});

test("tie normalization preserves real small gains and losses without a dollar floor", () => {
  const s = calculateScenario({ carbonPrice: 1e-12 });
  assert.ok(s.households[0].net > 0);
  assert.ok(s.households[2].net < 0);
  assert.equal(s.winners, 2);
  const below = calculateScenario({
    carbonPrice: 1e-12,
    rebateShare: 87.5 - 1e-9,
  });
  const above = calculateScenario({
    carbonPrice: 1e-12,
    rebateShare: 87.5 + 1e-9,
  });
  assert.ok(below.households[2].net < 0);
  assert.ok(above.households[2].net > 0);
  assert.equal(below.winners, 2);
  assert.equal(above.winners, 3);
});

test("household CSV preserves tiny positive inputs and transfers as numbers", () => {
  const s = calculateScenario({ carbonPrice: 1e-12 });
  const csv = scenarioToCSV(s);
  const priceRow = csv
    .split("\r\n")
    .find((row) => row.startsWith("Carbon price (USD per tonne CO2e),"));
  assert.equal(Number(priceRow.split(",")[1]), s.input.carbonPrice);
  const householdRow = csv
    .split("\r\n")
    .find((row) => row.startsWith("Lowest income,"));
  assert.equal(Number(householdRow.split(",")[6]), s.households[0].net);
  assert.ok(Number(householdRow.split(",")[6]) > 0);
});

test("small assumed reductions remain positive when baseline and scenario totals round alike", () => {
  const s = calculateScenario({ response: 1e-15, carbonPrice: 100 });
  const expected = 1.6e-16;
  assert.ok(s.avoidedTonnes > 0);
  assert.ok(Math.abs(s.avoidedTonnes - expected) <= Number.EPSILON * expected);
  assert.equal(s.afterTonnes, s.baselineTonnes);
  assert.ok(s.households.every((h) => h.avoidedTonnes > 0));
  assert.ok(
    Math.abs(s.totals.avoidedTonnes - 8e-16) <= 2 * Number.EPSILON * 8e-16,
  );
});
