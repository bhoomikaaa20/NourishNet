import React, { useState } from "react";
import { Link } from "react-router-dom";

// Label + control + inline error, wired together for screen readers.
export const Field = ({ label, name, error, hint, children }) => (
  <div className={`field${error ? " has-error" : ""}`}>
    <label htmlFor={name}>{label}</label>
    {children}
    {hint && !error && <small className="field-hint">{hint}</small>}
    {error && (
      <small className="field-error" id={`${name}-error`} role="alert">
        {error}
      </small>
    )}
  </div>
);

export const Input = ({ name, error, ...rest }) => (
  <input id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...rest} />
);

export const Select = ({ name, error, children, ...rest }) => (
  <select id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...rest}>
    {children}
  </select>
);

export const Textarea = ({ name, error, ...rest }) => (
  <textarea id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...rest} />
);

// Accessible radio (single) or checkbox (multiple) group rendered as tappable cards.
export const OptionCards = ({ name, label, options, value, onChange, error, multiple = false, columns }) => {
  const selected = multiple ? value || [] : value;
  const toggle = (v) => {
    const next = multiple ? (selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]) : v;
    onChange({ target: { name, value: next } });
  };
  return (
    <fieldset className={`field option-field${error ? " has-error" : ""}`} id={name} tabIndex={-1}>
      <legend>{label}</legend>
      <div className="option-cards" style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}>
        {options.map((o) => {
          const checked = multiple ? selected.includes(o.value) : selected === o.value;
          return (
            <label key={o.value} className={`option-card${checked ? " checked" : ""}`}>
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => toggle(o.value)}
                aria-describedby={error ? `${name}-error` : undefined}
              />
              {o.icon && <i className={`fa-solid ${o.icon}`} aria-hidden="true" />}
              <span>{o.label}</span>
              {o.hint && <small>{o.hint}</small>}
            </label>
          );
        })}
      </div>
      {error && (
        <small className="field-error" id={`${name}-error`} role="alert">
          {error}
        </small>
      )}
    </fieldset>
  );
};

export const Alert =({ type = "error", children }) =>
  children ? (
    <div className={`alert alert-${type}`} role={type === "error" ? "alert" : "status"}>
      <i className={`fa-solid ${type === "error" ? "fa-circle-exclamation" : "fa-circle-check"}`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  ) : null;

export const SubmitButton = ({ loading, children, loadingText = "Submitting…" }) => (
  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
    {loading ? (
      <>
        <span className="spinner" aria-hidden="true" /> {loadingText}
      </>
    ) : (
      children
    )}
  </button>
);

// Shown after a request/donation is saved: the tracking code is the user's receipt.
export const SuccessPanel = ({ title, message, trackingId, email, onReset, resetLabel }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the code is visible to copy manually */
    }
  };

  return (
    <div className="success-panel" role="status">
      <div className="success-icon" aria-hidden="true">
        <i className="fa-solid fa-check" />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {trackingId && (
        <div className="tracking-box">
          <span className="tracking-label">Your tracking code</span>
          <strong className="tracking-code">{trackingId}</strong>
          <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>
            <i className={`fa-regular ${copied ? "fa-circle-check" : "fa-copy"}`} aria-hidden="true" />{" "}
            {copied ? "Copied" : "Copy code"}
          </button>
          <small>Save this code. You'll need it with your email to check the status.</small>
        </div>
      )}
      <div className="success-actions">
        {trackingId && (
          <Link
            className="btn btn-primary"
            to={`/track?code=${encodeURIComponent(trackingId)}&email=${encodeURIComponent(email || "")}`}
          >
            Track status
          </Link>
        )}
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          {resetLabel}
        </button>
      </div>
    </div>
  );
};

// Page header band used by the form/info pages.
export const PageHeader = ({ eyebrow, title, subtitle, image }) => (
  <header className="page-header" style={image ? { backgroundImage: `url(${image})` } : undefined}>
    <div className="page-header-inner">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {subtitle && <p className="lede">{subtitle}</p>}
    </div>
  </header>
);
