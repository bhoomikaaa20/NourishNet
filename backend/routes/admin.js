const express = require("express");
const mongoose = require("mongoose");
const { authenticate } = require("../auth");
const { requirePermission, ROLES } = require("../rbac");
const FoodRequest = require("../models/model");
const FoodDonation = require("../models/donateModel");
const Connections = require("../models/connectionsModel");
const Contact = require("../models/contactModel");
const Volunteer = require("../models/volunteerModel");
const User = require("../models/userModel");
const { escapeRegex, str } = require("../utils/validate");

const router = express.Router();
// Every admin route needs a session; each route then checks its own permission.
router.use(authenticate);

// One config entry per manageable collection keeps the CRUD handlers generic.
const COLLECTIONS = {
  requests: {
    Model: FoodRequest,
    search: ["name", "email", "contactNumber", "address", "city", "trackingId"],
    statuses: FoodRequest.STATUSES,
    defaultStatus: "pending",
    csv: ["trackingId", "name", "contactNumber", "email", "address", "city", "urgency", "householdSize", "notes", "status", "adminNote", "createdAt"],
  },
  donations: {
    Model: FoodDonation,
    search: ["name", "email", "contactNumber", "address", "city", "foodType", "trackingId"],
    statuses: FoodDonation.STATUSES,
    defaultStatus: "pending",
    csv: ["trackingId", "name", "contactNumber", "email", "address", "city", "foodType", "dietType", "quantity", "availableUntil", "notes", "status", "adminNote", "createdAt"],
  },
  contacts: {
    Model: Contact,
    search: ["firstName", "lastName", "email", "phone", "comments"],
    statuses: Contact.STATUSES,
    defaultStatus: "new",
    csv: ["firstName", "lastName", "email", "phone", "comments", "status", "createdAt"],
  },
  volunteers: {
    Model: Volunteer,
    search: ["name", "email", "phone", "city"],
    statuses: Volunteer.STATUSES,
    defaultStatus: "new",
    csv: ["name", "email", "phone", "city", "availability", "interests", "hasVehicle", "message", "status", "createdAt"],
  },
  connections: {
    Model: Connections,
    search: ["email"],
    statuses: null,
    csv: ["email", "createdAt"],
  },
};

const getCollection = (req, res, next) => {
  const cfg = Object.prototype.hasOwnProperty.call(COLLECTIONS, req.params.type)
    ? COLLECTIONS[req.params.type]
    : null;
  if (!cfg) return res.status(404).json({ message: "Unknown collection" });
  req.cfg = cfg;
  next();
};

const validId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  next();
};

// Documents created before statuses existed have no `status` field, so the
// default status must also match documents where it is missing.
const statusFilter = (cfg, status) => {
  if (!cfg.statuses || !cfg.statuses.includes(status)) return null;
  return status === cfg.defaultStatus
    ? { $or: [{ status }, { status: { $exists: false } }] }
    : { status };
};

const buildQuery = (cfg, q) => {
  const and = [];
  const status = statusFilter(cfg, str(q.status));
  if (status) and.push(status);

  const term = str(q.q).slice(0, 100);
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    and.push({ $or: cfg.search.map((f) => ({ [f]: rx })) });
  }
  return and.length ? { $and: and } : {};
};

const sortFor = (q) => (str(q.sort) === "oldest" ? { createdAt: 1 } : { createdAt: -1 });

// ---- Overview ----
const countWithStatus = (Model, status, defaultStatus) =>
  Model.countDocuments(
    status === defaultStatus
      ? { $or: [{ status }, { status: { $exists: false } }] }
      : { status }
  );

const sumQuantity = async (match) => {
  const rows = await FoodDonation.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$quantity" } } },
  ]);
  return rows[0]?.total || 0;
};

// Submissions per day for the last `days` days (UTC), zero-filled.
const dailyTrend = async (days) => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const pipeline = [
    { $match: { createdAt: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, n: { $sum: 1 } } },
  ];
  const [reqs, dons] = await Promise.all([FoodRequest.aggregate(pipeline), FoodDonation.aggregate(pipeline)]);
  const byDay = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.n]));
  const r = byDay(reqs);
  const d = byDay(dons);
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
    return { date: day, requests: r[day] || 0, donations: d[day] || 0 };
  });
};

router.get("/stats", requirePermission("dashboard:read"), async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      requestsTotal, requestsPending, requestsCompleted, requestsWeek,
      donationsTotal, donationsPending, donationsCompleted, donationsWeek,
      contactsTotal, contactsNew, connectionsTotal,
      kgDonated, kgDelivered, volunteersTotal, volunteersNew, trend,
    ] = await Promise.all([
      FoodRequest.countDocuments(),
      countWithStatus(FoodRequest, "pending", "pending"),
      countWithStatus(FoodRequest, "completed", "pending"),
      FoodRequest.countDocuments({ createdAt: { $gte: weekAgo } }),
      FoodDonation.countDocuments(),
      countWithStatus(FoodDonation, "pending", "pending"),
      countWithStatus(FoodDonation, "completed", "pending"),
      FoodDonation.countDocuments({ createdAt: { $gte: weekAgo } }),
      Contact.countDocuments(),
      countWithStatus(Contact, "new", "new"),
      Connections.countDocuments(),
      sumQuantity({}),
      sumQuantity({ status: "completed" }),
      Volunteer.countDocuments(),
      countWithStatus(Volunteer, "new", "new"),
      dailyTrend(14),
    ]);

    res.json({
      requests: { total: requestsTotal, pending: requestsPending, completed: requestsCompleted, lastWeek: requestsWeek },
      donations: { total: donationsTotal, pending: donationsPending, completed: donationsCompleted, lastWeek: donationsWeek },
      contacts: { total: contactsTotal, new: contactsNew },
      connections: { total: connectionsTotal },
      kgDonated,
      kgDelivered,
      volunteers: { total: volunteersTotal, new: volunteersNew },
      trend,
    });
  } catch (error) {
    console.error("Error computing stats:", error.message);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

// ---- CSV export ----
const csvCell = (value) => {
  let s = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
  // Neutralise spreadsheet formula injection from user-supplied text.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

// Show which account made a submission, if any.
const attachAccounts = async (items) => {
  const ids = items.map((i) => i.user).filter(Boolean);
  if (!ids.length) return;
  const users = await User.find({ _id: { $in: ids } }).select("email name").lean();
  const map = new Map(users.map((u) => [String(u._id), u]));
  for (const i of items) if (i.user) i.account = map.get(String(i.user)) || null;
};

// Show which request claimed a donation (and vice versa) by tracking code.
const attachLinks = async (type, items) => {
  if (["requests", "donations", "volunteers"].includes(type)) await attachAccounts(items);
  if (type === "donations") {
    const ids = items.map((i) => i.claimedBy).filter(Boolean);
    if (!ids.length) return;
    const reqs = await FoodRequest.find({ _id: { $in: ids } }).select("trackingId name").lean();
    const map = new Map(reqs.map((r) => [String(r._id), r]));
    for (const i of items) if (i.claimedBy) i.claimedByRequest = map.get(String(i.claimedBy)) || null;
  } else if (type === "requests") {
    const ids = items.map((i) => i.donation).filter(Boolean);
    if (!ids.length) return;
    const dons = await FoodDonation.find({ _id: { $in: ids } }).select("trackingId foodType quantity").lean();
    const map = new Map(dons.map((d) => [String(d._id), d]));
    for (const i of items) if (i.donation) i.linkedDonation = map.get(String(i.donation)) || null;
  }
};

// ---- User accounts ----
// Declared before the generic /:type routes so "users" never falls through to them.
const USERS = {
  search: ["name", "email", "phone", "city"],
  statuses: User.STATUSES,
  defaultStatus: "active",
  csv: ["name", "email", "phone", "city", "role", "status", "lastLoginAt", "createdAt"],
};

const userQuery = (q) => {
  const query = buildQuery(USERS, q);
  const role = str(q.role);
  if (!ROLES.includes(role)) return query;
  return { $and: [...(query.$and || []), { role }] };
};

const countBy = async (Model, ids) => {
  const rows = await Model.aggregate([{ $match: { user: { $in: ids } } }, { $group: { _id: "$user", n: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
};

// Returns a reason the change is not allowed, or null. Admins can't lock themselves
// out, and the last active admin account can't be removed.
const blockedAdminChange = async (req, target, removesAdmin) => {
  if (String(target._id) === req.user.id) return "You can't change or delete your own account here.";
  if (!removesAdmin || target.role !== "admin" || target.status !== "active") return null;
  const others = await User.countDocuments({ _id: { $ne: target._id }, role: "admin", status: "active" });
  return others ? null : "At least one active admin account must remain.";
};

const withoutInternals = (u) => {
  delete u.tokensValidAfter;
  return u;
};

router.get("/users/export", requirePermission("users:read", "submissions:export"), async (req, res) => {
  try {
    const rows = await User.find(userQuery(req.query)).sort(sortFor(req.query)).limit(10000).lean();
    const lines = [USERS.csv.join(",")];
    for (const row of rows) lines.push(USERS.csv.map((f) => csvCell(row[f])).join(","));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
    res.send(lines.join("\r\n"));
  } catch (error) {
    console.error("Error exporting users:", error.message);
    res.status(500).json({ message: "Failed to export" });
  }
});

router.get("/users", requirePermission("users:read"), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const query = userQuery(req.query);
    const [items, total] = await Promise.all([
      User.find(query).sort(sortFor(req.query)).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    const ids = items.map((u) => u._id);
    const [donations, requests] = await Promise.all([countBy(FoodDonation, ids), countBy(FoodRequest, ids)]);
    for (const u of items) {
      withoutInternals(u);
      u.donationCount = donations.get(String(u._id)) || 0;
      u.requestCount = requests.get(String(u._id)) || 0;
      u.isSelf = String(u._id) === req.user.id;
    }
    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    console.error("Error listing users:", error.message);
    res.status(500).json({ message: "Failed to fetch data" });
  }
});

router.patch("/users/:id", requirePermission("users:update"), validId, async (req, res) => {
  const update = {};
  if (req.body?.status !== undefined) {
    const status = str(req.body.status);
    if (!User.STATUSES.includes(status)) {
      return res.status(400).json({ message: "Status must be one of: " + User.STATUSES.join(", ") });
    }
    update.status = status;
  }
  if (req.body?.role !== undefined) {
    const role = str(req.body.role);
    if (!ROLES.includes(role)) return res.status(400).json({ message: "Role must be one of: " + ROLES.join(", ") });
    update.role = role;
  }
  if (!Object.keys(update).length) return res.status(400).json({ message: "Nothing to update" });

  try {
    const target = await User.findById(req.params.id).lean();
    if (!target) return res.status(404).json({ message: "Not found" });
    const removesAdmin = (update.role && update.role !== "admin") || (update.status && update.status !== "active");
    const blocked = await blockedAdminChange(req, target, removesAdmin);
    if (blocked) return res.status(409).json({ message: blocked });

    // Ending existing sessions makes role and suspension changes apply on every device.
    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { ...update, tokensValidAfter: new Date() } },
      { new: true, runValidators: true }
    ).lean();
    res.json(withoutInternals(doc));
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Failed to update" });
  }
});

router.delete("/users/:id", requirePermission("users:delete"), validId, async (req, res) => {
  try {
    const target = await User.findById(req.params.id).lean();
    if (!target) return res.status(404).json({ message: "Not found" });
    const blocked = await blockedAdminChange(req, target, true);
    if (blocked) return res.status(409).json({ message: blocked });

    await User.deleteOne({ _id: target._id });
    // Submissions stay for the food bank's records; they just become anonymous.
    await Promise.all(
      [FoodRequest, FoodDonation, Volunteer].map((M) => M.updateMany({ user: target._id }, { $set: { user: null } }))
    );
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Failed to delete" });
  }
});

router.get("/:type/export", requirePermission("submissions:export"), getCollection, async (req, res) => {
  try {
    const { cfg } = req;
    const rows = await cfg.Model.find(buildQuery(cfg, req.query))
      .sort(sortFor(req.query))
      .limit(10000)
      .lean();
    const lines = [cfg.csv.join(",")];
    for (const row of rows) lines.push(cfg.csv.map((f) => csvCell(row[f])).join(","));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="' + req.params.type + '.csv"');
    res.send(lines.join("\r\n"));
  } catch (error) {
    console.error("Error exporting:", error.message);
    res.status(500).json({ message: "Failed to export" });
  }
});

// ---- List with search / filter / pagination ----
router.get("/:type", requirePermission("submissions:read"), getCollection, async (req, res) => {
  try {
    const { cfg } = req;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const query = buildQuery(cfg, req.query);

    const [items, total] = await Promise.all([
      cfg.Model.find(query)
        .sort(sortFor(req.query))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      cfg.Model.countDocuments(query),
    ]);

    // Surface the default status for legacy documents that don't store one.
    if (cfg.statuses) for (const item of items) item.status = item.status || cfg.defaultStatus;
    await attachLinks(req.params.type, items);

    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    console.error("Error listing:", error.message);
    res.status(500).json({ message: "Failed to fetch data" });
  }
});

// ---- Update status / admin note ----
router.patch("/:type/:id", requirePermission("submissions:update"), getCollection, validId, async (req, res) => {
  const { cfg } = req;
  if (!cfg.statuses) return res.status(400).json({ message: "This collection cannot be edited" });

  const update = {};
  if (req.body?.status !== undefined) {
    const status = str(req.body.status);
    if (!cfg.statuses.includes(status)) {
      return res.status(400).json({ message: "Status must be one of: " + cfg.statuses.join(", ") });
    }
    update.status = status;
  }
  if (req.body?.adminNote !== undefined && "adminNote" in cfg.Model.schema.paths) {
    const note = str(req.body.adminNote);
    if (note.length > 300) return res.status(400).json({ message: "Note must be at most 300 characters" });
    update.adminNote = note;
  }
  const unset = {};
  if (req.body?.releaseClaim === true && cfg.Model === FoodDonation) {
    update.claimedBy = null;
    unset.claimedAt = 1;
  }
  if (!Object.keys(update).length) return res.status(400).json({ message: "Nothing to update" });

  try {
    const doc = await cfg.Model.findByIdAndUpdate(
      req.params.id,
      Object.keys(unset).length ? { $set: update, $unset: unset } : { $set: update },
      { new: true, runValidators: true }
    ).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    doc.status = doc.status || cfg.defaultStatus;
    await attachLinks(req.params.type, [doc]);
    res.json(doc);
  } catch (error) {
    console.error("Error updating:", error.message);
    res.status(500).json({ message: "Failed to update" });
  }
});

// ---- Delete ----
router.delete("/:type/:id", requirePermission("submissions:delete"), getCollection, validId, async (req, res) => {
  try {
    const doc = await req.cfg.Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (req.cfg.Model === FoodRequest) {
      await FoodDonation.updateMany({ claimedBy: doc._id }, { $set: { claimedBy: null }, $unset: { claimedAt: 1 } });
    }
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting:", error.message);
    res.status(500).json({ message: "Failed to delete" });
  }
});

module.exports = router;
