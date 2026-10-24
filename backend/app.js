const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");
const accountRoutes = require("./routes/account");
const { router: authRoutes } = require("./auth");

const createApp = () => {
  const app = express();

  // Render (and most hosts) sit behind a proxy; needed for correct client IPs in rate limiting.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());

  // CLIENT_ORIGIN may be a comma-separated list. Auth uses bearer tokens (not
  // cookies), so an unset value falls back to permissive CORS rather than
  // breaking an existing deployment.
  const origins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  app.use(cors(origins.length ? { origin: origins } : {}));

  app.use(express.json({ limit: "10kb" }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many requests. Please slow down." },
    })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/me", accountRoutes);
  app.use(publicRoutes);

  app.use((req, res) => res.status(404).json({ message: "Not found" }));

  // Malformed JSON, oversized bodies, etc.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error("Unhandled error:", err.message);
    res.status(status).json({
      message: status === 413 ? "Request too large" : status < 500 ? "Bad request" : "Server error",
    });
  });

  return app;
};

module.exports = createApp;
