const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createLogger } = require("../../shared/services/logger");

const log = createLogger("Auth");

// ─── Admin Login ──────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: "Email and password are required",
        });
    }

    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        const jwtSecret = process.env.JWT_SECRET;
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";

        // Guard: env vars must be configured
        if (!adminEmail || !adminPasswordHash || !jwtSecret) {
            log.error("Missing admin credentials or JWT secret in environment");
            return res.status(500).json({
                success: false,
                error: "An error occurred during authentication",
            });
        }

        // Check email — always use generic message to avoid leaking which field failed (BR-002)
        if (email !== adminEmail) {
            log.warn("Failed login attempt — invalid email", { email, ip: clientIp });
            return res.status(401).json({
                success: false,
                error: "Invalid email or password",
            });
        }

        // Verify password with bcrypt
        const passwordValid = await bcrypt.compare(password, adminPasswordHash);

        if (!passwordValid) {
            log.warn("Failed login attempt — invalid password", { email, ip: clientIp });
            return res.status(401).json({
                success: false,
                error: "Invalid email or password",
            });
        }

        // Generate JWT token (UC-001 step 9)
        const token = jwt.sign(
            { email: adminEmail, role: "admin" },
            jwtSecret,
            { expiresIn: jwtExpiresIn }
        );

        log.info("Admin login successful", { admin: adminEmail, ip: clientIp });

        return res.status(200).json({
            success: true,
            token,
            expiresIn: jwtExpiresIn,
        });

    } catch (error) {
        log.error("Error during authentication", { error: error.message, stack: error.stack });
        return res.status(500).json({
            success: false,
            error: "An error occurred during authentication",
        });
    }
};

// ─── Validate Token ───────────────────────────────────────────────────────────
const validateToken = (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "No token provided",
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).json({
            success: true,
            admin: {
                email: decoded.email,
                role: decoded.role,
            },
            expiresAt: new Date(decoded.exp * 1000).toISOString(),
        });

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, error: "Token expired" });
        }
        return res.status(401).json({ success: false, error: "Invalid token" });
    }
};

// ─── Get Admin Profile ────────────────────────────────────────────────────────
const getAdminProfile = (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "No token provided",
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).json({
            success: true,
            admin: {
                email: decoded.email,
                role: decoded.role,
                loginTime: new Date(decoded.iat * 1000).toISOString(),
                expiresAt: new Date(decoded.exp * 1000).toISOString(),
            },
        });

    } catch (error) {
        return res.status(401).json({
            success: false,
            error: "Invalid or expired token",
        });
    }
};

module.exports = { adminLogin, validateToken, getAdminProfile };
