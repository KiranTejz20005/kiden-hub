import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Users, UserPlus, Mail, Shield, ShieldCheck, 
  Trash2, Loader2, Search, MoreVertical, Check,
  X, User as UserIcon, ShieldAlert, ArrowRight,
  Eye, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/hooks/useWorkspace';

interface Member {
  id: string;
  email: string;
  role: 'owner' | 'member' | 'viewer';
  accepted_at: string | null;
  display_name?: string;
  avatar_url?: string;
  user_id: string | null;
}

const Collaborators = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', activeWorkspace.id);

      if (memberError) throw memberError;

      const membersWithProfiles = await Promise.all((memberData || []).map(async (m) => {
        if (m.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', m.user_id)
            .maybeSingle();
          
          return {
            ...m,
            display_name: profile?.display_name || m.email.split('@')[0],
            avatar_url: profile?.avatar_url,
          };
        }
        return {
          ...m,
          display_name: m.email.split('@')[0],
        };
      }));

      setMembers(membersWithProfiles as Member[]);
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
      if (members.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
        toast.error('User is already a member');
        return;
      }

      const { error } = await supabase
        .from('workspace_members')
        .insert([{
          workspace_id: activeWorkspace.id,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('Invitation sent successfully');
      setInviteEmail('');
      setShowInviteModal(false);
      fetchMembers();
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Collaborator removed');
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (error) {
      toast.error('Failed to remove collaborator');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'member' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast.success(`Role updated to ${newRole}`);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const filteredMembers = members.filter(m => 
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const content = (
    <div className={cn("flex flex-col gap-6", !isEmbedded && "p-8 max-w-5xl mx-auto")}>
      {!isEmbedded && (
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Collaborators</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your team and workspace permissions</p>
          </div>
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="rounded-2xl bg-white text-black hover:bg-white/90 font-black px-8"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      )}

      {isEmbedded && (
        <div className="flex flex-col gap-4">
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="w-full h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[10px]"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite New Collaborator
          </Button>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-12 h-12 bg-white/5 border-white/5 rounded-2xl text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest">Syncing Team Data...</span>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="grid gap-3">
            {filteredMembers.map((member) => (
              <motion.div 
                layout key={member.id}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-white/5 shadow-xl overflow-hidden">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-primary/40" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">{member.display_name}</h4>
                      {member.role === 'owner' && (
                        <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">Owner</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5">
                          {member.role} <ChevronDown className="w-3 h-3 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10 rounded-xl">
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'member')} className="text-xs font-bold focus:bg-white/5">Member (Full Access)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'viewer')} className="text-xs font-bold focus:bg-white/5">Viewer (Read Only)</DropdownMenuItem>
                        <Separator className="my-1 opacity-50" />
                        <DropdownMenuItem onClick={() => handleRemove(member.id)} className="text-xs font-bold text-red-500 focus:bg-red-500/10">Remove From Team</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {member.role === 'owner' && (
                    <div className="px-4 py-2 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                      Full Access
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/5">
            <Users className="w-12 h-12 text-white/5" />
            <div>
              <p className="font-black text-white uppercase tracking-widest text-xs">No collaborators found</p>
              <p className="text-[10px] text-muted-foreground mt-1">Start by inviting your first team member.</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Invite Collaborator
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input 
                  placeholder="name@example.com"
                  className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-sm"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setInviteRole('member')}
                  className={cn(
                    "flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all",
                    inviteRole === 'member' ? "bg-emerald-500/10 border-emerald-500/30 text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  <ShieldCheck className={cn("w-4 h-4", inviteRole === 'member' ? "text-emerald-400" : "text-muted-foreground")} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Member</span>
                  <p className="text-[9px] opacity-60">Can edit and manage resources.</p>
                </button>
                <button 
                  onClick={() => setInviteRole('viewer')}
                  className={cn(
                    "flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all",
                    inviteRole === 'viewer' ? "bg-primary/10 border-primary/30 text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  <Eye className={cn("w-4 h-4", inviteRole === 'viewer' ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Viewer</span>
                  <p className="text-[9px] opacity-60">Read-only access to boards.</p>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteModal(false)} className="rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button 
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[10px] shadow-xl"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return content;
};

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

export default Collaborators;
