-- Run this in Bolt Database if guest links work only on home page,
-- or guests cannot create sessions / see photos (hosted 404 is fixed in _redirects).

-- ---------- profiles: guests see studio name on event page ----------
drop policy if exists profiles_public_business on profiles;
create policy profiles_public_business on profiles for select
to anon, authenticated
using (true);

-- ---------- photos: guests read metadata for gallery URLs ----------
drop policy if exists photos_owner on photos;
drop policy if exists photos_public_read on photos;

create policy photos_owner on photos for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy photos_public_read on photos for select
to anon
using (
  exists (
    select 1 from events e
    where e.id = photos.event_id
      and e.status in ('ACTIVE', 'READY', 'PROCESSING')
  )
);

-- ---------- guest_sessions ----------
drop policy if exists guest_sessions_anon on guest_sessions;
create policy guest_sessions_anon on guest_sessions for all
to anon, authenticated
using (true)
with check (true);

-- ---------- Storage: public read for event-photos bucket ----------
-- Create bucket in UI as public, or:
-- insert into storage.buckets (id, name, public) values ('event-photos', 'event-photos', true) on conflict do nothing;

drop policy if exists event_photos_public_read on storage.objects;
create policy event_photos_public_read on storage.objects for select
to anon, authenticated
using (bucket_id = 'event-photos');

drop policy if exists event_photos_owner_write on storage.objects;
create policy event_photos_owner_write on storage.objects for insert
to authenticated
with check (
  bucket_id = 'event-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists event_photos_owner_update on storage.objects;
create policy event_photos_owner_update on storage.objects for update
to authenticated
using (
  bucket_id = 'event-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists event_photos_owner_delete on storage.objects;
create policy event_photos_owner_delete on storage.objects for delete
to authenticated
using (
  bucket_id = 'event-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

grant select on photos to anon;
grant insert, update, delete on guest_sessions to anon;

-- Guest event page (fixes "Event unavailable" on mobile when profiles join fails)
create or replace function get_guest_event(p_event_token text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'name', e.name,
    'description', e.description,
    'event_type', e.event_type,
    'event_date', e.event_date,
    'location', e.location,
    'privacy_mode', e.privacy_mode,
    'download_enabled', e.download_enabled,
    'guest_upload_enabled', e.guest_upload_enabled,
    'status', e.status,
    'photo_count', e.photo_count,
    'business_name', coalesce(p.business_name, 'Event Studio')
  )
  from events e
  left join profiles p on p.id = e.owner_id
  where lower(e.event_token) = lower(trim(p_event_token))
    and e.status in ('ACTIVE', 'READY', 'PROCESSING', 'DRAFT')
  limit 1;
$$;

grant execute on function get_guest_event(text) to anon, authenticated;