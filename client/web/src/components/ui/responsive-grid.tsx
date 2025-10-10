import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ResponsiveGridProps {
  children: ReactNode
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12'
}

export function ResponsiveGrid({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  gap = 'md',
  className
}: ResponsiveGridProps) {
  const classes = [
    'grid',
    gapClasses[gap]
  ]

  // Add responsive column classes
  if (columns.default) classes.push(columnClasses[columns.default as keyof typeof columnClasses])
  if (columns.sm) classes.push(`sm:${columnClasses[columns.sm as keyof typeof columnClasses]}`)
  if (columns.md) classes.push(`md:${columnClasses[columns.md as keyof typeof columnClasses]}`)
  if (columns.lg) classes.push(`lg:${columnClasses[columns.lg as keyof typeof columnClasses]}`)
  if (columns.xl) classes.push(`xl:${columnClasses[columns.xl as keyof typeof columnClasses]}`)

  return (
    <div className={cn(classes, className)}>
      {children}
    </div>
  )
}