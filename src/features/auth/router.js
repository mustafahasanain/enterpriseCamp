const { Router } = require("express");
const { adminLogin, validateToken, getAdminProfile } = require("./controllers");

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Admin authentication endpoints
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Admin login (UC-001)
 *     description: Authenticates the admin using email and bcrypt-hashed password. Returns a JWT token on success.
 *     tags: [Auth]
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
 *       500:
 *         description: Server or configuration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", adminLogin);

/**
 * @swagger
 * /api/v1/auth/validate:
 *   get:
 *     summary: Validate JWT token
 *     description: Verifies the provided Bearer token and returns admin info if valid.
 *     tags: [Auth]
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
 *     tags: [Auth]
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

module.exports = router;
