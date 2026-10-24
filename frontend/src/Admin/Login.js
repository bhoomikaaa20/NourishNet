import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { parseError } from "../api";
import { useAuth } from "../components/AuthContext";
import { Alert, Field, Input, SubmitButton } from "../components/Form";

const Login = () => {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const destination = location.state?.from || "/dashboard";
  if (isLoggedIn) return <Navigate to={destination} replace />;

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.email.trim() || !values.password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(values.email.trim(), values.password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(parseError(err).message);
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="form-card">
        <p className="eyebrow">Admin</p>
        <h1>Sign in</h1>
        <p className="muted">Manage requests, donations and messages.</p>
        <form onSubmit={handleSubmit} noValidate>
          <Alert>{error}</Alert>
          <Field label="Email" name="email">
            <Input name="email" type="email" value={values.email} onChange={onChange} autoComplete="username" autoFocus />
          </Field>
          <Field label="Password" name="password">
            <Input name="password" type="password" value={values.password} onChange={onChange} autoComplete="current-password" />
          </Field>
          <SubmitButton loading={loading} loadingText="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      </div>
    </main>
  );
};

export default Login;
