import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Trash2,
  PenLine,
  CheckSquare,
  Plus,
  Square,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchFocusTasks,
  createFocusTask,
  toggleFocusTask,
  deleteFocusTask,
  fetchFocusScratchpadNote,
  saveFocusScratchpadNote,
  FocusTaskItem,
} from '@/services/focusService';
import { toast } from 'sonner';

interface NotepadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotepadDrawer = ({ isOpen, onClose }: NotepadDrawerProps) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  const [activeTab, setActiveTab] = useState<'tasks' | 'scratchpad'>('tasks');

  // Tasks state
  const [tasks, setTasks] = useState<FocusTaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Scratchpad state
  const [content, setContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load tasks and scratchpad from database on open
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoadingTasks(true);
      try {
        const [loadedTasks, loadedNote] = await Promise.all([
          fetchFocusTasks(userId),
          fetchFocusScratchpadNote(userId),
        ]);
        setTasks(loadedTasks);
        setContent(loadedNote);
      } catch (err) {
        console.error('Error loading focus drawer data:', err);
      } finally {
        setLoadingTasks(false);
      }
    };

    loadData();
  }, [isOpen, userId]);

  // Debounced note save to database
  const handleContentChange = (newText: string) => {
    setContent(newText);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveFocusScratchpadNote(userId, newText);
    }, 800);
  };

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const title = newTaskTitle.trim();
    setNewTaskTitle('');

    const created = await createFocusTask(userId, title);
    if (created) {
      setTasks((prev) => [created, ...prev]);
      toast.success('Task added to daily list');
    }
  };

  // Toggle Task Status
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const isDone = currentStatus === 'todo';
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: isDone ? 'done' : 'todo' } : t))
    );

    await toggleFocusTask(taskId, userId, isDone);
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await deleteFocusTask(taskId, userId);
    toast.success('Task removed');
  };

  // Scratchpad actions
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Notes copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearNote = async () => {
    if (window.confirm('Clear scratchpad notes?')) {
      setContent('');
      await saveFocusScratchpadNote(userId, '');
      toast.success('Scratchpad cleared');
    }
  };

  if (!isOpen) return null;

  const completedCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -25, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -25, scale: 0.95 }}
        className="fixed bottom-24 left-20 sm:left-24 z-[70] w-[340px] sm:w-[410px] h-[500px] bg-[#101018]/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Top Header with Tab Switcher */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-white/[0.03]">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-emerald-500 text-black shadow-sm shadow-emerald-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Daily Tasks</span>
              {tasks.length > 0 && (
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'tasks' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {completedCount}/{tasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('scratchpad')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'scratchpad'
                  ? 'bg-emerald-500 text-black shadow-sm shadow-emerald-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Scratchpad</span>
            </button>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1">
            {activeTab === 'scratchpad' && (
              <>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Copy notes"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleClearNote}
                  className="p-1.5 rounded-lg text-white/60 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Clear notes"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Daily Tasks (To-Do List with Supabase CRUD) */}
        {activeTab === 'tasks' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {/* Add Task Input Form */}
            <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a new daily task..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
              {loadingTasks ? (
                <div className="h-full flex items-center justify-center text-xs text-white/40">
                  <span>Loading tasks from database...</span>
                </div>
              ) : tasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40 space-y-2">
                  <CheckSquare className="w-8 h-8 text-white/20" />
                  <p className="text-xs font-medium text-white/60">No daily tasks yet.</p>
                  <p className="text-[11px] text-white/40">Add your top priorities for today above!</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-white/[0.02] border-white/5 text-white/40'
                          : 'bg-white/[0.05] border-white/10 text-white/90 hover:border-white/20'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className="flex items-center gap-2.5 flex-1 text-left cursor-pointer min-w-0"
                      >
                        {isDone ? (
                          <div className="w-4 h-4 rounded bg-emerald-500 text-black flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <Square className="w-4 h-4 text-white/40 hover:text-emerald-400 flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            isDone ? 'line-through text-white/40' : 'text-white/90'
                          }`}
                        >
                          {task.title}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-white/30 hover:text-rose-400 transition-colors ml-2 cursor-pointer flex-shrink-0"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Task footer */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 font-mono">
              <span>Synced with database</span>
              <span className="text-emerald-400 font-semibold">{completedCount} completed</span>
            </div>
          </div>
        )}

        {/* Tab 2: Scratchpad Notes (Supabase notes CRUD) */}
        {activeTab === 'scratchpad' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Jot down quick thoughts, parking lot items, or notes for this session..."
              className="flex-1 w-full p-4 bg-transparent resize-none outline-none font-mono text-xs text-white/90 placeholder:text-white/30 leading-relaxed scrollbar-hide"
            />
            <div className="p-2.5 border-t border-white/10 text-[10px] text-emerald-400/80 text-center font-mono flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Auto-saved to database • Markdown supported</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
