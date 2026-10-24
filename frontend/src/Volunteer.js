import React from "react";
import api from "./api";
import useForm from "./components/useForm";
import { email, maxLen, minItems, phone, required } from "./components/validators";
import { Alert, Field, Input, OptionCards, PageHeader, SubmitButton, Textarea } from "./components/Form";
import { AVAILABILITY, VOLUNTEER_INTERESTS } from "./components/foodMeta";
import volunteerIcon from "./images/volunteerIcon.png";

const initial = { name: "", email: "", phone: "", city: "", availability: "", interests: [], hasVehicle: false, message: "" };

const rules = {
  name: [required("Name"), maxLen("Name", 100)],
  email,
  phone,
  city: [required("City"), maxLen("City", 80)],
  availability: required("Availability"),
  interests: minItems("way to help", 1),
  message: maxLen("Message", 500),
};

const perks = [
  { icon: "fa-clock", title: "Give what time you can", text: "A couple of hours a month makes a real difference." },
  { icon: "fa-people-group", title: "Join a friendly team", text: "Work alongside neighbours who care about food waste." },
  { icon: "fa-seedling", title: "See your impact", text: "Every pickup keeps good food out of landfill." },
];

const Volunteer = () => {
  const form = useForm(initial, rules, async (v) => (await api.post("/api/volunteers", v)).data);
  const { values, errors, onChange, onBlur } = form;
  const bind = (name) => ({ name, value: values[name], onChange, onBlur, error: errors[name] });

  return (
    <main>
      <PageHeader
        eyebrow="Get Involved"
        title="Volunteer with NourishNet"
        subtitle="Help rescue surplus food and get it to people who need it, on your schedule."
      />

      <section className="section">
        <div className="volunteer-layout">
          <aside className="volunteer-aside">
            <img src={volunteerIcon} alt="" className="volunteer-icon" />
            <h2>Why volunteer?</h2>
            <ul className="perk-list">
              {perks.map((p) => (
                <li key={p.title}>
                  <span className="perk-icon" aria-hidden="true">
                    <i className={`fa-solid ${p.icon}`} />
                  </span>
                  <div>
                    <strong>{p.title}</strong>
                    <p>{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <div className="form-card flat">
            {form.result ? (
              <div className="success-panel" role="status">
                <div className="success-icon" aria-hidden="true">
                  <i className="fa-solid fa-heart" />
                </div>
                <h2>Welcome aboard!</h2>
                <p>{form.result.message}</p>
                <button type="button" className="btn btn-ghost" onClick={form.reset}>
                  Sign up someone else
                </button>
              </div>
            ) : (
              <form onSubmit={form.submit} noValidate>
                <h2>Sign up</h2>
                <Alert>{form.formError}</Alert>
                <Field label="Full name" name="name" error={errors.name}>
                  <Input {...bind("name")} type="text" autoComplete="name" maxLength={100} />
                </Field>
                <div className="field-row">
                  <Field label="Email" name="email" error={errors.email}>
                    <Input {...bind("email")} type="email" autoComplete="email" />
                  </Field>
                  <Field label="Phone" name="phone" error={errors.phone}>
                    <Input {...bind("phone")} type="tel" autoComplete="tel" />
                  </Field>
                </div>
                <Field label="City / area" name="city" error={errors.city}>
                  <Input {...bind("city")} type="text" autoComplete="address-level2" maxLength={80} />
                </Field>
                <OptionCards name="interests" label="How would you like to help?" options={VOLUNTEER_INTERESTS} value={values.interests} onChange={onChange} error={errors.interests} multiple />
                <OptionCards name="availability" label="When are you available?" options={AVAILABILITY} value={values.availability} onChange={onChange} error={errors.availability} columns={3} />
                <label className="toggle">
                  <input type="checkbox" checked={values.hasVehicle} onChange={(e) => onChange({ target: { name: "hasVehicle", value: e.target.checked } })} />
                  <span className="toggle-track" aria-hidden="true" />
                  <span>I have a vehicle I can use for pickups</span>
                </label>
                <Field label="Anything else? (optional)" name="message" error={errors.message}>
                  <Textarea {...bind("message")} rows={3} maxLength={500} />
                </Field>
                <SubmitButton loading={form.loading} loadingText="Signing up…">
                  Join as a volunteer
                </SubmitButton>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Volunteer;
