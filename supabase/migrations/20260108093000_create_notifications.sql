-- 1. Create Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  message text not null,
  is_read boolean default false,
  type text default 'info', -- 'signup', 'subscription', 'info'
  practitioner_id uuid references public.profiles(id),
  metadata jsonb default '{}'::jsonb
);

-- 2. Enable RLS
alter table public.notifications enable row level security;

-- 3. RLS Policies
-- Only admins can view notifications (simplified for now, ideally check is_admin)
create policy "Admins can view all notifications"
  on public.notifications for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Admins can update (mark as read)
create policy "Admins can update notifications"
  on public.notifications for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- 4. Function to handle new practitioner signup
create or replace function public.handle_new_practitioner_notification()
returns trigger as $$
declare
  practitioner_name text;
begin
  -- Get name safely
  practitioner_name := new.nom_complet;
  if practitioner_name is null then
    practitioner_name := 'Nouveau Praticien';
  end if;

  insert into public.notifications (message, type, practitioner_id, metadata)
  values (
    'Nouveau praticien inscrit : ' || practitioner_name,
    'signup',
    new.id,
    jsonb_build_object('email', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Trigger
drop trigger if exists on_new_practitioner_notification on public.profiles;
create trigger on_new_practitioner_notification
  after insert on public.profiles
  for each row execute procedure public.handle_new_practitioner_notification();

-- 6. Enable Realtime (Safe execution)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
