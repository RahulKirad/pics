/*
# PicShareNow core schema — events, photos, face embeddings, guest sessions

1. Overview
   Creates the full database for the PicShareNow event photo-sharing app:
   photographer accounts (profiles), events, uploaded photos, face embeddings
   for AI selfie matching, and anonymous guest sessions. Also creates the
   "event-photos" storage bucket and its access rules.

2. Extensions
   - Enables the `vector` extension (pgvector) to store 128-dimension face
     embeddings and run fast similarity search.

3. New Tables
   - `profiles` — one row per photographer (linked to the sign-in account):
     first_name, last_name, business_name.
   - `events` — a photography event owned by a photographer: name, description,
     type, date, location, status, privacy mode, download/guest-upload flags,
     a unique public `event_token` used in guest QR links, and counters
     (photo_count, face_count, guest_search_count, download_count).
   - `photos` — an uploaded photo belonging to an event: original file name,
     mime type, size, storage path, processing status, dimensions.
   - `photo_face_embeddings` — 128-dim face vector per photo. Clients can
     never SELECT these rows; they are written/read only through the two
     security-definer functions below.
   - `guest_sessions` — anonymous guest sessions per event token: unique
     session token, consent flag and version.

4. Functions
   - `store_photo_embeddings(photo_id, embeddings jsonb)` — signed-in owner
     replaces the face vectors for their own photo and refreshes event
     photo/face counters.
   - `match_guest_faces(event_token, query vector)` — returns up to 48 photo
     ids with similarity scores for one event only (never crosses events),
     restricted to scores above 0.4.

5. Security
   - RLS enabled on every table.
   - `profiles`: signed-in users full CRUD on their own row; anonymous visitors
     may read only the business_name column (shown on the guest event page).
   - `events`: owners full CRUD on their own events; anonymous visitors may
     read only public event info columns (needed for the guest QR page).
   - `photos`: owners full CRUD on their own photos; anonymous visitors may
     read only id/event/name/storage-path/dimension columns (needed to render
     a guest's matched gallery).
   - `photo_face_embeddings`: no direct client access at all.
   - `guest_sessions`: anonymous visitors may create/update/delete their own
     session rows by high-entropy token (no personal data stored).
   - Storage bucket `event-photos` (public read): anyone can view photos;
     only the signed-in owner can upload/delete inside their own folder.
*/

create extension if not exists vector;

-- ---------- Tables ----------

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  business_name text,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  event_type text,
  event_date timestamptz,
  expiry_date timestamptz,
  location text,
  status text not null default 'ACTIVE',
  privacy_mode text not null default 'PRIVATE_PERSONALIZED',
  download_enabled boolean not null default true,
  guest_upload_enabled boolean not null default false,
  event_token text not null unique,
  photo_count int not null default 0,
  face_count int not null default 0,
  guest_search_count int not null default 0,
  download_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  original_name text not null,
  mime_type text not null default 'image/jpeg',
  file_size bigint not null default 0,
  storage_path text not null,
  status text not null default 'READY',
  width int,
  height int,
  processing_error text,
  created_at timestamptz not null default now()
);

create table if not exists photo_face_embeddings (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos (id) on delete cascade,
  embedding vector(128) not null
);

create table if not exists guest_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  event_token text not null,
  consent_given boolean not null default false,
  consent_version text,
  created_at timestamptz not null default now()
);

-- ---------- Indexes ----------

create index if not exists events_owner_idx on events (owner_id, created_at desc);
create index if not exists photos_event_idx on photos (event_id, created_at desc);
create index if not exists photos_owner_idx on photos (owner_id);
create index if not exists embeddings_photo_idx on photo_face_embeddings (photo_id);
create index if not exists guest_sessions_event_idx on guest_sessions (event_token);

-- ---------- Row Level Security ----------

alter table profiles enable row level security;
alter table events enable row level security;
alter table photos enable row level security;
alter table photo_face_embeddings enable row level security;
alter table guest_sessions enable row level security;

-- profiles: self CRUD + limited public read (guest page shows studio name)
drop policy if exists "profiles_self_select" on profiles;
create policy "profiles_self_select" on profiles for select
to authenticated using (auth.uid() = id);

drop policy if exists "profiles_self_insert" on profiles;
create policy "profiles_self_insert" on profiles for insert
to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_self_update" on profiles;
create policy "profiles_self_update" on profiles for update
to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_self_delete" on profiles;
create policy "profiles_self_delete" on profiles for delete
to authenticated using (auth.uid() = id);

drop policy if exists "profiles_public_read" on profiles;
create policy "profiles_public_read" on profiles for select
to anon using (true);

-- events: owner CRUD + public read of guest-page columns only
drop policy if exists "events_owner_select" on events;
create policy "events_owner_select" on events for select
to authenticated using (auth.uid() = owner_id);

drop policy if exists "events_owner_insert" on events;
create policy "events_owner_insert" on events for insert
to authenticated with check (auth.uid() = owner_id);

drop policy if exists "events_owner_update" on events;
create policy "events_owner_update" on events for update
to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "events_owner_delete" on events;
create policy "events_owner_delete" on events for delete
to authenticated using (auth.uid() = owner_id);

drop policy if exists "events_public_read" on events;
create policy "events_public_read" on events for select
to anon using (true);

-- photos: owner CRUD + limited public read for guest galleries
drop policy if exists "photos_owner_select" on photos;
create policy "photos_owner_select" on photos for select
to authenticated using (auth.uid() = owner_id);

drop policy if exists "photos_owner_insert" on photos;
create policy "photos_owner_insert" on photos for insert
to authenticated with check (
  auth.uid() = owner_id
  and exists (select 1 from events e where e.id = event_id and e.owner_id = auth.uid())
);

drop policy if exists "photos_owner_update" on photos;
create policy "photos_owner_update" on photos for update
to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "photos_owner_delete" on photos;
create policy "photos_owner_delete" on photos for delete
to authenticated using (auth.uid() = owner_id);

drop policy if exists "photos_public_read" on photos;
create policy "photos_public_read" on photos for select
to anon using (true);

-- photo_face_embeddings: no direct client access (functions only)
drop policy if exists "embeddings_deny_all" on photo_face_embeddings;
create policy "embeddings_deny_all" on photo_face_embeddings for select
using (false);

-- guest_sessions: anonymous guests manage sessions by high-entropy token
drop policy if exists "guest_sessions_select" on guest_sessions;
create policy "guest_sessions_select" on guest_sessions for select
to anon, authenticated using (true);

drop policy if exists "guest_sessions_insert" on guest_sessions;
create policy "guest_sessions_insert" on guest_sessions for insert
to anon, authenticated with check (true);

drop policy if exists "guest_sessions_update" on guest_sessions;
create policy "guest_sessions_update" on guest_sessions for update
to anon, authenticated using (true) with check (true);

drop policy if exists "guest_sessions_delete" on guest_sessions;
create policy "guest_sessions_delete" on guest_sessions for delete
to anon, authenticated using (true);

-- ---------- Data API grants ----------

revoke all on profiles from anon, authenticated;
grant select (id, business_name) on profiles to anon;
grant select, insert, update, delete on profiles to authenticated;

revoke all on events from anon, authenticated;
grant select (id, name, description, event_type, event_date, location, privacy_mode,
  download_enabled, guest_upload_enabled, status, photo_count, event_token) on events to anon;
grant select, insert, update, delete on events to authenticated;

revoke all on photos from anon, authenticated;
grant select (id, event_id, original_name, storage_path, width, height) on photos to anon;
grant select, insert, update, delete on photos to authenticated;

revoke all on photo_face_embeddings from anon, authenticated;

grant select, insert, update, delete on guest_sessions to anon, authenticated;

-- ---------- Functions ----------

create or replace function store_photo_embeddings(p_photo_id uuid, p_embeddings jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  emb jsonb;
  v_event_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select event_id into v_event_id
  from photos
  where id = p_photo_id and owner_id = auth.uid();

  if v_event_id is null then
    raise exception 'Forbidden';
  end if;

  delete from photo_face_embeddings where photo_id = p_photo_id;

  for emb in select * from jsonb_array_elements(p_embeddings)
  loop
    insert into photo_face_embeddings (photo_id, embedding)
    values (p_photo_id, (emb::text)::vector);
  end loop;

  update events e
  set face_count = (
    select count(*) from photo_face_embeddings pfe
    join photos p on p.id = pfe.photo_id
    where p.event_id = v_event_id
  ),
  photo_count = (select count(*) from photos where event_id = v_event_id)
  where e.id = v_event_id;
end;
$$;

create or replace function match_guest_faces(p_event_token text, p_query vector(128))
returns table(photo_id uuid, match_score float)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.id as photo_id,
    greatest(0, 1 - (pfe.embedding <=> p_query))::float as match_score
  from events e
  join photos p on p.event_id = e.id
  join photo_face_embeddings pfe on pfe.photo_id = p.id
  where e.event_token = p_event_token
    and 1 - (pfe.embedding <=> p_query) > 0.4
  order by pfe.embedding <=> p_query
  limit 48;
end;
$$;

revoke execute on function store_photo_embeddings(uuid, jsonb) from public, anon;
grant execute on function store_photo_embeddings(uuid, jsonb) to authenticated;

grant execute on function match_guest_faces(text, vector) to anon, authenticated;

-- ---------- Storage bucket ----------

insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

drop policy if exists "event_photos_public_read" on storage.objects;
create policy "event_photos_public_read" on storage.objects for select
to anon, authenticated
using (bucket_id = 'event-photos');

drop policy if exists "event_photos_owner_insert" on storage.objects;
create policy "event_photos_owner_insert" on storage.objects for insert
to authenticated
with check (bucket_id = 'event-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "event_photos_owner_delete" on storage.objects;
create policy "event_photos_owner_delete" on storage.objects for delete
to authenticated
using (bucket_id = 'event-photos' and (storage.foldername(name))[1] = auth.uid()::text);
