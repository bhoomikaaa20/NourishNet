import React, { useState } from "react";
import "./Contact.css"; // Ensure you create this CSS file

const ContactUs = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    comments: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field: ${name}, Value: ${value}`);
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form refresh
    console.log("Form submission prevented.");

    try {
      const response = await fetch("http://localhost:8087/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Form submitted successfully!");
        console.log("Form submitted successfully!");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          comments: "",
        }); // Reset form after successful submission
      } else {
        alert("Error submitting form.");
        console.error("Error in form submission.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting the form.");
    }
  };

  return (
    <>
      <div className="contact-us-page-container">
        <div className="contact-us-page-overlay">
          <p className="contact-us-page-subtitle-green">GET IN TOUCH</p>
          <h2 className="contact-us-page-title">Contact Us</h2>
          <p className="contact-us-page-subtitle-white">
            Reach out with any inquiries, questions, or feedback you may have.
          </p>
        </div>
      </div>
      <form className="contact-us-page-form" onSubmit={handleSubmit}>
        <div className="contact-us-page-form-group">
          <label>
            Name <span className="contact-us-page-required">(Required)</span>
          </label>
          <div className="contact-us-page-form-row">
            <input
              type="text"
              name="firstName"
              placeholder="First"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="contact-us-page-form-group">
          <label>
            Email <span className="contact-us-page-required">(Required)</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="contact-us-page-form-group">
          <label>
            Phone <span className="contact-us-page-required">(Required)</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="contact-us-page-form-group">
          <label>
            Questions or Comments{" "}
            <span className="contact-us-page-required">(Required)</span>
          </label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            required
            maxLength="600"
          ></textarea>
          <small>{formData.comments.length} of 600 max characters</small>
        </div>
        <button type="submit" className="contact-us-page-submit-button">
          Submit
        </button>
      </form>
    </>
  );
};

export default ContactUs;
