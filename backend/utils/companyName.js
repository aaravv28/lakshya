// Two companies never share a name: compare names trimmed, with inner spaces collapsed and in lowercase.
const companyNameKey = (name) => String(name || "").trim().replace(/\s+/g, " ").toLowerCase();

module.exports = { companyNameKey };
