-- Consolidated Research Boards Migration
-- This script ensures the base tables exist before adding template support

-- 1. Create Research Boards table if missing
CREATE TABLE IF NOT EXISTS public.research_boards (
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

-- 2. Create Board Columns table if missing
CREATE TABLE IF NOT EXISTS public.board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES public.research_boards(id) ON DELETE CASCADE,
  title text NOT NULL,
  color text DEFAULT '#7c6af7',
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Create Board Cards table if missing
CREATE TABLE IF NOT EXISTS public.board_cards (
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

-- 4. Add template support columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='research_boards' AND column_name='type') THEN
    ALTER TABLE public.research_boards ADD COLUMN type text DEFAULT 'kanban' CHECK (type IN ('kanban', 'vision', 'tracking'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='board_cards' AND column_name='metadata') THEN
    ALTER TABLE public.board_cards ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 5. Update existing boards to have 'kanban' type if null
UPDATE public.research_boards SET type = 'kanban' WHERE type IS NULL;

-- 6. Enable RLS (Repeatable)
ALTER TABLE public.research_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_cards ENABLE ROW LEVEL SECURITY;

-- 7. Basic Policies (Repeatable)
DROP POLICY IF EXISTS "Board owners" ON public.research_boards;
CREATE POLICY "Board owners" ON public.research_boards FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Board column access" ON public.board_columns;
CREATE POLICY "Board column access" ON public.board_columns FOR ALL USING (board_id IN (SELECT id FROM public.research_boards WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Board card access" ON public.board_cards;
CREATE POLICY "Board card access" ON public.board_cards FOR ALL USING (board_id IN (SELECT id FROM public.research_boards WHERE user_id = auth.uid()));
