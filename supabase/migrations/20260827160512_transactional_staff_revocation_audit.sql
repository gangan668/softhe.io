create or replace function public.revoke_staff_access(target_user uuid, revoker uuid, revoke_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if current_user not in ('postgres','service_role') then raise exception 'Forbidden'; end if;
  if revoker is null or revoker = target_user or length(trim(revoke_reason)) < 3 then
    raise exception 'Invalid staff revocation';
  end if;

  update public.user_roles
     set revoked_at = now(), revoked_by = revoker, expires_at = now()
   where user_id = target_user and role in ('staff','admin') and revoked_at is null;
  if not found then raise exception 'Staff grant not found'; end if;

  insert into public.activity_events(user_id,actor_id,event_type,resource_type,resource_id,metadata)
  values(target_user,revoker,'staff.revoked','user_role',target_user::text,
    jsonb_build_object('reason',left(trim(revoke_reason),500)));
  insert into public.staff_audit_events(actor_id,event_type,resource_type,resource_id,metadata)
  values(revoker,'staff.revoked','user_role',target_user::text,
    jsonb_build_object('reason',left(trim(revoke_reason),500)));

  delete from auth.sessions where user_id = target_user;
end; $$;

revoke all on function public.revoke_staff_access(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.revoke_staff_access(uuid,uuid,text) to service_role;
