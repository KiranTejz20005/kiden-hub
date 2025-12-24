import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export interface SpotifyTrack {
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

export interface SpotifyPlaylist {
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

interface SpotifyContextType {
  isConnected: boolean;
  isLoading: boolean;
  isPremium: boolean;
  sdkReady: boolean;
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: number;
  playlists: SpotifyPlaylist[];
  tracks: SpotifyTrack[];
  selectedPlaylist: SpotifyPlaylist | null;
  userProfile: { display_name: string; images: { url: string }[]; product?: string } | null;
  tokens: SpotifyTokens | null;
  deviceId: string | null;
  handleConnect: () => Promise<void>;
  handleDisconnect: () => void;
  fetchPlaylists: () => Promise<void>;
  fetchPlaylistTracks: (playlist: SpotifyPlaylist) => Promise<void>;
  playTrack: (track: SpotifyTrack, contextUri?: string) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  handleSeek: (value: number[]) => Promise<void>;
  handleVolumeChange: (value: number[]) => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
  setView: (view: 'playlists' | 'tracks') => void;
  view: 'playlists' | 'tracks';
  formatTime: (ms: number) => string;
}

const SpotifyContext = createContext<SpotifyContextType | null>(null);

const SPOTIFY_STORAGE_KEY = 'spotify_tokens';

export const SpotifyProvider = ({ children }: { children: ReactNode }) => {
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
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

    // Stop any existing preview audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

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
      audioRef.current = audio;
      setCurrentTrack(track);
      setIsPlaying(true);
      setDuration(30000); // Preview is 30 seconds
      setPosition(0);

      // Update position for preview
      const positionInterval = setInterval(() => {
        if (audio.currentTime) {
          setPosition(audio.currentTime * 1000);
        }
      }, 1000);

      audio.onended = () => {
        clearInterval(positionInterval);
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
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
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
    } else if (audioRef.current) {
      audioRef.current.currentTime = newPosition / 1000;
    }
  };

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0];
    setVolumeState(newVolume);
    setIsMuted(newVolume === 0);
    
    if (isPremium && playerRef.current) {
      await playerRef.current.setVolume(newVolume);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = async () => {
    if (isMuted) {
      setVolumeState(previousVolumeRef.current);
      setIsMuted(false);
      if (playerRef.current) await playerRef.current.setVolume(previousVolumeRef.current);
      if (audioRef.current) audioRef.current.volume = previousVolumeRef.current;
    } else {
      previousVolumeRef.current = volume;
      setVolumeState(0);
      setIsMuted(true);
      if (playerRef.current) await playerRef.current.setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
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

  return (
    <SpotifyContext.Provider
      value={{
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
        tokens,
        deviceId,
        handleConnect,
        handleDisconnect,
        fetchPlaylists,
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
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};
