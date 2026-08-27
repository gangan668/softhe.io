-- Reduce Data API roles to the exact table privileges used by the customer portal.
-- RLS remains the row-level authorization boundary; these grants are the outer
-- object-level boundary and intentionally exclude DELETE, TRUNCATE, REFERENCES,
-- and TRIGGER for browser roles.
revoke all privileges on table
  public.profiles,
  public.user_roles,
  public.orders,
  public.order_items,
  public.tickets,
  public.ticket_messages,
  public.activity_events,
  public.staff_audit_events,
  public.stripe_webhook_events
from anon, authenticated;

grant select on table
  public.profiles,
  public.user_roles,
  public.orders,
  public.order_items,
  public.tickets,
  public.ticket_messages,
  public.activity_events
to authenticated;

grant update (full_name, phone, billing_address, locale) on public.profiles to authenticated;
grant insert on table public.tickets, public.ticket_messages, public.activity_events to authenticated;

revoke all privileges on all sequences in schema public from anon, authenticated;
grant usage on sequence public.activity_events_id_seq to authenticated;

-- Service-only tables remain unavailable through customer JWTs even if a
-- future policy is accidentally added.
revoke all privileges on table public.staff_audit_events, public.stripe_webhook_events
from public, anon, authenticated;
grant select, insert on table public.staff_audit_events to service_role;

-- New public tables must be explicitly exposed instead of inheriting broad
-- Data API grants.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated;

-- Foreign-key maintenance and audit queries filter on actor_id.
create index if not exists staff_audit_events_actor_id_idx
  on public.staff_audit_events(actor_id);
