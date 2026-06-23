-- Run this in the Supabase SQL Editor to create the books table

create table books (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  author text,
  genre text,
  isbn text,
  cover_url text,
  read_status text default 'unread' check (read_status in ('unread', 'in_progress', 'read')),
  bookcase text,
  location text,
  notes text
);

-- Allow full public access (no login required for personal use)
alter table books enable row level security;

create policy "Allow all" on books
  for all using (true) with check (true);
