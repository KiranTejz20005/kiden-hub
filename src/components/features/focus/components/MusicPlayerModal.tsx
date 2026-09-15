import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LofiPlayer } from './LofiPlayer';

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicPlayerModal: React.FC<MusicPlayerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl max-h-[90vh] bg-[#10101a]/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">Lo-Fi Radio & Beats</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto scrollbar-hide">
            <LofiPlayer />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
