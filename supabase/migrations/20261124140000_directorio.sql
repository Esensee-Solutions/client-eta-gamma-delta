-- The members' directory: who is in it, who runs it, and who may see and change what.
--
-- Three levels of access, all enforced here in the database, never only in the pages:
--   a sister            sees the directory (minus what others hid) and edits her own profile;
--   a chapter/Zona board edits the sisters of its own chapter or Zona, invites and removes them;
--   the Directiva General edits everyone and names the boards.
-- Someone who signs in without a row in `members` sees nothing at all.

create schema if not exists private;

-- Chapters ("Activo") and alumnae chapters ("Zona").
create table public.groups (
  id    text primary key,                        -- 'alpha', 'zona-beta'
  name  text not null,                           -- 'Capítulo Alpha', 'Zona Beta'
  kind  text not null check (kind in ('activo', 'zona')),
  place text not null,                           -- 'UPR Río Piedras', 'Orlando, Florida'
  sort  int  not null default 0
);

create table public.members (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references auth.users (id) on delete set null,  -- set when she first signs in
  email        text unique,
  first_name   text not null,
  last_name    text not null,
  group_id     text not null references public.groups (id),
  status       text not null default 'activa' check (status in ('activa', 'alumna')),
  -- Only boards change these:
  pledge_class text,                             -- promoción: 'Primavera 2023'
  position     text,                             -- cargo: 'Presidenta'
  -- She changes these, and chooses which of the hideable ones others see:
  phone        text,
  city         text,
  major        text,
  grad_year    int check (grad_year between 1928 and 2100),
  birthday     date,
  instagram    text,
  employer     text,
  bio          text check (char_length(bio) <= 400),
  hidden       text[] not null default '{}'
               check (hidden <@ array['phone', 'email', 'city', 'birthday', 'instagram', 'employer']::text[]),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index members_group_idx on public.members (group_id);

-- Boards. group_id null = the Directiva General (everyone); otherwise that chapter or Zona only.
create table public.admins (
  id        uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  group_id  text references public.groups (id)
);
create unique index admins_one_per_scope on public.admins (member_id, coalesce(group_id, '*'));

-- Every move from a chapter to a Zona, or between Zonas.
create table public.moves (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.members (id) on delete cascade,
  from_group text not null references public.groups (id),
  to_group   text not null references public.groups (id),
  moved_by   uuid references public.members (id) on delete set null,
  moved_at   timestamptz not null default now()
);

-- Who is asking. Private schema: not reachable through the API.
create function private.my_member_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.members where user_id = (select auth.uid())
$$;

create function private.is_general() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a join public.members m on m.id = a.member_id
    where m.user_id = (select auth.uid()) and a.group_id is null)
$$;

-- Is the caller a board of this chapter or Zona (or the Directiva General)?
create function private.admin_of(g text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a join public.members m on m.id = a.member_id
    where m.user_id = (select auth.uid()) and (a.group_id is null or a.group_id = g))
$$;

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

alter table public.groups  enable row level security;
alter table public.members enable row level security;
alter table public.admins  enable row level security;
alter table public.moves   enable row level security;

-- Groups: any sister sees the list of chapters and Zonas.
create policy "sisters see groups" on public.groups for select to authenticated
  using ((select private.my_member_id()) is not null);

-- Members, read directly: only her own row, or the rows her board runs. Everyone else reads
-- through directory() below, which blanks what each sister hid.
create policy "own row or board" on public.members for select to authenticated
  using (user_id = (select auth.uid()) or private.admin_of(group_id));
create policy "edit own row or board" on public.members for update to authenticated
  using (user_id = (select auth.uid()) or private.admin_of(group_id))
  with check (user_id = (select auth.uid()) or private.admin_of(group_id));
create policy "boards add" on public.members for insert to authenticated
  with check (private.admin_of(group_id));
create policy "boards remove" on public.members for delete to authenticated
  using (private.admin_of(group_id));

-- Boards: every sister may see who the boards are; a board names its own successors,
-- and only the Directiva General names the Directiva General.
create policy "sisters see boards" on public.admins for select to authenticated
  using ((select private.my_member_id()) is not null);
create policy "boards name boards" on public.admins for insert to authenticated
  with check (
    private.is_general()
    or (group_id is not null and private.admin_of(group_id)
        and exists (select 1 from public.members m where m.id = member_id and m.group_id = admins.group_id)));
create policy "boards remove boards" on public.admins for delete to authenticated
  using (private.admin_of(group_id));

create policy "boards see moves" on public.moves for select to authenticated
  using (private.admin_of(from_group) or private.admin_of(to_group));

-- What a sister may not change about herself, and what nobody changes by a plain edit.
create function private.guard_member_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.user_id is distinct from old.user_id and current_user = 'authenticated' then
    raise exception 'El acceso de una hermana no se cambia a mano.';
  end if;
  if new.group_id is distinct from old.group_id
     and coalesce(current_setting('app.moving', true), '') <> 'on'
     and not private.is_general() then
    raise exception 'Para cambiar a una hermana de capítulo o Zona, usa "Mover".';
  end if;
  if not private.admin_of(old.group_id) and (
       new.email        is distinct from old.email or
       new.status       is distinct from old.status or
       new.pledge_class is distinct from old.pledge_class or
       new.position     is distinct from old.position or
       new.group_id     is distinct from old.group_id or
       new.first_name   is distinct from old.first_name or
       new.last_name    is distinct from old.last_name) then
    raise exception 'Ese dato solo lo cambia la directiva.';
  end if;
  return new;
end $$;
create trigger guard_member_update before update on public.members
  for each row execute function private.guard_member_update();

-- A board adds a sister by email; her sign-in is tied to the row later, never by hand.
create function private.guard_member_insert() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then new.user_id := null; end if;
  return new;
end $$;
create trigger guard_member_insert before insert on public.members
  for each row execute function private.guard_member_insert();

-- When she signs in for the first time, her account is tied to the row her board created.
create function private.link_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.members set user_id = new.id
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;
create trigger link_new_user after insert on auth.users
  for each row execute function private.link_new_user();

-- The directory as every sister sees it: what a sister hid comes back empty, except to
-- herself and to her boards. Returns nothing at all to someone who isn't a sister.
create function public.directory() returns table (
  id uuid, first_name text, last_name text, group_id text, status text,
  pledge_class text, "position" text, major text, grad_year int, bio text,
  phone text, email text, city text, birthday date, instagram text, employer text,
  is_me boolean, can_edit boolean, has_login boolean
)
language sql stable security definer set search_path = '' as $$
  select m.id, m.first_name, m.last_name, m.group_id, m.status,
         m.pledge_class, m.position, m.major, m.grad_year, m.bio,
         case when v.sees or not ('phone'     = any (m.hidden)) then m.phone     end,
         case when v.sees or not ('email'     = any (m.hidden)) then m.email     end,
         case when v.sees or not ('city'      = any (m.hidden)) then m.city      end,
         case when v.sees or not ('birthday'  = any (m.hidden)) then m.birthday  end,
         case when v.sees or not ('instagram' = any (m.hidden)) then m.instagram end,
         case when v.sees or not ('employer'  = any (m.hidden)) then m.employer  end,
         m.user_id = (select auth.uid()),
         v.sees,
         m.user_id is not null
  from public.members m
  cross join lateral (select (m.user_id = (select auth.uid()) or private.admin_of(m.group_id)) as sees) v
  where (select private.my_member_id()) is not null
  order by m.last_name, m.first_name
$$;

-- Graduating to a Zona, or moving between Zonas. Her board (or the Directiva General) does it;
-- every move is logged.
create function public.move_member(p_member uuid, p_to text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_from text;
  v_kind text;
begin
  select group_id into v_from from public.members where id = p_member;
  if v_from is null then raise exception 'No encontramos a esa hermana.'; end if;
  if not private.admin_of(v_from) then
    raise exception 'Solo la directiva de su capítulo o Zona, o la Directiva General, puede moverla.';
  end if;
  select kind into v_kind from public.groups where id = p_to;
  if v_kind is null then raise exception 'Ese capítulo o Zona no existe.'; end if;
  if v_from = p_to then return; end if;

  perform set_config('app.moving', 'on', true);
  update public.members
     set group_id = p_to,
         status = case when v_kind = 'zona' then 'alumna' else status end
   where id = p_member;
  perform set_config('app.moving', 'off', true);

  insert into public.moves (member_id, from_group, to_group, moved_by)
  values (p_member, v_from, p_to, private.my_member_id());
end $$;

revoke execute on function public.directory() from public, anon;
revoke execute on function public.move_member(uuid, text) from public, anon;
grant execute on function public.directory() to authenticated;
grant execute on function public.move_member(uuid, text) to authenticated;
