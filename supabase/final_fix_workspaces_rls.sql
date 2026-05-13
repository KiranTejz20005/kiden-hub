-- FINAL WORKSPACES RLS FIX
-- Run this in the Supabase SQL Editor

-- 1. DROP ALL OLD POLICIES TO START FRESH
DROP POLICY IF EXISTS "Users can view owned or member workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can insert own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON public.workspaces;

-- 2. ENABLE RLS (just in case)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 3. CREATE SIMPLE, ROBUST POLICIES

-- INSERT: Only allow users to insert rows where user_id matches their own ID
-- Use (auth.uid())::uuid to ensure type safety with the user_id column
CREATE POLICY "allow_insert_own_workspaces" ON public.workspaces
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (auth.uid())::uuid = user_id
);

-- SELECT: Allow users to view workspaces they own OR are members of
-- We use a simple OR check instead of complex nested functions to avoid recursion/timeout issues
CREATE POLICY "allow_select_accessible_workspaces" ON public.workspaces
FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        (auth.uid())::uuid = user_id OR
        id IN (
            SELECT workspace_id FROM public.workspace_members 
            WHERE user_id = (auth.uid())::uuid AND accepted_at IS NOT NULL
        )
    )
);

-- UPDATE: Only owners can update
CREATE POLICY "allow_update_own_workspaces" ON public.workspaces
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (auth.uid())::uuid = user_id
) WITH CHECK (
    auth.uid() IS NOT NULL AND (auth.uid())::uuid = user_id
);

-- DELETE: Only owners can delete
CREATE POLICY "allow_delete_own_workspaces" ON public.workspaces
FOR DELETE USING (
    auth.uid() IS NOT NULL AND (auth.uid())::uuid = user_id
);

-- 4. FIX WORKSPACE_MEMBERS (to ensure the join works correctly)
DROP POLICY IF EXISTS "Workspace owners can add members" ON public.workspace_members;
CREATE POLICY "allow_insert_workspace_members" ON public.workspace_members
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
        user_id = (auth.uid())::uuid OR 
        EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND user_id = (auth.uid())::uuid)
    )
);
