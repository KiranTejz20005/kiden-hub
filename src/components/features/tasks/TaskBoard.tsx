import { useState, useMemo } from 'react';
import {
    Plus, Check, AlertCircle, FileText, CheckCircle2,
    Calendar, Target, Search, Bell, Clock, ChevronRight, Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { TaskDialog } from './TaskDialog';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

// --- SVG Icons for Stats (Exactly from Habit Tracker) ---
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
    const { tasks, updateTask } = useTasks();
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

    // Stats
    const totalToday = tasks.length || 0;
    const completedToday = doneTasks.length;
    const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
    const tasksLoad = pendingTasks.length > 5 ? 'High Load' : 'On Track';

    // Calendar & Activity Data (Mocked for Visual Match)
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const calendarDays = useMemo(() => [
        { day: 1, status: 'inactive' }, { day: 2, status: 'inactive' }, { day: 3, status: 'success' },
        { day: 4, status: 'success' }, { day: 5, status: 'success' }, { day: 6, status: 'inactive' },
        { day: 7, status: 'success' }, { day: 8, status: 'success' }, { day: 9, status: 'success' },
        { day: 10, status: 'success' }, { day: 11, status: 'success' }, { day: 12, status: 'success' },
        { day: 13, status: 'success' }, { day: 14, status: 'selected' },
    ], []);
    const weeklyActivity = [30, 50, 45, 80, 60, 40, 75];

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
                        <button className="relative p-2 text-gray-400 hover:text-white shrink-0">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#090C10]"></span>
                        </button>
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
                        <p className="text-blue-100 text-sm">You're crushing it today!</p>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between text-xs text-white mb-2 font-medium">
                            <span>{completedToday}/{totalToday} Tasks</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-blue-800/50 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
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
                            <button className="px-3 py-1 bg-[#21262D] text-white rounded font-medium shadow-sm">All</button>
                            <button className="px-3 py-1 text-gray-500 hover:text-gray-300">Pending</button>
                            <button className="px-3 py-1 text-gray-500 hover:text-gray-300">Completed</button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pendingTasks.length === 0 && (
                            <div className="text-center py-16 text-gray-500 bg-[#161B22] rounded-2xl border border-dashed border-white/5">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">All caught up!</p>
                                <p className="text-sm mt-1">No pending tasks for today.</p>
                            </div>
                        )}

                        {pendingTasks.map(task => {
                            const styles = getPriorityStyles(task.priority);
                            const Icon = styles.icon;
                            const project = projects.find(p => p.id === task.project_id);

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => handleEdit(task)}
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
                                                        {format(new Date(task.due_date), 'h:mm a')}
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
                                    <div className="flex items-center gap-3 shrink-0">
                                        {task.status === 'in_progress' && (
                                            <span className="text-xs font-medium text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded hidden sm:inline-block border border-orange-400/20">
                                                In Progress
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'done' }); }}
                                            className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-green-500 hover:text-black hover:border-green-500 transition-all group-hover:scale-105"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
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
                                                <p className="text-xs text-gray-600">Completed today</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Widgets */}
                <div className="space-y-6 min-w-0">
                    {/* Consistency Calendar */}
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
                                    <button className="px-4 py-2.5 bg-black/20 text-purple-100 rounded-lg text-sm font-medium hover:bg-black/30 transition-colors backdrop-blur-sm">Later</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-purple-200 py-4 relative z-10">All tasks completed!</div>
                        )}
                    </div>

                    {/* Weekly Activity */}
                    <div className="bg-[#161B22] rounded-2xl p-6 border border-white/5 h-[240px] flex flex-col">
                        <div className="flex justify-between items-center mb-auto">
                            <h3 className="font-bold text-white text-sm">Weekly Activity</h3>
                            <span className="text-xs text-gray-500">Last 7 days</span>
                        </div>

                        <div className="flex items-end justify-between gap-2 h-32">
                            {weeklyActivity.map((h, i) => (
                                <div key={i} className="w-full bg-[#0D1117] rounded-sm h-full flex items-end">
                                    <div
                                        className={cn(
                                            "w-full rounded-sm transition-all duration-1000",
                                            i === 6 ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-blue-500/20 hover:bg-blue-500/40"
                                        )}
                                        style={{ height: `${h}%` }}
                                    />
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
