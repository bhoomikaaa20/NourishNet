import React from "react";
import api from "./api";
import backgroundImage from "./images/background.webp";
import useForm from "./components/useForm";
import { email, maxLen, numberRange, phone, required } from "./components/validators";
import { Link } from "react-router-dom";
import { Alert, Field, Input, OptionCards, SubmitButton, SuccessPanel, Textarea } from "./components/Form";

const URGENCY = [
  { value: "immediate", label: "Immediately", icon: "fa-bolt", hint: "Within 1–2 days" },
  { value: "within_a_week", label: "This week", icon: "fa-calendar-week", hint: "Within 7 days" },
];

const initial = {
  name: "",
  contactNumber: "",
  email: "",
  address: "",
  city: "",
  urgency: "",
  householdSize: "",
  notes: "",
};

const rules = {
  name: [required("Name"), maxLen("Name", 100)],
  contactNumber: phone,
  email,
  address: [required("Address"), maxLen("Address", 300)],
  city: maxLen("City", 80),
  urgency: required("Urgency"),
  householdSize: numberRange("Household size", 1, 100, { optional: true, integer: true }),
  notes: maxLen("Notes", 500),
};

const Requestform = () => {
  const form = useForm(initial, rules, async (v) => {
    const { data } = await api.post("/api/request-food", v);
    return { ...data, email: v.email };
  });
  const { values, errors, onChange, onBlur } = form;
  const bind = (name) => ({ name, value: values[name], onChange, onBlur, error: errors[name] });

  return (
    <main className="form-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="form-card">
        {form.result ? (
          <SuccessPanel
            title="Request received"
            message="Thank you. Our team will review your request and get in touch using the details you gave us."
            trackingId={form.result.trackingId}
            email={form.result.email}
            onReset={form.reset}
            resetLabel="Submit another request"
          />
        ) : (
          <form onSubmit={form.submit} noValidate>
            <p className="eyebrow">Get Food</p>
            <h1>Request food assistance</h1>
            <p className="muted">Tell us how to reach you and where to deliver. We'll follow up as soon as we can.</p>
            <Link to="/find-food" className="callout">
              <i className="fa-solid fa-basket-shopping" aria-hidden="true" />
              <span>
                <strong>Food may already be available near you.</strong> Browse and reserve listings now
              </span>
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Link>

            <Alert>{form.formError}</Alert>

            <Field label="Full name" name="name" error={errors.name}>
              <Input {...bind("name")} type="text" autoComplete="name" maxLength={100} />
            </Field>

            <div className="field-row">
              <Field label="Contact number" name="contactNumber" error={errors.contactNumber}>
                <Input {...bind("contactNumber")} type="tel" autoComplete="tel" />
              </Field>
              <Field label="Email address" name="email" error={errors.email}>
                <Input {...bind("email")} type="email" autoComplete="email" />
              </Field>
            </div>

            <Field label="Delivery address" name="address" error={errors.address}>
              <Input {...bind("address")} type="text" autoComplete="street-address" maxLength={300} />
            </Field>

            <div className="field-row">
              <Field label="City / area (optional)" name="city" error={errors.city}>
                <Input {...bind("city")} type="text" autoComplete="address-level2" maxLength={80} />
              </Field>
              <Field label="People in household (optional)" name="householdSize" error={errors.householdSize}>
                <Input {...bind("householdSize")} type="number" min="1" max="100" inputMode="numeric" />
              </Field>
            </div>

            <OptionCards name="urgency" label="How soon do you need food?" options={URGENCY} value={values.urgency} onChange={onChange} error={errors.urgency} columns={2} />

            <Field label="Anything we should know? (optional)" name="notes" error={errors.notes} hint={`${values.notes.length}/500`}>
              <Textarea {...bind("notes")} rows={3} maxLength={500} />
            </Field>

            <SubmitButton loading={form.loading}>Submit request</SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
};

export default Requestform;
