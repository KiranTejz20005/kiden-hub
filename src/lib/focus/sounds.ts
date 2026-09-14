// Alert sounds using Web Audio API
export function playAlertSound(type: string = 'bell') {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  switch (type) {
    case 'bell':
      osc.frequency.value = 830;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
      break;
    case 'digital':
      osc.frequency.value = 1200;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      break;
    case 'chime':
      osc.frequency.value = 523;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
      osc.start();
      osc.stop(ctx.currentTime + 2);
      break;
    case 'ping':
      osc.frequency.value = 1500;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      break;
    default:
      osc.frequency.value = 830;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
  }
}

export const ALERT_SOUNDS = [
  { id: 'bell', label: 'Bell' },
  { id: 'digital', label: 'Digital' },
  { id: 'chime', label: 'Chime' },
  { id: 'ping', label: 'Soft Ping' },
];

let sharedAudioCtx: AudioContext | null = null;
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

export function playTickSound(type: 'digital' | 'mechanical', volume: number = 0.5, isTock: boolean = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'digital') {
      osc.frequency.value = isTock ? 1800 : 2000;
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'mechanical') {
      osc.frequency.value = isTock ? 400 : 600;
      osc.type = 'triangle';
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.value = isTock ? 1200 : 1500;
      osc2.type = 'sine';
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      gain2.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.06);
    }
  } catch (e) {
    console.error('Failed to play ticking sound', e);
  }
}
