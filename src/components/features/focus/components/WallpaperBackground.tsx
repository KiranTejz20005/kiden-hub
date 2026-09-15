import React from 'react';
import { WALLPAPERS, Wallpaper } from '@/lib/focus/wallpapers';

interface WallpaperBackgroundProps {
  wallpaperId: string;
  customUrl?: string;
  blur: number;
  opacity: number;
}

export const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({
  wallpaperId,
  customUrl,
  blur,
  opacity,
}) => {
  const wallpaper: Wallpaper | undefined = WALLPAPERS.find((w) => w.id === wallpaperId);
  const activeUrl = wallpaperId === 'custom' ? customUrl : wallpaper?.url;
  const isVideo = wallpaper?.type === 'video';

  if (!activeUrl) {
    return (
      <div className="absolute inset-0 z-0 bg-[#08080c] transition-colors duration-700" />
    );
  }

  return (
    <>
      {isVideo ? (
        <video
          key={activeUrl}
          className="absolute inset-0 z-0 w-full h-full object-cover transition-all duration-700 pointer-events-none"
          src={activeUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            filter: blur > 0 ? `blur(${blur}px)` : 'none',
            transform: blur > 0 ? 'scale(1.08)' : 'scale(1)',
          }}
        />
      ) : (
        <div
          key={activeUrl}
          className="absolute inset-0 z-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
          style={{
            backgroundImage: `url(${activeUrl})`,
            filter: blur > 0 ? `blur(${blur}px)` : 'none',
            transform: blur > 0 ? 'scale(1.08)' : 'scale(1)',
          }}
        />
      )}

      {/* Dimming overlay so all text and UI elements remain legible */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `rgba(0, 0, 0, ${Math.min(0.85, 0.35 + (opacity / 100) * 0.5)})`,
        }}
      />
    </>
  );
};
