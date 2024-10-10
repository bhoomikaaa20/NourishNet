import React, { useState } from "react";
import axios from "axios";
import "./Request.css"; // Import the CSS file
import backgroundImage from "./images/background.webp"; // Import the local background image

const Requestform = () => {
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [urgency, setUrgency] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8087/api/request-food",
        {
          name,
          contactNumber,
          email,
          urgency,
        }
      );

      if (response.status === 200) {
        setMessage(response.data.message);
        // Optionally, clear the form fields
        setName("");
        setContactNumber("");
        setEmail("");
        setUrgency("");
      } else {
        setMessage("Failed to submit request");
      }
    } catch (error) {
      console.error(
        "Error submitting form:",
        error.response ? error.response.data : error.message
      );
      setMessage(
        "An error occurred: " +
          (error.response ? error.response.data : error.message)
      );
    }
  };

  return (
    <div
      className="form-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <form onSubmit={handleSubmit} className="request-form">
        <h2>Request Food</h2>

        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label>
          Contact Number:
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            required
          />
        </label>

        <label>
          Email Address:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Urgency Level:
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            required
          >
            <option value="">Select urgency</option>
            <option value="immediate">Immediate</option>
            <option value="within_a_week">Within a Week</option>
          </select>
        </label>

        <button type="submit">Submit Request</button>

        {message && <p className="success-message">{message}</p>}
      </form>
    </div>
  );
};

export default Requestform;
