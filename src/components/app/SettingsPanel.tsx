import { useState, useRef } from 'react';
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
  Loader2, Check, X
} from 'lucide-react';

type UserStatus = 'online' | 'away' | 'dnd' | 'offline';

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
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [status, setStatus] = useState<UserStatus>((profile as any)?.status || 'online');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Avatar updated!');
      onProfileUpdate();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
          status: status,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated!');
      onProfileUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!user) return;
    setStatus(newStatus);

    try {
      await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', user.id);
      
      onProfileUpdate();
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Settings
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center ring-4 ring-primary/20 shadow-xl overflow-hidden"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {displayName?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </motion.div>
              
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="w-4 h-4" />
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">Click camera to upload photo</p>
          </div>

          <Separator />

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="bg-secondary/50"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="bg-secondary/50"
            />
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-3">
            <Label>Status</Label>
            <RadioGroup value={status} onValueChange={(v) => handleStatusChange(v as UserStatus)}>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <motion.label
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      status === option.value 
                        ? "border-primary bg-primary/10" 
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                    )}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                    <div className={cn("w-3 h-3 rounded-full", option.color)} />
                    <span className="text-sm font-medium">{option.label}</span>
                    {status === option.value && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </motion.label>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="w-full gap-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
