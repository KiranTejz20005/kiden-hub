import { motion } from 'framer-motion';
import { Zap, CheckCircle2, Droplets, TrendingUp } from 'lucide-react';

interface MetricProps {
    label: string;
    value: string;
    subValue: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: any;
    color: 'blue' | 'purple' | 'cyan' | 'orange' | 'green';
    progress?: number;
    delay: number;
}

const colorMap = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-500', bgOp: 'bg-blue-500/10' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-500', bgOp: 'bg-purple-500/10' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-500', bgOp: 'bg-cyan-500/10' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-500', bgOp: 'bg-orange-500/10' },
    green: { bg: 'bg-emerald-500', text: 'text-emerald-500', bgOp: 'bg-emerald-500/10' },
};

export const StatsCard = ({ label, value, subValue, change, trend, icon: Icon, color, progress, delay }: MetricProps) => {
    const style = colorMap[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="group relative bg-[#161B22] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${style.bgOp} ${style.text} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend === 'up' ? '+' : ''}{change}
                        <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
                    </div>
                )}
            </div>

            <div className="space-y-1 mb-4">
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                <p className="text-sm text-gray-400">{label} <span className="text-gray-600">/ {subValue}</span></p>
            </div>

            {progress !== undefined && (
                <div className="w-full bg-gray-800/50 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" }}
                        className={`h-full ${style.bg} rounded-full`}
                    />
                </div>
            )}
        </motion.div>
    );
};
