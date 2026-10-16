-- Run with psql -v ON_ERROR_STOP=1 against a disposable migrated database.
-- Synthetic records and all writes are rolled back.
begin;
insert into auth.users (id, email, raw_user_meta_data)
values ('adf01601-0000-4000-8000-000000000001', 'column-audit@example.invalid', '{}');
select set_config('request.jwt.claims', '{"sub":"adf01601-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  ticket uuid;
  statement text;
begin
  ticket := public.create_customer_ticket('Column audit ticket', 'general', 'First message');
  perform public.add_customer_ticket_message(ticket, 'Allowed reply');
  if (select count(*) from public.ticket_messages where ticket_id = ticket) <> 2 then
    raise exception 'Customer invoker RPCs failed';
  end if;
  foreach statement in array array[
    format('insert into public.tickets(user_id,subject,status) values (auth.uid(), %L, %L)', 'Forged status', 'closed'),
    format('insert into public.tickets(user_id,subject,created_at) values (auth.uid(), %L, now())', 'Forged timestamp'),
    format('insert into public.tickets(id,user_id,subject) values (gen_random_uuid(),auth.uid(),%L)', 'Forged id'),
    format('insert into public.ticket_messages(ticket_id,author_id,body,created_at) values (%L,auth.uid(),%L,now())', ticket, 'Forged time'),
    format('insert into public.activity_events(user_id,actor_id,event_type,resource_type,resource_id,metadata) values (auth.uid(),auth.uid(),%L,%L,%L,%L)', 'ticket.created', 'ticket', ticket, '{"forged":true}'),
    format('insert into public.activity_events(user_id,actor_id,event_type,resource_type,resource_id,created_at) values (auth.uid(),auth.uid(),%L,%L,%L,now())', 'ticket.created', 'ticket', ticket)
  ] loop
    begin
      execute statement;
      raise exception 'Protected column accepted: %', statement;
    exception when insufficient_privilege then null;
    end;
  end loop;
  if has_column_privilege(current_user, 'public.tickets', 'status', 'UPDATE')
     or has_column_privilege(current_user, 'public.tickets', 'updated_at', 'UPDATE') then
    raise exception 'Legacy ticket update privileges survived';
  end if;
end $$;
rollback;
