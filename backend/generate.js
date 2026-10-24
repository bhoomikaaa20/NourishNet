// Usage:
//   node generate.js                         -> prints a random JWT secret for SECRET_KEY
//   node generate.js hash <pass>             -> prints a bcrypt hash for ADMIN_PASSWORD_HASH
//   node generate.js promote <email> [role]  -> sets an existing account's role (default: admin; use "user" to demote)
const crypto = require("crypto");

if (process.argv[2] === "hash") {
  const password = process.argv[3];
  if (!password) {
    console.error("Usage: node generate.js hash <password>");
    process.exit(1);
  }
  const bcrypt = require("bcryptjs");
  console.log(`ADMIN_PASSWORD_HASH=${bcrypt.hashSync(password, 10)}`);
} else if (process.argv[2] === "promote") {
  require("dotenv").config();
  const mongoose = require("mongoose");
  const User = require("./models/userModel");
  const { ROLES } = require("./rbac");
  const email = (process.argv[3] || "").trim().toLowerCase();
  const role = process.argv[4] || "admin";
  if (!email || !ROLES.includes(role) || !process.env.MONGO_URL) {
    console.error(`Usage: node generate.js promote <email> [${ROLES.join("|")}]   (needs MONGO_URL)`);
    process.exit(1);
  }
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => User.findOneAndUpdate({ email }, { $set: { role, tokensValidAfter: new Date() } }, { new: true }))
    .then((user) => {
      console.log(user ? `${user.email} is now ${user.role}.` : `No account found for ${email}. Register it on the site first.`);
      process.exitCode = user ? 0 : 1;
    })
    .catch((err) => {
      console.error("Failed:", err.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
} else {
  console.log(`SECRET_KEY=${crypto.randomBytes(64).toString("hex")}`);
}
