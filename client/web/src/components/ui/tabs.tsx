import React from 'react';

export const Tabs: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`tabs ${className}`}>{children}</div>
);

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex space-x-1 ${className}`}>{children}</div>
);

export const TabsTrigger: React.FC<{ children: React.ReactNode; value: string; className?: string }> = ({ children, className = '' }) => (
  <button className={`px-3 py-2 text-sm font-medium rounded ${className}`}>{children}</button>
);

export const TabsContent: React.FC<{ children: React.ReactNode; value: string; className?: string }> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);