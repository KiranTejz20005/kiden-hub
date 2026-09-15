import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import { ALERT_SOUNDS, playAlertSound } from '@/lib/focus/sounds';
import { FocusSettings } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FocusSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FocusSettings;
  onSaveSettings: (settings: FocusSettings) => void;
  selectedAlertSound: string;
  onSelectAlertSound: (sound: string) => void;
}

export const FocusSettingsModal: React.FC<FocusSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  selectedAlertSound,
  onSelectAlertSound,
}) => {
  const [localSettings, setLocalSettings] = React.useState<FocusSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const timerRows = [
    { key: 'workDuration' as keyof FocusSettings, label: 'Focus Duration', min: 1, max: 120, unit: 'min' },
    { key: 'shortBreakDuration' as keyof FocusSettings, label: 'Short Break', min: 1, max: 30, unit: 'min' },
    { key: 'longBreakDuration' as keyof FocusSettings, label: 'Long Break', min: 5, max: 60, unit: 'min' },
    { key: 'sessionsBeforeLongBreak' as keyof FocusSettings, label: 'Long Break Interval', min: 2, max: 10, unit: 'sessions' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-[#101018]/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl p-6 text-white space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight">Focus Timer Settings</h2>
              <p className="text-xs text-white/50">Customise intervals and audio notifications</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Durations */}
          <div className="space-y-3">
            {timerRows.map(({ key, label, min, max, unit }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-xs text-white/80 font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLocalSettings((s) => ({ ...s, [key]: Math.max(min, s[key] - 1) }))}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center text-xs transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-xs font-mono font-bold text-violet-300">
                    {localSettings[key]} {unit === 'min' ? 'm' : ''}
                  </span>
                  <button
                    onClick={() => setLocalSettings((s) => ({ ...s, [key]: Math.min(max, s[key] + 1) }))}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center text-xs transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Alert Sounds */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <span className="text-xs text-white/80 font-medium">Session Complete Chime</span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {ALERT_SOUNDS.map((sound) => {
                const isSelected = selectedAlertSound === sound.id;
                return (
                  <button
                    key={sound.id}
                    onClick={() => {
                      onSelectAlertSound(sound.id);
                      playAlertSound(sound.id);
                    }}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                      isSelected
                        ? "bg-violet-600/30 border-violet-500 text-white shadow-sm"
                        : "bg-white/[0.03] border-white/5 text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span>{sound.label}</span>
                    <Play className="w-2.5 h-2.5 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all"
            >
              Apply Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
