-- Additive phase: install before deploying the service-mediated ticket API.
-- Match the API's documented limits rather than failing accepted input later.
alter table public.tickets drop constraint if exists tickets_subject_check;
alter table public.tickets add constraint tickets_subject_check
check (char_length(subject) between 3 and 160);
alter table public.ticket_messages drop constraint if exists ticket_messages_body_check;
alter table public.ticket_messages add constraint ticket_messages_body_check
check (char_length(body) between 1 and 5000);

create or replace function public.create_ticket_for_user(ticket_user uuid, ticket_subject text, ticket_category text, first_message text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare ticket_id uuid;
begin
  if current_user not in ('postgres','service_role') then raise exception 'Forbidden' using errcode = '42501'; end if;
  perform 1 from public.profiles where id = ticket_user and account_status = 'active' for share;
  if not found then raise exception 'Inactive account' using errcode = '42501'; end if;
  if ticket_subject is null or ticket_category is null or first_message is null
     or char_length(trim(ticket_subject)) not between 3 and 160
     or lower(trim(ticket_category)) not in ('general','sales','technical','billing')
     or char_length(trim(first_message)) not between 3 and 5000 then
    raise exception 'Invalid ticket details' using errcode = '22023';
  end if;
  insert into public.tickets(user_id,subject,category)
    values(ticket_user,trim(ticket_subject),lower(trim(ticket_category))) returning id into ticket_id;
  insert into public.ticket_messages(ticket_id,author_id,body) values(ticket_id,ticket_user,trim(first_message));
  insert into public.activity_events(user_id,actor_id,event_type,resource_type,resource_id)
    values(ticket_user,ticket_user,'ticket.created','ticket',ticket_id::text);
  return ticket_id;
end; $$;
revoke all on function public.create_ticket_for_user(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.create_ticket_for_user(uuid,text,text,text) to service_role;

create function public.add_ticket_message_for_user(ticket_user uuid, target_ticket uuid, message_body text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare message_id uuid;
begin
  if current_user not in ('postgres','service_role') then raise exception 'Forbidden' using errcode = '42501'; end if;
  perform 1 from public.profiles where id = ticket_user and account_status = 'active' for share;
  if not found then raise exception 'Inactive account' using errcode = '42501'; end if;
  if message_body is null or char_length(trim(message_body)) not between 1 and 5000 then
    raise exception 'Invalid ticket reply' using errcode = '22023';
  end if;
  perform 1 from public.tickets where id = target_ticket and user_id = ticket_user and status <> 'closed' for update;
  if not found then raise exception 'Ticket reply is not permitted' using errcode = '42501'; end if;
  insert into public.ticket_messages(ticket_id,author_id,body)
    values(target_ticket,ticket_user,trim(message_body)) returning id into message_id;
  return message_id;
end; $$;
revoke all on function public.add_ticket_message_for_user(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.add_ticket_message_for_user(uuid,uuid,text) to service_role;
