-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS github_username text,
ADD COLUMN IF NOT EXISTS twitter_handle text,
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'emerald',
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"email": true, "desktop": true, "mobile": true}'::jsonb;
