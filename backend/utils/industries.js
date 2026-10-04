// The industries a company can say it is in. Companies may only use these exact names.
const INDUSTRIES = [
    "Information Technology",
    "Software Development",
    "IT Consulting & Services",
    "Banking & Finance",
    "E-commerce",
    "Telecommunications",
    "Electronics & Semiconductors",
    "Automobile",
    "Manufacturing",
    "Construction & Infrastructure",
    "Energy & Power",
    "Chemicals",
    "Healthcare & Pharma",
    "Education",
    "Aerospace & Defence",
    "Logistics & Supply Chain",
    "Media & Entertainment",
    "Consumer Goods (FMCG)",
    "Other"
];

const INDUSTRY_MESSAGE = `Industry must be one of: ${INDUSTRIES.join(", ")}`;

module.exports = { INDUSTRIES, INDUSTRY_MESSAGE };
