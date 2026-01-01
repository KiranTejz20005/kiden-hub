-- Create resolutions table for New Year resolutions tracking
CREATE TABLE public.resolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'personal' CHECK (category IN ('health', 'career', 'finance', 'personal', 'learning', 'relationships')),
  target_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resolution_history table for tracking progress updates
CREATE TABLE public.resolution_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resolution_id UUID NOT NULL REFERENCES public.resolutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL CHECK (progress >= 0 AND progress <= 100),
  previous_progress INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_history ENABLE ROW LEVEL SECURITY;

-- Resolutions policies
CREATE POLICY "Users can view their own resolutions"
ON public.resolutions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resolutions"
ON public.resolutions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resolutions"
ON public.resolutions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resolutions"
ON public.resolutions FOR DELETE
USING (auth.uid() = user_id);

-- Resolution history policies
CREATE POLICY "Users can view their own resolution history"
ON public.resolution_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resolution history"
ON public.resolution_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resolution history"
ON public.resolution_history FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on resolutions
CREATE TRIGGER update_resolutions_updated_at
BEFORE UPDATE ON public.resolutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_resolutions_user_id ON public.resolutions(user_id);
CREATE INDEX idx_resolutions_year ON public.resolutions(year);
CREATE INDEX idx_resolutions_status ON public.resolutions(status);
CREATE INDEX idx_resolution_history_resolution_id ON public.resolution_history(resolution_id);
CREATE INDEX idx_resolution_history_user_id ON public.resolution_history(user_id);
