-- Staff views and ticket notifications read profiles.email. Keep it equal to the
-- confirmed Auth address so replies never go to an address the customer replaced.
create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email), updated_at = now() where id = new.id;
  return new;
end;
$$;
revoke all on function public.sync_profile_email() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
for each row when (new.email is not null and new.email is distinct from old.email)
execute function public.sync_profile_email();

update public.profiles p
   set email = lower(u.email), updated_at = now()
  from auth.users u
 where u.id = p.id and u.email is not null and p.email is distinct from lower(u.email);
