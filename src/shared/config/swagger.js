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
                url: "http://localhost:3000/api/v1",
                description: "Development server",
            },
        ],
        tags: [
            {
                name: "Health",
                description: "Server and database health checks",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    // Scan all route/router files for @swagger JSDoc annotations
    apis: [
        "./src/indexRouterV1.js",
        "./src/features/**/router.js",
    ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
