import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'primary';
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
  color = 'emerald', 
  change, 
  trend, 
  progress,
  delay = 0 
}: StatsCardProps) => {
  
  const colorMap = {
    blue: 'from-blue-500/20 to-teal-500/5 text-blue-400 border-blue-500/20',
    emerald: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/20',
    purple: 'from-purple-500/20 to-emerald-500/5 text-purple-400 border-purple-500/20',
    amber: 'from-amber-500/20 to-orange-500/5 text-amber-400 border-amber-500/20',
    rose: 'from-rose-500/20 to-pink-500/5 text-rose-400 border-rose-500/20',
    primary: 'from-primary/20 to-accent/5 text-primary border-primary/20',
  };

  const glowMap = {
    blue: 'bg-blue-500/5',
    emerald: 'bg-emerald-500/5',
    purple: 'bg-purple-500/5',
    amber: 'bg-amber-500/5',
    rose: 'bg-rose-500/5',
    primary: 'bg-primary/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative bg-[#050505] rounded-3xl p-6 border border-white/5 hover:border-primary/20 transition-all duration-300 overflow-hidden shadow-2xl"
    >
      {/* Background Glow */}
      <div className={cn("absolute -right-4 -bottom-4 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full", glowMap[color])} />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className={cn("p-3 rounded-2xl bg-gradient-to-br border shadow-sm transition-transform duration-500 group-hover:scale-110", colorMap[color])}>
            <Icon className="w-6 h-6" />
          </div>
          
          {change && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase",
              trend === 'up' ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-400"
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-gray-500 text-xs font-black uppercase tracking-[0.15em] mb-1">{label}</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
            {subValue && <span className="text-[10px] font-bold text-gray-600 truncate uppercase tracking-widest">{subValue}</span>}
          </div>
        </div>

        {progress !== undefined && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-600">
              <span>Usage</span>
              <span className="text-white">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: delay + 0.5 }}
                className={cn(
                  "h-full rounded-full bg-gradient-to-r",
                  color === 'primary' ? "from-primary to-accent" : "from-emerald-500 to-teal-500"
                )}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
