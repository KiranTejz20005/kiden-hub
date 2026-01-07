import { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Trash2, Edit2, Check, X,
  ChevronLeft, ChevronRight, Loader2,
  Search, Bell, Droplets, Brain, Book, Play, Ship,
  AlarmClock,
  Dumbbell,
  Wifi
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHabits, Habit } from '@/hooks/useHabits'; // Use the hook!

// --- SVG Icons for Stats ---
const FireIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.314.518.598 1.05.9 1.8z" />
  </svg>
)

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
)

export function HabitTracker() {
  const { user } = useAuth();

  // Use the hook to manage state
  const { habits, logs, loading, createHabit, logHabit } = useHabits();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Stats (Calculated from habits + logs)
  const streak = 0; // Implementing real streak requires complex date logic, keeping simpler for now

  // Merge habits with today's logs for UI display
  const today = format(new Date(), 'yyyy-MM-dd');
  const mergedHabits = useMemo(() => {
    return habits.map(h => {
      // Since useHabits only returns 'recent logs', we filter for today's log manually if needed
      // But simpler: useHabits could return 'merged' but it returns raw.
      // Let's filter the logs:
      const todayLog = logs.find(l => l.habit_id === h.id && l.date === today);
      const current = todayLog?.value || 0;
      return {
        ...h,
        current,
        completed: current >= h.goal
      };
    });
  }, [habits, logs, today]);

  const completionRate = useMemo(() => {
    const total = mergedHabits.length;
    if (total === 0) return 0;
    const done = mergedHabits.filter(h => h.completed).length;
    return Math.round((done / total) * 100);
  }, [mergedHabits]);


  // New Habit Form
  const [newHabit, setNewHabit] = useState({
    name: '',
    goal: 1,
    unit: 'times',
    icon: 'Target',
    color: 'bg-blue-500'
  });

  // Calendar
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const calendarDays = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({ day: i + 1, status: 'inactive' }));
  }, []);

  const handleCreateHabit = async () => {
    if (!newHabit.name) {
      toast.error("Please enter a habit name");
      return;
    }
    setCreating(true);

    await createHabit({
      name: newHabit.name,
      goal: newHabit.goal,
      unit: newHabit.unit,
      icon: newHabit.icon,
      color: newHabit.color,
      description: `${newHabit.goal} ${newHabit.unit}/day`
    });

    setCreating(false);
    setIsDialogOpen(false);
    setNewHabit({ name: '', goal: 1, unit: 'times', icon: 'Target', color: 'bg-blue-500' });
  };

  const handleUpdate = async (habit: Habit, increment: number = 1) => {
    // Check if we hit goal for confetti
    const current = mergedHabits.find(h => h.id === habit.id)?.current || 0;
    const nextVal = current + increment;
    if (nextVal >= habit.goal && current < habit.goal) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    await logHabit(habit.id, increment);
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Droplets': return Droplets;
      case 'Brain': return Brain;
      case 'Book': return Book;
      case 'Ship': return Ship;
      case 'Dumbbell': return Dumbbell;
      case 'Target': return Target;
      case 'Wifi': return Wifi;
      default: return Target;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">My Habits</h1>
          <span className="bg-[#1C2333] text-green-500 text-xs font-semibold px-2 py-1 rounded">
            {format(new Date(), 'MMM dd')}
          </span>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-lg font-medium">
              <Plus className="w-4 h-4" /> New Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111623] border-[#1F2937] text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Habit Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Read 30 mins"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="bg-[#1C1F2E] border-[#2A2E3B] text-white focus-visible:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Goal</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newHabit.goal}
                    onChange={(e) => setNewHabit({ ...newHabit, goal: parseInt(e.target.value) || 1 })}
                    className="bg-[#1C1F2E] border-[#2A2E3B] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={newHabit.unit}
                    onChange={(e) => setNewHabit({ ...newHabit, unit: e.target.value })}
                    className="bg-[#1C1F2E] border-[#2A2E3B] text-white"
                    placeholder="times/mins"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={newHabit.icon} onValueChange={(val) => setNewHabit({ ...newHabit, icon: val })}>
                  <SelectTrigger className="bg-[#1C1F2E] border-[#2A2E3B] text-white">
                    <SelectValue placeholder="Select Icon" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1F2E] border-[#2A2E3B]">
                    <SelectItem value="Target" className="text-white focus:bg-[#2A2E3B]">Target</SelectItem>
                    <SelectItem value="Droplets" className="text-white focus:bg-[#2A2E3B]">Water</SelectItem>
                    <SelectItem value="Book" className="text-white focus:bg-[#2A2E3B]">Reading</SelectItem>
                    <SelectItem value="Brain" className="text-white focus:bg-[#2A2E3B]">Focus</SelectItem>
                    <SelectItem value="Dumbbell" className="text-white focus:bg-[#2A2E3B]">Fitness</SelectItem>
                    <SelectItem value="Ship" className="text-white focus:bg-[#2A2E3B]">Meditation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-400 hover:text-white">Cancel</Button>
              <Button onClick={handleCreateHabit} disabled={creating} className="bg-blue-600 hover:bg-blue-500 text-white">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Habit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111623] rounded-2xl p-6 border border-[#1F2937] relative">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1C1F2E] flex items-center justify-center text-purple-400">
              <FireIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{streak}</div>
          <div className="text-gray-500 text-sm">Day Streak</div>
        </div>

        <div className="bg-[#111623] rounded-2xl p-6 border border-[#1F2937] relative">
          <div className="w-10 h-10 rounded-xl bg-[#1C1F2E] flex items-center justify-center text-blue-400 mb-4">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{completionRate}%</div>
          <div className="text-gray-500 text-sm">Completion Rate</div>
        </div>

        <div className="bg-[#111623] rounded-2xl p-6 border border-[#1F2937] relative">
          <div className="w-10 h-10 rounded-xl bg-[#1C1F2E] flex items-center justify-center text-orange-400 mb-4">
            <TrophyIcon className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">0</div>
          <div className="text-gray-500 text-sm">Perfect Days</div>
        </div>

        {/* Daily Focus */}
        <div className="bg-blue-600 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Daily Focus</h3>
            <p className="text-blue-100 text-sm">You're crushing it today!</p>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white mb-2 font-medium">
              <span>{mergedHabits.filter(h => h.completed).length}/{mergedHabits.length} Habits</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-blue-800/50 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column: Today's Focus List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Today's Focus</h2>
          </div>

          <div className="space-y-4">
            {mergedHabits.length === 0 && !loading && (
              <div className="text-center py-12 bg-[#111623]/50 rounded-xl border border-dashed border-[#1F2937]">
                <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No habits tracks yet.</p>
                <p className="text-sm text-gray-600">Click "New Habit" to get started.</p>
              </div>
            )}

            {mergedHabits.map((habit) => {
              const Icon = getIcon(habit.icon || 'Target'); // Safety fallback
              const progress = Math.min(((habit.current || 0) / habit.goal) * 100, 100);

              return (
                <div key={habit.id} className={cn(
                  "bg-[#111623] p-4 rounded-xl border border-[#1F2937] flex items-center gap-4 group transition-all",
                  habit.completed ? "opacity-70" : ""
                )}>
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gray-800 text-white")}>
                    <Icon className="w-6 h-6 fill-current opacity-90" />
                  </div>

                  <div className="flex-1">
                    <h3 className={cn("font-semibold text-white", habit.completed && "line-through text-gray-500")}>{habit.name}</h3>
                    <p className="text-sm text-gray-500">
                      {habit.current || 0} / {habit.goal} {habit.unit}
                    </p>
                  </div>

                  {habit.unit === 'ml' ? (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1.5 bg-[#1F2937] rounded-full overflow-hidden relative">
                        <div className="absolute bottom-0 w-full bg-blue-500 rounded-full transition-all duration-500" style={{ height: `${progress}%` }} />
                      </div>
                      <button
                        onClick={() => handleUpdate(habit, 250)}
                        className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-800 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {habit.current && habit.current > 0 && !habit.completed && (
                        <span className="text-xs font-medium text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">In Progress</span>
                      )}
                      <button
                        onClick={() => handleUpdate(habit, 1)}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white transition-all",
                          habit.completed ? "bg-green-500" : "bg-gray-800 hover:bg-gray-700"
                        )}
                      >
                        {habit.completed ? <Check className="w-4 h-4" /> : <Plus className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          {/* Consistency Calendar - Placeholder for now */}
          <div className="bg-[#111623] rounded-2xl p-6 border border-[#1F2937]">
            <h3 className="font-bold text-white mb-4">Consistency</h3>
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              {weekDays.map((d, i) => <span key={i} className="text-xs text-gray-500">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-2 justify-center">
              {calendarDays.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all text-gray-600 hover:bg-gray-800",
                    // Placeholder active state
                  )}
                >
                  {d.day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
