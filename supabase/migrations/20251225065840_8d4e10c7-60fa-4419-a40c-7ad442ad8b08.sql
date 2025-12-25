-- Create leetcode_problems table for tracking solved problems
CREATE TABLE public.leetcode_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  problem_number INTEGER,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT NOT NULL DEFAULT 'arrays',
  url TEXT,
  status TEXT NOT NULL DEFAULT 'solved' CHECK (status IN ('solved', 'attempted', 'todo', 'revisit')),
  notes TEXT,
  time_taken_minutes INTEGER,
  solved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leetcode_problems ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own problems"
ON public.leetcode_problems FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own problems"
ON public.leetcode_problems FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own problems"
ON public.leetcode_problems FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own problems"
ON public.leetcode_problems FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_leetcode_problems_updated_at
BEFORE UPDATE ON public.leetcode_problems
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leetcode_problems;