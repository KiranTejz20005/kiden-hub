import { useState, useEffect } from 'react';
import { format, parseISO, differenceInDays, startOfDay, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { 
  Flame, TrendingUp, Calendar, Video, Smile, Frown, Meh, Heart, Zap, Cloud,
  BarChart3, Award, Target, BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface JournalEntry {
  id: string;
  entry_date: string;
  mood: string | null;
  video_url: string | null;
  title: string | null;
  content: string | null;
}

interface AnalyticsData {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  entriesThisMonth: number;
  entriesWithVideo: number;
  moodDistribution: Record<string, number>;
  weeklyActivity: { day: string; count: number }[];
}

const moods = [
  { value: 'happy', icon: Smile, label: 'Happy', color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  { value: 'sad', icon: Frown, label: 'Sad', color: 'text-blue-500', bg: 'bg-blue-500/20' },
  { value: 'neutral', icon: Meh, label: 'Neutral', color: 'text-gray-500', bg: 'bg-gray-500/20' },
  { value: 'loved', icon: Heart, label: 'Loved', color: 'text-pink-500', bg: 'bg-pink-500/20' },
  { value: 'energetic', icon: Zap, label: 'Energetic', color: 'text-orange-500', bg: 'bg-orange-500/20' },
  { value: 'calm', icon: Cloud, label: 'Calm', color: 'text-cyan-500', bg: 'bg-cyan-500/20' },
];

export function JournalAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const calculateStreak = (entries: JournalEntry[]): { current: number; longest: number } => {
    if (entries.length === 0) return { current: 0, longest: 0 };

    // Sort entries by date descending
    const sortedDates = entries
      .map(e => startOfDay(parseISO(e.entry_date)))
      .sort((a, b) => b.getTime() - a.getTime());

    // Remove duplicates
    const uniqueDates = sortedDates.filter((date, index, self) =>
      index === self.findIndex(d => isSameDay(d, date))
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    // Check if there's an entry today or yesterday to start the streak
    if (uniqueDates.length > 0 && 
        (isSameDay(uniqueDates[0], today) || isSameDay(uniqueDates[0], yesterday))) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const diff = differenceInDays(uniqueDates[i - 1], uniqueDates[i]);
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = differenceInDays(uniqueDates[i - 1], uniqueDates[i]);
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { current: currentStreak, longest: longestStreak };
  };

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all entries for the user
      const { data: allEntries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      const entries = allEntries || [];
      const { current, longest } = calculateStreak(entries);

      // Entries this month
      const thisMonth = new Date();
      const entriesThisMonth = entries.filter(e => {
        const entryDate = parseISO(e.entry_date);
        return entryDate.getMonth() === thisMonth.getMonth() && 
               entryDate.getFullYear() === thisMonth.getFullYear();
      }).length;

      // Entries with video
      const entriesWithVideo = entries.filter(e => e.video_url).length;

      // Mood distribution
      const moodDistribution: Record<string, number> = {};
      entries.forEach(e => {
        if (e.mood) {
          moodDistribution[e.mood] = (moodDistribution[e.mood] || 0) + 1;
        }
      });

      // Weekly activity (last 7 days)
      const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
      });

      const weeklyActivity = last7Days.map(day => ({
        day: format(day, 'EEE'),
        count: entries.filter(e => isSameDay(parseISO(e.entry_date), day)).length
      }));

      setAnalytics({
        totalEntries: entries.length,
        currentStreak: current,
        longestStreak: longest,
        entriesThisMonth,
        entriesWithVideo,
        moodDistribution,
        weeklyActivity
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const topMood = Object.entries(analytics.moodDistribution)
    .sort((a, b) => b[1] - a[1])[0];

  const topMoodData = topMood ? moods.find(m => m.value === topMood[0]) : null;

  // Monthly goal progress (assuming 20 entries/month goal)
  const monthlyGoal = 20;
  const goalProgress = Math.min((analytics.entriesThisMonth / monthlyGoal) * 100, 100);

  return (
    <div className="p-4 space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Streak */}
        <Card className="border-border/50 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold text-orange-500">{analytics.currentStreak}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Longest Streak */}
        <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Best Streak</p>
                <p className="text-3xl font-bold text-purple-500">{analytics.longestStreak}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Entries */}
        <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Entries</p>
                <p className="text-3xl font-bold text-blue-500">{analytics.totalEntries}</p>
                <p className="text-xs text-muted-foreground">journals</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Entries */}
        <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Video Journals</p>
                <p className="text-3xl font-bold text-green-500">{analytics.entriesWithVideo}</p>
                <p className="text-xs text-muted-foreground">recordings</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Video className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Goal */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Monthly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {analytics.entriesThisMonth} of {monthlyGoal} entries
                </span>
                <span className="font-medium">{Math.round(goalProgress)}%</span>
              </div>
              <Progress value={goalProgress} className="h-2" />
              {goalProgress >= 100 && (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  🎉 Goal Achieved!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-20 gap-1">
              {analytics.weeklyActivity.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div 
                    className={cn(
                      "w-full rounded-t transition-all",
                      day.count > 0 ? "bg-primary" : "bg-muted"
                    )}
                    style={{ height: `${Math.max(day.count * 30, 8)}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Mood Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.moodDistribution).length > 0 ? (
              <ScrollArea className="h-24">
                <div className="space-y-2">
                  {Object.entries(analytics.moodDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([mood, count]) => {
                      const moodData = moods.find(m => m.value === mood);
                      if (!moodData) return null;
                      const MoodIcon = moodData.icon;
                      const percentage = (count / analytics.totalEntries) * 100;
                      
                      return (
                        <div key={mood} className="flex items-center gap-2">
                          <MoodIcon className={cn("h-4 w-4", moodData.color)} />
                          <span className="text-xs flex-1">{moodData.label}</span>
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full", moodData.bg)}
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: `hsl(var(--${moodData.color.split('-')[1]}-500))` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No mood data yet. Start journaling!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Streak Motivation */}
      {analytics.currentStreak > 0 && (
        <Card className="border-border/50 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Flame className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {analytics.currentStreak >= 7 
                    ? "🔥 You're on fire!" 
                    : analytics.currentStreak >= 3 
                      ? "💪 Great progress!" 
                      : "🌱 Keep it going!"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {analytics.currentStreak === analytics.longestStreak && analytics.currentStreak > 1
                    ? "You're at your personal best! Don't break the streak!"
                    : analytics.longestStreak > analytics.currentStreak
                      ? `${analytics.longestStreak - analytics.currentStreak} more days to beat your record!`
                      : "Every day counts. Keep journaling!"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
