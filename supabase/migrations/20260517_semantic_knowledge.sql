-- KIDEN HUB: SEMANTIC KNOWLEDGE & MULTI-MODAL UPGRADE
-- IMPORTANT: Run this to fix "relation media_extractions does not exist" error.

-- 1. Create Media Extractions Table (Missing in previous step)
CREATE TABLE IF NOT EXISTS public.media_extractions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT,
  source_url  TEXT,
  source_type TEXT CHECK (source_type IN ('rss', 'social', 'web')),
  metadata    JSONB DEFAULT '{}',
  embedding   vector(1536), -- Added for semantic search
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add embeddings to personal knowledge tables
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create indices for performance
CREATE INDEX IF NOT EXISTS notes_embedding_idx ON public.notes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS media_extractions_embedding_idx ON public.media_extractions USING ivfflat (embedding vector_cosine_ops);

-- 4. Enable RLS
ALTER TABLE public.media_extractions ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_extractions' AND policyname = 'media_extractions_isolation') THEN
    CREATE POLICY "media_extractions_isolation" ON public.media_extractions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Unified Knowledge Search RPC
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  source_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT
      n.id,
      n.title,
      COALESCE(n.content::text, '') as content,
      'note' as source_type,
      1 - (n.embedding <=> query_embedding) AS similarity
    FROM notes n
    WHERE n.user_id = p_user_id
    AND n.embedding IS NOT NULL
    AND n.embedding <=> query_embedding < 1 - match_threshold
  )
  UNION ALL
  (
    SELECT
      me.id,
      me.title,
      me.content,
      me.source_type,
      1 - (me.embedding <=> query_embedding) AS similarity
    FROM media_extractions me
    WHERE me.user_id = p_user_id
    AND me.embedding IS NOT NULL
    AND me.embedding <=> query_embedding < 1 - match_threshold
  )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
