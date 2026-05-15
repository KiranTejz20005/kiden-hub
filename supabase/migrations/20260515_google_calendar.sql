-- Google Calendar Integration Schema

-- 1. Table for storing user's Google OAuth connections
CREATE TABLE IF NOT EXISTS public.user_google_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, email)
);

-- 2. Table for calendars (a user can have multiple calendars in Google)
CREATE TABLE IF NOT EXISTS public.calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    google_calendar_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    sync_token TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, google_calendar_id)
);

-- 3. Table for calendar events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    calendar_id UUID REFERENCES public.calendars(id) ON DELETE CASCADE NOT NULL,
    google_event_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'confirmed',
    color TEXT,
    priority TEXT DEFAULT 'medium',
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    meeting_url TEXT,
    recurrence_rule TEXT,
    reminders JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(calendar_id, google_event_id)
);

-- 4. Enable RLS
ALTER TABLE public.user_google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can manage their own google connections"
    ON public.user_google_connections
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendars"
    ON public.calendars
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own calendar events"
    ON public.calendar_events
    FOR ALL
    USING (auth.uid() = user_id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id ON public.calendar_events(calendar_id);
