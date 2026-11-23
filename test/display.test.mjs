import test from "node:test";
import assert from "node:assert/strict";
import { freshState, STORAGE_KEY } from "../dist/state.js";

async function renderBusiness(annualTonnes, reductionPercent) {
  const state = freshState();
  state.business.annualTonnes = annualTonnes;
  state.business.reductionPercent = reductionPercent;
  const nodes = new Map();
  const node = (selector) => {
    if (!nodes.has(selector))
      nodes.set(selector, {
        innerHTML: "",
        textContent: "",
        dataset: {},
        addEventListener() {},
        focus() {},
        classList: { add() {}, remove() {}, toggle() {} },
      });
    return nodes.get(selector);
  };
  const keys = ["window", "document", "location"];
  const prior = Object.fromEntries(
    keys.map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]),
  );
  try {
    globalThis.window = {
      localStorage: {
        getItem: (key) => (key === STORAGE_KEY ? JSON.stringify(state) : null),
        setItem() {},
      },
      addEventListener() {},
    };
    globalThis.document = {
      querySelector: node,
      querySelectorAll: () => [],
      title: "",
    };
    globalThis.location = { hash: "#business" };
    await import(
      `../dist/app.js?emissions=${annualTonnes}&reduction=${reductionPercent}`
    );
    return node("#result-content").innerHTML;
  } finally {
    for (const [key, descriptor] of Object.entries(prior)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test("ten-kilogram business is never displayed as zero emissions in comparison", async () => {
  const html = await renderBusiness(0.01, 30);
  assert.ok(
    html.includes(
      "<td>Emissions · t CO₂e</td><td>&lt;0.1</td><td>&lt;0.1</td>",
    ),
  );
});
test("complete abatement keeps genuine zero distinct from a tiny positive baseline", async () => {
  const html = await renderBusiness(0.01, 100);
  assert.ok(
    html.includes("<td>Emissions · t CO₂e</td><td>&lt;0.1</td><td>0</td>"),
  );
});
test("ordinary fractional emissions retain readable decimal quantities", async () => {
  const html = await renderBusiness(1, 30);
  assert.ok(html.includes("<td>Emissions · t CO₂e</td><td>1</td><td>0.7</td>"));
});
