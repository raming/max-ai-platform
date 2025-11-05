import React from 'react';

export const Switch: React.FC<{ checked?: boolean; onCheckedChange?: (checked: boolean) => void; className?: string }> = ({ checked, onCheckedChange, className = '' }) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'} ${className}`}
    onClick={() => onCheckedChange?.(!checked)}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);