/** Read native form validity without committing an incomplete draft. */
export function readDraft(form) {
  const values = {};
  const invalid = [];
  for (const control of form.elements) {
    if (!control.name) continue;
    const valid =
      control.value.trim() !== "" &&
      control.validity.valid &&
      Number.isFinite(control.valueAsNumber);
    control.setAttribute("aria-invalid", String(!valid));
    const descriptions = (control.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(Boolean)
      .filter((id) => id !== "form-error");
    if (!valid) descriptions.push("form-error");
    if (descriptions.length)
      control.setAttribute("aria-describedby", descriptions.join(" "));
    else control.removeAttribute("aria-describedby");
    if (!valid) invalid.push(control);
    values[control.name] =
      control.valueAsNumber === 0 ? 0 : control.valueAsNumber;
  }
  return { values, invalid };
}

/** Draft readouts must follow the inputs even while another field is invalid. */
export function synchronizeReadouts(form, formats) {
  for (const control of form.elements) {
    if (!formats[control.name] || !Number.isFinite(control.valueAsNumber))
      continue;
    const formatted = formats[control.name](control.valueAsNumber);
    const output = form.querySelector(`#${control.name}-value`);
    if (output) output.textContent = formatted;
    control.setAttribute("aria-valuetext", formatted);
  }
}

/** Preserve every imported off-grid value, including tiny positive values. */
export function isOnRangeStep(value, min, step) {
  const nearest = Number(
    (min + Math.round((value - min) / step) * step).toFixed(8),
  );
  return value === nearest;
}

export function snapRange(control) {
  if (control.type !== "range") return;
  const step = Number(control.dataset.step);
  const min = Number(control.min);
  const max = Number(control.max);
  // Assigning a numeric step can sanitize the native value immediately.
  const incoming = control.valueAsNumber;
  const previous = Number(control.dataset.previousValue);
  let snapped = min + Math.round((incoming - min) / step) * step;
  if (incoming > previous && snapped < previous)
    snapped = nextRangeValue(previous, min, step, 1);
  else if (incoming < previous && snapped > previous)
    snapped = nextRangeValue(previous, min, step, -1);
  control.step = String(step);
  control.value = String(
    Math.min(max, Math.max(min, Number(snapped.toFixed(8)))),
  );
  control.dataset.previousValue = control.value;
}

function nextRangeValue(value, min, step, direction) {
  const position = (value - min) / step;
  return (
    min +
    (direction > 0 ? Math.floor(position) + 1 : Math.ceil(position) - 1) * step
  );
}

/** Imported off-step values remain exact until the user moves the slider. */
export function stepImportedRange(event) {
  const control = event.target;
  const direction = {
    ArrowRight: 1,
    ArrowUp: 1,
    ArrowLeft: -1,
    ArrowDown: -1,
  }[event.key];
  if (control.type !== "range" || control.step !== "any" || !direction)
    return false;
  const step = Number(control.dataset.step);
  const min = Number(control.min);
  const max = Number(control.max);
  const next = nextRangeValue(control.valueAsNumber, min, step, direction);
  event.preventDefault();
  control.step = String(step);
  control.value = String(Math.min(max, Math.max(min, Number(next.toFixed(8)))));
  return true;
}
