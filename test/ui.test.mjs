import test from "node:test";
import assert from "node:assert/strict";
import { freshState, STORAGE_KEY } from "../dist/state.js";
import { controlFormats } from "../dist/format.js";

// A narrow DOM port for event/state tests, not a browser layout emulator.
// Native number-input behavior, keyboard access and layout are checked in-browser.
let sequence = 0;
async function appHarness(
  raw = JSON.stringify(freshState()),
  clipboard = { writeText: async () => {} },
  hash = "#business",
) {
  const nodes = new Map();
  const events = new Map();
  const timers = new Map();
  const writes = [];
  let timer = 0;
  function node(selector) {
    if (!nodes.has(selector)) {
      const attributes = new Map();
      const listeners = new Map();
      let html = "";
      nodes.set(selector, {
        get innerHTML() {
          return html;
        },
        set innerHTML(value) {
          html = value;
          // Replacing this notice destroys its old button in a real DOM.
          if (selector === "#storage-notice") {
            const oldButton = nodes.get("#recover-storage");
            if (oldButton && document.activeElement === oldButton)
              document.activeElement = document.body;
            nodes.delete("#recover-storage");
          }
        },
        textContent: "",
        dataset: {},
        hidden: false,
        disabled: false,
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener(name, listener) {
          listeners.set(name, listener);
        },
        setAttribute(name, value) {
          attributes.set(name, String(value));
        },
        getAttribute(name) {
          return attributes.get(name) ?? null;
        },
        removeAttribute(name) {
          attributes.delete(name);
        },
        focus() {
          document.activeElement = this;
        },
        scrollIntoView() {},
        listeners,
      });
    }
    return nodes.get(selector);
  }
  const query = (selector) =>
    selector === "#recover-storage" &&
    !node("#storage-notice").innerHTML.includes('id="recover-storage"')
      ? null
      : node(selector);
  const values = freshState().business;
  const labels = {
    revenue: "Revenue",
    operatingCost: "Operating costs",
    annualTonnes: "Baseline emissions",
    carbonPrice: "Carbon price",
    reductionPercent: "Emissions reduction",
    investment: "Upfront cost",
    annualSavings: "Yearly savings",
  };
  const controls = Object.entries(values).map(([name, value]) => {
    const control = node(`#${name}`);
    Object.assign(control, {
      name,
      value: String(value),
      type: ["carbonPrice", "reductionPercent"].includes(name)
        ? "range"
        : "number",
      min: "0",
      max:
        name === "carbonPrice"
          ? "200"
          : name === "reductionPercent"
            ? "100"
            : name === "annualTonnes"
              ? "1000000000"
              : "1000000000000",
      labels: [{ textContent: labels[name] }],
    });
    control.dataset.step = name === "carbonPrice" ? "5" : "1";
    control.dataset.previousValue = String(value);
    Object.defineProperty(control, "valueAsNumber", {
      get: () => (control.value.trim() === "" ? NaN : Number(control.value)),
    });
    Object.defineProperty(control, "validity", {
      get: () => ({
        valid:
          Number.isFinite(control.valueAsNumber) &&
          control.valueAsNumber >= Number(control.min) &&
          control.valueAsNumber <= Number(control.max),
      }),
    });
    if (controlFormats[name]) {
      node(`#${name}-value`).textContent = controlFormats[name](value);
      control.setAttribute("aria-valuetext", controlFormats[name](value));
    }
    return control;
  });
  node("#scenario-form").elements = controls;
  node("#scenario-form").querySelector = query;
  const storage = {
    getItem(key) {
      assert.equal(key, STORAGE_KEY);
      return raw;
    },
    setItem(key, value) {
      assert.equal(key, STORAGE_KEY);
      raw = value;
      writes.push(value);
    },
  };
  const globals = [
    "window",
    "document",
    "location",
    "navigator",
    "setTimeout",
    "clearTimeout",
  ];
  const previous = new Map(
    globals.map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  globalThis.window = {
    localStorage: storage,
    addEventListener(name, listener) {
      events.set(name, listener);
    },
  };
  const appended = [];
  globalThis.document = {
    querySelector: query,
    querySelectorAll: () => [],
    title: "",
    activeElement: null,
    body: {
      append(element) {
        appended.push(element);
      },
    },
    createElement(tag) {
      const element = node(`created-${tag}-${appended.length}`);
      element.value = "";
      element.select = () => {};
      element.remove = () => {
        const index = appended.indexOf(element);
        if (index >= 0) appended.splice(index, 1);
      };
      return element;
    },
  };
  globalThis.location = {
    hash,
    href: "https://example.test/carbon-commons/#business",
  };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { clipboard },
  });
  globalThis.setTimeout = (callback) => {
    timers.set(++timer, callback);
    return timer;
  };
  globalThis.clearTimeout = (id) => timers.delete(id);
  const restore = () => {
    timers.clear();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  };
  try {
    await import(`../dist/app.js?ui-regression=${++sequence}`);
  } catch (error) {
    restore();
    throw error;
  }
  return {
    node,
    storage,
    writes,
    appended,
    get raw() {
      return raw;
    },
    input(name, value) {
      const target = node(`#${name}`);
      target.value = String(value);
      node("#scenario-form").listeners.get("input")({ target });
    },
    click(selector) {
      return node(selector).listeners.get("click")();
    },
    navigate(hash) {
      location.hash = hash;
      events.get("hashchange")();
    },
    runTimers() {
      for (const callback of [...timers.values()]) callback();
      timers.clear();
    },
    restore,
  };
}

test("range labels track a draft while invalid fields keep the last valid result, then recover together", async () => {
  const app = await appHarness();
  try {
    app.input("revenue", "");
    app.input("carbonPrice", 200);
    assert.equal(app.writes.length, 0);
    assert.equal(app.node("#carbonPrice-value").textContent, "$200/t");
    assert.equal(
      app.node("#carbonPrice").getAttribute("aria-valuetext"),
      "$200/t",
    );
    assert.equal(app.node("#revenue").getAttribute("aria-invalid"), "true");
    assert.equal(
      app.node("#revenue").getAttribute("aria-describedby"),
      "form-error",
    );
    assert.equal(app.node("#result-status").hidden, false);
    assert.equal(app.node("#save-scenario").disabled, true);
    assert.ok(app.node("#result-content").innerHTML.includes("$15.8K"));
    app.input("revenue", 1000000);
    assert.equal(app.node("#result-status").hidden, true);
    assert.equal(app.node("#save-scenario").disabled, false);
    assert.equal(app.node("#revenue").getAttribute("aria-describedby"), null);
    assert.equal(JSON.parse(app.raw).business.carbonPrice, 200);
    assert.ok(app.node("#result-content").innerHTML.includes("$27K"));
    assert.equal(app.node("#carbonPrice-value").textContent, "$200/t");
  } finally {
    app.restore();
  }
});

test("real app keeps corrupted browser data until the explicit recovery action", async () => {
  const app = await appHarness("{unreadable saved session");
  try {
    app.input("revenue", 900000);
    app.click("#save-scenario");
    assert.equal(app.raw, "{unreadable saved session");
    assert.equal(app.writes.length, 0);
    assert.ok(app.node("#saved-content").innerHTML.includes("Scenario 1"));
    assert.ok(
      app
        .node("#storage-notice")
        .innerHTML.includes("Replace browser data with this session"),
    );
    app.click("#recover-storage");
    assert.equal(JSON.parse(app.raw).business.revenue, 900000);
    assert.equal(JSON.parse(app.raw).saved.length, 1);
    assert.equal(app.node("#storage-notice").innerHTML, "");
    assert.equal(document.activeElement, app.node("#reset"));
  } finally {
    app.restore();
  }
});

test("failed recovery preserves focus when the warning replaces its button", async () => {
  const app = await appHarness("{unreadable saved session");
  try {
    app.storage.setItem = () => {
      throw Error("Quota exceeded");
    };
    const previousButton = app.node("#recover-storage");
    previousButton.focus();
    app.click("#recover-storage");
    assert.notEqual(app.node("#recover-storage"), previousButton);
    assert.equal(document.activeElement, app.node("#recover-storage"));
    assert.equal(app.raw, "{unreadable saved session");
    assert.ok(app.node("#toast").textContent.includes("still unavailable"));
  } finally {
    app.restore();
  }
});

test("right arrow from an imported price advances to the next grid point", async () => {
  const app = await appHarness();
  try {
    const control = app.node("#carbonPrice");
    control.value = "50.1";
    control.dataset.previousValue = "50.1";
    control.step = "any";
    let prevented = false;
    app.node("#scenario-form").listeners.get("keydown")({
      target: control,
      key: "ArrowRight",
      preventDefault() {
        prevented = true;
      },
    });
    assert.equal(prevented, true);
    assert.equal(control.value, "55");
    assert.equal(app.node("#carbonPrice-value").textContent, "$55/t");
    assert.equal(JSON.parse(app.raw).business.carbonPrice, 55);
  } finally {
    app.restore();
  }
});

test("an imported slider follows a native accessibility value change without keydown", async () => {
  const app = await appHarness();
  try {
    const control = app.node("#carbonPrice");
    control.dataset.previousValue = "50.1";
    control.step = "any";
    app.input("carbonPrice", 52.1);
    assert.equal(control.value, "55");
    assert.equal(app.node("#carbonPrice-value").textContent, "$55/t");
    assert.equal(JSON.parse(app.raw).business.carbonPrice, 55);
  } finally {
    app.restore();
  }
});

test("navigation cancels result announcements from the previous lab", async () => {
  const app = await appHarness();
  try {
    app.click("#save-scenario");
    assert.ok(app.node("#toast").textContent);
    app.navigate("#contribute");
    app.runTimers();
    assert.equal(app.node("#result-announcement").textContent, "");
    assert.equal(app.node("#toast").textContent, "");
    assert.equal(document.title, "Carbon Commons — Build together");
  } finally {
    app.restore();
  }
});

test("a delayed clipboard failure cannot steal focus or open a stale link after navigation", async () => {
  let reject;
  const clipboard = {
    writeText: () =>
      new Promise((resolve, fail) => {
        reject = fail;
      }),
  };
  const app = await appHarness(JSON.stringify(freshState()), clipboard);
  try {
    const pending = app.click("#share");
    app.navigate("#contribute");
    reject(Error("Clipboard permission denied"));
    await pending;
    assert.equal(app.appended.length, 0);
    assert.equal(document.title, "Carbon Commons — Build together");
  } finally {
    app.restore();
  }
});

test("clipboard fallback exposes a named copy field and Escape returns focus to the initiating action", async () => {
  const app = await appHarness(JSON.stringify(freshState()), {
    writeText: async () => {
      throw Error("Unavailable");
    },
  });
  try {
    await app.click("#share");
    assert.equal(app.appended.length, 1);
    const field = app.appended[0];
    assert.equal(field.getAttribute("aria-label"), "Scenario link");
    assert.match(
      field.value,
      /^https:\/\/example\.test\/carbon-commons\/#business\?/,
    );
    let prevented = false;
    field.listeners.get("keydown")({
      key: "Escape",
      preventDefault() {
        prevented = true;
      },
    });
    assert.equal(prevented, true);
    assert.equal(app.appended.length, 0);
    assert.equal(document.activeElement, app.node("#share"));
  } finally {
    app.restore();
  }
});

test("tiny policy effects remain positive in results, comparison cards, bars and announcements", async () => {
  const state = freshState();
  state.policy.carbonPrice = 0.000001;
  const app = await appHarness(JSON.stringify(state), undefined, "#policy");
  try {
    const html = app.node("#result-content").innerHTML;
    assert.ok(html.includes('1.0e-7<span class="metric-unit">%</span>'));
    assert.ok(html.includes("&lt;0.01 t CO₂e / household / year"));
    assert.ok(html.includes('style="width:48%"'));
    app.click("#save-scenario");
    assert.ok(
      app
        .node("#saved-content")
        .innerHTML.includes("1.0e-7% modeled emissions cut"),
    );
    app.runTimers();
    assert.ok(
      app
        .node("#result-announcement")
        .textContent.includes("less than 0.1 percent modeled reduction"),
    );
  } finally {
    app.restore();
  }
});

test("tiny imported prices render without a numeric step that would sanitize the native control to zero", async () => {
  const state = freshState();
  state.policy.carbonPrice = 1e-8;
  state.policy.householdSize = 2.4;
  const app = await appHarness(JSON.stringify(state), undefined, "#policy");
  try {
    const markup = app.node("#app").innerHTML;
    const price = markup.match(/<input type="range" id="carbonPrice"[^>]+>/)[0];
    const household = markup.match(
      /<input type="range" id="householdSize"[^>]+>/,
    )[0];
    assert.ok(price.includes('step="any"'));
    assert.ok(price.includes('value="1e-8"'));
    assert.ok(household.includes('step="0.1"'));
  } finally {
    app.restore();
  }
});
