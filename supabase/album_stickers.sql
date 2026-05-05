create table if not exists album_stickers (
  id text primary key,
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

alter table album_stickers enable row level security;

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
