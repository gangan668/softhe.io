drop function if exists public.create_customer_ticket(text,text,text);
drop function if exists public.add_customer_ticket_message(uuid,text);

drop policy if exists tickets_insert_own on public.tickets;
create policy tickets_insert_own on public.tickets
for insert to authenticated
with check ((select security.is_active_user()) and user_id = (select auth.uid()));

drop policy if exists messages_insert_authorized on public.ticket_messages;
create policy messages_insert_authorized on public.ticket_messages
for insert to authenticated
with check (
  (select security.is_active_user())
  and author_id = (select auth.uid())
  and exists (
    select 1 from public.tickets t
    where t.id = ticket_id
      and t.status <> 'closed'
      and (t.user_id = (select auth.uid()) or (select security.is_staff()))
  )
);

drop policy if exists activity_insert_ticket_created on public.activity_events;
create policy activity_insert_ticket_created on public.activity_events
for insert to authenticated
with check (
  (select security.is_active_user())
  and user_id = (select auth.uid())
  and actor_id = (select auth.uid())
  and event_type = 'ticket.created'
  and resource_type = 'ticket'
  and exists (
    select 1 from public.tickets t
    where t.id::text = resource_id and t.user_id = (select auth.uid())
  )
);

grant insert on public.tickets, public.ticket_messages, public.activity_events to authenticated;

create function public.create_customer_ticket(ticket_subject text, ticket_category text, first_message text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  ticket_id uuid;
begin
  if actor is null or not (select security.is_active_user()) then raise exception 'Inactive account'; end if;
  if char_length(trim(ticket_subject)) not between 3 and 160
    or lower(trim(ticket_category)) not in ('general','sales','technical','billing')
    or char_length(trim(first_message)) not between 3 and 5000 then
    raise exception 'Invalid ticket details';
  end if;

  insert into public.tickets(user_id, subject, category)
    values(actor, trim(ticket_subject), lower(trim(ticket_category)))
    returning id into ticket_id;
  insert into public.ticket_messages(ticket_id, author_id, body)
    values(ticket_id, actor, trim(first_message));
  insert into public.activity_events(user_id, actor_id, event_type, resource_type, resource_id)
    values(actor, actor, 'ticket.created', 'ticket', ticket_id::text);
  return ticket_id;
end
$$;

revoke all on function public.create_customer_ticket(text,text,text) from public, anon;
grant execute on function public.create_customer_ticket(text,text,text) to authenticated;

create function public.add_customer_ticket_message(target_ticket uuid, message_body text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  message_id uuid;
begin
  if actor is null or not (select security.is_active_user()) then raise exception 'Inactive account'; end if;
  if char_length(trim(message_body)) not between 1 and 5000 then raise exception 'Invalid message'; end if;

  insert into public.ticket_messages(ticket_id, author_id, body)
    values(target_ticket, actor, trim(message_body))
    returning id into message_id;
  return message_id;
end
$$;

revoke all on function public.add_customer_ticket_message(uuid,text) from public, anon;
grant execute on function public.add_customer_ticket_message(uuid,text) to authenticated;
