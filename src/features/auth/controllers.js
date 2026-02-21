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
            message: "Please provide both email and password",
        });
    }

    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        const jwtSecret = process.env.JWT_SECRET;
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";

        // Guard: env vars must be configured
        if (!adminEmail || !adminPasswordHash || !jwtSecret) {
            log.error("Missing environment variables", {
                action: "admin_login_config_error",
                timestamp: new Date().toISOString(),
            });
            return res.status(500).json({
                success: false,
                error: "Authentication service unavailable",
                message: "Server configuration error",
            });
        }

        // Check email — use generic message to avoid leaking which field failed (BR-002)
        if (email !== adminEmail) {
            log.warn("Failed login — email mismatch", {
                action: "admin_login_failed",
                ip_address: clientIp,
                timestamp: new Date().toISOString(),
            });
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
                message: "Please check your email and password",
            });
        }

        // Verify password with bcrypt
        const passwordValid = await bcrypt.compare(password, adminPasswordHash);

        if (!passwordValid) {
            log.warn("Failed login — password mismatch", {
                action: "admin_login_failed",
                ip_address: clientIp,
                timestamp: new Date().toISOString(),
            });
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
                message: "Please check your email and password",
            });
        }

        // Generate JWT (UC-001 step 9)
        const token = jwt.sign(
            { email: adminEmail, role: "admin" },
            jwtSecret,
            { expiresIn: jwtExpiresIn }
        );

        log.info("Admin login successful", {
            action: "admin_login_success",
            ip_address: clientIp,
            timestamp: new Date().toISOString(),
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            expiresIn: jwtExpiresIn,
            admin: {
                email: adminEmail,
                role: "admin",
            },
        });

    } catch (err) {
        log.error("Error during authentication", {
            action: "admin_login_error",
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString(),
        });
        return res.status(500).json({
            success: false,
            error: "Authentication service error",
            message: "An unexpected error occurred",
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
            message: "Authorization header with Bearer token is required",
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).json({
            success: true,
            message: "Token is valid",
            admin: {
                email: decoded.email,
                role: decoded.role,
            },
            expiresAt: new Date(decoded.exp * 1000).toISOString(),
        });

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: "Token expired",
                message: "Please login again to get a new token",
            });
        }
        return res.status(401).json({
            success: false,
            error: "Invalid token",
            message: "The provided token is not valid",
        });
    }
};

// ─── Get Admin Profile ────────────────────────────────────────────────────────
const getAdminProfile = (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "No token provided",
            message: "Authorization header with Bearer token is required",
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).json({
            success: true,
            message: "Admin profile retrieved successfully",
            admin: {
                email: decoded.email,
                role: decoded.role,
                loginTime: new Date(decoded.iat * 1000).toISOString(),
                expiresAt: new Date(decoded.exp * 1000).toISOString(),
            },
        });

    } catch (err) {
        return res.status(401).json({
            success: false,
            error: "Invalid or expired token",
            message: "Please login again",
        });
    }
};

module.exports = { adminLogin, validateToken, getAdminProfile };
