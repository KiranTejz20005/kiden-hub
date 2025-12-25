-- Create workspace members table for collaboration
CREATE TABLE public.workspace_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Policies for workspace_members
-- Members can view their own memberships
CREATE POLICY "Users can view workspaces they are members of"
ON public.workspace_members
FOR SELECT
USING (user_id = auth.uid() OR workspace_id IN (
    SELECT id FROM public.workspaces WHERE user_id = auth.uid()
));

-- Workspace owners can add members
CREATE POLICY "Workspace owners can add members"
ON public.workspace_members
FOR INSERT
WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid())
    OR user_id = auth.uid()
);

-- Workspace owners can remove members
CREATE POLICY "Workspace owners can remove members"
ON public.workspace_members
FOR DELETE
USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid())
    OR user_id = auth.uid()
);

-- Update policies for members to accept invites
CREATE POLICY "Users can accept their own invites"
ON public.workspace_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update workspaces RLS to allow members to view
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
CREATE POLICY "Users can view owned or member workspaces"
ON public.workspaces
FOR SELECT
USING (
    user_id = auth.uid() 
    OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND accepted_at IS NOT NULL)
);

-- Update notes RLS to allow workspace members to access
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view notes in accessible workspaces"
ON public.notes
FOR SELECT
USING (
    user_id = auth.uid()
    OR workspace_id IN (
        SELECT id FROM public.workspaces WHERE user_id = auth.uid()
        UNION
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND accepted_at IS NOT NULL
    )
);

-- Allow editors to insert notes
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
CREATE POLICY "Users can create notes in accessible workspaces"
ON public.notes
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    OR workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND accepted_at IS NOT NULL AND role IN ('owner', 'editor')
    )
);

-- Allow editors to update notes
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update notes in accessible workspaces"
ON public.notes
FOR UPDATE
USING (
    user_id = auth.uid()
    OR workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND accepted_at IS NOT NULL AND role IN ('owner', 'editor')
    )
);

-- Allow owners/editors to delete notes
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
CREATE POLICY "Users can delete notes in accessible workspaces"
ON public.notes
FOR DELETE
USING (
    user_id = auth.uid()
    OR workspace_id IN (
        SELECT workspace_id FROM public.workspace_members 
        WHERE user_id = auth.uid() AND accepted_at IS NOT NULL AND role IN ('owner', 'editor')
    )
);

-- Enable realtime for notes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;

-- Enable realtime for workspace_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;