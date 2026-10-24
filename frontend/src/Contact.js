import React from "react";
import api from "./api";
import contactImage from "./images/contact.webp";
import useForm from "./components/useForm";
import { email, maxLen, phone, required } from "./components/validators";
import { Alert, Field, Input, PageHeader, SubmitButton, Textarea } from "./components/Form";

const initial = { firstName: "", lastName: "", email: "", phone: "", comments: "" };

const rules = {
  firstName: [required("First name"), maxLen("First name", 60)],
  lastName: [required("Last name"), maxLen("Last name", 60)],
  email,
  phone,
  comments: [required("Message"), maxLen("Message", 600)],
};

const ContactUs = () => {
  const form = useForm(initial, rules, async (v) => (await api.post("/contact", v)).data);
  const { values, errors, onChange, onBlur } = form;
  const bind = (name) => ({ name, value: values[name], onChange, onBlur, error: errors[name] });

  return (
    <main>
      <PageHeader
        eyebrow="Get in touch"
        title="Contact us"
        subtitle="Questions, feedback, or want to volunteer? Send us a note and we'll reply soon."
        image={contactImage}
      />
      <section className="section narrow">
        <div className="form-card flat">
          {form.result ? (
            <div className="success-panel" role="status">
              <div className="success-icon" aria-hidden="true">
                <i className="fa-solid fa-check" />
              </div>
              <h2>Message sent</h2>
              <p>Thanks for reaching out. We'll get back to you at the email you provided.</p>
              <button type="button" className="btn btn-ghost" onClick={form.reset}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={form.submit} noValidate>
              <Alert>{form.formError}</Alert>

              <div className="field-row">
                <Field label="First name" name="firstName" error={errors.firstName}>
                  <Input {...bind("firstName")} type="text" autoComplete="given-name" maxLength={60} />
                </Field>
                <Field label="Last name" name="lastName" error={errors.lastName}>
                  <Input {...bind("lastName")} type="text" autoComplete="family-name" maxLength={60} />
                </Field>
              </div>

              <div className="field-row">
                <Field label="Email" name="email" error={errors.email}>
                  <Input {...bind("email")} type="email" autoComplete="email" />
                </Field>
                <Field label="Phone" name="phone" error={errors.phone}>
                  <Input {...bind("phone")} type="tel" autoComplete="tel" />
                </Field>
              </div>

              <Field label="Questions or comments" name="comments" error={errors.comments} hint={`${values.comments.length} of 600 characters`}>
                <Textarea {...bind("comments")} rows={6} maxLength={600} />
              </Field>

              <SubmitButton loading={form.loading} loadingText="Sending…">
                Send message
              </SubmitButton>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default ContactUs;
