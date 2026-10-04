// One-off migration for company registrations.
//
// - Marks every recruiter that has no registration status as Approved
//   (they were added by the placement officer before self-registration existed)
//   and removes the old `verified` flag.
// - Gives every company its name key, so two companies can never share a name.
// - Stops without changing anything if two companies already share a name.
//
// Shows the plan and changes nothing unless run with --apply:
//   node scripts/approveExistingRecruiters.js           (dry run)
//   node scripts/approveExistingRecruiters.js --apply   (make the changes)

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { companyNameKey } = require("../utils/companyName");

const planApproval = async (db) => {
    const recruiters = await db.collection("recruiters")
        .find({ registrationStatus: { $exists: false } }, { projection: { recruiterId: 1, companyId: 1 } })
        .toArray();

    const allCompanies = await db.collection("companies").find({}, { projection: { companyId: 1, companyName: 1, nameKey: 1 } }).toArray();
    const companies = allCompanies
        .map((company) => ({ _id: company._id, companyId: company.companyId, companyName: company.companyName, nameKey: companyNameKey(company.companyName), current: company.nameKey }))
        .filter((company) => company.nameKey !== company.current);

    const problems = [];
    const byKey = new Map();
    for (const company of allCompanies) {
        const key = companyNameKey(company.companyName);
        byKey.set(key, [...(byKey.get(key) || []), company.companyId]);
    }
    for (const [key, ids] of byKey) {
        if (ids.length > 1) problems.push(`companies ${ids.join(", ")} share the name "${key}"`);
    }

    return { recruiters, companies, problems };
};

const applyApproval = async (db, plan) => {
    for (const recruiter of plan.recruiters) {
        await db.collection("recruiters").updateOne({ _id: recruiter._id }, { $set: { registrationStatus: "Approved" }, $unset: { verified: "" } });
    }
    for (const company of plan.companies) {
        await db.collection("companies").updateOne({ _id: company._id }, { $set: { nameKey: company.nameKey } });
    }
};

const run = async () => {
    dotenv.config({ quiet: true });
    const apply = process.argv.includes("--apply");
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const plan = await planApproval(db);
    if (plan.problems.length) {
        console.log(`Not safe to migrate:\n- ${plan.problems.join("\n- ")}`);
        process.exitCode = 1;
        return;
    }
    if (!plan.recruiters.length && !plan.companies.length) {
        console.log("Nothing to migrate.");
        return;
    }
    for (const recruiter of plan.recruiters) console.log(`recruiter ${recruiter.recruiterId} (company ${recruiter.companyId}) -> Approved`);
    for (const company of plan.companies) console.log(`company ${company.companyId} "${company.companyName}" -> name key "${company.nameKey}"`);

    if (!apply) {
        console.log("\nDry run: nothing was changed. Re-run with --apply to make these changes.");
        return;
    }

    await applyApproval(db, plan);
    console.log("\nMigration applied.");
};

if (require.main === module) {
    run()
        .catch((error) => {
            console.error("Migration failed:", error.message);
            process.exitCode = 1;
        })
        .finally(() => mongoose.disconnect());
}

module.exports = { planApproval, applyApproval };
