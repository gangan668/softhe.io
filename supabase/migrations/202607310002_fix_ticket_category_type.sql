-- Keep ticket categories as checked text. The security hardening migration
-- accidentally referenced an enum that has never existed in this schema.
create or replace function public.create_ticket(ticket_subject text, ticket_category text, first_message text)
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare ticket_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.tickets (user_id, subject, category)
  values (auth.uid(), trim(ticket_subject), lower(trim(ticket_category)))
  returning id into ticket_id;
  insert into public.ticket_messages (ticket_id, author_id, body)
  values (ticket_id, auth.uid(), trim(first_message));
  insert into public.activity_events (user_id, actor_id, event_type, resource_type, resource_id)
  values (auth.uid(), auth.uid(), 'ticket.created', 'ticket', ticket_id::text);
  return ticket_id;
end;
$$;

revoke all on function public.create_ticket(text,text,text) from public, anon;
grant execute on function public.create_ticket(text,text,text) to authenticated;
