-- Add section column to research_board_items
ALTER TABLE public.research_board_items ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'General';
