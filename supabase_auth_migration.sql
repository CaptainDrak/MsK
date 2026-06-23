-- Run this in the Supabase SQL Editor to add user authentication to the books table

-- 1. Add user_id column
alter table books
  add column user_id uuid references auth.users(id) on delete cascade;

-- 2. Drop the old open-access policy
drop policy if exists "Allow all" on books;

-- 3. Add per-user policies
create policy "Users can view their own books"
  on books for select
  using (auth.uid() = user_id);

create policy "Users can insert their own books"
  on books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on books for update
  using (auth.uid() = user_id);

create policy "Users can delete their own books"
  on books for delete
  using (auth.uid() = user_id);
