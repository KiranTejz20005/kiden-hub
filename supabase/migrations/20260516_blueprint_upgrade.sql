-- ============================================================
-- KIDEN HUB: MASTER ARCHITECTURE UPGRADE
-- Aligning with Master PRD & Technical Blueprint
-- ============================================================

-- 1. Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Enhance content_pieces with embeddings and outlier signals
ALTER TABLE public.content_pieces 
ADD COLUMN IF NOT EXISTS embedding vector(1536), -- For OpenAI/Gemini embeddings
ADD COLUMN IF NOT EXISTS outlier_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS learning_time_minutes INTEGER;

-- 3. Enhance research_boards with visibility and metadata
ALTER TABLE public.research_boards
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS covers_url TEXT;

-- 4. Create hybrid search function
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  content_url TEXT,
  thumbnail_url TEXT,
  source_platform TEXT,
  quality_score FLOAT,
  outlier_score FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.title,
    cp.description,
    cp.content_url,
    cp.thumbnail_url,
    cp.source_platform,
    cp.quality_score,
    cp.outlier_score,
    1 - (cp.embedding <=> query_embedding) AS similarity
  FROM content_pieces cp
  WHERE 
    (category_filter IS NULL OR cp.category = category_filter)
    AND (
      cp.embedding <=> query_embedding < 1 - match_threshold
      OR to_tsvector('english', cp.title || ' ' || cp.description) @@ plainto_tsquery('english', query_text)
    )
  ORDER BY 
    (1 - (cp.embedding <=> query_embedding)) * 0.6 + 
    (ts_rank(to_tsvector('english', cp.title || ' ' || cp.description), plainto_tsquery('english', query_text))) * 0.4 DESC
  LIMIT match_count;
END;
$$;

-- 5. Outlier Score Calculation Function
-- Formula: Current engagement / Creator average engagement
CREATE OR REPLACE FUNCTION calculate_outlier_scores()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  creator_avg RECORD;
BEGIN
  FOR creator_avg IN 
    SELECT creator_id, AVG(engagement_rate) as avg_rate 
    FROM content_pieces 
    GROUP BY creator_id 
    HAVING COUNT(*) > 2
  LOOP
    UPDATE content_pieces
    SET outlier_score = engagement_rate / NULLIF(creator_avg.avg_rate, 0)
    WHERE creator_id = creator_avg.creator_id;
  END LOOP;
END;
$$;

-- 6. Fix user_study_videos security and integrity
ALTER TABLE public.user_study_videos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_study_videos' AND policyname = 'user_study_videos_isolation') THEN
    CREATE POLICY "user_study_videos_isolation" ON public.user_study_videos FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure no duplicate videos in library per user
ALTER TABLE public.user_study_videos ADD CONSTRAINT user_video_unique UNIQUE (user_id, video_id);

-- 7. Batch Update Positions RPC
CREATE OR REPLACE FUNCTION batch_update_video_positions(updates jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- updates is an array of {id: uuid, position: int}
  FOR i IN 0 .. jsonb_array_length(updates) - 1 LOOP
    UPDATE user_study_videos
    SET position = (updates->i->>'position')::int
    WHERE id = (updates->i->>'id')::uuid
    AND user_id = auth.uid();
  END LOOP;
END;
$$;
