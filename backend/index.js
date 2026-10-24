require("dotenv").config();
const mongoose = require("mongoose");

if (!process.env.MONGO_URL) {
  console.error("Missing required environment variable MONGO_URL. See .env.example.");
  process.exit(1);
}
// Without these the public site still works; only admin login is disabled.
const adminMissing = ["SECRET_KEY", "ADMIN_EMAIL"].filter((k) => !process.env[k]);
if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) adminMissing.push("ADMIN_PASSWORD_HASH");
if (adminMissing.length) {
  console.warn(`Admin login disabled. Missing: ${adminMissing.join(", ")}. See .env.example.`);
}

const createApp = require("./app");
const FoodRequest = require("./models/model");
const FoodDonation = require("./models/donateModel");
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
    await Promise.all([FoodRequest.init(), FoodDonation.init()]);
    await backfillTrackingIds(FoodRequest, "REQ");
    await backfillTrackingIds(FoodDonation, "DON");
    createApp().listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Startup failed (check MONGO_URL and Atlas network access):", err.message);
    process.exit(1);
  });
