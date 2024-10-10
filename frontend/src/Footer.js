import React, { useState } from "react";
import axios from "axios";
import stayconnect from "./images/stayconnect.webp";
import "./footer.css";

const Footer = () => {
  const [email, setEmail] = useState(""); // State to hold the email input
  const [message, setMessage] = useState(""); // State to hold the success or error message

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    try {
      const response = await axios.post(
        "http://localhost:8087/api/connections",
        { email }
      ); // Change URL based on your backend configuration
      if (response.status === 201) {
        setMessage("Successfully subscribed!"); // Set success message
        setEmail(""); // Clear the input field
      } else {
        setMessage("Failed to subscribe."); // Set error message
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      setMessage("An error occurred while subscribing."); // Set error message
    }
  };

  return (
    <div>
      <div className="container">
        <div className="content">
          <div className="text-content">
            <h1>Stay Connected!</h1>
            <p>
              Keep up on the latest needs, news, and notables from FeedForward
              by joining our mailing list:
            </p>
            <form className="contact-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Update email state on input change
                required
              />
              <button type="submit">Subscribe</button>
            </form>
            {message && <p className="subscription-message">{message}</p>}{" "}
            {/* Display message after submission */}
          </div>
          <div className="image-content">
            <img src={stayconnect} alt="Stay Connected" />
          </div>
        </div>
      </div>
      <footer className="footer-container">
        <div className="footer-content">
          <div className="footer-left">
            <h3>FeedForward</h3>
            <p>
              FeedForward is devoted to ending the cycle of hunger in the local
              communities of northern Indiana by providing a food rescue
              service.
            </p>
            <div className="footer-social-icons">
              <a href="https://facebook.com">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://linkedin.com">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="https://instagram.com">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
            <address>
              Kormangla, Bangalore
              <br />
              (875) 725-2020
              <br />
              <a href="mailto:feedforward@gmail.com">feedforward@gmail.com</a>
            </address>
          </div>
          <div className="footer-right">
            <div className="footer-links-buttons">
              <ul className="footer-links">
                <li>
                  <a href="/volunteer">Volunteer</a>
                </li>
                <li>
                  <a href="/donate">Donate</a>
                </li>
                <li>
                  <a href="/financial-sponsors">Financial Sponsors</a>
                </li>
                <li>
                  <a href="/donate-food">Food Donors</a>
                </li>
                <li>
                  <a href="/volunteers">Volunteers</a>
                </li>
                <li>
                  <a href="/opt-out-preferences">Opt-out preferences</a>
                </li>
              </ul>
              <div className="footer-buttons">
                <a href="/join-cause">
                  <button className="join-cause-button">Join the cause</button>
                </a>
                <a href="/volunteer">
                  <button className="volunteer-button">
                    Volunteer your time!
                  </button>
                </a>
                <a href="/donate">
                  <button className="donate-button">Make a donation!</button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
