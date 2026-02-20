const { Router } = require("express");
const { login } = require("./controllers");

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Admin authentication
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Admin login
 *     description: >
 *       Authenticates the admin using credentials stored in `.env`
 *       (`ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`). Returns a signed JWT
 *       valid for the configured expiry period.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@enterprise.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SuperSecret123"
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 token:
 *                   type: string
 *                   description: Bearer JWT to use in Authorization header
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expiresIn:
 *                   type: string
 *                   example: "7d"
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Email and password are required"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 */
router.post("/login", login);

module.exports = router;
