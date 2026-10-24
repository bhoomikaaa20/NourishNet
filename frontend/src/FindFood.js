import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { parseError } from "./api";
import useForm from "./components/useForm";
import Modal from "./components/Modal";
import ListingCard from "./components/ListingCard";
import { email, maxLen, numberRange, phone, required } from "./components/validators";
import { Alert, Field, Input, PageHeader, SubmitButton, SuccessPanel, Textarea } from "./components/Form";
import { DIET_TYPES, FOOD_TYPES, foodMeta } from "./components/foodMeta";

const claimInitial = { name: "", contactNumber: "", email: "", address: "", city: "", householdSize: "", notes: "" };
const claimRules = {
  name: [required("Name"), maxLen("Name", 100)],
  contactNumber: phone,
  email,
  address: [required("Delivery address"), maxLen("Delivery address", 300)],
  city: maxLen("City", 80),
  householdSize: numberRange("Household size", 1, 100, { optional: true, integer: true }),
  notes: maxLen("Notes", 500),
};

const ClaimForm = ({ listing, onClaimed }) => {
  const form = useForm({ ...claimInitial, city: listing.city || "" }, claimRules, async (v) => {
    const { data } = await api.post(`/api/listings/${listing.id}/claim`, v);
    onClaimed(listing.id);
    return { ...data, email: v.email };
  });
  const { values, errors, onChange, onBlur } = form;
  const bind = (name) => ({ name, value: values[name], onChange, onBlur, error: errors[name] });
  const food = foodMeta(listing.foodType);

  if (form.result) {
    return (
      <SuccessPanel
        title="Food reserved for you"
        message={form.result.message}
        trackingId={form.result.trackingId}
        email={form.result.email}
        onReset={() => onClaimed(null, true)}
        resetLabel="Back to listings"
      />
    );
  }

  return (
    <form onSubmit={form.submit} noValidate>
      <div className="claim-summary">
        <i className={`fa-solid ${food.icon}`} aria-hidden="true" />
        <div>
          <strong>
            {listing.quantity} kg · {food.label}
          </strong>
          <span className="muted">{listing.city}</span>
        </div>
      </div>
      <Alert>{form.formError}</Alert>
      <Field label="Full name" name="name" error={errors.name}>
        <Input {...bind("name")} type="text" autoComplete="name" maxLength={100} />
      </Field>
      <div className="field-row">
        <Field label="Contact number" name="contactNumber" error={errors.contactNumber}>
          <Input {...bind("contactNumber")} type="tel" autoComplete="tel" />
        </Field>
        <Field label="Email" name="email" error={errors.email}>
          <Input {...bind("email")} type="email" autoComplete="email" />
        </Field>
      </div>
      <Field label="Delivery address" name="address" error={errors.address}>
        <Input {...bind("address")} type="text" autoComplete="street-address" maxLength={300} />
      </Field>
      <div className="field-row">
        <Field label="City / area" name="city" error={errors.city}>
          <Input {...bind("city")} type="text" maxLength={80} />
        </Field>
        <Field label="People in household (optional)" name="householdSize" error={errors.householdSize}>
          <Input {...bind("householdSize")} type="number" min="1" max="100" inputMode="numeric" />
        </Field>
      </div>
      <Field label="Anything we should know? (optional)" name="notes" error={errors.notes}>
        <Textarea {...bind("notes")} rows={2} maxLength={500} />
      </Field>
      <SubmitButton loading={form.loading} loadingText="Reserving…">
        Reserve this food
      </SubmitButton>
    </form>
  );
};

const FindFood = () => {
  const [filters, setFilters] = useState({ city: "", foodType: "", dietType: "" });
  const [cityQuery, setCityQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setCityQuery(filters.city.trim()), 350);
    return () => clearTimeout(t);
  }, [filters.city]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/listings", {
        params: { city: cityQuery || undefined, foodType: filters.foodType || undefined, dietType: filters.dietType || undefined },
      });
      if (id === requestId.current) setItems(data.items);
    } catch (e) {
      if (id === requestId.current) setError(parseError(e).message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [cityQuery, filters.foodType, filters.dietType]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: f[key] === value ? "" : value }));
  const hasFilters = filters.city || filters.foodType || filters.dietType;

  // Remove a claimed listing immediately; close the modal when the user is done.
  const onClaimed = (listingId, close) => {
    if (listingId) setItems((list) => list.filter((l) => l.id !== listingId));
    if (close) {
      setClaiming(null);
      load();
    }
  };

  return (
    <main>
      <PageHeader
        eyebrow="Get Food"
        title="Find food near you"
        subtitle="Fresh surplus food shared by neighbours, restaurants and stores, checked by our team. Reserve what you need. It's free."
      />

      <section className="section">
        <div className="filter-bar">
          <div className="search">
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            <input
              type="search"
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              placeholder="Search by city or area"
              aria-label="Search by city or area"
            />
          </div>
          <div className="chip-row" role="group" aria-label="Food type">
            {FOOD_TYPES.map((t) => (
              <button key={t.value} type="button" className={`chip${filters.foodType === t.value ? " active" : ""}`} aria-pressed={filters.foodType === t.value} onClick={() => setFilter("foodType", t.value)}>
                <i className={`fa-solid ${t.icon}`} aria-hidden="true" /> {t.label}
              </button>
            ))}
          </div>
          <div className="chip-row" role="group" aria-label="Diet">
            {DIET_TYPES.map((t) => (
              <button key={t.value} type="button" className={`chip${filters.dietType === t.value ? " active" : ""}`} aria-pressed={filters.dietType === t.value} onClick={() => setFilter("dietType", t.value)}>
                <i className={`fa-solid ${t.icon}`} aria-hidden="true" /> {t.label}
              </button>
            ))}
            {hasFilters && (
              <button type="button" className="chip chip-clear" onClick={() => setFilters({ city: "", foodType: "", dietType: "" })}>
                <i className="fa-solid fa-xmark" aria-hidden="true" /> Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            <div>
              {error}{" "}
              <button type="button" className="link-btn" onClick={load}>
                Retry
              </button>
            </div>
          </div>
        )}

        <p className="results-count" aria-live="polite">
          {loading ? "Loading available food…" : `${items.length} ${items.length === 1 ? "listing" : "listings"} available`}
        </p>

        {loading && items.length === 0 ? (
          <div className="listing-grid" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="listing-card skeleton" />
            ))}
          </div>
        ) : items.length === 0 && !error ? (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">
              <i className="fa-solid fa-basket-shopping" />
            </span>
            <h2>{hasFilters ? "No matches right now" : "No food listed right now"}</h2>
            <p className="muted">New donations are added as soon as our team approves them. You can also tell us what you need and we'll reach out.</p>
            <Link to="/request-food" className="btn btn-primary">
              Request food assistance
            </Link>
          </div>
        ) : (
          <div className="listing-grid">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} onClaim={setClaiming} />
            ))}
          </div>
        )}

        <div className="info-band">
          <i className="fa-solid fa-circle-question" aria-hidden="true" />
          <p>
            Can't find what you need? <Link to="/request-food">Send us a request</Link> and our team will try to match you with a donor.
          </p>
        </div>
      </section>

      {claiming && (
        <Modal
          title="Reserve this food"
          onClose={() => {
            setClaiming(null);
            load();
          }}
        >
          <ClaimForm listing={claiming} onClaimed={onClaimed} />
        </Modal>
      )}
    </main>
  );
};

export default FindFood;
