import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Trash2, Edit2, Check, X,
  ChevronLeft, ChevronRight, Loader2, Flame,
  Search, Bell, Droplets, Brain, Book, Pause, Play, Ship,
  AlarmClock
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, subWeeks, addWeeks, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';


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


// --- Data Types ---
interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  goal?: string; // e.g. "2500ml"
  unit?: string;
  current_val?: number; // e.g. 2000
  target_val?: number; // e.g. 2500
  details?: string; // e.g. "09:00 AM" if applicable
}

interface HabitLog {
  id: string;
  habit_id: string;
  completed_date: string;
}

export function HabitTracker() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);

  // Mock Data for Visuals (as per user request to replicate image perfectly first)
  // In real app, these would come from DB, but we hardcode initially to match the visual.
  const [stats, setStats] = useState({
    streak: 14,
    completionRate: 85,
    perfectDays: 3,
    dailyProgress: { current: 6, total: 8 }
  });

  const [activeHabits, setActiveHabits] = useState([
    { id: '1', name: 'Drink Water', sub: '2000ml / 2500ml goal', icon: Droplets, color: 'bg-blue-500', status: 'progress', progress: 80, time: '' },
    { id: '2', name: 'Deep Work', sub: '09:00 AM • 45 mins remaining', icon: Brain, color: 'bg-purple-500', status: 'active', active: true, time: 'In Progress' },
    { id: '3', name: 'Read 20 Pages', sub: 'Completed at 8:30 AM', icon: Book, color: 'bg-green-500', status: 'completed', time: '' },
    { id: '4', name: 'Meditation', sub: 'Scheduled for 9:00 PM', icon: Ship, color: 'bg-pink-500', status: 'pending', time: 'Pending' }
  ]);

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  // Mock calendar days for "Consistency" card
  const calendarDays = useMemo(() => {
    // Just generating a static grid of numbers 1-14 to match image roughly 
    // Or specific dates to look like the image (Mon 1 to Sun 14)
    // Image shows: 1, 2, 3(green), 4(green), 5(green), 6, 7(green) 
    // Row 2: 8(green), 9(green), 10(green), 11(green), 12(green), 13(green), 14(blue-selected)
    return [
      { day: 1, status: 'inactive' }, { day: 2, status: 'inactive' }, { day: 3, status: 'success' }, { day: 4, status: 'success' }, { day: 5, status: 'success' }, { day: 6, status: 'inactive' }, { day: 7, status: 'success' },
      { day: 8, status: 'success' }, { day: 9, status: 'success' }, { day: 10, status: 'success' }, { day: 11, status: 'success' }, { day: 12, status: 'success' }, { day: 13, status: 'success' }, { day: 14, status: 'selected' },
    ];
  }, []);

  // Weekly Chart Data (Mock)
  const weeklyActivity = [40, 60, 25, 80, 50, 40, 85]; // Heights in percentage

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">My Habits</h1>
          <span className="bg-[#1C2333] text-green-500 text-xs font-semibold px-2 py-1 rounded">October 24</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search habits..."
              className="bg-[#111623] border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 w-64 text-gray-300"
            />
          </div>
          <button className="relative p-2 text-gray-400 hover:text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0E17]"></span>
          </button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-lg font-medium">
            <Plus className="w-4 h-4" /> New Habit
          </Button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* 1. Day Streak */}
        <div className="bg-[#111623] rounded-2xl p-6 border border-[#1F2937] relative">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1C1F2E] flex items-center justify-center text-purple-400">
              <FireIcon className="w-5 h-5" />
            </div>
            <div className="flex items-center text-green-400 text-xs font-bold gap-1">
              +12% <span className="rotate-[-45deg] inline-block">➜</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">14</div>
          <div className="text-gray-500 text-sm">Day Streak</div>
        </div>

        {/* 2. Completion Rate */}
        <div className="bg-[#111623] rounded-2xl p-6 border border-[#1F2937] relative">
          <div className="w-10 h-10 rounded-xl bg-[#1C1F2E] flex items-center justify-center text-blue-400 mb-4">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">85%</div>
          <div className="text-gray-500 text-sm">Completion Rate</div>
        </div>

        {/* 3. Perfect Days */}
        <div className="bg-[#111623] rounded-2xl p-6 border border-[#1F2937] relative">
          <div className="w-10 h-10 rounded-xl bg-[#1C1F2E] flex items-center justify-center text-orange-400 mb-4">
            <TrophyIcon className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">3</div>
          <div className="text-gray-500 text-sm">Perfect Days</div>
        </div>

        {/* 4. Daily Focus (Blue Card) */}
        <div className="bg-blue-600 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Daily Focus</h3>
            <p className="text-blue-100 text-sm">You're crushing it today!</p>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-white mb-2 font-medium">
              <span>6/8 Habits</span>
              <span>75%</span>
            </div>
            <div className="w-full h-1.5 bg-blue-800/50 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full w-[75%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-8">
        {/* Left Column: Today's Focus List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Today's Focus</h2>
            <div className="bg-[#111623] p-1 rounded-lg flex text-xs">
              <button className="px-3 py-1 bg-[#1F2937] text-white rounded font-medium shadow-sm">All</button>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-300">Morning</button>
              <button className="px-3 py-1 text-gray-500 hover:text-gray-300">Evening</button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Habit 1: Water */}
            <div className="bg-[#111623] p-4 rounded-xl border border-[#1F2937] flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-[#162032] flex items-center justify-center text-blue-500">
                <Droplets className="w-6 h-6 fill-blue-500/20" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Drink Water</h3>
                <p className="text-sm text-gray-500">2000ml / 2500ml goal</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-[#1F2937] rounded-full overflow-hidden relative">
                  <div className="absolute bottom-0 w-full bg-blue-500 h-[80%] rounded-full" />
                </div>
                <button className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-800">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Habit 2: Deep Work */}
            <div className="bg-[#111623] p-4 rounded-xl border border-[#1F2937] flex items-center gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
              <div className="w-12 h-12 rounded-xl bg-[#1D1B2E] flex items-center justify-center text-purple-500">
                <Brain className="w-6 h-6 fill-purple-500/20" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Deep Work</h3>
                <p className="text-sm text-gray-500">09:00 AM • 45 mins remaining</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">In Progress</span>
                <button className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </button>
              </div>
            </div>

            {/* Habit 3: Reading */}
            <div className="bg-[#111623] p-4 rounded-xl border border-[#1F2937] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#162321] flex items-center justify-center text-green-500">
                <Book className="w-6 h-6 fill-green-500/20" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-400 line-through decoration-gray-600">Read 20 Pages</h3>
                <p className="text-sm text-gray-600">Completed at 8:30 AM</p>
              </div>
              <div>
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Habit 4: Meditation */}
            <div className="bg-[#111623] p-4 rounded-xl border border-[#1F2937] flex items-center gap-4 opacity-70">
              <div className="w-12 h-12 rounded-xl bg-[#231820] flex items-center justify-center text-pink-500">
                <Ship className="w-6 h-6 fill-pink-500/20" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Meditation</h3>
                <p className="text-sm text-gray-500">Scheduled for 9:00 PM</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Pending</span>
                <button className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-800">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          {/* Consistency Calendar */}
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
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all",
                    d.status === 'success' ? "bg-green-500 text-black font-bold" :
                      d.status === 'selected' ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20" :
                        "text-gray-600 hover:bg-gray-800"
                  )}
                >
                  {d.day}
                </div>
              ))}
            </div>
          </div>

          {/* Next Reminder */}
          <div className="bg-[#482880] rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-white">Next Reminder</h3>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                <AlarmClock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1 tracking-tight">08:00 PM</div>
            <p className="text-purple-200 text-sm mb-6">Evening Reflection</p>

            <div className="flex gap-3">
              <button className="flex-1 bg-white text-purple-900 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">Start Now</button>
              <button className="px-4 py-2 bg-purple-800/50 text-purple-100 rounded-lg text-sm font-medium hover:bg-purple-800/70 transition-colors">Skip</button>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="bg-[#111623] rounded-2xl p-6 border border-[#1F2937] h-[200px] flex flex-col">
            <div className="flex justify-between items-center mb-auto">
              <h3 className="font-bold text-white text-sm">Weekly Activity</h3>
              <span className="text-xs text-gray-500">Last 7 days</span>
            </div>

            <div className="flex items-end justify-between gap-2 h-24">
              {weeklyActivity.map((h, i) => (
                <div key={i} className="w-full bg-[#1C2333] rounded-t-sm h-full flex items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all duration-500",
                      i === 6 ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-blue-500/20"
                    )}
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HabitTracker;
