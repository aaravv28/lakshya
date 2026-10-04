const PlacementOfficer = require("../models/PlacementOfficer");

const getPlacementOfficers = async (req, res) => {
    try {
        const officers = await PlacementOfficer.find();
        res.status(200).json(officers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPlacementOfficerById = async (req, res) => {
    try {
        const officer = await PlacementOfficer.findOne({ officerId: req.params.officerId });

        if (!officer) {
            return res.status(404).json({ message: "Placement officer not found" });
        }

        res.status(200).json(officer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPlacementOfficer = async (req, res) => {
    try {
        const officer = new PlacementOfficer(req.body);
        const savedOfficer = await officer.save();
        res.status(201).json(savedOfficer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updatePlacementOfficer = async (req, res) => {
    try {
        const officer = await PlacementOfficer.findOneAndUpdate(
            { officerId: req.params.officerId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!officer) {
            return res.status(404).json({ message: "Placement officer not found" });
        }

        res.status(200).json(officer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deletePlacementOfficer = async (req, res) => {
    try {
        const officer = await PlacementOfficer.findOneAndDelete({ officerId: req.params.officerId });

        if (!officer) {
            return res.status(404).json({ message: "Placement officer not found" });
        }

        res.status(200).json({ message: "Placement officer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPlacementOfficers,
    getPlacementOfficerById,
    createPlacementOfficer,
    updatePlacementOfficer,
    deletePlacementOfficer
};
