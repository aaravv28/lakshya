const { verifyToken } = require("../config/auth");

const authenticate = (req, res, next) => {
    const header = req.get("Authorization");

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const token = header.slice(7).trim();
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const payload = verifyToken(token);
        req.user = { id: payload.sub, role: payload.role };
        next();
    } catch (error) {
        const message = error.name === "TokenExpiredError" ? "Authentication token expired" : "Invalid authentication token";
        return res.status(401).json({ message });
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "You are not authorized for this action" });
    }

    next();
};

const authorizeSelf = (parameterName) => (req, res, next) => {
    if (req.user.role !== "student" || req.user.id !== req.params[parameterName]) {
        return res.status(403).json({ message: "You can only manage your own account" });
    }
    next();
};

const authorizeSelfOrRoles = (parameterName, ...roles) => (req, res, next) => {
    if (roles.includes(req.user.role) || (req.user.role === "student" && req.user.id === req.params[parameterName])) {
        return next();
    }
    return res.status(403).json({ message: "You are not authorized for this account" });
};

module.exports = { authenticate, authorize, authorizeSelf, authorizeSelfOrRoles };
