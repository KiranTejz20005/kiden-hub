-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create note_tags junction table
CREATE TABLE public.note_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id, tag_id)
);

-- Create note_links table for bidirectional linking
CREATE TABLE public.note_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_note_id, target_note_id)
);

-- Create media_extractions table for YouTube/PDF content
CREATE TABLE public.media_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('youtube', 'pdf', 'url', 'audio')),
  source_url TEXT,
  title TEXT,
  content TEXT,
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_extractions ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Note tags policies (based on note ownership)
CREATE POLICY "Users can view own note tags" ON public.note_tags FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can create own note tags" ON public.note_tags FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can delete own note tags" ON public.note_tags FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));

-- Note links policies
CREATE POLICY "Users can view own note links" ON public.note_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own note links" ON public.note_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own note links" ON public.note_links FOR DELETE USING (auth.uid() = user_id);

-- Media extractions policies
CREATE POLICY "Users can view own extractions" ON public.media_extractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own extractions" ON public.media_extractions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own extractions" ON public.media_extractions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own extractions" ON public.media_extractions FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at on media_extractions
CREATE TRIGGER update_media_extractions_updated_at
  BEFORE UPDATE ON public.media_extractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON public.note_tags(tag_id);
CREATE INDEX idx_note_links_source ON public.note_links(source_note_id);
CREATE INDEX idx_note_links_target ON public.note_links(target_note_id);
CREATE INDEX idx_media_extractions_user_id ON public.media_extractions(user_id);
CREATE INDEX idx_media_extractions_note_id ON public.media_extractions(note_id);