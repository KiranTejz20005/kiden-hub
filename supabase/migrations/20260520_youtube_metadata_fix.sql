-- Fix YouTube Library metadata
ALTER TABLE public.user_study_videos ADD COLUMN IF NOT EXISTS channel_avatar TEXT;
ALTER TABLE public.user_study_videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
