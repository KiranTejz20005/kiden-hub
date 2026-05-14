import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Palette, Globe, Bell, Moon, Sun, 
  Layout, Monitor, Smartphone, Mail,
  Check, Loader2, Sparkles, Zap, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme, ThemeType } from '@/components/providers/ThemeProvider';

const THEMES: { id: ThemeType; name: string; label: string; color: string; preview: string }[] = [
  { id: 'emerald', name: 'Emerald', label: 'Primary Brand', color: 'bg-emerald-500', preview: 'bg-emerald-500/10' },
  { id: 'sapphire', name: 'Sapphire', label: 'Professional', color: 'bg-blue-500', preview: 'bg-blue-500/10' },
  { id: 'amethyst', name: 'Amethyst', label: 'Creative', color: 'bg-purple-500', preview: 'bg-purple-500/10' },
  { id: 'ruby', name: 'Ruby', label: 'Energetic', color: 'bg-red-500', preview: 'bg-red-500/10' },
  { id: 'amber', name: 'Amber', label: 'Productive', color: 'bg-amber-500', preview: 'bg-amber-500/10' },
];

const Preferences = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({ email: true, desktop: true, mobile: true });
  const [language, setLanguage] = useState('en');
  const [density, setDensity] = useState('comfortable');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('notification_settings, language, display_density').eq('user_id', user.id).maybeSingle();
      if (data) {
        if (data.notification_settings) setNotifications(data.notification_settings);
        if (data.language) setLanguage(data.language);
        if (data.display_density) setDensity(data.display_density);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async (updates: any) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      
      if (error) throw error;
      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    const newVal = !notifications[key];
    const updated = { ...notifications, [key]: newVal };
    setNotifications(updated);
    handleSave({ notification_settings: updated });
  };

  return (
    <div className={cn("space-y-10", !isEmbedded && "p-8 max-w-4xl mx-auto")}>
      {!isEmbedded && (
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Preferences</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize your Kiden Hub workspace experience</p>
        </div>
      )}

      {/* Visual System */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-emerald-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Visual System</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "group relative flex flex-col gap-3 p-5 rounded-2xl border transition-all text-left overflow-hidden",
                theme === t.id 
                  ? "bg-white/5 border-emerald-500 shadow-xl shadow-emerald-500/10" 
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("w-3 h-3 rounded-full", t.color)} />
                {theme === t.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div>
                <p className="text-sm font-black text-white">{t.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{t.label}</p>
              </div>
              <div className={cn("absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity", t.color)} />
            </button>
          ))}
        </div>
      </section>

      {/* Display Density */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Layout className="w-5 h-5 text-blue-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Interface Density</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'comfortable', label: 'Comfortable', icon: Monitor, desc: 'Spacious layout with rich visuals' },
            { id: 'compact', label: 'Compact', icon: Zap, desc: 'Maximized information density' }
          ].map(d => (
            <button
              key={d.id}
              onClick={() => { setDensity(d.id); handleSave({ display_density: d.id }); }}
              className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border transition-all text-left",
                density === d.id ? "bg-white/5 border-blue-500 shadow-lg" : "bg-white/5 border-white/5 hover:bg-white/10"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <d.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white">{d.label}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{d.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Global Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email Reports', icon: Mail, desc: 'Daily intelligence summaries via email' },
            { key: 'desktop', label: 'Desktop Alerts', icon: Monitor, desc: 'Push notifications for active research' },
            { key: 'mobile', label: 'Mobile Sync', icon: Smartphone, desc: 'Instant updates on your mobile devices' }
          ].map(n => (
            <button
              key={n.key}
              onClick={() => toggleNotification(n.key as any)}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <n.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white">{n.label}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">{n.desc}</p>
                </div>
              </div>
              <div className={cn(
                "w-12 h-6 rounded-full relative transition-colors",
                notifications[n.key as keyof typeof notifications] ? "bg-emerald-500" : "bg-white/10"
              )}>
                <motion.div 
                  animate={{ x: notifications[n.key as keyof typeof notifications] ? 24 : 4 }}
                  className="w-4 h-4 rounded-full bg-white absolute top-1 shadow-lg"
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Language */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-teal-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Regional Settings</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['English', 'Spanish', 'French', 'German', 'Japanese', 'Hindi'].map(lang => (
            <button
              key={lang}
              onClick={() => { const l = lang.slice(0, 2).toLowerCase(); setLanguage(l); handleSave({ language: l }); }}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                language === lang.slice(0, 2).toLowerCase()
                  ? "bg-white text-black shadow-xl" 
                  : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Preferences;
