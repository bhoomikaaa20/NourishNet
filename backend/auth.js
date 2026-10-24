const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const SECRET_KEY = process.env.SECRET_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

// Prefer ADMIN_PASSWORD_HASH (bcrypt). A plain ADMIN_PASSWORD is still accepted
// so existing deployments keep working, but it is hashed in memory at startup
// and compared in constant time via bcrypt.
let adminHash = process.env.ADMIN_PASSWORD_HASH || "";
if (!adminHash && process.env.ADMIN_PASSWORD) {
  adminHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  console.warn(
    "ADMIN_PASSWORD is set in plain text. Use ADMIN_PASSWORD_HASH instead (see `node generate.js hash <password>`)."
  );
}
// Compared against when the email is wrong, so response time doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync("not-the-password", 10);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

const isConfigured = () => Boolean(SECRET_KEY && ADMIN_EMAIL && adminHash);
const notConfigured = (res) =>
  res.status(503).json({ message: "Admin login is not configured on the server yet." });

router.post("/login", loginLimiter, async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  try {
    const emailOk = email !== "" && email === ADMIN_EMAIL;
    const passwordOk = await bcrypt.compare(password, emailOk ? adminHash : DUMMY_HASH);
    if (!emailOk || !passwordOk) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ email, isAdmin: true }, SECRET_KEY, {
      algorithm: "HS256",
      expiresIn: "4h",
    });
    res.json({ token, admin: { email } });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Expects `Authorization: Bearer <token>`.
const authenticateToken = (req, res, next) => {
  if (!isConfigured()) return notConfigured(res);
  const header = req.headers["authorization"] || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }, (err, payload) => {
    if (err || !payload.isAdmin) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    req.user = payload;
    next();
  });
};

router.get("/me", authenticateToken, (req, res) => {
  res.json({ admin: { email: req.user.email } });
});

module.exports = { router, authenticateToken, isConfigured };
