-- Ownership RLS does not restrict which columns a customer can supply.
-- Preserve the SECURITY INVOKER ticket RPCs while keeping identifiers,
-- ticket status, timestamps, and audit metadata under database control.
revoke insert on public.tickets, public.ticket_messages, public.activity_events
from public, anon, authenticated;

grant insert (user_id, subject, category) on public.tickets to authenticated;
grant insert (ticket_id, author_id, body) on public.ticket_messages to authenticated;
grant insert (user_id, actor_id, event_type, resource_type, resource_id)
on public.activity_events to authenticated;

-- Earlier migrations granted column UPDATE rights. Revoking a table-level
-- privilege does not revoke those independent column grants.
revoke update (status, updated_at) on public.tickets from public, anon, authenticated;
