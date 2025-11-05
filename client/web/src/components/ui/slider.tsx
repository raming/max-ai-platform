import React from 'react';

export const Slider: React.FC<{ value?: number[]; onValueChange?: (value: number[]) => void; max?: number; min?: number; step?: number; className?: string }> = ({
  value = [50],
  onValueChange,
  max = 100,
  min = 0,
  step = 1,
  className = ''
}) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange?.([parseInt(e.target.value)])}
    className={`w-full ${className}`}
  />
);