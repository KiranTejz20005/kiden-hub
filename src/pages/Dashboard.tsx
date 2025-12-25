import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceProvider } from '@/hooks/useWorkspace';
import { SpotifyProvider } from '@/hooks/useSpotify';
import { useWorkspaceInvitations } from '@/hooks/useWorkspaceInvitations';
import { supabase } from '@/integrations/supabase/client';
import { Profile, FocusSettings, UserStatus } from '@/lib/types';
import AppSidebar from '@/components/app/AppSidebar';
import CommandCenter from '@/components/app/CommandCenter';
import IdeaBar from '@/components/app/IdeaBar';
import VoiceLink from '@/components/app/VoiceLink';
import AIChat from '@/components/app/AIChat';
import Notebook from '@/components/app/Notebook';
import FocusMode from '@/components/app/FocusMode';
import Templates from '@/components/app/Templates';
import OnboardingFlow from '@/components/app/OnboardingFlow';
import { Journal } from '@/components/app/Journal';
import { BookTracker } from '@/components/app/BookTracker';
import { HabitTracker } from '@/components/app/HabitTracker';
import { SpotifyPlayer } from '@/components/app/SpotifyPlayer';
import { SpotifyMiniPlayer } from '@/components/app/SpotifyMiniPlayer';
import { Loader2 } from 'lucide-react';

type ActiveView = 'command' | 'ideas' | 'voice' | 'chat' | 'notebook' | 'focus' | 'templates' | 'journal' | 'books' | 'habits' | 'spotify';

const ONBOARDING_KEY = 'kiden_onboarding_completed';

const DashboardContent = ({ 
  activeView, 
  setActiveView 
}: { 
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Handle pending workspace invitations
  useWorkspaceInvitations();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      checkOnboarding();
    }
  }, [user]);

  const checkOnboarding = () => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

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
          status: (profileData.status as UserStatus) || 'online',
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
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm animate-pulse">Loading your workspace...</p>
        </div>
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
      case 'journal':
        return <Journal />;
      case 'books':
        return <BookTracker />;
      case 'habits':
        return <HabitTracker />;
      case 'spotify':
        return <SpotifyPlayer />;
      default:
        return null;
    }
  };

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow
            onComplete={completeOnboarding}
            userName={profile?.display_name || undefined}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background flex flex-col lg:flex-row pb-16 lg:pb-0">
        <AppSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          profile={profile}
          onProfileUpdate={fetchUserData}
        />
        <main className="flex-1 overflow-auto min-h-0 pt-14 lg:pt-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Mini Player - persists across all views */}
      {activeView !== 'spotify' && (
        <SpotifyMiniPlayer onExpand={() => setActiveView('spotify')} />
      )}
    </>
  );
};

const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>('command');

  return (
    <WorkspaceProvider>
      <SpotifyProvider>
        <DashboardContent activeView={activeView} setActiveView={setActiveView} />
      </SpotifyProvider>
    </WorkspaceProvider>
  );
};

export default Dashboard;
