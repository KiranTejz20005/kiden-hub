import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  User, Settings, Camera, Loader2, Check, 
  Palette, Globe, Shield, Bell, Moon, Sun, 
  Building2, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useTheme, ThemeType } from '@/components/providers/ThemeProvider';
import { logActivity } from '@/services/activityService';

const THEMES: { id: ThemeType; name: string; label: string; color: string; preview: string }[] = [
  { id: 'emerald', name: 'Emerald Dark', label: 'Primary Brand', color: 'bg-emerald-500', preview: 'bg-emerald-500/10' },
  { id: 'sapphire', name: 'Sapphire Blue', label: 'Professional', color: 'bg-blue-500', preview: 'bg-blue-500/10' },
  { id: 'amethyst', name: 'Amethyst Purple', label: 'Creative', color: 'bg-purple-500', preview: 'bg-purple-500/10' },
  { id: 'ruby', name: 'Ruby Red', label: 'Energetic', color: 'bg-red-500', preview: 'bg-red-500/10' },
  { id: 'amber', name: 'Golden Amber', label: 'Productive', color: 'bg-amber-500', preview: 'bg-amber-500/10' },
  { id: 'midnight', name: 'Midnight Gray', label: 'Monochrome', color: 'bg-slate-400', preview: 'bg-slate-400/10' },
];

const Preferences = ({ onProfileUpdate }: { onProfileUpdate?: () => void }) => {
  const { user } = useAuth();
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [notifications, setNotifications] = useState({ email: true, desktop: true, mobile: true });
  const [workspaceName, setWorkspaceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const workspaceIconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setGithub(data.github_username || '');
        setTwitter(data.twitter_handle || '');
        if (data.notification_settings) {
          setNotifications(data.notification_settings);
        }
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  const handleProfileSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // First attempt: Update everything
      const { error: fullUpdateError } = await supabase
        .from('profiles')
        .update({ 
          display_name: displayName, 
          bio,
          github_username: github,
          twitter_handle: twitter,
          notification_settings: notifications
        })
        .eq('user_id', user.id);
      
      if (!fullUpdateError) {
        logActivity(user.id, 'update_profile', displayName || 'Profile', 'settings');
        toast.success('Profile updated');
        if (onProfileUpdate) onProfileUpdate();
        return;
      }

      // Second attempt: Fallback to core fields if extended fields fail
      console.warn('Full update failed, attempting core field update...', fullUpdateError);
      const { error: coreUpdateError } = await supabase
        .from('profiles')
        .update({ display_name: displayName, bio })
        .eq('user_id', user.id);

      if (coreUpdateError) throw coreUpdateError;
      
      toast.success('Core profile updated');
      toast.info('Social & Notification settings skipped (database migration required)');
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkspaceSave = async () => {
    if (!activeWorkspace) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ name: workspaceName })
        .eq('id', activeWorkspace.id);
      if (error) throw error;
      logActivity(user.id, 'update_settings', workspaceName, 'workspace');
      toast.success('Workspace updated');
      refreshWorkspaces();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Avatar updated');
      if (onProfileUpdate) onProfileUpdate();
    } catch (error) {
      console.error(error);
      toast.error('Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background p-6 lg:p-10 gap-8 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Preferences</h1>
        <p className="text-muted-foreground mt-1 text-sm">Customize your personal profile and workspace settings.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-secondary/30 p-1 rounded-xl h-11 border border-border/40">
          <TabsTrigger value="profile" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="workspace" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4" /> Workspace
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Palette className="w-4 h-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card/30 border-border/40 overflow-hidden shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Public Profile</CardTitle>
                <CardDescription>This information will be visible to other collaborators.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-primary flex items-center justify-center text-3xl font-black border-2 border-white/10 shadow-2xl overflow-hidden ring-4 ring-primary/10">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-3xl text-white text-[10px] font-bold uppercase tracking-widest gap-2"
                    >
                      <Camera className="w-6 h-6" />
                      Change
                    </button>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    {uploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-3xl">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-6 w-full">
                    <div className="grid gap-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input 
                        id="displayName" 
                        value={displayName} 
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Kiran Teja"
                        className="bg-secondary/20 border-border/40 h-11"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input 
                        id="bio" 
                        value={bio} 
                        onChange={e => setBio(e.target.value)}
                        placeholder="Developer, researcher, and coffee enthusiast."
                        className="bg-secondary/20 border-border/40 h-11"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>GitHub Username</Label>
                        <Input 
                          value={github} 
                          onChange={e => setGithub(e.target.value)} 
                          placeholder="@username" 
                          className="bg-secondary/20 border-border/40 h-11" 
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Twitter/X Handle</Label>
                        <Input 
                          value={twitter} 
                          onChange={e => setTwitter(e.target.value)} 
                          placeholder="@handle" 
                          className="bg-secondary/20 border-border/40 h-11" 
                        />
                      </div>
                    </div>
                    <Button onClick={handleProfileSave} disabled={saving} className="bg-primary hover:opacity-90 shadow-lg shadow-primary/20 px-8">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Save Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="w-24 h-24 text-primary" />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" /> Account Security
                    </CardTitle>
                    <CardDescription>Manage your authentication and security protocols.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Protected</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 rounded-2xl bg-[#050505] border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-xl">
                      <Globe className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none mb-1">Provider Authentication</p>
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Managed by Supabase Auth</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-medium text-gray-400 italic mb-2">Security settings are managed through your primary login provider.</p>
                    <Button variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-widest border-border/40 hover:bg-white/5" disabled>
                      Manage Externally
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card/30 border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
                <CardDescription>Control how and when you receive updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'email', title: 'Email Notifications', desc: 'Receive weekly summaries and workspace activity.' },
                  { id: 'desktop', title: 'Desktop Alerts', desc: 'Real-time push notifications for mentions and tasks.' },
                  { id: 'mobile', title: 'Mobile Push', desc: 'Stay updated on the go with mobile notifications.' },
                ].map((n) => (
                  <div 
                    key={n.id} 
                    className="flex items-center justify-between p-5 rounded-2xl bg-[#050505] border border-white/5 group hover:border-primary/20 transition-all shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{n.desc}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = { ...notifications, [n.id]: !notifications[n.id as keyof typeof notifications] };
                        setNotifications(updated);
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full relative p-1 transition-colors duration-300",
                        notifications[n.id as keyof typeof notifications] ? "bg-primary" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        initial={false}
                        animate={{ x: notifications[n.id as keyof typeof notifications] ? 24 : 0 }} 
                        className="w-4 h-4 bg-white rounded-full shadow-lg" 
                      />
                    </button>
                  </div>
                ))}
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleProfileSave} disabled={saving} className="bg-primary hover:opacity-90 shadow-lg shadow-primary/20 px-10">
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-6">
            <Card className="bg-card/30 border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Workspace Identity</CardTitle>
                <CardDescription>Settings for your current workspace: {activeWorkspace?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="wsName">Workspace Name</Label>
                  <Input 
                    id="wsName" 
                    value={workspaceName} 
                    onChange={e => setWorkspaceName(e.target.value)}
                    className="bg-secondary/20 border-border/40 h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Workspace Icon</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/40 text-xl">
                      {activeWorkspace?.icon || '🏢'}
                    </div>
                    <Button variant="outline" className="text-xs h-9 border-border/40 hover:bg-secondary/50">Change Icon</Button>
                  </div>
                </div>
                <Separator className="bg-border/20" />
                <Button onClick={handleWorkspaceSave} disabled={saving} className="bg-primary hover:opacity-90 shadow-lg shadow-primary/20 px-8">
                   Save Workspace
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-card/30 border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" /> Theme & Style
                </CardTitle>
                <CardDescription>Choose how Kiden Hub looks for you.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all text-left group",
                      theme === t.id ? "border-primary bg-primary/5" : "border-border/40 bg-secondary/10 hover:border-primary/20"
                    )}
                  >
                    <div className={cn("aspect-video rounded-lg border border-primary/20 overflow-hidden relative", t.preview)}>
                      <div className="h-4 w-full bg-primary/10 border-b border-primary/20 flex items-center px-2 gap-1">
                         <div className={cn("w-1.5 h-1.5 rounded-full", t.color)} />
                         <div className="w-8 h-1 bg-white/20 rounded-full" />
                      </div>
                      <div className="p-2 space-y-1">
                         <div className="w-full h-1 bg-white/5 rounded-full" />
                         <div className="w-2/3 h-1 bg-white/5 rounded-full" />
                      </div>
                      {theme === t.id && (
                        <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{t.label}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
};

export default Preferences;
