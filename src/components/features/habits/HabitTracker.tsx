import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Habit, HabitLog } from '@/lib/types';
import {
  fetchHabits, fetchTodayLogs, logHabit,
  createHabit, updateHabit, deleteHabit, fetchHabitStreaks
} from '@/services/habitService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Plus, Flame, CheckCircle2, Trash2, Edit2, X } from 'lucide-react';
import { format } from 'date-fns';

const PRESET_ICONS = ['🏃', '💧', '📚', '🧘', '💪', '🥗', '🛌', '✍️', '🎯', '🎸', '🌱', '🧠', '❤️', '🚴', '🏊'];
const PRESET_COLORS = [
  '#a78bfa', '#34d399', '#60a5fa', '#fb923c', '#f472b6',
  '#facc15', '#2dd4bf', '#f87171', '#c084fc', '#4ade80'
];

interface HabitWithProgress extends Habit {
  current: number;
  completed: boolean;
  streak?: number;
}

interface HabitFormState {
  name: string;
  icon: string;
  color: string;
  goal: number;
  unit: string;
  description: string;
}

const EMPTY_FORM: HabitFormState = {
  name: '', icon: '🎯', color: '#a78bfa', goal: 1, unit: 'times', description: ''
};

function ProgressRing({ value, max, color, size = 56 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const prog = Math.min(value / max, 1);
  const offset = circ * (1 - prog);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ filter: prog >= 1 ? `drop-shadow(0 0 6px ${color}80)` : 'none' }}
      />
    </svg>
  );
}

export default function HabitTracker() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitWithProgress[]>([]);
  const [, setTodayLogs] = useState<HabitLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [form, setForm] = useState<HabitFormState>(EMPTY_FORM);
  const [loggingIds, setLoggingIds] = useState<Set<string>>(new Set());
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  const loadData = useCallback(async () => {
    if (!user) {return;}
    setIsLoading(true);
    const [rawHabits, logs] = await Promise.all([
      fetchHabits(user.id),
      fetchTodayLogs(user.id),
    ]);
    setTodayLogs(logs);

    const enriched: HabitWithProgress[] = rawHabits.map(h => {
      const log = logs.find(l => l.habit_id === h.id);
      return { ...h, current: log?.value || 0, completed: (log?.value || 0) >= h.goal };
    });
    setHabits(enriched);
    setIsLoading(false);

    // Load streaks (non-blocking)
    const streakMap: Record<string, number> = {};
    await Promise.all(rawHabits.map(async h => {
      streakMap[h.id] = await fetchHabitStreaks(user.id, h.id);
    }));
    setStreaks(streakMap);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLog = async (habit: HabitWithProgress) => {
    if (!user || loggingIds.has(habit.id)) {return;}
    setLoggingIds(prev => new Set([...prev, habit.id]));
    const newValue = habit.current + 1;
    const result = await logHabit(user.id, habit.id, newValue);
    if (result) {
      setHabits(prev => prev.map(h =>
        h.id === habit.id
          ? { ...h, current: newValue, completed: newValue >= h.goal }
          : h
      ));
      if (newValue >= habit.goal) {
        toast.success(`${habit.icon} ${habit.name} complete! 🎉`);
      }
    }
    setLoggingIds(prev => { const s = new Set(prev); s.delete(habit.id); return s; });
  };

  const handleSubmit = async () => {
    if (!user || !form.name.trim()) {return;}
    if (editingHabit) {
      await updateHabit(editingHabit.id, user.id, {
        name: form.name, icon: form.icon, color: form.color,
        goal: form.goal, unit: form.unit, description: form.description
      });
      toast.success('Habit updated');
    } else {
      const h = await createHabit(user.id, {
        name: form.name, icon: form.icon, color: form.color,
        goal: form.goal, unit: form.unit, description: form.description || null,
        is_active: true
      });
      if (h) {toast.success(`${form.icon} Habit created!`);}
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingHabit(null);
    loadData();
  };

  const handleDelete = async (habit: Habit) => {
    if (!user || !confirm(`Delete "${habit.name}"?`)) {return;}
    await deleteHabit(habit.id, user.id);
    toast.success('Habit removed');
    loadData();
  };

  const completedToday = habits.filter(h => h.completed).length;
  const totalToday = habits.length;
  const overallProgress = totalToday > 0 ? completedToday / totalToday : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] scrollbar-hide">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto p-8 space-y-8 pb-20"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Daily Habits</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Habit Tracker</h1>
            <p className="text-white/40 text-sm mt-1">{format(new Date(), 'EEEE, MMMM do')}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setForm(EMPTY_FORM); setEditingHabit(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Habit
          </motion.button>
        </div>

        {/* Today's Progress Banner */}
        {totalToday > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] rounded-2xl border border-white/5 p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Today's Progress</p>
              <p className="text-[13px] font-bold text-white">{completedToday} / {totalToday} habits</p>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, #34d399, #a78bfa)`,
                  boxShadow: overallProgress > 0 ? '0 0 10px rgba(52,211,153,0.4)' : 'none'
                }}
              />
            </div>
            {overallProgress === 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] text-emerald-400 font-bold mt-2"
              >
                🎉 All habits complete for today!
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Habits Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 space-y-6 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-4xl">
              🎯
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">No habits yet</h2>
              <p className="text-white/30 text-sm">Build consistency one day at a time.</p>
            </div>
            <button
              onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}
              className="px-6 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition-all"
            >
              Create First Habit
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {habits.map((habit, i) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "group relative rounded-2xl border p-5 transition-all duration-300",
                    habit.completed
                      ? "bg-white/[0.04] border-white/10"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  {habit.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3"
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: habit.color }} />
                    </motion.div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <ProgressRing value={habit.current} max={habit.goal} color={habit.color} />
                      <div className="absolute inset-0 flex items-center justify-center text-xl">
                        {habit.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-[14px] font-bold text-white tracking-tight">{habit.name}</h3>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {habit.current} / {habit.goal} {habit.unit}
                      </p>
                      {streaks[habit.id] !== undefined && streaks[habit.id] > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span className="text-[10px] font-bold text-orange-400">{streaks[habit.id]} day streak</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingHabit(habit); setForm({ name: habit.name, icon: habit.icon, color: habit.color, goal: habit.goal, unit: habit.unit, description: habit.description || '' }); setShowForm(true); }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(habit)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-white/30 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLog(habit)}
                      disabled={loggingIds.has(habit.id) || habit.completed}
                      className={cn(
                        "ml-auto px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all",
                        habit.completed
                          ? "bg-white/5 text-white/20 cursor-not-allowed"
                          : "text-white hover:opacity-90 active:scale-95"
                      )}
                      style={!habit.completed ? {
                        background: `linear-gradient(135deg, ${habit.color}40, ${habit.color}20)`,
                        border: `1px solid ${habit.color}30`,
                        color: habit.color
                      } : {}}
                    >
                      {habit.completed ? 'Done ✓' : `+ Log`}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={e => e.target === e.currentTarget && setShowForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-bold text-white">
                    {editingHabit ? 'Edit Habit' : 'New Habit'}
                  </h2>
                  <button onClick={() => { setShowForm(false); }} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Icon picker */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Icon</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_ICONS.map(ic => (
                      <button
                        key={ic}
                        onClick={() => { setForm(f => ({ ...f, icon: ic })); }}
                        className={cn(
                          "w-9 h-9 rounded-xl text-xl transition-all",
                          form.icon === ic ? "bg-white/20 ring-1 ring-white/40 scale-110" : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Color</p>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => { setForm(f => ({ ...f, color: c })); }}
                        className={cn("w-7 h-7 rounded-full transition-all", form.color === c && "ring-2 ring-white ring-offset-1 ring-offset-[#111] scale-110")}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Habit Name</p>
                  <input
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); }}
                    placeholder="e.g. Morning Run"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    autoFocus
                  />
                </div>

                {/* Goal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Goal</p>
                    <input
                      type="number"
                      min={1}
                      value={form.goal}
                      onChange={e => { setForm(f => ({ ...f, goal: Math.max(1, parseInt(e.target.value) || 1) })); }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-white/25 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Unit</p>
                    <input
                      value={form.unit}
                      onChange={e => { setForm(f => ({ ...f, unit: e.target.value })); }}
                      placeholder="times, pages, ml..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-white/25 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowForm(false); }}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/50 text-[11px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!form.name.trim()}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}99)`, color: '#000' }}
                  >
                    {editingHabit ? 'Update' : 'Create Habit'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
