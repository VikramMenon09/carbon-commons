import { loadState, saveState, validateInput } from "./state.js";

const WRITE_WARNING =
  "Browser storage could not be updated. Your work is still available in this session. Export it or copy a scenario link before closing this page.";

/**
 * Separate the visible working scenarios from the last shared browser snapshot.
 * A change writes only its own lab or saved-card operation over a fresh read.
 * Unreadable storage is never silently replaced with repaired defaults.
 */
export function createWorkspace(storage) {
  const loaded = loadState(storage);
  let state = loaded.state;
  let warning = loaded.warning;
  let requiresRecovery = loaded.requiresRecovery;

  function latestBase() {
    if (requiresRecovery) return state;
    const latest = loadState(storage);
    if (latest.requiresRecovery) {
      requiresRecovery = true;
      warning = latest.warning;
      return state;
    }
    return latest.state;
  }

  function commit(base, activeMode) {
    state.saved = base.saved;
    for (const mode of ["business", "policy"]) {
      if (mode !== activeMode) state[mode] = { ...base[mode] };
    }
    if (requiresRecovery) return false;
    if (!saveState(storage, base)) {
      requiresRecovery = true;
      warning = WRITE_WARNING;
      return false;
    }
    warning = "";
    return true;
  }

  return {
    get state() {
      return state;
    },
    get warning() {
      return warning;
    },
    get requiresRecovery() {
      return requiresRecovery;
    },

    updateScenario(mode, input) {
      const values = validateInput(mode, input);
      const base = latestBase();
      state[mode] = values;
      return commit({ ...base, [mode]: { ...values } }, mode);
    },

    saveScenario(mode, input, id) {
      const values = validateInput(mode, input);
      if (typeof id !== "string" || !id.trim() || id.length > 80) {
        throw new Error("Invalid saved scenario identifier");
      }
      const base = latestBase();
      const own = base.saved.filter((item) => item.mode === mode);
      if (
        own.some((item) =>
          Object.keys(values).every((key) => item.input[key] === values[key]),
        )
      ) {
        state.saved = base.saved;
        return { outcome: "duplicate", persisted: !requiresRecovery };
      }
      if (own.length >= 3) {
        state.saved = base.saved;
        return { outcome: "full", persisted: !requiresRecovery };
      }
      if (base.saved.some((item) => item.id === id))
        throw new Error("Duplicate saved scenario identifier");
      const number = [1, 2, 3].find(
        (value) => !own.some((item) => item.name === `Scenario ${value}`),
      );
      const saved = [
        ...base.saved,
        { id, mode, input: values, name: `Scenario ${number}` },
      ];
      return { outcome: "saved", persisted: commit({ ...base, saved }, mode) };
    },

    removeScenario(id, activeMode) {
      const base = latestBase();
      const saved = base.saved.filter((item) => item.id !== id);
      return commit({ ...base, saved }, activeMode);
    },

    refresh(activeMode) {
      if (requiresRecovery) return;
      const latest = loadState(storage);
      if (latest.requiresRecovery) {
        requiresRecovery = true;
        warning = latest.warning;
        return;
      }
      state.saved = latest.state.saved;
      for (const mode of ["business", "policy"]) {
        if (mode !== activeMode) state[mode] = { ...latest.state[mode] };
      }
    },

    replaceBrowserData() {
      if (!saveState(storage, state)) {
        requiresRecovery = true;
        warning = WRITE_WARNING;
        return false;
      }
      requiresRecovery = false;
      warning = "";
      return true;
    },
  };
}
