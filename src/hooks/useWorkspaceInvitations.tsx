import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useWorkspaceInvitations = () => {
  const { user } = useAuth();

  const acceptPendingInvitations = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Find any pending invitations for this user's email
      const { data: pendingInvites, error: fetchError } = await supabase
        .from('workspace_members')
        .select('id, workspace_id, email, role')
        .eq('email', user.email.toLowerCase())
        .is('accepted_at', null);

      if (fetchError) {
        console.error('Error fetching pending invitations:', fetchError);
        return;
      }

      if (!pendingInvites || pendingInvites.length === 0) return;

      // Accept all pending invitations
      for (const invite of pendingInvites) {
        const { error: updateError } = await supabase
          .from('workspace_members')
          .update({ 
            user_id: user.id,
            accepted_at: new Date().toISOString() 
          })
          .eq('id', invite.id);

        if (updateError) {
          console.error('Error accepting invitation:', updateError);
        } else {
          // Get workspace name for the notification
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('name, icon')
            .eq('id', invite.workspace_id)
            .single();

          if (workspace) {
            toast.success(
              `You've joined "${workspace.icon} ${workspace.name}" workspace!`,
              {
                description: `You now have ${invite.role} access to this workspace.`,
                duration: 5000,
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error processing workspace invitations:', error);
    }
  }, [user]);

  // Check for pending invitations when user logs in
  useEffect(() => {
    if (user) {
      // Small delay to ensure auth is fully processed
      const timeout = setTimeout(() => {
        acceptPendingInvitations();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [user, acceptPendingInvitations]);

  return { acceptPendingInvitations };
};

export default useWorkspaceInvitations;