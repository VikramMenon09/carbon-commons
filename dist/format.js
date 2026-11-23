const normalizeZero = (value) => (value === 0 ? 0 : value);

export const number = (value, digits = 0) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(normalizeZero(value));

function smallMagnitude(value) {
  return value < 0.0001
    ? value.toExponential(1)
    : new Intl.NumberFormat("en-US", { maximumSignificantDigits: 2 }).format(
        value,
      );
}

export function money(value) {
  const magnitude = Math.abs(value);
  if (magnitude > 0 && magnitude < 1) {
    return `${value < 0 ? "−" : ""}$${smallMagnitude(magnitude)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(normalizeZero(value));
}

export function compact(value) {
  if (Math.abs(value) >= 1e15) return value.toExponential(1);
  return new Intl.NumberFormat("en-US", {
    notation: Math.abs(value) >= 10000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 10000 ? 1 : 0,
  }).format(normalizeZero(value));
}

export function cash(value) {
  if (Math.abs(value) < 1) return money(value);
  return `${value < 0 ? "−" : ""}$${compact(Math.abs(value))}`;
}

export const signedMoney = (value) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${money(Math.abs(value))}`;

export function years(value) {
  if (value === null) return "Not defined";
  if (value > 0 && value < 0.1) return "less than 0.1";
  return value > 999 ? compact(value) : number(value, 1);
}

export function percentNumber(value) {
  if (value === null) return "Not defined";
  const magnitude = Math.abs(value);
  if (magnitude > 0 && magnitude < 0.1)
    return `${value < 0 ? "−" : ""}${smallMagnitude(magnitude)}`;
  return `${magnitude >= 1e6 ? compact(value) : number(value, 1)}`;
}

export const percent = (value) =>
  value === null ? "Not defined" : `${percentNumber(value)}%`;

export const spokenPercent = (value) =>
  value > 0 && value < 0.1 ? "less than 0.1" : percentNumber(value);

export const tonnes = (value, digits = 1) =>
  value > 0 && value < 10 ** -digits
    ? `<${10 ** -digits}`
    : value >= 10000
      ? compact(value)
      : number(value, digits);

export function inputNumber(value) {
  if (value !== 0 && Math.abs(value) < 0.0001) return value.toExponential(2);
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 12,
  }).format(normalizeZero(value));
}

export const controlFormats = {
  carbonPrice: (value) => `$${inputNumber(value)}/t`,
  reductionPercent: (value) => `${inputNumber(value)}%`,
  rebateShare: (value) => `${inputNumber(value)}%`,
  response: (value) => `${inputNumber(value)}%`,
  householdSize: (value) => `${inputNumber(value)} people`,
};
