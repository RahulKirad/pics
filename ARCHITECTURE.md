# AI Photo Sharing Platform — System Architecture

## Overview

Production SaaS platform for photographers and studios. Core workflow:

**Create Event → Upload Photos → AI Face Processing → QR → Guest Selfie → Face Matching → Personalized Gallery**

Multi-tenant, event-isolated, mobile-first, with dual storage backends (VPS filesystem and S3-compatible object storage).

---

## High-Level Architecture

```
                                    ┌─────────────────┐
                                    │     Nginx       │
                                    │  Reverse Proxy  │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
     ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
     │   React Web     │           │   Express API   │           │  Static Assets  │
     │   (Vite/TS)     │           │   /api/v1       │           │  (CDN optional) │
     └─────────────────┘           └────────┬────────┘           └─────────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
              ▼                             ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
     │     MySQL 8     │           │     Redis       │           │    Qdrant       │
     │  (Source of     │           │  BullMQ Queues  │           │ Face Embeddings │
     │   Truth)        │           │  Cache/Sessions │           │  (ANN Search)   │
     └─────────────────┘           └────────┬────────┘           └─────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  Worker Process │
                                   │  (BullMQ Jobs)  │
                                   └────────┬────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
              ▼                             ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
     │  Storage Layer  │           │  AI Service     │           │  External APIs  │
     │  VPS / S3       │           │  (FastAPI)      │           │  Razorpay       │
     └─────────────────┘           └─────────────────┘           └─────────────────┘
```

---

## Monorepo Structure

```
apps/
  web/           React frontend (photographer, guest, marketing, admin)
  api/           Express REST API
  worker/        BullMQ background job processor
  ai-service/    Python FastAPI face recognition service

packages/
  shared-types/  Shared TypeScript interfaces
  validation/    Shared Zod schemas
  config/        Environment configuration

docker/          Dockerfiles per service
nginx/           Reverse proxy configuration
data/            VPS storage mount (dev)
```

---

## Database Architecture (MySQL + Prisma)

MySQL is the **source of truth** for all relational data.

### Core Entity Groups

| Group | Entities |
|-------|----------|
| Identity | users, refresh_tokens, password_reset_tokens |
| Tenancy | businesses, business_members |
| Billing | plans, subscriptions, payments, invoices, usage_records |
| Events | events, event_members, folders, qr_codes, watermarks |
| Media | photos, photo_faces, face_embeddings |
| Guests | guest_sessions, guest_consents, guest_searches, guest_uploads |
| Engagement | favorites, downloads, notifications |
| Platform | storage_usage, audit_logs, system_settings |

### Indexing Strategy

- Composite indexes on `(businessId, status)`, `(eventId, status)`
- Unique index on `events.eventToken`
- Index on `photos.checksum`, `photos.eventId`
- Index on `audit_logs(businessId, createdAt)`

### Multi-Tenancy

Every tenant-owned query includes `businessId` from JWT/session — never from client input.

---

## Storage Architecture

### Abstraction Layer

```typescript
interface StorageProvider {
  upload(key, stream, metadata): Promise<StorageResult>
  multipartUpload(session): Promise<MultipartResult>
  createUploadSession(params): Promise<UploadSession>
  getSignedUrl(key, options): Promise<string>
  getPublicUrl(key): Promise<string>
  download(key): Promise<ReadableStream>
  delete(key): Promise<void>
  exists(key): Promise<boolean>
  getMetadata(key): Promise<StorageMetadata>
  createDirectory(key): Promise<void>
  getStorageUsage(prefix): Promise<StorageUsage>
}
```

### Implementations

- **VPSStorageProvider** — Local filesystem under `STORAGE_ROOT`
- **S3StorageProvider** — S3-compatible (AWS, R2, MinIO, DO Spaces)

### Storage Key Format

```
tenant_{businessId}/event_{eventId}/{variant}/{photoId}.{ext}
```

Variants: `originals`, `previews`, `thumbnails`, `watermarked`, `guest_uploads`, `ai`, `temp`

Database stores logical `storageKey` — never absolute filesystem paths as primary identifiers.

### VPS Security

- Storage root NOT exposed via Nginx
- Files served through authenticated API or X-Accel-Redirect
- Path traversal prevention on all file operations
- Storage paths generated server-side only

---

## AI Architecture

### Python FastAPI Service (Internal Only)

```
apps/ai-service/
  app/
    main.py
    api/
    services/
      face_detection.py
      face_embedding.py
      face_matching.py
      quality_check.py
    schemas/
    models/
    utils/
```

### Face Recognition Provider Abstraction

```typescript
interface FaceRecognitionProvider {
  detectFaces(image): Promise<DetectedFace[]>
  generateEmbedding(face): Promise<number[]>
  searchSimilar(embedding, filters): Promise<MatchResult[]>
}
```

### Processing Pipeline (Async via BullMQ)

```
UPLOAD → VALIDATE → CREATE AI COPY → DETECT FACES → QUALITY CHECK
  → GENERATE EMBEDDINGS → STORE METADATA → INDEX IN QDRANT → MARK READY
```

### Qdrant Vector Store

- Collection per environment (filtered by `eventId` on every search)
- Payload: `{ photoFaceId, photoId, eventId, businessId }`
- Never search without event filter

---

## Queue Architecture (BullMQ + Redis)

| Queue | Purpose |
|-------|---------|
| photo-upload | Upload completion handling |
| image-processing | Sharp transformations |
| thumbnail-generation | Thumbnail creation |
| preview-generation | Preview creation |
| watermark-generation | Watermark application |
| face-detection | AI face detection |
| face-embedding | Embedding generation |
| vector-indexing | Qdrant indexing |
| guest-face-search | Guest selfie matching |
| cleanup | Retention/expiry cleanup |
| storage-usage | Background usage aggregation |
| analytics | Metrics aggregation |
| notifications | Email/push notifications |

Jobs: idempotent, retryable with exponential backoff, observable via Bull Board (admin).

---

## API Architecture

Base path: `/api/v1`

### Module Structure

```
apps/api/src/
  config/
  database/
  middleware/
  common/
  modules/
    auth/
    users/
    businesses/
    events/
    photos/
    uploads/
    guests/
    admin/
    storage/
    ...
```

Each module: `controller`, `service`, `repository`, `routes`, `schema`, `types`

### Response Format

```json
{ "success": true, "data": {}, "message": "Success" }
{ "success": false, "error": { "code": "EVENT_NOT_FOUND", "message": "..." } }
```

---

## Frontend Architecture

### Route Structure

| Path | Audience | Purpose |
|------|----------|---------|
| `/` | Public | Marketing landing |
| `/login`, `/register` | Public | Authentication |
| `/dashboard/*` | Photographer | Business dashboard |
| `/e/:eventToken` | Guest | Event entry (QR) |
| `/e/:eventToken/selfie` | Guest | Camera/selfie |
| `/e/:eventToken/gallery` | Guest | Personalized gallery |
| `/admin/*` | Super Admin | Platform administration (no nav link) |

### State Management

- **TanStack Query** — Server state, caching, mutations
- **Zustand** — Client-only state (upload progress, UI preferences)
- **React Hook Form + Zod** — Form validation

### Design System

Tailwind CSS + shadcn/ui components. Centralized design tokens. Framer Motion for animations. `prefers-reduced-motion` respected.

---

## Admin Architecture

Accessible only via `/admin` URL (no button in main navigation).

### Sections

- Overview (platform metrics)
- Businesses, Users, Events, Photos
- Storage (VPS + cloud usage per tenant)
- AI Processing (queue status, face stats)
- Subscriptions, Payments
- Audit Logs, System Settings

Admin routes protected by `SUPER_ADMIN` role. Separate layout from photographer dashboard.

---

## Security Architecture

| Layer | Controls |
|-------|----------|
| Transport | HTTPS, Helmet, CORS |
| Auth | JWT (short-lived) + rotating refresh (HTTP-only cookie) |
| Authorization | Role-based + tenant isolation at every layer |
| Upload | MIME validation, file signature, size limits |
| Storage | No path traversal, server-generated keys |
| Guest | High-entropy event tokens, rate limiting |
| Vector | Mandatory eventId filter on all searches |
| Secrets | Never returned to frontend, env-only |

---

## Deployment Architecture

### Docker Compose (Development)

Services: mysql, redis, qdrant, api, worker, web, ai-service, nginx

### Production

- Nginx reverse proxy with SSL termination
- API + Worker horizontally scalable
- MySQL primary/replica
- Redis cluster
- Qdrant cluster
- S3/R2 for production storage (VPS optional)
- CDN for thumbnail/preview delivery

### Health Checks

- `GET /health` — Liveness
- `GET /ready` — Readiness (MySQL, Redis, Qdrant, AI service, Storage)

---

## Event Isolation (Critical)

```
Guest Request → eventToken → resolve eventId → generate embedding
  → Qdrant search WITH eventId filter → photo IDs → MySQL → gallery
```

Guest requests NEVER accept arbitrary eventId. Cross-event data leakage is prevented at API, service, repository, storage, and vector layers.

---

## Scalability Considerations

- Storage abstraction enables migration from single VPS to multi-server
- Queue-based async processing prevents HTTP blocking
- Cursor pagination for large galleries
- Background storage usage aggregation
- Virtualized grids for large photo sets
- Connection pooling for MySQL
- Redis caching for hot data
