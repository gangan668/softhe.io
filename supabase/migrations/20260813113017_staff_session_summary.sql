create or replace function public.staff_session_summary(target_user uuid)
returns table(id uuid, created_at timestamptz, updated_at timestamptz, aal text, user_agent text)
language plpgsql security definer set search_path = '' as $$
begin
  if current_user not in ('postgres','service_role') then raise exception 'Forbidden'; end if;
  return query select s.id, s.created_at, s.updated_at, s.aal::text, left(coalesce(s.user_agent,''),250)
    from auth.sessions s where s.user_id=target_user and (s.not_after is null or s.not_after > now())
    order by s.updated_at desc limit 10;
end; $$;
revoke all on function public.staff_session_summary(uuid) from public, anon, authenticated;
grant execute on function public.staff_session_summary(uuid) to service_role;
