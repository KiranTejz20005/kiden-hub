import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Users, UserPlus, Mail, Crown, Edit3, Eye, 
  Trash2, Loader2, Check, X, Clock 
} from 'lucide-react';

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

interface WorkspaceCollaboratorsProps {
  workspaceId: string;
  workspaceOwnerId: string;
  isCollapsed?: boolean;
}

const roleConfig = {
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-500' },
  editor: { label: 'Editor', icon: Edit3, color: 'text-primary' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-muted-foreground' },
};

const WorkspaceCollaborators = ({ workspaceId, workspaceOwnerId, isCollapsed }: WorkspaceCollaboratorsProps) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);

  const isOwner = user?.id === workspaceOwnerId;

  const fetchMembers = async () => {
    if (!workspaceId) return;
    
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMembers((data as WorkspaceMember[]) || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    // Real-time subscription for member changes
    const channel = supabase
      .channel(`workspace-members-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${workspaceId}`
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const inviteMember = async () => {
    if (!user || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      // Check if user exists by email - we'll store email and user_id can be updated when they accept
      // For now, we need to look up the user by email
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Check if already a member
      const existingMember = members.find(m => m.email.toLowerCase() === inviteEmail.toLowerCase());
      if (existingMember) {
        toast.error('This person is already a member of this workspace');
        return;
      }

      // We need to find the user by their auth email
      // Since we can't directly query auth.users, we'll store the email and 
      // the invite will be "accepted" when that user logs in
      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id, // Temporary - will be updated when invite is accepted
          email: inviteEmail.toLowerCase().trim(),
          role: inviteRole,
          invited_by: user.id,
        });

      if (error) throw error;

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setDialogOpen(false);
      fetchMembers();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Member removed');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Role updated');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  if (isCollapsed) {
    return (
      <Button variant="ghost" size="icon" className="w-full" onClick={() => setDialogOpen(true)}>
        <Users className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          Collaborators
        </h3>
        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <UserPlus className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Invite Collaborator
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Address</label>
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'editor' | 'viewer')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4" />
                          Editor - Can edit notes
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Viewer - View only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={inviteMember} 
                  disabled={inviting || !inviteEmail.trim()} 
                  className="w-full gap-2"
                >
                  {inviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ScrollArea className="max-h-40">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No collaborators yet
          </p>
        ) : (
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {members.map((member) => {
                const RoleIcon = roleConfig[member.role].icon;
                const isPending = !member.accepted_at;
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 group"
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                      isPending ? "bg-muted" : "bg-primary/20"
                    )}>
                      {member.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{member.email}</p>
                      <div className="flex items-center gap-1">
                        <RoleIcon className={cn("w-3 h-3", roleConfig[member.role].color)} />
                        <span className="text-[10px] text-muted-foreground">
                          {roleConfig[member.role].label}
                        </span>
                        {isPending && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 ml-1">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isOwner && member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMember(member.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default WorkspaceCollaborators;
