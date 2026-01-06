import { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon, Clock, Tag, Flag,
    CheckCircle2, AlertCircle, Folder, type LucideIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: Task | null;
    onClose: () => void;
}

const priorities = [
    { value: 'low', label: 'Low', color: 'bg-slate-500/10 text-slate-500' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-500/10 text-blue-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500/10 text-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500/10 text-red-500' },
];

export function TaskDialog({ open, onOpenChange, task, onClose }: TaskDialogProps) {
    const { projects } = useProjects();
    const { createTask, updateTask } = useTasks();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState<string>('unassigned');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [status, setStatus] = useState<Task['status']>('todo');
    const [dueDate, setDueDate] = useState<Date>();
    const [estimatedMinutes, setEstimatedMinutes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setProjectId(task.project_id || 'unassigned');
            setPriority(task.priority);
            setStatus(task.status);
            setDueDate(task.due_date ? new Date(task.due_date) : undefined);
            setEstimatedMinutes(task.estimated_minutes?.toString() || '');
        } else {
            resetForm();
        }
    }, [task, open]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setProjectId('unassigned');
        setPriority('medium');
        setStatus('todo');
        setDueDate(undefined);
        setEstimatedMinutes('');
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setSaving(true);

        const taskData: Partial<Task> = {
            title: title.trim(),
            description: description.trim() || null,
            project_id: projectId === 'unassigned' ? null : projectId,
            priority,
            status,
            due_date: dueDate ? dueDate.toISOString() : null,
            estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        };

        try {
            if (task) {
                await updateTask(task.id, taskData);
            } else {
                await createTask(taskData);
            }
            onOpenChange(false);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                    <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Input
                            placeholder="Task title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-medium border-transparent bg-transparent hover:bg-secondary/20 focus:bg-secondary/30 transition-colors px-2 -mx-2 h-auto py-2"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue placeholder="Project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">No Project</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                            {p.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {priorities.map(p => (
                                    <SelectItem key={p.value} value={p.value}>
                                        <div className="flex items-center gap-2">
                                            <Flag className={cn("w-3 h-3", p.color.split(' ')[1])} />
                                            {p.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                    {dueDate ? format(dueDate, "MMM d") : "Due date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <Input
                                type="number"
                                placeholder="Est. min"
                                value={estimatedMinutes}
                                onChange={(e) => setEstimatedMinutes(e.target.value)}
                                className="w-20 h-8 text-xs"
                            />
                        </div>
                    </div>

                    <Textarea
                        placeholder="Description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[150px] resize-none border-transparent bg-secondary/10 focus:bg-secondary/20"
                    />
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!title.trim() || saving}>
                        {saving ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
