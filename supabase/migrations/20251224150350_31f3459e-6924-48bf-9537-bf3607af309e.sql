-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  focus_settings JSONB DEFAULT '{"workDuration": 25, "shortBreakDuration": 5, "longBreakDuration": 15, "sessionsBeforeLongBreak": 4}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📂',
  color TEXT DEFAULT '#10B981',
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table (like Notion pages)
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB DEFAULT '[]'::jsonb,
  icon TEXT DEFAULT '📝',
  cover_image TEXT,
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  is_archived BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ideas table (quick capture like Neural Backlog)
CREATE TABLE public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'neural' CHECK (category IN ('neural', 'creative', 'logic', 'project')),
  is_processed BOOLEAN DEFAULT false,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create focus sessions table (Pomodoro tracking)
CREATE TABLE public.focus_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'work' CHECK (session_type IN ('work', 'short_break', 'long_break', 'flow')),
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create AI chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'project' CHECK (category IN ('project', 'task', 'kanban', 'goal', 'sprint', 'custom')),
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  icon TEXT DEFAULT '📋',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workspaces policies
CREATE POLICY "Users can view own workspaces" ON public.workspaces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workspaces" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workspaces" ON public.workspaces FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workspaces" ON public.workspaces FOR DELETE USING (auth.uid() = user_id);

-- Collections policies
CREATE POLICY "Users can view own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Ideas policies
CREATE POLICY "Users can view own ideas" ON public.ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ideas" ON public.ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON public.ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON public.ideas FOR DELETE USING (auth.uid() = user_id);

-- Focus sessions policies
CREATE POLICY "Users can view own focus sessions" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own focus sessions" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON public.focus_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus sessions" ON public.focus_sessions FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Templates policies (users can view system templates + own templates)
CREATE POLICY "Users can view templates" ON public.templates FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON public.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.templates FOR UPDATE USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can delete own templates" ON public.templates FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  
  -- Create default workspace for new user
  INSERT INTO public.workspaces (user_id, name, icon)
  VALUES (new.id, 'My Workspace', '🏠');
  
  RETURN new;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system templates
INSERT INTO public.templates (name, description, category, icon, is_system, content) VALUES
('Project Plan', 'Comprehensive project planning template', 'project', '📋', true, '[{"type": "heading", "content": "Project Overview"}, {"type": "paragraph", "content": "Describe your project goals and objectives here."}, {"type": "heading", "content": "Tasks"}, {"type": "todo", "items": [{"text": "Define scope", "done": false}, {"text": "Set milestones", "done": false}, {"text": "Assign resources", "done": false}]}, {"type": "heading", "content": "Timeline"}, {"type": "paragraph", "content": "Add your project timeline here."}]'),
('Kanban Board', 'Visual task management board', 'kanban', '📊', true, '[{"type": "kanban", "columns": [{"name": "To Do", "items": []}, {"name": "In Progress", "items": []}, {"name": "Done", "items": []}]}]'),
('Sprint Planning', 'Agile sprint planning template', 'sprint', '🏃', true, '[{"type": "heading", "content": "Sprint Goals"}, {"type": "paragraph", "content": "What we aim to achieve this sprint."}, {"type": "heading", "content": "User Stories"}, {"type": "todo", "items": []}, {"type": "heading", "content": "Sprint Retrospective"}, {"type": "paragraph", "content": "What went well? What can be improved?"}]'),
('Goal Tracker', 'Track your goals and progress', 'goal', '🎯', true, '[{"type": "heading", "content": "Goal Statement"}, {"type": "paragraph", "content": "Define your goal clearly."}, {"type": "heading", "content": "Key Results"}, {"type": "todo", "items": [{"text": "Key Result 1", "done": false}, {"text": "Key Result 2", "done": false}, {"text": "Key Result 3", "done": false}]}, {"type": "heading", "content": "Progress Notes"}, {"type": "paragraph", "content": "Track your progress here."}]'),
('Task List', 'Simple task management', 'task', '✅', true, '[{"type": "heading", "content": "Tasks"}, {"type": "todo", "items": [{"text": "Task 1", "done": false}, {"text": "Task 2", "done": false}]}, {"type": "heading", "content": "Notes"}, {"type": "paragraph", "content": "Additional notes here."}]');