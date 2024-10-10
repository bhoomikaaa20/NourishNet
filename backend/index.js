require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const FoodRequest = require("./models/model"); // Assuming you have a model for food requests
const FoodDonation = require("./models/donateModel"); // Assuming you have a model for food requests
const Connections = require("./models/connectionsModel");
const Contact = require("./models/contactModel"); // Assuming you have a model for contact forms

const app = express();
const PORT = process.env.PORT || 8087;

app.use(bodyParser.json());
app.use(cors());

mongoose
  .connect(
    "mongodb+srv://nourishNet:gzM60IMzFopWfo0H@clusternourishnet.x9e1r.mongodb.net/?retryWrites=true&w=majority&appName=ClusterNourishNet"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Route for handling food requests
app.post("/api/request-food", async (req, res) => {
  const { name, contactNumber, email, urgency } = req.body;

  try {
    const newRequest = new FoodRequest({ name, contactNumber, email, urgency });
    await newRequest.save();
    res
      .status(200)
      .json({ message: "Request received and stored successfully" });
  } catch (error) {
    console.error("Error saving request:", error);
    res.status(500).json({ message: "Failed to save request" });
  }
});

app.post("/api/donate-food", async (req, res) => {
  const { name, contactNumber, email, address, quantity, foodType } = req.body;

  try {
    // Create a new food donation with the updated fields
    const newDonation = new FoodDonation({
      name,
      contactNumber,
      email,
      address,
      quantity,
      foodType, // Add the new foodType field
    });

    // Save the new donation to the database
    await newDonation.save();

    res
      .status(200)
      .json({ message: "Donation received and stored successfully" });
  } catch (error) {
    console.error("Error saving donation:", error);
    res.status(500).json({ message: "Failed to save donation" });
  }
});

// Route for handling contact form submissions
app.post("/contact", async (req, res) => {
  const { firstName, lastName, email, phone, comments } = req.body;

  try {
    const newContact = new Contact({
      firstName,
      lastName,
      email,
      phone,
      comments,
    });
    await newContact.save();
    res.status(200).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("Error saving contact form data:", error);
    res.status(500).json({ message: "Failed to submit form" });
  }
});

// Route for fetching dashboard data
app.get("/api/dashboard", async (req, res) => {
  try {
    console.log("Fetching data from the database...");
    const [requests, contacts, donations, connections] = await Promise.all([
      FoodRequest.find().sort({ createdAt: -1 }),
      Contact.find().sort({ createdAt: -1 }),
      FoodDonation.find().sort({ createdAt: -1 }),
      Connections.find().sort({ createdAt: -1 }),
    ]);

    res.json({ requests, contacts, donations, connections });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Failed to fetch data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// POST request to add a new connection (email)
app.post("/api/connections", async (req, res) => {
  const { email } = req.body; // Extract email from request body

  try {
    // Create a new connection
    const newConnection = new Connections({ email });
    await newConnection.save();
    res.status(201).json({ message: "Email subscribed successfully!" }); // Successful response
  } catch (error) {
    console.error("Error saving email:", error);
    res.status(500).json({ message: "Failed to subscribe email." }); // Error response
  }
});
