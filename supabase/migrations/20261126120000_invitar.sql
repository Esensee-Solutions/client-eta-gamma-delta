-- May the caller invite this sister? Her chapter's or Zona's board, or the Directiva General.
-- The `invitar` function asks this with the caller's own sign-in before it sends anything.
create function public.can_invite(p_member uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members m where m.id = p_member and private.admin_of(m.group_id))
$$;
revoke execute on function public.can_invite(uuid) from public, anon;
grant execute on function public.can_invite(uuid) to authenticated;
