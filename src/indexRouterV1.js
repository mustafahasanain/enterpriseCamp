const { Router } = require("express");
const authRouter = require("./features/auth");

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Server health check
 *     description: Returns server uptime and current timestamp to confirm the API is running.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *                   example: 42.5
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-02-20T23:58:00.000Z"
 */

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: Database health check
 *     description: Verifies the database connection by running a lightweight query (SELECT 1).
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: string
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-02-20T23:58:00.000Z"
 *       503:
 *         description: Database is unreachable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 database:
 *                   type: string
 *                   example: disconnected
 *                 message:
 *                   type: string
 *                   example: "Connection refused"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * API v1 Router
 * @param {import("@prisma/client").PrismaClient} prisma
 */
module.exports = (prisma) => {
    const router = Router();

    // ─── Server Health Check ──────────────────────────────
    router.get("/health", (_req, res) => {
        res.json({
            status: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    });

    // ─── Database Health Check ────────────────────────────
    router.get("/health/db", async (_req, res) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            res.json({
                status: "ok",
                database: "connected",
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error("[DB HEALTH]", error.message);
            res.status(503).json({
                status: "error",
                database: "disconnected",
                message: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    });

    // ─── Feature Routers ──────────────────────────────────
    router.use("/auth", authRouter);

    return router;
};
