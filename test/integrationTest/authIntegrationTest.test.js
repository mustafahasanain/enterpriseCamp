/**
 * Integration Tests — Auth Routes (Happy Path Only)
 * UC-001: Admin Authentication and Login
 *
 * Uses supertest to make real HTTP requests against the Express app.
 * Auth routes read credentials from env vars — no database required.
 */

const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../src/server");

describe("Auth Routes — Happy Path Scenarios", () => {
    let authToken;

    beforeAll(async () => {
        // Generate a real bcrypt hash so the controller can verify it
        const hash = await bcrypt.hash("admin123", 10);

        process.env.ADMIN_EMAIL = "admin@enterprise.com";
        process.env.ADMIN_PASSWORD_HASH = hash;
        process.env.JWT_SECRET = "integration-test-secret";
        process.env.JWT_EXPIRES_IN = "24h";
    });

    afterAll(async () => {
        delete process.env.ADMIN_EMAIL;
        delete process.env.ADMIN_PASSWORD_HASH;
        delete process.env.JWT_SECRET;
        delete process.env.JWT_EXPIRES_IN;
    });

    // ─── POST /api/v1/auth/login ──────────────────────────────────────────────
    describe("POST /api/v1/auth/login — Happy Path", () => {
        test("should return 200 with a JWT token on valid credentials", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: "admin@enterprise.com", password: "admin123" });

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                success: true,
                message: "Login successful",
                expiresIn: "24h",
                admin: { email: "admin@enterprise.com", role: "admin" },
            });
            expect(res.body.token).toBeDefined();
            expect(typeof res.body.token).toBe("string");

            // Store token for subsequent tests
            authToken = res.body.token;
        });
    });

    // ─── GET /api/v1/auth/validate ────────────────────────────────────────────
    describe("GET /api/v1/auth/validate — Happy Path", () => {
        test("should return 200 with admin info for a valid Bearer token", async () => {
            const res = await request(app)
                .get("/api/v1/auth/validate")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                success: true,
                message: "Token is valid",
                admin: { email: "admin@enterprise.com", role: "admin" },
            });
            expect(res.body.expiresAt).toBeDefined();
        });
    });

    // ─── GET /api/v1/auth/profile ─────────────────────────────────────────────
    describe("GET /api/v1/auth/profile — Happy Path", () => {
        test("should return 200 with full admin profile for a valid Bearer token", async () => {
            const res = await request(app)
                .get("/api/v1/auth/profile")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                success: true,
                message: "Admin profile retrieved successfully",
                admin: { email: "admin@enterprise.com", role: "admin" },
            });
            expect(res.body.admin.loginTime).toBeDefined();
            expect(res.body.admin.expiresAt).toBeDefined();
        });
    });

    // ─── POST /api/v1/auth/logout ─────────────────────────────────────────────
    describe("POST /api/v1/auth/logout — Happy Path", () => {
        test("should return 200 with logout confirmation", async () => {
            const res = await request(app)
                .post("/api/v1/auth/logout")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                success: true,
                message: "Logout successful. Please remove the token from client storage.",
            });
            expect(res.body.timestamp).toBeDefined();
        });
    });
});
