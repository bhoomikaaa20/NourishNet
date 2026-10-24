const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { authenticate, PASSWORD_RULE, sessionBody, signToken } = require("../auth");
const { requirePermission } = require("../rbac");
const FoodRequest = require("../models/model");
const FoodDonation = require("../models/donateModel");
const User = require("../models/userModel");
const { rules, validate, str } = require("../utils/validate");

// The signed-in user's own profile and submissions. Every query is scoped to
// req.user.id, so ownership is enforced by the query itself: a record that
// belongs to someone else is simply "Not found".
const router = express.Router();
router.use(authenticate);

const invalid = (res, errors) =>
  res.status(400).json({ message: "Please correct the highlighted fields.", errors });

const profileSchema = {
  name: rules.text("Name", { max: 100 }),
  phone: (v) => (str(v) ? rules.phone()(v) : null),
  city: rules.optionalText("City", { max: 80 }),
};

router.get("/", requirePermission("profile:read"), (req, res) => {
  res.json(sessionBody(req.user));
});

router.patch("/", requirePermission("profile:update"), async (req, res) => {
  // Only these fields are editable here; email, role and status are not.
  const { ok, errors, clean } = validate({ ...req.user, ...req.body }, profileSchema);
  if (!ok) return invalid(res, errors);
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name: clean.name, phone: clean.phone || "", city: clean.city || "" } },
      { new: true, runValidators: true }
    ).lean();
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(sessionBody(user));
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

router.post("/password", requirePermission("profile:update"), async (req, res) => {
  const error = PASSWORD_RULE("New password")(req.body?.newPassword);
  if (error) return invalid(res, { newPassword: error });
  try {
    const user = await User.findById(req.user.id).select("+passwordHash");
    const current = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
      return invalid(res, { currentPassword: "Current password is incorrect" });
    }
    user.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
    // Sign out every other session; the response carries a fresh token for this one.
    user.tokensValidAfter = new Date();
    await user.save();
    res.json({ message: "Password updated", ...sessionBody(user, signToken(String(user._id), user.email, user.role)) });
  } catch (err) {
    console.error("Error changing password:", err.message);
    res.status(500).json({ message: "Failed to change password" });
  }
});

// ---- Own submissions ----
// Only what the submitter should see: no internal ids of other people's records.
const toOwnDonation = (d) => ({
  _id: d._id,
  trackingId: d.trackingId,
  foodType: d.foodType,
  dietType: d.dietType || "",
  quantity: d.quantity,
  address: d.address,
  city: d.city || "",
  availableUntil: d.availableUntil || null,
  notes: d.notes || "",
  status: d.status || "pending",
  adminNote: d.adminNote || "",
  claimed: Boolean(d.claimedBy),
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

const toOwnRequest = (r) => ({
  _id: r._id,
  trackingId: r.trackingId,
  urgency: r.urgency,
  householdSize: r.householdSize,
  address: r.address,
  city: r.city || "",
  notes: r.notes || "",
  status: r.status || "pending",
  adminNote: r.adminNote || "",
  fromListing: Boolean(r.donation),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const OWN = {
  donations: { Model: FoodDonation, shape: toOwnDonation },
  requests: { Model: FoodRequest, shape: toOwnRequest },
};

const getOwn = (req, res, next) => {
  req.own = Object.prototype.hasOwnProperty.call(OWN, req.params.type) ? OWN[req.params.type] : null;
  return req.own ? next() : res.status(404).json({ message: "Not found" });
};

router.get("/:type", requirePermission("submissions:own:read"), getOwn, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const query = { user: req.user.id };
    const [items, total] = await Promise.all([
      req.own.Model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      req.own.Model.countDocuments(query),
    ]);
    res.json({ items: items.map(req.own.shape), total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    console.error("Error listing own submissions:", error.message);
    res.status(500).json({ message: "Failed to load your submissions" });
  }
});

// Withdraw a submission that the team hasn't acted on yet.
router.delete("/:type/:id", requirePermission("submissions:own:cancel"), getOwn, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Not found" });
  const { Model } = req.own;
  // Legacy records without a status count as pending, matching the admin dashboard.
  const pending = { $or: [{ status: "pending" }, { status: { $exists: false } }] };
  const filter = { $and: [{ _id: req.params.id, user: req.user.id }, pending] };
  // A donation someone has already reserved can't be withdrawn without the team.
  if (Model === FoodDonation) filter.$and.push({ claimedBy: null });

  try {
    const doc = await Model.findOneAndDelete(filter).lean();
    if (!doc) {
      const exists = await Model.exists({ _id: req.params.id, user: req.user.id });
      return exists
        ? res.status(409).json({ message: "This can no longer be cancelled online. Please contact us." })
        : res.status(404).json({ message: "Not found" });
    }
    if (Model === FoodRequest) {
      // Release any listing this request had reserved, as the admin delete does.
      await FoodDonation.updateMany({ claimedBy: doc._id }, { $set: { claimedBy: null }, $unset: { claimedAt: 1 } });
    }
    res.json({ message: "Cancelled" });
  } catch (error) {
    console.error("Error cancelling submission:", error.message);
    res.status(500).json({ message: "Failed to cancel" });
  }
});

module.exports = router;
