alter table public.shared_groups enable row level security;

revoke all on table public.shared_groups from anon, authenticated;
grant select, insert on table public.shared_groups to authenticated;

drop policy if exists "Users can create groups they own"
  on public.shared_groups;

create policy "Users can create groups they own"
  on public.shared_groups
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));
