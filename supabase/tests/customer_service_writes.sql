-- Run only against a disposable migrated database. All writes are rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('adf01602-0000-4000-8000-000000000001','service-a@example.invalid','{}'),
('adf01602-0000-4000-8000-000000000002','service-b@example.invalid','{}');
set local role service_role;
do $$
declare ticket uuid; statement text;
begin
  ticket := public.create_ticket_for_user('adf01602-0000-4000-8000-000000000001',repeat('s',160),'general',repeat('m',5000));
  perform public.add_ticket_message_for_user('adf01602-0000-4000-8000-000000000001',ticket,'Allowed reply');
  if (select count(*) from public.ticket_messages where ticket_id = ticket) <> 2 then raise exception 'Service RPCs failed'; end if;
  begin
    perform public.add_ticket_message_for_user('adf01602-0000-4000-8000-000000000002',ticket,'Cross customer');
    raise exception 'Cross customer reply accepted';
  exception when insufficient_privilege then null; end;
  update public.tickets set status='closed' where id=ticket;
  begin
    perform public.add_ticket_message_for_user('adf01602-0000-4000-8000-000000000001',ticket,'Closed reply');
    raise exception 'Closed ticket reply accepted';
  exception when insufficient_privilege then null; end;
  update public.profiles set account_status='suspended' where id='adf01602-0000-4000-8000-000000000002';
  begin
    perform public.create_ticket_for_user('adf01602-0000-4000-8000-000000000002','Suspended ticket','general','Denied');
    raise exception 'Suspended customer accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.create_ticket_for_user('adf01602-0000-4000-8000-000000000001',null,'general','Denied');
    raise exception 'Null subject accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.create_ticket_for_user('adf01602-0000-4000-8000-000000000001',repeat('s',161),'general','Denied');
    raise exception 'Oversized subject accepted';
  exception when invalid_parameter_value then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"adf01602-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$
declare statement text;
begin
  if (select count(*) from public.tickets) <> 1 then raise exception 'Customer ticket read failed'; end if;
  foreach statement in array array[
    'insert into public.tickets(user_id,subject,category) values(auth.uid(),''Bypass'',''general'')',
    'insert into public.ticket_messages(ticket_id,author_id,body) select id,auth.uid(),''Bypass'' from public.tickets limit 1',
    'insert into public.activity_events(user_id,actor_id,event_type,resource_type,resource_id) select auth.uid(),auth.uid(),''ticket.created'',''ticket'',id::text from public.tickets limit 1',
    'select public.create_customer_ticket(''Bypass'',''general'',''Bypass message'')',
    'select public.add_customer_ticket_message(gen_random_uuid(),''Bypass'')',
    'select public.create_ticket_for_user(auth.uid(),''Bypass'',''general'',''Bypass message'')',
    'select public.add_ticket_message_for_user(auth.uid(),gen_random_uuid(),''Bypass'')'
  ] loop
    begin execute statement; raise exception 'Browser bypass accepted: %',statement;
    exception when insufficient_privilege then null; end;
  end loop;
end $$;
rollback;
