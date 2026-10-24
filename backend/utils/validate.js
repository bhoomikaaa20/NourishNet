// Small, dependency-free validation. Every value is coerced to a string first so
// objects such as { "$ne": null } can never reach a Mongo query or document.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;

const str = (v) => (typeof v === "string" ? v.trim() : "");

// Accepts ISO strings; a bare YYYY-MM-DD means the end of that (UTC) day.
const parseDate = (v) => {
  const s = str(v);
  if (!s) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T23:59:59.999Z` : s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const rules = {
  text: (label, { min = 1, max = 100 } = {}) => (v) => {
    const s = str(v);
    if (s.length < min) return `${label} is required`;
    if (s.length > max) return `${label} must be at most ${max} characters`;
    return null;
  },
  optionalText: (label, { max = 500 } = {}) => (v) => {
    const s = str(v);
    return s.length > max ? `${label} must be at most ${max} characters` : null;
  },
  email: () => (v) => {
    const s = str(v);
    if (!s) return "Email is required";
    if (s.length > 254 || !EMAIL_RE.test(s)) return "Enter a valid email address";
    return null;
  },
  phone: () => (v) => {
    const s = str(v);
    if (!s) return "Phone number is required";
    if (!PHONE_RE.test(s) || s.replace(/\D/g, "").length < 7)
      return "Enter a valid phone number";
    return null;
  },
  oneOf: (label, allowed) => (v) =>
    allowed.includes(str(v)) ? null : `Select a valid ${label}`,
  optionalOneOf: (label, allowed) => (v) =>
    v === undefined || v === null || str(v) === "" || allowed.includes(str(v)) ? null : `Select a valid ${label}`,
  // A date between now and `maxDays` ahead (dates without a time count as end of that day).
  futureDate: (label, { maxDays = 30, optional = false } = {}) => (v) => {
    if (optional && (v === undefined || v === null || str(v) === "")) return null;
    const d = parseDate(v);
    if (!d) return `${label} must be a valid date`;
    if (d.getTime() < Date.now() - 60 * 1000) return `${label} must be in the future`;
    if (d.getTime() > Date.now() + maxDays * 86400000) return `${label} must be within ${maxDays} days`;
    return null;
  },
  subsetOf: (label, allowed, { min = 0 } = {}) => (v) => {
    const list = v === undefined ? [] : v;
    if (!Array.isArray(list) || list.some((x) => typeof x !== "string" || !allowed.includes(x)))
      return `Select valid ${label}`;
    if (list.length < min) return `Select at least ${min} ${label}`;
    return null;
  },
  bool: (label) => (v) => (v === undefined || typeof v === "boolean" ? null : `${label} must be true or false`),
  number: (label,{ min, max, integer = false, optional = false } = {}) => (v) => {
    if (optional && (v === undefined || v === null || v === "")) return null;
    const n = typeof v === "number" || typeof v === "string" ? Number(v) : NaN;
    if (!Number.isFinite(n)) return `${label} must be a number`;
    if (integer && !Number.isInteger(n)) return `${label} must be a whole number`;
    if (min !== undefined && n < min) return `${label} must be at least ${min}`;
    if (max !== undefined && n > max) return `${label} must be at most ${max}`;
    return null;
  },
};

// Returns { errors, clean } where clean only contains whitelisted, trimmed fields.
const validate = (body, schema) => {
  const src = body && typeof body === "object" ? body : {};
  const errors = {};
  const clean = {};
  for (const [field, rule] of Object.entries(schema)) {
    const err = rule(src[field]);
    if (err) errors[field] = err;
    else clean[field] = typeof src[field] === "string" ? src[field].trim() : src[field];
  }
  return { errors, clean, ok: Object.keys(errors).length === 0 };
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { rules, validate, escapeRegex, str, parseDate };
