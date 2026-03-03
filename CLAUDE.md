# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Edwix is a repair shop management system (customers, devices, tickets, inventory, invoices, quotes, suppliers). It's a TypeScript monorepo using NPM workspaces with Turbo for orchestration.

## Commands

### Development
```bash
docker compose up -d                # Start PostgreSQL (port 5433) and Redis (port 6380)
cp .env.example .env                # First-time setup: create env file
npm install                         # Install all workspace dependencies
npm run db:migrate                  # Run Prisma migrations
npm run db:seed                     # Seed database
npm run dev                         # Start all apps (API on :3001, Web on :5173)
```

### Build & Lint
```bash
npm run build                       # Build all workspaces (turbo)
npm run lint                        # Type-check all workspaces (tsc --noEmit)
npm run format                      # Prettier format all files
```

### Testing
```bash
npm run test                        # Run all tests (turbo)
cd apps/api && npx vitest run       # Run API tests only
cd apps/api && npx vitest run src/modules/auth  # Run tests for a specific module
cd apps/api && npx vitest           # Watch mode
```

### Database
```bash
npm run db:studio                   # Open Prisma Studio
cd apps/api && npx prisma generate  # Regenerate Prisma client after schema changes
```

## Architecture

### Workspaces

| Workspace | Package | Purpose |
|-----------|---------|---------|
| `apps/api` | `@edwix/api` | Express backend, Prisma ORM, JWT auth |
| `apps/web` | `@edwix/web` | React SPA with Vite, Zustand, React Query |
| `packages/shared` | `@edwix/shared` | Shared types, Zod validation schemas, enums |

### Backend Module Pattern (`apps/api/src/modules/<module>/`)

Each module follows this structure:
- `<module>.routes.ts` — Express router with route definitions
- `<module>.controller.ts` — Request handlers
- `<module>.service.ts` — Business logic
- `<module>.repository.ts` — Prisma data access
- `<module>.schema.ts` — Zod request validation schemas

API routes are prefixed with `/api/v1/`. Swagger docs at `/api/docs`. Health check at `/api/health`.

### Backend Conventions

- **Errors**: Throw `AppError` subclasses (`NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `BadRequestError`) from `src/utils/errors.ts`. The global `errorHandler` middleware catches them.
- **Responses**: Use helpers from `src/utils/response.ts`: `sendSuccess()`, `sendPaginated()`, `sendCreated()`, `sendNoContent()`.
- **Middleware**: Auth (`authenticate`), RBAC (`authorize`), validation (`validate`), pagination (`paginate`), audit logging.

### Frontend Structure (`apps/web/src/`)

- **State**: Zustand stores (`stores/`) for auth and theme. React Query for server state.
- **Routing**: React Router v6 in `router.tsx`. `ProtectedRoute`/`PublicRoute` wrappers check `localStorage` for `accessToken`.
- **API layer**: Axios client in `api/` directory with per-module API functions.
- **UI**: Tailwind CSS + Shadcn UI components (`components/ui/`). Path alias `@/` maps to `src/`.

### Database

PostgreSQL via Prisma. Schema at `apps/api/prisma/schema.prisma`. Migrations in `apps/api/prisma/migrations/`.

### Formatting

Prettier: single quotes, semicolons, trailing commas, 100 char width, 2-space indent.
