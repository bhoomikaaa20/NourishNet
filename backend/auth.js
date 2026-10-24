const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const User = require("./models/userModel");
const { permissionsFor } = require("./rbac");
const { rules, validate, str } = require("./utils/validate");

const router = express.Router();

const SECRET_KEY = process.env.SECRET_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
// The admin configured through environment variables has no database record.
const ENV_ADMIN_ID = "env-admin";

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

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many sign-ups from this network. Please try again later." },
});

// Accounts need only SECRET_KEY; the environment admin additionally needs ADMIN_EMAIL + hash.
const isConfigured = () => Boolean(SECRET_KEY);
const envAdminConfigured = () => Boolean(SECRET_KEY && ADMIN_EMAIL && adminHash);
const notConfigured = (res) =>
  res.status(503).json({ message: "Sign-in is not configured on the server yet." });

const signToken = (sub, email, role) =>
  jwt.sign({ sub, email, role, isAdmin: role === "admin" }, SECRET_KEY, {
    algorithm: "HS256",
    expiresIn: "4h",
  });

// Public shape of the signed-in account, including what it is allowed to do.
const toPublicUser = (u) => ({
  id: String(u._id || u.id),
  email: u.email,
  name: u.name || "",
  phone: u.phone || "",
  city: u.city || "",
  role: u.role,
  hasProfile: (u._id || u.id) !== ENV_ADMIN_ID,
  permissions: permissionsFor(u.role),
});

const envAdmin = () => ({ id: ENV_ADMIN_ID, email: ADMIN_EMAIL, name: "Administrator", role: "admin" });

// `admin` is kept in responses for clients written before accounts existed.
const sessionBody = (user, token) => {
  const body = { user: toPublicUser(user) };
  if (token) body.token = token;
  if (user.role === "admin") body.admin = { email: user.email };
  return body;
};

const PASSWORD_RULE = (label = "Password") => (v) => {
  if (typeof v !== "string" || v.length < 8) return `${label} must be at least 8 characters`;
  if (v.length > 128) return `${label} must be at most 128 characters`;
  return null;
};

const registerSchema = {
  name: rules.text("Name", { max: 100 }),
  email: rules.email(),
  password: PASSWORD_RULE(),
  phone: (v) => (str(v) ? rules.phone()(v) : null),
  city: rules.optionalText("City", { max: 80 }),
};

router.post("/register", registerLimiter, async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  const { ok, errors, clean } = validate(req.body, registerSchema);
  if (!ok) return res.status(400).json({ message: "Please correct the highlighted fields.", errors });

  const email = clean.email.toLowerCase();
  const taken = { message: "An account with this email already exists.", errors: { email: "An account with this email already exists" } };
  if (email === ADMIN_EMAIL) return res.status(409).json(taken);

  try {
    // Role is never taken from the request: every self-registered account is a plain user.
    const user = await User.create({
      name: clean.name,
      email,
      passwordHash: await bcrypt.hash(req.body.password, 10),
      phone: clean.phone || "",
      city: clean.city || "",
      role: "user",
      lastLoginAt: new Date(),
    });
    res.status(201).json(sessionBody(user, signToken(String(user._id), user.email, user.role)));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json(taken);
    console.error("Error registering:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  if (!isConfigured()) return notConfigured(res);
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const invalid = () => res.status(401).json({ message: "Invalid email or password" });

  try {
    if (envAdminConfigured() && email !== "" && email === ADMIN_EMAIL) {
      if (!(await bcrypt.compare(password, adminHash))) return invalid();
      const admin = envAdmin();
      return res.json(sessionBody(admin, signToken(ENV_ADMIN_ID, admin.email, admin.role)));
    }

    const user = email ? await User.findOne({ email }).select("+passwordHash") : null;
    const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !passwordOk) return invalid();
    if (user.status !== "active") {
      return res.status(403).json({ message: "This account has been suspended. Please contact us." });
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
    res.json(sessionBody(user, signToken(String(user._id), user.email, user.role)));
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Resolves a token to the current account, or null. Role and status are read
// from the database on every request so changes take effect immediately.
const resolveUser = async (payload) => {
  // Tokens issued before accounts existed carry only { email, isAdmin }.
  const sub = payload.sub || (payload.isAdmin ? ENV_ADMIN_ID : null);
  if (sub === ENV_ADMIN_ID) {
    return envAdminConfigured() && payload.email === ADMIN_EMAIL ? envAdmin() : null;
  }
  if (!sub || !mongoose.isValidObjectId(sub)) return null;
  const user = await User.findById(sub).lean();
  if (!user || user.status !== "active") return null;
  if (payload.iat < Math.floor(new Date(user.tokensValidAfter || 0).getTime() / 1000)) return null;
  return { ...user, id: String(user._id) };
};

const verify = (token) =>
  new Promise((resolve) =>
    jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }, (err, payload) => resolve(err ? null : payload))
  );

const bearer = (req) => {
  const [scheme, token] = (req.headers["authorization"] || "").split(" ");
  return scheme === "Bearer" && token ? token : null;
};

// Expects `Authorization: Bearer <token>`. Sets req.user = { id, email, role, ... }.
const authenticate = async (req, res, next) => {
  if (!isConfigured()) return notConfigured(res);
  const token = bearer(req);
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const payload = await verify(token);
    const user = payload && (await resolveUser(payload));
    if (!user) return res.status(401).json({ message: "Session expired. Please log in again." });
    req.user = user;
    next();
  } catch (error) {
    console.error("Error authenticating:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// For public endpoints: attaches req.user when a valid session is present, but
// never blocks the request (anonymous submissions keep working).
const optionalAuth = async (req, res, next) => {
  const token = isConfigured() && bearer(req);
  if (!token) return next();
  try {
    const payload = await verify(token);
    const user = payload && (await resolveUser(payload));
    if (user) req.user = user;
  } catch {
    /* treat as anonymous */
  }
  next();
};

router.get("/me", authenticate, (req, res) => {
  res.json(sessionBody(req.user));
});

module.exports = {
  router,
  authenticate,
  // Previous name, kept for existing imports.
  authenticateToken: authenticate,
  optionalAuth,
  isConfigured,
  envAdminConfigured,
  signToken,
  sessionBody,
  PASSWORD_RULE,
  ENV_ADMIN_ID,
};
