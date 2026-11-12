-- Run only against isolated project zbchdxptibehtizomwiq.
-- Credential-free synthetic identities exist only inside this rolled-back transaction.
-- This exercises deployed PostgreSQL grants/RLS, not Auth API sign-in or email delivery.
begin;
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('adf00701-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'audit-20261007-a@example.invalid', '{}', '{}', now(), now()),
 ('adf00701-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'audit-20261007-b@example.invalid', '{}', '{}', now(), now());
insert into public.profiles(id,email) values
 ('adf00701-0000-4000-8000-000000000001','audit-20261007-a@example.invalid'),
 ('adf00701-0000-4000-8000-000000000002','audit-20261007-b@example.invalid') on conflict(id) do nothing;
insert into public.tickets(id,user_id,subject) values
 ('adf00702-0000-4000-8000-000000000001','adf00701-0000-4000-8000-000000000001','Synthetic audit A'),
 ('adf00702-0000-4000-8000-000000000002','adf00701-0000-4000-8000-000000000002','Synthetic audit B');
insert into public.ticket_messages(ticket_id,author_id,body) values
 ('adf00702-0000-4000-8000-000000000001','adf00701-0000-4000-8000-000000000001','Synthetic A'),
 ('adf00702-0000-4000-8000-000000000002','adf00701-0000-4000-8000-000000000002','Synthetic B');
select set_config('request.jwt.claims','{"sub":"adf00701-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.orders(id,user_id,stripe_session_id,customer_email,status,amount_total,currency) values
 ('adf00703-0000-4000-8000-000000000001','adf00701-0000-4000-8000-000000000001','cs_test_audit_20261007_a','audit-20261007-a@example.invalid','paid',7500,'eur'),
 ('adf00703-0000-4000-8000-000000000002','adf00701-0000-4000-8000-000000000002','cs_test_audit_20261007_b','audit-20261007-b@example.invalid','paid',6500,'eur');
insert into public.order_items(id,order_id,product_id,product_name,quantity) overriding system value values
 (9140007001,'adf00703-0000-4000-8000-000000000001','windows-11','Synthetic product A',1),
 (9140007002,'adf00703-0000-4000-8000-000000000002','windows-10','Synthetic product B',1);
set local role authenticated;
do $$
declare affected integer;
begin
 if (select count(*) from public.profiles where id='adf00701-0000-4000-8000-000000000001') <> 1 then raise exception 'Own profile failed'; end if;
 if (select count(*) from public.profiles where id='adf00701-0000-4000-8000-000000000002') <> 0 then raise exception 'Cross profile exposed'; end if;
 if (select count(*) from public.tickets where id='adf00702-0000-4000-8000-000000000001') <> 1 then raise exception 'Own ticket failed'; end if;
 if (select count(*) from public.tickets where id='adf00702-0000-4000-8000-000000000002') <> 0 then raise exception 'Cross ticket exposed'; end if;
 if (select count(*) from public.ticket_messages where ticket_id='adf00702-0000-4000-8000-000000000002') <> 0 then raise exception 'Cross messages exposed'; end if;
 if (select count(*) from public.orders where id='adf00703-0000-4000-8000-000000000001') <> 1 then raise exception 'Own order failed'; end if;
 if (select count(*) from public.orders where id='adf00703-0000-4000-8000-000000000002') <> 0 then raise exception 'Cross order exposed'; end if;
 if (select count(*) from public.order_items where order_id='adf00703-0000-4000-8000-000000000002') <> 0 then raise exception 'Cross order items exposed'; end if;
 update public.profiles set full_name='Synthetic updated' where id='adf00701-0000-4000-8000-000000000001';
 get diagnostics affected = row_count;
 if affected <> 1 then raise exception 'Own profile update failed'; end if;
 update public.profiles set full_name='Forbidden' where id='adf00701-0000-4000-8000-000000000002';
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'Cross profile updated'; end if;
 begin
  insert into public.tickets(user_id,subject) values('adf00701-0000-4000-8000-000000000002','Forged ownership');
  raise exception 'Forged ticket accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.ticket_messages(ticket_id,author_id,body) values('adf00702-0000-4000-8000-000000000002','adf00701-0000-4000-8000-000000000001','Forbidden reply');
  raise exception 'Cross reply accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.user_roles(user_id,role) values('adf00701-0000-4000-8000-000000000001','admin');
  raise exception 'Role escalation accepted';
 exception when insufficient_privilege then null; end;
 begin
  update public.profiles set account_status='suspended' where id='adf00701-0000-4000-8000-000000000001';
  raise exception 'Protected profile column writable';
 exception when insufficient_privilege then null; end;
 begin
  perform 1 from public.staff_audit_events limit 1;
  raise exception 'Staff audit readable';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"adf00701-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.profiles where id='adf00701-0000-4000-8000-000000000002') <> 1 then raise exception 'Customer B own profile failed'; end if;
 if (select count(*) from public.tickets where id='adf00702-0000-4000-8000-000000000002') <> 1 then raise exception 'Customer B own ticket failed'; end if;
 if (select count(*) from public.orders where id='adf00703-0000-4000-8000-000000000001') <> 0 then raise exception 'Customer B cross order exposed'; end if;
end $$;
reset role;
update public.profiles set account_status='suspended' where id='adf00701-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
 if (select count(*) from public.profiles where id='adf00701-0000-4000-8000-000000000002') <> 0 then raise exception 'Suspended profile exposed'; end if;
 if (select count(*) from public.tickets where id='adf00702-0000-4000-8000-000000000002') <> 0 then raise exception 'Suspended tickets exposed'; end if;
 if (select count(*) from public.orders where id='adf00703-0000-4000-8000-000000000002') <> 0 then raise exception 'Suspended orders exposed'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ begin
 begin
  perform 1 from public.profiles limit 1;
  raise exception 'Anonymous profile readable';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'passed' as assertions,
 (select count(*) from auth.users where id in ('adf00701-0000-4000-8000-000000000001','adf00701-0000-4000-8000-000000000002')) as remaining_synthetic_users,
 (select count(*) from public.tickets where id in ('adf00702-0000-4000-8000-000000000001','adf00702-0000-4000-8000-000000000002')) as remaining_synthetic_tickets,
 (select count(*) from public.orders where id in ('adf00703-0000-4000-8000-000000000001','adf00703-0000-4000-8000-000000000002')) as remaining_synthetic_orders;
