# AI Photo Sharing Platform — Implementation Plan

## Approach

Phased delivery. Each phase is independently testable. MVP focuses on the golden workflow:

**Create Event → Upload → Store → Process → Index → QR → Selfie → Search → Gallery**

Admin dashboard lives at `/admin` (direct URL only, no navigation button in main app).

---

## Phase Overview

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Monorepo, React, Express, MySQL, Prisma, Redis, Docker | **Current** |
| 2 | Authentication, Business, Roles, Tenant isolation | **Complete** |
| 3 | Event management, Folders, Settings | **Complete** |
| 4 | Storage abstraction, VPS, S3, Upload system | **Complete** |
| 5 | Image processing (Sharp: thumbnails, previews, watermarks) | **Complete** |
| 6 | BullMQ queue infrastructure | **Complete** |
| 7 | Python AI service (FastAPI) | **Complete** |
| 8 | Face recognition, Embeddings, Qdrant | **Complete** |
| 9 | QR generation (PNG, SVG, branded) | **Complete** |
| 10 | Guest mobile experience (event page, consent) | **Complete** |
| 11 | Selfie capture (camera, validation) | **Complete** |
| 12 | Face matching (guest search pipeline) | **Complete** |
| 13 | Personalized gallery (masonry, viewer, lazy load) | **Complete** |
| 14 | Favorites, Downloads, Sharing | **Complete** |
| 15 | Analytics | **Complete** |
| 16 | Subscriptions, Razorpay | **Complete** |
| 17 | Admin panel (full controls + data display) | **Complete** |
| 18 | Privacy, Security hardening | **Complete** |
| 19 | Testing (unit, integration, E2E) | **In progress** |
| 20 | Load testing | Pending |
| 21 | Production deployment | Pending |

---

## Phase 1 — Foundation (Current)

### Deliverables

- [x] Monorepo with npm workspaces
- [x] `apps/web` — React + Vite + TypeScript + Tailwind + React Router
- [x] `apps/api` — Express + TypeScript + Pino + Helmet
- [x] `apps/worker` — Worker process skeleton
- [x] `apps/ai-service` — Python FastAPI skeleton
- [x] `packages/shared-types`, `packages/validation`, `packages/config`
- [x] Prisma schema (full entity model)
- [x] Docker Compose (mysql, redis, qdrant, api, worker, web, ai-service, nginx)
- [x] Health checks (`/health`, `/ready`)
- [x] Nginx reverse proxy configuration
- [x] `.env.example`
- [x] Route shells: marketing, auth, dashboard, guest, **admin (`/admin`)**
- [x] README

### Admin Route Structure (Phase 1 Shell)

```
/admin                    → Admin overview
/admin/businesses         → Business management
/admin/users              → User management
/admin/events             → Event management
/admin/photos             → Photo management
/admin/storage            → Storage management
/admin/ai-processing      → AI queue status
/admin/subscriptions      → Subscription management
/admin/payments           → Payment records
/admin/audit-logs         → Audit log viewer
/admin/settings           → System settings
```

No link/button to `/admin` in photographer or guest UI. Access via direct URL only.

### Acceptance Criteria

- `docker compose up` starts all services
- API responds on `/api/v1/health` and `/api/v1/ready`
- Web serves at `/` with marketing page
- Admin layout accessible at `/admin`
- TypeScript compiles without errors
- Prisma schema validates

---

## Phase 2 — Authentication & Tenancy

- User registration, login, logout
- JWT access token + rotating refresh token (HTTP-only cookie)
- Password reset, email verification scaffolding
- Business creation on registration
- Role system: SUPER_ADMIN, OWNER, ADMIN, UPLOADER, EDITOR, VIEWER
- Tenant isolation middleware
- Protected routes on frontend
- Admin auth guard (SUPER_ADMIN only)

---

## Phase 3 — Event Management

- CRUD events with all fields
- Event privacy modes (PRIVATE_PERSONALIZED, CONTROLLED_GALLERY, PUBLIC_GALLERY)
- Event token generation (high entropy)
- Folders within events
- Event settings (expiry, downloads, guest uploads, branding, watermark config)
- Event dashboard UI

---

## Phase 4 — Storage & Upload

- StorageProvider interface
- VPSStorageProvider implementation
- S3StorageProvider implementation
- Upload sessions (chunked/resumable)
- Duplicate detection (checksum + size + event)
- Admin storage configuration
- Storage usage tracking schema

---

## Phase 5 — Image Processing ✅

- Sharp pipeline: thumbnail, preview, watermarked, AI copy (`@photo-platform/image-processing`)
- Processing status tracking on photos (`PROCESSING` → `READY` / `FAILED`)
- BullMQ `image-processing` queue with inline fallback when Redis unavailable
- Worker handler for async processing
- Photo grid on event dashboard with status badges and auto-refresh
- Upload retry for failed files; photo reprocessing API (`POST /photos/:id/retry-processing`)

---

## Phase 6 — BullMQ ✅

- `@photo-platform/queues` — centralized queue names, job options, payload types
- Shared queue manager with exponential backoff retry (3 attempts, 2s base delay)
- Worker uses shared config, structured logging, DB connection on startup
- Admin API: `GET /admin/queues`, `GET /admin/queues/:name/jobs`, `POST .../retry`, `DELETE .../jobs/:id`
- Admin UI at `/admin/ai-processing` — live queue stats, failed job list with retry

---

## Phase 7 — AI Service ✅

- FastAPI service with face detect, embedding, match, and quality-check endpoints
- InsightFace (buffalo_sc) with OpenCV fallback for local/dev
- `@photo-platform/ai-client` — `FaceRecognitionProvider` HTTP abstraction
- Worker pipeline: image-processing → face-detection → face-embedding per face
- Embeddings stored in `FaceEmbedding.embeddingVector` (Qdrant indexing in Phase 8)

---

## Phase 8 — Vector Search ✅

- `@photo-platform/vector-store` — Qdrant client with cosine ANN search
- Auto-creates `photo_platform_faces` collection with `eventId` payload index
- Worker `vector-indexing` job after face embedding (pipeline: … → face-embedding → vector-indexing)
- Qdrant cleanup when faces are re-detected on a photo
- `POST /api/v1/events/:id/faces/search` — event-filtered similarity search

---

## Phase 9 — QR System ✅

- PNG and SVG QR generation with optional branded layout (event name)
- Stored in `qr_codes` table + VPS/S3 for PNG assets
- API: `GET/POST /events/:id/qr`, preview and download endpoints
- Event dashboard QR modal: preview, PNG/SVG download, print

---

## Phase 10 — Guest Mobile Experience ✅

- Public guest API (no auth): event info, session creation, consent recording
- `GuestSession` + `GuestConsent` persisted with 24h session TTL
- Mobile-first event landing page with branding, date, location, photo count
- Privacy consent screen with checkbox + versioned consent (`1.0`)
- Guest session store (`sessionStorage`) + route guards for consent flow
- API: `GET/POST /guest/events/:eventToken`, `GET/POST /guest/sessions/:sessionToken`

---

## Phase 11 — Selfie Capture ✅

- Guest selfie API: validate (face detect + quality check) and submit (store + `GuestSearch`)
- AI service integration for face detection and quality scoring
- Mobile camera UI with oval face guide, mirror preview, capture button
- Photo upload fallback for desktop / denied camera permission
- Preview screen with validation feedback, retake, and submit flow
- Processing page polls search status (matching wired in Phase 12)
- API: `POST /guest/sessions/:token/selfie/validate`, `POST .../selfie`, `GET .../searches/:id`

---

## Phase 12 — Guest Face Matching ✅

- `guest-face-search` BullMQ worker: selfie embedding → Qdrant ANN search → `GuestSearchMatch` records
- `GuestSearchMatch` model stores ranked photo matches per search
- Selfie submit enqueues matching job; search status tracks pending/complete/failed
- Guest API returns match results with session-scoped photo URLs
- `GET /guest/sessions/:token/searches/:id` returns matches when complete
- `GET /guest/sessions/:token/photos/:photoId/file` serves matched photos only
- Processing page auto-redirects to gallery; basic matched-photo grid

---

## Phase 13 — Personalized Gallery ✅

- CSS masonry grid with natural aspect ratios from photo dimensions
- `LazyGuestImage` with Intersection Observer + loading shimmer
- Full-screen `GuestPhotoViewer`: swipe, keyboard nav, match score, adjacent preload
- Gallery header with photo count and “New selfie” action
- `viewerUrl` on matches (watermarked → preview fallback) for high-quality viewing

---

## Phase 14 — Engagement ✅

- Guest favorites: toggle per photo, `Saved` filter tab, heart badges in grid and viewer
- Authorized downloads: respects `event.downloadEnabled`, match access check, audit in `downloads` table
- Share: native Web Share API with clipboard fallback for event link
- API: `POST .../photos/:id/favorite`, `GET .../photos/:id/download`
- Search results include `isFavorite`, `downloadEnabled`, `shareUrl`, `eventName`

---

## Phase 15 — Analytics ✅

- Business overview API: totals for photos, guest searches, downloads, sessions, favorites, storage
- Daily trend series for guest searches and downloads (14-day default)
- Event analytics API with engagement metrics and recent search activity
- Dashboard home widgets wired to live analytics data
- Event dashboard guest engagement section with charts

---

## Phase 16 — Billing ✅

- Plan definitions seeded for FREE, STARTER, PROFESSIONAL, and STUDIO tiers
- Razorpay checkout order creation, payment verification, and webhook handler
- Subscription activation with invoice generation on successful payment
- Quota enforcement for events, photo uploads, storage, and guest face searches
- Subscription page with usage meters, plan comparison, and Razorpay checkout

---

## Phase 17 — Admin Panel (Full) ✅

- Platform overview with live metrics, service health, and recent audit activity
- Admin APIs for events, photos, subscriptions, payments, and audit logs
- Businesses, users, and storage pages wired to live data
- Job queues page (existing) with BullMQ observability
- System settings editor for storage provider configuration

---

## Phase 18 — Privacy & Security ✅

- Configurable guest data retention policies (session + selfie days, auto-expire events)
- Hourly cleanup worker job for expired sessions, old selfies, and expired events
- Guest self-service data deletion (`DELETE /guest/sessions/:token/data`)
- Stricter rate limits on guest selfie/session routes and photo uploads
- Security audit endpoint with environment and configuration checks
- Admin Privacy & Security page for retention settings, cleanup, and audit

---

## Phase 19–21 — Quality & Production

### Phase 19 — Testing (in progress)

- Tenant isolation unit tests (events, storage keys, auth middleware)
- API integration tests with Supertest (`/health`, auth guards, 404)
- Shared validation schema tests
- JWT round-trip tests
- Security audit service tests
- `npm run test:integration` for API integration suite
- `npm run load-test` for basic throughput benchmarking

### Phase 20–21

- E2E browser tests (Playwright)
- Tenant isolation integration suite against test DB
- Load testing (1K–50K photos)
- AI POC with real photos
- Production deployment guide (`DEPLOYMENT.md`)

---

## MVP Scope

Authentication, Business, Event, Photo upload, VPS + S3 storage, Image processing, AI face indexing, Qdrant, QR, Guest selfie, Face matching, Personalized gallery, Downloads, Basic watermark, Basic privacy, **Admin**, Usage tracking, Basic subscription.

---

## Out of Scope (Initial)

Portfolio builder, CRM, custom domains, wedding websites, bookings, FTP transfer, live camera delivery, native mobile apps, advanced integrations.

Architecture remains extensible for future features.
