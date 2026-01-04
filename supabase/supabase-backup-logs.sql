-- Create a table to log server-side backup operations
create table if not exists public.backups_logs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  status text not null check (status in ('processing', 'completed', 'failed')),
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  error_message text
);

-- Enable RLS (allow read access for admins/service role only if needed, or public for now given the context)
alter table public.backups_logs enable row level security;

-- Policy: Service Role has full access (implicit, but good to be explicit if using authenticated clients)
-- For this specific table, we rely on the Service Role Key bypassing RLS, so no specific public policies are needed 
-- unless we want to view logs from the dashboard.
create policy "Allow Service Role full access to backups_logs"
  on public.backups_logs
  for all
  to service_role
  using (true)
  with check (true);
