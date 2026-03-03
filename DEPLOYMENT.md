# Edwix Deployment Guide

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1: Set Up Supabase Database](#3-step-1-set-up-supabase-database)
4. [Step 2: Deploy Backend on Render](#4-step-2-deploy-backend-on-render)
5. [Step 3: Deploy Frontend on Vercel](#5-step-3-deploy-frontend-on-vercel)
6. [Step 4: Configure CORS](#6-step-4-configure-cors)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Pre-Deployment Checklist](#9-pre-deployment-checklist)
10. [Post-Deployment Verification](#10-post-deployment-verification)
11. [Monitoring & Maintenance](#11-monitoring--maintenance)
12. [Scaling Path](#12-scaling-path)

---

## 1. Architecture Overview

| Component | Service | Free Tier Limits |
|-----------|---------|------------------|
| **Frontend** (React SPA) | **Vercel** | 100 deployments/day, 100 GB bandwidth/mo |
| **Backend** (Express API) | **Render** | 750h/mo, 512 MB RAM |
| **Database** (PostgreSQL) | **Supabase** | 500 MB storage, 2 projects |
| **Cache** (Redis) | Not needed yet | Bull queues installed but not active |

**Total cost: $0/month**

### How It Fits Together

```
┌──────────────────┐     HTTPS      ┌──────────────────┐     PostgreSQL    ┌──────────────────┐
│                  │ ──────────────→ │                  │ ───────────────→  │                  │
│   Vercel (Web)   │                 │  Render (API)    │                   │    Supabase      │
│   Static SPA     │ ←────────────── │  Express.js      │ ←───────────────  │    PostgreSQL    │
│                  │     JSON        │  Node.js >=20    │     Query Results │                  │
└──────────────────┘                 └──────────────────┘                   └──────────────────┘
   edwix-web.vercel.app                  edwix.onrender.com                 *.supabase.co:6543
```

### Trade-offs

- **Render free tier** sleeps after 15 min of inactivity (~30-60s cold start). Mitigate with a keep-alive cron or upgrade to Starter ($7/mo).
- **Supabase free tier** pauses projects after 7 days of inactivity. Mitigate with a weekly ping or the same keep-alive cron.
- **Vercel Hobby plan** is for non-commercial use. For commercial use, upgrade to Pro ($20/mo).

---

## 2. Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 9
- **Git** repository pushed to GitHub
- Accounts on: [Supabase](https://supabase.com), [Render](https://render.com), [Vercel](https://vercel.com)

### Verify local build works

```bash
npm install
npm run build
npm run lint
```

---

## 3. Step 1: Set Up Supabase Database

### 1.1 Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Configure:
   - **Name**: `edwix`
   - **Database Password**: generate a strong password (save it securely)
   - **Region**: choose the closest to your users
4. Wait for the project to finish provisioning

### 1.2 Get Connection String

1. Go to **Project Settings → Database**
2. Find the **Connection string** section
3. Select **URI** format and copy the **connection pooler** string (port `6543`, mode `Transaction`)
4. The format will be:

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

> **Important**: Use the pooler URL (port `6543`) for Prisma. Append `?pgbouncer=true&sslmode=require` to the connection string:

```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

### 1.3 Run Migrations and Seed

From your local machine:

```bash
# Set the connection string
export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Run Prisma migrations
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Seed initial data (admin user, default settings)
npx prisma db seed

# Verify tables were created (optional)
npx prisma studio --schema=apps/api/prisma/schema.prisma
```

### 1.4 Prevent Project Pausing

Supabase free tier pauses after 7 days of inactivity. Use one of these:

- **Recommended**: The same keep-alive cron for Render (Step 2) will keep Supabase active since every API health check queries the database.
- **Alternative**: Use [cron-job.org](https://cron-job.org) to hit a lightweight endpoint weekly.

---

## 4. Step 2: Deploy Backend on Render

### 2.1 Create Web Service

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **New → Web Service**
3. Connect your **GitHub repository**
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `edwix-api` |
| **Root Directory** | _(leave empty — monorepo root)_ |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node apps/api/dist/index.js` |
| **Instance Type** | Free |
| **Node Version** | Set `NODE_VERSION=20` in environment variables |

### 2.2 Set Environment Variables

In the Render service **Environment** tab, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require` |
| `JWT_ACCESS_SECRET` | Generate with `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Generate with `openssl rand -base64 48` |
| `JWT_ACCESS_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `NODE_ENV` | `production` |
| `API_PORT` | `3001` |
| `NODE_VERSION` | `20` |

> **Note**: `REDIS_URL` is not required — Bull queues are not active yet. Add it later when needed (e.g., via [Upstash](https://upstash.com) or Render Redis add-on).

### 2.3 Deploy

Click **Create Web Service**. Render will build and deploy automatically.

After deployment, verify:

```bash
curl https://edwix.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 2.4 Keep-Alive Cron (Prevent Sleep)

Use [cron-job.org](https://cron-job.org) (free) to ping your health endpoint every 14 minutes:

- **URL**: `https://edwix.onrender.com/api/health`
- **Schedule**: Every 14 minutes
- This also keeps Supabase active by triggering database connections

---

## 5. Step 3: Deploy Frontend on Vercel

### 5.1 Import Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. **Import** your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `apps/web` |
| **Build Command** | `cd ../.. && npm install && npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 5.2 Set Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://edwix.onrender.com` |

> **Note**: Do NOT include `/api` suffix — the Axios client in the frontend already prefixes requests with `/api`.

### 5.3 Deploy

Click **Deploy**. Vercel will build and deploy automatically.

After deployment, open `https://edwix-web.vercel.app` (or your custom domain) and verify the login page loads.

### 5.4 Configure Rewrites (SPA Routing)

Create `apps/web/vercel.json` to handle client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> This ensures React Router works correctly on page refresh/direct URL access.

---

## 6. Step 4: Configure CORS

Update `apps/api/src/server.ts` to restrict CORS to your production frontend domain:

```typescript
app.use(cors({
  origin: [
    'https://edwix-web.vercel.app',       // Vercel production
    'http://localhost:5173',            // Local development
  ],
  credentials: true,
}));
```

After updating, push the change to trigger a redeploy on Render.

---

## 7. Environment Variables Reference

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL pooler connection string |
| `JWT_ACCESS_SECRET` | Yes | Min 32 chars, generated with `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Yes | Min 32 chars, generated with `openssl rand -base64 48` |
| `JWT_ACCESS_EXPIRY` | No | Default: `15m` |
| `JWT_REFRESH_EXPIRY` | No | Default: `7d` |
| `NODE_ENV` | Yes | `production` |
| `API_PORT` | No | Default: `3001` |
| `NODE_VERSION` | Yes | `20` (Render uses this to select Node version) |
| `REDIS_URL` | No | Not needed yet. Add when implementing Bull queues. |
| `UPLOAD_DIR` | No | Default: `./uploads` |
| `MAX_FILE_SIZE` | No | Default: `10485760` (10 MB) |
| `DEFAULT_CURRENCY` | No | Default: `COP` |
| `DEFAULT_TAX_RATE` | No | Default: `19` |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Render backend URL (e.g., `https://edwix.onrender.com`) |

### Generating Secrets

```bash
# Run twice — one for each JWT secret:
openssl rand -base64 48
```

---

## 8. CI/CD Pipeline

Both Vercel and Render support **auto-deploy on push to `main`**. For additional gates (lint, test), use GitHub Actions.

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy-backend:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: curl -s -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"

  migrate:
    needs: deploy-backend
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

> **Note**: Vercel auto-deploys on push to `main` — no manual trigger needed. The lint-and-test job acts as a quality gate.

### Deploy Flow

```
git push main
    │
    ├── lint-and-test (GitHub Actions)
    │     │
    │     ├── Deploy Backend (Render deploy hook)
    │     │     │
    │     │     └── Run Prisma migrations
    │     │
    │     └── Deploy Frontend (Vercel auto-deploy)
    │
    └── Done
```

### Setting Up Deploy Hook (Render)

1. Go to your Render service **Settings**
2. Scroll to **Deploy Hook**
3. Copy the URL
4. Add it as `RENDER_DEPLOY_HOOK` in your GitHub repo **Settings → Secrets → Actions**
5. Add `DATABASE_URL` as a secret too (for the migration step)

---

## 9. Pre-Deployment Checklist

### Security
- [ ] Generate strong JWT secrets (>=48 chars, cryptographically random)
- [ ] Change default admin password after first login (`admin@edwix.local` / `Admin123!`)
- [ ] Configure CORS to allow only your Vercel domain
- [ ] Ensure `NODE_ENV=production` is set on Render
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] No secrets committed to git (verify `.env` is in `.gitignore`)

### Database
- [ ] Run `npx prisma migrate deploy` against Supabase
- [ ] Run `npx prisma db seed` for initial data
- [ ] Verify tables created via Supabase Table Editor or Prisma Studio
- [ ] Test database connection from Render service

### Build
- [ ] `npm run build` succeeds locally
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

### Infrastructure
- [ ] Backend health check responds at `/api/health`
- [ ] Frontend loads and shows login page
- [ ] API docs accessible at `/api/docs`
- [ ] Keep-alive cron configured (cron-job.org)

---

## 10. Post-Deployment Verification

### Smoke Tests

```bash
# 1. Health check
curl https://edwix.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}

# 2. API docs
open https://edwix.onrender.com/api/docs

# 3. Login with default admin
curl -X POST https://edwix.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edwix.local","password":"Admin123!"}'
# Expected: {"data":{"accessToken":"...","refreshToken":"..."}}

# 4. Frontend loads
open https://edwix-web.vercel.app
# Expected: Login page renders, can log in

# 5. Test authenticated endpoint
TOKEN="<accessToken from login response>"
curl https://edwix.onrender.com/api/v1/dashboard \
  -H "Authorization: Bearer $TOKEN"
# Expected: Dashboard data

# 6. IMPORTANT: Change admin password immediately
curl -X PUT https://edwix.onrender.com/api/v1/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Admin123!","newPassword":"<strong-new-password>"}'
```

---

## 11. Monitoring & Maintenance

### Health Monitoring

| Tool | Purpose | Cost |
|------|---------|------|
| [UptimeRobot](https://uptimerobot.com) | Monitor `/api/health` every 5 min, alerts on downtime | Free (50 monitors) |
| [cron-job.org](https://cron-job.org) | Keep-alive ping every 14 min (prevents Render + Supabase sleep) | Free |
| [BetterStack](https://betterstack.com) | Status page + alerting | Free tier |

### Database Monitoring

- **Supabase Dashboard**: built-in usage metrics, table sizes, active connections
- Check storage usage: **Project Settings → Usage** (free tier limit: 500 MB)

### Logs

- **Render**: real-time logs in the dashboard under your service → **Logs** tab
- **Vercel**: function and deployment logs under **Deployments → Logs**
- **Supabase**: query logs under **Logs → Postgres**

---

## 12. Scaling Path

| Signal | Action | New Cost |
|--------|--------|----------|
| Cold starts too slow (~30-60s) | Upgrade Render to **Starter** ($7/mo) | +$7/mo |
| Database > 500 MB | Upgrade Supabase to **Pro** ($25/mo) | +$25/mo |
| Commercial use on Vercel | Upgrade Vercel to **Pro** ($20/mo) | +$20/mo |
| Need Redis/queues | Add **Upstash Redis** (free tier: 256 MB, 500K cmds/mo) | $0 |
| Need file storage | Add **Supabase Storage** (1 GB free) or **Cloudflare R2** (10 GB free) | $0 |
| High traffic (>10K DAU) | Move backend to dedicated hosting (Railway, Fly.io, VPS) | $50-100/mo |

### Cost Projection

| Stage | Monthly Cost | Supports |
|-------|-------------|----------|
| **MVP / Launch** | **$0** | <100 users, <500 MB data |
| **Growth** | **$32-52** | <1K users, <8 GB data, always-on |
| **Scale** | **$100-200** | <10K users, dedicated infrastructure |

---

## Quick Reference

```bash
# Local development
docker compose up -d          # Start local PostgreSQL + Redis
npm run db:migrate            # Run migrations
npm run db:seed               # Seed data
npm run dev                   # Start API (3001) + Web (5173)

# Production database setup (first time only)
export DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
npx prisma db seed

# Build (verify before pushing)
npm run build
npm run lint
npm run test
```
