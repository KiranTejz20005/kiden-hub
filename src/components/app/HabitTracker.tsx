import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Trash2, Edit2, Check, X,
  ChevronLeft, ChevronRight, Loader2, Flame
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, subWeeks, addWeeks, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
}

const defaultHabits = [
  { name: 'Exercise', icon: '💪', color: '#ef4444' },
  { name: 'Read', icon: '📚', color: '#3b82f6' },
  { name: 'Meditate', icon: '🧘', color: '#8b5cf6' },
  { name: 'Water', icon: '💧', color: '#06b6d4' },
  { name: 'Sleep 8h', icon: '😴', color: '#6366f1' },
];

const colorOptions = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'
];

const iconOptions = ['✓', '💪', '📚', '🧘', '💧', '😴', '🍎', '🏃', '✍️', '🎯', '💡', '🌟'];

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form state
  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('✓');
  const [habitColor, setHabitColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchLogs();
    }
  }, [user, weekStart]);

  const fetchHabits = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // If no habits, create defaults
      if (!data || data.length === 0) {
        await createDefaultHabits();
      } else {
        setHabits(data as Habit[]);
      }
    } catch (error: any) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultHabits = async () => {
    if (!user) return;
    try {
      const habitsToInsert = defaultHabits.map(h => ({
        user_id: user.id,
        name: h.name,
        icon: h.icon,
        color: h.color,
      }));

      const { data, error } = await supabase
        .from('habits')
        .insert(habitsToInsert)
        .select();

      if (error) throw error;
      setHabits((data as Habit[]) || []);
    } catch (error: any) {
      console.error('Error creating default habits:', error);
    }
  };

  const fetchLogs = async () => {
    if (!user) return;
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_date', startDate)
        .lte('completed_date', endDate);

      if (error) throw error;
      setLogs((data as HabitLog[]) || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
    }
  };

  const resetForm = () => {
    setHabitName('');
    setHabitIcon('✓');
    setHabitColor('#3b82f6');
    setEditingHabit(null);
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitIcon(habit.icon);
    setHabitColor(habit.color);
    setIsDialogOpen(true);
  };

  const saveHabit = async () => {
    if (!user || !habitName.trim()) return;

    setSaving(true);
    try {
      const habitData = {
        user_id: user.id,
        name: habitName.trim(),
        icon: habitIcon,
        color: habitColor,
      };

      if (editingHabit) {
        const { error } = await supabase
          .from('habits')
          .update(habitData)
          .eq('id', editingHabit.id);
        if (error) throw error;
        toast({ title: 'Habit Updated' });
      } else {
        const { error } = await supabase
          .from('habits')
          .insert(habitData);
        if (error) throw error;
        toast({ title: 'Habit Added' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchHabits();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Habit Removed' });
      fetchHabits();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const toggleHabitDay = async (habitId: string, date: Date) => {
    if (!user) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const existingLog = logs.find(l => l.habit_id === habitId && l.completed_date === dateStr);

    try {
      if (existingLog) {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existingLog.id);
        if (error) throw error;
        setLogs(logs.filter(l => l.id !== existingLog.id));
      } else {
        const { data, error } = await supabase
          .from('habit_logs')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completed_date: dateStr,
          })
          .select()
          .single();
        if (error) throw error;
        setLogs([...logs, data as HabitLog]);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const isCompleted = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logs.some(l => l.habit_id === habitId && l.completed_date === dateStr);
  };

  const getStreakForHabit = (habitId: string) => {
    // Simple streak calculation for current week
    let streak = 0;
    for (let i = 6; i >= 0; i--) {
      const day = addDays(weekStart, i);
      if (day > new Date()) continue;
      if (isCompleted(habitId, day)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getWeekProgress = (habitId: string) => {
    const today = new Date();
    let completed = 0;
    let total = 0;

    weekDays.forEach(day => {
      if (day <= today) {
        total++;
        if (isCompleted(habitId, day)) completed++;
      }
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col p-4 gap-4"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Habit Tracker
            </h2>
            <p className="text-sm text-muted-foreground">
              Track your daily habits and build consistency
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Habit
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editingHabit ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Habit name *"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                />

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setHabitIcon(icon)}
                        className={cn(
                          "w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all duration-200",
                          habitIcon === icon
                            ? "bg-primary text-primary-foreground scale-110"
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => setHabitColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all duration-200",
                          habitColor === color && "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={saveHabit} disabled={saving || !habitName.trim()} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingHabit ? 'Update Habit' : 'Add Habit'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center justify-center gap-2 bg-card/50 rounded-lg p-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-40 text-center">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Habits Table */}
      <Card className="flex-1 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <ScrollArea className="h-full">
          <div className="overflow-x-auto">
            <div className="min-w-[640px] md:min-w-0">
              {/* Header Row */}
              <div className="grid grid-cols-[minmax(150px,1fr)_repeat(7,48px)_60px] md:grid-cols-[1fr_repeat(7,60px)_80px] gap-1 md:gap-2 p-3 md:p-4 border-b border-border/50 sticky top-0 bg-card/90 backdrop-blur-sm">
                <div className="font-medium text-sm">Habit</div>
                {weekDays.map(day => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "text-center text-xs",
                      isSameDay(day, new Date()) && "font-bold text-primary"
                    )}
                  >
                    <div>{format(day, 'EEE')}</div>
                    <div className={cn(
                      "text-base md:text-lg",
                      isSameDay(day, new Date()) && "text-primary"
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
                <div className="text-center text-xs font-medium">%</div>
              </div>

              {/* Habit Rows */}
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Target className="h-12 w-12 mb-2 opacity-50" />
                  <p>No habits yet. Add your first habit!</p>
                </div>
              ) : (
                habits.map(habit => {
                  const streak = getStreakForHabit(habit.id);
                  const progress = getWeekProgress(habit.id);

                  return (
                    <div
                      key={habit.id}
                      className="grid grid-cols-[minmax(150px,1fr)_repeat(7,48px)_60px] md:grid-cols-[1fr_repeat(7,60px)_80px] gap-1 md:gap-2 p-3 md:p-4 border-b border-border/30 hover:bg-muted/30 transition-colors items-center"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <span
                          className="text-lg md:text-xl w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${habit.color}20` }}
                        >
                          {habit.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block text-sm md:text-base">{habit.name}</span>
                          {streak > 0 && (
                            <span className="text-xs text-orange-500 flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {streak}d
                            </span>
                          )}
                        </div>
                        <div className="flex gap-0.5 md:gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={() => openEditDialog(habit)}>
                            <Edit2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={() => deleteHabit(habit.id)}>
                            <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {weekDays.map(day => {
                        const completed = isCompleted(habit.id, day);
                        const isFuture = day > new Date();

                        return (
                          <button
                            key={day.toISOString()}
                            onClick={() => !isFuture && toggleHabitDay(habit.id, day)}
                            disabled={isFuture}
                            className={cn(
                              "w-8 h-8 md:w-10 md:h-10 mx-auto rounded-lg transition-all flex items-center justify-center",
                              completed
                                ? "text-white shadow-md scale-105"
                                : "bg-muted/50 hover:bg-muted",
                              isFuture && "opacity-30 cursor-not-allowed"
                            )}
                            style={{
                              backgroundColor: completed ? habit.color : undefined,
                            }}
                          >
                            {completed && <Check className="h-4 w-4 md:h-5 md:w-5" />}
                          </button>
                        );
                      })}

                      <div className="text-center">
                        <div
                          className="text-sm md:text-lg font-bold"
                          style={{ color: habit.color }}
                        >
                          {progress}%
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </ScrollArea>
      </Card>
    </motion.div>
  );
}
