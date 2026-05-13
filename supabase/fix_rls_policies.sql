-- RLS Policy Fix Script
-- Fixes 403 Forbidden on workspace creation by simplifying and correcting RLS policies

-- =====================================================
-- DROP ALL PROBLEMATIC POLICIES
-- =====================================================
drop policy if exists "Users can view accessible workspaces" on public.workspaces;
drop policy if exists "Users can create own workspaces" on public.workspaces;
drop policy if exists "Users can update own workspaces" on public.workspaces;
drop policy if exists "Users can delete own workspaces" on public.workspaces;
drop policy if exists "Authenticated users can view their workspaces" on public.workspaces;
drop policy if exists "Authenticated users can insert own workspaces" on public.workspaces;
drop policy if exists "Workspace owners can update" on public.workspaces;
drop policy if exists "Workspace owners can delete" on public.workspaces;

drop policy if exists "Users can view workspace members" on public.workspace_members;
drop policy if exists "Users can create workspace members" on public.workspace_members;
drop policy if exists "Users can update workspace members" on public.workspace_members;
drop policy if exists "Users can delete workspace members" on public.workspace_members;
drop policy if exists "Authenticated users can view workspace members" on public.workspace_members;
drop policy if exists "Workspace owners can add members" on public.workspace_members;
drop policy if exists "Workspace members can update themselves" on public.workspace_members;
drop policy if exists "Workspace owners can remove members" on public.workspace_members;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

drop policy if exists "Users can view own files" on public.files;
drop policy if exists "Users can insert own files" on public.files;
drop policy if exists "Users can update own files" on public.files;
drop policy if exists "Users can delete own files" on public.files;

drop policy if exists "Users own conversations" on public.conversations;
drop policy if exists "Users own messages" on public.messages;
drop policy if exists "Users own notifications" on public.notifications;
drop policy if exists "Users can manage own conversations" on public.conversations;
drop policy if exists "Users can manage own messages" on public.messages;
drop policy if exists "Users can manage own notifications" on public.notifications;

-- =====================================================
-- RECREATE HELPER FUNCTIONS (if not exists, or replace)
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

-- =====================================================
-- WORKSPACES POLICIES
-- =====================================================
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

-- =====================================================
-- WORKSPACE_MEMBERS POLICIES
-- =====================================================
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

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own profile" on public.profiles
  for delete using (auth.uid() = user_id);

-- =====================================================
-- FILES POLICIES
-- =====================================================
create policy "Users can view own files" on public.files
  for select using (auth.uid() = user_id);

create policy "Users can insert own files" on public.files
  for insert with check (auth.uid() = user_id);

create policy "Users can update own files" on public.files
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own files" on public.files
  for delete using (auth.uid() = user_id);

-- =====================================================
-- CONVERSATIONS & MESSAGES POLICIES
-- =====================================================
create policy "Users can manage own conversations" on public.conversations
  for all using (auth.uid() = user_id);

create policy "Users can manage own messages" on public.messages
  for all using (
    conversation_id in (select id from public.conversations where user_id = auth.uid())
  );

create policy "Users can manage own notifications" on public.notifications
  for all using (auth.uid() = user_id);

-- =====================================================
-- VERIFY RLS IS ENABLED
-- =====================================================
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.profiles enable row level security;
alter table public.files enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
