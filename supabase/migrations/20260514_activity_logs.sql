-- ============================================================
-- KIDEN HUB: ACTIVITY LOGS MIGRATION
-- Stores all user actions for the "Recent Activity" feed
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type      TEXT NOT NULL, -- e.g., 'upload', 'update_profile', 'add_to_library', 'follow_creator', 'create_note'
  target_name      TEXT,          -- e.g., 'DBMS Notes', 'Research Paper.pdf'
  target_type      TEXT,          -- e.g., 'file', 'note', 'creator', 'settings'
  metadata         JSONB DEFAULT '{}', -- Store extra details if needed
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by user and time
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time ON activity_logs (user_id, created_at DESC);

-- Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "activity_logs_user_isolation" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- System/Service role can insert (and users can too for client-side logging)
CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
