-- KIDEN HUB: AUTOMATED INDEXING PIPELINE
-- This SQL sets up webhooks to call the generate-embedding function automatically.

-- 1. Helper function to call the edge function
CREATE OR REPLACE FUNCTION public.handle_embedding_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- We use net.http_post to call the edge function
  -- Note: This requires the "pgnet" extension which is enabled by default in Supabase
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/generate-embedding',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || auth.jwt() -- Or use a service role key if needed
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'table', TG_TABLE_NAME
      ),
      timeout_milliseconds := 5000
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Triggers for all knowledge tables
DROP TRIGGER IF EXISTS on_note_created_embedding ON public.notes;
CREATE TRIGGER on_note_created_embedding
  AFTER INSERT OR UPDATE OF title, content ON public.notes
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL) -- Only if not already embedded
  EXECUTE FUNCTION public.handle_embedding_trigger();

DROP TRIGGER IF EXISTS on_extraction_created_embedding ON public.media_extractions;
CREATE TRIGGER on_extraction_created_embedding
  AFTER INSERT ON public.media_extractions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_embedding_trigger();

DROP TRIGGER IF EXISTS on_content_created_embedding ON public.content_pieces;
CREATE TRIGGER on_content_created_embedding
  AFTER INSERT ON public.content_pieces
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL)
  EXECUTE FUNCTION public.handle_embedding_trigger();
