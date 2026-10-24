require("dotenv").config();
const mongoose = require("mongoose");

if (!process.env.MONGO_URL) {
  console.error("Missing required environment variable MONGO_URL. See .env.example.");
  process.exit(1);
}
// Without it the public site still works; only sign-in (users and admins) is disabled.
if (!process.env.SECRET_KEY) {
  console.warn("Sign-in disabled. Missing: SECRET_KEY. See .env.example.");
}
// Admins are database users with role "admin"; these variables are no longer read.
const obsolete = ["ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_PASSWORD_HASH"].filter((k) => process.env[k]);
if (obsolete.length) {
  console.warn(`Ignoring obsolete ${obsolete.join(", ")}; you can delete them. Admins are promoted with \`node generate.js promote <email>\`.`);
}

const createApp = require("./app");
const FoodRequest = require("./models/model");
const FoodDonation = require("./models/donateModel");
const User = require("./models/userModel");
const { generateTrackingId } = require("./models/trackingId");

const PORT = process.env.PORT || 8087;

// Records created before tracking existed get a code so they can be tracked too.
const backfillTrackingIds = async (Model, prefix) => {
  const legacy = await Model.find({ trackingId: { $exists: false } }).select("_id");
  for (const { _id } of legacy) {
    await Model.updateOne({ _id }, { $set: { trackingId: generateTrackingId(prefix) } });
  }
  if (legacy.length) console.log(`Backfilled ${legacy.length} ${prefix} tracking ids`);
};

// Host and database only, never credentials, so logs show which cluster is being used.
const describeUrl = (url) => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return "(MONGO_URL is not a valid connection string)";
  }
};

// The driver's top-level message for Atlas is always the generic "IP whitelist" text;
// the per-server errors underneath show what actually happened on the network.
const underlyingErrors = (err) => {
  const servers = err.reason && err.reason.servers;
  if (!servers || typeof servers.values !== "function") return "";
  const msgs = [...servers.values()].map((s) => s.error && s.error.message).filter(Boolean);
  return [...new Set(msgs)].join(" | ");
};

const explain = (err) => {
  const msg = `${err.message || err} ${underlyingErrors(err)}`;
  if (/auth|bad auth|authentication/i.test(msg)) {
    return "Atlas rejected the username/password in MONGO_URL. Check the Atlas database user (URL-encode special characters in the password).";
  }
  if (/ENOTFOUND|querySrv|EBADNAME/i.test(msg)) {
    return "The cluster hostname in MONGO_URL could not be resolved. Copy a fresh connection string from Atlas > Connect > Drivers.";
  }
  return (
    "Atlas is unreachable from this host. In Atlas > Security > Network Access, allow this server's IP " +
    "(on Render: 0.0.0.0/0 or the service's outbound IPs), and make sure the cluster is not paused."
  );
};

// Start serving immediately so the host sees the port open; /api/health reports
// "degraded" until the database is reachable. Connection failures are retried and
// logged instead of exiting, so the reason is never lost from the deploy logs.
createApp().listen(PORT, () => console.log(`Server is running on port ${PORT}`));

const connect = async (attempt = 1) => {
  console.log(`Connecting to MongoDB at ${describeUrl(process.env.MONGO_URL)} (attempt ${attempt})…`);
  try {
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    const delay = Math.min(60, 5 * attempt);
    console.error(`MongoDB connection failed: ${err.message}`);
    const detail = underlyingErrors(err);
    if (detail) console.error(`Underlying error: ${detail}`);
    console.error(explain(err));
    console.error(`Retrying in ${delay}s.`);
    setTimeout(() => connect(attempt + 1), delay * 1000);
    return;
  }

  console.log("Connected to MongoDB");
  try {
    await Promise.all([FoodRequest.init(), FoodDonation.init(), User.init()]);
    await backfillTrackingIds(FoodRequest, "REQ");
    await backfillTrackingIds(FoodDonation, "DON");
  } catch (err) {
    // Index builds and backfills are housekeeping; the API works without them.
    console.error("Database setup step failed (the API is still running):", err.message);
  }
};

connect();
