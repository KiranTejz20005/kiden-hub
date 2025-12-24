import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
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
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Extend window type for Spotify SDK
declare global {
  interface Window {
    Spotify: {
      Player: new (config: SpotifyPlayerConfig) => SpotifyPlayerInstance;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayerConfig {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume: number;
}

interface SpotifyPlayerInstance {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (state: unknown) => void) => void;
  removeListener: (event: string) => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  setName: (name: string) => void;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  activateElement: () => Promise<void>;
}

interface SpotifyPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeat_mode: number;
  track_window: {
    current_track: {
      id: string;
      name: string;
      uri: string;
      artists: { name: string }[];
      album: {
        name: string;
        images: { url: string }[];
      };
      duration_ms: number;
    };
    next_tracks: unknown[];
    previous_tracks: unknown[];
  };
}

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  uri: string;
  images: { url: string }[];
  tracks: { total: number };
}

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

const SPOTIFY_STORAGE_KEY = 'spotify_tokens';

export const SpotifyPlayer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [view, setView] = useState<'playlists' | 'tracks'>('playlists');
  const [userProfile, setUserProfile] = useState<{ display_name: string; images: { url: string }[]; product?: string } | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousVolumeRef = useRef(0.5);

  // Load tokens from storage
  useEffect(() => {
    const storedTokens = localStorage.getItem(SPOTIFY_STORAGE_KEY);
    if (storedTokens) {
      const parsed = JSON.parse(storedTokens);
      if (parsed.expires_at > Date.now()) {
        setTokens(parsed);
        setIsConnected(true);
      } else {
        refreshAccessToken(parsed.refresh_token);
      }
    }
    setIsLoading(false);
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'spotify_auth') {
      exchangeCodeForTokens(code);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!isConnected || !tokens || !isPremium) return;

    const initializePlayer = () => {
      if (!window.Spotify) {
        console.log('Spotify SDK not loaded yet');
        return;
      }

      const player = new window.Spotify.Player({
        name: 'Kiden Music Player',
        getOAuthToken: (cb) => {
          cb(tokens.access_token);
        },
        volume: volume
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify player ready with device ID:', device_id);
        setDeviceId(device_id);
        setSdkReady(true);
        toast.success('Spotify player ready!');
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline:', device_id);
        setDeviceId(null);
        setSdkReady(false);
      });

      player.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
        if (!state) return;
        
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);
        setShuffle(state.shuffle);
        setRepeatMode(state.repeat_mode);

        if (state.track_window?.current_track) {
          const track = state.track_window.current_track;
          setCurrentTrack({
            id: track.id,
            name: track.name,
            uri: track.uri,
            artists: track.artists,
            album: track.album,
            duration_ms: track.duration_ms,
            preview_url: null,
            external_urls: { spotify: `https://open.spotify.com/track/${track.id}` }
          });
        }
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('Failed to initialize:', message);
        toast.error('Failed to initialize Spotify player');
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
        refreshAccessToken(tokens.refresh_token);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Account error:', message);
        toast.error('Spotify Premium required for full playback');
        setIsPremium(false);
      });

      player.connect().then((success) => {
        if (success) {
          console.log('Successfully connected to Spotify');
        }
      });

      playerRef.current = player;
    };

    if (window.Spotify) {
      initializePlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [isConnected, tokens, isPremium]);

  // Position tracking
  useEffect(() => {
    if (isPlaying && sdkReady) {
      positionIntervalRef.current = setInterval(() => {
        setPosition(prev => Math.min(prev + 1000, duration));
      }, 1000);
    } else {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [isPlaying, sdkReady, duration]);

  // Fetch playlists when connected
  useEffect(() => {
    if (isConnected && tokens) {
      fetchUserProfile();
      fetchPlaylists();
    }
  }, [isConnected, tokens]);

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'refreshToken', refreshToken }
      });

      if (error || data.error) {
        console.error('Token refresh failed:', error || data.error);
        handleDisconnect();
        return;
      }

      const newTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_at: Date.now() + (data.expires_in * 1000)
      };

      localStorage.setItem(SPOTIFY_STORAGE_KEY, JSON.stringify(newTokens));
      setTokens(newTokens);
      setIsConnected(true);
    } catch (err) {
      console.error('Token refresh error:', err);
      handleDisconnect();
    }
  };

  const exchangeCodeForTokens = async (code: string) => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'exchangeCode', code, redirectUri }
      });

      if (error || data.error) {
        throw new Error(data?.error || error?.message || 'Token exchange failed');
      }

      const newTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000)
      };

      localStorage.setItem(SPOTIFY_STORAGE_KEY, JSON.stringify(newTokens));
      setTokens(newTokens);
      setIsConnected(true);
      toast.success('Connected to Spotify!');
    } catch (err) {
      console.error('Token exchange error:', err);
      toast.error('Failed to connect to Spotify');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'getAuthUrl', redirectUri }
      });

      if (error || data.error) {
        throw new Error(data?.error || error?.message || 'Failed to get auth URL');
      }

      const authUrl = data.authUrl + '&state=spotify_auth';
      window.location.href = authUrl;
    } catch (err) {
      console.error('Connect error:', err);
      toast.error('Failed to connect to Spotify');
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem(SPOTIFY_STORAGE_KEY);
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
    }
    setTokens(null);
    setIsConnected(false);
    setPlaylists([]);
    setTracks([]);
    setCurrentTrack(null);
    setSelectedPlaylist(null);
    setUserProfile(null);
    setDeviceId(null);
    setSdkReady(false);
    toast.success('Disconnected from Spotify');
  };

  const fetchUserProfile = async () => {
    if (!tokens) return;

    try {
      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'getProfile', accessToken: tokens.access_token }
      });

      if (error || data.error) {
        if (data?.error?.includes('expired')) {
          await refreshAccessToken(tokens.refresh_token);
        }
        return;
      }

      setUserProfile(data);
      setIsPremium(data.product === 'premium');
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const fetchPlaylists = async () => {
    if (!tokens) return;

    try {
      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'getPlaylists', accessToken: tokens.access_token }
      });

      if (error || data.error) {
        if (data?.error?.includes('expired')) {
          await refreshAccessToken(tokens.refresh_token);
        }
        return;
      }

      setPlaylists(data.items || []);
    } catch (err) {
      console.error('Playlists fetch error:', err);
    }
  };

  const fetchPlaylistTracks = async (playlist: SpotifyPlaylist) => {
    if (!tokens) return;

    setSelectedPlaylist(playlist);
    setView('tracks');

    try {
      const { data, error } = await supabase.functions.invoke('spotify-api', {
        body: { action: 'getPlaylistTracks', accessToken: tokens.access_token, playlistId: playlist.id }
      });

      if (error || data.error) {
        toast.error('Failed to load tracks');
        return;
      }

      const trackItems = data.items
        ?.map((item: { track: SpotifyTrack }) => item.track)
        .filter((track: SpotifyTrack) => track && track.id) || [];
      
      setTracks(trackItems);
    } catch (err) {
      console.error('Tracks fetch error:', err);
      toast.error('Failed to load tracks');
    }
  };

  const playTrack = useCallback(async (track: SpotifyTrack, contextUri?: string) => {
    if (!tokens) return;

    // If premium and SDK is ready, use Web Playback
    if (isPremium && sdkReady && deviceId) {
      try {
        const body: { device_id: string; uris?: string[]; context_uri?: string; offset?: { uri: string } } = {
          device_id: deviceId,
        };

        if (contextUri) {
          body.context_uri = contextUri;
          body.offset = { uri: track.uri || `spotify:track:${track.id}` };
        } else {
          body.uris = [track.uri || `spotify:track:${track.id}`];
        }

        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Playback failed');
        }

        setCurrentTrack(track);
        setIsPlaying(true);
      } catch (err) {
        console.error('Playback error:', err);
        toast.error('Failed to play track. Make sure Spotify is active.');
      }
    } else {
      // Fallback to preview URL for non-premium users
      if (!track.preview_url) {
        toast.error('Preview not available. Spotify Premium required for full playback.');
        window.open(track.external_urls.spotify, '_blank');
        return;
      }

      // Create audio element for preview
      const audio = new Audio(track.preview_url);
      audio.volume = volume;
      audio.play();
      setCurrentTrack(track);
      setIsPlaying(true);
      setDuration(30000); // Preview is 30 seconds

      audio.onended = () => {
        setIsPlaying(false);
        const currentIndex = tracks.findIndex(t => t.id === track.id);
        if (currentIndex < tracks.length - 1) {
          playTrack(tracks[currentIndex + 1]);
        }
      };
    }
  }, [tokens, isPremium, sdkReady, deviceId, tracks, volume]);

  const togglePlayPause = async () => {
    if (isPremium && playerRef.current) {
      await playerRef.current.togglePlay();
    }
    setIsPlaying(!isPlaying);
  };

  const skipNext = async () => {
    if (isPremium && playerRef.current) {
      await playerRef.current.nextTrack();
    } else if (currentTrack) {
      const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
      if (currentIndex < tracks.length - 1) {
        playTrack(tracks[currentIndex + 1]);
      }
    }
  };

  const skipPrevious = async () => {
    if (isPremium && playerRef.current) {
      await playerRef.current.previousTrack();
    } else if (currentTrack) {
      const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
      if (currentIndex > 0) {
        playTrack(tracks[currentIndex - 1]);
      }
    }
  };

  const handleSeek = async (value: number[]) => {
    const newPosition = value[0];
    setPosition(newPosition);
    
    if (isPremium && playerRef.current) {
      await playerRef.current.seek(newPosition);
    }
  };

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0];
    setVolumeState(newVolume);
    setIsMuted(newVolume === 0);
    
    if (isPremium && playerRef.current) {
      await playerRef.current.setVolume(newVolume);
    }
  };

  const toggleMute = async () => {
    if (isMuted) {
      setVolumeState(previousVolumeRef.current);
      setIsMuted(false);
      if (playerRef.current) await playerRef.current.setVolume(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setVolumeState(0);
      setIsMuted(true);
      if (playerRef.current) await playerRef.current.setVolume(0);
    }
  };

  const toggleShuffle = async () => {
    if (!tokens || !isPremium) return;
    
    try {
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${!shuffle}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      setShuffle(!shuffle);
    } catch (err) {
      console.error('Shuffle toggle error:', err);
    }
  };

  const toggleRepeat = async () => {
    if (!tokens || !isPremium) return;
    
    const modes = ['off', 'context', 'track'];
    const nextMode = (repeatMode + 1) % 3;
    
    try {
      await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${modes[nextMode]}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      setRepeatMode(nextMode);
    } catch (err) {
      console.error('Repeat toggle error:', err);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
    <div className="h-full flex flex-col p-4 md:p-6 space-y-4">
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

      {/* Navigation */}
      {selectedPlaylist && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setView('playlists');
              setSelectedPlaylist(null);
              setTracks([]);
            }}
          >
            <ListMusic className="w-4 h-4 mr-2" />
            Back to Playlists
          </Button>
        </motion.div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'playlists' ? (
            <motion.div
              key="playlists"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {playlists.map((playlist, index) => (
                <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="cursor-pointer overflow-hidden group hover:shadow-lg transition-all"
                    onClick={() => fetchPlaylistTracks(playlist)}
                  >
                    <div className="aspect-square relative bg-secondary">
                      {playlist.images?.[0]?.url ? (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ListMusic className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-foreground truncate">{playlist.name}</p>
                      <p className="text-xs text-muted-foreground">{playlist.tracks.total} tracks</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="tracks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              {selectedPlaylist && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {selectedPlaylist.images?.[0]?.url ? (
                      <img
                        src={selectedPlaylist.images[0].url}
                        alt={selectedPlaylist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ListMusic className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedPlaylist.name}</h2>
                    <p className="text-sm text-muted-foreground">{tracks.length} tracks</p>
                    {isPremium && sdkReady && (
                      <Button
                        size="sm"
                        className="mt-2 bg-green-500 hover:bg-green-600"
                        onClick={() => tracks[0] && playTrack(tracks[0], selectedPlaylist.uri)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Play All
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => playTrack(track, selectedPlaylist?.uri)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                    currentTrack?.id === track.id
                      ? "bg-green-500/20 border border-green-500/30"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className="w-12 h-12 rounded overflow-hidden bg-secondary flex-shrink-0 relative group">
                    {track.album.images?.[0]?.url ? (
                      <img
                        src={track.album.images[0].url}
                        alt={track.album.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {currentTrack?.id === track.id && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-green-500 rounded"
                              animate={{ height: [8, 16, 8] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artists.map(a => a.name).join(', ')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs">{formatTime(track.duration_ms)}</span>
                    {!isPremium && !track.preview_url && (
                      <ExternalLink className="w-4 h-4" />
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Player Controls */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-card border border-border rounded-xl p-4 shadow-xl space-y-3"
          >
            {/* Track Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                {currentTrack.album.images?.[0]?.url && (
                  <img
                    src={currentTrack.album.images[0].url}
                    alt={currentTrack.album.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{currentTrack.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentTrack.artists.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {isPremium && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {formatTime(position)}
                </span>
                <Slider
                  value={[position]}
                  max={duration}
                  step={1000}
                  onValueChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10">
                  {formatTime(duration)}
                </span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {isPremium && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleShuffle}
                      className={cn("h-8 w-8", shuffle && "text-green-500")}
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipPrevious}
                  className="h-10 w-10"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={togglePlayPause}
                  size="icon"
                  className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipNext}
                  className="h-10 w-10"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {isPremium && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleRepeat}
                    className={cn("h-8 w-8", repeatMode > 0 && "text-green-500")}
                  >
                    <Repeat className="w-4 h-4" />
                    {repeatMode === 2 && (
                      <span className="absolute text-[8px] font-bold">1</span>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8"
                >
                  {isMuted ? (
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
                  className="w-20"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
