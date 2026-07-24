# Apex Banking — Production-Grade Application

> **Architecture & Engineering Guide** — Stack, Structure, Environment, and Commands

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Security Architecture](#security-architecture)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Environment Variables](#environment-variables)
7. [Setup & Installation](#setup--installation)
8. [Build & Test Commands](#build--test-commands)
9. [Docker Deployment](#docker-deployment)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Testing Guide](#testing-guide)
12. [Security Hardening Checklist](#security-hardening-checklist)

---

## Technology Stack

| Layer               | Technology               | Version    |
|---------------------|--------------------------|------------|
| **Runtime**         | Node.js                  | 20 LTS     |
| **Framework**       | Express                   | 5.x        |
| **Database**        | MySQL                     | 8.0+       |
| **Cache**           | Redis (optional)          | 7.x        |
| **Auth**            | JWT (access + refresh)    | --          |
| **Validation**      | express-validator         | 7.x        |
| **Rate Limiting**   | express-rate-limit        | 7.x        |
| **Security Headers**| helmet                    | 8.x        |
| **Testing**         | Jest + Supertest          | 29.x / 7.x |
| **Logging**         | Morgan (HTTP) + Custom structured logger | --  |
| **Containerization**| Docker / Docker Compose   | --          |
| **CI/CD**           | GitHub Actions            | --          |

---

## Project Structure

```
apex-banking/
├── .github/workflows/
│   └── ci-cd.yml                    # CI/CD pipeline definition
│
├── root/
│   ├── Backend/                     # Backend API (Node.js + Express)
│   │   ├── config/
│   │   │   ├── db.js                # MySQL connection pool
│   │   │   └── index.js             # Application configuration constants
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js    # Registration, login, token refresh, logout
│   │   │   ├── accountController.js # Dashboard, open account, FD, username update
│   │   │   ├── transactionController.js  # Deposit / withdrawal execution
│   │   │   └── employeeController.js      # Admin user & ledger inspection
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification (authenticate/requireRole)
│   │   │   ├── errorHandler.js      # Centralized error handler + 404 handler
│   │   │   ├── rateLimiter.js       # Tier-based rate limiting configs
│   │   │   └── validator.js         # express-validator rule definitions
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js              # /api/auth/*
│   │   │   ├── accounts.js          # /api/accounts/*
│   │   │   ├── transactions.js      # /api/transactions/*
│   │   │   └── employee.js          # /api/employee/*
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js       # Auth business logic + audit logging
│   │   │   ├── accountService.js    # Account management logic
│   │   │   ├── transactionService.js # Transaction execution with ACID
│   │   │   └── employeeService.js   # Employee operations with data masking
│   │   │
│   │   ├── utils/
│   │   │   ├── helpers.js           # Account number generation, data masking
│   │   │   └── logger.js            # Structured logging (dev/prod)
│   │   │
│   │   ├── migrations/
│   │   │   └── 001_audit_and_indexes.sql  # Audit table + index migration
│   │   │
│   │   ├── tests/
│   │   │   └── integration.test.js  # Jest + Supertest integration tests
│   │   │
│   │   ├── server.js                # Entry point
│   │   ├── db.js                    # Legacy -- use config/db.js instead
│   │   ├── package.json
│   │   ├── setup.sql                # Complete database schema + seed data
│   │   └── .env                     # (gitignored) environment variables
│   │
│   ├── Homepage/                    # Customer dashboard (HTML/CSS/JS)
│   │   ├── dashboard.html           # Main dashboard UI
│   │   ├── dashboard.js             # Dashboard logic + API calls
│   │   ├── dashboard-ui.css         # Dashboard-specific styles
│   │   ├── employee-desk.html       # Employee/admin panel
│   │   ├── fixed-deposit.html       # Fixed deposit creation UI
│   │   ├── home.html                # Landing page
│   │   ├── script.js                # Navigation helpers
│   │   └── style.css                # Global styles
│   │
│   ├── Login/                       # Login flow (HTML/CSS/JS)
│   │   ├── login.html
│   │   ├── login.js
│   │   └── style.css
│   │
│   └── Register/                    # Registration flow (multi-step)
│       ├── register.html            # Step 1: Personal info
│       ├── register-address.html    # Step 2: Address & KYC
│       ├── register-account.html    # Step 3: Account credentials
│       ├── script.js
│       ├── script-address.js
│       ├── script-account.js
│       └── style.css
│
├── Dockerfile                       # Production multi-stage build
├── docker-compose.yml               # API + MySQL + Redis orchestration
├── .env.example                     # Environment variable template
├── .gitignore                       # Ignored file patterns
└── APEX_BANKING_DOCUMENTATION.md    # This file
```

---

## Security Architecture

### Authentication Flow

```
+----------+     +----------------+     +----------------+     +----------+
|  Client  | --> | /auth/login/   | --> | /auth/login/   | --> | Protected|
| (Browser)|     |  initiate      |     |   verify       |     |  Routes  |
+----------+     +----------------+     +----------------+     +----------+
                      |                        |                      |
                      v                        v                      v
               Validate creds           Validate OTP            Verify JWT
               + send OTP               + issue JWT              (HttpOnly
                                        (access +                cookie)
                                         refresh)
```

### Key Security Features

| Feature               | Implementation                                      |
|-----------------------|-----------------------------------------------------|
| **Password Storage**  | bcrypt with configurable salt rounds (default 12)   |
| **MFA**               | OTP via simulated SMS gateway                       |
| **JWT Storage**       | HttpOnly, SameSite=Strict, Secure (prod) cookies    |
| **Token Rotation**    | Refresh token rotated on each use, old one revoked  |
| **Rate Limiting**     | Tier-based: login (5/15min), register (3/hr), txn (30/15min) |
| **SQL Injection**     | All queries parameterized via mysql2 prepared statements |
| **Input Validation**  | express-validator on all mutation endpoints         |
| **Security Headers**  | helmet (CSP, X-Frame-Options, HSTS, etc.)          |
| **CORS**              | Strict origin + credentials: true                   |
| **Data Masking**      | Employee endpoints mask phone, KYC, email           |
| **Audit Logging**     | Immutable audit_logs table for all key actions      |
| **ACID Transactions** | FOR UPDATE row locks within begin/commit/rollback  |

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint               | Auth Required | Rate Limit     | Description              |
|--------|------------------------|---------------|----------------|--------------------------|
| POST   | `/api/auth/register`   | No            | 3 per hour     | Register new customer    |
| POST   | `/api/auth/login/initiate` | No        | 5 per 15 min   | Initiate login + send OTP|
| POST   | `/api/auth/login/verify`  | No        | 5 per 15 min   | Verify OTP, receive JWT  |
| POST   | `/api/auth/refresh`    | Cookie*       | --             | Rotate refresh token     |
| POST   | `/api/auth/logout`     | Yes           | --             | Clear session + revoke   |

### Accounts (`/api/accounts`)

| Method | Endpoint                          | Auth Required | Description                  |
|--------|-----------------------------------|---------------|------------------------------|
| GET    | `/api/accounts/dashboard/:userId` | Yes           | Dashboard with accounts + txn|
| PATCH  | `/api/accounts/username`          | Yes           | Update username              |
| POST   | `/api/accounts/open`              | Yes           | Open new sub-account         |
| POST   | `/api/accounts/fixed-deposit`     | Yes           | Create fixed deposit         |

### Transactions (`/api/transactions`)

| Method | Endpoint                      | Auth Required | Description            |
|--------|-------------------------------|---------------|------------------------|
| POST   | `/api/transactions/execute`   | Yes           | Deposit or withdrawal  |

### Employee (`/api/employee`)

| Method | Endpoint                              | Auth + Role Required | Description              |
|--------|---------------------------------------|-----------------------|--------------------------|
| GET    | `/api/employee/users`                 | Employee only         | List customers (masked)  |
| GET    | `/api/employee/users/:userId/ledger`  | Employee only         | View user accounts + txn |

### System

| Method | Endpoint        | Auth Required | Description         |
|--------|-----------------|---------------|---------------------|
| GET    | `/api/health`   | No            | Health check        |

---

## Database Schema

### Tables

| Table          | Engine | Row Format | Description                        |
|----------------|--------|------------|------------------------------------|
| `users`        | InnoDB | Dynamic    | Customer & employee profiles       |
| `accounts`     | InnoDB | Dynamic    | Financial accounts (savings/current/fixed) |
| `transactions` | InnoDB | Dynamic    | Ledger entries (credit/debit)      |
| `audit_logs`   | InnoDB | Dynamic    | Immutable audit trail              |

### Key Indexes

- `users`: idx_users_username, idx_users_email, idx_users_phone, idx_users_role
- `accounts`: idx_accounts_user, idx_accounts_type, idx_accounts_balance
- `transactions`: idx_txns_account, idx_txns_user_date (covering index for monthly queries)
- `audit_logs`: idx_audit_user, idx_audit_action, idx_audit_created

### Seed Data

An employee user is pre-seeded for admin access:
- **Username**: `admin_emp`
- **Role**: `employee`
- **Default password**: `admin123`

---

## Environment Variables

Create a `.env` file in `root/Backend/` (use `.env.example` as template):

| Variable               | Default              | Description                              |
|------------------------|----------------------|------------------------------------------|
| `PORT`                 | `5000`               | API server port                          |
| `NODE_ENV`             | `development`        | Runtime environment                      |
| `DB_HOST`              | `127.0.0.1`          | MySQL host                               |
| `DB_PORT`              | `3306`               | MySQL port                               |
| `DB_USER`              | `root`               | MySQL user                               |
| `DB_PASSWORD`          | --                   | MySQL password                           |
| `DB_NAME`              | `apex_banking`       | MySQL database name                      |
| `DB_POOL_LIMIT`        | `15`                 | MySQL connection pool size               |
| `BCRYPT_SALT_ROUNDS`   | `12`                 | bcrypt cost factor                       |
| `JWT_ACCESS_SECRET`    | (random)             | Access token signing secret              |
| `JWT_REFRESH_SECRET`   | (random)             | Refresh token signing secret             |
| `ACCESS_TOKEN_EXPIRY`  | `15m`                | Access token lifetime                    |
| `REFRESH_TOKEN_EXPIRY` | `7d`                 | Refresh token lifetime                   |
| `CORS_ORIGIN`          | `http://127.0.0.1:5500` | Allowed CORS origin                   |
| `MYSQL_ROOT_PASSWORD`  | --                   | Root password for Docker MySQL container |

---

## Setup & Installation

### Prerequisites

- Node.js 20 LTS+
- MySQL 8.0+
- npm 10+

### Local Development Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd apex-banking

# 2. Install backend dependencies
cd root/Backend
npm install

# 3. Create environment file
cp ../../.env.example .env
# Edit .env with your MySQL credentials

# 4. Set up the database
mysql -u root -p < setup.sql

# 5. Run migrations
mysql -u root -p < migrations/001_audit_and_indexes.sql

# 6. Start the server
npm start

# For development with auto-reload:
npm run dev
```

### Frontend

Open any HTML file from `root/Homepage/`, `root/Login/`, or `root/Register/` in a browser. For the best experience, serve via a local HTTP server (e.g., VS Code Live Server on port 5500).

---

## Build & Test Commands

| Command                             | Description                         |
|-------------------------------------|-------------------------------------|
| `npm start`                         | Start production server             |
| `npm run dev`                       | Start with auto-reload (Node --watch)|
| `npm test`                          | Run Jest integration tests          |
| `npm run test:watch`                | Run tests in watch mode             |
| `node -c server.js`                 | Syntax check server.js              |
| `mysql -u root -p < setup.sql`      | Initialize database schema          |

---

## Docker Deployment

### Prerequisites

- Docker Engine 24+
- Docker Compose v2+

### Quick Start

```bash
# 1. Build and start all services
docker compose up -d --build

# 2. Check service health
docker compose ps

# 3. View logs
docker compose logs -f api

# 4. Stop services
docker compose down

# 5. Stop and delete volumes (destroys database data)
docker compose down -v
```

### Service Overview

| Service  | Container Name | Port  | Health Check                |
|----------|----------------|-------|-----------------------------|
| API      | apex-api       | 5000  | `GET /api/health`           |
| MySQL    | apex-mysql     | 3306  | `mysqladmin ping`           |
| Redis    | apex-redis     | 6379  | `redis-cli ping`            |

---

## CI/CD Pipeline

The pipeline (`ci-cd.yml`) runs on every push/PR to `main` or `develop`:

```
+---------+   +----------+   +----------+   +--------+   +--------+
| Checkout|   | Setup    |   | Install  |   | Lint   |   | Test   |
|         |   | Node 20  |   | npm ci   |   |check   |   |        |
+---------+   +----------+   +----------+   +--------+   +--------+
                                                           |
                                                      MySQL service
                                                      (GitHub Actions)
```

Pipeline steps:
1. Checkout code
2. Setup Node.js 20
3. `npm ci` -- clean install
4. Syntax validation (`node -c`)
5. Database initialization (`setup.sql`)
6. Migration scripts
7. Integration tests (`npm test`)

---

## Testing Guide

### Philosophy

- **Integration tests** cover the full API surface: registration, login (MFA), transactions, account management, and minimum balance enforcement.
- Tests run against a real MySQL database (not mocked).
- Authentication state is maintained via session cookies across test cases.

### Test Structure

| Test Group                          | What It Covers                                    |
|-------------------------------------|---------------------------------------------------|
| `POST /api/auth/register`           | Registration, duplicate rejection, validation     |
| `POST /api/auth/login/*`            | Invalid creds, OTP flow, token issuance, expiry   |
| `GET /api/accounts/dashboard/:userId` | Authenticated data fetch, unauthenticated reject |
| `POST /api/transactions/execute`    | Deposit, withdrawal, min balance, auth enforcement|
| `POST /api/accounts/open`           | New sub-account, duplicate type, validation       |
| `PATCH /api/accounts/username`      | Update, duplicate username                        |
| `GET /api/employee/users`           | Role-based access control                         |
| `GET /api/health`                   | Health check endpoint                             |

### Running Tests

```bash
# Prerequisites: MySQL must be running with the test database set up

# Automated setup (one-time):
mysql -u root -p < root/Backend/setup.sql
mysql -u root -p < root/Backend/migrations/001_audit_and_indexes.sql

# Run tests:
cd root/Backend
npm test
```

---

## Security Hardening Checklist

- [x] **JWT Authentication** -- Access + refresh token rotation
- [x] **HttpOnly Cookies** -- Tokens not accessible via JavaScript
- [x] **SameSite=Strict** -- CSRF protection
- [x] **Helmet Security Headers** -- XSS, clickjacking, MIME sniffing protection
- [x] **Strict CORS** -- Only whitelisted origins allowed
- [x] **Rate Limiting** -- Tier-based on login, registration, transactions
- [x] **Input Validation** -- All endpoints validated and sanitized
- [x] **Parameterized Queries** -- 100% SQL injection protection
- [x] **bcrypt Password Hashing** -- Configurable cost factor
- [x] **MFA** -- OTP-based two-factor authentication
- [x] **Data Masking** -- Employee endpoints mask PII
- [x] **Audit Logging** -- All sensitive actions recorded immutably
- [x] **ACID Transactions** -- Row-level locks for financial mutations
- [x] **Error Handling** -- Centralized, no stack leak in production
- [x] **Request Size Limiting** -- 10kb JSON body limit

---

## License

**Apex Banking Corporation** -- Internal use / demonstration project.

---

*Generated: July 2026 | Architecture Version 2.0*