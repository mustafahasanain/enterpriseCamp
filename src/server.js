require("dotenv").config(); // Loads root .env automatically

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const prisma = require("./db/prisma");
const swaggerSpec = require("./shared/config/swagger");

const v1Router = require("./indexRouterV1");

// ─── Express App ──────────────────────────────────────────
const app = express();

// ─── Swagger UI (before helmet so CSP doesn't block it) ───
app.use(
    "/api-docs",
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "Enterprise Camp API Docs",
    })
);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────
app.use("/api/v1", v1Router(prisma));

// ─── 404 Handler ──────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ status: "error", message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error("[ERROR]", err.message);
    res.status(err.status || 500).json({
        status: "error",
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
