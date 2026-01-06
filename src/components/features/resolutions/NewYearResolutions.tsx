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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchResolutions();
    }
  }, [user, selectedYear]);

  const fetchResolutions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resolutions')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Resolutions fetch warning:', error.message);
        setResolutions([]);
        return;
      }
      setResolutions((data as Resolution[]) || []);

      // Fetch history for all resolutions
      if (data && data.length > 0) {
        const resolutionIds = data.map(r => r.id);
        const { data: historyData, error: historyError } = await supabase
          .from('resolution_history')
          .select('*')
          .in('resolution_id', resolutionIds)
          .order('created_at', { ascending: false });

        if (!historyError) {
          setHistory((historyData as ResolutionHistory[]) || []);
        }
      }
    } catch (error: any) {
      console.warn('Error fetching resolutions:', error);
      setResolutions([]);
    } finally {
      setLoading(false);
    }
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
    if (!user || !title.trim() || !targetDate) return;

    setSaving(true);
    try {
      const resolutionData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        target_date: targetDate,
        year: new Date(targetDate).getFullYear(),
      };

      if (editingResolution) {
        const { error } = await supabase
          .from('resolutions')
          .update(resolutionData)
          .eq('id', editingResolution.id);
        if (error) throw error;
        toast({ title: 'Resolution Updated' });
      } else {
        const { error } = await supabase
          .from('resolutions')
          .insert(resolutionData);
        if (error) throw error;
        toast({ title: 'Resolution Added', description: 'Good luck with your goal! 🎯' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchResolutions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteResolution = async (id: string) => {
    try {
      const { error } = await supabase
        .from('resolutions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Resolution Deleted' });
      fetchResolutions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateStatus = async (id: string, status: 'active' | 'completed' | 'abandoned') => {
    try {
      const resolution = resolutions.find(r => r.id === id);
      const { error } = await supabase
        .from('resolutions')
        .update({
          status,
          progress: status === 'completed' ? 100 : resolution?.progress
        })
        .eq('id', id);
      if (error) throw error;

      if (status === 'completed') {
        toast({ title: '🎉 Congratulations!', description: 'You completed your resolution!' });
      }
      fetchResolutions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openProgressDialog = (resolution: Resolution) => {
    setProgressResolution(resolution);
    setNewProgress(resolution.progress);
    setProgressNote('');
    setProgressDialogOpen(true);
  };

  const updateProgress = async () => {
    if (!progressResolution || !user) return;

    setSaving(true);
    try {
      // Update resolution progress
      const { error: updateError } = await supabase
        .from('resolutions')
        .update({
          progress: newProgress,
          status: newProgress >= 100 ? 'completed' : progressResolution.status
        })
        .eq('id', progressResolution.id);
      if (updateError) throw updateError;

      // Add history entry
      const { error: historyError } = await supabase
        .from('resolution_history')
        .insert({
          resolution_id: progressResolution.id,
          user_id: user.id,
          progress: newProgress,
          previous_progress: progressResolution.progress,
          note: progressNote.trim() || null,
        });
      if (historyError) throw historyError;

      toast({
        title: 'Progress Updated',
        description: newProgress >= 100 ? '🎉 You did it!' : 'Keep going!'
      });
      setProgressDialogOpen(false);
      fetchResolutions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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

                {/* Resolutions List */}
                <div className="space-y-3">
                  {resolutions.map((resolution) => {
                    const catData = getCategoryData(resolution.category);
                    const daysInfo = getDaysRemaining(resolution.target_date);
                    const resHistory = getResolutionHistory(resolution.id);
                    const isExpanded = expandedId === resolution.id;

                    return (
                      <motion.div
                        key={resolution.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group"
                      >
                        <Card className={cn(
                          "border-border/50 bg-card/50 backdrop-blur-sm transition-all",
                          resolution.status === 'completed' && "bg-green-500/5 border-green-500/30",
                          resolution.status === 'abandoned' && "opacity-60"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex flex-col gap-3">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                                    `bg-gradient-to-br ${catData.color}`
                                  )}>
                                    {catData.emoji}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className={cn(
                                      "font-semibold truncate",
                                      resolution.status === 'completed' && "line-through text-muted-foreground"
                                    )}>
                                      {resolution.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {catData.label}
                                      </Badge>
                                      <span className={cn(
                                        "text-xs",
                                        daysInfo.overdue ? "text-red-500" : "text-muted-foreground"
                                      )}>
                                        <Calendar className="h-3 w-3 inline mr-1" />
                                        {daysInfo.text}
                                      </span>
                                      {resolution.status !== 'active' && (
                                        <Badge variant={resolution.status === 'completed' ? 'default' : 'destructive'}>
                                          {resolution.status}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {resolution.status === 'active' && (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openProgressDialog(resolution)}>
                                        <TrendingUp className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateStatus(resolution.id, 'completed')}>
                                        <Check className="h-4 w-4 text-green-500" />
                                      </Button>
                                    </>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(resolution)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteResolution(resolution.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{resolution.progress}%</span>
                                </div>
                                <Progress value={resolution.progress} className="h-2" />
                              </div>

                              {/* Description & History Toggle */}
                              {(resolution.description || resHistory.length > 0) && (
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : resolution.id)}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  {isExpanded ? 'Hide details' : 'Show details'}
                                  {resHistory.length > 0 && ` (${resHistory.length} updates)`}
                                </button>
                              )}

                              {/* Expanded Content */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    {resolution.description && (
                                      <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                                        {resolution.description}
                                      </p>
                                    )}

                                    {resHistory.length > 0 && (
                                      <div className="border-t border-border/50 pt-3">
                                        <h4 className="text-xs font-medium flex items-center gap-1 mb-2">
                                          <History className="h-3 w-3" />
                                          Progress History
                                        </h4>
                                        <ScrollArea className="max-h-32">
                                          <div className="space-y-2">
                                            {resHistory.map(h => (
                                              <div key={h.id} className="flex items-start gap-2 text-xs">
                                                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                      {h.previous_progress}% → {h.progress}%
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                      {format(parseISO(h.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                  </div>
                                                  {h.note && (
                                                    <p className="text-muted-foreground mt-0.5">{h.note}</p>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </ScrollArea>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 m-0 overflow-auto">
          <div className="p-4 pt-0 space-y-4">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Resolutions</p>
                      <p className="text-3xl font-bold text-blue-500">{resolutions.length}</p>
                    </div>
                    <Flag className="h-10 w-10 text-blue-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-3xl font-bold text-green-500">{completedResolutions.length}</p>
                    </div>
                    <Award className="h-10 w-10 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                      <p className="text-3xl font-bold text-amber-500">{activeResolutions.length}</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-amber-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-red-500/10 to-rose-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Abandoned</p>
                      <p className="text-3xl font-bold text-red-500">{abandonedResolutions.length}</p>
                    </div>
                    <X className="h-10 w-10 text-red-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryStats.filter(c => c.count > 0).map(cat => (
                    <div key={cat.value} className="flex items-center gap-3">
                      <span className="text-xl w-8">{cat.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{cat.label}</span>
                          <span className="text-muted-foreground">{cat.completed}/{cat.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full bg-gradient-to-r", cat.color)}
                            style={{ width: `${cat.count > 0 ? (cat.completed / cat.count) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {categoryStats.filter(c => c.count > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No resolutions yet. Add some to see the breakdown!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Success Motivation */}
            {completedResolutions.length > 0 && (
              <Card className="border-border/50 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {completionRate >= 50 ? "🎉 Amazing progress!" : "💪 Keep pushing!"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        You've completed {completedResolutions.length} resolution{completedResolutions.length !== 1 ? 's' : ''} this year!
                        {activeResolutions.length > 0 && ` ${activeResolutions.length} more to go.`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Progress Update Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          {progressResolution && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">{progressResolution.title}</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{newProgress}%</span>
                </div>
                <Slider
                  value={[newProgress]}
                  onValueChange={(v) => setNewProgress(v[0])}
                  max={100}
                  step={5}
                />
              </div>

              <Textarea
                placeholder="Add a note about your progress (optional)"
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                className="min-h-20"
              />

              <Button onClick={updateProgress} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Progress
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
