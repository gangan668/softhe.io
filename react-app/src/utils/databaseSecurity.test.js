import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve(process.cwd(), '..', 'supabase', 'migrations', '20260827152811_least_privilege_portal_grants.sql'), 'utf8').toLowerCase();

describe('database least-privilege migration', () => {
	it('removes destructive and ownership-changing table privileges from browser roles', () => {
		expect(migration).toContain('revoke all privileges on table');
		expect(migration).toContain('from anon, authenticated');
		expect(migration).not.toMatch(/grant\s+(?:delete|truncate|references|trigger)/);
	});

	it('keeps service and audit relations out of customer JWT access', () => {
		expect(migration).toMatch(/revoke all privileges on table public\.staff_audit_events, public\.stripe_webhook_events\s+from public, anon, authenticated/);
	});

	it('removes unnecessary sequence access while preserving ticket activity inserts', () => {
		expect(migration).toContain('revoke all privileges on all sequences in schema public from anon, authenticated');
		expect(migration).toContain('grant usage on sequence public.activity_events_id_seq to authenticated');
	});

	it('indexes privileged audit actor lookups', () => {
		expect(migration).toContain('staff_audit_events_actor_id_idx');
	});
});
