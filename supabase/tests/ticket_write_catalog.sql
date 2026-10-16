-- Read-only rollout inspection. No user records, tokens, or secrets are selected.
select jsonb_build_object(
  'functions', (select jsonb_agg(jsonb_build_object(
    'name', p.proname, 'arguments', pg_get_function_identity_arguments(p.oid),
    'security_definer', p.prosecdef,
    'browser_execute', has_function_privilege('authenticated',p.oid,'EXECUTE'),
    'service_execute', has_function_privilege('service_role',p.oid,'EXECUTE')))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in
    ('create_ticket_for_user','add_ticket_message_for_user','create_customer_ticket','add_customer_ticket_message')),
  'browser_insert_columns', (select jsonb_agg(to_jsonb(c)) from (
    select table_name,column_name,privilege_type,grantee
    from information_schema.column_privileges
    where table_schema='public' and table_name in ('tickets','ticket_messages','activity_events')
    and privilege_type='INSERT' and grantee in ('PUBLIC','anon','authenticated')
  ) c),
  'policies', (select jsonb_agg(to_jsonb(p)) from (
    select tablename,policyname,cmd,roles from pg_policies
    where schemaname='public' and tablename in ('tickets','ticket_messages','activity_events')
  ) p)
) as ticket_write_catalog;
