import { Howl } from 'howler';

export interface AmbientSound {
  id: string;
  label: string;
  emoji: string;
  url: string;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: 'rain', label: 'Rain', emoji: '🌧️', url: 'https://cdn.freesound.org/previews/531/531947_6480071-lq.mp3' },
  { id: 'thunder', label: 'Thunder', emoji: '⛈️', url: 'https://cdn.freesound.org/previews/360/360328_4284968-lq.mp3' },
  { id: 'ocean', label: 'Ocean Waves', emoji: '🌊', url: 'https://cdn.freesound.org/previews/467/467539_5765668-lq.mp3' },
  { id: 'fire', label: 'Fireplace', emoji: '🔥', url: 'https://cdn.freesound.org/previews/499/499006_2105781-lq.mp3' },
  { id: 'forest', label: 'Forest', emoji: '🌲', url: 'https://cdn.freesound.org/previews/364/364929_1120584-lq.mp3' },
  { id: 'birds', label: 'Birds', emoji: '🐦', url: 'https://cdn.freesound.org/previews/531/531015_6480071-lq.mp3' },
  { id: 'wind', label: 'Wind', emoji: '💨', url: 'https://cdn.freesound.org/previews/561/561098_7546992-lq.mp3' },
  { id: 'cafe', label: 'Coffee Shop', emoji: '☕', url: 'https://cdn.freesound.org/previews/423/423623_5218286-lq.mp3' },
];

class AmbientSoundManager {
  private howls: Map<string, Howl> = new Map();

  play(soundId: string, volume: number = 0.5) {
    const sound = AMBIENT_SOUNDS.find((s) => s.id === soundId);
    if (!sound) return;

    let howl = this.howls.get(soundId);
    if (!howl) {
      howl = new Howl({
        src: [sound.url],
        loop: true,
        volume,
        html5: true,
      });
      this.howls.set(soundId, howl);
    }

    howl.volume(volume);
    if (!howl.playing()) {
      howl.play();
    }
  }

  setVolume(soundId: string, volume: number) {
    const howl = this.howls.get(soundId);
    if (howl) {
      howl.volume(volume);
      if (volume === 0 && howl.playing()) {
        howl.pause();
      } else if (volume > 0 && !howl.playing()) {
        howl.play();
      }
    } else if (volume > 0) {
      this.play(soundId, volume);
    }
  }

  stop(soundId: string) {
    const howl = this.howls.get(soundId);
    if (howl) {
      howl.stop();
    }
  }

  stopAll() {
    this.howls.forEach((howl) => howl.stop());
  }

  isPlaying(soundId: string): boolean {
    const howl = this.howls.get(soundId);
    return howl?.playing() ?? false;
  }
}

export const ambientManager = new AmbientSoundManager();
