import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Plus, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface TaskItem {
    id: string;
    title: string;
    completed: boolean;
    tag?: string;
    priority?: 'low' | 'medium' | 'high';
    dueTime?: string;
}

interface UpcomingTasksProps {
    tasks: TaskItem[];
    onToggle: (id: string, status: boolean) => void;
}

export const UpcomingTasks = ({ tasks, onToggle }: UpcomingTasksProps) => {
    // Sort: Uncompleted first
    const sortedTasks = [...tasks].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#161B22] rounded-2xl border border-white/5 flex flex-col h-full overflow-hidden"
        >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#161B22] z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold leading-tight">Tasks</h3>
                        <p className="text-xs text-gray-400">Today's Focus</p>
                    </div>
                </div>
                <button className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/5 text-gray-400 transition-colors">
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                        <AnimatePresence initial={false}>
                            {sortedTasks.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-gray-500 gap-2">
                                    <Clock className="w-8 h-8 opacity-20" />
                                    <span className="text-sm">No active tasks</span>
                                </div>
                            ) : (
                                sortedTasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        onClick={() => onToggle(task.id, !task.completed)}
                                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${task.completed
                                                ? 'bg-transparent border-transparent opacity-50'
                                                : 'bg-[#0D1117] border-white/5 hover:border-white/10 hover:bg-[#1C2128]'
                                            }`}
                                    >
                                        <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${task.completed
                                                ? 'bg-blue-500 border-blue-500 text-black'
                                                : 'border-gray-600 group-hover:border-blue-500 text-transparent'
                                            }`}>
                                            <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate transition-colors ${task.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {task.tag && (
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                        <Tag className="w-3 h-3" /> {task.tag}
                                                    </span>
                                                )}
                                                {task.dueTime && (
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {task.dueTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {task.priority === 'high' && !task.completed && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>

                {/* Gradient fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#161B22] to-transparent pointer-events-none" />
            </div>
        </motion.div>
    );
};
