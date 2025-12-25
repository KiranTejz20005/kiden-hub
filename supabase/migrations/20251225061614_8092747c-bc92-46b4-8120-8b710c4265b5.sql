-- Update workspace_members policy to allow users to accept invites sent to their email
-- This allows updating the user_id when they first log in with the invited email
DROP POLICY IF EXISTS "Users can accept their own invites" ON public.workspace_members;
CREATE POLICY "Users can accept invites to their email" 
ON public.workspace_members 
FOR UPDATE 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR user_id = auth.uid()
);