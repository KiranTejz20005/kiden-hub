import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Users, UserPlus, Mail, Shield, ShieldCheck, 
  Trash2, Loader2, Search, MoreVertical, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/hooks/useWorkspace';

interface Member {
  id: string;
  email: string;
  role: 'owner' | 'member';
  accepted_at: string | null;
  display_name?: string;
  avatar_url?: string;
  user_id: string;
}

const Collaborators = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      // Get workspace members
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          email,
          role,
          accepted_at
        `)
        .eq('workspace_id', activeWorkspace.id);

      if (memberError) throw memberError;

      // For each member, try to fetch their profile details
      const membersWithProfiles = await Promise.all((memberData || []).map(async (m) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', m.user_id)
          .maybeSingle();
        
        return {
          ...m,
          display_name: profile?.display_name || m.email.split('@')[0],
          avatar_url: profile?.avatar_url,
          role: m.role as 'owner' | 'member'
        };
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeWorkspace?.id]);

  const handleInvite = async () => {
    if (!activeWorkspace || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      // Check if user already in workspace
      if (members.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
        toast.error('User is already a member of this workspace');
        return;
      }

      // Add to workspace_members
      const { error } = await supabase
        .from('workspace_members')
        .insert([{
          workspace_id: activeWorkspace.id,
          email: inviteEmail.trim().toLowerCase(),
          role: 'member',
          invited_by: user?.id,
          invited_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Invitation sent!');
      setInviteEmail('');
      setShowInviteModal(false);
      fetchMembers();
    } catch (error: any) {
      console.error('Invite error:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'owner' | 'member') => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      toast.success(`Member role updated to ${newRole}`);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (error) {
      console.error('Update role error:', error);
      toast.error('Failed to update role');
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
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove member');
    }
  };

  const filteredMembers = members.filter(m => 
    m.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background p-6 lg:p-10 gap-8 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Collaborators</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage who has access to your workspace and assets.</p>
        </div>
        
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowInviteModal(true)} className="gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
              <UserPlus className="w-4 h-4" /> Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite to Workspace</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Enter the email address of the person you want to invite.</p>
                <Input 
                  placeholder="name@example.com" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.includes('@')}>
                {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search members by name or email..." 
            className="pl-10 bg-secondary/20 border-border/40 max-w-md h-11 rounded-xl"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-card/30 border border-border/40 rounded-[2.5rem] overflow-hidden flex flex-col flex-1 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/10">
            <div className="col-span-6 lg:col-span-5">Member</div>
            <div className="col-span-3 lg:col-span-3">Role</div>
            <div className="col-span-2 lg:col-span-3">Status</div>
            <div className="col-span-1 lg:col-span-1 text-right">Action</div>
          </div>

          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/20">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm text-muted-foreground">Loading members...</p>
                </div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={member.id} 
                    className="grid grid-cols-12 gap-4 px-8 py-5 items-center group hover:bg-secondary/20 transition-all"
                  >
                    <div className="col-span-6 lg:col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold border border-white/10 shadow-md overflow-hidden shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{member.display_name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{member.display_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="col-span-3 lg:col-span-3">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        member.role === 'owner' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {member.role === 'owner' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {member.role}
                      </div>
                    </div>

                    <div className="col-span-2 lg:col-span-3">
                      {member.accepted_at ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                          <Check className="w-3.5 h-3.5" /> Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-500 font-medium">
                           Pending
                        </div>
                      )}
                    </div>

                    <div className="col-span-1 lg:col-span-1 text-right">
                      {member.user_id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateMemberRole(member.id, member.role === 'owner' ? 'member' : 'owner')}>
                              <Shield className="w-4 h-4 mr-2" /> 
                              {member.role === 'owner' ? 'Demote to Member' : 'Promote to Owner'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => removeMember(member.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold">No members found</h3>
                    <p className="text-xs text-muted-foreground max-w-[200px] mt-1">Try a different search or invite someone new.</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Collaborators;
