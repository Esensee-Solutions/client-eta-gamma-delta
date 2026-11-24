-- Profile photos. Each sister's photo is one file, `<her member id>.jpg`, in a private bucket:
-- only sisters can see photos (through short-lived signed links), and only she or her
-- chapter's or Zona's board (or the Directiva General) can add, change or remove hers.

alter table public.members add column photo_at timestamptz;  -- null: no photo; else when it last changed

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

-- Whose photo is this file? '<uuid>.jpg' → that sister's id, or null for anything else.
create function private.photo_owner(file text) returns uuid
language sql immutable set search_path = '' as $$
  select case when file ~ '^[0-9a-f-]{36}\.jpg$' then left(file, 36)::uuid end
$$;

-- May the caller change this sister's photo? Herself, or a board that runs her.
create function private.can_edit_photo(file text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.members m
    where m.id = private.photo_owner(file)
      and (m.user_id = (select auth.uid()) or private.admin_of(m.group_id)))
$$;
grant execute on function private.photo_owner(text), private.can_edit_photo(text) to authenticated;

create policy "sisters see photos" on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (select private.my_member_id()) is not null);
create policy "she or her board adds a photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and private.can_edit_photo(name));
create policy "she or her board changes a photo" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and private.can_edit_photo(name))
  with check (bucket_id = 'fotos' and private.can_edit_photo(name));
create policy "she or her board removes a photo" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and private.can_edit_photo(name));

-- The directory now says who has a photo (and since when, so a changed photo isn't cached).
drop function public.directory();
create function public.directory() returns table (
  id uuid, first_name text, last_name text, group_id text, status text,
  pledge_class text, "position" text, major text, grad_year int, bio text,
  phone text, email text, city text, birthday date, instagram text, employer text,
  is_me boolean, can_edit boolean, has_login boolean, photo_at timestamptz
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
         m.user_id is not null,
         m.photo_at
  from public.members m
  cross join lateral (select (m.user_id = (select auth.uid()) or private.admin_of(m.group_id)) as sees) v
  where (select private.my_member_id()) is not null
  order by m.last_name, m.first_name
$$;
revoke execute on function public.directory() from public, anon;
grant execute on function public.directory() to authenticated;
