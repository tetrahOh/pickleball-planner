create extension if not exists pgcrypto;

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references family_members(id) on delete restrict,
  title text,
  session_date date not null,
  start_time time not null,
  duration_hours numeric not null check (duration_hours > 0),
  location text not null,
  session_address text,
  courts integer not null check (courts > 0),
  court_numbers text,
  max_players_per_court integer not null default 4 check (max_players_per_court > 0),
  cost_per_court_hour numeric not null default 0 check (cost_per_court_hour >= 0),
  is_booked boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

alter table sessions
  add column if not exists session_address text;

alter table sessions
  add column if not exists court_numbers text;

alter table sessions
  add column if not exists is_booked boolean not null default false;

alter table sessions
  add column if not exists max_players_per_court integer not null default 4 check (max_players_per_court > 0);

update sessions
set max_players_per_court = 4
where max_players_per_court is null;

create table if not exists session_attendees (
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references family_members(id) on delete cascade,
  added_by uuid references family_members(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table session_attendees
  add column if not exists added_by uuid references family_members(id) on delete set null;

create table if not exists session_interest (
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references family_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table family_members enable row level security;
alter table sessions enable row level security;
alter table session_attendees enable row level security;
alter table session_interest enable row level security;

drop policy if exists "Family link can read members" on family_members;
drop policy if exists "Family link can add members" on family_members;
drop policy if exists "Family link can read sessions" on sessions;
drop policy if exists "Family link can add sessions" on sessions;
drop policy if exists "Family link can update sessions" on sessions;
drop policy if exists "Family link can delete sessions" on sessions;
drop policy if exists "Family link can read attendees" on session_attendees;
drop policy if exists "Family link can add attendees" on session_attendees;
drop policy if exists "Family link can remove attendees" on session_attendees;
drop policy if exists "Family link can read interest" on session_interest;
drop policy if exists "Family link can add interest" on session_interest;
drop policy if exists "Family link can remove interest" on session_interest;

create policy "Family link can read members"
  on family_members for select
  to anon
  using (true);

create policy "Family link can add members"
  on family_members for insert
  to anon
  with check (true);

create policy "Family link can read sessions"
  on sessions for select
  to anon
  using (true);

create policy "Family link can add sessions"
  on sessions for insert
  to anon
  with check (true);

create policy "Family link can update sessions"
  on sessions for update
  to anon
  using (true)
  with check (true);

create policy "Family link can delete sessions"
  on sessions for delete
  to anon
  using (true);

create policy "Family link can read attendees"
  on session_attendees for select
  to anon
  using (true);

create policy "Family link can add attendees"
  on session_attendees for insert
  to anon
  with check (true);

create policy "Family link can remove attendees"
  on session_attendees for delete
  to anon
  using (true);

create policy "Family link can read interest"
  on session_interest for select
  to anon
  using (true);

create policy "Family link can add interest"
  on session_interest for insert
  to anon
  with check (true);

create policy "Family link can remove interest"
  on session_interest for delete
  to anon
  using (true);
