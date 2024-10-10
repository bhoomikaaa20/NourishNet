import React, { useState } from "react";
import axios from "axios";
import "./Request.css"; // Import the CSS file
import backgroundImage from "./images/background.webp"; // Import the local background image

const DonateFood = () => {
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [quantity, setQuantity] = useState("");
  const [foodType, setFoodType] = useState(""); // New state for food type
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8087/api/donate-food",
        {
          name,
          contactNumber,
          email,
          address,
          quantity,
          foodType, // Include the new field in the request
        }
      );

      if (response.status === 200) {
        setMessage(response.data.message);
        // Optionally, clear the form fields
        setName("");
        setContactNumber("");
        setEmail("");
        setAddress("");
        setQuantity("");
        setFoodType(""); // Reset food type
      } else {
        setMessage("Failed to submit donation");
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
        <h2>Donate Food</h2>

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
          Address:
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </label>

        <label>
          Food Type:
          <select
            value={foodType}
            onChange={(e) => setFoodType(e.target.value)}
            required
          >
            <option value="">Select food type</option>
            <option value="rice">Rice</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="bread">Bread</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          Quantity (kg):
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            min="1"
          />
        </label>

        <button type="submit">Submit Donation</button>

        {message && <p className="success-message">{message}</p>}
      </form>
    </div>
  );
};

export default DonateFood;
