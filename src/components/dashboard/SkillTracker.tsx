import { motion } from 'framer-motion';
import { Target, Trophy, GitCommit, ChevronRight } from 'lucide-react';

interface SkillStats {
    easy: number;
    medium: number;
    hard: number;
    total: number;
    rank: number;
}

export const SkillTracker = ({ stats }: { stats: SkillStats }) => {
    // If no stats, show placeholder or zeros
    const { easy = 0, medium = 0, hard = 0, total = 0, rank = 0 } = stats;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-[#161B22] p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-full min-h-[220px]"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h4 className="text-white font-semibold flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        Skill Progress
                    </h4>
                    <p className="text-xs text-gray-500">LeetCode Problem Solving</p>
                </div>
                {rank > 0 ? (
                    <div className="bg-[#0D1117] border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-xs text-gray-400">Rank</span>
                        <span className="text-sm font-bold text-white font-mono">#{rank.toLocaleString()}</span>
                    </div>
                ) : (
                    <div className="bg-[#0D1117] border border-white/10 px-3 py-1.5 rounded-lg text-xs text-gray-400">
                        Unranked
                    </div>
                )}
            </div>

            <div className="flex items-end gap-4 mb-8">
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90">
                        {/* Back circle */}
                        <circle cx="40" cy="40" r="36" stroke="#21262D" strokeWidth="6" fill="none" />
                        {/* Progress circle (mock total) */}
                        <circle
                            cx="40" cy="40" r="36"
                            stroke="#EAB308" strokeWidth="6" fill="none"
                            strokeDasharray="226"
                            strokeDashoffset={226 - (226 * (total > 0 ? total % 100 : 0) / 100)} // Mock progress loop
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-bold text-white">{total}</span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest">Solved</span>
                    </div>
                </div>

                <div className="flex-1 space-y-3 pb-1">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 w-10">Easy</span>
                        <div className="flex-1 h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((easy / 20) * 100, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-white w-6 text-right">{easy}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 w-10">Medium</span>
                        <div className="flex-1 h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((medium / 20) * 100, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-white w-6 text-right">{medium}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 w-10">Hard</span>
                        <div className="flex-1 h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((hard / 10) * 100, 100)}%` }} />
                        </div>
                        <span className="text-[10px] text-white w-6 text-right">{hard}</span>
                    </div>
                </div>
            </div>

            <button className="w-full py-2.5 rounded-xl border border-white/5 bg-[#0D1117] hover:bg-[#21262D] hover:border-white/10 text-xs font-medium text-gray-300 transition-all flex items-center justify-center gap-2 group">
                Solve Daily Challenge <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
        </motion.div>
    );
};
