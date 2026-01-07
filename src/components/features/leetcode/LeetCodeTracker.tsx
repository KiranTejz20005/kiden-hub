import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Plus, Trophy, Target, Flame, TrendingUp,
  Filter, Search, ExternalLink, Trash2, Edit2, Check,
  X, Clock, BookOpen, Zap, Star, BarChart3, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LeetCodeProblem {
  id: string;
  user_id: string;
  title: string;
  problem_number: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  url: string | null;
  status: 'solved' | 'attempted' | 'todo' | 'revisit';
  notes: string | null;
  time_taken_minutes: number | null;
  solved_at: string | null;
  created_at: string;
}

const CATEGORIES = [
  'Arrays', 'Strings', 'Hash Table', 'Dynamic Programming', 'Math',
  'Sorting', 'Greedy', 'Depth-First Search', 'Binary Search', 'Tree',
  'Breadth-First Search', 'Matrix', 'Two Pointers', 'Bit Manipulation',
  'Stack', 'Heap', 'Graph', 'Linked List', 'Recursion', 'Sliding Window',
  'Backtracking', 'Divide and Conquer', 'Trie', 'Union Find'
];

const difficultyColors = {
  easy: 'from-emerald-500 to-green-400',
  medium: 'from-amber-500 to-yellow-400',
  hard: 'from-rose-500 to-red-400'
};

const difficultyBg = {
  easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

const statusColors = {
  solved: 'bg-emerald-500/20 text-emerald-400',
  attempted: 'bg-amber-500/20 text-amber-400',
  todo: 'bg-blue-500/20 text-blue-400',
  revisit: 'bg-purple-500/20 text-purple-400'
};

const ProblemCard = memo(({
  problem,
  onDelete,
  onEdit
}: {
  problem: LeetCodeProblem;
  onDelete: (id: string) => void;
  onEdit: (problem: LeetCodeProblem) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    whileHover={{ scale: 1.02 }}
    className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all group"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {problem.problem_number && (
            <span className="text-xs text-muted-foreground font-mono">
              #{problem.problem_number}
            </span>
          )}
          <Badge variant="outline" className={`text-xs ${difficultyBg[problem.difficulty]}`}>
            {problem.difficulty}
          </Badge>
          <Badge variant="outline" className={`text-xs ${statusColors[problem.status]}`}>
            {problem.status}
          </Badge>
        </div>
        <h4 className="font-medium text-foreground truncate">{problem.title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{problem.category}</p>
        {problem.time_taken_minutes && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {problem.time_taken_minutes} min
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {problem.url && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => window.open(problem.url!, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onEdit(problem)}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(problem.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  </motion.div>
));

ProblemCard.displayName = 'ProblemCard';

const StatCard = memo(({
  icon: Icon,
  label,
  value,
  gradient,
  delay = 0
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-xl bg-card/50 border border-border/50 p-4"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
    <div className="relative flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  </motion.div>
));

StatCard.displayName = 'StatCard';

// Calendar Heatmap Component
const CalendarHeatmap = memo(({ problems }: { problems: LeetCodeProblem[] }) => {
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; count: number; x: number; y: number } | null>(null);

  const { maxCount, weeks, months } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate last 52 weeks (364 days)
    const days: { date: Date; count: number; problems: LeetCodeProblem[] }[] = [];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);

    // Adjust to start from Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    for (let i = 0; i < 371; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      if (date > today) break;

      const dayProblems = problems.filter(p => {
        if (!p.solved_at) return false;
        const solvedDate = new Date(p.solved_at);
        solvedDate.setHours(0, 0, 0, 0);
        return solvedDate.getTime() === date.getTime();
      });

      days.push({
        date,
        count: dayProblems.length,
        problems: dayProblems
      });
    }

    // Group into weeks
    const weeksData: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksData.push(days.slice(i, i + 7));
    }

    // Get months for labels
    const monthsData: { name: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeksData.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          monthsData.push({
            name: firstDay.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex
          });
          lastMonth = month;
        }
      }
    });

    const max = Math.max(...days.map(d => d.count), 1);

    return { heatmapData: days, maxCount: max, weeks: weeksData, months: monthsData };
  }, [problems]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'bg-emerald-500/30';
    if (intensity <= 0.5) return 'bg-emerald-500/50';
    if (intensity <= 0.75) return 'bg-emerald-500/70';
    return 'bg-emerald-500';
  };

  return (
    <div className="mt-4 p-4 rounded-xl bg-card/50 border border-border/50">
      <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Activity Heatmap
      </h3>

      {/* Month labels */}
      <div className="flex mb-1 ml-8 text-xs text-muted-foreground">
        {months.map((month, i) => (
          <div
            key={i}
            className="flex-shrink-0"
            style={{
              marginLeft: i === 0 ? 0 : `${(month.weekIndex - (months[i - 1]?.weekIndex || 0) - 1) * 14}px`,
              width: '28px'
            }}
          >
            {month.name}
          </div>
        ))}
      </div>

      <div className="flex gap-0.5 relative">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 text-xs text-muted-foreground">
          <span className="h-3"></span>
          <span className="h-3 flex items-center">M</span>
          <span className="h-3"></span>
          <span className="h-3 flex items-center">W</span>
          <span className="h-3"></span>
          <span className="h-3 flex items-center">F</span>
          <span className="h-3"></span>
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-0.5 overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={dayIndex}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: weekIndex * 0.01 + dayIndex * 0.002 }}
                  className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${getColorClass(day.count)}`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredDay({
                      date: day.date,
                      count: day.count,
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10
                    });
                  }}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredDay && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="fixed z-50 px-2 py-1 rounded bg-popover border border-border shadow-lg text-xs pointer-events-none"
              style={{
                left: hoveredDay.x,
                top: hoveredDay.y,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <p className="font-medium text-foreground">
                {hoveredDay.count} problem{hoveredDay.count !== 1 ? 's' : ''}
              </p>
              <p className="text-muted-foreground">
                {hoveredDay.date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${intensity === 0 ? 'bg-muted/30' :
                intensity <= 0.25 ? 'bg-emerald-500/30' :
                  intensity <= 0.5 ? 'bg-emerald-500/50' :
                    intensity <= 0.75 ? 'bg-emerald-500/70' :
                      'bg-emerald-500'
                }`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
});

CalendarHeatmap.displayName = 'CalendarHeatmap';

const LeetCodeTracker = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState<LeetCodeProblem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    problem_number: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: 'Arrays',
    url: '',
    status: 'solved' as 'solved' | 'attempted' | 'todo' | 'revisit',
    notes: '',
    time_taken_minutes: ''
  });

  const fetchProblems = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('leetcode_problems')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching problems:', error);
      toast.error('Failed to load problems');
    } else {
      setProblems((data || []) as LeetCodeProblem[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leetcode-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leetcode_problems',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProblems(prev => [payload.new as LeetCodeProblem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProblems(prev => prev.map(p =>
              p.id === payload.new.id ? payload.new as LeetCodeProblem : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setProblems(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const resetForm = () => {
    setFormData({
      title: '',
      problem_number: '',
      difficulty: 'medium',
      category: 'Arrays',
      url: '',
      status: 'solved',
      notes: '',
      time_taken_minutes: ''
    });
    setEditingProblem(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim()) return;

    const problemData = {
      user_id: user.id,
      title: formData.title.trim(),
      problem_number: formData.problem_number ? parseInt(formData.problem_number) : null,
      difficulty: formData.difficulty,
      category: formData.category,
      url: formData.url.trim() || null,
      status: formData.status,
      notes: formData.notes.trim() || null,
      time_taken_minutes: formData.time_taken_minutes ? parseInt(formData.time_taken_minutes) : null,
      solved_at: formData.status === 'solved' ? new Date().toISOString() : null
    };

    if (editingProblem) {
      const { error } = await supabase
        .from('leetcode_problems')
        .update(problemData)
        .eq('id', editingProblem.id);

      if (error) {
        toast.error('Failed to update problem');
      } else {
        toast.success('Problem updated!');
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('leetcode_problems')
        .insert(problemData);

      if (error) {
        toast.error('Failed to add problem');
      } else {
        toast.success('Problem added!');
        resetForm();
      }
    }
  };

  const handleEdit = (problem: LeetCodeProblem) => {
    setFormData({
      title: problem.title,
      problem_number: problem.problem_number?.toString() || '',
      difficulty: problem.difficulty,
      category: problem.category,
      url: problem.url || '',
      status: problem.status,
      notes: problem.notes || '',
      time_taken_minutes: problem.time_taken_minutes?.toString() || ''
    });
    setEditingProblem(problem);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('leetcode_problems')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete problem');
    } else {
      toast.success('Problem deleted!');
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = problems.length;
    const solved = problems.filter(p => p.status === 'solved').length;
    const easy = problems.filter(p => p.difficulty === 'easy' && p.status === 'solved').length;
    const medium = problems.filter(p => p.difficulty === 'medium' && p.status === 'solved').length;
    const hard = problems.filter(p => p.difficulty === 'hard' && p.status === 'solved').length;

    // Category breakdown
    const categoryStats = CATEGORIES.reduce((acc, cat) => {
      acc[cat] = problems.filter(p => p.category === cat && p.status === 'solved').length;
      return acc;
    }, {} as Record<string, number>);

    // Streak calculation (consecutive days with at least one solved problem)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    const currentDate = new Date(today);

    while (true) {
      const dayProblems = problems.filter(p => {
        if (!p.solved_at) return false;
        const solvedDate = new Date(p.solved_at);
        solvedDate.setHours(0, 0, 0, 0);
        return solvedDate.getTime() === currentDate.getTime();
      });

      if (dayProblems.length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Average time
    const solvedWithTime = problems.filter(p => p.status === 'solved' && p.time_taken_minutes);
    const avgTime = solvedWithTime.length > 0
      ? Math.round(solvedWithTime.reduce((sum, p) => sum + (p.time_taken_minutes || 0), 0) / solvedWithTime.length)
      : 0;

    return { total, solved, easy, medium, hard, categoryStats, streak, avgTime };
  }, [problems]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.problem_number?.toString().includes(searchQuery));
      const matchesDifficulty = filterDifficulty === 'all' || p.difficulty === filterDifficulty;
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesDifficulty && matchesCategory && matchesStatus;
    });
  }, [problems, searchQuery, filterDifficulty, filterCategory, filterStatus]);

  // Top categories
  const topCategories = useMemo(() => {
    return Object.entries(stats.categoryStats)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [stats.categoryStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-muted-foreground font-medium flex items-center gap-2"
        >
          <Code2 className="w-5 h-5" />
          Loading problems...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 xs:p-6 border-b border-border/50"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 xs:gap-4 mb-4 xs:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 xs:p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <Code2 className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg xs:text-xl font-bold text-foreground">LeetCode Tracker</h2>
              <p className="text-xs xs:text-sm text-muted-foreground hidden xs:block">Track your coding journey</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs xs:text-sm px-3 xs:px-4"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Add Problem</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3">
          <StatCard
            icon={Trophy}
            label="Total Solved"
            value={stats.solved}
            gradient="from-emerald-500 to-green-400"
            delay={0}
          />
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${stats.streak} days`}
            gradient="from-orange-500 to-amber-400"
            delay={0.1}
          />
          <StatCard
            icon={Clock}
            label="Avg Time"
            value={`${stats.avgTime} min`}
            gradient="from-blue-500 to-cyan-400"
            delay={0.2}
          />
          <StatCard
            icon={Target}
            label="Total Tracked"
            value={stats.total}
            gradient="from-purple-500 to-pink-400"
            delay={0.3}
          />
        </div>

        {/* Difficulty Breakdown */}
        <div className="mt-4 p-4 rounded-xl bg-card/50 border border-border/50">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Difficulty Breakdown
          </h3>
          <div className="flex gap-4">
            {['easy', 'medium', 'hard'].map((diff) => {
              const count = stats[diff as 'easy' | 'medium' | 'hard'];
              const percentage = stats.solved > 0 ? (count / stats.solved * 100).toFixed(0) : 0;
              return (
                <motion.div
                  key={diff}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs capitalize text-muted-foreground">{diff}</span>
                    <span className="text-xs font-medium text-foreground">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${difficultyColors[diff as 'easy' | 'medium' | 'hard']}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-card/50 border border-border/50">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Top Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {topCategories.map(([category, count], index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge variant="outline" className="bg-primary/10 border-primary/30">
                    {category}: {count}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Heatmap */}
        <CalendarHeatmap problems={problems} />
      </motion.div>

      {/* Filters */}
      <div className="p-4 border-b border-border/50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems..."
            className="pl-9 bg-background/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="select-styled"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="select-styled"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select-styled"
          >
            <option value="all">All Status</option>
            <option value="solved">Solved</option>
            <option value="attempted">Attempted</option>
            <option value="todo">To Do</option>
            <option value="revisit">Revisit</option>
          </select>
        </div>
      </div>

      {/* Problems List */}
      <ScrollArea className="flex-1 p-4">
        <AnimatePresence mode="popLayout">
          {filteredProblems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-4 rounded-full bg-muted/30 mb-4">
                <Code2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">No problems found</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                Add your first problem
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-3">
              {filteredProblems.map((problem) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {editingProblem ? 'Edit Problem' : 'Add New Problem'}
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Problem Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Two Sum"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Problem #</label>
                    <Input
                      type="number"
                      value={formData.problem_number}
                      onChange={(e) => setFormData({ ...formData, problem_number: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Time (mins)</label>
                    <Input
                      type="number"
                      value={formData.time_taken_minutes}
                      onChange={(e) => setFormData({ ...formData, time_taken_minutes: e.target.value })}
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                      className="select-styled"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'solved' | 'attempted' | 'todo' | 'revisit' })}
                      className="select-styled"
                    >
                      <option value="solved">Solved</option>
                      <option value="attempted">Attempted</option>
                      <option value="todo">To Do</option>
                      <option value="revisit">Revisit</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="select-styled"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">LeetCode URL</label>
                    <Input
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://leetcode.com/problems/two-sum/"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add your notes, approach, or key learnings..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {editingProblem ? 'Update' : 'Add Problem'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeetCodeTracker;
