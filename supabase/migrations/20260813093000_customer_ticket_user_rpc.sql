create or replace function public.create_customer_ticket(ticket_subject text, ticket_category text, first_message text)
returns uuid
language plpgsql
security definer
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

create or replace function public.add_customer_ticket_message(target_ticket uuid, message_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  message_id uuid;
begin
  if actor is null or not (select security.is_active_user()) then raise exception 'Inactive account'; end if;
  if char_length(trim(message_body)) not between 1 and 5000 then raise exception 'Invalid message'; end if;
  if not exists (
    select 1 from public.tickets
    where id = target_ticket and status <> 'closed'
      and (user_id = actor or (select security.is_staff()))
  ) then raise exception 'Ticket reply is not permitted'; end if;

  insert into public.ticket_messages(ticket_id, author_id, body)
    values(target_ticket, actor, trim(message_body))
    returning id into message_id;
  return message_id;
end
$$;

revoke all on function public.add_customer_ticket_message(uuid,text) from public, anon;
grant execute on function public.add_customer_ticket_message(uuid,text) to authenticated;
