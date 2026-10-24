import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import ListingCard from "./components/ListingCard";
import backgroundVideo from "./images/background-video.mp4";
import posterImage from "./images/background.webp";
import giveFoodIcon from "./images/giveFoodIcon.png";
import getFoodIcon from "./images/getFoodIcon.png";
import giveMoneyIcon from "./images/giveMoneyIcon.png";
import volunteerIcon from "./images/volunteerIcon.png";
import collectionImage from "./images/foodcollecting.jpg";

const actions = [
  { to: "/donate-food", icon: giveFoodIcon, alt: "Give Food", title: "Give Food", text: "Help us by donating surplus food to those in need." },
  { to: "/find-food", icon: getFoodIcon, alt: "Get Food", title: "Get Food", text: "If you need food, find out how we can help you." },
  { to: "/donate-money", icon: giveMoneyIcon, alt: "Give Money", title: "Give Money", text: "Support our cause by making a financial donation." },
  { to: "/volunteer", icon: volunteerIcon, alt: "Volunteer", title: "Volunteer", text: "Join our team of volunteers and make a difference." },
];

const steps = [
  { icon: "fa-hand-holding-heart", title: "List surplus food", text: "Restaurants, stores and households tell us what they have and when it's good until." },
  { icon: "fa-clipboard-check", title: "We check & publish", text: "Our team reviews each donation for safety, then lists it for people nearby." },
  { icon: "fa-handshake-angle", title: "Neighbours reserve it", text: "People in need reserve a listing in a tap. We coordinate pickup or delivery." },
  { icon: "fa-bowl-food", title: "Food reaches plates", text: "Everyone gets a tracking code to follow progress until it's delivered." },
];

const faqs = [
  { q: "What kind of food can I donate?", a: "Unopened packaged food, fresh produce, bakery items and safely stored cooked food that is still within its use-by date. We review every donation before it's listed." },
  { q: "Is it free to request food?", a: "Yes. Reserving a listing or sending a request is completely free. We only ask for contact details so we can coordinate pickup or delivery." },
  { q: "Who can see my address and phone number?", a: "Only the NourishNet team. Public listings show just the food, quantity and general area, never names, phone numbers or street addresses." },
  { q: "How do I know what happened to my donation or request?", a: "After submitting you get a tracking code. Enter it with your email on the Track page to see its status and any message from our team." },
  { q: "Can I volunteer if I only have a few hours?", a: "Absolutely. Pick the days that suit you when you sign up. Pickups, sorting and deliveries all need short shifts." },
];

// Animates a number from 0 to `value` once; respects reduced-motion.
const useCountUp = (value, duration = 1200) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (value == null) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || value === 0) {
      setShown(value);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return shown;
};

const ImpactStat = ({ icon, value, label, suffix = "" }) => {
  const shown = useCountUp(value);
  return (
    <div className="impact-stat">
      <i className={`fa-solid ${icon}`} aria-hidden="true" />
      <strong>{value == null ? "–" : `${shown.toLocaleString()}${suffix}`}</strong>
      <span>{label}</span>
    </div>
  );
};

const FaqItem = ({ q, a }) => (
  <details className="faq-item">
    <summary>
      {q}
      <i className="fa-solid fa-plus" aria-hidden="true" />
    </summary>
    <p>{a}</p>
  </details>
);

const Home = () => {
  const [impact, setImpact] = useState(null);
  const [listings, setListings] = useState(null);

  useEffect(() => {
    api.get("/api/impact").then(({ data }) => setImpact(data)).catch(() => setImpact(false));
    api.get("/api/listings", { params: { limit: 3 } }).then(({ data }) => setListings(data.items)).catch(() => setListings([]));
  }, []);

  return (
    <main>
      <section className="hero" style={{ backgroundImage: `url(${posterImage})` }}>
        <video className="hero-video" autoPlay loop muted playsInline preload="metadata" poster={posterImage} aria-hidden="true">
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-pill">
            <span className="live-dot" aria-hidden="true" />
            {impact?.availableListings ? `${impact.availableListings} food ${impact.availableListings === 1 ? "listing" : "listings"} available now` : "Food rescue, made simple"}
          </p>
          <h1>NourishNet: Connecting Surplus Food from One to Many</h1>
          <p className="lede">Join us in our mission to reduce food waste and help those in need.</p>
          <div className="hero-actions">
            <Link to="/donate-food" className="btn btn-accent btn-lg">
              <i className="fa-solid fa-hand-holding-heart" aria-hidden="true" /> Donate food
            </Link>
            <Link to="/find-food" className="btn btn-light btn-lg">
              <i className="fa-solid fa-basket-shopping" aria-hidden="true" /> Find food
            </Link>
          </div>
        </div>
      </section>

      {impact !== false && (
        <section className="impact" aria-label="Our impact so far">
          <div className="impact-inner">
            <ImpactStat icon="fa-weight-scale" value={impact?.kgShared} suffix=" kg" label="Food shared" />
            <ImpactStat icon="fa-hand-holding-heart" value={impact?.donations} label="Donations received" />
            <ImpactStat icon="fa-house-chimney-user" value={impact?.requestsFulfilled} label="Requests fulfilled" />
            <ImpactStat icon="fa-people-group" value={impact?.volunteers} label="Volunteers" />
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">How you can help</p>
          <h2>Four ways to be part of it</h2>
        </div>
        <div className="card-grid">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="action-card">
              <img src={a.icon} alt={a.alt} className="action-icon" />
              <h3>{a.title}</h3>
              <p>{a.text}</p>
              <span className="card-link">
                Get started <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {listings && listings.length > 0 && (
        <section className="section tinted">
          <div className="section-head-row">
            <div>
              <p className="eyebrow">Available now</p>
              <h2>Fresh food waiting for a home</h2>
            </div>
            <Link to="/find-food" className="btn btn-ghost">
              See all listings <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="listing-grid">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <p className="eyebrow">How it works</p>
          <h2>From surplus to a shared meal</h2>
        </div>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="step-icon" aria-hidden="true">
                <i className={`fa-solid ${s.icon}`} />
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="center">
          <Link to="/track" className="btn btn-ghost">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" /> Track a request or donation
          </Link>
        </div>
      </section>

      <section className="section tinted">
        <div className="split faq-split">
          <div>
            <p className="eyebrow">Questions</p>
            <h2>Frequently asked</h2>
            <p className="muted">Can't find your answer? We're happy to help.</p>
            <Link to="/contact" className="btn btn-primary">
              Contact us
            </Link>
            <img className="rounded-img faq-img" src={collectionImage} alt="Volunteers collecting rescued food" />
          </div>
          <div className="faq-list">
            {faqs.map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="cta-inner">
          <div>
            <h2>Have surplus food today?</h2>
            <p>List it in under a minute and help a neighbour tonight.</p>
          </div>
          <div className="hero-actions">
            <Link to="/donate-food" className="btn btn-accent btn-lg">
              Donate food
            </Link>
            <Link to="/volunteer" className="btn btn-light btn-lg">
              Volunteer
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
