const swaggerJSDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Enterprise Request Management System API",
            version: "1.0.0",
            description:
                "REST API for managing user requests, user types, and dynamic form fields.",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
                description: "Development server",
            },
        ],
        tags: [
            { name: "Health", description: "Server and database health checks" },
            { name: "Auth", description: "Admin authentication" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                // ─── Health ──────────────────────────────────────────
                HealthResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "Server is running" },
                        uptime: { type: "number", example: 123.45 },
                        timestamp: { type: "string", format: "date-time" },
                    },
                },
                DatabaseHealthResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string", example: "Database connection is healthy" },
                        timestamp: { type: "string", format: "date-time" },
                    },
                },
                // ─── Auth ─────────────────────────────────────────────
                AdminLoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email", example: "admin@enterprise.com" },
                        password: { type: "string", example: "admin123" },
                    },
                },
                AdminLoginResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                        expiresIn: { type: "string", example: "7d" },
                    },
                },
                TokenValidationResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        admin: {
                            type: "object",
                            properties: {
                                email: { type: "string", example: "admin@enterprise.com" },
                                role: { type: "string", example: "admin" },
                            },
                        },
                        expiresAt: { type: "string", format: "date-time" },
                    },
                },
                AdminProfileResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        admin: {
                            type: "object",
                            properties: {
                                email: { type: "string", example: "admin@enterprise.com" },
                                role: { type: "string", example: "admin" },
                                loginTime: { type: "string", format: "date-time" },
                                expiresAt: { type: "string", format: "date-time" },
                            },
                        },
                    },
                },
                // ─── Shared ───────────────────────────────────────────
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        error: { type: "string", example: "Invalid email or password" },
                    },
                },
            },
        },
    },
    // Scan all feature router files for @swagger annotations
    apis: ["./src/features/**/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
