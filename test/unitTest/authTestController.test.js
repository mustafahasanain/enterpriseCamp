/**
 * Unit Tests — Auth Controllers (Happy Path Scenarios)
 * UC-001: Admin Authentication and Login
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { adminLogin, validateToken, getAdminProfile } = require("../../src/features/auth/controllers");

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

jest.mock("../../src/shared/services/logger", () => ({
    createLogger: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    }),
}));

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe("Auth Controllers — Happy Path Scenarios", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            body: {},
            headers: {},
            ip: "127.0.0.1",
            connection: { remoteAddress: "127.0.0.1" },
            get: jest.fn(() => "Mozilla/5.0 Test Browser"),
        };

        mockRes = {
            status: jest.fn(() => mockRes),
            json: jest.fn(() => mockRes),
        };

        process.env.ADMIN_EMAIL = "admin@enterprise.com";
        process.env.ADMIN_PASSWORD_HASH = "$2a$10$hashedPasswordExample";
        process.env.JWT_SECRET = "test-jwt-secret";
        process.env.JWT_EXPIRES_IN = "24h";
    });

    afterEach(() => {
        delete process.env.ADMIN_EMAIL;
        delete process.env.ADMIN_PASSWORD_HASH;
        delete process.env.JWT_SECRET;
        delete process.env.JWT_EXPIRES_IN;
    });

    // ─── adminLogin ───────────────────────────────────────────────────────────
    describe("adminLogin — Happy Path", () => {
        test("should return 200 with token and admin info on valid credentials", async () => {
            // Arrange
            const mockToken = "mock-jwt-token-12345";
            mockReq.body = { email: "admin@enterprise.com", password: "admin123" };

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue(mockToken);

            // Act
            await adminLogin(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Login successful",
                token: mockToken,
                expiresIn: "24h",
                admin: { email: "admin@enterprise.com", role: "admin" },
            });
        });

        test("should call bcrypt.compare with the submitted password and stored hash", async () => {
            // Arrange
            mockReq.body = { email: "admin@enterprise.com", password: "admin123" };

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("mock-token");

            // Act
            await adminLogin(mockReq, mockRes);

            // Assert
            expect(bcrypt.compare).toHaveBeenCalledWith(
                "admin123",
                "$2a$10$hashedPasswordExample"
            );
        });

        test("should default to 24h expiry when JWT_EXPIRES_IN is not set", async () => {
            // Arrange
            delete process.env.JWT_EXPIRES_IN;

            mockReq.body = { email: "admin@enterprise.com", password: "admin123" };
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("mock-token");

            // Act
            await adminLogin(mockReq, mockRes);

            // Assert
            expect(jwt.sign).toHaveBeenCalledWith(
                expect.any(Object),
                "test-jwt-secret",
                { expiresIn: "24h" }
            );
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ expiresIn: "24h" })
            );
        });
    });

    // ─── validateToken ────────────────────────────────────────────────────────
    describe("validateToken — Happy Path", () => {
        test("should return 200 with admin info for a valid Bearer token", () => {
            // Arrange
            const decoded = {
                email: "admin@enterprise.com",
                role: "admin",
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 86400,
            };

            mockReq.headers.authorization = "Bearer valid-jwt-token";
            jwt.verify.mockReturnValue(decoded);

            // Act
            validateToken(mockReq, mockRes);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith("valid-jwt-token", "test-jwt-secret");
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Token is valid",
                admin: { email: decoded.email, role: decoded.role },
                expiresAt: new Date(decoded.exp * 1000).toISOString(),
            });
        });

        test("should correctly return expiresAt from the token exp field", () => {
            // Arrange
            const specificExp = 1673136000; // 2023-01-08 00:00:00 UTC

            mockReq.headers.authorization = "Bearer another-valid-token";
            jwt.verify.mockReturnValue({
                email: "admin@enterprise.com",
                role: "admin",
                iat: 1672531200,
                exp: specificExp,
            });

            // Act
            validateToken(mockReq, mockRes);

            // Assert
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    expiresAt: "2023-01-08T00:00:00.000Z",
                })
            );
        });
    });

    // ─── getAdminProfile ──────────────────────────────────────────────────────
    describe("getAdminProfile — Happy Path", () => {
        test("should return 200 with full admin profile for a valid Bearer token", () => {
            // Arrange
            const decoded = {
                email: "admin@enterprise.com",
                role: "admin",
                iat: Math.floor(Date.now() / 1000) - 3600,
                exp: Math.floor(Date.now() / 1000) + 82800,
            };

            mockReq.headers.authorization = "Bearer valid-profile-token";
            jwt.verify.mockReturnValue(decoded);

            // Act
            getAdminProfile(mockReq, mockRes);

            // Assert
            expect(jwt.verify).toHaveBeenCalledWith("valid-profile-token", "test-jwt-secret");
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Admin profile retrieved successfully",
                admin: {
                    email: decoded.email,
                    role: decoded.role,
                    loginTime: new Date(decoded.iat * 1000).toISOString(),
                    expiresAt: new Date(decoded.exp * 1000).toISOString(),
                },
            });
        });

        test("should convert iat and exp Unix timestamps to ISO strings correctly", () => {
            // Arrange
            const specificIat = 1672531200; // 2023-01-01 00:00:00 UTC
            const specificExp = 1673136000; // 2023-01-08 00:00:00 UTC

            mockReq.headers.authorization = "Bearer timestamp-test-token";
            jwt.verify.mockReturnValue({
                email: "admin@enterprise.com",
                role: "admin",
                iat: specificIat,
                exp: specificExp,
            });

            // Act
            getAdminProfile(mockReq, mockRes);

            // Assert
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Admin profile retrieved successfully",
                admin: {
                    email: "admin@enterprise.com",
                    role: "admin",
                    loginTime: "2023-01-01T00:00:00.000Z",
                    expiresAt: "2023-01-08T00:00:00.000Z",
                },
            });
        });
    });

    // ─── Performance ──────────────────────────────────────────────────────────
    describe("Performance — Happy Path", () => {
        test("should complete login within acceptable response time", async () => {
            // Arrange
            mockReq.body = { email: "admin@enterprise.com", password: "admin123" };
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("performance-test-token");

            const start = Date.now();

            // Act
            await adminLogin(mockReq, mockRes);

            // Assert
            expect(Date.now() - start).toBeLessThan(1000);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        test("should handle concurrent login requests independently", async () => {
            // Arrange
            const requests = Array.from({ length: 3 }, () => ({
                ...mockReq,
                body: { email: "admin@enterprise.com", password: "admin123" },
            }));

            const responses = Array.from({ length: 3 }, (_, i) => ({
                status: jest.fn(function () { return responses[i]; }),
                json: jest.fn(function () { return responses[i]; }),
            }));

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("concurrent-token");

            // Act
            await Promise.all(requests.map((req, i) => adminLogin(req, responses[i])));

            // Assert
            responses.forEach((res) => {
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith(
                    expect.objectContaining({ success: true, message: "Login successful" })
                );
            });
        });
    });
});
