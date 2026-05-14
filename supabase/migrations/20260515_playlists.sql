-- CORE LIBRARY TABLE
CREATE TABLE IF NOT EXISTS user_study_videos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id       TEXT NOT NULL,
  title          TEXT NOT NULL,
  channel_name   TEXT,
  thumbnail_url  TEXT,
  video_url      TEXT,
  duration       INT,
  view_count     BIGINT,
  position       INT DEFAULT 0,
  subject_tag    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- KIDEN HUB: PLAYLISTS & COLLECTIONS
CREATE TABLE IF NOT EXISTS user_playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table to allow a video to be in multiple playlists
CREATE TABLE IF NOT EXISTS playlist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id  UUID REFERENCES user_playlists(id) ON DELETE CASCADE,
  video_id     UUID REFERENCES user_study_videos(id) ON DELETE CASCADE,
  position     INT DEFAULT 0,
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, video_id)
);

-- Enable RLS
ALTER TABLE user_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items   ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "playlists_user_isolation" ON user_playlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "items_user_isolation"     ON playlist_items   FOR ALL USING (
  EXISTS (SELECT 1 FROM user_playlists WHERE id = playlist_id AND user_id = auth.uid())
);

-- Add 'All Videos' as a default playlist for every user? 
-- Better handled in the UI by showing everything in user_study_videos as "Uncategorized" or "All".
