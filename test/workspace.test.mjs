import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspace } from "../dist/workspace.js";
import { freshState, STORAGE_KEY } from "../dist/state.js";

function memoryStorage(initial = null) {
  let raw = initial;
  let writes = 0;
  return {
    getItem(key) {
      assert.equal(key, STORAGE_KEY);
      return raw;
    },
    setItem(key, value) {
      assert.equal(key, STORAGE_KEY);
      raw = value;
      writes++;
    },
    get raw() {
      return raw;
    },
    get writes() {
      return writes;
    },
    replaceExternally(value) {
      raw = value;
    },
  };
}

test("invalid saved data survives working edits and saved cards until explicit recovery", () => {
  const raw = "{unfinished json";
  const storage = memoryStorage(raw);
  const workspace = createWorkspace(storage);
  assert.equal(workspace.requiresRecovery, true);
  const input = { ...workspace.state.business, revenue: 450000 };
  assert.equal(workspace.updateScenario("business", input), false);
  assert.deepEqual(workspace.saveScenario("business", input, "local-card"), {
    outcome: "saved",
    persisted: false,
  });
  assert.equal(storage.raw, raw);
  assert.equal(storage.writes, 0);
  assert.equal(workspace.state.business.revenue, 450000);
  assert.equal(workspace.state.saved.length, 1);
  assert.equal(workspace.replaceBrowserData(), true);
  assert.equal(workspace.requiresRecovery, false);
  assert.equal(workspace.warning, "");
  assert.equal(JSON.parse(storage.raw).saved[0].id, "local-card");
});

test("editing one lab preserves another tab’s different lab and newly saved cards", () => {
  const storage = memoryStorage(JSON.stringify(freshState()));
  const first = createWorkspace(storage);
  const second = createWorkspace(storage);
  second.updateScenario("policy", { ...second.state.policy, carbonPrice: 175 });
  second.saveScenario("policy", second.state.policy, "remote-policy");
  first.updateScenario("business", {
    ...first.state.business,
    revenue: 730000,
  });
  const persisted = JSON.parse(storage.raw);
  assert.equal(persisted.business.revenue, 730000);
  assert.equal(persisted.policy.carbonPrice, 175);
  assert.equal(persisted.saved[0].id, "remote-policy");
  assert.equal(first.state.policy.carbonPrice, 175);
});

test("save and remove operations merge with the latest cards even before a storage event arrives", () => {
  const storage = memoryStorage(JSON.stringify(freshState()));
  const first = createWorkspace(storage);
  const second = createWorkspace(storage);
  first.saveScenario("business", first.state.business, "first");
  second.saveScenario(
    "business",
    { ...second.state.business, carbonPrice: 100 },
    "second",
  );
  assert.deepEqual(
    JSON.parse(storage.raw).saved.map((card) => card.id),
    ["first", "second"],
  );
  first.removeScenario("first", "business");
  assert.deepEqual(
    JSON.parse(storage.raw).saved.map((card) => card.id),
    ["second"],
  );
});

test("saving a visible scenario does not rewrite another tab’s latest scenario inputs", () => {
  const storage = memoryStorage(JSON.stringify(freshState()));
  const first = createWorkspace(storage);
  const second = createWorkspace(storage);
  second.updateScenario("business", {
    ...second.state.business,
    revenue: 900000,
  });
  first.saveScenario("business", first.state.business, "visible-original");
  const persisted = JSON.parse(storage.raw);
  assert.equal(persisted.business.revenue, 900000);
  assert.equal(persisted.saved[0].input.revenue, 1000000);
  assert.equal(first.state.business.revenue, 1000000);
});

test("remote duplicates and capacity are checked against fresh storage", () => {
  const storage = memoryStorage(JSON.stringify(freshState()));
  const first = createWorkspace(storage);
  const second = createWorkspace(storage);
  first.saveScenario("business", first.state.business, "one");
  assert.equal(
    second.saveScenario("business", second.state.business, "duplicate").outcome,
    "duplicate",
  );
  first.saveScenario(
    "business",
    { ...first.state.business, carbonPrice: 100 },
    "two",
  );
  first.saveScenario(
    "business",
    { ...first.state.business, carbonPrice: 150 },
    "three",
  );
  assert.equal(
    second.saveScenario(
      "business",
      { ...second.state.business, carbonPrice: 200 },
      "four",
    ).outcome,
    "full",
  );
  assert.equal(JSON.parse(storage.raw).saved.length, 3);
});

test("a write failure keeps all subsequent local work and requires explicit retry", () => {
  let raw = JSON.stringify(freshState());
  let blocked = true;
  const storage = {
    getItem: () => raw,
    setItem(key, value) {
      if (blocked) throw Error("Quota");
      raw = value;
    },
  };
  const workspace = createWorkspace(storage);
  workspace.saveScenario("business", workspace.state.business, "unsaved-card");
  assert.equal(workspace.requiresRecovery, true);
  workspace.updateScenario("policy", {
    ...workspace.state.policy,
    carbonPrice: 80,
  });
  workspace.refresh("business");
  assert.equal(workspace.state.saved[0].id, "unsaved-card");
  assert.equal(workspace.state.policy.carbonPrice, 80);
  assert.equal(JSON.parse(raw).saved.length, 0);
  blocked = false;
  assert.equal(workspace.replaceBrowserData(), true);
  assert.equal(JSON.parse(raw).saved[0].id, "unsaved-card");
  assert.equal(JSON.parse(raw).policy.carbonPrice, 80);
});

test("new corruption after startup blocks automatic overwrite without discarding the current workspace", () => {
  const storage = memoryStorage(JSON.stringify(freshState()));
  const workspace = createWorkspace(storage);
  storage.replaceExternally("external damaged data");
  workspace.updateScenario("business", {
    ...workspace.state.business,
    investment: 20000,
  });
  assert.equal(storage.raw, "external damaged data");
  assert.equal(workspace.requiresRecovery, true);
  assert.equal(workspace.state.business.investment, 20000);
});

test("refresh updates saved cards and inactive lab without replacing the active visible scenario", () => {
  const storage = memoryStorage(JSON.stringify(freshState()));
  const first = createWorkspace(storage);
  const second = createWorkspace(storage);
  second.updateScenario("business", { ...second.state.business, revenue: 5 });
  second.updateScenario("policy", { ...second.state.policy, carbonPrice: 99 });
  second.saveScenario("policy", second.state.policy, "remote-card");
  first.refresh("business");
  assert.equal(first.state.business.revenue, 1000000);
  assert.equal(first.state.policy.carbonPrice, 99);
  assert.equal(first.state.saved[0].id, "remote-card");
});
