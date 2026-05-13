-- Kiden Hub Incremental Supabase Update
-- Run this AFTER the base schema already exists.
-- This script is safe to re-run.

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
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        updated_at = now();

  insert into public.workspaces (user_id, name, icon)
  values (new.id, 'My Workspace', '🏠')
  on conflict do nothing;

  return new;
end;
$$;

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

drop trigger if exists update_projects_updated_at on public.projects;
create trigger update_projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_tasks_updated_at on public.tasks;
create trigger update_tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_journal_entries_updated_at on public.journal_entries;
create trigger update_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_leetcode_problems_updated_at on public.leetcode_problems;
create trigger update_leetcode_problems_updated_at
  before update on public.leetcode_problems
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_files_updated_at on public.files;
create trigger update_files_updated_at
  before update on public.files
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_research_boards_updated_at on public.research_boards;
create trigger update_research_boards_updated_at
  before update on public.research_boards
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_board_cards_updated_at on public.board_cards;
create trigger update_board_cards_updated_at
  before update on public.board_cards
  for each row execute function public.update_updated_at_column();

-- =====================================================
-- COLUMNS
-- =====================================================
alter table public.profiles
  add column if not exists onboarding_completed boolean default false;

alter table public.journal_entries
  add column if not exists transcript text;

alter table public.focus_sessions
  add column if not exists task_id uuid,
  add column if not exists project_id uuid,
  add column if not exists interruptions_count integer default 0,
  add column if not exists notes text;

-- =====================================================
-- INDEXES
-- =====================================================
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists workspaces_user_id_idx on public.workspaces(user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists collections_workspace_id_idx on public.collections(workspace_id);
create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_workspace_id_idx on public.notes(workspace_id);
create index if not exists notes_collection_id_idx on public.notes(collection_id);
create index if not exists notes_fts_idx on public.notes using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content::text, '')));
create index if not exists focus_sessions_user_id_idx on public.focus_sessions(user_id);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists journal_entries_user_id_idx on public.journal_entries(user_id);
create index if not exists books_user_id_idx on public.books(user_id);
create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habit_logs_user_id_idx on public.habit_logs(user_id);
create index if not exists leetcode_problems_user_id_idx on public.leetcode_problems(user_id);
create index if not exists files_user_id_idx on public.files(user_id);
create index if not exists files_workspace_id_idx on public.files(workspace_id);
create index if not exists files_name_fts_idx on public.files using gin(to_tsvector('english', name));
create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists conversations_last_message_at_idx on public.conversations(last_message_at desc);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists research_boards_user_id_idx on public.research_boards(user_id);
create index if not exists board_columns_board_id_idx on public.board_columns(board_id);
create index if not exists board_cards_board_id_idx on public.board_cards(board_id);
create index if not exists notifications_user_id_read_idx on public.notifications(user_id, is_read);

-- =====================================================
-- RLS POLICIES
-- =====================================================
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.collections enable row level security;
alter table public.notes enable row level security;
alter table public.ideas enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.templates enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.books enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.leetcode_problems enable row level security;
alter table public.files enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.research_boards enable row level security;
alter table public.board_columns enable row level security;
alter table public.board_cards enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users can view accessible workspaces" on public.workspaces;
drop policy if exists "Users can view owned or member workspaces" on public.workspaces;
drop policy if exists "Members see their workspaces" on public.workspaces;
drop policy if exists "Users can view own workspaces" on public.workspaces;
drop policy if exists "Users can create own workspaces" on public.workspaces;
drop policy if exists "Users can update own workspaces" on public.workspaces;
drop policy if exists "Users can delete own workspaces" on public.workspaces;

drop policy if exists "Users can view workspaces they are members of" on public.workspace_members;
drop policy if exists "Users can view workspace members" on public.workspace_members;
drop policy if exists "Members see member list" on public.workspace_members;
drop policy if exists "Workspace owners can add members" on public.workspace_members;
drop policy if exists "Workspace owners can remove members" on public.workspace_members;
drop policy if exists "Users can accept their own invites" on public.workspace_members;
drop policy if exists "Users can create workspace members" on public.workspace_members;
drop policy if exists "Users can update workspace members" on public.workspace_members;
drop policy if exists "Users can delete workspace members" on public.workspace_members;

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
      select 1 from public.workspaces
      where id = workspace_uuid and user_id = auth.uid()
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
      select 1 from public.workspaces
      where id = workspace_uuid and user_id = auth.uid()
    ) or exists (
      select 1 from public.workspace_members
      where workspace_id = workspace_uuid
        and user_id = auth.uid()
        and accepted_at is not null
    )
  end;
$$;

create policy "Authenticated users can view their workspaces" on public.workspaces
  for select using (
    auth.uid() is not null and public.user_has_workspace_access(id)
  );

create policy "Authenticated users can insert own workspaces" on public.workspaces
  for insert with check (
    auth.uid() is not null and auth.uid() = user_id
  );

create policy "Workspace owners can update" on public.workspaces
  for update using (
    auth.uid() is not null and auth.uid() = user_id
  ) with check (
    auth.uid() is not null and auth.uid() = user_id
  );

create policy "Workspace owners can delete" on public.workspaces
  for delete using (
    auth.uid() is not null and auth.uid() = user_id
  );

create policy "Authenticated users can view workspace members" on public.workspace_members
  for select using (
    auth.uid() is not null and (
      user_id = auth.uid()
      or email = auth.email()
      or public.user_owns_workspace(workspace_id)
    )
  );

create policy "Workspace owners can add members" on public.workspace_members
  for insert with check (
    auth.uid() is not null and (
      user_id = auth.uid()
      or public.user_owns_workspace(workspace_id)
    )
  );

create policy "Workspace members can update themselves" on public.workspace_members
  for update using (
    auth.uid() is not null and (
      user_id = auth.uid()
      or public.user_owns_workspace(workspace_id)
    )
  ) with check (
    auth.uid() is not null and (
      user_id = auth.uid()
      or public.user_owns_workspace(workspace_id)
    )
  );

create policy "Workspace owners can remove members" on public.workspace_members
  for delete using (
    auth.uid() is not null and public.user_owns_workspace(workspace_id)
  );

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Users can delete own profile" on public.profiles for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own files" on public.files;
drop policy if exists "Users can insert own files" on public.files;
drop policy if exists "Users can update own files" on public.files;
drop policy if exists "Users can delete own files" on public.files;
create policy "Users can view own files" on public.files for select using (auth.uid() = user_id);
create policy "Users can insert own files" on public.files for insert with check (auth.uid() = user_id);
create policy "Users can update own files" on public.files for update using (auth.uid() = user_id);
create policy "Users can delete own files" on public.files for delete using (auth.uid() = user_id);

drop policy if exists "Users own conversations" on public.conversations;
create policy "Users own conversations" on public.conversations for all using (auth.uid() = user_id);

drop policy if exists "Users own messages" on public.messages;
create policy "Users own messages" on public.messages for all using (
  conversation_id in (select id from public.conversations where user_id = auth.uid())
);

drop policy if exists "Users own notifications" on public.notifications;
create policy "Users own notifications" on public.notifications for all using (auth.uid() = user_id);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('kiden-files', 'kiden-files', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('journal-videos', 'journal-videos', false) on conflict (id) do nothing;

drop policy if exists "Users upload own avatars" on storage.objects;
drop policy if exists "Users access own avatars" on storage.objects;
drop policy if exists "Users delete own avatars" on storage.objects;
drop policy if exists "Users upload own files" on storage.objects;
drop policy if exists "Users access own files" on storage.objects;
drop policy if exists "Users delete own files" on storage.objects;
drop policy if exists "Users can upload their own journal videos" on storage.objects;
drop policy if exists "Users can view their own journal videos" on storage.objects;
drop policy if exists "Users can delete their own journal videos" on storage.objects;

create policy "Users upload own avatars" on storage.objects for insert with check (
  bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
);
create policy "Users access own avatars" on storage.objects for select using (
  bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
);
create policy "Users delete own avatars" on storage.objects for delete using (
  bucket_id = 'avatars' and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users upload own files" on storage.objects for insert with check (
  bucket_id = 'kiden-files' and split_part(name, '/', 1) = auth.uid()::text
);
create policy "Users access own files" on storage.objects for select using (
  bucket_id = 'kiden-files' and split_part(name, '/', 1) = auth.uid()::text
);
create policy "Users delete own files" on storage.objects for delete using (
  bucket_id = 'kiden-files' and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users can upload their own journal videos" on storage.objects for insert with check (
  bucket_id = 'journal-videos' and split_part(name, '/', 1) = auth.uid()::text
);
create policy "Users can view their own journal videos" on storage.objects for select using (
  bucket_id = 'journal-videos' and split_part(name, '/', 1) = auth.uid()::text
);
create policy "Users can delete their own journal videos" on storage.objects for delete using (
  bucket_id = 'journal-videos' and split_part(name, '/', 1) = auth.uid()::text
);

-- =====================================================
-- REALTIME
-- =====================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes') then
    alter publication supabase_realtime add table public.notes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'workspace_members') then
    alter publication supabase_realtime add table public.workspace_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'files') then
    alter publication supabase_realtime add table public.files;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'research_boards') then
    alter publication supabase_realtime add table public.research_boards;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'board_cards') then
    alter publication supabase_realtime add table public.board_cards;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
