# Production Deployment Guide

This guide covers deploying PhotoFlow to a single VPS or Docker host. For high-traffic workloads, split API, worker, and AI services across separate nodes.

## Prerequisites

- Ubuntu 22.04+ (or similar Linux host)
- Docker and Docker Compose
- Domain name with DNS pointing to the server
- TLS certificate (Let's Encrypt via Certbot recommended)
- MySQL 8, Redis 7, and Qdrant (included in `docker-compose.yml`)

## 1. Server preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git
sudo usermod -aG docker $USER
```

Create application directories:

```bash
sudo mkdir -p /var/photo-platform/{data,backups}
sudo chown -R $USER:$USER /var/photo-platform
```

## 2. Configure environment

Copy `.env.example` to `.env` on the server and set production values:

| Variable | Notes |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | At least 32 random characters |
| `JWT_REFRESH_SECRET` | At least 32 random characters |
| `DATABASE_URL` | MySQL connection string |
| `REDIS_URL` | Redis connection string |
| `CORS_ORIGIN` | Your web app origin (no wildcards) |
| `PUBLIC_WEB_URL` | Public URL of the web app |
| `STORAGE_ROOT` | Writable path, e.g. `/var/photo-platform/data` |
| `RAZORPAY_*` | Live Razorpay keys and webhook secret |
| `QDRANT_URL` | Internal Qdrant URL |
| `AI_SERVICE_URL` | Internal AI service URL |

Run the security audit after deploy:

```text
GET /api/v1/admin/security-audit
```

All critical checks must pass before going live.

## 3. Database setup

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed --workspace=@photo-platform/api
```

For production schema changes, prefer Prisma migrations:

```bash
npm run db:migrate --workspace=@photo-platform/api
```

## 4. Build and start services

### Docker Compose (recommended)

```bash
docker compose build
docker compose up -d mysql redis qdrant ai-service api worker web nginx
```

Verify health:

```bash
curl -f http://localhost:3001/api/v1/health
curl -f http://localhost:3001/api/v1/ready
```

### Manual process layout

If not using full Docker Compose:

1. **API** — `npm run build && npm run start --workspace=@photo-platform/api`
2. **Worker** — `npm run build && npm run start --workspace=@photo-platform/worker`
3. **Web** — build with Vite and serve `apps/web/dist` via Nginx
4. **AI service** — run the FastAPI container or `uvicorn` behind an internal network

Use a process manager (systemd or PM2) for API and worker restarts.

## 5. Nginx and TLS

Point Nginx at the API (`3001`) and web (`5173` or static `dist`) upstreams. Example server block:

```nginx
server {
  listen 443 ssl http2;
  server_name app.example.com;

  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 50m;
  }

  location / {
    root /var/photo-platform/web/dist;
    try_files $uri /index.html;
  }
}
```

Issue certificates:

```bash
sudo certbot --nginx -d app.example.com
```

## 6. Worker and queues

The worker processes:

- Image processing
- Face detection and embedding
- Vector indexing
- Guest face search
- Privacy cleanup (hourly)

Ensure Redis is reachable. Monitor failed jobs at `/admin/ai-processing`.

## 7. Storage

- **VPS mode** — mount persistent disk at `STORAGE_ROOT`
- **S3 mode** — configure bucket, region, and credentials in admin storage settings

Enable nightly backups for MySQL and storage files.

## 8. Monitoring checklist

- API `/health` and `/ready` uptime checks
- Redis and MySQL connectivity
- Qdrant collection health
- AI service `/health`
- Disk usage on `STORAGE_ROOT`
- BullMQ failed job count
- Razorpay webhook delivery logs

## 9. Load testing

With the API running locally or on staging:

```bash
LOAD_TEST_URL=http://localhost:3001 \
LOAD_TEST_CONCURRENCY=50 \
LOAD_TEST_DURATION_SEC=30 \
npm run load-test
```

For upload and guest flows, extend the script or use k6 with authenticated scenarios.

## 10. Rollback

1. Stop API and worker containers
2. Restore MySQL from backup
3. Restore `STORAGE_ROOT` snapshot if needed
4. Deploy previous image tag or git revision
5. Re-run migrations only if the rollback revision requires it

## 11. Post-deploy smoke test

1. Register a business account
2. Create an event and upload photos
3. Confirm worker processes images to `READY`
4. Open guest QR flow, submit selfie, verify gallery
5. Run admin overview and security audit pages
