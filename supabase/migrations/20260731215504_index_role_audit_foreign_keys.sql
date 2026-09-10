create index if not exists user_roles_granted_by_idx on public.user_roles(granted_by) where granted_by is not null;
create index if not exists user_roles_revoked_by_idx on public.user_roles(revoked_by) where revoked_by is not null;
