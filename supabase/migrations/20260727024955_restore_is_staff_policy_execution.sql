-- RLS policies invoke this helper while evaluating authenticated requests.
-- Keep it unavailable to anonymous/public callers, but allow the role used by
-- those policies to execute it.
revoke execute on function public.is_staff(uuid) from public, anon;
grant execute on function public.is_staff(uuid) to authenticated, service_role;
