import test from "node:test";
import assert from "node:assert/strict";
import { isOnRangeStep, snapRange, stepImportedRange } from "../dist/form.js";

function range(value, { min = 0, max = 200, step = 5 } = {}) {
  return {
    type: "range",
    step: "any",
    min: String(min),
    max: String(max),
    dataset: { step: String(step), previousValue: String(value) },
    value: String(value),
    get valueAsNumber() {
      return Number(this.value);
    },
  };
}

function key(control, name) {
  let prevented = false;
  const handled = stepImportedRange({
    target: control,
    key: name,
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, handled);
  return handled;
}

test("grid membership preserves tiny and near-grid imports while accepting ordinary decimal steps", () => {
  assert.equal(isOnRangeStep(1e-8, 0, 5), false);
  assert.equal(isOnRangeStep(Number.MIN_VALUE, 0, 5), false);
  assert.equal(isOnRangeStep(50.000000001, 0, 5), false);
  assert.equal(isOnRangeStep(50, 0, 5), true);
  assert.equal(isOnRangeStep(0, 0, 5), true);
  assert.equal(isOnRangeStep(2.4, 1, 0.1), true);
  assert.equal(isOnRangeStep(2.4000000000000004, 1, 0.1), false);
});

test("imported sliders move in the requested direction at their documented increment", () => {
  for (const [initial, keyName, expected] of [
    [50.1, "ArrowRight", 55],
    [46, "ArrowRight", 50],
    [46, "ArrowLeft", 45],
    [0.001, "ArrowUp", 5],
    [0.001, "ArrowDown", 0],
    [199.999, "ArrowRight", 200],
    [50.000000001, "ArrowLeft", 50],
    [49.999999999, "ArrowRight", 50],
  ]) {
    const control = range(initial);
    assert.equal(key(control, keyName), true);
    assert.equal(control.valueAsNumber, expected);
    assert.equal(control.step, "5");
  }
  const household = range(2.34567, { min: 1, max: 6, step: 0.1 });
  key(household, "ArrowUp");
  assert.equal(household.valueAsNumber, 2.4);
  const almostHousehold = range(2.4000000000000004, {
    min: 1,
    max: 6,
    step: 0.1,
  });
  key(almostHousehold, "ArrowDown");
  assert.equal(almostHousehold.valueAsNumber, 2.4);
});

test("normal sliders and navigation keys retain native keyboard behavior", () => {
  const control = range(50);
  control.step = "5";
  assert.equal(key(control, "ArrowRight"), false);
  control.step = "any";
  assert.equal(key(control, "Home"), false);
  assert.equal(key(control, "End"), false);
  control.type = "number";
  assert.equal(key(control, "ArrowRight"), false);
  assert.equal(control.valueAsNumber, 50);
});

test("native value changes cannot reverse an imported slider when numeric step sanitizes its value", () => {
  const control = range(50.1);
  let step = "any";
  Object.defineProperty(control, "step", {
    get: () => step,
    set(value) {
      step = value;
      // Model the native sanitization that previously erased 52.1 before use.
      control.value = String(
        Math.round(control.valueAsNumber / Number(step)) * Number(step),
      );
    },
  });
  control.value = "52.1";
  snapRange(control);
  assert.equal(control.valueAsNumber, 55);
  assert.equal(control.dataset.previousValue, "55");

  const decreasing = range(54.9);
  decreasing.value = "52.9";
  snapRange(decreasing);
  assert.equal(decreasing.valueAsNumber, 50);
  assert.equal(decreasing.dataset.previousValue, "50");

  // Normal on-grid pointer values retain nearest-grid rounding.
  decreasing.value = "51";
  snapRange(decreasing);
  assert.equal(decreasing.valueAsNumber, 50);
});
