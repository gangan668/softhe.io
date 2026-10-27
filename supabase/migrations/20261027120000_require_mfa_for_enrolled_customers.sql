-- Customers who enroll a verified factor must use an AAL2 session for portal data.
-- Restrictive policies are ANDed with the existing ownership policies, so this
-- only narrows access. Accounts without a verified factor are unaffected.
create or replace function security.mfa_satisfied()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select auth.jwt()->>'aal'), '') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified'
    )
$$;
revoke all on function security.mfa_satisfied() from public, anon;
grant execute on function security.mfa_satisfied() to authenticated, service_role;

drop policy if exists profiles_mfa_required on public.profiles;
create policy profiles_mfa_required on public.profiles as restrictive for all to authenticated
  using ((select security.mfa_satisfied())) with check ((select security.mfa_satisfied()));
drop policy if exists user_roles_mfa_required on public.user_roles;
create policy user_roles_mfa_required on public.user_roles as restrictive for all to authenticated
  using ((select security.mfa_satisfied())) with check ((select security.mfa_satisfied()));
drop policy if exists orders_mfa_required on public.orders;
create policy orders_mfa_required on public.orders as restrictive for all to authenticated
  using ((select security.mfa_satisfied())) with check ((select security.mfa_satisfied()));
drop policy if exists order_items_mfa_required on public.order_items;
create policy order_items_mfa_required on public.order_items as restrictive for all to authenticated
  using ((select security.mfa_satisfied())) with check ((select security.mfa_satisfied()));
drop policy if exists tickets_mfa_required on public.tickets;
create policy tickets_mfa_required on public.tickets as restrictive for all to authenticated
  using ((select security.mfa_satisfied())) with check ((select security.mfa_satisfied()));
drop policy if exists ticket_messages_mfa_required on public.ticket_messages;
create policy ticket_messages_mfa_required on public.ticket_messages as restrictive for all to authenticated
  using ((select security.mfa_satisfied())) with check ((select security.mfa_satisfied()));
drop policy if exists activity_events_mfa_required on public.activity_events;
create policy activity_events_mfa_required on public.activity_events as restrictive for all to authenticated
  using ((select security.mfa_satisfied())) with check ((select security.mfa_satisfied()));
