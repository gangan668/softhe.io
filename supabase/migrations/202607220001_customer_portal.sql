create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'staff', 'admin');
create type public.ticket_status as enum ('open', 'in_progress', 'waiting_for_customer', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  billing_address jsonb not null default '{}'::jsonb,
  locale text not null default 'en',
  stripe_customer_id text unique,
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text not null unique,
  stripe_customer_id text,
  payment_intent_id text,
  customer_email text not null,
  status text not null check (status in ('processing', 'paid', 'expired', 'refunded')),
  amount_total integer not null check (amount_total >= 0),
  currency text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 10),
  unique (order_id, product_id)
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 120),
  category text not null default 'general' check (category in ('general', 'technical', 'sales', 'billing')),
  status public.ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_email_unclaimed_idx on public.orders(lower(customer_email)) where user_id is null;
create index tickets_user_updated_idx on public.tickets(user_id, updated_at desc);
create index ticket_messages_ticket_created_idx on public.ticket_messages(ticket_id, created_at);
create index activity_user_created_idx on public.activity_events(user_id, created_at desc);

create or replace function public.is_staff(check_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = check_user and role in ('staff', 'admin')); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  insert into public.activity_events (user_id, actor_id, event_type, resource_type, resource_id)
  values (new.id, new.id, 'account.created', 'profile', new.id::text);
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.create_ticket(ticket_subject text, ticket_category text, first_message text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare new_ticket_id uuid;
begin
	if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.tickets (user_id, subject, category)
  values (auth.uid(), trim(ticket_subject), ticket_category) returning id into new_ticket_id;
  insert into public.ticket_messages (ticket_id, author_id, body)
  values (new_ticket_id, auth.uid(), trim(first_message));
  insert into public.activity_events (user_id, actor_id, event_type, resource_type, resource_id)
  values (auth.uid(), auth.uid(), 'ticket.created', 'ticket', new_ticket_id::text);
  return new_ticket_id;
end; $$;

create or replace function public.record_profile_change()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  new.updated_at = now();
  insert into public.activity_events (user_id, actor_id, event_type, resource_type, resource_id)
  values (new.id, auth.uid(), 'profile.updated', 'profile', new.id::text);
  return new;
end; $$;
create trigger profile_change before update of full_name, phone, billing_address, locale on public.profiles
for each row execute procedure public.record_profile_change();

create or replace function public.record_ticket_message()
returns trigger language plpgsql security definer set search_path = public
as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.tickets where id = new.ticket_id;
  update public.tickets set updated_at = now(), status = case when public.is_staff(new.author_id) then 'waiting_for_customer' else 'open' end where id = new.ticket_id;
  insert into public.activity_events (user_id, actor_id, event_type, resource_type, resource_id)
  values (owner_id, new.author_id, 'ticket.replied', 'ticket', new.ticket_id::text);
  return new;
end; $$;
create trigger ticket_message_added after insert on public.ticket_messages
for each row execute procedure public.record_ticket_message();

create or replace function public.record_ticket_status_change()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if old.status is distinct from new.status then
    insert into public.activity_events (user_id, actor_id, event_type, resource_type, resource_id, metadata)
    values (new.user_id, auth.uid(), 'ticket.status_changed', 'ticket', new.id::text, jsonb_build_object('status', new.status));
  end if;
  return new;
end; $$;
create trigger ticket_status_changed after update of status on public.tickets
for each row execute procedure public.record_ticket_status_change();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.activity_events enable row level security;
alter table public.stripe_webhook_events enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_staff());
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy roles_read on public.user_roles for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());
create policy orders_read on public.orders for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());
create policy items_read on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_staff())));
create policy tickets_read on public.tickets for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());
create policy tickets_insert on public.tickets for insert to authenticated with check (user_id = (select auth.uid()));
create policy tickets_staff_update on public.tickets for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy messages_read on public.ticket_messages for select to authenticated using (exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = (select auth.uid()) or public.is_staff())));
create policy messages_insert on public.ticket_messages for insert to authenticated with check (author_id = (select auth.uid()) and exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = (select auth.uid()) or public.is_staff())));
create policy activity_read on public.activity_events for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());

revoke insert, update, delete on public.user_roles, public.orders, public.order_items, public.activity_events, public.stripe_webhook_events from anon, authenticated;
revoke delete on public.profiles, public.tickets, public.ticket_messages from anon, authenticated;
grant select on public.profiles, public.user_roles, public.orders, public.order_items, public.tickets, public.ticket_messages, public.activity_events to authenticated;
grant update (full_name, phone, billing_address, locale) on public.profiles to authenticated;
grant insert on public.tickets, public.ticket_messages to authenticated;
grant update (status, updated_at) on public.tickets to authenticated;
grant execute on function public.create_ticket(text, text, text) to authenticated;
revoke execute on function public.create_ticket(text, text, text) from public, anon;
revoke execute on function public.is_staff(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.record_profile_change() from public, anon, authenticated;
revoke execute on function public.record_ticket_message() from public, anon, authenticated;
revoke execute on function public.record_ticket_status_change() from public, anon, authenticated;
