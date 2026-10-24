// Client-side checks mirror backend/utils/validate.js so users get instant feedback;
// the server remains the source of truth.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;

export const required = (label) => (v) => (String(v ?? "").trim() ? "" : `${label} is required`);

export const maxLen = (label, n) => (v) =>
  String(v ?? "").trim().length > n ? `${label} must be at most ${n} characters` : "";

export const email = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return "Email is required";
  return EMAIL_RE.test(s) ? "" : "Enter a valid email address";
};

export const phone = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return "Phone number is required";
  return PHONE_RE.test(s) && s.replace(/\D/g, "").length >= 7 ? "" : "Enter a valid phone number";
};

export const numberRange = (label, min, max, { optional = false, integer = false } = {}) => (v) => {
  if (optional && String(v ?? "").trim() === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (integer && !Number.isInteger(n)) return `${label} must be a whole number`;
  if (n < min) return `${label} must be at least ${min}`;
  if (n > max) return `${label} must be at most ${max}`;
  return "";
};

export const minItems = (label, n) => (v) => ((v || []).length >= n ? "" : `Select at least ${n} ${label}`);

// Date input value (YYYY-MM-DD) between today and `maxDays` ahead.
export const dateWithin = (label, maxDays) => (v) => {
  const s = String(v ?? "");
  if (!s) return `${label} is required`;
  const d = new Date(`${s}T23:59:59`);
  if (Number.isNaN(d.getTime())) return `${label} must be a valid date`;
  if (d < new Date()) return `${label} can't be in the past`;
  if (d.getTime() > Date.now() + maxDays * 86400000) return `${label} must be within ${maxDays} days`;
  return "";
};

// Runs a { field: validatorFn | [validatorFn] } map and returns { field: message } for failures.
export const validateAll = (values, rules) => {
  const errors = {};
  for (const [field, fns] of Object.entries(rules)) {
    for (const fn of [].concat(fns)) {
      const msg = fn(values[field]);
      if (msg) {
        errors[field] = msg;
        break;
      }
    }
  }
  return errors;
};
