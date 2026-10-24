import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { parseError } from "../api";
import { homeFor, useAuth } from "../components/AuthContext";
import { Alert, Field, Input, SubmitButton } from "../components/Form";

// One sign-in for every role; where you land depends on what your account may do.
const Login = () => {
  const { login, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from;
  if (isLoggedIn) return <Navigate to={from || homeFor(user)} replace />;

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
      const signedIn = await login(values.email.trim(), values.password);
      navigate(from || homeFor(signedIn), { replace: true });
    } catch (err) {
      setError(parseError(err).message);
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="form-card">
        <p className="eyebrow">Account</p>
        <h1>Sign in</h1>
        <p className="muted">Follow your donations and requests, or manage NourishNet if you're on the team.</p>
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
        <p className="muted auth-switch">
          New here? <Link to="/register" state={location.state}>Create an account</Link>. You can still donate or request food without one.
        </p>
      </div>
    </main>
  );
};

export default Login;
