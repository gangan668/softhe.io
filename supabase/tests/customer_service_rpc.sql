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
rollback;
