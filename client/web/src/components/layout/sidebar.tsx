'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, X, Home, Settings, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/content', label: 'Content', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-screen w-64 border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out lg:static lg:top-0 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <nav className="space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-foreground hover:bg-accent"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
