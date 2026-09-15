import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Trash2, PenLine } from 'lucide-react';
import { toast } from 'sonner';

interface NotepadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'kiden_focus_scratchpad_notes';

export const NotepadDrawer: React.FC<NotepadDrawerProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '### Deep Work Session Notes\n\n- [ ] Task 1: Complete module\n- [ ] Task 2: Review changes\n- Ideas:\n';
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, content);
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Notes copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Clear scratchpad?')) {
      setContent('');
      toast.success('Notes cleared');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.95 }}
        className="fixed bottom-20 left-6 z-40 w-80 sm:w-96 h-[400px] bg-[#12121e]/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">Scratchpad</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Copy notes"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-white/60 hover:text-rose-400 hover:bg-white/10 transition-colors"
              title="Clear notes"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Jot down quick thoughts, distractions to park, or session goals..."
          className="flex-1 w-full p-4 bg-transparent resize-none outline-none font-mono text-xs text-white/90 placeholder:text-white/30 leading-relaxed scrollbar-hide"
        />

        <div className="p-2.5 border-t border-white/5 text-[10px] text-white/40 text-center font-mono">
          Auto-saves locally • Markdown supported
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
