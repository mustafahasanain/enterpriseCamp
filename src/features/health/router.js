const { Router } = require("express");
const prisma = require("../../db/prisma");
const { createLogger } = require("../../shared/services/logger");

const router = Router();
const log = createLogger("Health");

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Server health check
 *     description: Returns server uptime and timestamp to confirm the API is running.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/health", (_req, res) => {
    log.info("Server health check requested");
    res.status(200).json({
        success: true,
        message: "Server is running",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

/**
 * @swagger
 * /api/v1/health/db:
 *   get:
 *     summary: Database health check
 *     description: Verifies the database connection by running a lightweight query.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is connected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatabaseHealthResponse'
 *       503:
 *         description: Database is unreachable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/health/db", async (_req, res) => {
    log.info("Database health check requested");
    try {
        await prisma.$queryRaw`SELECT 1`;
        log.info("Database health check passed");
        res.status(200).json({
            success: true,
            message: "Database connection is healthy",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        log.error("Database health check failed", error);
        res.status(503).json({
            success: false,
            message: "Database connection failed",
            error: process.env.NODE_ENV === "development" ? error.message : "Service unavailable",
            timestamp: new Date().toISOString(),
        });
    }
});

module.exports = router;
