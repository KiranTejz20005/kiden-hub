-- Kiden Hub Single-File Supabase Setup
-- Run this once in Supabase SQL Editor on a fresh project.

create extension if not exists pgcrypto;

-- =====================================================
-- DROP EXISTING OBJECTS
-- =====================================================
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.board_cards CASCADE;
DROP TABLE IF EXISTS public.board_columns CASCADE;
DROP TABLE IF EXISTS public.research_boards CASCADE;
DROP TABLE IF EXISTS public.message_files CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.leetcode_problems CASCADE;
DROP TABLE IF EXISTS public.habit_logs CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.workspace_members CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.ideas CASCADE;
DROP TABLE IF EXISTS public.focus_sessions CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.workspaces CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================
-- CORE TABLES
-- =====================================================
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  focus_settings jsonb DEFAULT '{"workDuration":25,"shortBreakDuration":5,"longBreakDuration":15,"sessionsBeforeLongBreak":4}'::jsonb,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text DEFAULT '📁',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workspace_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT '📂',
  color text DEFAULT '#10B981',
  item_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content jsonb DEFAULT '[]'::jsonb,
  icon text DEFAULT '📝',
  cover_image text,
  is_template boolean DEFAULT false,
  template_category text,
  is_archived boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ideas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'neural' CHECK (category IN ('neural', 'creative', 'logic', 'project')),
  is_processed boolean DEFAULT false,
  note_id uuid REFERENCES public.notes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.focus_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_id uuid REFERENCES public.notes(id) ON DELETE SET NULL,
  task_id uuid,
  project_id uuid,
  duration_minutes integer NOT NULL,
  session_type text NOT NULL DEFAULT 'work' CHECK (session_type IN ('work', 'short_break', 'long_break', 'flow')),
  completed boolean DEFAULT false,
  interruptions_count integer DEFAULT 0,
  notes text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'project' CHECK (category IN ('project', 'task', 'kanban', 'goal', 'sprint', 'custom')),
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  icon text DEFAULT '📋',
  is_system boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#10B981',
  icon text DEFAULT 'folder',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  target_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  estimated_minutes integer,
  actual_minutes integer DEFAULT 0,
  tags text[],
  parent_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  content text,
  transcript text,
  mood text,
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  wins text[] DEFAULT '{}',
  blockers text,
  video_url text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.books (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  author text,
  total_pages integer NOT NULL DEFAULT 0,
  current_page integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'reading' CHECK (status IN ('want_to_read', 'reading', 'completed', 'on_hold')),
  cover_url text,
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.habits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '✓',
  color text NOT NULL DEFAULT '#3b82f6',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.habit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  completed_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

CREATE TABLE public.leetcode_problems (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  problem_number integer,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text NOT NULL DEFAULT 'arrays',
  url text,
  status text NOT NULL DEFAULT 'solved' CHECK (status IN ('solved', 'attempted', 'todo', 'revisit')),
  notes text,
  time_taken_minutes integer,
  solved_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  size bigint NOT NULL,
  type text NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  ai_indexed boolean DEFAULT false,
  ai_summary text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id),
  title text,
  summary text,
  message_count integer DEFAULT 0,
  last_message_at timestamptz,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  file_refs uuid[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.message_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  file_id uuid REFERENCES public.files(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.research_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id),
  title text NOT NULL,
  description text,
  emoji text DEFAULT '🔬',
  is_shared boolean DEFAULT false,
  shared_with uuid[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES public.research_boards(id) ON DELETE CASCADE,
  title text NOT NULL,
  color text DEFAULT '#7c6af7',
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.board_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid REFERENCES public.board_columns(id) ON DELETE CASCADE,
  board_id uuid REFERENCES public.research_boards(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  tags text[],
  position integer NOT NULL,
  linked_files uuid[],
  linked_conversation uuid,
  ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');

  INSERT INTO public.workspaces (user_id, name, icon)
  VALUES (NEW.id, 'My Workspace', '🏠');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leetcode_problems_updated_at
  BEFORE UPDATE ON public.leetcode_problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_research_boards_updated_at
  BEFORE UPDATE ON public.research_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_board_cards_updated_at
  BEFORE UPDATE ON public.board_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX workspaces_user_id_idx ON public.workspaces(user_id);
CREATE INDEX workspace_members_workspace_id_idx ON public.workspace_members(workspace_id);
CREATE INDEX workspace_members_user_id_idx ON public.workspace_members(user_id);
CREATE INDEX collections_workspace_id_idx ON public.collections(workspace_id);
CREATE INDEX notes_user_id_idx ON public.notes(user_id);
CREATE INDEX notes_workspace_id_idx ON public.notes(workspace_id);
CREATE INDEX notes_collection_id_idx ON public.notes(collection_id);
CREATE INDEX notes_fts_idx ON public.notes USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content::text, '')));
CREATE INDEX focus_sessions_user_id_idx ON public.focus_sessions(user_id);
CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX journal_entries_user_id_idx ON public.journal_entries(user_id);
CREATE INDEX books_user_id_idx ON public.books(user_id);
CREATE INDEX habits_user_id_idx ON public.habits(user_id);
CREATE INDEX habit_logs_user_id_idx ON public.habit_logs(user_id);
CREATE INDEX leetcode_problems_user_id_idx ON public.leetcode_problems(user_id);
CREATE INDEX files_user_id_idx ON public.files(user_id);
CREATE INDEX files_workspace_id_idx ON public.files(workspace_id);
CREATE INDEX files_name_fts_idx ON public.files USING gin(to_tsvector('english', name));
CREATE INDEX conversations_user_id_idx ON public.conversations(user_id);
CREATE INDEX conversations_last_message_at_idx ON public.conversations(last_message_at DESC);
CREATE INDEX messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX research_boards_user_id_idx ON public.research_boards(user_id);
CREATE INDEX board_columns_board_id_idx ON public.board_columns(board_id);
CREATE INDEX board_cards_board_id_idx ON public.board_cards(board_id);
CREATE INDEX notifications_user_id_read_idx ON public.notifications(user_id, is_read);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leetcode_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Workspaces and members
CREATE OR REPLACE FUNCTION public.user_owns_workspace(workspace_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = workspace_uuid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_workspace_access(workspace_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = workspace_uuid AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspace_uuid
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
  );
$$;

CREATE POLICY "Users can view owned or member workspaces" ON public.workspaces FOR SELECT USING (
  public.user_has_workspace_access(id)
);
CREATE POLICY "Users can create own workspaces" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workspaces" ON public.workspaces FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workspaces" ON public.workspaces FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view workspaces they are members of" ON public.workspace_members FOR SELECT USING (
  user_id = auth.uid() OR email = auth.email() OR public.user_owns_workspace(workspace_id)
);
CREATE POLICY "Workspace owners can add members" ON public.workspace_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR public.user_owns_workspace(workspace_id)
);
CREATE POLICY "Workspace owners can remove members" ON public.workspace_members FOR DELETE USING (
  user_id = auth.uid() OR public.user_owns_workspace(workspace_id)
);
CREATE POLICY "Users can accept their own invites" ON public.workspace_members FOR UPDATE USING (
  user_id = auth.uid() OR email = auth.email() OR public.user_owns_workspace(workspace_id)
) WITH CHECK (
  user_id = auth.uid() OR email = auth.email() OR public.user_owns_workspace(workspace_id)
);

-- Collections and notes
CREATE POLICY "Users can view own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view notes in accessible workspaces" ON public.notes FOR SELECT USING (
  user_id = auth.uid() OR workspace_id IN (
    SELECT id FROM public.workspaces WHERE user_id = auth.uid()
    UNION
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
  )
);
CREATE POLICY "Users can create notes in accessible workspaces" ON public.notes FOR INSERT WITH CHECK (
  user_id = auth.uid() OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND accepted_at IS NOT NULL AND role IN ('owner', 'editor')
  )
);
CREATE POLICY "Users can update notes in accessible workspaces" ON public.notes FOR UPDATE USING (
  user_id = auth.uid() OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND accepted_at IS NOT NULL AND role IN ('owner', 'editor')
  )
);
CREATE POLICY "Users can delete notes in accessible workspaces" ON public.notes FOR DELETE USING (
  user_id = auth.uid() OR workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND accepted_at IS NOT NULL AND role IN ('owner', 'editor')
  )
);

-- Ideas, focus sessions, chat messages, templates
CREATE POLICY "Users can view own ideas" ON public.ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ideas" ON public.ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON public.ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON public.ideas FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own focus sessions" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own focus sessions" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON public.focus_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus sessions" ON public.focus_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view templates" ON public.templates FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.templates FOR UPDATE USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can delete own templates" ON public.templates FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- Projects, tasks, journal, books, habits, leetcode
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own journal entries" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal entries" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal entries" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal entries" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own books" ON public.books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books" ON public.books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own books" ON public.books FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own habit logs" ON public.habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own habit logs" ON public.habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habit logs" ON public.habit_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own problems" ON public.leetcode_problems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own problems" ON public.leetcode_problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own problems" ON public.leetcode_problems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own problems" ON public.leetcode_problems FOR DELETE USING (auth.uid() = user_id);

-- Files, conversations, messages, boards, notifications
CREATE POLICY "Users can view own files" ON public.files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own files" ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own files" ON public.files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON public.files FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own messages" ON public.messages FOR ALL USING (
  conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
);
CREATE POLICY "Board owners" ON public.research_boards FOR ALL USING (
  auth.uid() = user_id OR auth.uid() = ANY(shared_with)
);
CREATE POLICY "Board column access" ON public.board_columns FOR ALL USING (
  board_id IN (SELECT id FROM public.research_boards WHERE user_id = auth.uid() OR auth.uid() = ANY(shared_with))
);
CREATE POLICY "Board card access" ON public.board_cards FOR ALL USING (
  board_id IN (SELECT id FROM public.research_boards WHERE user_id = auth.uid() OR auth.uid() = ANY(shared_with))
);
CREATE POLICY "Users own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('kiden-files', 'kiden-files', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-videos', 'journal-videos', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users access own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users access own files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own journal videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own journal videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own journal videos" ON storage.objects;

CREATE POLICY "Users upload own avatars" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text
);
CREATE POLICY "Users access own avatars" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text
);
CREATE POLICY "Users delete own avatars" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'kiden-files' AND split_part(name, '/', 1) = auth.uid()::text
);
CREATE POLICY "Users access own files" ON storage.objects FOR SELECT USING (
  bucket_id = 'kiden-files' AND split_part(name, '/', 1) = auth.uid()::text
);
CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE USING (
  bucket_id = 'kiden-files' AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Users can upload their own journal videos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'journal-videos' AND split_part(name, '/', 1) = auth.uid()::text
);
CREATE POLICY "Users can view their own journal videos" ON storage.objects FOR SELECT USING (
  bucket_id = 'journal-videos' AND split_part(name, '/', 1) = auth.uid()::text
);
CREATE POLICY "Users can delete their own journal videos" ON storage.objects FOR DELETE USING (
  bucket_id = 'journal-videos' AND split_part(name, '/', 1) = auth.uid()::text
);

-- =====================================================
-- OPTIONAL REALTIME ENABLEMENT
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leetcode_problems;
