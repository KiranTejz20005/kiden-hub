import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Flame, Timer, CheckCircle,
    Dumbbell, TrendingUp, Calendar, AlertCircle
} from 'lucide-react';
import {
    LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useHabits } from '@/hooks/useHabits';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { PageLayout } from '@/components/ui/PageLayout';
import { PageHeader } from '@/components/ui/PageHeader';

const StatCard = ({
    title, value, sub, trend, trendVal, icon: Icon, colorClass, delay
}: {
    title: string, value: string, sub: string, trend?: 'up' | 'down', trendVal?: string, icon: any, colorClass: string, delay: number
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/40 relative group hover:border-primary/20 transition-all hover:bg-card/60"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner", colorClass)}>
                <Icon className="w-5 h-5" />
            </div>
            {trendVal && (
                <div className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider",
                    trend === 'up' ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                )}>
                    {trendVal}
                    <TrendingUp className={cn("w-3 h-3", trend === 'down' && "rotate-180")} />
                </div>
            )}
        </div>
        <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">{value}</div>
        <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider opacity-70">{sub}</div>
    </motion.div>
);

export const AnalyticsDashboard = () => {
    const { tasks } = useTasks();
    const { sessions } = useFocusSessions();
    const { habits, logs } = useHabits();

    // Normalized check for completion
    const isCompleted = (status: string) => status === 'done' || status === 'completed';

    // 1. Completion Rate & Total Tasks
    const completedTasks = tasks.filter(t => isCompleted(t.status)).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Focus Time (in hours)
    const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

    // 3. Streak
    const currentStreak = useMemo(() => {
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const date = subDays(today, i);
            const hasActivity = tasks.some(t => isCompleted(t.status) && isSameDay(parseISO(t.updated_at), date)) ||
                sessions.some(s => isSameDay(parseISO(s.started_at), date));
            if (hasActivity) streak++;
            else if (i > 0) break;
        }
        return streak;
    }, [tasks, sessions]);

    // 4. Activity Graph Data (Last 7 Days)
    const activityData = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), 6 - i);
            const dayLabel = format(date, 'EEE');
            const tasksCount = tasks.filter(t => isCompleted(t.status) && isSameDay(parseISO(t.updated_at), date)).length;
            const focusCount = sessions.filter(s => isSameDay(parseISO(s.started_at), date)).reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / 10;
            return {
                day: dayLabel,
                tasks: tasksCount,
                focus: Math.round(focusCount)
            };
        });
    }, [tasks, sessions]);

    // 5. Pie Data
    const focusAreasData = [
        { name: 'Done', value: completedTasks, color: '#10B981' },
        { name: 'Active', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3B82F6' },
        { name: 'ToDo', value: tasks.filter(t => t.status === 'todo').length, color: '#F59E0B' },
    ].filter(d => d.value > 0);

    if (focusAreasData.length === 0) focusAreasData.push({ name: 'Empty', value: 1, color: '#1e293b' });

    // 6. Habit Performance
    const habitStats = habits.map(habit => {
        const todayLogs = logs.filter(l => l.habit_id === habit.id && isSameDay(parseISO(l.date), new Date()));
        const value = todayLogs.reduce((acc, l) => acc + l.value, 0);
        const goal = habit.goal || 1;
        const progress = Math.min(Math.round((value / goal) * 100), 100);
        return { ...habit, progress, value };
    });

    // 7. Heatmap
    const heatmapData = useMemo(() => {
        return Array.from({ length: 90 }).map((_, i) => { // 3 months
            const date = subDays(new Date(), 89 - i);
            const taskCount = tasks.filter(t => isCompleted(t.status) && isSameDay(parseISO(t.updated_at), date)).length;

            let intensity = 0;
            if (taskCount > 0) intensity = 1;
            if (taskCount > 2) intensity = 2;
            if (taskCount > 5) intensity = 3;
            if (taskCount > 8) intensity = 4;
            return { date, intensity };
        });
    }, [tasks]);

    return (
        <PageLayout scrollable className="p-4 md:p-8 space-y-8">
            <PageHeader
                title="Analytics"
                description="Live performance metrics & productivity insights"
            />

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Done Rate"
                    value={`${completionRate}%`}
                    sub="Efficiency"
                    icon={CheckCircle}
                    colorClass="bg-emerald-500/10 text-emerald-500"
                    delay={0.1}
                />
                <StatCard
                    title="Streak"
                    value={`${currentStreak}`}
                    sub="Day Streak"
                    trend="up"
                    icon={Flame}
                    colorClass="bg-orange-500/10 text-orange-500"
                    delay={0.2}
                />
                <StatCard
                    title="Focus"
                    value={`${totalFocusHours}h`}
                    sub="Deep Work"
                    icon={Timer}
                    colorClass="bg-violet-500/10 text-violet-500"
                    delay={0.3}
                />
                <StatCard
                    title="Load"
                    value={`${totalTasks}`}
                    sub="Total Tasks"
                    icon={Activity}
                    colorClass="bg-blue-500/10 text-blue-500"
                    delay={0.4}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Graph */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 bg-card/40 backdrop-blur-sm p-6 rounded-2xl border border-border/40 hover:border-primary/20 transition-colors"
                >
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-lg">Activity Flow</h3>
                            <p className="text-xs text-muted-foreground">Tasks vs Focus Intensity</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="tasks"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTasks)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Task Distribution */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-card/40 backdrop-blur-sm p-6 rounded-2xl border border-border/40 flex flex-col items-center justify-center relative"
                >
                    <h3 className="font-bold text-lg mb-2 self-start">Distribution</h3>
                    <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={focusAreasData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {focusAreasData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none pt-8">
                            <span className="text-3xl font-bold">{completedTasks}</span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Completed</span>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                        {focusAreasData.map((area, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
                                <span className="text-xs text-muted-foreground font-medium">{area.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Habits */}
                <div className="bg-card/40 backdrop-blur-sm p-6 rounded-2xl border border-border/40">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Habit Health</h3>
                    </div>
                    <div className="space-y-4">
                        {habitStats.length === 0 && <div className="text-center text-muted-foreground py-8 text-sm">No habits active today.</div>}
                        {habitStats.map((habit) => (
                            <div key={habit.id} className="group">
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="font-medium flex items-center gap-2">
                                        <Dumbbell className="w-3.5 h-3.5 text-primary" /> {habit.name}
                                    </span>
                                    <span className={cn("font-bold", habit.progress === 100 ? "text-green-500" : "text-muted-foreground")}>
                                        {habit.progress}%
                                    </span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${habit.progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={cn("h-full rounded-full", habit.progress === 100 ? "bg-green-500" : "bg-primary")}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Consistency */}
                <div className="bg-card/40 backdrop-blur-sm p-6 rounded-2xl border border-border/40">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Consistency Map</h3>
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                        {heatmapData.map((d, i) => (
                            <div
                                key={i}
                                title={format(d.date, 'MMM d')}
                                className={cn(
                                    "w-3 h-3 rounded-[2px] transition-all",
                                    d.intensity === 0 ? "bg-secondary/50" :
                                        d.intensity === 1 ? "bg-primary/20" :
                                            d.intensity === 2 ? "bg-primary/40" :
                                                d.intensity === 3 ? "bg-primary/70" : "bg-primary"
                                )}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest mt-4">
                        <span>3 Months Ago</span>
                        <span>Today</span>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};
