const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../shared/config");

/**
 * POST /api/v1/auth/login
 * Validates admin credentials from .env and returns a JWT.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ status: "error", message: "Email and password are required" });
        }

        // Compare against .env admin credentials (no DB query)
        if (email !== config.admin.email) {
            return res
                .status(401)
                .json({ status: "error", message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, config.admin.passwordHash);
        if (!isMatch) {
            return res
                .status(401)
                .json({ status: "error", message: "Invalid credentials" });
        }

        const token = jwt.sign({ email, role: "admin" }, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        });

        res.json({
            status: "ok",
            token,
            expiresIn: config.jwt.expiresIn,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { login };
