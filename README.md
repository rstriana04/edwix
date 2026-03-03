# Edwix

Repair shop management system for handling customers, devices, repair tickets, inventory, invoicing, quotes, and suppliers.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | NPM Workspaces + Turborepo |
| **Backend** | Express, Prisma ORM, JWT auth, Zod validation |
| **Frontend** | React 18, Vite, Zustand, TanStack React Query |
| **UI** | Tailwind CSS + Shadcn UI (Radix primitives) |
| **Database** | PostgreSQL 16 |
| **Queue** | Bull + Redis 7 |
| **Language** | TypeScript (strict mode) |

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose (for PostgreSQL and Redis)

## Getting Started

```bash
# 1. Clone and install
git clone <repo-url> && cd edwix
npm install

# 2. Start infrastructure
docker compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env — set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (min 32 chars each)

# 4. Setup database
npm run db:migrate
npm run db:seed

# 5. Start development
npm run dev
```

The API runs on **http://localhost:3001** and the web app on **http://localhost:5173**. The Vite dev server proxies `/api` requests to the backend automatically.

## Project Structure

```
edwix/
├── apps/
│   ├── api/                  # @edwix/api — Express backend
│   │   ├── src/
│   │   │   ├── config/       # Environment, database, Swagger config
│   │   │   ├── middleware/    # Auth, RBAC, validation, error handling, pagination
│   │   │   ├── modules/      # Business logic modules (see below)
│   │   │   ├── utils/        # Error classes, response helpers, generators
│   │   │   └── lib/          # Shared utilities
│   │   └── prisma/           # Schema & migrations
│   │
│   └── web/                  # @edwix/web — React SPA
│       └── src/
│           ├── api/          # Axios API client, per-module functions
│           ├── components/   # UI (shadcn), layout (AppShell, Sidebar, Header), shared
│           ├── hooks/        # Custom React hooks
│           ├── pages/        # Page components organized by module
│           ├── stores/       # Zustand stores (auth, theme)
│           └── types/        # TypeScript type definitions
│
└── packages/
    └── shared/               # @edwix/shared — Shared types, enums, Zod schemas
```

## Modules

| Module | Description |
|--------|-----------|
| **Auth** | Registration, login, JWT access/refresh tokens, profile |
| **Customers** | Customer CRM with communication logs |
| **Devices** | Device registry with categories, linked to customers |
| **Tickets** | Repair tickets with status tracking, approvals, notes, labor, parts |
| **Parts** | Inventory management with stock movements and categories |
| **Suppliers** | Supplier management with purchase orders and receipts |
| **Quotes** | Quote generation with line items |
| **Invoices** | Invoicing with line items and payments |
| **Dashboard** | Aggregated analytics and stats |
| **Assets** | Company asset tracking, checkouts, and maintenance *(in progress)* |
| **Notifications** | Templates, logs, and internal alerts *(in progress)* |
| **Reports** | Business reporting *(in progress)* |
| **Settings** | Business profile and app configuration *(in progress)* |

## Backend Architecture

Each API module under `apps/api/src/modules/<module>/` follows a layered pattern:

```
<module>.routes.ts       → Express router definitions
<module>.controller.ts   → HTTP request handlers
<module>.service.ts      → Business logic
<module>.repository.ts   → Prisma data access
<module>.schema.ts       → Zod request validation schemas
```

### API Routes

All routes are prefixed with `/api/v1/`:

```
POST/GET    /api/v1/auth/*          Authentication
GET/POST    /api/v1/customers       Customer CRUD
GET/POST    /api/v1/devices         Device management
GET/POST    /api/v1/tickets         Repair ticket workflow
GET/POST    /api/v1/parts           Inventory parts
GET/POST    /api/v1/suppliers       Supplier management
GET/POST    /api/v1/quotes          Quote generation
GET/POST    /api/v1/invoices        Invoicing
GET         /api/v1/dashboard       Dashboard analytics
GET         /api/health             Health check
```

Swagger documentation is available at **/api/docs** when the server is running.

### Middleware Stack

Requests flow through: `helmet` -> `cors` -> `json parser` -> `morgan` (logging) -> route-level middleware (`authenticate`, `authorize`, `validate`, `paginate`) -> controller -> `errorHandler`.

### Error Handling

Throw error subclasses from `src/utils/errors.ts`:

| Class | Status | Use case |
|-------|--------|----------|
| `NotFoundError` | 404 | Resource not found |
| `UnauthorizedError` | 401 | Missing/invalid auth |
| `ForbiddenError` | 403 | Insufficient permissions |
| `ValidationError` | 400 | Invalid request data |
| `BadRequestError` | 400 | General bad request |
| `ConflictError` | 409 | Duplicate/conflicting data |

### Response Helpers

Use `src/utils/response.ts` for consistent API responses:

- `sendSuccess(res, data, message?)` — 200 OK
- `sendCreated(res, data, message?)` — 201 Created
- `sendPaginated(res, data, total, page, limit)` — 200 with pagination metadata
- `sendNoContent(res)` — 204 No Content

## Frontend Architecture

- **Routing**: React Router v6 with `ProtectedRoute` and `PublicRoute` wrappers. Layout uses `AppShell` (Sidebar + Header + `<Outlet />`).
- **State management**: Zustand stores for client state (auth, theme). TanStack React Query for server state with 30s stale time.
- **API layer**: Axios-based client in `src/api/` with per-module files. Vite proxies `/api` to the backend in development.
- **Path alias**: `@/` resolves to `apps/web/src/`.

## Scripts Reference

| Command | Description |
|---------|-----------|
| `npm run dev` | Start all apps in dev mode (Turbo) |
| `npm run build` | Build all workspaces |
| `npm run lint` | Type-check all workspaces (`tsc --noEmit`) |
| `npm run test` | Run all tests (Vitest) |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio GUI |

### Workspace-specific commands

```bash
# Run only API tests
cd apps/api && npx vitest run

# Run tests for a specific module
cd apps/api && npx vitest run src/modules/auth

# Test watch mode
cd apps/api && npx vitest

# Regenerate Prisma client after schema changes
cd apps/api && npx prisma generate

# Preview production web build
cd apps/web && npx vite preview
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-----------|
| `DATABASE_URL` | `postgresql://edwix:edwix_secret@localhost:5433/edwix?schema=public` | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6380` | Redis for Bull queues |
| `JWT_ACCESS_SECRET` | — | **Required.** Min 32 characters |
| `JWT_REFRESH_SECRET` | — | **Required.** Min 32 characters |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token TTL |
| `API_PORT` | `3001` | API server port |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `UPLOAD_DIR` | `./uploads` | File upload directory |
| `MAX_FILE_SIZE` | `10485760` | Max upload size in bytes (10MB) |
| `DEFAULT_CURRENCY` | `COP` | Default currency code |
| `DEFAULT_TAX_RATE` | `19` | Default tax rate (%) |

## Docker Services

Defined in `docker-compose.yml`:

| Service | Image | Port (host) | Credentials |
|---------|-------|-------------|-------------|
| PostgreSQL | `postgres:16-alpine` | 5433 | `edwix` / `edwix_secret` |
| Redis | `redis:7-alpine` | 6380 | — |

Data is persisted in Docker volumes (`pgdata`, `redisdata`).

## User Roles

The system supports three roles with RBAC middleware:

- **ADMIN** — Full access to all modules
- **TECHNICIAN** — Repair tickets, parts, devices
- **RECEPTIONIST** — Customers, tickets intake, quotes, invoices
