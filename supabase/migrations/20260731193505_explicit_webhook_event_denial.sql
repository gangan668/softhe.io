-- Keep webhook idempotency records server-only while making the client denial
-- explicit to database advisors and future maintainers.
alter table public.stripe_webhook_events enable row level security;

drop policy if exists stripe_webhook_events_deny_clients on public.stripe_webhook_events;
create policy stripe_webhook_events_deny_clients
on public.stripe_webhook_events
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

revoke all on public.stripe_webhook_events from anon, authenticated;
