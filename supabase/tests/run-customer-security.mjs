import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

// Install @electric-sql/pglite@0.3.14 in a temporary directory, then set
// PGLITE_MODULE to its absolute dist/index.js path. No service credentials are used.
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const require = createRequire(resolve(root, 'react-app/package.json'));
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE
  || require.resolve('@electric-sql/pglite')).href);
const db = new PGlite();
try {
  // This fixture models the Auth objects referenced by these migrations.
  // It does not verify the hosted Auth service or deployed database state.
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to service_role;
    alter default privileges in schema public grant all on sequences to service_role;
    create schema auth;
    grant usage on schema auth to authenticated, service_role;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create table auth.sessions(id uuid, user_id uuid, created_at timestamptz,
      updated_at timestamptz, aal text, user_agent text, not_after timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
    $$;
  `);
  for (const file of readdirSync(resolve(root, 'supabase/migrations')).sort()) {
    if (file.endsWith('_mediate_customer_ticket_writes.sql')) {
      await db.exec(readFileSync(resolve(root, 'supabase/tests/customer_insert_columns.sql'), 'utf8'));
    }
    // PostgreSQL supplies gen_random_uuid natively. PGlite has no pgcrypto module.
    const sql = readFileSync(resolve(root, 'supabase/migrations', file), 'utf8')
      .replace('create extension if not exists pgcrypto;', '');
    await db.exec(sql);
  }
  await db.exec(readFileSync(resolve(root, 'supabase/tests/customer_service_writes.sql'), 'utf8'));
  await db.exec(readFileSync(resolve(root, 'supabase/tests/ticket_write_preflight.sql'), 'utf8'));
  await db.exec(readFileSync(resolve(root, 'supabase/tests/ticket_write_catalog.sql'), 'utf8'));
  console.log('All migrations replayed. Column hardening passed. Service create/reply RPCs succeeded; browser bypasses, cross-customer replies, closed replies, suspended accounts, and invalid input were denied.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
