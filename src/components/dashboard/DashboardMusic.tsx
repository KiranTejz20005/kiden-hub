import { motion } from 'framer-motion';
import { useSpotify } from '@/hooks/useSpotify';
import { Play, Pause, SkipBack, SkipForward, Music2, Volume2, VolumeX, ListMusic } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

export const DashboardMusic = () => {
    const {
        isConnected,
        currentTrack,
        isPlaying,
        togglePlayPause,
        skipNext,
        skipPrevious,
        handleConnect,
        progress = 0, // Assuming context provides progress in ms/percent
        duration = 1
    } = useSpotify();

    const [volumeOpen, setVolumeOpen] = useState(false);

    // Fallback UI if not connected
    if (!isConnected) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full min-h-[220px] bg-[#161B22] rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="w-14 h-14 rounded-full bg-[#0D1117] border border-white/10 flex items-center justify-center mb-4 text-green-500 shadow-xl shadow-green-900/10">
                    <Music2 className="w-6 h-6" />
                </div>
                <h3 className="text-white font-semibold mb-2">My Focus Mix</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-[200px]">Connect Spotify to sync your workflow with your favorite tunes.</p>
                <button
                    onClick={handleConnect}
                    className="relative z-10 px-6 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-all shadow-lg shadow-green-500/20 active:scale-95 text-sm"
                >
                    Connect Spotify
                </button>
            </motion.div>
        )
    }

    const percentage = (progress / duration) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="h-full min-h-[220px] bg-[#161B22] rounded-2xl border border-white/5 relative overflow-hidden flex flex-col"
        >
            {/* Ambient Background */}
            {currentTrack?.album?.images?.[0]?.url && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-150 transition-all duration-[2s]"
                    style={{ backgroundImage: `url(${currentTrack.album.images[0].url})` }}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[#161B22]/80 via-[#161B22]/90 to-[#161B22]" />

            <div className="relative z-10 p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-auto">
                    <div className="flex gap-4 items-center">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 group">
                            {currentTrack?.album?.images?.[0]?.url ? (
                                <img
                                    src={currentTrack.album.images[0].url}
                                    alt="Album Art"
                                    className={`w-full h-full object-cover transition-transform duration-[10s] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`}
                                />
                            ) : (
                                <div className="w-full h-full bg-[#0D1117] flex items-center justify-center text-gray-600">
                                    <Music2 className="w-8 h-8" />
                                </div>
                            )}
                            {/* Equalizer overlay when playing */}
                            {isPlaying && (
                                <div className="absolute inset-0 bg-black/40 flex items-end justify-center gap-1 pb-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-1 bg-green-500 rounded-full animate-bounce" style={{ height: '40%', animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-white font-bold leading-tight truncate pr-4 text-lg">
                                {currentTrack?.name || 'Not Playing'}
                            </h3>
                            <p className="text-sm text-gray-400 truncate mt-1">
                                {currentTrack?.artists?.map(a => a.name).join(', ') || 'Choose a track'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono tracking-wider">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                            layoutId="progressBar"
                        />
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <button className="text-gray-400 hover:text-white transition-colors p-2 text-xs flex items-center gap-2 bg-white/5 rounded-full px-3">
                        <ListMusic className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Queue</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <button onClick={skipPrevious} className="text-gray-400 hover:text-white transition-colors">
                            <SkipBack className="w-5 h-5 fill-current" />
                        </button>
                        <button
                            onClick={togglePlayPause}
                            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                        </button>
                        <button onClick={skipNext} className="text-gray-400 hover:text-white transition-colors">
                            <SkipForward className="w-5 h-5 fill-current" />
                        </button>
                    </div>

                    <button className="text-gray-400 hover:text-white transition-colors p-2">
                        <Volume2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// Helper
const formatTime = (ms?: number) => {
    if (!ms) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
