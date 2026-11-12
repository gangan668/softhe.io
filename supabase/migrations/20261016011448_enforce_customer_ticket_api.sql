-- Apply only after the deployed API uses the service-only ticket RPCs.
-- Customer JWTs retain reads, but all customer ticket writes pass through the
-- authenticated API's rate limit, same-origin, and idempotency checks.
revoke insert on public.tickets, public.ticket_messages, public.activity_events
from public, anon, authenticated;
revoke insert (user_id, subject, category) on public.tickets from public, anon, authenticated;
revoke insert (ticket_id, author_id, body) on public.ticket_messages from public, anon, authenticated;
revoke insert (user_id, actor_id, event_type, resource_type, resource_id)
on public.activity_events from public, anon, authenticated;
revoke usage on sequence public.activity_events_id_seq from public, anon, authenticated;
revoke execute on function public.create_customer_ticket(text,text,text) from public, anon, authenticated;
revoke execute on function public.add_customer_ticket_message(uuid,text) from public, anon, authenticated;
drop policy if exists tickets_insert_own on public.tickets;
drop policy if exists messages_insert_authorized on public.ticket_messages;
drop policy if exists activity_insert_ticket_created on public.activity_events;
