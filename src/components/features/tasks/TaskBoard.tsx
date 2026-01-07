import { useState, useMemo } from 'react';
import {
    Plus, Check, AlertCircle, FileText, CheckCircle2,
    Calendar, Target, Search, Bell, Clock, Trash2
} from 'lucide-react';
import { format, subDays, isSameDay, parseISO, startOfWeek, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { TaskDialog } from './TaskDialog';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

export function TaskBoard() {
    const { tasks, updateTask, deleteTask } = useTasks();
    const { projects } = useProjects();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Filter tasks
    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pendingTasks = filteredTasks.filter(t => t.status !== 'done');
    const doneTasks = filteredTasks.filter(t => t.status === 'done');

    // Stats Calculations - REAL DATA
    const totalToday = tasks.length || 0;
    const completedToday = doneTasks.length;
    const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
    const tasksLoad = pendingTasks.length > 5 ? 'High Load' : 'On Track';

    // 1. Weekly Activity (Last 7 Days) - Calculated from tasks
    const weeklyStats = useMemo(() => {
        const stats = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            // Count tasks completed on this date
            // Note: In real app, 'updated_at' might change on unrelated edits. 
            // Ideally we use a 'completed_at' field. For now, using updated_at if status is 'done'.
            const count = tasks.filter(t =>
                t.status === 'done' &&
                isSameDay(parseISO(t.updated_at), date)
            ).length;
            stats.push(count);
        }
        return stats;
    }, [tasks]);
    const maxActivity = Math.max(...weeklyStats, 1); // Avoid div by zero

    // 2. Consistency Calendar (Current Week)
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const calendarDays = useMemo(() => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
        return Array.from({ length: 14 }).map((_, i) => { // 2 weeks view
            const date = addDays(start, i - 7); // Previous week + current week
            const isFuture = date > new Date();
            const hasDoneTasks = tasks.some(t => t.status === 'done' && isSameDay(parseISO(t.updated_at), date));
            const isTodayDate = isSameDay(date, new Date());

            let status = 'inactive';
            if (isTodayDate) status = 'selected';
            else if (hasDoneTasks) status = 'success';

            return {
                day: format(date, 'd'),
                status,
                date: date
            };
        });
    }, [tasks]);

    // Priority color mapping
    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'high': return { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500', icon: AlertCircle };
            case 'urgent': return { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500', icon: AlertCircle };
            case 'medium': return { bg: 'bg-orange-500/10', text: 'text-orange-500', dot: 'bg-orange-500', icon: Clock };
            default: return { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500', icon: FileText };
        }
    };

    const handleCreate = () => {
        setSelectedTask(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    return (
        <div className="h-full w-full bg-[#090C10] text-white p-4 sm:p-6 lg:p-8 font-sans overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">My Tasks</h1>
                    <span className="bg-[#1C2333] text-green-500 text-xs font-semibold px-2 py-1 rounded">
                        {format(new Date(), 'MMMM d')}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#161B22] border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-300"
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Button onClick={handleCreate} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-lg font-medium whitespace-nowrap">
                            <Plus className="w-4 h-4" /> New Task
                        </Button>
                    </div>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {/* 1. Pending Tasks */}
                <div className="bg-[#161B22] rounded-2xl p-6 border border-white/5 relative group hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0D1117] border border-white/5 flex items-center justify-center text-orange-400">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="flex items-center text-green-400 text-xs font-bold gap-1 bg-green-400/10 px-2 py-1 rounded-full">
                            {tasksLoad}
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{pendingTasks.length}</div>
                    <div className="text-gray-500 text-sm">Tasks Pending</div>
                </div>

                {/* 2. Completion Rate */}
                <div className="bg-[#161B22] rounded-2xl p-6 border border-white/5 relative group hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#0D1117] border border-white/5 flex items-center justify-center text-blue-400 mb-4">
                        <CheckCircleIcon className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{progressPercent}%</div>
                    <div className="text-gray-500 text-sm">Completion Rate</div>
                </div>

                {/* 3. Completed Today */}
                <div className="bg-[#161B22] rounded-2xl p-6 border border-white/5 relative group hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#0D1117] border border-white/5 flex items-center justify-center text-green-400 mb-4">
                        <TrophyIcon className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{completedToday}</div>
                    <div className="text-gray-500 text-sm">Tasks Done</div>
                </div>

                {/* 4. Daily Focus (Blue Card) */}
                <div className="bg-blue-600 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-blue-900/20">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Daily Focus</h3>
                        <p className="text-blue-100 text-sm">
                            {completedToday > 0 ? "You're making progress!" : "Let's get started!"}
                        </p>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between text-xs text-white mb-2 font-medium">
                            <span>{completedToday}/{totalToday} Tasks</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-blue-800/50 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-8">
                {/* Left Column: Tasks List */}
                <div className="min-w-0">
                    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold">Active Tasks</h2>
                        <div className="bg-[#161B22] p-1 rounded-lg flex text-xs border border-white/5">
                            <span className="px-3 py-1 bg-[#21262D] text-white rounded font-medium shadow-sm">All</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode='popLayout'>
                            {pendingTasks.length === 0 && doneTasks.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="text-center py-16 text-gray-500 bg-[#161B22] rounded-2xl border border-dashed border-white/5"
                                >
                                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">No tasks found</p>
                                    <Button onClick={handleCreate} variant="link" className="text-blue-500">Create one +</Button>
                                </motion.div>
                            )}

                            {pendingTasks.length === 0 && doneTasks.length > 0 && (
                                <div className="text-center py-8 text-gray-500 bg-[#161B22] rounded-2xl border border-dashed border-white/5 mb-4">
                                    <p>All pending tasks completed!</p>
                                </div>
                            )}

                            {pendingTasks.map(task => {
                                const styles = getPriorityStyles(task.priority);
                                const Icon = styles.icon;
                                const project = projects.find(p => p.id === task.project_id);

                                return (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        onClick={() => handleEdit(task)}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="group bg-[#161B22] p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-gray-700 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        {/* Hover Highlight Line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className={`w-12 h-12 rounded-xl bg-[#0D1117] flex items-center justify-center shrink-0 ${styles.text}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-white truncate">{task.title}</h3>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                {project && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.color }}></span>
                                                        {project.name}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                    {task.due_date && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                            {format(new Date(task.due_date), 'MMM d, h:mm a')}
                                                        </>
                                                    )}
                                                    {task.estimated_minutes && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                            {task.estimated_minutes} min
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                                className="p-2 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'done' }); }}
                                                className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-green-500 hover:text-black hover:border-green-500 transition-all group-hover:scale-105"
                                                title="Mark as Done"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Done Tasks Header */}
                            {doneTasks.length > 0 && (
                                <div className="pt-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-px bg-white/10 flex-1" />
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Completed Today</span>
                                        <div className="h-px bg-white/10 flex-1" />
                                    </div>

                                    <div className="space-y-4">
                                        {doneTasks.map(task => (
                                            <div key={task.id} className="bg-[#161B22]/50 p-4 rounded-xl border border-white/5 flex items-center gap-4 group opacity-75 hover:opacity-100 transition-opacity">
                                                <div className="w-12 h-12 rounded-xl bg-[#0D1117] flex items-center justify-center text-green-500">
                                                    <CheckCircleIcon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-400 line-through decoration-gray-600 truncate">{task.title}</h3>
                                                    <p className="text-xs text-gray-600">Completed</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                                    className="p-2 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => updateTask(task.id, { status: 'todo' })}
                                                    className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-black transition-colors"
                                                    title="Undo"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Widgets */}
                <div className="space-y-6 min-w-0">
                    {/* Consistency Calendar - Now REAL Data */}
                    <div className="bg-[#161B22] rounded-2xl p-6 border border-white/5">
                        <h3 className="font-bold text-white mb-4">Consistency</h3>
                        <div className="grid grid-cols-7 gap-2 text-center mb-2">
                            {weekDays.map((d, i) => <span key={i} className="text-xs text-gray-500 font-medium">{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-2 justify-center">
                            {calendarDays.map((d, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all",
                                        d.status === 'success' ? "bg-green-500 text-black font-bold" :
                                            d.status === 'selected' ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20" :
                                                "text-gray-600 hover:bg-[#21262D]"
                                    )}
                                    title={format(d.date, 'MMM d yyyy')}
                                >
                                    {d.day}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Next Priority Task */}
                    <div className="bg-[#482880] rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <h3 className="font-bold text-white">Next Up</h3>
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                                <Target className="w-4 h-4" />
                            </div>
                        </div>
                        {pendingTasks[0] ? (
                            <div className="relative z-10">
                                <div className="text-2xl font-bold text-white mb-1 tracking-tight line-clamp-2">{pendingTasks[0].title}</div>
                                <p className="text-purple-200 text-sm mb-6 line-clamp-1">{pendingTasks[0].description || 'Get this done today!'}</p>
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-white text-purple-900 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-50 transition-colors">Start Now</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-purple-200 py-4 relative z-10 flex flex-col gap-2">
                                <p>All tasks completed!</p>
                                <Button className="bg-white/20 hover:bg-white/30 text-white" onClick={handleCreate}>Add New</Button>
                            </div>
                        )}
                    </div>

                    {/* Weekly Activity - Now REAL Data */}
                    <div className="bg-[#161B22] rounded-2xl p-6 border border-white/5 h-[240px] flex flex-col">
                        <div className="flex justify-between items-center mb-auto">
                            <h3 className="font-bold text-white text-sm">Weekly Activity</h3>
                            <span className="text-xs text-gray-500">Last 7 days</span>
                        </div>

                        <div className="flex items-end justify-between gap-2 h-32">
                            {weeklyStats.map((count, i) => (
                                <div key={i} className="w-full bg-[#0D1117] rounded-sm h-full flex items-end group relative">
                                    <div
                                        className={cn(
                                            "w-full rounded-sm transition-all duration-1000",
                                            i === 6 ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-blue-500/20 hover:bg-blue-500/40"
                                        )}
                                        style={{ height: `${(count / maxActivity) * 100}%` }}
                                    />
                                    {/* Tooltip */}
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                        {count} tasks
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <TaskDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        </div>
    );
}
