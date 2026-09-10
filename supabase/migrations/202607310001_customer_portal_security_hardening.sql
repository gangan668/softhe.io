-- Reconciles the live is_staff grant history and hardens the portal authorization boundary.
create schema if not exists security;
revoke all on schema security from public, anon;
grant usage on schema security to authenticated, service_role;

alter table public.user_roles add column if not exists expires_at timestamptz;
alter table public.user_roles add column if not exists granted_by uuid references auth.users(id) on delete set null;
alter table public.user_roles add column if not exists revoked_at timestamptz;
alter table public.user_roles add column if not exists revoked_by uuid references auth.users(id) on delete set null;

create or replace function security.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('staff', 'admin')
      and revoked_at is null
      and expires_at > now()
  );
$$;
revoke all on function security.is_staff() from public, anon;
grant execute on function security.is_staff() to authenticated, service_role;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or (select security.is_staff()));
drop policy if exists roles_read on public.user_roles;
create policy roles_read on public.user_roles for select to authenticated using (user_id = (select auth.uid()) or (select security.is_staff()));
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated using (user_id = (select auth.uid()) or (select security.is_staff()));
drop policy if exists items_read on public.order_items;
create policy items_read on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select security.is_staff()))));
drop policy if exists tickets_read on public.tickets;
create policy tickets_read on public.tickets for select to authenticated using (user_id = (select auth.uid()) or (select security.is_staff()));
drop policy if exists tickets_staff_update on public.tickets;
create policy tickets_staff_update on public.tickets for update to authenticated using ((select security.is_staff())) with check ((select security.is_staff()));
drop policy if exists messages_read on public.ticket_messages;
create policy messages_read on public.ticket_messages for select to authenticated using (exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = (select auth.uid()) or (select security.is_staff()))));
drop policy if exists messages_insert on public.ticket_messages;
create policy messages_insert on public.ticket_messages for insert to authenticated with check (author_id = (select auth.uid()) and exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = (select auth.uid()) or (select security.is_staff()))));
drop policy if exists activity_read on public.activity_events;
create policy activity_read on public.activity_events for select to authenticated using (user_id = (select auth.uid()) or (select security.is_staff()));

drop function if exists public.is_staff(uuid);

create or replace function public.record_ticket_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.tickets set updated_at = now(), status = case when (select security.is_staff()) then 'waiting_for_customer'::public.ticket_status else 'open'::public.ticket_status end where id = new.ticket_id;
  insert into public.activity_events (user_id, actor_id, event_type, resource_type, resource_id)
    select t.user_id, new.author_id, 'ticket.message_added', 'ticket', new.ticket_id from public.tickets t where t.id = new.ticket_id;
  return new;
end;
$$;
revoke all on function public.record_ticket_message() from public, anon, authenticated;

create or replace function public.create_ticket(ticket_subject text, ticket_category text, first_message text)
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare ticket_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.tickets (user_id, subject, category)
  values (auth.uid(), trim(ticket_subject), ticket_category::public.ticket_category)
  returning id into ticket_id;
  insert into public.ticket_messages (ticket_id, author_id, body)
  values (ticket_id, auth.uid(), trim(first_message));
  return ticket_id;
end;
$$;
revoke all on function public.create_ticket(text,text,text) from public, anon;
grant execute on function public.create_ticket(text,text,text) to authenticated;

create or replace function public.claim_verified_orders(claim_user uuid, claim_email text)
returns setof public.orders language plpgsql security definer set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role') then raise exception 'Forbidden'; end if;
  return query update public.orders
    set user_id = claim_user, updated_at = now()
    where user_id is null and lower(trim(customer_email)) = lower(trim(claim_email))
    returning *;
end;
$$;
revoke all on function public.claim_verified_orders(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_verified_orders(uuid,text) to service_role;

create or replace function public.revoke_staff_access(target_user uuid, revoker uuid, revoke_reason text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role') then raise exception 'Forbidden'; end if;
  update public.user_roles set revoked_at = now(), revoked_by = revoker, expires_at = now()
    where user_id = target_user and role in ('staff','admin');
  insert into public.activity_events (user_id, actor_id, event_type, resource_type, resource_id, metadata)
    values (target_user, revoker, 'staff.revoked', 'user_role', target_user, jsonb_build_object('reason', left(trim(revoke_reason), 500)));
  delete from auth.sessions where user_id = target_user;
end;
$$;
revoke all on function public.revoke_staff_access(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.revoke_staff_access(uuid,uuid,text) to service_role;

revoke all on public.profiles, public.user_roles, public.orders, public.order_items, public.tickets, public.ticket_messages, public.activity_events, public.stripe_webhook_events from anon;
revoke insert, update, delete on public.user_roles, public.orders, public.order_items, public.activity_events, public.stripe_webhook_events from authenticated;
revoke update, delete on public.ticket_messages from authenticated;
revoke delete on public.profiles, public.tickets from authenticated;

create index if not exists orders_unclaimed_email_idx on public.orders (lower(trim(customer_email))) where user_id is null;
