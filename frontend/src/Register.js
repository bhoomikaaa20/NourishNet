import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import useForm from "./components/useForm";
import { homeFor, useAuth } from "./components/AuthContext";
import { email, maxLen, phone, required } from "./components/validators";
import { Alert, Field, Input, SubmitButton } from "./components/Form";

const initial = { name: "", email: "", password: "", phone: "", city: "" };

export const passwordRule = (label = "Password") => (v) => {
  const s = String(v ?? "");
  if (s.length < 8) return `${label} must be at least 8 characters`;
  return s.length > 128 ? `${label} must be at most 128 characters` : "";
};
export const optionalPhone = (v) => (String(v ?? "").trim() ? phone(v) : "");

const rules = {
  name: [required("Name"), maxLen("Name", 100)],
  email,
  password: passwordRule(),
  phone: optionalPhone,
  city: maxLen("City", 80),
};

// Self-service sign-up always creates a regular user account; admins are appointed
// by an existing admin.
const Register = () => {
  const { register, isLoggedIn, user } = useAuth();
  const location = useLocation();
  const form = useForm(initial, rules, (v) => register({ ...v, email: v.email.trim() }));
  const { values, errors, onChange, onBlur } = form;
  const bind = (name) => ({ name, value: values[name], onChange, onBlur, error: errors[name] });

  if (isLoggedIn) return <Navigate to={location.state?.from || homeFor(user)} replace />;

  return (
    <main className="auth-page">
      <div className="form-card">
        <p className="eyebrow">Account</p>
        <h1>Create an account</h1>
        <p className="muted">Keep all your donations and requests in one place and follow their status.</p>
        <form onSubmit={form.submit} noValidate>
          <Alert>{form.formError}</Alert>
          <Field label="Full name" name="name" error={errors.name}>
            <Input {...bind("name")} type="text" autoComplete="name" maxLength={100} autoFocus />
          </Field>
          <Field label="Email" name="email" error={errors.email}>
            <Input {...bind("email")} type="email" autoComplete="email" />
          </Field>
          <Field label="Password" name="password" error={errors.password} hint="At least 8 characters.">
            <Input {...bind("password")} type="password" autoComplete="new-password" maxLength={128} />
          </Field>
          <div className="field-row">
            <Field label="Phone (optional)" name="phone" error={errors.phone}>
              <Input {...bind("phone")} type="tel" autoComplete="tel" />
            </Field>
            <Field label="City (optional)" name="city" error={errors.city}>
              <Input {...bind("city")} type="text" autoComplete="address-level2" maxLength={80} />
            </Field>
          </div>
          <SubmitButton loading={form.loading} loadingText="Creating account…">
            Create account
          </SubmitButton>
        </form>
        <p className="muted auth-switch">
          Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
