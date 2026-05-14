-- KIDEN HUB: FEATURE ENHANCEMENTS MIGRATION
-- 1. Video Personalization (Notes & Favorites)
ALTER TABLE user_study_videos ADD COLUMN IF NOT EXISTS personal_notes TEXT;
ALTER TABLE user_study_videos ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- 2. Boards Renaming (Research Boards -> My Boards)
-- No table rename needed as 'research_boards' is already generic, 
-- but we can add meta if needed. The prompt mostly asks for UI rename.

-- 3. Collaborators Enhancement
-- Ensure collaborators table exists and has proper fields
CREATE TABLE IF NOT EXISTS workspace_collaborators (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL, -- Logical grouping if needed
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'revoked')),
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for workspace_collaborators
ALTER TABLE workspace_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collaborators_isolation" ON workspace_collaborators FOR ALL USING (auth.uid() = user_id OR status = 'pending');

-- 4. User Preferences Storage
-- Ensure user_profiles has preference fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'emerald';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_density TEXT DEFAULT 'comfortable';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
