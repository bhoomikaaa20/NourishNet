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

mongoose
  .connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 15000 })
  .then(async () => {
    console.log("Connected to MongoDB");
    await Promise.all([FoodRequest.init(), FoodDonation.init(), User.init()]);
    await backfillTrackingIds(FoodRequest, "REQ");
    await backfillTrackingIds(FoodDonation, "DON");
    createApp().listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Startup failed: could not connect to MongoDB.", err.message);
    if (err.name === "MongooseServerSelectionError" || /whitelist|ENOTFOUND|ETIMEDOUT|ECONNREFUSED/i.test(err.message)) {
      console.error(
        "Atlas is unreachable from this host. In Atlas > Security > Network Access, allow this server's IP " +
          "(on Render: 0.0.0.0/0, or the service's outbound IPs), and check that the cluster is not paused."
      );
    } else if (/auth/i.test(err.message)) {
      console.error("Atlas rejected the credentials. Check the user/password in MONGO_URL (URL-encode special characters).");
    }
    process.exit(1);
  });
