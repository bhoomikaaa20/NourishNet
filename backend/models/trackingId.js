const crypto = require("crypto");

// Unambiguous alphabet (no 0/O, 1/I) so codes are easy to read out or type.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateTrackingId = (prefix) => {
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${code}`;
};

module.exports = { generateTrackingId };
