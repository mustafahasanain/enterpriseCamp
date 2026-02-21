const { Router } = require("express");

const healthRouter = require("./features/health/router");
const authRouter = require("./features/auth/router");

const router = Router();

// ─── Feature Routes ────────────────────────────────────────────────────────
router.use("/", healthRouter);
router.use("/auth", authRouter);

module.exports = router;
