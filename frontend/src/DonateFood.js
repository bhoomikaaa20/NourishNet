import React, { useEffect, useState } from "react";
import api from "./api";
import backgroundImage from "./images/background.webp";
import useForm from "./components/useForm";
import { dateWithin, email, maxLen, numberRange, phone, required } from "./components/validators";
import { Alert, Field, Input, OptionCards, SubmitButton, SuccessPanel, Textarea } from "./components/Form";
import { DIET_TYPES, FOOD_TYPES, dietMeta, foodMeta, isoDay } from "./components/foodMeta";

const initial = {
  foodType: "",
  dietType: "",
  quantity: "",
  availableUntil: isoDay(2),
  address: "",
  city: "",
  notes: "",
  name: "",
  contactNumber: "",
  email: "",
};

const rules = {
  foodType: required("Food type"),
  dietType: required("Diet type"),
  quantity: [required("Quantity"), numberRange("Quantity", 1, 100000)],
  availableUntil: dateWithin("Available until", 30),
  address: [required("Pickup address"), maxLen("Pickup address", 300)],
  city: [required("City"), maxLen("City", 80)],
  notes: maxLen("Notes", 500),
  name: [required("Name"), maxLen("Name", 100)],
  contactNumber: phone,
  email,
};

const STEPS = [
  { title: "Food", icon: "fa-basket-shopping", fields: ["foodType", "dietType", "quantity", "availableUntil"] },
  { title: "Pickup", icon: "fa-location-dot", fields: ["address", "city", "notes"] },
  { title: "Your details", icon: "fa-user", fields: ["name", "contactNumber", "email"] },
  { title: "Review", icon: "fa-clipboard-check", fields: [] },
];

const Stepper = ({ step }) => (
  <ol className="stepper" aria-label="Progress">
    {STEPS.map((s, i) => (
      <li key={s.title} className={i < step ? "done" : i === step ? "current" : ""} aria-current={i === step ? "step" : undefined}>
        <span className="stepper-dot" aria-hidden="true">
          <i className={`fa-solid ${i < step ? "fa-check" : s.icon}`} />
        </span>
        <span className="stepper-label">{s.title}</span>
      </li>
    ))}
  </ol>
);

const ReviewRow = ({ label, children, onEdit }) => (
  <div className="review-row">
    <dt>{label}</dt>
    <dd>{children}</dd>
    {onEdit && (
      <button type="button" className="link-btn" onClick={onEdit}>
        Edit
      </button>
    )}
  </div>
);

const DonateFood = () => {
  const [step, setStep] = useState(0);
  const form = useForm(initial, rules, async (v) => {
    const { data } = await api.post("/api/donate-food", {
      ...v,
      // End of the chosen day in the donor's own timezone.
      availableUntil: new Date(`${v.availableUntil}T23:59:59`).toISOString(),
    });
    return { ...data, email: v.email };
  });
  const { values, errors, onChange, onBlur } = form;
  const bind = (name) => ({ name, value: values[name], onChange, onBlur, error: errors[name] });

  // If the server rejects a field from an earlier step, take the user back to it.
  useEffect(() => {
    const bad = STEPS.findIndex((s) => s.fields.some((f) => errors[f]));
    if (bad !== -1 && step === STEPS.length - 1) setStep(bad);
  }, [errors, step]);

  const next = () => {
    if (form.validateFields(STEPS[step].fields)) setStep(step + 1);
  };
  const back = () => setStep(step - 1);

  const food = foodMeta(values.foodType);
  const diet = dietMeta(values.dietType);
  const last = step === STEPS.length - 1;

  return (
    <main className="form-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="form-card wide">
        {form.result ? (
          <SuccessPanel
            title="Thank you for donating"
            message="Your donation has been recorded. Once our team approves it, it will be listed for people nearby and we'll contact you to arrange pickup."
            trackingId={form.result.trackingId}
            email={form.result.email}
            onReset={() => {
              form.reset();
              setStep(0);
            }}
            resetLabel="Donate more"
          />
        ) : (
          <form
            onSubmit={(e) => {
              if (!last) {
                e.preventDefault();
                next();
              } else form.submit(e);
            }}
            noValidate
          >
            <p className="eyebrow">Give Food</p>
            <h1>Donate surplus food</h1>
            <p className="muted">It takes about a minute. Your contact details are never shown publicly.</p>
            <Stepper step={step} />

            <Alert>{form.formError}</Alert>

            {step === 0 && (
              <div className="step-panel">
                <OptionCards name="foodType" label="What are you donating?" options={FOOD_TYPES} value={values.foodType} onChange={onChange} error={errors.foodType} />
                <OptionCards name="dietType" label="Diet type" options={DIET_TYPES} value={values.dietType} onChange={onChange} error={errors.dietType} columns={3} />
                <div className="field-row">
                  <Field label="Approximate quantity (kg)" name="quantity" error={errors.quantity}>
                    <Input {...bind("quantity")} type="number" min="1" max="100000" step="any" inputMode="decimal" placeholder="e.g. 5" />
                  </Field>
                  <Field label="Good to eat until" name="availableUntil" error={errors.availableUntil} hint="After this date the listing is hidden.">
                    <Input {...bind("availableUntil")} type="date" min={isoDay(0)} max={isoDay(30)} />
                  </Field>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="step-panel">
                <Field label="Pickup address" name="address" error={errors.address} hint="Only our team sees your full address.">
                  <Input {...bind("address")} type="text" autoComplete="street-address" maxLength={300} />
                </Field>
                <Field label="City / area" name="city" error={errors.city} hint="Shown on the public listing so people nearby can find it.">
                  <Input {...bind("city")} type="text" autoComplete="address-level2" maxLength={80} placeholder="e.g. Koramangala, Bangalore" />
                </Field>
                <Field label="Notes for our team (optional)" name="notes" error={errors.notes} hint={`${values.notes.length}/500. Best pickup time, packaging, allergens…`}>
                  <Textarea {...bind("notes")} rows={3} maxLength={500} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="step-panel">
                <Field label="Full name" name="name" error={errors.name}>
                  <Input {...bind("name")} type="text" autoComplete="name" maxLength={100} />
                </Field>
                <div className="field-row">
                  <Field label="Contact number" name="contactNumber" error={errors.contactNumber}>
                    <Input {...bind("contactNumber")} type="tel" autoComplete="tel" />
                  </Field>
                  <Field label="Email address" name="email" error={errors.email} hint="We'll use this for your tracking code.">
                    <Input {...bind("email")} type="email" autoComplete="email" />
                  </Field>
                </div>
              </div>
            )}

            {last && (
              <div className="step-panel">
                <div className="review-hero">
                  <span className="food-badge" aria-hidden="true">
                    <i className={`fa-solid ${food.icon}`} />
                  </span>
                  <div>
                    <strong>
                      {values.quantity} kg · {food.label}
                    </strong>
                    <span className="muted">
                      {diet?.label} · good until {new Date(`${values.availableUntil}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                <dl className="review-list">
                  <ReviewRow label="Pickup" onEdit={() => setStep(1)}>
                    {values.address}, {values.city}
                  </ReviewRow>
                  {values.notes && <ReviewRow label="Notes">{values.notes}</ReviewRow>}
                  <ReviewRow label="Contact" onEdit={() => setStep(2)}>
                    {values.name} · {values.contactNumber} · {values.email}
                  </ReviewRow>
                </dl>
                <p className="fine-print">
                  <i className="fa-solid fa-shield-heart" aria-hidden="true" /> By donating you confirm the food is safe to eat, stored hygienically and within its use-by date.
                </p>
              </div>
            )}

            <div className="wizard-actions">
              {step > 0 && (
                <button type="button" className="btn btn-ghost" onClick={back}>
                  <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
                </button>
              )}
              {last ? (
                <SubmitButton loading={form.loading}>
                  <i className="fa-solid fa-hand-holding-heart" aria-hidden="true" /> Confirm donation
                </SubmitButton>
              ) : (
                <button type="submit" className="btn btn-primary">
                  Continue <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default DonateFood;
