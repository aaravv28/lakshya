// One-off clean-up for company industries saved before they came from a fixed list.
//
// - Renames each company's industry to the proper name on the list when it differs only in capitals
//   or spacing ("information technology" -> "Information Technology"), and applies the renames below.
// - Stops without changing anything if any industry can't be recognised. Approved companies can't be
//   edited in the app, so add a rename for it below and run again.
//
// Shows the plan and changes nothing unless run with --apply:
//   node scripts/fixIndustries.js           (dry run)
//   node scripts/fixIndustries.js --apply   (make the changes)

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { INDUSTRIES } = require("../utils/industries");
const { properNameFinder } = require("../utils/properName");

// Old industries that aren't a spelling variant of one on the list, with the industry agreed for them.
const RENAMES = {
    "Software and Consulting": "E-commerce" // Amazon, agreed 2026-10-04
};

const properIndustry = properNameFinder(INDUSTRIES, RENAMES);

const planIndustryFix = async (db) => {
    const problems = [];
    const companies = [];
    for (const company of await db.collection("companies").find({}, { projection: { companyId: 1, companyName: 1, industry: 1 } }).toArray()) {
        const owner = `company ${company.companyId} (${company.companyName})`;
        const industry = properIndustry(company.industry);
        if (!company.industry) problems.push(`${owner} has no industry`);
        else if (!industry) problems.push(`${owner} has unknown industry "${company.industry}"`);
        else if (industry !== company.industry) companies.push({ _id: company._id, companyId: company.companyId, from: company.industry, industry });
    }
    return { companies, problems };
};

const applyIndustryFix = async (db, plan) => {
    for (const company of plan.companies) {
        await db.collection("companies").updateOne({ _id: company._id }, { $set: { industry: company.industry } });
    }
};

const run = async () => {
    dotenv.config({ quiet: true });
    const apply = process.argv.includes("--apply");
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const plan = await planIndustryFix(db);
    if (plan.problems.length) {
        console.log(`Not safe to fix, nothing was changed:\n- ${plan.problems.join("\n- ")}\nAdd a rename for these at the top of this script, then run it again.`);
        process.exitCode = 1;
        return;
    }
    if (!plan.companies.length) {
        console.log("Nothing to fix: every industry is already on the list.");
        return;
    }
    for (const company of plan.companies) console.log(`company ${company.companyId}: "${company.from}" -> "${company.industry}"`);

    if (!apply) {
        console.log("\nDry run: nothing was changed. Re-run with --apply to make these changes.");
        return;
    }

    await applyIndustryFix(db, plan);
    console.log("\nIndustries fixed.");
};

if (require.main === module) {
    run()
        .catch((error) => {
            console.error("Fix failed:", error.message);
            process.exitCode = 1;
        })
        .finally(() => mongoose.disconnect());
}

module.exports = { planIndustryFix, applyIndustryFix };
