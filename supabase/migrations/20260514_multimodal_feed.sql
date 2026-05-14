-- ============================================================
-- KIDEN HUB: MULTI-MODAL FEED - DATABASE MIGRATION
-- Phase 1A: All 7 tables per specification
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── 1. CREATORS TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS creators (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  handle              TEXT,
  profile_image_url   TEXT,
  bio                 TEXT,
  primary_platform    TEXT DEFAULT 'youtube' CHECK (primary_platform IN ('youtube','twitter','substack','github','medium')),
  platform_accounts   JSONB DEFAULT '{}',
  verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('verified','pending','none')),
  authority_score     FLOAT DEFAULT 0,
  expertise_areas     JSONB DEFAULT '[]',
  is_premium_creator  BOOLEAN DEFAULT FALSE,
  avg_engagement_rate FLOAT DEFAULT 0,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(handle, primary_platform)
);

CREATE INDEX IF NOT EXISTS idx_creators_authority ON creators (authority_score DESC);
CREATE INDEX IF NOT EXISTS idx_creators_platform  ON creators (primary_platform);

-- ── 2. CONTENT_PIECES TABLE ────────────────────────────────
CREATE TABLE IF NOT EXISTS content_pieces (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type     TEXT NOT NULL DEFAULT 'video' CHECK (content_type IN ('video','article','tutorial','podcast','research_paper','tweet_thread','tool')),
  external_id      TEXT NOT NULL,
  source_platform  TEXT NOT NULL DEFAULT 'youtube' CHECK (source_platform IN ('youtube','medium','dev.to','twitter','github','substack')),
  title            TEXT NOT NULL,
  description      TEXT,
  content_url      TEXT NOT NULL,
  thumbnail_url    TEXT,
  preview_content  TEXT,
  creator_id       UUID REFERENCES creators(id) ON DELETE SET NULL,
  category         TEXT NOT NULL,
  tags             JSONB DEFAULT '[]',
  content_metadata JSONB DEFAULT '{}',
  quality_score    FLOAT DEFAULT 0,
  virality_score   FLOAT DEFAULT 0,
  engagement_rate  FLOAT DEFAULT 0,
  is_indexed       BOOLEAN DEFAULT FALSE,
  cached_at        TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_id, source_platform)
);

CREATE INDEX IF NOT EXISTS idx_cp_category_quality  ON content_pieces (category, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_cp_creator_id         ON content_pieces (creator_id);
CREATE INDEX IF NOT EXISTS idx_cp_source_platform    ON content_pieces (source_platform);
CREATE INDEX IF NOT EXISTS idx_cp_virality           ON content_pieces (virality_score DESC);
CREATE INDEX IF NOT EXISTS idx_cp_created_at         ON content_pieces (created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_cp_fts ON content_pieces 
  USING GIN(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

-- ── 3. CONTENT_RELATIONSHIPS TABLE ─────────────────────────
CREATE TABLE IF NOT EXISTS content_relationships (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_content_id  UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  related_content_id UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  relationship_type  TEXT DEFAULT 'related' CHECK (relationship_type IN ('related','prerequisite','follow_up','deep_dive','alternative')),
  confidence_score   FLOAT DEFAULT 0,
  created_by         TEXT DEFAULT 'ai_algorithm' CHECK (created_by IN ('ai_algorithm','manual_curation')),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cr_source   ON content_relationships (source_content_id);
CREATE INDEX IF NOT EXISTS idx_cr_related  ON content_relationships (related_content_id);

-- ── 4. USER_CONTENT_INTERACTIONS TABLE ─────────────────────
CREATE TABLE IF NOT EXISTS user_content_interactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id          UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  interaction_type    TEXT NOT NULL CHECK (interaction_type IN ('view','save','share','like','watched_percentage')),
  watch_duration      INT DEFAULT 0,
  watched_percentage  INT DEFAULT 0,
  time_spent          INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uci_user    ON user_content_interactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uci_content ON user_content_interactions (content_id);

-- ── 5. CONTENT_COLLECTIONS TABLE ───────────────────────────
CREATE TABLE IF NOT EXISTS content_collections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  cover_image_url   TEXT,
  category          TEXT,
  content_ids       JSONB DEFAULT '[]',
  difficulty_level  TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner','intermediate','advanced')),
  time_to_complete  INT DEFAULT 0,
  curation_type     TEXT DEFAULT 'ai_generated' CHECK (curation_type IN ('ai_generated','manual_curated')),
  view_count        INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cc_category   ON content_collections (category);
CREATE INDEX IF NOT EXISTS idx_cc_difficulty ON content_collections (difficulty_level);

-- ── 6. USER_CATEGORY_PREFERENCES TABLE ─────────────────────
CREATE TABLE IF NOT EXISTS user_category_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category          TEXT NOT NULL,
  preference_weight FLOAT DEFAULT 1.0,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_ucp_user ON user_category_preferences (user_id);

-- ── 7. CONTENT_RECOMMENDATIONS TABLE (CACHE) ───────────────
CREATE TABLE IF NOT EXISTS content_recommendations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_content_id  UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  recommendation_reason   TEXT,
  algorithm_score         FLOAT DEFAULT 0,
  rank_position           INT DEFAULT 0,
  generated_at            TIMESTAMPTZ DEFAULT NOW(),
  expires_at              TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '4 hours')
);

CREATE INDEX IF NOT EXISTS idx_crec_user     ON content_recommendations (user_id, rank_position);
CREATE INDEX IF NOT EXISTS idx_crec_expires  ON content_recommendations (expires_at);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE content_pieces         ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators               ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relationships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_collections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;

-- Content is world-readable
CREATE POLICY "content_pieces_readable" ON content_pieces FOR SELECT USING (true);
CREATE POLICY "creators_readable"       ON creators       FOR SELECT USING (true);
CREATE POLICY "relationships_readable"  ON content_relationships FOR SELECT USING (true);
CREATE POLICY "collections_readable"    ON content_collections FOR SELECT USING (true);

-- Users can only see their own data
CREATE POLICY "uci_user_isolation"  ON user_content_interactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "ucp_user_isolation"  ON user_category_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "crec_user_isolation" ON content_recommendations
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can write everything (for scraper)
CREATE POLICY "content_pieces_service_write" ON content_pieces
  FOR INSERT WITH CHECK (true);
CREATE POLICY "content_pieces_service_update" ON content_pieces
  FOR UPDATE USING (true);
CREATE POLICY "creators_service_write" ON creators
  FOR INSERT WITH CHECK (true);
CREATE POLICY "creators_service_update" ON creators
  FOR UPDATE USING (true);
CREATE POLICY "crec_service_write" ON content_recommendations
  FOR INSERT WITH CHECK (true);

-- ── HELPER FUNCTIONS ────────────────────────────────────────

-- Cleanup expired recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM content_recommendations WHERE expires_at < NOW();
$$;

-- Calculate and update quality score for a content piece
CREATE OR REPLACE FUNCTION refresh_quality_scores()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rec RECORD;
  view_count BIGINT;
  like_count BIGINT;
  comment_count BIGINT;
  engagement_rate FLOAT;
  days_old FLOAT;
  recency_score FLOAT;
  authority_score FLOAT;
  q_score FLOAT;
  v_score FLOAT;
BEGIN
  FOR rec IN SELECT * FROM content_pieces WHERE source_platform = 'youtube' LOOP
    view_count    := COALESCE((rec.content_metadata->>'view_count')::BIGINT, 0);
    like_count    := COALESCE((rec.content_metadata->>'like_count')::BIGINT, 0);
    comment_count := COALESCE((rec.content_metadata->>'comment_count')::BIGINT, 0);
    days_old := EXTRACT(EPOCH FROM (NOW() - rec.created_at)) / 86400;
    
    engagement_rate := CASE WHEN view_count > 0 THEN (like_count + comment_count)::FLOAT / view_count ELSE 0 END;
    recency_score   := GREATEST(0, (30 - days_old) / 30);
    
    -- Authority from creator if available
    SELECT COALESCE(authority_score, 0) INTO authority_score 
    FROM creators WHERE id = rec.creator_id;
    
    q_score := (engagement_rate * 100 * 0.4) + (COALESCE(authority_score, 50) * 0.35) + (recency_score * 100 * 0.25);
    v_score := (view_count::FLOAT / GREATEST(days_old, 1) / 1000 * 0.4) + (engagement_rate * 100 * 0.35) + (recency_score * 100 * 0.25);
    
    UPDATE content_pieces 
    SET quality_score = LEAST(q_score, 100),
        virality_score = LEAST(v_score, 100),
        engagement_rate = engagement_rate,
        updated_at = NOW()
    WHERE id = rec.id;
  END LOOP;
END;
$$;
