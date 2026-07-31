create or replace function security.is_active_user()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and account_status = 'active') $$;
revoke all on function security.is_active_user() from public, anon;
grant execute on function security.is_active_user() to authenticated, service_role;

create or replace function security.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select security.is_active_user()) and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role in ('staff','admin')
      and revoked_at is null and expires_at > now()
  )
$$;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using ((select security.is_active_user()) and (id = (select auth.uid()) or (select security.is_staff())));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select security.is_active_user()) and id = (select auth.uid())) with check ((select security.is_active_user()) and id = (select auth.uid()));
drop policy if exists roles_read on public.user_roles;
create policy roles_read on public.user_roles for select to authenticated using ((select security.is_active_user()) and (user_id = (select auth.uid()) or (select security.is_staff())));
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated using ((select security.is_active_user()) and (user_id = (select auth.uid()) or (select security.is_staff())));
drop policy if exists items_read on public.order_items;
create policy items_read on public.order_items for select to authenticated using ((select security.is_active_user()) and exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select security.is_staff()))));
drop policy if exists tickets_read on public.tickets;
create policy tickets_read on public.tickets for select to authenticated using ((select security.is_active_user()) and (user_id = (select auth.uid()) or (select security.is_staff())));
drop policy if exists tickets_insert on public.tickets;
drop policy if exists messages_insert on public.ticket_messages;
drop policy if exists messages_read on public.ticket_messages;
create policy messages_read on public.ticket_messages for select to authenticated using ((select security.is_active_user()) and exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = (select auth.uid()) or (select security.is_staff()))));
drop policy if exists activity_read on public.activity_events;
create policy activity_read on public.activity_events for select to authenticated using ((select security.is_active_user()) and (user_id = (select auth.uid()) or (select security.is_staff())));

revoke insert on public.tickets, public.ticket_messages from authenticated;
drop function if exists public.create_ticket(text,text,text);
create or replace function public.create_ticket_for_user(ticket_user uuid, ticket_subject text, ticket_category text, first_message text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare ticket_id uuid;
begin
  if current_user not in ('postgres','service_role') then raise exception 'Forbidden'; end if;
  if not exists (select 1 from public.profiles where id = ticket_user and account_status = 'active') then raise exception 'Inactive account'; end if;
  insert into public.tickets(user_id,subject,category) values(ticket_user,trim(ticket_subject),lower(trim(ticket_category))) returning id into ticket_id;
  insert into public.ticket_messages(ticket_id,author_id,body) values(ticket_id,ticket_user,trim(first_message));
  insert into public.activity_events(user_id,actor_id,event_type,resource_type,resource_id) values(ticket_user,ticket_user,'ticket.created','ticket',ticket_id::text);
  return ticket_id;
end $$;
revoke all on function public.create_ticket_for_user(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.create_ticket_for_user(uuid,text,text,text) to service_role;

alter table public.profiles drop constraint if exists profiles_full_name_length;
alter table public.profiles add constraint profiles_full_name_length check (char_length(full_name) <= 100) not valid;
alter table public.profiles validate constraint profiles_full_name_length;
alter table public.profiles drop constraint if exists profiles_phone_length;
alter table public.profiles add constraint profiles_phone_length check (phone is null or char_length(phone) <= 40) not valid;
alter table public.profiles validate constraint profiles_phone_length;
alter table public.profiles drop constraint if exists profiles_billing_address_shape;
alter table public.profiles add constraint profiles_billing_address_shape check (jsonb_typeof(billing_address) = 'object' and pg_column_size(billing_address) <= 4096) not valid;
alter table public.profiles validate constraint profiles_billing_address_shape;
alter table public.profiles drop constraint if exists profiles_locale_allowed;
alter table public.profiles add constraint profiles_locale_allowed check (locale in ('en','sv')) not valid;
alter table public.profiles validate constraint profiles_locale_allowed;

create index if not exists activity_events_actor_id_idx on public.activity_events(actor_id);
create index if not exists ticket_messages_author_id_idx on public.ticket_messages(author_id);
revoke all on public.stripe_webhook_events from anon, authenticated;

create or replace function public.set_portal_account_status(target_user uuid, actor_user uuid, new_status text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if current_user not in ('postgres','service_role') or new_status not in ('active','suspended') then raise exception 'Forbidden'; end if;
  update public.profiles set account_status = new_status, updated_at = now() where id = target_user;
  if not found then raise exception 'Account not found'; end if;
  if new_status = 'suspended' then
    update public.user_roles set revoked_at = now(), revoked_by = actor_user, expires_at = now() where user_id = target_user and role in ('staff','admin');
    delete from auth.sessions where user_id = target_user;
  end if;
  insert into public.activity_events(user_id,actor_id,event_type,resource_type,resource_id,metadata)
    values(target_user,actor_user,'account.status_changed','profile',target_user,jsonb_build_object('status',new_status));
end $$;
revoke all on function public.set_portal_account_status(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.set_portal_account_status(uuid,uuid,text) to service_role;
