-- Staff access is server mediated. Browser sessions retain ownership-only RLS.
alter table public.user_roles add column if not exists grant_reason text;

create table if not exists public.staff_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.staff_audit_events enable row level security;
revoke all on public.staff_audit_events from public, anon, authenticated;
grant select, insert on public.staff_audit_events to service_role;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using ((select security.is_active_user()) and id = (select auth.uid()));
drop policy if exists roles_read on public.user_roles;
create policy roles_read on public.user_roles for select to authenticated
  using ((select security.is_active_user()) and user_id = (select auth.uid()));
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated
  using ((select security.is_active_user()) and user_id = (select auth.uid()));
drop policy if exists items_read on public.order_items;
create policy items_read on public.order_items for select to authenticated using (
  (select security.is_active_user()) and exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
  )
);
drop policy if exists tickets_read on public.tickets;
create policy tickets_read on public.tickets for select to authenticated
  using ((select security.is_active_user()) and user_id = (select auth.uid()));
drop policy if exists tickets_staff_update on public.tickets;
revoke update on public.tickets from authenticated;
drop policy if exists messages_read on public.ticket_messages;
create policy messages_read on public.ticket_messages for select to authenticated using (
  (select security.is_active_user()) and exists (
    select 1 from public.tickets t where t.id = ticket_id and t.user_id = (select auth.uid())
  )
);
drop policy if exists messages_insert_authorized on public.ticket_messages;
drop policy if exists messages_insert on public.ticket_messages;
create policy messages_insert_authorized on public.ticket_messages for insert to authenticated with check (
  (select security.is_active_user()) and author_id = (select auth.uid()) and exists (
    select 1 from public.tickets t where t.id = ticket_id and t.user_id = (select auth.uid()) and t.status <> 'closed'
  )
);
drop policy if exists activity_read on public.activity_events;
create policy activity_read on public.activity_events for select to authenticated
  using ((select security.is_active_user()) and user_id = (select auth.uid()));

create or replace function public.verify_staff_access(target_user uuid, target_session uuid)
returns table(role public.app_role, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if current_user not in ('postgres','service_role') then raise exception 'Forbidden'; end if;
  return query
    select r.role, r.expires_at
      from public.user_roles r
      join public.profiles p on p.id = r.user_id and p.account_status = 'active'
      join auth.sessions s on s.id = target_session and s.user_id = r.user_id
     where r.user_id = target_user
       and r.role in ('staff','admin')
       and r.revoked_at is null
       and r.expires_at > now()
       and s.aal = 'aal2'
       and (s.not_after is null or s.not_after > now());
end; $$;
revoke all on function public.verify_staff_access(uuid,uuid) from public, anon, authenticated;
grant execute on function public.verify_staff_access(uuid,uuid) to service_role;

create or replace function public.grant_staff_access(target_user uuid, actor_user uuid, target_role public.app_role, valid_until timestamptz, reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if current_user not in ('postgres','service_role') then raise exception 'Forbidden'; end if;
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

-- Containment is idempotent: no privileged session survives this migration.
with targets as (
  update public.user_roles set revoked_at=now(), expires_at=now()
  where role in ('staff','admin') and revoked_at is null returning user_id
)
delete from auth.sessions where user_id in (select user_id from targets);

alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
