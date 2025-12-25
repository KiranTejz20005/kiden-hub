-- Update workspaces policy to allow members to view workspaces they're invited to
DROP POLICY IF EXISTS "Users can view own workspaces" ON public.workspaces;
CREATE POLICY "Users can view accessible workspaces" 
ON public.workspaces 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
  )
);

-- Update collections policy to allow workspace members to view collections
DROP POLICY IF EXISTS "Users can view own collections" ON public.collections;
CREATE POLICY "Users can view collections in accessible workspaces" 
ON public.collections 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
  )
);

-- Allow editors to create collections in workspaces they have access to
DROP POLICY IF EXISTS "Users can create own collections" ON public.collections;
CREATE POLICY "Users can create collections in accessible workspaces" 
ON public.collections 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND accepted_at IS NOT NULL 
    AND role IN ('owner', 'editor')
  )
);

-- Allow editors to update collections in workspaces they have access to
DROP POLICY IF EXISTS "Users can update own collections" ON public.collections;
CREATE POLICY "Users can update collections in accessible workspaces" 
ON public.collections 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND accepted_at IS NOT NULL 
    AND role IN ('owner', 'editor')
  )
);

-- Allow editors to delete collections in workspaces they have access to
DROP POLICY IF EXISTS "Users can delete own collections" ON public.collections;
CREATE POLICY "Users can delete collections in accessible workspaces" 
ON public.collections 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND accepted_at IS NOT NULL 
    AND role IN ('owner', 'editor')
  )
);