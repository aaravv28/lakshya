const express = require("express");

const studentRoutes = require("./routes/studentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const placementOfficerRoutes = require("./routes/placementOfficerRoutes");
const projectRoutes = require("./routes/projectRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./routes/authRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const { authenticate } = require("./middleware/authMiddleware");

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/students", authenticate);
app.use("/api/companies", authenticate);
app.use("/api/recruiters", authenticate);
app.use("/api/jobs", authenticate);
app.use("/api/applications", authenticate);
app.use("/api/interviews", authenticate);
app.use("/api/placement-officers", authenticate);
app.use("/api/projects", authenticate);
app.use("/api/resumes", authenticate);
app.use("/api/notifications", authenticate);
app.use("/api/registration", authenticate);

app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/placement-officers", placementOfficerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/registration", registrationRoutes);

app.get("/", (req, res) => {
    res.send("Lakshya Backend is Running");
});

module.exports = app;
