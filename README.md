# PhotoFlow — AI Photo Sharing Platform

Production-quality SaaS platform for photographers, photography studios, and event photographers.

**Core workflow:** Create Event → Upload Photos → AI Face Processing → QR → Guest Selfie → Face Matching → Personalized Gallery

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, TanStack Query, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript, Prisma, MySQL 8 |
| Queue | Redis, BullMQ |
| AI | Python, FastAPI, InsightFace (Phase 7) |
| Vector DB | Qdrant |
| Storage | VPS filesystem + S3-compatible (abstraction layer) |
| Infra | Docker, Docker Compose, Nginx |

## Monorepo Structure

```
apps/
  web/           React frontend (marketing, dashboard, guest, admin)
  api/           Express REST API
  worker/        BullMQ background jobs
  ai-service/    Python FastAPI face recognition

packages/
  shared-types/  Shared TypeScript interfaces
  validation/    Shared Zod schemas
  config/        Environment configuration
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Python 3.12+ (for local AI service development)

### 1. Clone and configure

```bash
cp .env.example .env
```

### 2. Start infrastructure with Docker

```bash
docker compose up -d mysql redis qdrant ai-service
```

### 3. Install dependencies

```bash
npm install
```

### 4. Database setup

```bash
npm run db:generate
npm run db:push
```

### 5. Start development servers

```bash
# Terminal 1 — API
npm run dev:api

# Terminal 2 — Web
npm run dev:web

# Terminal 3 — Worker (processes image + face jobs)
npm run dev:worker

# Terminal 4 — AI service (optional locally; Docker recommended)
cd apps/ai-service && uvicorn app.main:app --reload --port 8000
```

Or start everything with Docker:

```bash
docker compose up
```

### Access Points

| Service | URL |
|---------|-----|
| Web (marketing + app) | http://localhost:5173 |
| API | http://localhost:3001/api/v1 |
| Health check | http://localhost:3001/api/v1/health |
| Readiness check | http://localhost:3001/api/v1/ready |
| Admin console | http://localhost:5173/admin |
| Guest event page | http://localhost:5173/e/{eventToken} |
| Nginx proxy | http://localhost:80 |
| AI service (internal) | http://localhost:8000 |

> **Admin access:** Navigate directly to `/admin`. There is no link in the main navigation.

## Environment Variables

See `.env.example` for all configuration options. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `REDIS_URL` | Redis connection string |
| `QDRANT_URL` | Qdrant vector database URL |
| `STORAGE_DRIVER` | `vps` or `s3` |
| `STORAGE_ROOT` | VPS storage root path |
| `JWT_SECRET` | Access token secret |
| `AI_SERVICE_URL` | Internal AI service URL |

## Scripts

```bash
npm run dev          # Start web + api
npm run dev:web      # Start frontend only
npm run dev:api      # Start API only
npm run dev:worker   # Start worker only
npm run build        # Build all packages
npm run typecheck    # TypeScript checks
npm run test         # Run tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account + business |
| POST | `/api/v1/auth/login` | Sign in (sets refresh cookie) |
| POST | `/api/v1/auth/refresh` | Rotate refresh token |
| POST | `/api/v1/auth/logout` | Sign out |
| GET | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password |
| GET | `/api/v1/businesses/me` | Current business |
| GET | `/api/v1/events` | List events (paginated) |
| POST | `/api/v1/events` | Create event |
| GET | `/api/v1/events/:id` | Get event |
| PATCH | `/api/v1/events/:id` | Update event |
| POST | `/api/v1/events/:id/archive` | Archive event |
| DELETE | `/api/v1/events/:id` | Soft delete event |
| GET | `/api/v1/events/:eventId/folders` | List folders |
| POST | `/api/v1/events/:eventId/folders` | Create folder |
| GET | `/api/v1/admin/overview` | Admin overview (SUPER_ADMIN) |

Access tokens are returned in the response body. Refresh tokens are stored in HTTP-only cookies.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design, storage architecture, AI pipeline, security model, and deployment topology.

## Implementation Plan

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for phased delivery roadmap.

**Current phase:** Phase 4 — Storage abstraction, VPS + S3, Upload system

## Security Notes

- VPS storage root is never exposed via Nginx
- Private files served through authenticated API endpoints only
- Admin panel accessible only via direct `/admin` URL
- Guest galleries use `noindex` (Phase 10+)
- Event tokens are high-entropy, non-sequential

## License

Proprietary — All rights reserved.
