-- KIDEN HUB: STORAGE BUCKET FOR WORKSPACE ASSETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-assets', 'workspace-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for workspace-assets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'workspace-assets');

CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workspace-assets');

CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'workspace-assets' AND auth.uid() = owner);
