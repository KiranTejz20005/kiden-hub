import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Profile, FocusSession, Collection, FocusSettings } from '@/lib/types';
import AppSidebar from '@/components/app/AppSidebar';
import CommandCenter from '@/components/app/CommandCenter';
import IdeaBar from '@/components/app/IdeaBar';
import VoiceLink from '@/components/app/VoiceLink';
import AIChat from '@/components/app/AIChat';
import Notebook from '@/components/app/Notebook';
import FocusMode from '@/components/app/FocusMode';
import Templates from '@/components/app/Templates';
import { Loader2 } from 'lucide-react';

type ActiveView = 'command' | 'ideas' | 'voice' | 'chat' | 'notebook' | 'focus' | 'templates';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ActiveView>('command');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          ...profileData,
          focus_settings: profileData.focus_settings as unknown as FocusSettings
        });
      }

      // Fetch total focus time
      const { data: sessionsData } = await supabase
        .from('focus_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (sessionsData) {
        const total = sessionsData.reduce((acc, s) => acc + s.duration_minutes, 0);
        setTotalFocusMinutes(total);
      }

      // Fetch collections
      const { data: collectionsData } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id);

      if (collectionsData) {
        setCollections(collectionsData as Collection[]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const renderActiveView = () => {
    switch (activeView) {
      case 'command':
        return (
          <CommandCenter
            profile={profile}
            totalFocusMinutes={totalFocusMinutes}
            collections={collections}
            onEnterFocus={() => setActiveView('focus')}
            onNewThought={() => setActiveView('ideas')}
            onAIAssistant={() => setActiveView('chat')}
          />
        );
      case 'ideas':
        return <IdeaBar />;
      case 'voice':
        return <VoiceLink />;
      case 'chat':
        return <AIChat />;
      case 'notebook':
        return <Notebook />;
      case 'focus':
        return <FocusMode focusSettings={profile?.focus_settings} onComplete={fetchUserData} />;
      case 'templates':
        return <Templates />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        profile={profile}
      />
      <main className="flex-1 overflow-auto">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default Dashboard;