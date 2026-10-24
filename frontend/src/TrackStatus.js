import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { parseError } from "./api";
import { email as emailRule, required } from "./components/validators";
import { Alert, Field, Input, PageHeader, SubmitButton } from "./components/Form";

const FLOW = [
  { key: "pending", label: "Received", icon: "fa-inbox" },
  { key: "approved", label: "Approved", icon: "fa-thumbs-up" },
  { key: "completed", label: "Completed", icon: "fa-circle-check" },
];

const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const Result = ({ data }) => {
  const rejected = data.status === "rejected";
  const current = FLOW.findIndex((s) => s.key === data.status);
  const isDonation = data.type === "donation";

  return (
    <div className="track-result" aria-live="polite">
      <div className="track-head">
        <div>
          <span className="tracking-label">{isDonation ? "Food donation" : "Food request"}</span>
          <strong className="tracking-code">{data.trackingId}</strong>
        </div>
        <span className={`badge badge-${data.status}`}>{data.status}</span>
      </div>

      {rejected ? (
        <Alert>This {isDonation ? "donation" : "request"} could not be accepted.</Alert>
      ) : (
        <ol className="timeline">
          {FLOW.map((s, i) => (
            <li key={s.key} className={i < current ? "done" : i === current ? "current" : ""}>
              <span className="timeline-dot" aria-hidden="true">
                <i className={`fa-solid ${i <= current ? s.icon : "fa-circle"}`} />
              </span>
              <span>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      <dl className="detail-list">
        <div>
          <dt>Submitted</dt>
          <dd>{formatDate(data.submittedAt)}</dd>
        </div>
        <div>
          <dt>Last update</dt>
          <dd>{formatDate(data.updatedAt)}</dd>
        </div>
        {isDonation ? (
          <>
            <div>
              <dt>Food type</dt>
              <dd className="cap">{data.summary.foodType}</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{data.summary.quantity} kg</dd>
            </div>
          </>
        ) : (
          <div>
            <dt>Urgency</dt>
            <dd className="cap">{String(data.summary.urgency).replace(/_/g, " ")}</dd>
          </div>
        )}
      </dl>

      {isDonation && data.summary.claimed && data.status !== "completed" && (
        <div className="alert alert-success" role="status">
          <i className="fa-solid fa-heart" aria-hidden="true" />
          <div>Good news: someone nearby has reserved your donation. Our team will coordinate the pickup.</div>
        </div>
      )}
      {!isDonation && data.summary.fromListing && data.status === "pending" && (
        <div className="alert alert-success" role="status">
          <i className="fa-solid fa-basket-shopping" aria-hidden="true" />
          <div>This food has been reserved for you. Our team will confirm pickup or delivery.</div>
        </div>
      )}

      {data.adminNote && (
        <div className="admin-note">
          <strong>Message from our team</strong>
          <p>{data.adminNote}</p>
        </div>
      )}
    </div>
  );
};

const TrackStatus = () => {
  const [params] = useSearchParams();
  const [values, setValues] = useState({
    trackingId: params.get("code") || "",
    email: params.get("email") || "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const autoRan = useRef(false);

  const lookup = async (v) => {
    const found = {};
    const codeMsg = required("Tracking code")(v.trackingId);
    if (codeMsg) found.trackingId = codeMsg;
    const emailMsg = emailRule(v.email);
    if (emailMsg) found.email = emailMsg;
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    setFormError("");
    setData(null);
    try {
      const res = await api.post("/api/track", { trackingId: v.trackingId.trim(), email: v.email.trim() });
      setData(res.data);
    } catch (error) {
      setFormError(parseError(error).message);
    } finally {
      setLoading(false);
    }
  };

  // Arriving from the success panel (?code=…&email=…) runs the lookup immediately.
  useEffect(() => {
    if (!autoRan.current && values.trackingId && values.email) {
      autoRan.current = true;
      lookup(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: "" }));
  };

  return (
    <main>
      <PageHeader
        eyebrow="Track"
        title="Check your status"
        subtitle="Enter the tracking code you received after submitting, along with the email you used."
      />
      <section className="section narrow">
        <div className="form-card flat">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(values);
            }}
            noValidate
          >
            <Alert>{formError}</Alert>
            <Field label="Tracking code" name="trackingId" error={errors.trackingId} hint="e.g. DON-ABCD2345 or REQ-ABCD2345">
              <Input name="trackingId" value={values.trackingId} onChange={onChange} error={errors.trackingId} type="text" autoCapitalize="characters" autoComplete="off" />
            </Field>
            <Field label="Email used when submitting" name="email" error={errors.email}>
              <Input name="email" value={values.email} onChange={onChange} error={errors.email} type="email" autoComplete="email" />
            </Field>
            <SubmitButton loading={loading} loadingText="Looking up…">
              Check status
            </SubmitButton>
          </form>
          {data && <Result data={data} />}
        </div>
      </section>
    </main>
  );
};

export default TrackStatus;
