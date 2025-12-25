-- Enable realtime for ideas table
ALTER TABLE public.ideas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;