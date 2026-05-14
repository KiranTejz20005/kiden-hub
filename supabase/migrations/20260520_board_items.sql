-- KIDEN HUB: BOARD ITEMS IMPLEMENTATION
-- Create the research_board_items table
CREATE TABLE IF NOT EXISTS public.research_board_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES public.research_boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('link', 'note', 'file', 'idea', 'video', 'chat')),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    title TEXT,
    description TEXT,
    url TEXT,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.research_board_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own board items" 
ON public.research_board_items 
FOR ALL 
USING (auth.uid() = user_id);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_board_items_board_id ON public.research_board_items(board_id);
CREATE INDEX IF NOT EXISTS idx_board_items_user_id ON public.research_board_items(user_id);
