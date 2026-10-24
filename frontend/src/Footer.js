import React, { useState } from "react";
import { Link } from "react-router-dom";
import api, { parseError } from "./api";
import stayconnect from "./images/stayconnect.webp";
import { email as emailRule } from "./components/validators";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = emailRule(email);
    if (problem) {
      setStatus({ type: "error", message: problem });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/api/connections", { email });
      setStatus({ type: "success", message: data.message || "Successfully subscribed!" });
      setEmail("");
    } catch (error) {
      setStatus({ type: "error", message: parseError(error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer>
      <section className="newsletter">
        <div className="newsletter-inner">
          <div className="newsletter-text">
            <h2>Stay Connected!</h2>
            <p>Keep up on the latest needs, news, and notables from NourishNet by joining our mailing list.</p>
            <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status.message) setStatus({ type: "", message: "" });
                }}
                autoComplete="email"
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
            {status.message && (
              <p className={`newsletter-msg ${status.type}`} role={status.type === "error" ? "alert" : "status"}>
                {status.message}
              </p>
            )}
          </div>
          <img src={stayconnect} alt="Stay Connected" />
        </div>
      </section>

      <div className="footer">
        <div className="footer-inner">
          <div className="footer-about">
            <h3>
              <i className="fa-solid fa-leaf" aria-hidden="true" /> NourishNet
            </h3>
            <p>
              NourishNet is devoted to ending the cycle of hunger in our local communities by providing a food rescue service.
            </p>
            <div className="social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook-f" aria-hidden="true" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fab fa-twitter" aria-hidden="true" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in" aria-hidden="true" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram" aria-hidden="true" />
              </a>
            </div>
            <address>
              Koramangala, Bangalore
              <br />
              (875) 725-2020
              <br />
              <a href="mailto:feedforward@gmail.com">feedforward@gmail.com</a>
            </address>
          </div>

          <nav className="footer-links" aria-label="Footer">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/find-food">Find Food</Link></li>
              <li><Link to="/request-food">Request Food</Link></li>
              <li><Link to="/donate-food">Donate Food</Link></li>
              <li><Link to="/donate-money">Donate Money</Link></li>
              <li><Link to="/volunteer">Volunteer</Link></li>
              <li><Link to="/our-mission">Our Mission</Link></li>
              <li><Link to="/track">Track a Submission</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </nav>

          <div className="footer-cta">
            <h4>Get involved</h4>
            <Link to="/donate-food" className="btn btn-accent">Make a donation</Link>
            <Link to="/volunteer" className="btn btn-light">Volunteer your time</Link>
          </div>
        </div>
        <p className="copyright">© {new Date().getFullYear()} NourishNet. No neighbor hungry, no food wasted.</p>
      </div>
    </footer>
  );
};

export default Footer;
