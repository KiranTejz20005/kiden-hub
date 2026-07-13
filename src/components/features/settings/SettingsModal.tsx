import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  User, Building, Users, Settings as PrefsIcon, CreditCard,
  ArrowLeft, Camera, Check, Sun, Moon, Monitor,
  Loader2
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme, ModeType } from '@/components/providers/ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onProfileUpdate: () => void;
}

type SettingsTab = 'profile' | 'workspace' | 'members' | 'preferences' | 'billing';

export const SettingsModal = ({ isOpen, onClose, profile, onProfileUpdate }: SettingsModalProps) => {
  const { user } = useAuth();
  const { theme, setTheme, mode, setMode } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [autoCloseBrackets, setAutoCloseBrackets] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) {return;}
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user.id);
      
      if (error) {throw error;}
      toast.success('Profile updated');
      onProfileUpdate();
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">Profile</h2>
              <p className="text-text-secondary text-sm">Manage your personal information.</p>
            </div>

            <div className="flex items-center gap-6 py-2">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-bg-3 border border-border flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-medium text-text-tertiary">
                      {displayName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary border border-white/20 text-white shadow-xl hover:scale-110 transition-transform">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Profile picture</p>
                <p className="text-[11px] text-text-secondary">JPEG, PNG, WebP, or GIF. Max 5 MB.</p>
              </div>
            </div>


            <div className="space-y-8 max-w-lg">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Display Name</Label>
                <Input 
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); }}
                  placeholder="Your name"
                  className="h-11 rounded-xl bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary text-sm text-foreground placeholder:text-text-tertiary"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Email</Label>
                <Input 
                  value={user?.email || ''}
                  disabled
                  className="h-11 rounded-xl bg-secondary/50 border-none text-text-tertiary text-sm cursor-not-allowed"
                />
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="h-10 px-6 rounded-full bg-primary hover:opacity-90 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-950/10"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save changes'}
              </Button>
            </div>
          </div>

        );



      case 'workspace':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">Workspace</h2>
              <p className="text-text-secondary text-sm">Manage your workspace handle and settings.</p>
            </div>

            <div className="flex items-center gap-6 py-2">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-bg-3 border border-border flex items-center justify-center text-xl font-medium text-text-tertiary">
                  {displayName?.[0]?.toUpperCase() || 'K'}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary border border-white/20 text-white shadow-xl">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Workspace image</p>
                <p className="text-[11px] text-text-secondary">JPEG, PNG, WebP, or GIF. Max 5 MB.</p>
              </div>
            </div>

            <div className="space-y-8 max-w-lg">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Handle</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary font-medium text-sm">@</span>
                  <Input 
                    value={`${user?.email?.split('@')[0] || 'user'}-s-workspace`}
                    className="h-11 rounded-xl bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary pl-8 text-sm text-foreground transition-all"
                  />
                </div>
                <p className="text-[11px] text-primary font-medium flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                  @{user?.email?.split('@')[0] || 'user'}-s-workspace is available
                </p>
              </div>

              <Button className="h-10 px-6 rounded-full bg-primary hover:opacity-90 text-white font-bold text-xs transition-all shadow-lg">
                Save changes
              </Button>
            </div>
          </div>
        );


      case 'members':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">Members</h2>
              <p className="text-text-secondary text-sm">Manage who has access to this workspace.</p>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-secondary/20 border border-white/5 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Invite your team</h3>
                <p className="text-sm text-white/40">Collaborate on files, research boards, and AI chats together.</p>
              </div>
              
              <div className="flex gap-3">
                <Input 
                  placeholder="Enter email address..." 
                  className="h-12 rounded-2xl bg-black/40 border-white/5 focus-visible:ring-1 focus-visible:ring-primary text-sm text-white placeholder:text-white/20"
                />
                <Button className="h-12 px-6 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-xs transition-all shadow-xl shadow-white/5">
                  Send Invite
                </Button>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.1em]">Share workspace link coming soon</span>
              </div>
            </div>


            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">Members</h4>
                <span className="text-[10px] font-bold text-text-tertiary">1 MEMBER</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center text-sm font-bold text-text-tertiary uppercase">
                    {user?.email?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{user?.email}</p>
                      <span className="px-2 py-0.5 rounded-full bg-bg-3 text-[9px] font-bold text-text-tertiary">You</span>
                    </div>
                    <p className="text-[11px] text-text-tertiary">{user?.email} · owner</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">Pending invites</h4>
              <p className="text-xs text-text-tertiary italic">No pending invites.</p>
            </div>
          </div>
        );


      case 'preferences':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">Preferences</h2>
              <p className="text-text-secondary text-sm">Customize how Canvas looks and feels.</p>
            </div>

            <div className="space-y-10">
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">Appearance</h4>
                <div className="flex items-center justify-between pb-8 border-b border-border">
                  <div>
                    <p className="text-sm font-bold text-foreground">Interface Mode</p>
                    <p className="text-xs text-text-secondary mt-1">Choose between light and dark themes.</p>
                  </div>
                  <div className="flex items-center p-1 bg-bg-3 rounded-xl border border-border">
                    {[
                      { id: 'light', icon: Sun, label: 'Light' },
                      { id: 'dark', icon: Moon, label: 'Dark' },
                      { id: 'system', icon: Monitor, label: 'System' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setMode(t.id as ModeType); }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all",
                          mode === t.id ? "bg-background text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
                        )}
                      >
                        <t.icon className="w-3.5 h-3.5" /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">Workspace Brand</h4>
                <div className="space-y-4">
                  <p className="text-sm font-bold text-foreground">Accent Color</p>
                  <p className="text-xs text-text-secondary max-w-md">Customize the primary highlight color for your workspace.</p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'emerald', color: 'bg-emerald-500', label: 'Emerald' },
                      { id: 'sapphire', color: 'bg-blue-500', label: 'Sapphire' },
                      { id: 'amethyst', color: 'bg-purple-500', label: 'Amethyst' },
                      { id: 'ruby', color: 'bg-red-500', label: 'Ruby' },
                      { id: 'amber', color: 'bg-amber-500', label: 'Amber' },
                      { id: 'midnight', color: 'bg-slate-900', label: 'Midnight' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setTheme(t.id as any); }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                          theme === t.id 
                            ? "bg-primary/5 border-primary/20 shadow-sm" 
                            : "bg-bg-3 border-transparent hover:border-border"
                        )}
                      >
                        <div className={cn("w-3 h-3 rounded-full shadow-sm group-hover:scale-110 transition-transform", t.color)} />
                        <span className="text-[11px] font-bold text-text-secondary group-hover:text-foreground transition-colors">{t.label}</span>
                        {theme === t.id && <Check className="w-3 h-3 text-primary ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>



              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">Editor</h4>
                <div className="flex items-center justify-between">
                  <div className="max-w-md">
                    <p className="text-sm font-bold text-foreground">Auto-close brackets</p>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">Automatically insert closing brackets, parentheses, and curly braces when typing an opening one.</p>
                  </div>
                  <button 
                    onClick={() => { setAutoCloseBrackets(!autoCloseBrackets); }}
                    className={cn(
                      "w-10 h-5 rounded-full relative transition-all duration-300",
                      autoCloseBrackets ? "bg-primary" : "bg-bg-3"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300",
                      autoCloseBrackets ? "right-0.5" : "left-0.5"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );



      case 'billing':
        return (
          <div className="h-full flex flex-col items-center justify-center space-y-6 py-20 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-white/20" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">Billing & Subscription</h2>
              <p className="text-sm text-white/30">Billing module is coming soon in the next major update.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-500">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Under Construction
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden bg-background/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)]">
        <div className="flex h-full font-sans">
          {/* Sidebar */}
          <div className="w-64 bg-bg-2 border-r border-border p-6 flex flex-col">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors text-[11px] font-medium mb-10 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>

            <div className="space-y-1">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-5 ml-3">Settings</h3>
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'workspace', label: 'Workspace', icon: Building },
                { id: 'members', label: 'Members', icon: Users },
                { id: 'preferences', label: 'Preferences', icon: PrefsIcon },
                { id: 'billing', label: 'Billing', icon: CreditCard }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as SettingsTab); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                    activeTab === tab.id 
                      ? "bg-background text-foreground shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] border border-border" 
                      : "text-text-secondary hover:text-foreground hover:bg-white/[0.02]"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4 stroke-[1.5px]", activeTab === tab.id ? "text-foreground" : "text-text-tertiary")} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-12 lg:p-20 scrollbar-hide bg-background">
            <div className="max-w-2xl mx-auto text-foreground">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </DialogContent>

    </Dialog>
  );
};
