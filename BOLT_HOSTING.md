# PicShareNow on Bolt AI (Bolt Database)

This project is **frontend-only**. There is no Express API, worker, or Python AI service.

## What runs in the browser

- Marketing site + Gemini assistant (`VITE_GEMINI_API_KEY`)
- Photographer auth, events, uploads (Bolt Database + Storage)
- Face detection + embeddings (`@vladmandic/face-api`)
- Guest selfie match via `match_guest_faces` (embeddings never returned to clients)

## Bolt publish checklist

1. Open/import this repo in **Bolt.new** and publish.
2. In **Bolt Database**, run SQL from [`bolt/schema.sql`](bolt/schema.sql).
3. Create storage bucket **`event-photos`** (public read for guest galleries).
4. Set project secrets / `.env`:

```env
VITE_BOLT_DATABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_BOLT_DATABASE_ANON_KEY=your-anon-key
VITE_BOLT_STORAGE_BUCKET=event-photos
VITE_GEMINI_API_KEY=your-gemini-key
VITE_GEMINI_MODEL=gemini-2.5-flash-lite
VITE_GEMINI_THINKING_LEVEL=low
```

Bolt also accepts legacy names `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

5. Build command: `npm run build --workspace=@photo-platform/web` or from `apps/web`: `npm run build`.
6. After deploy, open **`/debug`** and copy the JSON bundle if anything fails.

## Local dev without Bolt

If env vars are missing, the app uses **local demo mode** (localStorage). Register/login still works for UI testing.

### Vite `504 Outdated Optimize Dep`

After dependency changes, restart with a fresh optimizer cache:

```bash
npm run dev:clean
```

Hard-refresh the browser (Cmd+Shift+R). This only affects local Vite dev — **production builds on Bolt use `npm run build`** and do not hit this error.

## Removed (server-only)

- Admin console, billing (Razorpay), job queues, Docker stack, monorepo API packages.
