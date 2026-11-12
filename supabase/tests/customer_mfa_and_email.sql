-- Run only against a disposable migrated database. All writes are rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('adf01603-0000-4000-8000-000000000001','mfa-user@example.invalid','{}'),
('adf01603-0000-4000-8000-000000000002','plain-user@example.invalid','{}');
insert into auth.mfa_factors(user_id,status) values ('adf01603-0000-4000-8000-000000000001','verified');

-- An enrolled customer with an AAL1 session sees nothing and cannot edit their profile.
select set_config('request.jwt.claims','{"sub":"adf01603-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}',true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.profiles) <> 0 then raise exception 'AAL1 session read an MFA-protected profile'; end if;
  update public.profiles set full_name = 'Changed' where id = auth.uid();
  if found then raise exception 'AAL1 session updated an MFA-protected profile'; end if;
end $$;
reset role;

-- The same customer at AAL2 has normal ownership access.
select set_config('request.jwt.claims','{"sub":"adf01603-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}',true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'AAL2 session could not read its profile'; end if;
end $$;
reset role;

-- A customer without a verified factor is unaffected at AAL1.
select set_config('request.jwt.claims','{"sub":"adf01603-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}',true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'Customer without MFA lost profile access'; end if;
end $$;
reset role;

-- A confirmed Auth email change is reflected in the profile.
update auth.users set email = 'New-Address@example.invalid' where id = 'adf01603-0000-4000-8000-000000000002';
do $$
begin
  if (select email from public.profiles where id = 'adf01603-0000-4000-8000-000000000002') <> 'new-address@example.invalid' then
    raise exception 'Profile email was not synchronized';
  end if;
end $$;
rollback;
