import { useCallback, useState } from "react";
import { parseError } from "../api";
import { validateAll } from "./validators";

// Shared form state: client validation, server (field-level) errors, loading and result.
// `send(values)` performs the request and resolves with the response data.
export default function useForm(initial, rules, send) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => (errs[name] ? { ...errs, [name]: "" } : errs));
  }, []);

  const onBlur = useCallback(
    (e) => {
      const { name } = e.target;
      if (!rules[name]) return;
      const msg = validateAll({ [name]: e.target.value }, { [name]: rules[name] })[name] || "";
      setErrors((errs) => ({ ...errs, [name]: msg }));
    },
    [rules]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setFormError("");
    const found = validateAll(values, rules);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(first)?.focus();
      return;
    }

    setLoading(true);
    try {
      setResult(await send(values));
    } catch (error) {
      const parsed = parseError(error);
      setErrors(parsed.errors);
      setFormError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  // Validates only `names` (one wizard step); focuses the first invalid field.
  const validateFields = (names) => {
    const subset = Object.fromEntries(names.filter((n) => rules[n]).map((n) => [n, rules[n]]));
    const found = validateAll(values, subset);
    setErrors((errs) => ({ ...errs, ...Object.fromEntries(names.map((n) => [n, found[n] || ""])) }));
    const first = names.find((n) => found[n]);
    if (first) document.getElementById(first)?.focus();
    return !first;
  };

  const reset = () => {
    setValues(initial);
    setErrors({});
    setFormError("");
    setResult(null);
  };

  return { values, errors, formError, loading, result, onChange, onBlur, submit, reset, validateFields };
}
