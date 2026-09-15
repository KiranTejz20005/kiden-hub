import { useState, useEffect } from 'react';
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

interface TimerRowConfig {
  key: keyof FocusSettings;
  label: string;
  min: number;
  max: number;
  unit: 'min' | 'sessions';
}

const TimerDurationInput = ({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: 'min' | 'sessions';
  onChange: (val: number) => void;
}) => {
  const [inputValue, setInputValue] = useState<string>(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(String(value));
    }
  }, [value, isFocused]);

  const commitValue = (valStr: string) => {
    const num = parseInt(valStr, 10);
    if (isNaN(num) || num < min) {
      onChange(min);
      setInputValue(String(min));
    } else if (num > max) {
      onChange(max);
      setInputValue(String(max));
    } else {
      onChange(num);
      setInputValue(String(num));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitValue(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue(inputValue);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleStep = (delta: number) => {
    const current = parseInt(inputValue, 10) || value;
    const next = Math.max(min, Math.min(max, current + delta));
    onChange(next);
    setInputValue(String(next));
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="space-y-0.5">
        <span className="text-xs text-white/90 font-medium block">{label}</span>
        <span className="text-[10px] text-white/40 font-mono">
          Range: {min}–{max} {unit === 'min' ? 'mins' : 'sessions'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold flex items-center justify-center text-sm transition-all cursor-pointer border border-white/5"
          title="Decrease"
        >
          −
        </button>

        {/* Direct Keyboard Editable Box */}
        <div
          className={cn(
            "flex items-center justify-center h-8 px-2 rounded-xl bg-black/40 border transition-all cursor-text",
            isFocused
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-black/70 shadow-sm"
              : "border-white/10 hover:border-white/25"
          )}
          title="Click to type number directly on your keyboard"
        >
          <input
            type="number"
            min={min}
            max={max}
            value={inputValue}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              e.target.select();
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-10 text-center text-xs font-mono font-bold text-emerald-400 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label={`${label} value`}
          />
          {unit === 'min' && (
            <span className="text-[11px] font-mono font-semibold text-emerald-400/70 select-none -ml-0.5">
              m
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleStep(1)}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold flex items-center justify-center text-sm transition-all cursor-pointer border border-white/5"
          title="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
};

export const FocusSettingsModal = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  selectedAlertSound,
  onSelectAlertSound,
}: FocusSettingsModalProps) => {
  const [localSettings, setLocalSettings] = useState<FocusSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const timerRows: TimerRowConfig[] = [
    { key: 'workDuration', label: 'Focus Duration', min: 1, max: 120, unit: 'min' },
    { key: 'shortBreakDuration', label: 'Short Break', min: 1, max: 30, unit: 'min' },
    { key: 'longBreakDuration', label: 'Long Break', min: 5, max: 60, unit: 'min' },
    { key: 'sessionsBeforeLongBreak', label: 'Long Break Interval', min: 2, max: 10, unit: 'sessions' },
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
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Durations */}
          <div className="space-y-3">
            {timerRows.map(({ key, label, min, max, unit }) => (
              <TimerDurationInput
                key={key}
                label={label}
                value={localSettings[key]}
                min={min}
                max={max}
                unit={unit}
                onChange={(newVal) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    [key]: newVal,
                  }))
                }
              />
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
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm"
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
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Apply Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
