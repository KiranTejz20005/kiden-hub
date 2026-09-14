import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, defaultValue, min = 0, max = 100, step = 1, onValueChange, className, disabled }, ref) => {
    const currentValue = value ? value[0] : (defaultValue ? defaultValue[0] : min);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (onValueChange) {
        onValueChange([val]);
      }
    };

    const percentage = Math.max(0, Math.min(100, ((currentValue - min) / (max - min)) * 100));

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-violet-600 dark:accent-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
          style={{
            background: `linear-gradient(to right, rgb(139, 92, 246) ${percentage}%, var(--muted, rgba(120, 120, 120, 0.2)) ${percentage}%)`
          }}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
