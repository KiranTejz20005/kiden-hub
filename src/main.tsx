import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/hooks/useAuth";

// Define Spotify Web Playback SDK callback before it loads
// This prevents 'onSpotifyWebPlaybackSDKReady is not defined' errors
window.onSpotifyWebPlaybackSDKReady = () => {
  // Spotify SDK is ready - actual implementation handled by SpotifyProvider when enabled
  console.debug('[Spotify SDK] Playback SDK ready');
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
