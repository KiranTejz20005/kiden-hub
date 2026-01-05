import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, MoreHorizontal, Calendar, Clock, CheckCircle2,
    Circle, AlertCircle, Search, Filter
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { TaskDialog } from './TaskDialog';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PageLayout } from '@/components/ui/PageLayout';
import { PageHeader } from '@/components/ui/PageHeader';

export function TaskBoard() {
    const { tasks, updateTask, deleteTask, loading } = useTasks();
    const { projects } = useProjects();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const columns = [
        { id: 'todo', label: 'To Do', icon: Circle, color: 'text-slate-500' },
        { id: 'in_progress', label: 'In Progress', icon: AlertCircle, color: 'text-blue-500' },
        { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-green-500' },
    ] as const;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (task: Task) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedTask(null);
        setIsDialogOpen(true);
    };

    return (
        <PageLayout>
            <PageHeader
                title="Tasks"
                description="Manage your daily work and projects"
                actions={
                    <Button onClick={handleCreate} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Task
                    </Button>
                }
            />

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-card/50 w-full"
                    />
                </div>
                {/* Add filters here later */}
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="h-full min-w-[768px] md:min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {columns.map(col => (
                        <div key={col.id} className="flex flex-col h-full bg-secondary/10 rounded-xl border border-border/50">
                            <div className="p-4 flex items-center gap-2 border-b border-border/50">
                                <col.icon className={cn("w-5 h-5", col.color)} />
                                <h3 className="font-semibold">{col.label}</h3>
                                <span className="ml-auto text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                                    {filteredTasks.filter(t => t.status === col.id).length}
                                </span>
                            </div>

                            <ScrollArea className="flex-1 p-3">
                                <div className="space-y-3">
                                    {filteredTasks
                                        .filter(t => t.status === col.id)
                                        .map(task => {
                                            const project = projects.find(p => p.id === task.project_id);

                                            return (
                                                <motion.div
                                                    layoutId={task.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="group relative bg-card hover:bg-card/80 border border-border/50 rounded-lg p-3 shadow-sm transition-all hover:shadow-md cursor-pointer"
                                                    onClick={() => handleEdit(task)}
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(task); }}>
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                {task.status !== 'done' && (
                                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'done' }); }}>
                                                                        Mark as Done
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {project && (
                                                            <Badge variant="secondary" className="text-[10px] bg-secondary/50" style={{ color: project.color }}>
                                                                {project.name}
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className={cn("text-[10px] capitalize", getPriorityColor(task.priority))}>
                                                            {task.priority}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                        {task.due_date && (
                                                            <div className={cn("flex items-center gap-1",
                                                                isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && "text-destructive"
                                                            )}>
                                                                <Calendar className="w-3 h-3" />
                                                                {format(new Date(task.due_date), "MMM d")}
                                                            </div>
                                                        )}
                                                        {task.estimated_minutes && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {task.estimated_minutes}m
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                </div>
                            </ScrollArea>
                        </div>
                    ))}
                </div>
            </div>

            <TaskDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        </PageLayout>
    );
}
