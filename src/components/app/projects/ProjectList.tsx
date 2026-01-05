import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Folder, Plus, MoreVertical, Calendar, CheckSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Project } from '@/lib/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { PageLayout } from '@/components/ui/PageLayout';
import { PageHeader } from '@/components/ui/PageHeader';

export function ProjectList() {
    const { projects, createProject, deleteProject, refreshProjects } = useProjects();
    const { tasks } = useTasks();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectColor, setNewProjectColor] = useState('#10B981');

    const colors = [
        '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'
    ];

    const handleCreate = async () => {
        if (!newProjectName.trim()) return;
        await createProject({
            name: newProjectName,
            color: newProjectColor,
            status: 'active'
        });
        setNewProjectName('');
        setIsDialogOpen(false);
        await refreshProjects();
    };

    return (
        <PageLayout>
            <PageHeader
                title="Projects"
                description="Keep your goals organized"
                actions={
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Project
                    </Button>
                }
            />

            {projects.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                    <Folder className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Create your first project to start organizing your tasks</p>
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Project
                    </Button>
                </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => {
                    const projectTasks = tasks.filter(t => t.project_id === project.id);
                    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                    const progress = projectTasks.length > 0
                        ? Math.round((completedTasks / projectTasks.length) * 100)
                        : 0;

                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group bg-card hover:bg-card/80 border border-border/50 rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg"
                                        style={{ backgroundColor: project.color }}
                                    >
                                        <Folder className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg leading-none mb-1">{project.name}</h3>
                                        <p className="text-xs text-muted-foreground">{projectTasks.length} tasks</p>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => deleteProject(project.id)}
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="space-y-4">
                                {project.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                                )}

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-medium">
                                        <span className="text-muted-foreground">{progress}% Complete</span>
                                        <span className="text-muted-foreground">{completedTasks}/{projectTasks.length}</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(project.created_at), "MMM d, yyyy")}
                                    </div>
                                    {project.target_date && (
                                        <div className="flex items-center gap-1 text-primary">
                                            <CheckSquare className="w-3 h-3" />
                                            Target: {format(new Date(project.target_date), "MMM d")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Project Name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                        />

                        <div>
                            <label className="text-sm font-medium mb-2 block">Color</label>
                            <div className="flex gap-2">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                                            newProjectColor === color && "ring-2 ring-offset-2 ring-primary"
                                        )}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewProjectColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newProjectName.trim()}>Create Project</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
