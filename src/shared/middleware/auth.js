const jwt = require("jsonwebtoken");
const { createLogger } = require("../services/logger");

const log = createLogger("AuthMiddleware");

/**
 * Middleware: verifyToken
 * Validates the Bearer JWT from the Authorization header.
 * Attaches the decoded payload to req.admin on success.
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "Access denied. No token provided.",
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            log.warn("Expired token used", { ip: req.ip });
            return res.status(401).json({ success: false, error: "Token expired. Please login again." });
        }
        log.warn("Invalid token used", { ip: req.ip });
        return res.status(401).json({ success: false, error: "Invalid token." });
    }
};

module.exports = { verifyToken };
