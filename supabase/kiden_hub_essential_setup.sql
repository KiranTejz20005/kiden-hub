-- Kiden Hub Essential Setup
-- Simplified schema for the live app surface.

create extension if not exists pgcrypto;

-- =====================================================
-- FUNCTIONS
-- =====================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_workspace_id uuid;
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        updated_at = now();

  insert into public.workspaces (user_id, name, icon)
  values (new.id, 'My Workspace', '🏠')
  returning id into default_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, email, role, invited_by, accepted_at)
  values (
    default_workspace_id,
    new.id,
    coalesce(new.email, new.id::text),
    'owner',
    new.id,
    now()
  )
  on conflict (workspace_id, email) do nothing;

  return new;
end;
$$;

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      message_count = coalesce(message_count, 0) + 1,
      updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

-- =====================================================
-- TABLES
-- =====================================================
create table public.profiles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text,
  avatar_url text,
  bio text,
  status text,
  focus_settings jsonb default '{"workDuration":25,"shortBreakDuration":5,"longBreakDuration":15,"sessionsBeforeLongBreak":4}'::jsonb,
  onboarding_completed boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text default '🏠',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid not null default gen_random_uuid() primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create table public.collections (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  icon text default '📂',
  color text default '#10B981',
  item_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  title text not null default 'Untitled',
  content jsonb not null default '[]'::jsonb,
  icon text default '📝',
  cover_image text,
  is_template boolean default false,
  template_category text,
  is_archived boolean default false,
  is_favorite boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.focus_sessions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  note_id uuid references public.notes(id) on delete set null,
  task_id uuid,
  project_id uuid,
  duration_minutes integer not null,
  session_type text not null default 'work' check (session_type in ('work', 'short_break', 'long_break', 'flow')),
  completed boolean default false,
  interruptions_count integer default 0,
  notes text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.habits (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  icon text,
  color text,
  goal integer default 1,
  unit text,
  target_time text,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid not null default gen_random_uuid() primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  value integer default 1,
  completed_at timestamptz not null default now(),
  date date not null default current_date,
  notes text,
  unique (habit_id, date)
);

create table public.files (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  size bigint not null,
  type text not null,
  mime_type text not null,
  storage_path text not null,
  public_url text,
  ai_indexed boolean default false,
  ai_summary text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  title text,
  summary text,
  message_count integer default 0,
  last_message_at timestamptz,
  is_archived boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid not null default gen_random_uuid() primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  file_refs uuid[],
  created_at timestamptz not null default now()
);

create table public.research_boards (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  title text not null,
  description text,
  emoji text default '🔬',
  is_shared boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
create or replace function public.user_owns_workspace(workspace_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.workspaces
      where id = workspace_uuid
        and user_id = auth.uid()
    )
  end;
$$;

create or replace function public.user_has_workspace_access(workspace_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.workspaces
      where id = workspace_uuid
        and user_id = auth.uid()
    ) or exists (
      select 1
      from public.workspace_members
      where workspace_id = workspace_uuid
        and user_id = auth.uid()
        and accepted_at is not null
    )
  end;
$$;

create or replace function public.user_has_conversation_access(conversation_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1
      from public.conversations
      where id = conversation_uuid
        and (
          user_id = auth.uid()
          or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
        )
    )
  end;
$$;

-- =====================================================
-- INDEXES
-- =====================================================
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists workspaces_user_id_idx on public.workspaces(user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists workspace_members_email_idx on public.workspace_members(email);
create index if not exists collections_workspace_id_idx on public.collections(workspace_id);
create index if not exists collections_user_id_idx on public.collections(user_id);
create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_workspace_id_idx on public.notes(workspace_id);
create index if not exists notes_collection_id_idx on public.notes(collection_id);
create index if not exists notes_fts_idx on public.notes using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content::text, '')));
create index if not exists focus_sessions_user_id_idx on public.focus_sessions(user_id);
create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habit_logs_user_id_idx on public.habit_logs(user_id);
create index if not exists habit_logs_habit_id_idx on public.habit_logs(habit_id);
create index if not exists files_user_id_idx on public.files(user_id);
create index if not exists files_workspace_id_idx on public.files(workspace_id);
create index if not exists files_name_fts_idx on public.files using gin(to_tsvector('english', name));
create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists conversations_workspace_id_idx on public.conversations(workspace_id);
create index if not exists conversations_last_message_at_idx on public.conversations(last_message_at desc);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists research_boards_user_id_idx on public.research_boards(user_id);
create index if not exists research_boards_workspace_id_idx on public.research_boards(workspace_id);

-- =====================================================
-- RLS
-- =====================================================
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.collections enable row level security;
alter table public.notes enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.files enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.research_boards enable row level security;

-- Profiles
  drop policy if exists "Users can view own profile" on public.profiles;
  drop policy if exists "Users can insert own profile" on public.profiles;
  drop policy if exists "Users can update own profile" on public.profiles;
  drop policy if exists "Users can delete own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own profile" on public.profiles
  for delete using (auth.uid() = user_id);

-- Workspaces
  drop policy if exists "Users can view own workspaces" on public.workspaces;
  drop policy if exists "Users can create own workspaces" on public.workspaces;
  drop policy if exists "Users can update own workspaces" on public.workspaces;
  drop policy if exists "Users can delete own workspaces" on public.workspaces;
  drop policy if exists "Members see their workspaces" on public.workspaces;
  drop policy if exists "Authenticated users can view their workspaces" on public.workspaces;

create policy "Users can view accessible workspaces" on public.workspaces
  for select using (
    auth.uid() is not null and public.user_has_workspace_access(id)
  );

create policy "Users can create own workspaces" on public.workspaces
  for insert with check (
    auth.uid() is not null and auth.uid() = user_id
  );

create policy "Users can update own workspaces" on public.workspaces
  for update using (
    auth.uid() = user_id
  ) with check (
    auth.uid() = user_id
  );

create policy "Users can delete own workspaces" on public.workspaces
  for delete using (
    auth.uid() = user_id
  );

-- Workspace members
  drop policy if exists "Users can view workspace members" on public.workspace_members;
  drop policy if exists "Users can create workspace members" on public.workspace_members;
  drop policy if exists "Users can update workspace members" on public.workspace_members;
  drop policy if exists "Users can delete workspace members" on public.workspace_members;
  drop policy if exists "Users can view workspaces they are members of" on public.workspace_members;
  drop policy if exists "Members see member list" on public.workspace_members;
  drop policy if exists "Workspace owners can add members" on public.workspace_members;
  drop policy if exists "Workspace owners can remove members" on public.workspace_members;
  drop policy if exists "Users can accept their own invites" on public.workspace_members;
  drop policy if exists "Workspace members can update themselves" on public.workspace_members;

create policy "Users can view workspace members" on public.workspace_members
  for select using (
    auth.uid() is not null and (
      user_id = auth.uid()
      or email = auth.email()
      or public.user_owns_workspace(workspace_id)
      or public.user_has_workspace_access(workspace_id)
    )
  );

create policy "Users can create workspace members" on public.workspace_members
  for insert with check (
    auth.uid() is not null and (
      auth.uid() = user_id
      or public.user_has_workspace_access(workspace_id)
      or public.user_owns_workspace(workspace_id)
    )
  );

create policy "Users can update workspace members" on public.workspace_members
  for update using (
    auth.uid() is not null and (
      auth.uid() = user_id
      or email = auth.email()
      or public.user_has_workspace_access(workspace_id)
      or public.user_owns_workspace(workspace_id)
    )
  ) with check (
    auth.uid() is not null and (
      auth.uid() = user_id
      or email = auth.email()
      or public.user_has_workspace_access(workspace_id)
      or public.user_owns_workspace(workspace_id)
    )
  );

create policy "Users can delete workspace members" on public.workspace_members
  for delete using (
    auth.uid() is not null and (
      auth.uid() = user_id
      or email = auth.email()
      or public.user_has_workspace_access(workspace_id)
      or public.user_owns_workspace(workspace_id)
    )
  );

-- Collections
  drop policy if exists "Users can view own collections" on public.collections;
  drop policy if exists "Users can create own collections" on public.collections;
  drop policy if exists "Users can update own collections" on public.collections;
  drop policy if exists "Users can delete own collections" on public.collections;

create policy "Users can manage collections" on public.collections
  for all using (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  ) with check (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  );

-- Notes
  drop policy if exists "Users can view own notes" on public.notes;
  drop policy if exists "Users can create own notes" on public.notes;
  drop policy if exists "Users can update own notes" on public.notes;
  drop policy if exists "Users can delete own notes" on public.notes;

create policy "Users can manage notes" on public.notes
  for all using (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  ) with check (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  );

-- Focus sessions
  drop policy if exists "Users can view own focus sessions" on public.focus_sessions;
  drop policy if exists "Users can create own focus sessions" on public.focus_sessions;
  drop policy if exists "Users can update own focus sessions" on public.focus_sessions;
  drop policy if exists "Users can delete own focus sessions" on public.focus_sessions;

create policy "Users can manage own focus sessions" on public.focus_sessions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Habits
  drop policy if exists "Users can view own habits" on public.habits;
  drop policy if exists "Users can create own habits" on public.habits;
  drop policy if exists "Users can update own habits" on public.habits;
  drop policy if exists "Users can delete own habits" on public.habits;

create policy "Users can manage own habits" on public.habits
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Habit logs
  drop policy if exists "Users can view own habit logs" on public.habit_logs;
  drop policy if exists "Users can create own habit logs" on public.habit_logs;
  drop policy if exists "Users can update own habit logs" on public.habit_logs;
  drop policy if exists "Users can delete own habit logs" on public.habit_logs;

create policy "Users can manage own habit logs" on public.habit_logs
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Files
  drop policy if exists "Users can view own files" on public.files;
  drop policy if exists "Users can insert own files" on public.files;
  drop policy if exists "Users can update own files" on public.files;
  drop policy if exists "Users can delete own files" on public.files;
  drop policy if exists "Users see own files" on public.files;

create policy "Users can manage own files" on public.files
  for all using (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  ) with check (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  );

-- Conversations
  drop policy if exists "Users can manage own conversations" on public.conversations;
  drop policy if exists "Users own conversations" on public.conversations;

create policy "Users can manage conversations" on public.conversations
  for all using (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  ) with check (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  );

-- Messages
  drop policy if exists "Users can manage own messages" on public.messages;
  drop policy if exists "Users own messages" on public.messages;

create policy "Users can manage messages" on public.messages
  for all using (auth.uid() is not null and public.user_has_conversation_access(conversation_id))
  with check (auth.uid() is not null and public.user_has_conversation_access(conversation_id));

-- Research boards
  drop policy if exists "Users can view own research boards" on public.research_boards;
  drop policy if exists "Users can create own research boards" on public.research_boards;
  drop policy if exists "Users can update own research boards" on public.research_boards;
  drop policy if exists "Users can delete own research boards" on public.research_boards;
  drop policy if exists "Users can manage own research boards" on public.research_boards;

create policy "Users can manage research boards" on public.research_boards
  for all using (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  ) with check (
    auth.uid() is not null and (
      auth.uid() = user_id
      or (workspace_id is not null and public.user_has_workspace_access(workspace_id))
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_workspaces_updated_at on public.workspaces;
create trigger update_workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_collections_updated_at on public.collections;
create trigger update_collections_updated_at
  before update on public.collections
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_notes_updated_at on public.notes;
create trigger update_notes_updated_at
  before update on public.notes
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_habits_updated_at on public.habits;
create trigger update_habits_updated_at
  before update on public.habits
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_files_updated_at on public.files;
create trigger update_files_updated_at
  before update on public.files
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_conversations_updated_at on public.conversations;
create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_research_boards_updated_at on public.research_boards;
create trigger update_research_boards_updated_at
  before update on public.research_boards
  for each row execute function public.update_updated_at_column();

drop trigger if exists touch_conversation_on_message_insert on public.messages;
create trigger touch_conversation_on_message_insert
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- =====================================================
-- BACKFILL FOR EXISTING AUTH USERS
-- =====================================================
insert into public.profiles (user_id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
on conflict (user_id) do update
  set display_name = excluded.display_name,
      updated_at = now();

insert into public.workspaces (user_id, name, icon)
select
  u.id,
  'My Workspace',
  '🏠'
from auth.users u
where not exists (
  select 1
  from public.workspaces w
  where w.user_id = u.id
);

insert into public.workspace_members (workspace_id, user_id, email, role, invited_by, accepted_at)
select
  w.id,
  w.user_id,
  coalesce(u.email, u.id::text),
  'owner',
  w.user_id,
  now()
from public.workspaces w
join auth.users u on u.id = w.user_id
where not exists (
  select 1
  from public.workspace_members wm
  where wm.workspace_id = w.id
    and wm.email = coalesce(u.email, u.id::text)
);
