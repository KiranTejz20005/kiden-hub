-- Create migration to add published_at and view_count as first-class columns to public.content_pieces
ALTER TABLE public.content_pieces 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;

-- Backfill existing data from content_metadata JSONB
UPDATE public.content_pieces 
SET 
  published_at = (content_metadata->>'published_at')::TIMESTAMPTZ,
  view_count = COALESCE((content_metadata->>'view_count')::BIGINT, 0)
WHERE published_at IS NULL OR view_count = 0;

-- Create indexes for optimal sorting and cursor-pagination performance
CREATE INDEX IF NOT EXISTS idx_cp_published_at ON public.content_pieces (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cp_view_count ON public.content_pieces (view_count DESC);
