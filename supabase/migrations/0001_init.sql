-- =====================================================================
-- Cancionero Scan — esquema inicial
-- Ejecutar en Supabase Dashboard > SQL Editor (o `supabase db push`).
-- =====================================================================

-- 1. Tabla de canciones ------------------------------------------------
create table if not exists public.songs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null default 'Sin título',
  lyrics        text not null default '',          -- letra sin acordes (lo que se muestra)
  original_text text,                              -- texto OCR completo, con acordes
  image_path    text,                              -- ruta en Storage: <user_id>/<song_id>.jpg
  version       integer not null default 1,        -- control de concurrencia optimista
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists songs_user_updated_idx on public.songs (user_id, updated_at desc);

-- 2. updated_at y version automáticos -----------------------------------
create or replace function public.songs_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.version    := old.version + 1;
  new.user_id    := old.user_id;   -- nadie puede "regalar" una canción a otro usuario
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists songs_before_update on public.songs;
create trigger songs_before_update
  before update on public.songs
  for each row execute function public.songs_before_update();

-- 3. Seguridad a nivel de fila: cada usuario solo ve y toca lo suyo -----
alter table public.songs enable row level security;

drop policy if exists "songs_select_own" on public.songs;
create policy "songs_select_own" on public.songs
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "songs_insert_own" on public.songs;
create policy "songs_insert_own" on public.songs
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "songs_update_own" on public.songs;
create policy "songs_update_own" on public.songs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "songs_delete_own" on public.songs;
create policy "songs_delete_own" on public.songs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 4. Sincronización en tiempo real ---------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'songs'
  ) then
    alter publication supabase_realtime add table public.songs;
  end if;
end $$;

-- 5. Storage: bucket privado para las fotos escaneadas -------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scans', 'scans', false, 10485760, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Cada usuario solo accede a la carpeta con su propio id: scans/<user_id>/...
drop policy if exists "scans_select_own" on storage.objects;
create policy "scans_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'scans' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "scans_insert_own" on storage.objects;
create policy "scans_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'scans' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "scans_update_own" on storage.objects;
create policy "scans_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'scans' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "scans_delete_own" on storage.objects;
create policy "scans_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'scans' and (storage.foldername(name))[1] = (select auth.uid())::text);
