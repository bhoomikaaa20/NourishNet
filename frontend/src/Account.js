import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { parseError } from "./api";
import useForm from "./components/useForm";
import { useAuth } from "./components/AuthContext";
import { useToast } from "./components/Toast";
import { foodMeta } from "./components/foodMeta";
import { maxLen, required } from "./components/validators";
import { Alert, Field, Input, SubmitButton } from "./components/Form";
import { optionalPhone, passwordRule } from "./Register";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");

const profileRules = { name: [required("Name"), maxLen("Name", 100)], phone: optionalPhone, city: maxLen("City", 80) };
const passwordRules = { currentPassword: required("Current password"), newPassword: passwordRule("New password") };

const ProfileForm = ({ user }) => {
  const { applySession } = useAuth();
  const toast = useToast();
  const form = useForm({ name: user.name, phone: user.phone, city: user.city }, profileRules, async (v) => {
    applySession((await api.patch("/api/me", v)).data);
    toast.success("Profile saved");
    return true;
  });
  const { values, errors, onChange, onBlur } = form;
  const bind = (name) => ({ name, value: values[name], onChange, onBlur, error: errors[name] });

  return (
    <form className="panel account-panel" onSubmit={form.submit} noValidate>
      <h2>Profile</h2>
      <Alert>{form.formError}</Alert>
      <Field label="Email" name="account-email" hint="Contact us to change the email on your account.">
        <Input name="account-email" type="email" value={user.email} disabled readOnly />
      </Field>
      <Field label="Full name" name="name" error={errors.name}>
        <Input {...bind("name")} type="text" autoComplete="name" maxLength={100} />
      </Field>
      <div className="field-row">
        <Field label="Phone" name="phone" error={errors.phone}>
          <Input {...bind("phone")} type="tel" autoComplete="tel" />
        </Field>
        <Field label="City" name="city" error={errors.city}>
          <Input {...bind("city")} type="text" autoComplete="address-level2" maxLength={80} />
        </Field>
      </div>
      <SubmitButton loading={form.loading} loadingText="Saving…">
        Save profile
      </SubmitButton>
    </form>
  );
};

const PasswordForm = () => {
  const { applySession } = useAuth();
  const toast = useToast();
  const form = useForm({ currentPassword: "", newPassword: "" }, passwordRules, async (v) => {
    applySession((await api.post("/api/me/password", v)).data);
    toast.success("Password changed. Other devices have been signed out.");
    return true;
  });
  const { values, errors, onChange, onBlur } = form;
  const bind = (name) => ({ name, value: values[name], onChange, onBlur, error: errors[name] });

  // Clear the fields after a successful change.
  const { result, reset } = form;
  useEffect(() => {
    if (result) reset();
  }, [result, reset]);

  return (
    <form className="panel account-panel" onSubmit={form.submit} noValidate>
      <h2>Password</h2>
      <Alert>{form.formError}</Alert>
      <Field label="Current password" name="currentPassword" error={errors.currentPassword}>
        <Input {...bind("currentPassword")} type="password" autoComplete="current-password" />
      </Field>
      <Field label="New password" name="newPassword" error={errors.newPassword} hint="At least 8 characters.">
        <Input {...bind("newPassword")} type="password" autoComplete="new-password" maxLength={128} />
      </Field>
      <SubmitButton loading={form.loading} loadingText="Updating…">
        Change password
      </SubmitButton>
    </form>
  );
};

const KINDS = {
  donations: {
    label: "My donations",
    empty: "You haven't donated while signed in yet.",
    cta: { to: "/donate-food", label: "Donate food" },
    describe: (d) => `${d.quantity} kg ${foodMeta(d.foodType).label.toLowerCase()}${d.city ? ` · ${d.city}` : ""}`,
    extra: (d) => (d.claimed ? "Reserved by someone nearby" : ""),
    cancellable: (d) => d.status === "pending" && !d.claimed,
  },
  requests: {
    label: "My food requests",
    empty: "You haven't requested food while signed in yet.",
    cta: { to: "/request-food", label: "Request food" },
    describe: (r) => `${String(r.urgency).replace(/_/g, " ")}${r.householdSize ? ` · household of ${r.householdSize}` : ""}`,
    extra: (r) => (r.fromListing ? "Reserved from a listing" : ""),
    cancellable: (r) => r.status === "pending",
  },
};

const Submissions = ({ kind }) => {
  const cfg = KINDS[kind];
  const toast = useToast();
  const [state, setState] = useState({ items: [], loading: true, error: "" });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const { data } = await api.get(`/api/me/${kind}`, { params: { limit: 50 } });
      setState({ items: data.items, loading: false, error: "" });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: parseError(e).message }));
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (item) => {
    if (!window.confirm("Cancel this submission? This cannot be undone.")) return;
    try {
      await api.delete(`/api/me/${kind}/${item._id}`);
      toast.success("Cancelled");
      load();
    } catch (e) {
      toast.error(parseError(e).message);
      load(); // its status may have changed in the meantime
    }
  };

  return (
    <section className="panel account-panel">
      <div className="account-panel-head">
        <h2>{cfg.label}</h2>
        <Link to={cfg.cta.to} className="btn btn-ghost btn-sm">
          {cfg.cta.label}
        </Link>
      </div>
      <Alert>{state.error}</Alert>
      {state.loading && !state.items.length ? (
        <p className="muted">Loading…</p>
      ) : !state.items.length ? (
        <p className="muted">{cfg.empty}</p>
      ) : (
        <ul className="submission-list">
          {state.items.map((item) => (
            <li key={item._id} className="submission">
              <div className="submission-main">
                <strong className="tracking-code">{item.trackingId}</strong>
                <span className="cap">{cfg.describe(item)}</span>
                <small className="muted">
                  Submitted {fmtDate(item.createdAt)}
                  {cfg.extra(item) ? ` · ${cfg.extra(item)}` : ""}
                </small>
                {item.adminNote && (
                  <small className="submission-note">
                    <i className="fa-solid fa-comment" aria-hidden="true" /> {item.adminNote}
                  </small>
                )}
              </div>
              <div className="submission-side">
                <span className={`badge badge-${item.status}`}>{item.status}</span>
                {cfg.cancellable(item) && (
                  <button type="button" className="link-btn" onClick={() => cancel(item)}>
                    Cancel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const Account = () => {
  const { user, can } = useAuth();

  return (
    <main className="dashboard">
      <div className="dashboard-inner">
        <div className="dash-head">
          <div>
            <p className="eyebrow">My account</p>
            <h1>Hi, {user.name.split(" ")[0]}</h1>
          </div>
          {can("dashboard:read") && (
            <Link to="/dashboard" className="btn btn-ghost btn-sm">
              <i className="fa-solid fa-gauge" aria-hidden="true" /> Admin dashboard
            </Link>
          )}
        </div>
        {can("submissions:own:read") && (
          <div className="account-grid">
            <Submissions kind="donations" />
            <Submissions kind="requests" />
          </div>
        )}
        {can("profile:update") && (
          <div className="account-grid">
            <ProfileForm user={user} />
            <PasswordForm />
          </div>
        )}
      </div>
    </main>
  );
};

export default Account;
