-- Create leetcode_problems table
CREATE TABLE IF NOT EXISTS public.leetcode_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  problem_number INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,
  url TEXT,
  status TEXT CHECK (status IN ('solved', 'attempted', 'todo', 'revisit')),
  notes TEXT,
  time_taken_minutes INTEGER,
  solved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leetcode_problems ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own problems" ON public.leetcode_problems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own problems" ON public.leetcode_problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own problems" ON public.leetcode_problems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own problems" ON public.leetcode_problems FOR DELETE USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_leetcode_updated_at BEFORE UPDATE ON public.leetcode_problems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_leetcode_user_id ON public.leetcode_problems(user_id);
