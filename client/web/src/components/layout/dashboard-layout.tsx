'use client'

import { ReactNode } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { Footer } from './footer'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
  className?: string
  showSidebar?: boolean
}

export function DashboardLayout({
  children,
  className,
  showSidebar = true
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        {showSidebar && (
          <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
            <Sidebar className="flex-1" />
          </div>
        )}

        <main className={cn(
          'flex-1',
          showSidebar && 'lg:pl-64'
        )}>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}