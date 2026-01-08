-- FIX: Enable Realtime & Fix Permissions for History
-- Run this script in Supabase SQL Editor

-- 1. Enable Realtime on Questionnaires Table (for instant updates)
-- We use a safe block to avoid errors if it's already added
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'questionnaires'
  ) then
    alter publication supabase_realtime add table public.questionnaires;
  end if;
end $$;

-- 2. Reset and Re-Apply RLS (Robust Version)
alter table public.questionnaires enable row level security;

-- Drop old policies to clean up
drop policy if exists "Users can insert their own questionnaires" on public.questionnaires;
drop policy if exists "Users can view their own questionnaires" on public.questionnaires;
drop policy if exists "Users can update their own questionnaires" on public.questionnaires;
drop policy if exists "Users can delete their own questionnaires" on public.questionnaires;
-- Also drop the public ones if they still exist
drop policy if exists "Public read access by ID for questionnaires" on public.questionnaires;

-- 3. Create Permissive Policies for Authenticated Users (Practitioners)

-- INSERT: Standard check
create policy "Users can insert their own questionnaires"
  on public.questionnaires
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- SELECT: Allow if user_id matches
create policy "Users can view their own questionnaires"
  on public.questionnaires
  for select
  to authenticated
  using (
    -- Allow if the row belongs to the user
    (select auth.uid()) = user_id
  );

-- UPDATE/DELETE:
create policy "Users can update their own questionnaires"
  on public.questionnaires
  for update
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can delete their own questionnaires"
  on public.questionnaires
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Check Key Columns (Optional Diagnosis)
-- This query doesn't change anything but ensures user_id exists.
-- If you see an error "column user_id does not exist", please tell me.
select count(*) from public.questionnaires;
