-- Kiden Hub v3 Migration
-- This migration sets up the schema for all 10 features as defined in the implementation prompt.

-- Clean up existing tables that will be redefined
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.workspace_members CASCADE;
DROP TABLE IF EXISTS public.workspaces CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.board_cards CASCADE;
DROP TABLE IF EXISTS public.board_columns CASCADE;
DROP TABLE IF EXISTS public.research_boards CASCADE;
DROP TABLE IF EXISTS public.message_files CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;

-- 1. WORKSPACES
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id),
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  storage_limit bigint DEFAULT 5368709120,  -- 5 GB in bytes
  created_at timestamptz DEFAULT now()
);

-- 2. WORKSPACE MEMBERS
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 3. INVITATIONS
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text DEFAULT 'member',
  token text UNIQUE DEFAULT gen_random_uuid()::text,
  invited_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

-- 4. FILES
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  size bigint NOT NULL,
  type text NOT NULL,            -- 'pdf', 'image', 'video', 'doc', etc.
  mime_type text NOT NULL,
  storage_path text NOT NULL,    -- Supabase Storage path
  public_url text,               -- Public URL after upload
  ai_indexed boolean DEFAULT false,
  ai_summary text,               -- AI-generated summary of file content
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. CONVERSATIONS
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id),
  title text,                        -- Auto-generated from first message
  summary text,                      -- AI-generated summary for memory
  message_count integer DEFAULT 0,
  last_message_at timestamptz,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  file_refs uuid[],                  -- Array of file IDs referenced in this message
  created_at timestamptz DEFAULT now()
);

-- 7. MESSAGE FILES (Linking table)
CREATE TABLE public.message_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  file_id uuid REFERENCES public.files(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 8. RESEARCH BOARDS
CREATE TABLE public.research_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id),
  title text NOT NULL,
  description text,
  emoji text DEFAULT '🔬',
  is_shared boolean DEFAULT false,
  shared_with uuid[],              -- Array of user IDs
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. BOARD COLUMNS
CREATE TABLE public.board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES public.research_boards(id) ON DELETE CASCADE,
  title text NOT NULL,
  color text DEFAULT '#7c6af7',
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 10. BOARD CARDS
CREATE TABLE public.board_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid REFERENCES public.board_columns(id) ON DELETE CASCADE,
  board_id uuid REFERENCES public.research_boards(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  tags text[],
  position integer NOT NULL,
  linked_files uuid[],             -- File IDs linked to this card
  linked_conversation uuid,        -- Conversation ID this came from
  ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. NOTES
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id),
  title text NOT NULL DEFAULT 'Untitled',
  content text,                    -- Store as markdown or JSON (depending on editor)
  content_text text,               -- Plain text version for full-text search
  word_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  linked_board_id uuid REFERENCES public.research_boards(id),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 12. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,              -- 'file_indexed', 'board_shared', 'member_joined', 'storage_warning', 'comment'
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}',    -- e.g. { file_id, board_id, from_user_id }
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 13. UPDATE PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- INDEXES
CREATE INDEX files_name_fts ON public.files USING gin(to_tsvector('english', name));
CREATE INDEX files_user_id ON public.files(user_id);
CREATE INDEX files_workspace_id ON public.files(workspace_id);

CREATE INDEX messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX conversations_user_id ON public.conversations(user_id);

CREATE INDEX board_cards_column_id ON public.board_cards(column_id);
CREATE INDEX research_boards_user_id ON public.research_boards(user_id);

CREATE INDEX notes_user_id ON public.notes(user_id);
CREATE INDEX notes_fts ON public.notes USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_text, '')));

CREATE INDEX notifications_user_id_read ON public.notifications(user_id, is_read);

-- RLS POLICIES

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

-- Workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members see their workspaces" ON public.workspaces;
CREATE POLICY "Members see their workspaces" ON public.workspaces FOR SELECT USING (
  public.user_has_workspace_access(id)
);

-- Workspace Members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members see member list" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspace_members;
CREATE POLICY "Members see member list" ON public.workspace_members FOR SELECT USING (
  user_id = auth.uid() OR email = auth.email() OR public.user_owns_workspace(workspace_id)
);

DROP POLICY IF EXISTS "Workspace owners can add members" ON public.workspace_members;
CREATE POLICY "Workspace owners can add members" ON public.workspace_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR public.user_owns_workspace(workspace_id)
);

DROP POLICY IF EXISTS "Workspace owners can remove members" ON public.workspace_members;
CREATE POLICY "Workspace owners can remove members" ON public.workspace_members FOR DELETE USING (
  user_id = auth.uid() OR public.user_owns_workspace(workspace_id)
);

DROP POLICY IF EXISTS "Users can accept their own invites" ON public.workspace_members;
CREATE POLICY "Users can accept their own invites" ON public.workspace_members FOR UPDATE USING (
  user_id = auth.uid() OR email = auth.email() OR public.user_owns_workspace(workspace_id)
) WITH CHECK (
  user_id = auth.uid() OR email = auth.email() OR public.user_owns_workspace(workspace_id)
);

-- Files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own files" ON public.files FOR ALL USING (auth.uid() = user_id);

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own messages" ON public.messages FOR ALL USING (
  conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
);

-- Research Boards
ALTER TABLE public.research_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board owners" ON public.research_boards FOR ALL USING (
  auth.uid() = user_id OR auth.uid() = ANY(shared_with)
);

-- Board Columns
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board column access" ON public.board_columns FOR ALL USING (
  board_id IN (SELECT id FROM public.research_boards WHERE user_id = auth.uid() OR auth.uid() = ANY(shared_with))
);

-- Board Cards
ALTER TABLE public.board_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board card access" ON public.board_cards FOR ALL USING (
  board_id IN (SELECT id FROM public.research_boards WHERE user_id = auth.uid() OR auth.uid() = ANY(shared_with))
);

-- Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- STORAGE BUCKETS (Note: SQL for buckets requires admin or specific extensions, usually done in dashboard or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('kiden-files', 'kiden-files', false) ON CONFLICT DO NOTHING;
