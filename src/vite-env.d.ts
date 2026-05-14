/// <reference types="vite/client" />

// Spotify Web Playback SDK types
interface Window {
  onSpotifyWebPlaybackSDKReady?: () => void;
  Spotify?: any;
}
