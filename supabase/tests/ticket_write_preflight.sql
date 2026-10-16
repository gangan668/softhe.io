-- Read-only preflight before installing the additive service RPC migration.
-- Inspect constraint definitions: the expected existing bounds are 3..120 and
-- 1..4000, while the additive migration broadens them to 3..160 and 1..5000.
-- No customer content, credentials, or user identifiers are returned.
select jsonb_build_object(
  'constraint_definitions', (select jsonb_agg(jsonb_build_object(
    'table', r.relname, 'name', c.conname, 'definition', pg_get_constraintdef(c.oid)))
    from pg_constraint c join pg_class r on r.oid=c.conrelid
    join pg_namespace n on n.oid=r.relnamespace
    where n.nspname='public' and r.relname in ('tickets','ticket_messages') and c.contype='c'),
  'rows_outside_new_subject_bounds', (select count(*) from public.tickets where char_length(subject) not between 3 and 160),
  'rows_outside_new_message_bounds', (select count(*) from public.ticket_messages where char_length(body) not between 1 and 5000),
  'service_role_bypasses_rls', (select rolbypassrls from pg_roles where rolname='service_role'),
  'service_schema_usage', has_schema_privilege('service_role','public','USAGE'),
  'service_table_rights', (select jsonb_object_agg(relation, jsonb_build_object(
    'select', has_table_privilege('service_role','public.'||relation,'SELECT'),
    'insert', has_table_privilege('service_role','public.'||relation,'INSERT'),
    'update', has_table_privilege('service_role','public.'||relation,'UPDATE')))
    from unnest(array['profiles','tickets','ticket_messages','activity_events']) relation),
  'service_activity_sequence_usage', has_sequence_privilege('service_role','public.activity_events_id_seq','USAGE'),
  'existing_service_functions', (select jsonb_agg(jsonb_build_object(
    'name', p.proname, 'arguments', pg_get_function_identity_arguments(p.oid),
    'result', pg_get_function_result(p.oid),
    'security_definer',p.prosecdef,
    'service_execute',has_function_privilege('service_role',p.oid,'EXECUTE')))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('create_ticket_for_user','add_ticket_message_for_user'))
) as ticket_write_preflight;
