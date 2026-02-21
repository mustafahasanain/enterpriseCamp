require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./shared/config/swagger");
const logger = require("./shared/services/logger");
const prisma = require("./db/prisma");

const v1Router = require("./indexRouterV1");

// ─── Express App ──────────────────────────────────────────
const app = express();

// ─── Security & Parsing Middleware ────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ──────────────────────────────────────
app.use((req, _res, next) => {
    logger.http(`${req.method} ${req.url}`, { ip: req.ip });
    next();
});

// ─── Swagger UI ───────────────────────────────────────────
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: "Enterprise Camp API Docs",
    })
);

// ─── Routes ───────────────────────────────────────────────
app.use("/api/v1", v1Router);

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found", path: req.originalUrl });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, _req, res, _next) => {
    logger.error("Unhandled error", { error: err.message, stack: err.stack });
    res.status(err.status || 500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal server error"
                : err.message,
    });
});

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n🚀  Server running on http://localhost:${PORT}`);
    console.log(`📡  Health:    http://localhost:${PORT}/api/v1/health`);
    console.log(`🗄️   DB Health: http://localhost:${PORT}/api/v1/health/db`);
    console.log(`🔐  Auth:      http://localhost:${PORT}/api/v1/auth/login`);
    console.log(`🛡️   Admin:     http://localhost:${PORT}/api/v1/admin/me`);
    console.log(`📖  API Docs:  http://localhost:${PORT}/api-docs\n`);
});

// ─── Graceful Shutdown ────────────────────────────────────
const shutdown = async () => {
    console.log("\n🛑  Shutting down gracefully...");
    await prisma.$disconnect();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = app;
