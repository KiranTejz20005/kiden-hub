import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Settings, Camera, User, Wifi, WifiOff, Moon, 
  Loader2, Check, X, Shield, Palette, Bell, Users,
  Globe, Layout, Mail, UserPlus, Trash2, ShieldAlert
} from 'lucide-react';
import Preferences from '../features/settings/Preferences';
import Collaborators from '../features/team/Collaborators';

type UserStatus = 'online' | 'away' | 'dnd' | 'offline';
type SettingsTab = 'profile' | 'preferences' | 'collaborators' | 'security';

interface SettingsPanelProps {
  profile: Profile | null;
  onProfileUpdate: () => void;
  isCollapsed?: boolean;
}

const statusOptions: { value: UserStatus; label: string; icon: typeof Wifi; color: string }[] = [
  { value: 'online', label: 'Online', icon: Wifi, color: 'bg-green-500' },
  { value: 'away', label: 'Away', icon: Moon, color: 'bg-amber-500' },
  { value: 'dnd', label: 'Do Not Disturb', icon: X, color: 'bg-red-500' },
  { value: 'offline', label: 'Offline', icon: WifiOff, color: 'bg-muted-foreground' },
];

const SettingsPanel = ({ profile, onProfileUpdate, isCollapsed }: SettingsPanelProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [status, setStatus] = useState<UserStatus>((profile as any)?.status || 'online');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setStatus((profile as any)?.status || 'online');
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      toast.success('Avatar updated!');
      onProfileUpdate();
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: displayName,
        bio: bio,
        status: status,
      }).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profile updated!');
      onProfileUpdate();
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'collaborators', label: 'Collaborators', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-2xl transition-all active:scale-90"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#050505] border-l border-white/5 p-0 flex flex-col shadow-2xl">
        <SheetHeader className="p-8 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Settings className="w-4 h-4" />
            </div>
            <SheetTitle className="text-xl font-bold uppercase tracking-wider text-white">Workspace Settings</SheetTitle>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">Manage your personal profile, workspace preferences, and collaborators.</p>
        </SheetHeader>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-6 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                activeTab === tab.id 
                  ? "bg-white text-black shadow-lg" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div 
                key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-6 p-8 rounded-[2rem] bg-white/5 border border-white/5 shadow-inner">
                  <div className="relative group">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center ring-4 ring-white/5 shadow-2xl overflow-hidden relative"
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-black text-primary">{displayName?.[0]?.toUpperCase() || '?'}</span>
                      )}
                      
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      )}
                    </motion.div>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-[#050505]"
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-white">{displayName || 'Anonymous Explorer'}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Personal Identity</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Display Name</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="How should we call you?"
                      className="h-12 bg-white/5 border-white/5 rounded-2xl text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">About You (Bio)</Label>
                    <Input
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Your expertise, mission, or status..."
                      className="h-12 bg-white/5 border-white/5 rounded-2xl text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Status</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setStatus(option.value)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                            status === option.value 
                              ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5" 
                              : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"
                          )}
                        >
                          <div className={cn("w-2.5 h-2.5 rounded-full", option.color)} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">{option.label}</span>
                          {status === option.value && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-bold uppercase tracking-wider shadow-xl transition-all active:scale-[0.98]"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile Changes'}
                </Button>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div 
                key="preferences" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              >
                <Preferences isEmbedded={true} />
              </motion.div>
            )}

            {activeTab === 'collaborators' && (
              <motion.div 
                key="collaborators" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              >
                <Collaborators isEmbedded={true} />
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div 
                key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/10 space-y-6">
                  <div className="flex items-center gap-4 text-red-500">
                    <ShieldAlert className="w-6 h-6" />
                    <h3 className="font-black uppercase tracking-widest">Account Security</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Manage your authentication methods and session security. Kiden Intelligence ensures your research data is protected with enterprise-grade encryption.
                  </p>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-[10px]">
                    Change Security Credentials
                  </Button>
                </div>
                
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 space-y-6">
                  <h3 className="font-black uppercase tracking-widest text-white flex items-center gap-3">
                    <Mail className="w-4 h-4" /> Connected Accounts
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-white">Google Cloud</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Connected</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
