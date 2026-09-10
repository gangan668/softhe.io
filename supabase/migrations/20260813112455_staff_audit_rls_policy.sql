create policy staff_audit_service_only on public.staff_audit_events
for all to service_role using (true) with check (true);
