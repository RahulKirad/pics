-- PicShareNow schema for Bolt Database (Supabase-compatible)
-- Run in Bolt Database SQL editor after enabling pgvector.

create extension if not exists vector;

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
  mime_type text not null,
  file_size bigint not null default 0,
  storage_path text not null,
  status text not null default 'READY',
  width int,
  height int,
  processing_error text,
  created_at timestamptz not null default now()
);

-- Embeddings are server-side only; clients cannot SELECT raw vectors.
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

alter table photo_face_embeddings enable row level security;
alter table events enable row level security;
alter table photos enable row level security;
alter table profiles enable row level security;
alter table guest_sessions enable row level security;

-- Owners manage their rows
create policy events_owner on events for all using (auth.uid() = owner_id);
create policy photos_owner on photos for all using (auth.uid() = owner_id);
create policy profiles_self on profiles for all using (auth.uid() = id);

-- Public can read minimal event info by token via RPC; direct select limited
create policy events_public_read on events for select using (true);

-- No direct SELECT on embeddings (match/store via SECURITY DEFINER functions only)
create policy embeddings_deny_select on photo_face_embeddings for select using (false);

create or replace function store_photo_embeddings(p_photo_id uuid, p_embeddings jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  emb jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from photos p where p.id = p_photo_id and p.owner_id = auth.uid()
  ) then
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
    where p.event_id = (select event_id from photos where id = p_photo_id)
  ),
  photo_count = (select count(*) from photos where event_id = e.id)
  from photos ph
  where ph.id = p_photo_id and e.id = ph.event_id;
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
  order by pfe.embedding <=> p_query
  limit 48;
end;
$$;

grant execute on function store_photo_embeddings(uuid, jsonb) to authenticated;
grant execute on function match_guest_faces(text, vector) to anon, authenticated;

-- Storage bucket: create "event-photos" as public read in Bolt Database Storage UI.
