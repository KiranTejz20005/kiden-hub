import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Flame, Timer, CheckCircle, MoreHorizontal,
    Bell, Settings, Dumbbell, Code, BookOpen, Droplet
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- Data & Types ---

const ACTIVITY_DATA = [
    { day: 'Mon', current: 65, previous: 40 },
    { day: 'Tue', current: 59, previous: 30 },
    { day: 'Wed', current: 80, previous: 60 },
    { day: 'Thu', current: 81, previous: 50 },
    { day: 'Fri', current: 56, previous: 45 },
    { day: 'Sat', current: 95, previous: 70 },
    { day: 'Sun', current: 88, previous: 65 },
];

const FOCUS_AREAS_DATA = [
    { name: 'Health', value: 35, color: '#3b82f6' },   // Blue
    { name: 'Work', value: 45, color: '#8b5cf6' },     // Purple
    { name: 'Learning', value: 15, color: '#ec4899' }, // Pink
    { name: 'Finance', value: 5, color: '#f97316' },   // Orange
];

const HABITS_PERFORMANCE = [
    { name: 'Morning Workout', sub: 'Health • 07:00 AM', progress: 92, color: 'bg-blue-500', icon: Dumbbell },
    { name: 'Deep Coding', sub: 'Work • 4h Goal', progress: 78, color: 'bg-purple-500', icon: Code },
    { name: 'Reading', sub: 'Learning • 30m Goal', progress: 100, color: 'bg-green-500', icon: BookOpen },
    { name: 'Drink Water', sub: 'Health • 2.5L', progress: 65, color: 'bg-orange-500', icon: Droplet },
];

const CONSISTENCY_DATA = Array.from({ length: 42 }).map((_, i) => ({
    level: [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)] // 0-4 intensity
}));

// --- Components ---

const StatCard = ({
    title, value, sub, trend, trendVal, icon: Icon, colorClass, delay
}: {
    title: string, value: string, sub: string, trend?: 'up' | 'down', trendVal?: string, icon: any, colorClass: string, delay: number
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-[#161B22] p-6 rounded-2xl border border-white/5 relative group hover:border-white/10 transition-colors"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClass)}>
                <Icon className="w-5 h-5" />
            </div>
            {trendVal && (
                <div className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
                    trend === 'up' ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                )}>
                    {trendVal}
                    <span className={cn("transform", trend === 'up' ? "-rotate-45" : "rotate-45")}>➜</span>
                </div>
            )}
            {!trendVal && <span className="text-xs text-gray-500">Total</span>}
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-gray-500 text-sm">{sub}</div>
    </motion.div>
);

export const AnalyticsDashboard = () => {
    const [timeRange, setTimeRange] = useState('7 Days');

    return (
        <div className="h-full w-full bg-[#090C10] text-white p-6 lg:p-8 font-sans overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        Analytics Dashboard
                        <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-full font-bold">Live</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Track your productivity trends and habit consistency</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-[#161B22] p-1 rounded-lg flex text-xs border border-white/5">
                        {['7 Days', '30 Days', 'Month', 'Year'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md transition-all font-medium",
                                    timeRange === range ? "bg-[#21262D] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#090C10]"></span>
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Completion Rate"
                    value="85%"
                    sub="Completion Rate"
                    trend="up"
                    trendVal="+12%"
                    icon={CheckCircle}
                    colorClass="bg-[#1C1F2E] text-blue-400 border border-blue-500/10"
                    delay={0.1}
                />
                <StatCard
                    title="Current Streak"
                    value="12 Days"
                    sub="Current Streak"
                    trend="up"
                    trendVal="+2 days"
                    icon={Flame}
                    colorClass="bg-[#2E1C1C] text-orange-400 border border-orange-500/10"
                    delay={0.2}
                />
                <StatCard
                    title="Focus Time"
                    value="42h"
                    sub="Focus Time"
                    trend="down"
                    trendVal="-5%"
                    icon={Timer}
                    colorClass="bg-[#1C252E] text-blue-300 border border-blue-400/10"
                    delay={0.3}
                />
                <StatCard
                    title="Tasks Completed"
                    value="143"
                    sub="Tasks Completed"
                    icon={CheckCircle}
                    colorClass="bg-[#221C2E] text-purple-400 border border-purple-500/10"
                    delay={0.4}
                />
            </div>

            {/* Middle Row Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Activity Overview */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 bg-[#161B22] p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Activity Overview</h3>
                        <select className="bg-[#0D1117] border border-gray-700 text-xs text-gray-400 rounded-lg px-3 py-1.5 focus:outline-none">
                            <option>Productivity</option>
                            <option>Focus Time</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ACTIVITY_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8b949e', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8b949e', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="current"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#161b22', stroke: '#3b82f6', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="previous"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    dot={{ r: 4, fill: '#161b22', stroke: '#8b5cf6', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Focus Areas */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-[#161B22] p-6 rounded-2xl border border-white/5 flex flex-col"
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg">Focus Areas</h3>
                        <MoreHorizontal className="text-gray-500 w-5 h-5 cursor-pointer" />
                    </div>

                    <div className="flex-1 min-h-[220px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={FOCUS_AREAS_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {FOCUS_AREAS_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {FOCUS_AREAS_DATA.map((area, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
                                <span className="text-xs text-gray-400 font-medium">{area.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Habit Performance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-[#161B22] p-6 rounded-2xl border border-white/5"
                >
                    <h3 className="font-bold text-lg mb-6">Habit Performance</h3>
                    <div className="space-y-6">
                        {HABITS_PERFORMANCE.map((habit, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#21262D] flex items-center justify-center text-gray-400">
                                    <habit.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between mb-1">
                                        <h4 className="font-bold text-sm text-gray-200">{habit.name}</h4>
                                        <span className="text-sm font-bold text-gray-200">{habit.progress}%</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">{habit.sub}</div>
                                    <div className="h-1.5 w-full bg-[#0D1117] rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", habit.color)}
                                            style={{ width: `${habit.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Consistency Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-[#161B22] p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Consistency Grid</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded bg-[#161b22] border border-[#30363d]" />
                                <div className="w-3 h-3 rounded bg-[#0e4429]" />
                                <div className="w-3 h-3 rounded bg-[#006d32]" />
                                <div className="w-3 h-3 rounded bg-[#26a641]" />
                                <div className="w-3 h-3 rounded bg-[#39d353]" />
                            </div>
                            <span>More</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end gap-1 mb-2 h-32">
                        {/* Mocking a heatmap visualization with simple columns or grid blocks */}
                        {/* Since Recharts doesn't do "Calendar Heatmap" easily, I will build a simple grid of divs similar to reference image */}
                        <div className="grid grid-cols-[repeat(14,1fr)] gap-1 w-full">
                            {Array.from({ length: 84 }).map((_, i) => {
                                // Random intensity
                                const intensity = Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0;
                                const colors = [
                                    'bg-[#21262D]', // Empty
                                    'bg-[#1e40af]', // Low (Dark Blue)
                                    'bg-[#2563eb]', // Med
                                    'bg-[#3b82f6]', // High
                                    'bg-[#60a5fa]', // Max (Light Blue)
                                ];
                                return (
                                    <div
                                        key={i}
                                        className={cn("aspect-square rounded-sm", colors[intensity])}
                                        title={`Day ${i + 1}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex justify-between px-2 text-xs text-gray-500 mt-2">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
