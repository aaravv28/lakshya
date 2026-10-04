const express = require("express");
const router = express.Router();

const {
    getPlacementOfficers,
    getPlacementOfficerById,
    createPlacementOfficer,
    updatePlacementOfficer,
    deletePlacementOfficer
} = require("../controllers/placementOfficerController");
const { authorize } = require("../middleware/authMiddleware");

router.get("/", getPlacementOfficers);
router.get("/:officerId", getPlacementOfficerById);
router.post("/", authorize("officer"), createPlacementOfficer);
router.put("/:officerId", authorize("officer"), updatePlacementOfficer);
router.delete("/:officerId", authorize("officer"), deletePlacementOfficer);

module.exports = router;
