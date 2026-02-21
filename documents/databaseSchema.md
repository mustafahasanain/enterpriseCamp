# Database Schema

# Enterprise Request Management System

> **Database:** PostgreSQL  
> **Backend:** Node.js / Express  
> **Design Approach:** Single `requests` table with JSONB for dynamic field data — no dynamic table creation.

---

## Overview

The system uses **4 core tables** to manage a fully dynamic, admin-configurable request pipeline:

```
fields_master  ──┐
                 ├──► user_type_fields  ◄──── user_types
                 │
requests  ────────────────────────────────── user_types (FK)
```

---

## Tables

---

### 1. `fields_master`

Stores all possible field definitions that an admin can assign to any user type. This is the master catalog of form fields.

```sql
CREATE TABLE fields_master (
    id            SERIAL        PRIMARY KEY,
    field_name    VARCHAR(100)  NOT NULL UNIQUE,       -- Internal key (e.g. "student_id")
    field_label   VARCHAR(150)  NOT NULL,              -- Display label (e.g. "الرقم الجامعي")
    field_type    VARCHAR(50)   NOT NULL               -- Input type: text | email | tel | number | dropdown
                  CHECK (field_type IN ('text', 'email', 'tel', 'number', 'dropdown')),
    field_options JSONB         DEFAULT NULL,          -- Used for dropdown choices: ["CS", "Engineering", ...]
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

**Constraints:**

- `field_name` must be unique — it is the machine-readable key used in request payloads.
- `field_options` is only populated when `field_type = 'dropdown'`.

**Example Data:**

| id | field_name      | field_label          | field_type | field_options             |
|----|-----------------|----------------------|------------|---------------------------|
| 1  | name            | الاسم الكامل         | text       | null                      |
| 2  | email           | البريد الإلكتروني    | email      | null                      |
| 3  | phone           | رقم الهاتف           | tel        | null                      |
| 4  | student_id      | الرقم الجامعي        | text       | null                      |
| 5  | license_number  | رقم الرخصة           | text       | null                      |
| 6  | company         | الشركة               | text       | null                      |
| 7  | course          | التخصص               | dropdown   | `["CS","Engineering",...]`|
| 8  | experience      | سنوات الخبرة         | number     | null                      |

---

### 2. `user_types`

Stores each user type that the admin creates (e.g. student, agent, teacher).

```sql
CREATE TABLE user_types (
    id          SERIAL        PRIMARY KEY,
    type_name   VARCHAR(100)  NOT NULL UNIQUE,    -- e.g. "student", "agent"
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

**Constraints:**

- `type_name` must be unique.
- `is_active` allows soft-disabling a type without deleting it (inactive types are hidden from the public form).

**Example Data:**

| id | type_name | is_active | created_at          |
|----|-----------|-----------|---------------------|
| 1  | student   | true      | 2026-01-01 10:00:00 |
| 2  | agent     | true      | 2026-01-05 14:30:00 |
| 3  | teacher   | true      | 2026-01-10 09:15:00 |

---

### 3. `user_type_fields`

A join table that maps which fields from `fields_master` belong to a given `user_types` entry. Also controls display order and required status per type.

```sql
CREATE TABLE user_type_fields (
    id            SERIAL   PRIMARY KEY,
    user_type_id  INTEGER  NOT NULL REFERENCES user_types(id)   ON DELETE CASCADE,
    field_id      INTEGER  NOT NULL REFERENCES fields_master(id) ON DELETE CASCADE,
    is_required   BOOLEAN  NOT NULL DEFAULT FALSE,
    field_order   INTEGER  NOT NULL DEFAULT 0,
    UNIQUE (user_type_id, field_id)
);
```

**Constraints:**

- `UNIQUE (user_type_id, field_id)` prevents duplicate field assignments per type.
- `ON DELETE CASCADE` — removing a user type or field master record cleans up associations automatically.

**Example Data:**

| id | user_type_id | field_id | is_required | field_order |
|----|--------------|----------|-------------|-------------|
| 1  | 1 (student)  | 1 (name) | true        | 1           |
| 2  | 1 (student)  | 2 (email)| true        | 2           |
| 3  | 1 (student)  | 3 (phone)| false       | 3           |
| 4  | 1 (student)  | 4 (student_id)| true   | 4           |
| 5  | 1 (student)  | 7 (course)| true       | 5           |
| 6  | 2 (agent)    | 1 (name) | true        | 1           |
| 7  | 2 (agent)    | 2 (email)| true        | 2           |
| 8  | 2 (agent)    | 5 (license_number)| true | 3         |
| 9  | 2 (agent)    | 6 (company)| false     | 4           |

---

### 4. `requests`

Stores every submitted user request. Dynamic user-entered field values are persisted as a single JSONB blob in the `data` column, keyed by `field_name` from `fields_master`.

```sql
CREATE TABLE requests (
    id            SERIAL       PRIMARY KEY,
    user_type_id  INTEGER      NOT NULL REFERENCES user_types(id) ON DELETE RESTRICT,
    data          JSONB        NOT NULL,                -- Dynamic fields: {"name":"...", "email":"...", ...}
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes   TEXT         DEFAULT NULL,            -- Notes written by admin on approval/rejection
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

**Constraints:**

- `ON DELETE RESTRICT` on `user_type_id` prevents deleting a user type that has existing requests.
- `status` is restricted to the three allowed values via CHECK constraint.
- `data` content is validated at the application layer against the required fields for the given `user_type_id`.

**Example Data:**

| id | user_type_id | data (JSONB)                                                                 | status   | admin_notes      |
|----|--------------|------------------------------------------------------------------------------|----------|------------------|
| 1  | 1 (student)  | `{"name":"أحمد","email":"a@mail.com","phone":"050...","student_id":"STU001","course":"CS"}` | approved | "مرحباً بك"    |
| 2  | 2 (agent)    | `{"name":"سارة","email":"s@mail.com","license_number":"AG001","company":"شركة"}` | pending  | null             |
| 3  | 1 (student)  | `{"name":"خالد","email":"k@mail.com","student_id":"STU002","course":"ENG"}`  | rejected | "بيانات ناقصة"   |

---

## Indexes

```sql
-- Speed up request listing by status (admin dashboard filter)
CREATE INDEX idx_requests_status        ON requests (status);

-- Speed up request lookup by user type
CREATE INDEX idx_requests_user_type_id  ON requests (user_type_id);

-- Speed up field lookup by user type (used on every form load)
CREATE INDEX idx_utf_user_type_id       ON user_type_fields (user_type_id);

-- Speed up active type lookup (used on public form load)
CREATE INDEX idx_user_types_is_active   ON user_types (is_active);

-- Support JSONB queries on request data (e.g. search by email)
CREATE INDEX idx_requests_data_gin      ON requests USING GIN (data);
```

---

## Relationships Diagram

```
fields_master
  ├── id (PK)
  ├── field_name (UNIQUE)
  ├── field_label
  ├── field_type
  └── field_options (JSONB)
         │
         │  (FK: field_id)
         ▼
user_type_fields
  ├── id (PK)
  ├── user_type_id  (FK → user_types.id)  ◄──── user_types
  ├── field_id      (FK → fields_master.id)      ├── id (PK)
  ├── is_required                                 ├── type_name (UNIQUE)
  └── field_order                                 ├── is_active
                                                  ├── created_at
                                                  └── updated_at
                                                         │
                                                         │  (FK: user_type_id)
                                                         ▼
                                                      requests
                                                        ├── id (PK)
                                                        ├── user_type_id (FK)
                                                        ├── data (JSONB)
                                                        ├── status
                                                        ├── admin_notes
                                                        ├── created_at
                                                        └── updated_at
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **JSONB for request data** | Eliminates the need to create dynamic tables per user type. All form submissions are stored in one `requests` table. Schema stays fixed regardless of how many user types are added. |
| **`fields_master` as catalog** | The admin selects from a pre-defined catalog of fields rather than defining free-form custom fields. This prevents data inconsistency and makes validation predictable. |
| **`user_type_fields` as mapping** | Allows full many-to-many flexibility — a single field (e.g. `email`) can be reused across all user types without duplication. |
| **Admin stored in `.env`** | A single admin account is stored as environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`). No `admins` table is needed, reducing attack surface. |
| **Soft-delete on user types** | `is_active = false` hides a type from users without destroying historical request data linked to it. |
| **`ON DELETE RESTRICT` on requests** | Prevents accidental deletion of a user type that has associated request records. |

---

## Complete SQL — Full Schema

```sql
-- ============================================================
-- Enterprise Request Management System — Database Schema
-- Database: PostgreSQL
-- ============================================================

-- 1. Master field catalog
CREATE TABLE fields_master (
    id            SERIAL        PRIMARY KEY,
    field_name    VARCHAR(100)  NOT NULL UNIQUE,
    field_label   VARCHAR(150)  NOT NULL,
    field_type    VARCHAR(50)   NOT NULL
                  CHECK (field_type IN ('text', 'email', 'tel', 'number', 'dropdown')),
    field_options JSONB         DEFAULT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2. User type registry
CREATE TABLE user_types (
    id          SERIAL        PRIMARY KEY,
    type_name   VARCHAR(100)  NOT NULL UNIQUE,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3. Field assignments per user type
CREATE TABLE user_type_fields (
    id            SERIAL   PRIMARY KEY,
    user_type_id  INTEGER  NOT NULL REFERENCES user_types(id)    ON DELETE CASCADE,
    field_id      INTEGER  NOT NULL REFERENCES fields_master(id)  ON DELETE CASCADE,
    is_required   BOOLEAN  NOT NULL DEFAULT FALSE,
    field_order   INTEGER  NOT NULL DEFAULT 0,
    UNIQUE (user_type_id, field_id)
);

-- 4. Submitted user requests
CREATE TABLE requests (
    id            SERIAL       PRIMARY KEY,
    user_type_id  INTEGER      NOT NULL REFERENCES user_types(id) ON DELETE RESTRICT,
    data          JSONB        NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes   TEXT         DEFAULT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_requests_status        ON requests (status);
CREATE INDEX idx_requests_user_type_id  ON requests (user_type_id);
CREATE INDEX idx_utf_user_type_id       ON user_type_fields (user_type_id);
CREATE INDEX idx_user_types_is_active   ON user_types (is_active);
CREATE INDEX idx_requests_data_gin      ON requests USING GIN (data);

-- ============================================================
-- Seed: fields_master (initial field catalog)
-- ============================================================
INSERT INTO fields_master (field_name, field_label, field_type, field_options) VALUES
  ('name',           'الاسم الكامل',         'text',     NULL),
  ('email',          'البريد الإلكتروني',    'email',    NULL),
  ('phone',          'رقم الهاتف',           'tel',      NULL),
  ('student_id',     'الرقم الجامعي',        'text',     NULL),
  ('license_number', 'رقم الرخصة',           'text',     NULL),
  ('company',        'الشركة',               'text',     NULL),
  ('course',         'التخصص',               'dropdown', '["CS","Engineering","Business","Medicine"]'),
  ('experience',     'سنوات الخبرة',         'number',   NULL);
```

---

## API ↔ Schema Mapping

| API Endpoint | Tables Involved | Operation |
|---|---|---|
| `GET /api/v1/user-types` | `user_types` | `SELECT WHERE is_active = true` |
| `GET /api/v1/user-types/:id/fields` | `user_type_fields` JOIN `fields_master` | `SELECT` with join and ORDER BY |
| `POST /api/v1/user-types` | `user_types`, `user_type_fields` | `INSERT` (transaction) |
| `PUT /api/v1/user-types/:id` | `user_types`, `user_type_fields` | `UPDATE` + `DELETE` old fields + `INSERT` new fields |
| `DELETE /api/v1/user-types/:id` | `user_types` | `UPDATE SET is_active = false` (soft delete) |
| `GET /api/v1/fields-master` | `fields_master` | `SELECT *` |
| `POST /api/v1/requests` | `requests` | `INSERT` |
| `GET /api/v1/requests` | `requests` JOIN `user_types` | `SELECT` with optional `status` filter |
| `PUT /api/v1/requests/:id/status` | `requests` | `UPDATE SET status, admin_notes` |
| `GET /api/v1/database/stats` | All tables | `COUNT` queries |
