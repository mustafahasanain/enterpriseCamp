# Backend Folder Structure Patterns
## Enterprise Request Management System

This document outlines 4 different folder structure patterns for the backend of our enterprise request management system (Node.js/Express + PostgreSQL).

---

## Pattern 1: Feature-Based Structure ⭐ **RECOMMENDED**

Each business feature is self-contained with its own routes, controllers, services, and validation.

```
backend/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.controller.js      # Login logic
│   │   │   ├── auth.service.js         # JWT generation, password hashing
│   │   │   ├── auth.routes.js          # POST /api/v1/auth/login
│   │   │   └── auth.middleware.js      # verifyToken middleware
│   │   │
│   │   ├── requests/
│   │   │   ├── requests.controller.js  # Create, list, update status
│   │   │   ├── requests.service.js     # Business logic
│   │   │   ├── requests.routes.js      # All request endpoints
│   │   │   ├── requests.validation.js  # Joi/Yup schemas
│   │   │   └── requests.repository.js  # DB queries (optional)
│   │   │
│   │   ├── user-types/
│   │   │   ├── userTypes.controller.js # CRUD operations
│   │   │   ├── userTypes.service.js    # Type creation with fields
│   │   │   ├── userTypes.routes.js     # All user-type endpoints
│   │   │   └── userTypes.validation.js
│   │   │
│   │   ├── fields/
│   │   │   ├── fields.controller.js    # Get fields-master, get by type
│   │   │   ├── fields.service.js
│   │   │   └── fields.routes.js
│   │   │
│   │   └── notifications/              # Email/WhatsApp service
│   │       ├── notifications.service.js
│   │       ├── emailService.js
│   │       └── whatsappService.js
│   │
│   ├── shared/
│   │   ├── config/
│   │   │   ├── database.js             # PostgreSQL pool config
│   │   │   ├── env.js                  # Environment variables
│   │   │   └── constants.js            # Status enums, etc.
│   │   │
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js         # Global error handler
│   │   │   ├── validateRequest.js      # Generic validation middleware
│   │   │   └── corsConfig.js
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.js               # Winston logger
│   │   │   ├── responseHelper.js       # Standardized responses
│   │   │   └── asyncHandler.js         # Wrap async routes
│   │   │
│   │   └── database/
│   │       ├── pool.js                 # PostgreSQL connection
│   │       └── queries.js              # Common SQL helpers
│   │
│   ├── database/
│   │   ├── migrations/                 # SQL migration files
│   │   │   ├── 001_create_tables.sql
│   │   │   ├── 002_add_indexes.sql
│   │   │   └── 003_seed_fields_master.sql
│   │   └── seeds/
│   │       └── fields_master_seed.js
│   │
│   ├── app.js                          # Express app setup
│   └── server.js                       # Server startup
│
├── logs/
│   ├── error.log
│   └── combined.log
│
├── tests/
│   ├── unit/
│   │   ├── auth.test.js
│   │   ├── requests.test.js
│   │   └── userTypes.test.js
│   └── integration/
│       └── api.test.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### ✅ Pros
- Easy to find everything related to one feature
- Scales well as features grow
- Good for team collaboration (each team owns a feature)
- Clear separation of concerns
- Easy to add new features without affecting existing ones

### ❌ Cons
- Can have some code duplication across features
- Shared utilities need careful management

### 📌 Best For
- Medium to large applications
- Teams with multiple developers
- Projects with clear feature boundaries
- **OUR SYSTEM** (4 clear features: auth, requests, user-types, fields)

---

## Pattern 2: Layered/Clean Architecture

Strict separation by technical layers (presentation → application → domain → infrastructure).

```
backend/
├── src/
│   ├── presentation/                   # HTTP Layer
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── requestController.js
│   │   │   ├── userTypeController.js
│   │   │   └── fieldController.js
│   │   │
│   │   ├── routes/
│   │   │   ├── index.js                # Main router
│   │   │   ├── v1/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── requests.routes.js
│   │   │   │   ├── userTypes.routes.js
│   │   │   │   └── fields.routes.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── authenticate.js
│   │   │   ├── errorHandler.js
│   │   │   └── requestValidator.js
│   │   │
│   │   └── validators/
│   │       ├── requestSchemas.js       # Joi schemas
│   │       └── userTypeSchemas.js
│   │
│   ├── application/                    # Business Logic Layer
│   │   ├── services/
│   │   │   ├── authService.js          # Login, JWT
│   │   │   ├── requestService.js       # Request processing
│   │   │   ├── userTypeService.js      # Type management
│   │   │   ├── fieldService.js
│   │   │   └── notificationService.js
│   │   │
│   │   └── use-cases/                  # Optional: Complex workflows
│   │       ├── createRequestUseCase.js
│   │       └── approveRequestUseCase.js
│   │
│   ├── domain/                         # Core Business Entities
│   │   ├── models/
│   │   │   ├── Request.js              # Business entity (not DB model)
│   │   │   ├── UserType.js
│   │   │   └── Field.js
│   │   │
│   │   └── enums/
│   │       ├── RequestStatus.js        # PENDING, APPROVED, REJECTED
│   │       └── FieldTypes.js           # TEXT, EMAIL, NUMBER, etc.
│   │
│   ├── infrastructure/                 # External Services & Data Access
│   │   ├── database/
│   │   │   ├── pool.js                 # PostgreSQL connection
│   │   │   ├── repositories/
│   │   │   │   ├── requestRepository.js # All DB queries for requests
│   │   │   │   ├── userTypeRepository.js
│   │   │   │   └── fieldRepository.js
│   │   │   └── migrations/
│   │   │       ├── 001_initial_schema.sql
│   │   │       └── 002_add_indexes.sql
│   │   │
│   │   ├── notifications/
│   │   │   ├── emailProvider.js        # Nodemailer implementation
│   │   │   └── whatsappProvider.js     # WhatsApp API
│   │   │
│   │   └── logger/
│   │       └── winstonLogger.js
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── env.js
│   │   └── constants.js
│   │
│   ├── app.js
│   └── server.js
│
├── logs/
├── tests/
├── .env
└── package.json
```

### ✅ Pros
- Clear separation of responsibilities (SRP)
- Testable (business logic isolated from DB/HTTP)
- Enterprise-grade architecture
- Easy to swap implementations (e.g., PostgreSQL → MongoDB)
- Follows SOLID principles
- Dependencies point inward (domain has no dependencies)

### ❌ Cons
- More complex for small teams
- More files and folders to navigate
- Potentially over-engineered for simple CRUD
- Steeper learning curve

### 📌 Best For
- Large enterprise applications
- Long-term projects
- Teams familiar with DDD/Clean Architecture
- Systems with complex business logic

---

## Pattern 3: Traditional MVC

Classic Model-View-Controller with routes at top level.

```
backend/
├── src/
│   ├── models/                         # Database Models
│   │   ├── db.js                       # PostgreSQL pool
│   │   ├── requestModel.js             # All request queries
│   │   ├── userTypeModel.js            # All user-type queries
│   │   ├── fieldModel.js               # All field queries
│   │   └── migrations/
│   │       └── schema.sql
│   │
│   ├── controllers/                    # Request Handlers
│   │   ├── authController.js
│   │   ├── requestController.js
│   │   ├── userTypeController.js
│   │   └── fieldController.js
│   │
│   ├── routes/                         # API Routes
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── requests.js
│   │   ├── userTypes.js
│   │   └── fields.js
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── validator.js
│   │
│   ├── services/                       # Business Logic
│   │   ├── emailService.js
│   │   ├── whatsappService.js
│   │   └── loggerService.js
│   │
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── constants.js
│   │   └── validator.js
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── env.js
│   │   └── email.js
│   │
│   ├── app.js
│   └── server.js
│
├── logs/
├── tests/
├── .env
└── package.json
```

### ✅ Pros
- Simple and familiar pattern
- Easy to understand for new developers
- Quick to set up
- Good for small-to-medium projects
- Less boilerplate code
- Fast development speed

### ❌ Cons
- Can become messy as project grows
- Models do too much (DB + business logic)
- Harder to test in isolation
- No clear business domain separation
- Becomes spaghetti code at scale

### 📌 Best For
- Small to medium projects
- MVPs and prototypes
- Solo developers or small teams
- Projects with simple CRUD operations

---

## Pattern 4: Modular Monolith

Business modules are completely independent (like microservices in one repo).

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.js          # Module entry point
│   │   │   ├── controllers/
│   │   │   │   └── authController.js
│   │   │   ├── services/
│   │   │   │   └── authService.js
│   │   │   ├── routes/
│   │   │   │   └── auth.routes.js
│   │   │   ├── middlewares/
│   │   │   │   └── authMiddleware.js
│   │   │   └── config/
│   │   │       └── jwtConfig.js
│   │   │
│   │   ├── requests/
│   │   │   ├── requests.module.js
│   │   │   ├── controllers/
│   │   │   │   └── requestController.js
│   │   │   ├── services/
│   │   │   │   ├── requestService.js
│   │   │   │   └── validationService.js
│   │   │   ├── repository/
│   │   │   │   └── requestRepository.js
│   │   │   ├── routes/
│   │   │   │   └── requests.routes.js
│   │   │   ├── models/
│   │   │   │   └── Request.js
│   │   │   └── validators/
│   │   │       └── requestSchemas.js
│   │   │
│   │   ├── user-types/
│   │   │   ├── userTypes.module.js
│   │   │   ├── controllers/
│   │   │   │   └── userTypeController.js
│   │   │   ├── services/
│   │   │   │   └── userTypeService.js
│   │   │   ├── repository/
│   │   │   │   └── userTypeRepository.js
│   │   │   ├── routes/
│   │   │   │   └── userTypes.routes.js
│   │   │   └── validators/
│   │   │       └── userTypeSchemas.js
│   │   │
│   │   ├── fields/
│   │   │   ├── fields.module.js
│   │   │   ├── controllers/
│   │   │   │   └── fieldController.js
│   │   │   ├── services/
│   │   │   │   └── fieldService.js
│   │   │   ├── repository/
│   │   │   │   └── fieldRepository.js
│   │   │   └── routes/
│   │   │       └── fields.routes.js
│   │   │
│   │   └── notifications/
│   │       ├── notifications.module.js
│   │       ├── services/
│   │       │   ├── emailService.js
│   │       │   └── whatsappService.js
│   │       └── templates/
│   │           ├── approvalEmail.html
│   │           └── rejectionEmail.html
│   │
│   ├── core/                           # Shared Core
│   │   ├── database/
│   │   │   ├── pool.js
│   │   │   └── baseRepository.js       # Generic CRUD
│   │   │
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js
│   │   │   └── corsConfig.js
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── asyncHandler.js
│   │   │   └── responseFormatter.js
│   │   │
│   │   └── config/
│   │       ├── env.js
│   │       └── constants.js
│   │
│   ├── database/
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.sql
│   │   └── seeds/
│   │       └── fields_master.sql
│   │
│   ├── bootstrap.js                    # Load all modules
│   ├── app.js
│   └── server.js
│
├── logs/
├── tests/
├── .env
└── package.json
```

### ✅ Pros
- Maximum modularity (each module is self-contained)
- Easy to extract to microservices later
- Clear boundaries between modules
- Modules can be developed/tested independently
- Great for distributed teams
- Enforces strong encapsulation

### ❌ Cons
- Most complex structure
- Can lead to code duplication
- Overkill for small projects
- Need strong conventions to manage shared code
- More overhead in module communication

### 📌 Best For
- Very large applications
- Teams planning to migrate to microservices
- Projects with independent business domains
- Organizations with multiple development teams

---

## Comparison Table

| Aspect | Pattern 1: Feature-Based | Pattern 2: Layered | Pattern 3: MVC | Pattern 4: Modular |
|--------|-------------------------|-------------------|----------------|-------------------|
| **Complexity** | Medium | High | Low | Very High |
| **Learning Curve** | Moderate | Steep | Easy | Steep |
| **Testability** | Good | Excellent | Fair | Excellent |
| **Scalability** | Good | Excellent | Fair | Excellent |
| **Team Size** | 3-10 | 5-20+ | 1-5 | 10-50+ |
| **Setup Time** | Medium | Long | Quick | Long |
| **Maintenance** | Easy | Medium | Hard at scale | Easy |
| **Code Reuse** | Good | Excellent | Fair | Good |
| **For Our System** | ⭐ **Best Choice** | Overkill | Too simple | Overkill |

---

## Recommended Pattern for Our System

**Pattern 1: Feature-Based Structure** is recommended because:

1. ✅ **4 clear features**: auth, requests, user-types, fields, notifications
2. ✅ **Medium complexity**: Not too simple, not over-engineered
3. ✅ **Team-friendly**: Easy for multiple developers to work on different features
4. ✅ **Growth potential**: Can add new features (backup, analytics) easily
5. ✅ **Simple to understand**: New developers can onboard quickly
6. ✅ **Testable**: Each feature can be tested independently
7. ✅ **Maintainable**: Clear boundaries and separation of concerns

---

## Implementation Notes

### For Pattern 1 (Recommended)

**Key Principles:**
- Each feature folder contains ALL related code (routes, controllers, services, validation)
- Shared code goes in `shared/` directory
- Database access patterns can be in `repositories/` or directly in services
- Middlewares specific to a feature stay in that feature folder
- Global middlewares go in `shared/middlewares/`

**Example File Responsibilities:**

```javascript
// features/requests/requests.controller.js
// - Handle HTTP requests/responses
// - Call service methods
// - Return formatted responses

// features/requests/requests.service.js
// - Business logic
// - Data validation
// - Call repository or database directly
// - Handle notifications

// features/requests/requests.routes.js
// - Define routes
// - Apply middlewares
// - Map routes to controllers

// features/requests/requests.validation.js
// - Joi/Yup schemas
// - Validation rules
```

---

## Migration Path

If you start with **Pattern 3 (MVC)** for rapid prototyping, you can migrate to **Pattern 1 (Feature-Based)** as the project grows:

```
Step 1: Create feature folders
Step 2: Move related files into features (requests → features/requests/)
Step 3: Create shared folder for common utilities
Step 4: Update imports
Step 5: Refactor services to be feature-specific
```

---

## Next Steps

1. Choose the pattern that fits your team and project needs
2. Set up the folder structure
3. Create shared utilities first (logger, database, error handler)
4. Implement features one by one
5. Write tests as you go
6. Document any deviations from the pattern

---

*Document created: 2026-02-17*  
*System: Enterprise Request Management System*  
*Stack: Node.js/Express + PostgreSQL*
