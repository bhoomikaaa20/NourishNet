// Usage:
//   node generate.js              -> prints a random JWT secret for SECRET_KEY
//   node generate.js hash <pass>  -> prints a bcrypt hash for ADMIN_PASSWORD_HASH
const crypto = require("crypto");

if (process.argv[2] === "hash") {
  const password = process.argv[3];
  if (!password) {
    console.error("Usage: node generate.js hash <password>");
    process.exit(1);
  }
  const bcrypt = require("bcryptjs");
  console.log(`ADMIN_PASSWORD_HASH=${bcrypt.hashSync(password, 10)}`);
} else {
  console.log(`SECRET_KEY=${crypto.randomBytes(64).toString("hex")}`);
}
