import { createContext, useContext, useState, ReactNode } from 'react';

// Minimal types for useSpotify hook compatibility
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
  userProfile: any | null;
  tokens: any | null;
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

export const SpotifyProvider = ({ children }: { children: ReactNode }) => {
  // Disabled state
  const [isConnected] = useState(false);
  const [isLoading] = useState(false);
  const [playlists] = useState<SpotifyPlaylist[]>([]);
  const [tracks] = useState<SpotifyTrack[]>([]);
  const [currentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying] = useState(false);
  const [view, setView] = useState<'playlists' | 'tracks'>('playlists');

  const handleConnect = async () => {
    console.log('Spotify is currently disabled.');
  };

  const handleDisconnect = () => {};
  const fetchPlaylists = async () => {};
  const fetchPlaylistTracks = async () => {};
  const playTrack = async () => {};
  const togglePlayPause = async () => {};
  const skipNext = async () => {};
  const skipPrevious = async () => {};
  const handleSeek = async () => {};
  const handleVolumeChange = async () => {};
  const toggleMute = async () => {};
  const toggleShuffle = async () => {};
  const toggleRepeat = async () => {};
  
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
        isPremium: false,
        sdkReady: false,
        currentTrack,
        isPlaying,
        position: 0,
        duration: 0,
        volume: 0.5,
        isMuted: false,
        shuffle: false,
        repeatMode: 0,
        playlists,
        tracks,
        selectedPlaylist: null,
        userProfile: null,
        tokens: null,
        deviceId: null,
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
