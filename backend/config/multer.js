const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const RESUME_STORAGE_DIR = path.join(__dirname, "..", "uploads", "resumes");

fs.mkdirSync(RESUME_STORAGE_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, RESUME_STORAGE_DIR);
    },
    filename: (_req, file, callback) => {
        const ext = path.extname(file.originalname || "").toLowerCase() || ".pdf";
        const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
        callback(null, uniqueName);
    }
});

const fileFilter = (_req, file, callback) => {
    const allowedMimeType = file.mimetype === "application/pdf";
    const allowedExtension = (file.originalname || "").toLowerCase().endsWith(".pdf");

    if (allowedMimeType || allowedExtension) {
        callback(null, true);
        return;
    }

    callback(new Error("Only PDF files are allowed"));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const safeDeleteLocalResumeFile = (storedFileName) => {
    if (!storedFileName || typeof storedFileName !== "string") {
        return;
    }

    const targetPath = path.resolve(RESUME_STORAGE_DIR, storedFileName);
    const basePath = path.resolve(RESUME_STORAGE_DIR);

    if (targetPath !== basePath && !targetPath.startsWith(`${basePath}${path.sep}`)) {
        return;
    }

    if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
    }
};

module.exports = {
    RESUME_STORAGE_DIR,
    upload,
    safeDeleteLocalResumeFile
};
