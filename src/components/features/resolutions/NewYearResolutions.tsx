import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Plus, Trash2, Edit2, Check, X,
  ChevronDown, ChevronUp, Loader2, Target, Calendar,
  TrendingUp, Award, Flag, History, BarChart3, Sparkles
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Resolution {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: 'health' | 'career' | 'finance' | 'personal' | 'learning' | 'relationships';
  target_date: string;
  status: 'active' | 'completed' | 'abandoned';
  progress: number;
  year: number;
  created_at: string;
  updated_at: string;
}

interface ResolutionHistory {
  id: string;
  resolution_id: string;
  user_id: string;
  progress: number;
  previous_progress: number;
  note: string | null;
  created_at: string;
}

const categories = [
  { value: 'health', label: 'Health & Fitness', emoji: '💪', color: 'from-green-500 to-emerald-500' },
  { value: 'career', label: 'Career & Work', emoji: '💼', color: 'from-blue-500 to-indigo-500' },
  { value: 'finance', label: 'Finance & Wealth', emoji: '💰', color: 'from-yellow-500 to-amber-500' },
  { value: 'personal', label: 'Personal Growth', emoji: '🌱', color: 'from-purple-500 to-violet-500' },
  { value: 'learning', label: 'Learning & Skills', emoji: '📚', color: 'from-cyan-500 to-teal-500' },
  { value: 'relationships', label: 'Relationships', emoji: '❤️', color: 'from-pink-500 to-rose-500' },
];

// Local storage based implementation since tables don't exist
const STORAGE_KEY = 'kiden_resolutions';
const HISTORY_KEY = 'kiden_resolution_history';

export function NewYearResolutions() {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [history, setHistory] = useState<ResolutionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResolution, setEditingResolution] = useState<Resolution | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('personal');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Progress update state
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressResolution, setProgressResolution] = useState<Resolution | null>(null);
  const [newProgress, setNewProgress] = useState(0);
  const [progressNote, setProgressNote] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    fetchResolutions();
  }, [user, selectedYear]);

  const fetchResolutions = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      
      if (stored) {
        const all = JSON.parse(stored) as Resolution[];
        setResolutions(all.filter(r => r.year === selectedYear && r.user_id === (user?.id || 'guest')));
      }
      
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.warn('Error loading resolutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToStorage = (newResolutions: Resolution[]) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) as Resolution[] : [];
    const filtered = all.filter(r => !(r.year === selectedYear && r.user_id === (user?.id || 'guest')));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtered, ...newResolutions]));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('personal');
    setTargetDate('');
    setEditingResolution(null);
  };

  const openEditDialog = (resolution: Resolution) => {
    setEditingResolution(resolution);
    setTitle(resolution.title);
    setDescription(resolution.description || '');
    setCategory(resolution.category);
    setTargetDate(resolution.target_date);
    setIsDialogOpen(true);
  };

  const saveResolution = async () => {
    if (!title.trim() || !targetDate) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      
      if (editingResolution) {
        const updated = resolutions.map(r => 
          r.id === editingResolution.id 
            ? { ...r, title: title.trim(), description: description.trim() || null, category: category as Resolution['category'], target_date: targetDate, updated_at: now }
            : r
        );
        setResolutions(updated);
        saveToStorage(updated);
        toast.success('Resolution Updated');
      } else {
        const newResolution: Resolution = {
          id: crypto.randomUUID(),
          user_id: user?.id || 'guest',
          title: title.trim(),
          description: description.trim() || null,
          category: category as Resolution['category'],
          target_date: targetDate,
          status: 'active',
          progress: 0,
          year: new Date(targetDate).getFullYear(),
          created_at: now,
          updated_at: now
        };
        const updated = [...resolutions, newResolution];
        setResolutions(updated);
        saveToStorage(updated);
        toast.success('Resolution Added! Good luck with your goal! 🎯');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteResolution = async (id: string) => {
    const updated = resolutions.filter(r => r.id !== id);
    setResolutions(updated);
    saveToStorage(updated);
    toast.success('Resolution Deleted');
  };

  const updateStatus = async (id: string, status: 'active' | 'completed' | 'abandoned') => {
    const updated = resolutions.map(r => 
      r.id === id 
        ? { ...r, status, progress: status === 'completed' ? 100 : r.progress, updated_at: new Date().toISOString() }
        : r
    );
    setResolutions(updated);
    saveToStorage(updated);
    
    if (status === 'completed') {
      toast.success('🎉 Congratulations! You completed your resolution!');
    }
  };

  const openProgressDialog = (resolution: Resolution) => {
    setProgressResolution(resolution);
    setNewProgress(resolution.progress);
    setProgressNote('');
    setProgressDialogOpen(true);
  };

  const updateProgress = async () => {
    if (!progressResolution) return;

    setSaving(true);
    try {
      const updated = resolutions.map(r => 
        r.id === progressResolution.id 
          ? { ...r, progress: newProgress, status: newProgress >= 100 ? 'completed' as const : r.status, updated_at: new Date().toISOString() }
          : r
      );
      setResolutions(updated);
      saveToStorage(updated);

      // Add history entry
      const historyEntry: ResolutionHistory = {
        id: crypto.randomUUID(),
        resolution_id: progressResolution.id,
        user_id: user?.id || 'guest',
        progress: newProgress,
        previous_progress: progressResolution.progress,
        note: progressNote.trim() || null,
        created_at: new Date().toISOString()
      };
      const newHistory = [...history, historyEntry];
      setHistory(newHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

      toast.success(newProgress >= 100 ? '🎉 You did it!' : 'Progress Updated! Keep going!');
      setProgressDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const getResolutionHistory = (resolutionId: string) => {
    return history.filter(h => h.resolution_id === resolutionId);
  };

  const getDaysRemaining = (targetDate: string) => {
    const days = differenceInDays(parseISO(targetDate), new Date());
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, overdue: true };
    if (days === 0) return { text: 'Due today!', overdue: false };
    return { text: `${days} days left`, overdue: false };
  };

  const getCategoryData = (categoryValue: string) => {
    return categories.find(c => c.value === categoryValue) || categories[3];
  };

  // Analytics calculations
  const activeResolutions = resolutions.filter(r => r.status === 'active');
  const completedResolutions = resolutions.filter(r => r.status === 'completed');
  const abandonedResolutions = resolutions.filter(r => r.status === 'abandoned');
  const avgProgress = resolutions.length > 0
    ? Math.round(resolutions.reduce((acc, r) => acc + r.progress, 0) / resolutions.length)
    : 0;
  const completionRate = resolutions.length > 0
    ? Math.round((completedResolutions.length / resolutions.length) * 100)
    : 0;

  // Category breakdown
  const categoryStats = categories.map(cat => ({
    ...cat,
    count: resolutions.filter(r => r.category === cat.value).length,
    completed: resolutions.filter(r => r.category === cat.value && r.status === 'completed').length,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      <Tabs defaultValue="resolutions" className="h-full flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 pt-4 pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <TabsList className="bg-secondary/50 w-full sm:w-auto">
              <TabsTrigger value="resolutions" className="gap-2 flex-1 sm:flex-none">
                <Rocket className="h-4 w-4" />
                <span className="hidden xs:inline">Resolutions</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 flex-1 sm:flex-none">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden xs:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-full sm:w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Resolution</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {editingResolution ? 'Edit Resolution' : 'New Year Resolution'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="What do you want to achieve? *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <Textarea
                  placeholder="Describe your goal in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-20"
                />

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                          category === cat.value
                            ? `bg-gradient-to-r ${cat.color} text-white`
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        <span>{cat.emoji}</span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Target Date *</label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>

                <Button onClick={saveResolution} disabled={saving || !title.trim() || !targetDate} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingResolution ? 'Update Resolution' : 'Add Resolution'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Resolutions Tab */}
        <TabsContent value="resolutions" className="flex-1 m-0 overflow-auto">
          <div className="p-4 pt-0 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : resolutions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Rocket className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Resolutions for {selectedYear}</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Set your goals and track your progress throughout the year
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Resolution
                </Button>
              </div>
            ) : (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Active</p>
                          <p className="text-2xl font-bold text-blue-500">{activeResolutions.length}</p>
                        </div>
                        <Target className="h-8 w-8 text-blue-500/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold text-green-500">{completedResolutions.length}</p>
                        </div>
                        <Check className="h-8 w-8 text-green-500/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Progress</p>
                          <p className="text-2xl font-bold text-purple-500">{avgProgress}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-500/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Success Rate</p>
                          <p className="text-2xl font-bold text-amber-500">{completionRate}%</p>
                        </div>
                        <Award className="h-8 w-8 text-amber-500/50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Resolution Cards */}
                <ScrollArea className="flex-1">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {resolutions.map((resolution, index) => {
                        const catData = getCategoryData(resolution.category);
                        const daysInfo = getDaysRemaining(resolution.target_date);
                        const isExpanded = expandedId === resolution.id;
                        const resHistory = getResolutionHistory(resolution.id);

                        return (
                          <motion.div
                            key={resolution.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className={cn(
                              "border-border/50 overflow-hidden transition-all",
                              resolution.status === 'completed' && "border-green-500/30 bg-green-500/5",
                              resolution.status === 'abandoned' && "opacity-60"
                            )}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl bg-gradient-to-br",
                                    catData.color
                                  )}>
                                    {catData.emoji}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h3 className={cn(
                                          "font-semibold",
                                          resolution.status === 'completed' && "line-through text-muted-foreground"
                                        )}>
                                          {resolution.title}
                                        </h3>
                                        {resolution.description && (
                                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                            {resolution.description}
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        {resolution.status === 'active' && (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => openEditDialog(resolution)}
                                            >
                                              <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-green-500 hover:text-green-600"
                                              onClick={() => updateStatus(resolution.id, 'completed')}
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
                                          onClick={() => deleteResolution(resolution.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                      <Badge variant="secondary" className="text-xs">
                                        {catData.label}
                                      </Badge>
                                      <Badge
                                        variant={resolution.status === 'completed' ? 'default' : 'outline'}
                                        className={cn(
                                          "text-xs",
                                          resolution.status === 'completed' && "bg-green-500",
                                          resolution.status === 'abandoned' && "text-muted-foreground"
                                        )}
                                      >
                                        {resolution.status}
                                      </Badge>
                                      <span className={cn(
                                        "text-xs flex items-center gap-1",
                                        daysInfo.overdue ? "text-destructive" : "text-muted-foreground"
                                      )}>
                                        <Calendar className="h-3 w-3" />
                                        {daysInfo.text}
                                      </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">Progress</span>
                                        <span className="text-xs font-medium">{resolution.progress}%</span>
                                      </div>
                                      <Progress value={resolution.progress} className="h-2" />
                                      {resolution.status === 'active' && (
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="p-0 h-auto mt-1 text-xs"
                                          onClick={() => openProgressDialog(resolution)}
                                        >
                                          Update Progress
                                        </Button>
                                      )}
                                    </div>

                                    {/* Expand/Collapse History */}
                                    {resHistory.length > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-3 text-xs"
                                        onClick={() => setExpandedId(isExpanded ? null : resolution.id)}
                                      >
                                        <History className="h-3 w-3 mr-1" />
                                        {resHistory.length} update{resHistory.length > 1 ? 's' : ''}
                                        {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                                      </Button>
                                    )}

                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                                            {resHistory.slice(0, 5).map(h => (
                                              <div key={h.id} className="flex items-start gap-2 text-xs">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <div>
                                                  <span className="text-muted-foreground">
                                                    {format(parseISO(h.created_at), 'MMM d, yyyy')}
                                                  </span>
                                                  <span className="mx-1">—</span>
                                                  <span className="text-green-500">+{h.progress - h.previous_progress}%</span>
                                                  {h.note && <p className="text-muted-foreground mt-0.5">{h.note}</p>}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 m-0 overflow-auto">
          <div className="p-4 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStats.filter(c => c.count > 0).map(cat => (
                    <div key={cat.value}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{cat.emoji}</span>
                          <span className="text-sm font-medium">{cat.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {cat.completed}/{cat.count} completed
                        </span>
                      </div>
                      <Progress
                        value={cat.count > 0 ? (cat.completed / cat.count) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  ))}
                  {categoryStats.every(c => c.count === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No resolutions yet. Add some to see analytics!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Progress Update Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm mb-2 block">Progress: {newProgress}%</label>
              <Slider
                value={[newProgress]}
                onValueChange={(v) => setNewProgress(v[0])}
                max={100}
                step={5}
              />
            </div>
            <Input
              placeholder="Add a note (optional)"
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
            />
            <Button onClick={updateProgress} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Progress
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
