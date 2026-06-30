import { motion } from 'framer-motion';
import { Sparkles, Brain, Zap, ArrowRight } from 'lucide-react';

export const AIProductivityWidget = () => {
  return (
    <div className="space-y-4 pt-4 border-t border-white/[0.03]">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2 flex items-center gap-2">
        <Sparkles className="w-3 h-3 text-emerald-500" />
        AI Insights
      </h3>
      
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/10 space-y-3 relative overflow-hidden group cursor-pointer"
      >
        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
          <Brain className="w-4 h-4 text-emerald-500" />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-[11px] font-bold text-white">Focus Time Found</span>
        </div>
        
        <p className="text-[11px] text-white/40 leading-relaxed">
          You have a 3-hour open block on Tuesday afternoon. Should I schedule some flow work?
        </p>
        
        <button className="w-full h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-bold text-emerald-500 transition-all border border-emerald-500/20 flex items-center justify-center gap-2 group/btn">
          Optimize Schedule
          <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      <div className="px-2 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-medium text-white/20 uppercase tracking-widest">
          <span>Productivity Score</span>
          <span className="text-emerald-500/60">84%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '84%' }}
            className="h-full bg-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
