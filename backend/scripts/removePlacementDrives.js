// One-off cleanup: placement drives were removed from the app.
//
// - Deletes the placement drives collections (both spellings exist in older databases).
// - Removes the driveId field from every job.
//
// Shows the plan and changes nothing unless run with --apply:
//   node scripts/removePlacementDrives.js           (dry run)
//   node scripts/removePlacementDrives.js --apply   (make the changes)

const dotenv = require("dotenv");
const mongoose = require("mongoose");

const DRIVES_COLLECTIONS = ["placementDrives", "placementdrives"];

const planCleanup = async (db) => {
    const existing = await db.listCollections({ name: { $in: DRIVES_COLLECTIONS } }).toArray();
    const collections = [];
    for (const { name } of existing) collections.push({ name, drives: await db.collection(name).countDocuments() });
    const jobsWithDrive = await db.collection("jobs").countDocuments({ driveId: { $exists: true } });
    return { collections, jobsWithDrive };
};

const applyCleanup = async (db, plan) => {
    for (const { name } of plan.collections) await db.collection(name).drop();
    if (plan.jobsWithDrive) await db.collection("jobs").updateMany({ driveId: { $exists: true } }, { $unset: { driveId: "" } });
};

const run = async () => {
    dotenv.config({ quiet: true });
    const apply = process.argv.includes("--apply");
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const plan = await planCleanup(db);
    if (!plan.collections.length && !plan.jobsWithDrive) {
        console.log("Nothing to clean up.");
        return;
    }
    for (const { name, drives } of plan.collections) console.log(`delete the ${name} collection (${drives} drives)`);
    if (plan.jobsWithDrive) console.log(`remove driveId from ${plan.jobsWithDrive} jobs`);

    if (!apply) {
        console.log("\nDry run: nothing was changed. Re-run with --apply to make these changes.");
        return;
    }

    await applyCleanup(db, plan);
    console.log("\nCleanup applied.");
};

if (require.main === module) {
    run()
        .catch((error) => {
            console.error("Cleanup failed:", error.message);
            process.exitCode = 1;
        })
        .finally(() => mongoose.disconnect());
}

module.exports = { planCleanup, applyCleanup };
