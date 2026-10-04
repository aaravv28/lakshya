const crypto = require("crypto");

// Server-made IDs for records people create through the app, e.g. "REC-3F9A1C7B".
const newId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

module.exports = { newId };
