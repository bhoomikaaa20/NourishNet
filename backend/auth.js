const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const router = express.Router();
dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", email);

  try {
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      console.log("Invalid credentials");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Credentials valid");

    const token = jwt.sign({ email, isAdmin: true }, SECRET_KEY, {
      expiresIn: "1h",
    });
    console.log("Generated token:", token);

    res.json({ token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Failed to authenticate token" });
    req.user = user;
    next();
  });
};

module.exports = { router, authenticateToken };
