import React from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface StatsModeViewProps {
  todayMinutes: number;
  weekTotal: number;
  sessionCount: number;
  weeklyStats: any[];
  recentSessions: any[];
}

export const StatsModeView: React.FC<StatsModeViewProps> = ({
  todayMinutes,
  weekTotal,
  sessionCount,
  weeklyStats,
  recentSessions,
}) => {
  const maxBarVal = Math.max(...weeklyStats.map((s) => s.total_minutes || 0), 1);

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto py-6 px-4 space-y-6 overflow-y-auto scrollbar-hide select-none relative z-10 text-white">
      {/* 3 Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-lg">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Today's Focus</p>
          <p className="text-3xl font-black font-mono text-white mt-1.5">{todayMinutes}m</p>
          <p className="text-[11px] text-white/40 mt-0.5">deep work completed</p>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-lg">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Weekly Total</p>
          <p className="text-3xl font-black font-mono text-white mt-1.5">{weekTotal}m</p>
          <p className="text-[11px] text-white/40 mt-0.5">last 7 days</p>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-lg">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Total Sessions</p>
          <p className="text-3xl font-black font-mono text-white mt-1.5">{sessionCount}</p>
          <p className="text-[11px] text-white/40 mt-0.5">focus blocks logged</p>
        </div>
      </div>

      {/* 7-Day Chart */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            7-Day Focus Trend
          </p>
          <span className="text-[11px] text-white/40 font-mono">Daily Minutes</span>
        </div>

        <div className="flex items-end gap-2 h-28 pt-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateKey = d.toISOString().slice(0, 10);
            const stat = weeklyStats.find((s) => s.date === dateKey);
            const height = stat ? Math.max(8, (stat.total_minutes / maxBarVal) * 85) : 6;
            const isToday = i === 6;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 6 }}
                  animate={{ height }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="w-full rounded-t-md relative group cursor-pointer"
                  style={{
                    background: isToday
                      ? 'linear-gradient(to top, #8b5cf6, #c084fc)'
                      : 'rgba(255, 255, 255, 0.15)',
                    boxShadow: isToday ? '0 0 12px rgba(139, 92, 246, 0.6)' : 'none',
                  }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[10px] px-2 py-0.5 rounded pointer-events-none font-mono whitespace-nowrap">
                    {stat ? stat.total_minutes : 0}m
                  </div>
                </motion.div>
                <span className="text-[10px] font-bold text-white/40">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][(d.getDay() + 6) % 7]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions List */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-lg space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/80">Recent Completed Sessions</h3>
        <div className="divide-y divide-white/5">
          {recentSessions.filter((s) => s.completed && (s.duration_minutes || 0) > 0).length === 0 ? (
            <p className="text-xs text-white/40 py-6 text-center">No completed focus sessions recorded yet today.</p>
          ) : (
            recentSessions
              .filter((s) => s.completed && (s.duration_minutes || 0) > 0)
              .slice(0, 6)
              .map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {s.session_type === 'work' ? 'Deep Work Session' : 'Rest Break'}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {s.started_at ? format(new Date(s.started_at), 'MMM d, HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{s.duration_minutes} mins</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
