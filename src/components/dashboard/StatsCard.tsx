import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  change?: string;
  trend?: 'up' | 'down';
  progress?: number;
  delay?: number;
}

export const StatsCard = ({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  change, 
  trend, 
  progress,
  delay = 0 
}: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white/[0.02] rounded-[2rem] p-8 border border-white/5 flex flex-col gap-6 relative group hover:bg-white/[0.04] hover:border-white/10 transition-all shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-primary group-hover:bg-primary/10 transition-all">
          <Icon className="w-6 h-6" />
        </div>
        
        {change && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400 border border-emerald-500/10">
            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors mb-2">{label}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-white tracking-tight leading-none">{value}</p>
          {subValue && (
            <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">
              {subValue}
            </span>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-auto pt-4 space-y-3 relative z-10">
          <div className="h-[4px] w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, delay: delay + 0.3, ease: "circOut" }}
              className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
            />
          </div>
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
            <span className="text-primary">{Math.round(progress)}% utilized</span>
            <span>50MB Limit</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
