import test from "node:test";
import assert from "node:assert/strict";
import {
  money,
  cash,
  signedMoney,
  percent,
  tonnes,
  controlFormats,
} from "../dist/format.js";

test("small nonzero monetary results stay distinguishable from genuine zero", () => {
  assert.equal(money(0), "$0");
  assert.equal(cash(-0), "$0");
  assert.equal(money(0.01), "$0.01");
  assert.equal(signedMoney(-0.01), "−$0.01");
  assert.equal(signedMoney(0.005), "+$0.005");
  assert.equal(cash(2e-8), "$2.0e-8");
  assert.equal(money(12000), "$12,000");
  assert.equal(cash(12000), "$12K");
});

test("small nonzero percentages never become negative zero percent", () => {
  assert.equal(percent(-0), "0%");
  assert.equal(percent(null), "Not defined");
  assert.equal(percent(-0.005), "−0.005%");
  assert.equal(percent(2e-8), "2.0e-8%");
  assert.equal(percent(12.345), "12.3%");
});

test("physical quantities and precise imported slider values retain their meaning", () => {
  assert.equal(tonnes(0), "0");
  assert.equal(tonnes(0.001), "<0.1");
  assert.equal(controlFormats.carbonPrice(0.001), "$0.001/t");
  assert.equal(controlFormats.householdSize(2.34567), "2.34567 people");
  assert.notEqual(controlFormats.carbonPrice(1e-8), "$0/t");
});
