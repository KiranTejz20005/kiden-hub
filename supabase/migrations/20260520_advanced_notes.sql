-- ADVANCED NOTES SYSTEM MIGRATION
-- 1. Folders for organization
CREATE TABLE IF NOT EXISTS public.note_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.note_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  is_collapsed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enhanced Notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.note_folders(id) ON DELETE SET NULL;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_full_width boolean DEFAULT false;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS version_count integer DEFAULT 1;

-- 3. Note Versions for history
CREATE TABLE IF NOT EXISTS public.note_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  title text,
  created_at timestamptz DEFAULT now()
);

-- 4. Note Comments
CREATE TABLE IF NOT EXISTS public.note_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id text, -- ID of the block in TipTap
  content text NOT NULL,
  is_resolved boolean DEFAULT false,
  parent_id uuid REFERENCES public.note_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Note Collaborators (Note-specific permissions)
CREATE TABLE IF NOT EXISTS public.note_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'viewer' CHECK (role IN ('editor', 'commenter', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(note_id, user_id)
);

-- RLS POLICIES
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Folders isolation" ON public.note_folders FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.note_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Versions access" ON public.note_versions FOR SELECT USING (
  note_id IN (SELECT id FROM public.notes WHERE user_id = auth.uid())
);

ALTER TABLE public.note_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments access" ON public.note_comments FOR ALL USING (
  note_id IN (SELECT id FROM public.notes WHERE user_id = auth.uid())
);

ALTER TABLE public.note_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collaborators access" ON public.note_collaborators FOR ALL USING (
  note_id IN (SELECT id FROM public.notes WHERE user_id = auth.uid())
);
