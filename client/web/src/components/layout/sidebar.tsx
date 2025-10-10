'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Home,
  Link as LinkIcon,
  BarChart3,
  CreditCard,
  Settings,
  Users,
  Shield,
  Database
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Connections', href: '/connections', icon: LinkIcon },
  { name: 'Usage', href: '/usage', icon: BarChart3 },
  { name: 'Billing', href: '/billing', icon: CreditCard },
]

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Security', href: '/admin/security', icon: Shield },
  { name: 'System', href: '/admin/system', icon: Database },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn('flex flex-col h-full bg-background border-r border-border', className)}>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Main
            </h3>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.name}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary text-secondary-foreground'
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              )
            })}
          </div>

          {/* Admin Navigation - conditionally shown */}
          <div className="space-y-1 pt-4">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </h3>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.name}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary text-secondary-foreground'
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          MaxAI Platform v1.0
        </div>
      </div>
    </div>
  )
}