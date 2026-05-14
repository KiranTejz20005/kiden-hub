-- Fix notes content column type to jsonb if it is text
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notes' 
        AND column_name = 'content' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.notes ALTER COLUMN content TYPE jsonb USING content::jsonb;
    END IF;
END $$;

-- Ensure profiles table has correct permissions and handle potential 406 by ensuring rows exist
-- The 406 might also be due to RLS or missing columns.
-- Let's ensure 'full_name' and other fields exist.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Add a trigger to auto-create profiles on auth.users insert if it doesn't exist
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, user_id, display_name)
    VALUES (new.id, new.id, new.raw_user_meta_data->>'display_name')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_ensure ON auth.users;
CREATE TRIGGER on_auth_user_created_ensure
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_exists();
