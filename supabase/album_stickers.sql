create extension if not exists pgcrypto;

create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  share_code text not null unique,
  pin_code text,
  created_at timestamptz default now()
);

insert into albums (name, share_code)
values ('Álbum Juanjo', 'album-juanjo')
on conflict (share_code) do nothing;

create table if not exists album_stickers (
  album_id uuid references albums(id) on delete cascade,
  id text,
  code text,
  category text,
  selection text,
  type text,
  name text,
  stuck boolean default false,
  repeats integer default 0,
  updated_by text,
  updated_at timestamptz default now()
);

alter table album_stickers add column if not exists album_id uuid references albums(id) on delete cascade;

update album_stickers
set album_id = (select id from albums where share_code = 'album-juanjo')
where album_id is null;

alter table album_stickers alter column album_id set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'album_stickers_pkey'
      and conrelid = 'album_stickers'::regclass
  ) then
    alter table album_stickers drop constraint album_stickers_pkey;
  end if;
end $$;

alter table album_stickers
add constraint album_stickers_pkey primary key (album_id, id);

alter table albums enable row level security;
alter table album_stickers enable row level security;

drop policy if exists albums_select_anon on albums;
create policy albums_select_anon
on albums
for select
to anon
using (true);

drop policy if exists albums_insert_anon on albums;
create policy albums_insert_anon
on albums
for insert
to anon
with check (true);

drop policy if exists albums_update_anon on albums;
create policy albums_update_anon
on albums
for update
to anon
using (true)
with check (true);

drop policy if exists album_stickers_select_anon on album_stickers;
create policy album_stickers_select_anon
on album_stickers
for select
to anon
using (true);

drop policy if exists album_stickers_insert_anon on album_stickers;
create policy album_stickers_insert_anon
on album_stickers
for insert
to anon
with check (true);

drop policy if exists album_stickers_update_anon on album_stickers;
create policy album_stickers_update_anon
on album_stickers
for update
to anon
using (true)
with check (true);

drop policy if exists album_stickers_delete_anon on album_stickers;
create policy album_stickers_delete_anon
on album_stickers
for delete
to anon
using (true);

alter table album_stickers replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'album_stickers'
  ) then
    alter publication supabase_realtime add table album_stickers;
  end if;
end $$;
