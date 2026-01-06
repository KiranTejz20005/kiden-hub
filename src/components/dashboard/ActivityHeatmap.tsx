import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval, endOfYear, startOfYear, getDay } from 'date-fns';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActivityHeatmapProps {
    data: Record<string, number>;
}

export const ActivityHeatmap = ({ data }: ActivityHeatmapProps) => {
    // Generate grid data
    // We want to show a contribution graph similar to GitHub's
    // Columns: Weeks, Rows: Days (0=Sun, 6=Sat)

    const { days, weeks, totalActiveDays } = useMemo(() => {
        const today = new Date();
        const daysToShow = 146; // Approx 5 months (21 weeks)
        // Start date should be such that it aligns with columns. 
        // Simple approach: Just iterate back N days.

        const dates = Array.from({ length: daysToShow }).map((_, i) => {
            return subDays(today, daysToShow - 1 - i);
        });

        const activeCount = dates.filter(d => (data[format(d, 'yyyy-MM-dd')] || 0) > 0).length;

        return {
            days: dates,
            weeks: Math.ceil(daysToShow / 7),
            totalActiveDays: activeCount
        };
    }, [data]);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-[#161B22]'; // Empty
        if (count === 1) return 'bg-emerald-900/60';
        if (count <= 3) return 'bg-emerald-700/80';
        if (count <= 5) return 'bg-emerald-500';
        return 'bg-emerald-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[#161B22] p-6 rounded-2xl border border-white/5 flex flex-col h-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-white font-semibold text-lg">Consistency</h3>
                    <p className="text-sm text-gray-400">{totalActiveDays} active days in last 5 months</p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span>Less</span>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#161B22] border border-white/5" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900/60" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400" />
                    <span>More</span>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex items-center justify-center">
                <div className="grid grid-flow-col grid-rows-7 gap-1.5">
                    {/* Render cells. Order depends on flex dir or grid flow. 
                        grid-flow-col fills columns first (top-down), then moves right. 
                        This matches Date order perfectly if we map correctly.
                    */}
                    {days.map((date, i) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const dayName = format(date, 'EEEE');
                        const count = data[dateStr] || 0;

                        return (
                            <TooltipProvider key={dateStr} delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.002 }}
                                            className={`w-3 h-3 md:w-4 md:h-4 lg:w-3.5 lg:h-3.5 rounded-[2px] border border-white/5 transition-all hover:scale-125 hover:z-10 hover:border-white/20 ${getColor(count)}`}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-[#1C2128] border-white/10 text-xs">
                                        <p className="font-semibold text-white">{count} tasks</p>
                                        <p className="text-gray-400">{dateStr}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
