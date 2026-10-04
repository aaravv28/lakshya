const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB Connected");
        const Recruiter = require("./models/Recruiter");
        const unmigrated = await Recruiter.countDocuments({ registrationStatus: { $exists: false } });
        if (unmigrated) {
            console.warn(`${unmigrated} recruiter(s) have no registration status, so their companies and jobs are hidden. Run: node scripts/approveExistingRecruiters.js --apply`);
        }
    })
    .catch((error) => {
        console.log("MongoDB Connection Error:", error);
    });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});