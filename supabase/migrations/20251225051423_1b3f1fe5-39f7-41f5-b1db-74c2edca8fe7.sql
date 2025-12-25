-- First, drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view owned or member workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspace_members;

-- Create a security definer function to check workspace access without recursion
CREATE OR REPLACE FUNCTION public.user_has_workspace_access(workspace_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces WHERE id = workspace_uuid AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = workspace_uuid 
    AND user_id = auth.uid() 
    AND accepted_at IS NOT NULL
  );
$$;

-- Create a security definer function to check if user owns a workspace
CREATE OR REPLACE FUNCTION public.user_owns_workspace(workspace_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces WHERE id = workspace_uuid AND user_id = auth.uid()
  );
$$;

-- Update workspace_members SELECT policy to use security definer function
CREATE POLICY "Users can view workspace members"
ON public.workspace_members
FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.user_owns_workspace(workspace_id)
);