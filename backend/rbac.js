// Role-based access control. Roles map to explicit permissions; routes check
// permissions (never role names) so a role can be adjusted in one place.
const ROLES = ["user", "admin"];

const USER_PERMISSIONS = [
  "profile:read",
  "profile:update",
  "submissions:own:read", // the user's own donations and requests
  "submissions:own:cancel", // withdraw own pending donations/requests
];

const ADMIN_PERMISSIONS = [
  ...USER_PERMISSIONS,
  "dashboard:read",
  "submissions:read", // every request, donation, message, volunteer, subscriber
  "submissions:update",
  "submissions:delete",
  "submissions:export",
  "users:read",
  "users:update", // change role / suspend
  "users:delete",
];

const PERMISSIONS = {
  user: USER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

// Roles edited by hand in the database may carry stray case or spaces ("Admin ").
const normalizeRole = (role) => (typeof role === "string" ? role.trim().toLowerCase() : "");

const permissionsFor = (role) => {
  const r = normalizeRole(role);
  return Object.prototype.hasOwnProperty.call(PERMISSIONS, r) ? PERMISSIONS[r] : [];
};
const hasPermission = (role, permission) => permissionsFor(role).includes(permission);

// Must run after authentication middleware has set req.user.
const requirePermission = (...required) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });
  if (!required.every((p) => hasPermission(req.user.role, p))) {
    return res.status(403).json({ message: "You don't have permission to do that." });
  }
  next();
};

module.exports = { ROLES, PERMISSIONS, normalizeRole, permissionsFor, hasPermission, requirePermission };
