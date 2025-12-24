import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { useSpotify, SpotifyTrack, SpotifyPlaylist } from '@/hooks/useSpotify';
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  LogIn,
  LogOut,
  Loader2,
  ExternalLink,
  Shuffle,
  Repeat,
  Crown,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const SpotifyPlayer = () => {
  const {
    isConnected,
    isLoading,
    isPremium,
    sdkReady,
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    playlists,
    tracks,
    selectedPlaylist,
    userProfile,
    handleConnect,
    handleDisconnect,
    fetchPlaylistTracks,
    playTrack,
    togglePlayPause,
    skipNext,
    skipPrevious,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setView,
    view,
    formatTime,
  } = useSpotify();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Connect to Spotify</h2>
          <p className="text-muted-foreground max-w-md">
            Link your Spotify account to access your playlists and play music while you work.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span>Spotify Premium enables full song playback</span>
          </div>
          <Button
            onClick={handleConnect}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Connect Spotify
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 space-y-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            {userProfile?.images?.[0]?.url ? (
              <img src={userProfile.images[0].url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Music className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Spotify</h1>
              {isPremium && (
                <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{userProfile?.display_name || 'Connected'}</p>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </motion.div>

      {/* SDK Status */}
      {isPremium && !sdkReady && isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Initializing Spotify player...</span>
        </motion.div>
      )}

      {/* Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Playlists / Tracks List */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {view === 'playlists' ? (
              <motion.div
                key="playlists"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 min-h-0"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ListMusic className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Your Playlists</h2>
                </div>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
                    {playlists.map((playlist) => (
                      <motion.div
                        key={playlist.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                          onClick={() => fetchPlaylistTracks(playlist)}
                        >
                          <div className="flex items-center gap-3">
                            {playlist.images[0]?.url ? (
                              <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                <Music className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{playlist.name}</p>
                              <p className="text-xs text-muted-foreground">{playlist.tracks.total} tracks</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            ) : (
              <motion.div
                key="tracks"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 min-h-0"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView('playlists')}
                    className="mr-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  {selectedPlaylist?.images[0]?.url && (
                    <img
                      src={selectedPlaylist.images[0].url}
                      alt=""
                      className="w-8 h-8 rounded"
                    />
                  )}
                  <h2 className="text-lg font-semibold truncate">{selectedPlaylist?.name}</h2>
                </div>
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-1 pr-4">
                    {tracks.map((track, index) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Card
                          className={cn(
                            "p-3 cursor-pointer transition-colors",
                            currentTrack?.id === track.id
                              ? "bg-primary/10 border-primary/30"
                              : "hover:bg-secondary/50"
                          )}
                          onClick={() => playTrack(track, selectedPlaylist?.uri)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 text-center text-sm text-muted-foreground">
                              {currentTrack?.id === track.id && isPlaying ? (
                                <div className="flex items-center justify-center gap-0.5">
                                  <span className="w-1 h-3 bg-green-500 rounded animate-pulse" />
                                  <span className="w-1 h-4 bg-green-500 rounded animate-pulse delay-75" />
                                  <span className="w-1 h-2 bg-green-500 rounded animate-pulse delay-150" />
                                </div>
                              ) : (
                                index + 1
                              )}
                            </div>
                            {track.album.images[0]?.url ? (
                              <img
                                src={track.album.images[0].url}
                                alt=""
                                className="w-10 h-10 rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Music className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium truncate",
                                currentTrack?.id === track.id && "text-green-500"
                              )}>
                                {track.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {track.artists.map(a => a.name).join(', ')}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(track.duration_ms)}
                            </div>
                            {!isPremium && !track.preview_url && (
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Now Playing Panel */}
        <div className="lg:col-span-1">
          <Card className="p-4 h-full">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Now Playing</h3>
            
            {currentTrack ? (
              <div className="space-y-4">
                <motion.div
                  key={currentTrack.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  {currentTrack.album.images[0]?.url ? (
                    <img
                      src={currentTrack.album.images[0].url}
                      alt={currentTrack.album.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>

                <div className="text-center">
                  <p className="font-semibold truncate">{currentTrack.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {currentTrack.artists.map(a => a.name).join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {currentTrack.album.name}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[position]}
                    max={duration || 100}
                    step={1000}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(position)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-2">
                  {isPremium && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8", shuffle && "text-green-500")}
                      onClick={toggleShuffle}
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={skipPrevious}
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={skipNext}
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  
                  {isPremium && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8",
                        repeatMode > 0 && "text-green-500"
                      )}
                      onClick={toggleRepeat}
                    >
                      <Repeat className="w-4 h-4" />
                      {repeatMode === 2 && (
                        <span className="absolute text-[8px] font-bold">1</span>
                      )}
                    </Button>
                  )}
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="flex-1"
                  />
                </div>

                {!isPremium && (
                  <p className="text-xs text-center text-muted-foreground">
                    Playing 30-second previews. Upgrade to Premium for full tracks.
                  </p>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <Music className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a track to play</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
