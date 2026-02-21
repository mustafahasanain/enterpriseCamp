const { Router } = require("express");
const { adminLogin, validateToken, getAdminProfile } = require("./controllers");
const { createLogger } = require("../../shared/services/logger");

const router = Router();
const log = createLogger("Auth");

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 15;

const rateLimitMiddleware = (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!loginAttempts.has(clientIp)) {
        loginAttempts.set(clientIp, { count: 0, windowStart: now });
    }

    const record = loginAttempts.get(clientIp);

    // Reset window if expired
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
        record.count = 0;
        record.windowStart = now;
    }

    if (record.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.windowStart)) / 1000);

        log.warn("Rate limit exceeded", {
            action: "rate_limit_exceeded",
            ip_address: clientIp,
            attempts: record.count,
            timestamp: new Date().toISOString(),
        });

        return res.status(429).json({
            success: false,
            error: "Too many login attempts",
            message: "Please try again later",
            retryAfter,
        });
    }

    record.count++;
    next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Admin authentication endpoints
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Admin login (UC-001)
 *     description: Authenticates the admin using email and bcrypt-hashed password stored in environment variables. Returns a JWT token on success. Rate-limited to 15 attempts per 15 minutes.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful — JWT token returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLoginResponse'
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server or configuration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", rateLimitMiddleware, adminLogin);

/**
 * @swagger
 * /api/v1/auth/validate:
 *   get:
 *     summary: Validate JWT token
 *     description: Verifies the provided Bearer token and returns admin info if valid.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenValidationResponse'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/validate", validateToken);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get admin profile
 *     description: Returns admin profile details extracted from the JWT token.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminProfileResponse'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/profile", getAdminProfile);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Admin logout (UC-002)
 *     description: Stateless logout confirmation — JWT tokens are invalidated client-side by removing them from localStorage.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 */
router.post("/logout", (req, res) => {
    log.info("Admin logout", {
        action: "admin_logout",
        ip_address: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
        success: true,
        message: "Logout successful. Please remove the token from client storage.",
        timestamp: new Date().toISOString(),
    });
});

// ─── Route-Level Error Handler ────────────────────────────────────────────────
router.use((err, req, res, _next) => {
    log.error("Unhandled error in auth router", {
        action: "auth_router_error",
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
        success: false,
        error: "Authentication service error",
        message: "An unexpected error occurred",
    });
});

module.exports = router;
