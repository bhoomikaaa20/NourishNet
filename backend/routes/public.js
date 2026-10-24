const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const FoodRequest = require("../models/model");
const FoodDonation = require("../models/donateModel");
const Connections = require("../models/connectionsModel");
const Contact = require("../models/contactModel");
const Volunteer = require("../models/volunteerModel");
const { rules, validate, str, parseDate, escapeRegex } = require("../utils/validate");
const { optionalAuth, ENV_ADMIN_ID } = require("../auth");

const router = express.Router();

// Submissions made while signed in are linked to the account so they appear under
// "My account". Signing in is never required, and the link comes only from the
// verified session, never from the request body.
const ownerOf = (req) => (req.user && req.user.id !== ENV_ADMIN_ID ? req.user.id : null);

// Public write endpoints are the spam/abuse surface, so they get a tighter limit.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many submissions. Please try again later." },
});

const invalid = (res, errors) =>
  res.status(400).json({ message: "Please correct the highlighted fields.", errors });

const FOOD_TYPES = ["rice", "vegetables", "fruits", "bread", "other"];
const DIET_TYPES = ["veg", "nonveg", "vegan"];

// Shared by direct requests and claims of a listing.
const requesterSchema = {
  name: rules.text("Name", { max: 100 }),
  contactNumber: rules.phone(),
  email: rules.email(),
  address: rules.text("Address", { max: 300 }),
  city: rules.optionalText("City", { max: 80 }),
  householdSize: rules.number("Household size", { min: 1, max: 100, integer: true, optional: true }),
  notes: rules.optionalText("Notes", { max: 500 }),
};

const requestSchema = {
  ...requesterSchema,
  urgency: rules.oneOf("urgency", ["immediate", "within_a_week"]),
};

// city, dietType and availableUntil are optional for older clients; the current UI always sends them.
const donationSchema = {
  name: rules.text("Name", { max: 100 }),
  contactNumber: rules.phone(),
  email: rules.email(),
  address: rules.text("Address", { max: 300 }),
  city: rules.optionalText("City", { max: 80 }),
  foodType: rules.oneOf("food type", FOOD_TYPES),
  dietType: rules.optionalOneOf("diet type", DIET_TYPES),
  quantity: rules.number("Quantity", { min: 1, max: 100000 }),
  availableUntil: rules.futureDate("Available until", { maxDays: 30, optional: true }),
  notes: rules.optionalText("Notes", { max: 500 }),
};

const contactSchema = {
  firstName: rules.text("First name", { max: 60 }),
  lastName: rules.text("Last name", { max: 60 }),
  email: rules.email(),
  phone: rules.phone(),
  comments: rules.text("Message", { max: 600 }),
};

const volunteerSchema = {
  name: rules.text("Name", { max: 100 }),
  email: rules.email(),
  phone: rules.phone(),
  city: rules.text("City", { max: 80 }),
  availability: rules.oneOf("availability", Volunteer.AVAILABILITY),
  interests: rules.subsetOf("interests", Volunteer.INTERESTS, { min: 1 }),
  hasVehicle: rules.bool("Has vehicle"),
  message: rules.optionalText("Message", { max: 500 }),
};

const toRequestDoc = (clean) => {
  const doc = { ...clean };
  if (doc.householdSize === undefined || doc.householdSize === "") delete doc.householdSize;
  else doc.householdSize = Number(doc.householdSize);
  return doc;
};

router.post("/api/request-food", submitLimiter, optionalAuth, async (req, res) => {
  const { ok, errors, clean } = validate(req.body, requestSchema);
  if (!ok) return invalid(res, errors);

  try {
    const doc = await FoodRequest.create({ ...toRequestDoc(clean), user: ownerOf(req) });
    res.status(200).json({
      message: "Request received and stored successfully",
      trackingId: doc.trackingId,
    });
  } catch (error) {
    console.error("Error saving request:", error.message);
    res.status(500).json({ message: "Failed to save request" });
  }
});

router.post("/api/donate-food", submitLimiter, optionalAuth, async (req, res) => {
  const { ok, errors, clean } = validate(req.body, donationSchema);
  if (!ok) return invalid(res, errors);

  try {
    clean.quantity = Number(clean.quantity);
    if (clean.availableUntil) clean.availableUntil = parseDate(clean.availableUntil);
    else delete clean.availableUntil;
    if (!clean.dietType) delete clean.dietType;
    const doc = await FoodDonation.create({ ...clean, user: ownerOf(req) });
    res.status(200).json({
      message: "Donation received and stored successfully",
      trackingId: doc.trackingId,
    });
  } catch (error) {
    console.error("Error saving donation:", error.message);
    res.status(500).json({ message: "Failed to save donation" });
  }
});

const handleContact = async (req, res) => {
  const { ok, errors, clean } = validate(req.body, contactSchema);
  if (!ok) return invalid(res, errors);

  try {
    await Contact.create(clean);
    res.status(200).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("Error saving contact form data:", error.message);
    res.status(500).json({ message: "Failed to submit form" });
  }
};
router.post("/contact", submitLimiter, handleContact); // original path
router.post("/api/contact", submitLimiter, handleContact);

router.post("/api/connections", submitLimiter, async (req, res) => {
  const { ok, errors, clean } = validate(req.body, { email: rules.email() });
  if (!ok) return invalid(res, errors);

  try {
    await Connections.create({ email: clean.email });
    res.status(201).json({ message: "Email subscribed successfully!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ message: "You're already subscribed. Thank you!" });
    }
    console.error("Error saving email:", error.message);
    res.status(500).json({ message: "Failed to subscribe email." });
  }
});

router.post("/api/volunteers", submitLimiter, optionalAuth, async (req, res) => {
  const { ok, errors, clean } = validate(req.body, volunteerSchema);
  if (!ok) return invalid(res, errors);

  try {
    clean.interests = [...new Set(clean.interests || [])];
    await Volunteer.create({ ...clean, user: ownerOf(req) });
    res.status(201).json({ message: "Thanks for signing up! Our volunteer team will be in touch soon." });
  } catch (error) {
    console.error("Error saving volunteer:", error.message);
    res.status(500).json({ message: "Failed to save your sign-up" });
  }
});

// ---- Public listings of approved, unclaimed donations ----
// Only non-identifying fields are exposed: no donor name, contact details or street address.
const listingQuery = () => ({
  status: "approved",
  claimedBy: null,
  $or: [{ availableUntil: { $exists: false } }, { availableUntil: null }, { availableUntil: { $gte: new Date() } }],
});

const toListing = (d) => ({
  id: d._id,
  foodType: d.foodType,
  dietType: d.dietType || "",
  quantity: d.quantity,
  city: d.city || "",
  availableUntil: d.availableUntil || null,
  listedAt: d.updatedAt || d.createdAt,
});

router.get("/api/listings", async (req, res) => {
  try {
    const query = listingQuery();
    const and = [query];
    const foodType = str(req.query.foodType);
    if (FOOD_TYPES.includes(foodType)) and.push({ foodType });
    const dietType = str(req.query.dietType);
    if (DIET_TYPES.includes(dietType)) and.push({ dietType });
    const city = str(req.query.city).slice(0, 80);
    if (city) and.push({ city: new RegExp(escapeRegex(city), "i") });
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 60);

    const docs = await FoodDonation.find({ $and: and })
      .sort({ availableUntil: 1, createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ items: docs.map(toListing) });
  } catch (error) {
    console.error("Error listing donations:", error.message);
    res.status(500).json({ message: "Failed to load available food" });
  }
});

router.post("/api/listings/:id/claim", submitLimiter, optionalAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "This listing is no longer available." });
  }
  const { ok, errors, clean } = validate(req.body, requesterSchema);
  if (!ok) return invalid(res, errors);

  // Reserve the listing atomically first, so two people can't claim the same food.
  const requestId = new mongoose.Types.ObjectId();
  const donation = await FoodDonation.findOneAndUpdate(
    { $and: [{ _id: req.params.id }, listingQuery()] },
    { $set: { claimedBy: requestId, claimedAt: new Date() } },
    { new: true }
  ).catch(() => null);
  if (!donation) {
    return res.status(409).json({ message: "Sorry, this listing was just claimed or is no longer available." });
  }

  try {
    const doc = await FoodRequest.create({
      ...toRequestDoc(clean),
      _id: requestId,
      urgency: "immediate",
      donation: donation._id,
      city: clean.city || donation.city,
      user: ownerOf(req),
    });
    res.status(200).json({
      message: "You've claimed this food. Our team will confirm pickup or delivery shortly.",
      trackingId: doc.trackingId,
    });
  } catch (error) {
    // Release the reservation if the request couldn't be stored.
    await FoodDonation.updateOne({ _id: donation._id, claimedBy: requestId }, { $set: { claimedBy: null }, $unset: { claimedAt: 1 } });
    console.error("Error claiming listing:", error.message);
    res.status(500).json({ message: "Failed to claim this listing" });
  }
});

// ---- Aggregate impact numbers for the home page (no personal data) ----
let impactCache = { at: 0, data: null };
router.get("/api/impact", async (req, res) => {
  try {
    if (Date.now() - impactCache.at > 60 * 1000) {
      const [kg, donations, completedRequests, volunteers, listings] = await Promise.all([
        FoodDonation.aggregate([
          { $match: { status: { $ne: "rejected" } } },
          { $group: { _id: null, total: { $sum: "$quantity" } } },
        ]),
        FoodDonation.countDocuments({ status: { $ne: "rejected" } }),
        FoodRequest.countDocuments({ status: "completed" }),
        Volunteer.countDocuments({ status: { $ne: "inactive" } }),
        FoodDonation.countDocuments(listingQuery()),
      ]);
      impactCache = {
        at: Date.now(),
        data: {
          kgShared: Math.round(kg[0]?.total || 0),
          donations,
          requestsFulfilled: completedRequests,
          volunteers,
          availableListings: listings,
        },
      };
    }
    res.json(impactCache.data);
  } catch (error) {
    console.error("Error computing impact:", error.message);
    res.status(500).json({ message: "Failed to load impact" });
  }
});

// Public status lookup. Requires BOTH the tracking code and the email used on the
// submission, so codes can't be used to enumerate other people's records.
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many lookups. Please try again later." },
});

router.post("/api/track", trackLimiter, async (req, res) => {
  const code = str(req.body?.trackingId).toUpperCase();
  const email = str(req.body?.email).toLowerCase();
  const notFound = () =>
    res.status(404).json({ message: "No submission found for that code and email." });

  if (!/^(REQ|DON)-[A-Z0-9]{8}$/.test(code) || !email) return notFound();

  try {
    const isRequest = code.startsWith("REQ-");
    const Model = isRequest ? FoodRequest : FoodDonation;
    const doc = await Model.findOne({ trackingId: code, email }).lean();
    if (!doc) return notFound();

    res.json({
      trackingId: doc.trackingId,
      type: isRequest ? "request" : "donation",
      status: doc.status || "pending",
      adminNote: doc.adminNote || "",
      submittedAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      summary: isRequest
        ? { urgency: doc.urgency, fromListing: Boolean(doc.donation) }
        : { foodType: doc.foodType, quantity: doc.quantity, claimed: Boolean(doc.claimedBy) },
    });
  } catch (error) {
    console.error("Error tracking submission:", error.message);
    res.status(500).json({ message: "Failed to look up submission" });
  }
});

// Reports DB connectivity too, so a broken MONGO_URL is visible from outside.
router.get("/api/health", (req, res) => {
  const db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(db === "connected" ? 200 : 503).json({ status: db === "connected" ? "ok" : "degraded", db });
});

module.exports = router;
