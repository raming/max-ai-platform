import React from 'react';

export const Select: React.FC<{ children: React.ReactNode; onValueChange?: (value: string) => void; className?: string }> = ({ children, onValueChange, className = '' }) => (
  <select onChange={(e) => onValueChange?.(e.target.value)} className={`px-3 py-2 border border-gray-300 rounded-md ${className}`}>
    {children}
  </select>
);

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const SelectItem: React.FC<{ children: React.ReactNode; value: string }> = ({ children, value }) => (
  <option value={value}>{children}</option>
);

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative ${className}`}>{children}</div>
);

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <span className="text-gray-500">{placeholder}</span>
);