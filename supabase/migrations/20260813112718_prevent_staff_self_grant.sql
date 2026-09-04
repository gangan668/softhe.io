create or replace function public.grant_staff_access(target_user uuid, actor_user uuid, target_role public.app_role, valid_until timestamptz, reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if current_user not in ('postgres','service_role') then raise exception 'Forbidden'; end if;
  if actor_user = target_user then raise exception 'Self grant forbidden'; end if;
  if target_role not in ('staff','admin') or valid_until <= now() or valid_until > now() + interval '90 days'
     or length(trim(reason)) < 3 then raise exception 'Invalid staff grant'; end if;
  insert into public.user_roles(user_id,role,expires_at,granted_by,revoked_at,revoked_by,grant_reason)
  values(target_user,target_role,valid_until,actor_user,null,null,left(trim(reason),500))
  on conflict(user_id) do update set role=excluded.role, expires_at=excluded.expires_at,
    granted_by=excluded.granted_by, revoked_at=null, revoked_by=null, grant_reason=excluded.grant_reason;
  insert into public.staff_audit_events(actor_id,event_type,resource_type,resource_id,metadata)
  values(actor_user,'staff.granted','user_role',target_user::text,jsonb_build_object('role',target_role,'expires_at',valid_until,'reason',left(trim(reason),500)));
end; $$;
revoke all on function public.grant_staff_access(uuid,uuid,public.app_role,timestamptz,text) from public, anon, authenticated;
grant execute on function public.grant_staff_access(uuid,uuid,public.app_role,timestamptz,text) to service_role;
