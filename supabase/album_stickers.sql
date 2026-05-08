create extension if not exists pgcrypto;

create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  share_code text not null unique,
  pin_code text,
  created_at timestamptz default now()
);

insert into albums (name, share_code)
values ('Album Juanjo', 'album-juanjo')
on conflict (share_code) do nothing;

create table if not exists stickers_catalog (
  sticker_code text primary key,
  sort_order integer not null,
  category text not null,
  section text not null,
  country text not null,
  selection text,
  group_code text,
  sticker_number integer not null,
  sticker_type text not null,
  name text not null,
  description text,
  flag text,
  flag_url text,
  updated_at timestamptz default now()
);

create table if not exists album_stickers (
  album_id uuid references albums(id) on delete cascade,
  sticker_code text,
  stuck boolean default false,
  repeats integer default 0,
  updated_by text,
  updated_at timestamptz default now()
);

alter table album_stickers add column if not exists album_id uuid references albums(id) on delete cascade;
alter table album_stickers add column if not exists sticker_code text;
alter table album_stickers add column if not exists stuck boolean default false;
alter table album_stickers add column if not exists repeats integer default 0;
alter table album_stickers add column if not exists updated_by text;
alter table album_stickers add column if not exists updated_at timestamptz default now();

update album_stickers
set album_id = (select id from albums where share_code = 'album-juanjo')
where album_id is null;

do $$
declare
  code_expr text := 'sticker_code';
  category_expr text := '''Equipo''';
  selection_expr text := 'null';
  type_expr text := '''Jugador''';
  name_expr text := 'sticker_code';
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'album_stickers'
      and column_name = 'code'
  ) then
    code_expr := 'coalesce(sticker_code, code)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'album_stickers'
      and column_name = 'id'
  ) then
    code_expr := 'coalesce(' || code_expr || ', id)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'album_stickers'
      and column_name = 'category'
  ) then
    category_expr := 'coalesce(category, ''Equipo'')';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'album_stickers'
      and column_name = 'selection'
  ) then
    selection_expr := 'selection';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'album_stickers'
      and column_name = 'type'
  ) then
    type_expr := 'coalesce(type, ''Jugador'')';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'album_stickers'
      and column_name = 'name'
  ) then
    name_expr := 'coalesce(name, ' || code_expr || ')';
  end if;

  execute 'update album_stickers set sticker_code = ' || code_expr || ' where sticker_code is null';

  execute '
    insert into stickers_catalog (
      sticker_code,
      sort_order,
      category,
      section,
      country,
      selection,
      group_code,
      sticker_number,
      sticker_type,
      name,
      description
    )
    select distinct on (' || code_expr || ')
      ' || code_expr || ' as sticker_code,
      row_number() over (order by ' || code_expr || ') as sort_order,
      ' || category_expr || ' as category,
      coalesce(' || selection_expr || ', split_part(' || code_expr || ', '' '', 1)) as section,
      split_part(' || code_expr || ', '' '', 1) as country,
      ' || selection_expr || ' as selection,
      null as group_code,
      coalesce(nullif(regexp_replace(' || code_expr || ', ''\D'', '''', ''g''), '''')::integer, 0) as sticker_number,
      ' || type_expr || ' as sticker_type,
      ' || name_expr || ' as name,
      null as description
    from album_stickers
    where ' || code_expr || ' is not null
    on conflict (sticker_code) do nothing';
end $$;

alter table album_stickers alter column album_id set not null;
alter table album_stickers alter column sticker_code set not null;

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
add constraint album_stickers_pkey primary key (album_id, sticker_code);

alter table album_stickers drop column if exists id;
alter table album_stickers drop column if exists code;
alter table album_stickers drop column if exists category;
alter table album_stickers drop column if exists selection;
alter table album_stickers drop column if exists type;
alter table album_stickers drop column if exists name;

alter table albums enable row level security;
alter table stickers_catalog enable row level security;
alter table album_stickers enable row level security;

drop policy if exists albums_select_anon on albums;
create policy albums_select_anon on albums for select to anon using (true);

drop policy if exists albums_insert_anon on albums;
create policy albums_insert_anon on albums for insert to anon with check (true);

drop policy if exists albums_update_anon on albums;
create policy albums_update_anon on albums for update to anon using (true) with check (true);

drop policy if exists stickers_catalog_select_anon on stickers_catalog;
create policy stickers_catalog_select_anon on stickers_catalog for select to anon using (true);

drop policy if exists stickers_catalog_insert_anon on stickers_catalog;
create policy stickers_catalog_insert_anon on stickers_catalog for insert to anon with check (true);

drop policy if exists stickers_catalog_update_anon on stickers_catalog;
create policy stickers_catalog_update_anon on stickers_catalog for update to anon using (true) with check (true);

drop policy if exists stickers_catalog_delete_anon on stickers_catalog;
create policy stickers_catalog_delete_anon on stickers_catalog for delete to anon using (true);

drop policy if exists album_stickers_select_anon on album_stickers;
create policy album_stickers_select_anon on album_stickers for select to anon using (true);

drop policy if exists album_stickers_insert_anon on album_stickers;
create policy album_stickers_insert_anon on album_stickers for insert to anon with check (true);

drop policy if exists album_stickers_update_anon on album_stickers;
create policy album_stickers_update_anon on album_stickers for update to anon using (true) with check (true);

drop policy if exists album_stickers_delete_anon on album_stickers;
create policy album_stickers_delete_anon on album_stickers for delete to anon using (true);

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
